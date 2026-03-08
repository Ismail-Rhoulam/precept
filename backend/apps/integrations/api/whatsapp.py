import json
import logging
from typing import Any, Dict, List, Optional

import requests
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.integrations.api.schemas import (
    WhatsAppMessageCreate,
    WhatsAppMessageOut,
    WhatsAppSendTemplateIn,
    WhatsAppSettingsCreate,
    WhatsAppSettingsOut,
    WhatsAppSettingsUpdate,
)
from apps.integrations.models import WhatsAppMessage, WhatsAppSettings
from apps.integrations.services.whatsapp_service import (
    handle_webhook,
    send_media_message,
    send_template_message,
    send_text_message,
    upload_media,
)

logger = logging.getLogger(__name__)

router = Router()

ENTITY_MODEL_MAP = {
    "lead": "crm.lead",
    "deal": "crm.deal",
}


def _get_content_type(entity_type: str):
    """Resolve a short entity name to a Django ContentType."""
    key = ENTITY_MODEL_MAP.get(entity_type)
    if not key:
        return None
    app_label, model = key.split(".")
    return ContentType.objects.get(app_label=app_label, model=model)


def _resolve_wa_account(company, to_number, account_id=None):
    """Resolve which WhatsApp account to use for sending.

    Priority:
    1. Explicit account_id (if provided)
    2. Most recent conversation history with to_number
    3. Company's default account (is_default=True)
    """
    if account_id:
        return get_object_or_404(
            WhatsAppSettings, pk=account_id, company=company, enabled=True
        )

    # Auto-select: find the account used in the most recent message to/from this number
    recent_msg = (
        WhatsAppMessage.objects.filter(company=company, whatsapp_account__isnull=False)
        .filter(Q(to_number=to_number) | Q(from_number=to_number))
        .select_related("whatsapp_account")
        .order_by("-created_at")
        .first()
    )
    if recent_msg and recent_msg.whatsapp_account and recent_msg.whatsapp_account.enabled:
        return recent_msg.whatsapp_account

    # Fallback: default account
    default = WhatsAppSettings.objects.filter(
        company=company, enabled=True, is_default=True
    ).first()
    if default:
        return default

    # Last resort: any enabled account
    any_account = WhatsAppSettings.objects.filter(company=company, enabled=True).first()
    if any_account:
        return any_account

    return None


# ---------------------------------------------------------------------------
# Settings (CRUD list)
# ---------------------------------------------------------------------------


@router.get("/settings", response=List[WhatsAppSettingsOut])
def list_whatsapp_settings(request):
    """List all WhatsApp accounts for the current tenant."""
    return list(WhatsAppSettings.objects.filter(company=request.company))


@router.post("/settings", response={201: WhatsAppSettingsOut})
def create_whatsapp_settings(request, payload: WhatsAppSettingsCreate):
    """Create a new WhatsApp account."""
    data = payload.dict(exclude_unset=True)
    data["company"] = request.company

    # If this is the first account, make it default
    if not WhatsAppSettings.objects.filter(company=request.company).exists():
        data["is_default"] = True

    settings = WhatsAppSettings.objects.create(**data)
    return 201, settings


@router.get("/settings/{account_id}", response=WhatsAppSettingsOut)
def get_whatsapp_settings(request, account_id: int):
    """Get a single WhatsApp account."""
    return get_object_or_404(WhatsAppSettings, pk=account_id, company=request.company)


@router.patch("/settings/{account_id}", response=WhatsAppSettingsOut)
def update_whatsapp_settings(request, account_id: int, payload: WhatsAppSettingsUpdate):
    """Update a WhatsApp account."""
    settings = get_object_or_404(WhatsAppSettings, pk=account_id, company=request.company)
    data = payload.dict(exclude_unset=True)

    with transaction.atomic():
        # If setting as default, unset other defaults
        if data.get("is_default"):
            WhatsAppSettings.objects.filter(company=request.company).exclude(
                pk=account_id
            ).update(is_default=False)

        for attr, value in data.items():
            setattr(settings, attr, value)
        settings.save()

    return settings


@router.delete("/settings/{account_id}", response={204: None})
def delete_whatsapp_settings(request, account_id: int):
    """Delete a WhatsApp account."""
    settings = get_object_or_404(WhatsAppSettings, pk=account_id, company=request.company)
    was_default = settings.is_default
    settings.delete()

    # If deleted account was default, promote another one
    if was_default:
        next_account = WhatsAppSettings.objects.filter(company=request.company).first()
        if next_account:
            next_account.is_default = True
            next_account.save(update_fields=["is_default"])

    return 204, None


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------


@router.get("/messages/{entity_type}/{entity_id}", response=Dict[str, Any])
def get_messages(
    request,
    entity_type: str,
    entity_id: int,
    page: int = 1,
    page_size: int = 20,
):
    """Get WhatsApp messages for a lead/deal."""
    ct = _get_content_type(entity_type)
    if not ct:
        return {"results": [], "total": 0, "page": page, "page_size": page_size}

    qs = WhatsAppMessage.objects.filter(
        content_type_fk=ct, object_id=entity_id
    ).select_related("content_type_fk")

    total = qs.count()
    offset = (page - 1) * page_size
    messages = qs[offset : offset + page_size]

    return {
        "results": [WhatsAppMessageOut.from_orm(m) for m in messages],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/conversations", response=Dict[str, Any])
def get_conversations(
    request,
    page: int = 1,
    page_size: int = 20,
    account_id: Optional[int] = None,
):
    """Get all WhatsApp conversations grouped by remote phone number."""
    qs = WhatsAppMessage.objects.filter(company=request.company)

    if account_id:
        wa_settings = get_object_or_404(
            WhatsAppSettings, pk=account_id, company=request.company
        )
        our_number = wa_settings.phone_number_id
        qs = qs.filter(whatsapp_account=wa_settings)
    else:
        # No account filter — use all accounts; determine "our number" per-message
        wa_settings = None
        our_number = ""

    # Collect all our phone numbers for identifying the remote side
    our_numbers = set(
        WhatsAppSettings.objects.filter(company=request.company)
        .values_list("phone_number_id", flat=True)
    )

    seen: Dict[str, dict] = {}
    for msg in qs.order_by("-created_at").select_related("content_type_fk", "whatsapp_account"):
        if account_id:
            remote = msg.to_number if msg.from_number == our_number else msg.from_number
        else:
            remote = (
                msg.to_number if msg.from_number in our_numbers else msg.from_number
            )
        if not remote:
            continue
        if remote not in seen:
            acct = msg.whatsapp_account
            seen[remote] = {
                "phone_number": remote,
                "last_message": WhatsAppMessageOut.from_orm(msg).dict(),
                "last_message_at": msg.created_at.isoformat(),
                "entity_type": None,
                "entity_id": None,
                "entity_name": None,
                "whatsapp_account_id": acct.id if acct else None,
                "whatsapp_account_name": (acct.display_name or acct.phone_number_id) if acct else None,
            }
            if msg.content_type_fk and msg.object_id:
                seen[remote]["entity_type"] = msg.content_type_fk.model
                seen[remote]["entity_id"] = msg.object_id
                try:
                    entity = msg.content_type_fk.get_object_for_this_type(pk=msg.object_id)
                    seen[remote]["entity_name"] = str(entity)
                except Exception:
                    pass

    conversations = sorted(seen.values(), key=lambda c: c["last_message_at"], reverse=True)
    total = len(conversations)
    offset = (page - 1) * page_size
    paginated = conversations[offset : offset + page_size]

    return {
        "results": paginated,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/conversations/{phone_number}/messages", response=Dict[str, Any])
def get_conversation_messages(
    request,
    phone_number: str,
    page: int = 1,
    page_size: int = 50,
    account_id: Optional[int] = None,
):
    """Get all messages for a specific phone number conversation."""
    qs = (
        WhatsAppMessage.objects.filter(company=request.company)
        .filter(Q(to_number=phone_number) | Q(from_number=phone_number))
        .select_related("content_type_fk")
        .order_by("created_at")
    )

    if account_id:
        qs = qs.filter(whatsapp_account_id=account_id)

    total = qs.count()
    offset = (page - 1) * page_size
    messages = qs[offset : offset + page_size]

    return {
        "results": [WhatsAppMessageOut.from_orm(m) for m in messages],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def _compress_animated_sticker(local_path, file_size):
    """Compress an animated WebP sticker to fit WhatsApp's 500KB limit.

    Uses webpmux/img2webp for proper frame-timing preservation.
    Returns the path to the compressed file, or None on failure.
    """
    import os
    import shutil
    import subprocess
    import tempfile

    if not shutil.which("webpmux") or not shutil.which("img2webp"):
        logger.warning("webp tools not installed, cannot compress animated sticker")
        return None

    try:
        # Get frame count
        info = subprocess.run(
            ["webpmux", "-info", local_path],
            capture_output=True, text=True, timeout=10,
        )
        frame_count = 0
        frame_duration = 33  # default ~30fps
        for line in info.stdout.splitlines():
            if "Number of frames" in line:
                frame_count = int(line.split()[-1])
            # Parse first frame duration from the frame table
            parts = line.strip().split()
            if len(parts) >= 8 and parts[0].isdigit() and frame_count and not frame_duration:
                frame_duration = int(parts[6]) if parts[6].isdigit() else 33

        if frame_count == 0:
            return None

        # Parse actual frame durations from the info table
        durations = []
        in_table = False
        for line in info.stdout.splitlines():
            if "duration" in line.lower() and "width" in line.lower():
                in_table = True
                continue
            if in_table:
                parts = line.strip().split()
                if len(parts) >= 7 and parts[0].isdigit():
                    durations.append(parts[6] if parts[6].isdigit() else "33")

        with tempfile.TemporaryDirectory() as tmpdir:
            # Extract all frames
            for i in range(1, frame_count + 1):
                subprocess.run(
                    ["webpmux", "-get", "frame", str(i), local_path,
                     "-o", f"{tmpdir}/f{i}.webp"],
                    capture_output=True, timeout=10,
                )

            # Try decreasing quality until under 500KB
            for quality in (50, 48, 45, 40, 35):
                cmd = ["img2webp", "-loop", "0", "-lossy", "-q", str(quality)]
                for i in range(1, frame_count + 1):
                    dur = durations[i - 1] if i - 1 < len(durations) else "33"
                    cmd.extend(["-d", dur, f"{tmpdir}/f{i}.webp"])

                out_path = local_path.rsplit(".", 1)[0] + "_compressed.webp"
                cmd.extend(["-o", out_path])

                subprocess.run(cmd, capture_output=True, timeout=60)

                if os.path.isfile(out_path) and os.path.getsize(out_path) <= 500_000:
                    logger.info(
                        "Compressed animated sticker from %dKB to %dKB (q=%d)",
                        file_size // 1024, os.path.getsize(out_path) // 1024, quality,
                    )
                    return out_path

        logger.warning("Could not compress animated sticker under 500KB")
        return None
    except Exception:
        logger.exception("Failed to compress animated sticker")
        return None


@router.post("/messages", response={201: WhatsAppMessageOut})
def send_message(request, payload: WhatsAppMessageCreate):
    """Send a WhatsApp message (text or media).

    For media messages set ``content_type`` to image/video/audio/document/sticker
    and provide ``media_url`` pointing to a local file under /media/ that was
    previously uploaded via the ``/upload`` endpoint.
    """
    wa_settings = _resolve_wa_account(request.company, payload.to_number, payload.account_id)
    if not wa_settings:
        return 400, {"error": "No enabled WhatsApp account found"}

    import mimetypes
    import os
    from django.conf import settings as django_settings

    media_types = ("image", "video", "audio", "document", "sticker")
    content_type = payload.content_type or "text"

    if content_type in media_types and payload.media_url:
        # Resolve local file path from /media/... URL
        local_path = os.path.join(
            django_settings.MEDIA_ROOT,
            payload.media_url.replace("/media/", "", 1),
        )
        if not os.path.isfile(local_path):
            return 400, {"error": "Media file not found"}

        mime = payload.mime_type or mimetypes.guess_type(local_path)[0] or "application/octet-stream"
        mime_base = mime.split(";")[0].strip()

        # Animated stickers must be ≤500KB for WhatsApp – compress if needed
        if content_type == "sticker" and mime_base == "image/webp":
            file_size = os.path.getsize(local_path)
            if file_size > 500_000:
                compressed = _compress_animated_sticker(local_path, file_size)
                if compressed:
                    local_path = compressed

        # WhatsApp rejects audio/webm – convert to OGG/Opus with ffmpeg
        if mime_base == "audio/webm" and content_type == "audio":
            import shutil
            import subprocess

            if shutil.which("ffmpeg"):
                ogg_path = local_path.rsplit(".", 1)[0] + ".ogg"
                try:
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", local_path, "-c:a", "libopus", "-b:a", "48k", ogg_path],
                        check=True, capture_output=True, timeout=30,
                    )
                    local_path = ogg_path
                    mime_base = "audio/ogg"
                except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
                    logger.warning("ffmpeg conversion failed: %s", exc)

        # Use "audio/ogg; codecs=opus" for OGG audio so WhatsApp renders
        # it as a voice note (with waveform) instead of a plain audio file.
        if mime_base == "audio/ogg" and content_type == "audio":
            mime_clean = "audio/ogg; codecs=opus"
        else:
            mime_clean = mime_base

        try:
            # Upload to WhatsApp
            wa_media_id = upload_media(wa_settings, local_path, mime_clean)
            if not wa_media_id:
                return 400, {"error": "Failed to upload media to WhatsApp"}

            result = send_media_message(
                wa_settings,
                payload.to_number,
                content_type,
                wa_media_id,
                caption=payload.content,
            )
        except requests.HTTPError as exc:
            detail = ""
            try:
                detail = exc.response.json().get("error", {}).get("message", str(exc))
            except Exception:
                detail = str(exc)
            logger.error("WhatsApp API error sending media: %s", detail)
            return 400, {"error": f"WhatsApp API error: {detail}"}
    else:
        # Plain text message
        try:
            result = send_text_message(wa_settings, payload.to_number, payload.content)
        except requests.HTTPError as exc:
            detail = ""
            try:
                detail = exc.response.json().get("error", {}).get("message", str(exc))
            except Exception:
                detail = str(exc)
            logger.error("WhatsApp API error sending text: %s", detail)
            return 400, {"error": f"WhatsApp API error: {detail}"}

    # Create message record
    msg_data = {
        "company": request.company,
        "whatsapp_account": wa_settings,
        "message_id": result.get("messages", [{}])[0].get("id", ""),
        "message_type": WhatsAppMessage.MessageType.OUTGOING,
        "from_number": wa_settings.phone_number_id,
        "to_number": payload.to_number,
        "content": payload.content,
        "content_type": content_type,
        "status": WhatsAppMessage.Status.SENT,
        "template_name": payload.template_name,
        "media_url": payload.media_url,
        "mime_type": payload.mime_type,
        "created_by": request.auth,
        "modified_by": request.auth,
    }

    if payload.reply_to_id:
        msg_data["reply_to_id"] = payload.reply_to_id

    if payload.entity_type and payload.entity_id:
        ct = _get_content_type(payload.entity_type)
        if ct:
            msg_data["content_type_fk"] = ct
            msg_data["object_id"] = payload.entity_id

    message = WhatsAppMessage.objects.create(**msg_data)
    message = WhatsAppMessage.objects.select_related("content_type_fk").get(
        pk=message.pk
    )
    return 201, message


@router.post("/send-template", response={201: WhatsAppMessageOut})
def send_template(request, payload: WhatsAppSendTemplateIn):
    """Send a WhatsApp template message."""
    wa_settings = _resolve_wa_account(request.company, payload.to_number, payload.account_id)
    if not wa_settings:
        return 400, {"error": "No enabled WhatsApp account found"}

    result = send_template_message(
        wa_settings, payload.to_number, payload.template_name, payload.language
    )

    msg_data = {
        "company": request.company,
        "whatsapp_account": wa_settings,
        "message_id": result.get("messages", [{}])[0].get("id", ""),
        "message_type": WhatsAppMessage.MessageType.OUTGOING,
        "from_number": wa_settings.phone_number_id,
        "to_number": payload.to_number,
        "content": "",
        "content_type": "template",
        "status": WhatsAppMessage.Status.SENT,
        "template_name": payload.template_name,
        "created_by": request.auth,
        "modified_by": request.auth,
    }

    if payload.entity_type and payload.entity_id:
        ct = _get_content_type(payload.entity_type)
        if ct:
            msg_data["content_type_fk"] = ct
            msg_data["object_id"] = payload.entity_id

    message = WhatsAppMessage.objects.create(**msg_data)
    message = WhatsAppMessage.objects.select_related("content_type_fk").get(
        pk=message.pk
    )
    return 201, message


# ---------------------------------------------------------------------------
# Media upload (for outbound media messages)
# ---------------------------------------------------------------------------


@router.post("/upload")
def upload_media_file(request):
    """Upload a media file for later sending via WhatsApp.

    Accepts multipart/form-data with a ``file`` field.
    Returns ``{ "media_url": "/media/whatsapp/...", "mime_type": "..." }``.
    """
    import os
    import uuid

    from django.conf import settings as django_settings

    # Just verify at least one enabled account exists
    if not WhatsAppSettings.objects.filter(company=request.company, enabled=True).exists():
        return 400, {"error": "No enabled WhatsApp account"}

    uploaded = request.FILES.get("file")
    if not uploaded:
        return 400, {"error": "No file provided"}

    mime_type = uploaded.content_type or "application/octet-stream"
    ext = os.path.splitext(uploaded.name)[1] if uploaded.name else ""
    if not ext:
        import mimetypes as _mt
        ext = _mt.guess_extension(mime_type) or ""

    media_dir = os.path.join(django_settings.MEDIA_ROOT, "whatsapp")
    os.makedirs(media_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(media_dir, filename)

    with open(filepath, "wb") as f:
        for chunk in uploaded.chunks():
            f.write(chunk)

    return {
        "media_url": f"/media/whatsapp/{filename}",
        "mime_type": mime_type,
        "filename": uploaded.name,
    }


# ---------------------------------------------------------------------------
# Media proxy
# ---------------------------------------------------------------------------


@router.get("/media/{message_id}", auth=None)
def get_media(request, message_id: int, token: str = ""):
    """Serve WhatsApp media files.

    Uses HMAC-signed token for auth since <img> tags can't send JWT headers.
    Local files are served directly; legacy Facebook URLs are proxied.
    """
    import hashlib as _hashlib
    import hmac as _hmac
    import mimetypes
    import os

    from django.conf import settings as django_settings

    # Verify the signed token
    secret = django_settings.SECRET_KEY
    expected = _hmac.new(
        secret.encode(), f"wa-media-{message_id}".encode(), _hashlib.sha256
    ).hexdigest()[:32]
    if not token or not _hmac.compare_digest(token, expected):
        return HttpResponse("Forbidden", status=403)

    msg = WhatsAppMessage.unscoped.filter(pk=message_id).first()
    if not msg or not msg.media_url:
        return HttpResponse("Not found", status=404)

    # Local file (stored during webhook)
    if msg.media_url.startswith("/media/"):
        filepath = os.path.join(
            django_settings.MEDIA_ROOT,
            msg.media_url.replace("/media/", "", 1),
        )
        if os.path.isfile(filepath):
            content_type = mimetypes.guess_type(filepath)[0] or "application/octet-stream"
            with open(filepath, "rb") as f:
                response = HttpResponse(f.read(), content_type=content_type)
                response["Cache-Control"] = "public, max-age=86400"
                return response
        return HttpResponse("File not found", status=404)

    # Legacy: proxy from Facebook URL — prefer the message's linked account
    wa_settings = None
    if msg.whatsapp_account_id:
        wa_settings = WhatsAppSettings.unscoped.filter(pk=msg.whatsapp_account_id).first()
    if not wa_settings:
        wa_settings = WhatsAppSettings.unscoped.filter(company=msg.company).first()
    if not wa_settings:
        return HttpResponse("Not configured", status=404)

    try:
        resp = requests.get(
            msg.media_url,
            headers={"Authorization": f"Bearer {wa_settings.access_token}"},
            timeout=30,
        )
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "application/octet-stream")
        response = HttpResponse(resp.content, content_type=content_type)
        response["Cache-Control"] = "private, max-age=86400"
        return response
    except Exception:
        logger.exception("Failed to proxy media for message %s", message_id)
        return HttpResponse("Media unavailable", status=410)


# ---------------------------------------------------------------------------
# Webhooks (no auth)
# ---------------------------------------------------------------------------


@router.get("/webhook", auth=None)
def whatsapp_webhook_verify(request):
    """
    WhatsApp webhook verification (GET with hub.verify_token).
    No JWT auth.
    """
    mode = request.GET.get("hub.mode", "")
    token = request.GET.get("hub.verify_token", "")
    challenge = request.GET.get("hub.challenge", "")

    if mode == "subscribe":
        # Find any WhatsApp settings with this verify token
        wa_settings = WhatsAppSettings.unscoped.filter(
            webhook_verify_token=token
        ).first()
        if wa_settings:
            return HttpResponse(challenge, content_type="text/plain")

    return HttpResponse("Forbidden", status=403, content_type="text/plain")


@router.post("/webhook", auth=None)
def whatsapp_webhook_receive(request):
    """
    WhatsApp incoming message webhook.
    No JWT auth.
    """
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return {"status": "error", "message": "Invalid JSON"}

    # Determine which WhatsApp settings this belongs to
    # Extract the phone_number_id from the payload
    phone_number_id = ""
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            metadata = value.get("metadata", {})
            phone_number_id = metadata.get("phone_number_id", "")
            if phone_number_id:
                break
        if phone_number_id:
            break

    wa_settings = None
    if phone_number_id:
        wa_settings = WhatsAppSettings.unscoped.filter(
            phone_number_id=phone_number_id, enabled=True
        ).first()

    if not wa_settings:
        logger.warning(
            "No WhatsApp account found for phone_number_id=%s, ignoring webhook",
            phone_number_id,
        )
        return {"status": "ok"}

    handle_webhook(payload, wa_settings)

    return {"status": "ok"}

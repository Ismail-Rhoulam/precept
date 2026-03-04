import json
import logging
from typing import Any, Dict, Optional

from django.contrib.contenttypes.models import ContentType
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
    send_template_message,
    send_text_message,
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


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


@router.get("/settings", response=WhatsAppSettingsOut)
def get_whatsapp_settings(request):
    """Get WhatsApp settings for the current tenant."""
    settings, _ = WhatsAppSettings.objects.get_or_create(
        company=request.company,
    )
    return settings


@router.post("/settings", response=WhatsAppSettingsOut)
def upsert_whatsapp_settings(request, payload: WhatsAppSettingsCreate):
    """Create or update WhatsApp settings (upsert)."""
    settings, created = WhatsAppSettings.objects.get_or_create(
        company=request.company,
    )
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(settings, attr, value)
    settings.save()
    return settings


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
def get_conversations(request, page: int = 1, page_size: int = 20):
    """Get all WhatsApp conversations grouped by remote phone number."""
    from django.db.models import Max, Q

    wa_settings = WhatsAppSettings.objects.filter(company=request.company).first()
    our_number = wa_settings.phone_number_id if wa_settings else ""

    qs = WhatsAppMessage.objects.filter(company=request.company)

    # Get all unique remote phone numbers with their latest message time
    seen: Dict[str, dict] = {}
    for msg in qs.order_by("-created_at").select_related("content_type_fk"):
        remote = msg.to_number if msg.from_number == our_number else msg.from_number
        if not remote:
            continue
        if remote not in seen:
            seen[remote] = {
                "phone_number": remote,
                "last_message": WhatsAppMessageOut.from_orm(msg).dict(),
                "last_message_at": msg.created_at.isoformat(),
                "entity_type": None,
                "entity_id": None,
                "entity_name": None,
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
):
    """Get all messages for a specific phone number conversation."""
    from django.db.models import Q

    qs = (
        WhatsAppMessage.objects.filter(company=request.company)
        .filter(Q(to_number=phone_number) | Q(from_number=phone_number))
        .select_related("content_type_fk")
        .order_by("created_at")
    )

    total = qs.count()
    offset = (page - 1) * page_size
    messages = qs[offset : offset + page_size]

    return {
        "results": [WhatsAppMessageOut.from_orm(m) for m in messages],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/messages", response={201: WhatsAppMessageOut})
def send_message(request, payload: WhatsAppMessageCreate):
    """Send a WhatsApp text message."""
    wa_settings = get_object_or_404(WhatsAppSettings, company=request.company)
    if not wa_settings.enabled:
        return 400, {"error": "WhatsApp is not enabled"}

    # Send via Graph API
    result = send_text_message(wa_settings, payload.to_number, payload.content)

    # Create message record
    msg_data = {
        "company": request.company,
        "message_id": result.get("messages", [{}])[0].get("id", ""),
        "message_type": WhatsAppMessage.MessageType.OUTGOING,
        "from_number": wa_settings.phone_number_id,
        "to_number": payload.to_number,
        "content": payload.content,
        "content_type": payload.content_type,
        "status": WhatsAppMessage.Status.SENT,
        "template_name": payload.template_name,
        "media_url": payload.media_url,
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
    wa_settings = get_object_or_404(WhatsAppSettings, company=request.company)
    if not wa_settings.enabled:
        return 400, {"error": "WhatsApp is not enabled"}

    result = send_template_message(
        wa_settings, payload.to_number, payload.template_name, payload.language
    )

    msg_data = {
        "company": request.company,
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
        # Fallback: try to find any enabled WhatsApp settings
        wa_settings = WhatsAppSettings.unscoped.filter(enabled=True).first()

    if wa_settings:
        handle_webhook(payload, wa_settings)

    return {"status": "ok"}

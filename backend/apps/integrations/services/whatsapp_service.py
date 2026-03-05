import hashlib
import hmac
import logging
import re

import requests
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"

# Comprehensive MIME-type → extension map for WhatsApp media
_MIME_EXT_MAP = {
    # Images
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    # Video
    "video/mp4": ".mp4",
    "video/3gpp": ".3gp",
    # Audio / voice notes
    "audio/aac": ".aac",
    "audio/amr": ".amr",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/ogg; codecs=opus": ".ogg",  # WhatsApp voice notes
    # Documents
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "text/plain": ".txt",
    "application/zip": ".zip",
}


def _mask_phone(number: str) -> str:
    """Mask a phone number for logging: keep last 4 digits visible."""
    if len(number) <= 4:
        return "****"
    return "*" * (len(number) - 4) + number[-4:]


def send_text_message(wa_settings, to_number, content):
    """Send a WhatsApp text message via Graph API."""
    url = f"{GRAPH_API_BASE}/{wa_settings.phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {wa_settings.access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": content},
    }
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()


def send_media_message(wa_settings, to_number, media_type, media_id, caption=""):
    """Send a WhatsApp media message (image, video, audio, document, sticker).

    ``media_id`` is the WhatsApp media ID returned by ``upload_media()``.
    ``caption`` is only supported for image, video, and document types.
    """
    url = f"{GRAPH_API_BASE}/{wa_settings.phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {wa_settings.access_token}",
        "Content-Type": "application/json",
    }
    media_obj: dict = {"id": media_id}
    if caption and media_type in ("image", "video", "document"):
        media_obj["caption"] = caption

    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": media_type,
        media_type: media_obj,
    }
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()


def upload_media(wa_settings, file_path, mime_type):
    """Upload a media file to WhatsApp and return the media ID.

    ``file_path`` is an absolute path on the local filesystem.
    """
    url = f"{GRAPH_API_BASE}/{wa_settings.phone_number_id}/media"
    headers = {"Authorization": f"Bearer {wa_settings.access_token}"}

    with open(file_path, "rb") as f:
        files = {"file": (file_path.split("/")[-1], f, mime_type)}
        data = {"messaging_product": "whatsapp", "type": mime_type}
        response = requests.post(url, headers=headers, files=files, data=data)

    response.raise_for_status()
    return response.json().get("id", "")


def send_template_message(wa_settings, to_number, template_name, language="en"):
    """Send a WhatsApp template message."""
    url = f"{GRAPH_API_BASE}/{wa_settings.phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {wa_settings.access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
        },
    }
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()


def _broadcast_whatsapp_event(event_type, data):
    """Broadcast a WhatsApp event to all connected WebSocket clients."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "crm_updates",
            {
                "type": "whatsapp_message",
                "data": {"type": "whatsapp_message", "event": event_type, **data},
            },
        )
    except Exception:
        logger.exception("Failed to broadcast WhatsApp event via WebSocket")


def _download_and_store_media(wa_settings, media_id, msg_type):
    """Download media from WhatsApp Graph API and store locally.

    Returns a tuple ``(relative_url, mime_type)`` or ``("", "")``.
    """
    import os
    import uuid

    from django.conf import settings as django_settings

    try:
        # Step 1: Get the temporary download URL from Graph API
        url = f"{GRAPH_API_BASE}/{media_id}"
        headers = {"Authorization": f"Bearer {wa_settings.access_token}"}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        media_info = resp.json()
        download_url = media_info.get("url")
        mime_type = media_info.get("mime_type", "")
        if not download_url:
            return "", ""

        # Step 2: Download the actual media file
        media_resp = requests.get(download_url, headers=headers, timeout=60)
        media_resp.raise_for_status()

        # Determine file extension from mime type
        # Normalise mime_type for lookup (strip params like codecs but keep
        # the full form available for a secondary lookup).
        mime_base = mime_type.split(";")[0].strip()
        ext = _MIME_EXT_MAP.get(mime_type) or _MIME_EXT_MAP.get(mime_base, "")
        if not ext and "/" in mime_base:
            ext = "." + mime_base.split("/")[-1]

        # Step 3: Save to media directory
        media_dir = os.path.join(django_settings.MEDIA_ROOT, "whatsapp")
        os.makedirs(media_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(media_dir, filename)

        with open(filepath, "wb") as f:
            f.write(media_resp.content)

        # Return the URL path that Django will serve
        return f"/media/whatsapp/{filename}", mime_type
    except Exception:
        logger.exception("Failed to download media %s", media_id)
        return "", ""


def handle_webhook(payload, wa_settings):
    """
    Process incoming WhatsApp webhook events (messages, status updates).

    Returns a list of created WhatsAppMessage instances.

    Idempotent: duplicate message IDs are silently skipped.
    """
    from apps.integrations.models import WhatsAppMessage

    created_messages = []
    entry = payload.get("entry", [])

    for entry_item in entry:
        changes = entry_item.get("changes", [])
        for change in changes:
            value = change.get("value", {})

            # Handle incoming messages
            messages = value.get("messages", [])
            for msg in messages:
                wa_message_id = msg.get("id", "")

                # ── Idempotency: skip if we already stored this message ──
                if wa_message_id and WhatsAppMessage.unscoped.filter(
                    message_id=wa_message_id
                ).exists():
                    logger.debug(
                        "Skipping duplicate WA message %s", wa_message_id
                    )
                    continue

                msg_type = msg.get("type", "text")
                media_url = ""
                mime_type = ""

                # Try to get media URL for media message types
                if msg_type in ("image", "video", "audio", "document", "sticker"):
                    media_data = msg.get(msg_type, {})
                    media_id = media_data.get("id")
                    if media_id:
                        media_url, mime_type = _download_and_store_media(
                            wa_settings, media_id, msg_type
                        )

                wa_msg = WhatsAppMessage(
                    company=wa_settings.company,
                    message_id=wa_message_id,
                    message_type=WhatsAppMessage.MessageType.INCOMING,
                    from_number=msg.get("from", ""),
                    to_number=wa_settings.phone_number_id,
                    content=_extract_message_content(msg),
                    content_type=msg_type,
                    status=WhatsAppMessage.Status.DELIVERED,
                    media_url=media_url,
                    mime_type=mime_type,
                )
                wa_msg.save()
                created_messages.append(wa_msg)
                logger.info(
                    "Received WA %s message from %s",
                    msg_type,
                    _mask_phone(msg.get("from", "")),
                )

                # Broadcast new message via WebSocket
                _broadcast_whatsapp_event("new_message", {
                    "phone_number": wa_msg.from_number,
                    "message_id": wa_msg.id,
                    "content_type": wa_msg.content_type,
                })

            # Handle status updates
            statuses = value.get("statuses", [])
            for status_update in statuses:
                msg_id = status_update.get("id", "")
                status = status_update.get("status", "")
                status_map = {
                    "sent": WhatsAppMessage.Status.SENT,
                    "delivered": WhatsAppMessage.Status.DELIVERED,
                    "read": WhatsAppMessage.Status.READ,
                    "failed": WhatsAppMessage.Status.FAILED,
                }
                mapped_status = status_map.get(status)
                if mapped_status and msg_id:
                    updated = WhatsAppMessage.unscoped.filter(message_id=msg_id).update(
                        status=mapped_status
                    )

                    if updated:
                        logger.info(
                            "Updated WA message %s → %s", msg_id, mapped_status
                        )
                        wa_msg_obj = WhatsAppMessage.unscoped.filter(message_id=msg_id).first()
                        if wa_msg_obj:
                            _broadcast_whatsapp_event("status_update", {
                                "phone_number": wa_msg_obj.to_number,
                                "message_id": wa_msg_obj.id,
                                "wa_message_id": msg_id,
                                "status": mapped_status,
                            })

    return created_messages


def verify_webhook_signature(payload_body, signature, app_secret):
    """Verify the X-Hub-Signature-256 header from Meta."""
    if not signature or not app_secret:
        return False
    expected = hmac.new(
        app_secret.encode("utf-8"),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


def _extract_message_content(msg):
    """Extract text content from a WhatsApp message payload."""
    msg_type = msg.get("type", "text")
    if msg_type == "text":
        return msg.get("text", {}).get("body", "")
    if msg_type == "image":
        return msg.get("image", {}).get("caption", "")
    if msg_type == "video":
        return msg.get("video", {}).get("caption", "")
    if msg_type == "document":
        doc = msg.get("document", {})
        # Prefer caption; fall back to filename
        return doc.get("caption", "") or doc.get("filename", "")
    if msg_type == "sticker":
        return msg.get("sticker", {}).get("emoji", "")
    if msg_type == "reaction":
        return msg.get("reaction", {}).get("emoji", "")
    if msg_type == "audio":
        return ""
    return ""

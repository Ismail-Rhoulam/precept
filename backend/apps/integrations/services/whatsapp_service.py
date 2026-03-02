import hashlib
import hmac
import logging

import requests

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


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


def handle_webhook(payload, wa_settings):
    """
    Process incoming WhatsApp webhook events (messages, status updates).

    Returns a list of created WhatsAppMessage instances.
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
                wa_msg = WhatsAppMessage(
                    company=wa_settings.company,
                    message_id=msg.get("id", ""),
                    message_type=WhatsAppMessage.MessageType.INCOMING,
                    from_number=msg.get("from", ""),
                    to_number=wa_settings.phone_number_id,
                    content=_extract_message_content(msg),
                    content_type=msg.get("type", "text"),
                    status=WhatsAppMessage.Status.DELIVERED,
                )
                wa_msg.save()
                created_messages.append(wa_msg)
                logger.info("Received WhatsApp message: %s", wa_msg.message_id)

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
                    WhatsAppMessage.unscoped.filter(message_id=msg_id).update(
                        status=mapped_status
                    )
                    logger.info(
                        "Updated WhatsApp message %s status to %s", msg_id, mapped_status
                    )

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
        return msg.get("image", {}).get("caption", "[Image]")
    if msg_type == "document":
        return msg.get("document", {}).get("filename", "[Document]")
    if msg_type == "reaction":
        return msg.get("reaction", {}).get("emoji", "")
    return f"[{msg_type}]"

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_crm_update(event_type: str, entity_type: str, entity_id: int, data: dict = None):
    """
    Send a CRM update event to ALL connected users (crm_updates group).
    Used for: lead/deal/contact/org create/update/delete.

    Frontend receives:
    {
        "type": "crm_update",
        "event": "lead_created" | "lead_updated" | "lead_deleted" | "deal_created" | etc.,
        "entity_type": "lead" | "deal" | "contact" | "organization",
        "entity_id": 123,
        "data": { ... optional extra data ... }
    }
    """
    channel_layer = get_channel_layer()
    message = {
        "type": "crm_update",  # Maps to consumer method crm_update
        "data": {
            "type": "crm_update",
            "event": event_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            **(data or {}),
        },
    }
    async_to_sync(channel_layer.group_send)("crm_updates", message)


def send_user_notification(user_id: int, notification_data: dict):
    """
    Send a notification event to a SPECIFIC user (user_{id} group).
    Used for: @mentions, task assignments, etc.

    Frontend receives:
    {
        "type": "notification",
        "notification": { ... notification details ... }
    }
    """
    channel_layer = get_channel_layer()
    message = {
        "type": "notification",  # Maps to consumer method notification
        "data": {
            "type": "notification",
            **notification_data,
        },
    }
    async_to_sync(channel_layer.group_send)(f"user_{user_id}", message)


def broadcast_activity_update(entity_type: str, entity_id: int):
    """
    Notify connected users that activities for a specific entity changed.
    Used for: new comment, note, task, status change.

    Frontend receives:
    {
        "type": "crm_update",
        "event": "activity_updated",
        "entity_type": "lead" | "deal",
        "entity_id": 123
    }
    """
    broadcast_crm_update("activity_updated", entity_type, entity_id)

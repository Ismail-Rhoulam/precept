from typing import Any, Dict

from django.shortcuts import get_object_or_404
from ninja import Router

from apps.communication.models import Notification
from apps.communication.api.schemas import NotificationOut

router = Router()


# ---------------------------------------------------------------------------
# List (current user's notifications)
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_notifications(request, page: int = 1, page_size: int = 20):
    """List notifications for the current user, ordered by created_at DESC."""
    qs = (
        Notification.objects.select_related(
            "from_user", "to_user", "reference_content_type"
        )
        .filter(to_user=request.auth)
        .order_by("-created_at")
    )

    total = qs.count()
    offset = (page - 1) * page_size
    notifications = qs[offset : offset + page_size]

    return {
        "results": [NotificationOut.from_orm(n) for n in notifications],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Unread count
# ---------------------------------------------------------------------------


@router.get("/unread-count", response=Dict[str, int])
def unread_count(request):
    """Return the count of unread notifications for the current user."""
    count = Notification.objects.filter(
        to_user=request.auth, read=False
    ).count()
    return {"count": count}


# ---------------------------------------------------------------------------
# Mark single notification as read
# ---------------------------------------------------------------------------


@router.post("/{notification_id}/mark-read", response=NotificationOut)
def mark_read(request, notification_id: int):
    """Mark a single notification as read."""
    notification = get_object_or_404(
        Notification.objects.select_related(
            "from_user", "to_user", "reference_content_type"
        ),
        pk=notification_id,
        to_user=request.auth,
    )
    notification.read = True
    notification.save()
    return notification


# ---------------------------------------------------------------------------
# Mark all notifications as read
# ---------------------------------------------------------------------------


@router.post("/mark-all-read", response=Dict[str, int])
def mark_all_read(request):
    """Mark all notifications for the current user as read."""
    updated = Notification.objects.filter(
        to_user=request.auth, read=False
    ).update(read=True)
    return {"updated": updated}

from typing import Any, Dict, List

from bs4 import BeautifulSoup
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.communication.models import Comment, Notification
from apps.communication.api.schemas import CommentOut, CommentCreate
from apps.core.models import User
from apps.realtime.utils import broadcast_activity_update, send_user_notification

router = Router()

ENTITY_MODEL_MAP = {
    "lead": "crm.lead",
    "deal": "crm.deal",
}


def get_content_type(entity_type: str):
    """Resolve a short entity name to a Django ContentType."""
    key = ENTITY_MODEL_MAP[entity_type]
    app_label, model = key.split(".")
    return ContentType.objects.get(app_label=app_label, model=model)


def extract_mentions(html_content: str) -> list:
    """Extract @mentioned users from HTML content.

    Looks for ``<span data-type="mention" data-id="email">`` tags
    and returns a list of dicts with ``email`` and ``name`` keys.
    """
    mentions = []
    soup = BeautifulSoup(html_content, "html.parser")
    for span in soup.find_all("span", attrs={"data-type": "mention"}):
        email = span.get("data-id")
        label = span.get("data-label", "")
        if email:
            mentions.append({"email": email, "name": label})
    return mentions


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=List[CommentOut])
def list_comments(request, entity_type: str, entity_id: int):
    """List comments for an entity (query params: entity_type, entity_id)."""
    ct = get_content_type(entity_type)
    qs = (
        Comment.objects.select_related("comment_by", "content_type")
        .filter(content_type=ct, object_id=entity_id)
        .order_by("-created_at")
    )
    return [CommentOut.from_orm(c) for c in qs]


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: CommentOut})
def create_comment(request, payload: CommentCreate):
    """Create a comment and send Mention notifications for @mentions."""
    user = request.auth
    ct = get_content_type(payload.entity_type)

    comment = Comment.objects.create(
        content=payload.content,
        comment_by=user,
        content_type=ct,
        object_id=payload.entity_id,
        company=request.company,
        created_by=user,
        modified_by=user,
    )

    # Detect @mentions and create notifications
    mentions = extract_mentions(payload.content)
    seen_emails = set()
    for mention in mentions:
        email = mention["email"]
        # Skip self-mentions and duplicates
        if email == user.email or email in seen_emails:
            continue
        seen_emails.add(email)

        try:
            mentioned_user = User.objects.get(email=email)
        except User.DoesNotExist:
            continue

        notification = Notification.objects.create(
            company=request.company,
            notification_text=(
                f"{user.first_name} {user.last_name} mentioned you in a "
                f"comment on {payload.entity_type} #{payload.entity_id}"
            ),
            from_user=user,
            to_user=mentioned_user,
            type="Mention",
            message=comment.content,
            reference_content_type=ct,
            reference_object_id=payload.entity_id,
            created_by=user,
            modified_by=user,
        )
        send_user_notification(mentioned_user.id, {
            "notification_id": notification.id,
            "notification_type": "Mention",
            "from_user": f"{user.first_name} {user.last_name}",
            "entity_type": payload.entity_type,
            "entity_id": payload.entity_id,
        })

    # Broadcast activity update for the entity
    broadcast_activity_update(payload.entity_type, payload.entity_id)

    # Re-fetch with select_related for the response
    comment = Comment.objects.select_related("comment_by", "content_type").get(
        pk=comment.pk
    )
    return 201, comment


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{comment_id}", response={204: None})
def delete_comment(request, comment_id: int):
    """Delete a comment."""
    comment = get_object_or_404(Comment, pk=comment_id)
    comment.delete()
    return 204, None

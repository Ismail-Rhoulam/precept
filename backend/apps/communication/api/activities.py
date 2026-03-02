from typing import Any, Dict

from django.contrib.contenttypes.models import ContentType
from ninja import Router

from apps.communication.models import Comment, Note, Task, CallLog, StatusChangeLog
from apps.communication.api.schemas import (
    CommentOut,
    NoteOut,
    TaskOut,
    CallLogOut,
    StatusChangeLogOut,
)

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


# ---------------------------------------------------------------------------
# Unified activity timeline
# ---------------------------------------------------------------------------


@router.get("/{entity_type}/{entity_id}", response=Dict[str, Any])
def get_activities(request, entity_type: str, entity_id: int):
    """Return all activities for a lead or deal, sorted by created_at DESC."""
    ct = get_content_type(entity_type)

    comments = (
        Comment.objects.select_related("comment_by", "content_type")
        .filter(content_type=ct, object_id=entity_id)
        .order_by("-created_at")
    )

    notes = (
        Note.objects.select_related("created_by", "content_type")
        .filter(content_type=ct, object_id=entity_id)
        .order_by("-created_at")
    )

    tasks = (
        Task.objects.select_related("assigned_to", "created_by", "content_type")
        .filter(content_type=ct, object_id=entity_id)
        .order_by("-created_at")
    )

    call_logs = (
        CallLog.objects.select_related("caller", "receiver", "content_type")
        .filter(content_type=ct, object_id=entity_id)
        .order_by("-created_at")
    )

    status_changes = (
        StatusChangeLog.objects.select_related("changed_by", "content_type")
        .filter(content_type=ct, object_id=entity_id)
        .order_by("-created_at")
    )

    # Build unified timeline
    activities = []

    for c in comments:
        activities.append({
            "id": c.id,
            "activity_type": "comment",
            "created_at": c.created_at,
            "user_email": c.comment_by.email if c.comment_by else None,
            "user_name": (
                f"{c.comment_by.first_name} {c.comment_by.last_name}".strip()
                if c.comment_by
                else None
            ),
            "data": {"content": c.content},
        })

    for n in notes:
        activities.append({
            "id": n.id,
            "activity_type": "note",
            "created_at": n.created_at,
            "user_email": n.created_by.email if n.created_by else None,
            "user_name": (
                f"{n.created_by.first_name} {n.created_by.last_name}".strip()
                if n.created_by
                else None
            ),
            "data": {"title": n.title, "content": n.content},
        })

    for t in tasks:
        activities.append({
            "id": t.id,
            "activity_type": "task",
            "created_at": t.created_at,
            "user_email": t.created_by.email if t.created_by else None,
            "user_name": (
                f"{t.created_by.first_name} {t.created_by.last_name}".strip()
                if t.created_by
                else None
            ),
            "data": {
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "assigned_to_name": (
                    f"{t.assigned_to.first_name} {t.assigned_to.last_name}".strip()
                    if t.assigned_to
                    else None
                ),
            },
        })

    for cl in call_logs:
        activities.append({
            "id": cl.id,
            "activity_type": "call_log",
            "created_at": cl.created_at,
            "user_email": cl.caller.email if cl.caller else None,
            "user_name": (
                f"{cl.caller.first_name} {cl.caller.last_name}".strip()
                if cl.caller
                else None
            ),
            "data": {
                "call_type": cl.call_type,
                "status": cl.status,
                "caller_number": cl.caller_number,
                "receiver_number": cl.receiver_number,
                "duration": CallLogOut.resolve_duration(cl),
            },
        })

    for sc in status_changes:
        activities.append({
            "id": sc.id,
            "activity_type": "status_change",
            "created_at": sc.created_at,
            "user_email": sc.changed_by.email if sc.changed_by else None,
            "user_name": (
                f"{sc.changed_by.first_name} {sc.changed_by.last_name}".strip()
                if sc.changed_by
                else None
            ),
            "data": {"from_status": sc.from_status, "to_status": sc.to_status},
        })

    # Sort by created_at descending
    activities.sort(key=lambda a: a["created_at"], reverse=True)

    return {
        "activities": activities,
        "comments": [CommentOut.from_orm(c) for c in comments],
        "notes": [NoteOut.from_orm(n) for n in notes],
        "tasks": [TaskOut.from_orm(t) for t in tasks],
        "call_logs": [CallLogOut.from_orm(cl) for cl in call_logs],
    }

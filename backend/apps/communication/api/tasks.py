from typing import Any, Dict, Optional

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.communication.models import Notification, Task
from apps.communication.api.schemas import TaskCreate, TaskOut, TaskUpdate
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


def _notify_assignee(task, assigner, entity_type_str=None, entity_id=None):
    """Create an Assignment notification for the task assignee."""
    if not task.assigned_to or task.assigned_to == assigner:
        return

    ref_text = ""
    if entity_type_str and entity_id:
        ref_text = f" on {entity_type_str} #{entity_id}"

    notification = Notification.objects.create(
        company=task.company,
        notification_text=(
            f"{assigner.first_name} {assigner.last_name} assigned you a "
            f'task "{task.title}"{ref_text}'
        ),
        from_user=assigner,
        to_user=task.assigned_to,
        type="Assignment",
        message=task.description,
        reference_content_type=task.content_type,
        reference_object_id=task.object_id,
        created_by=assigner,
        modified_by=assigner,
    )
    send_user_notification(task.assigned_to.id, {
        "notification_id": notification.id,
        "notification_type": "Assignment",
        "from_user": f"{assigner.first_name} {assigner.last_name}",
        "task_title": task.title,
        "entity_type": entity_type_str,
        "entity_id": entity_id,
    })


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_tasks(
    request,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
):
    """List tasks with optional filters."""
    qs = Task.objects.select_related(
        "assigned_to", "created_by", "content_type"
    ).all()

    if status:
        qs = qs.filter(status=status)
    if priority:
        qs = qs.filter(priority=priority)
    if assigned_to_id:
        qs = qs.filter(assigned_to_id=assigned_to_id)
    if entity_type and entity_id:
        ct = get_content_type(entity_type)
        qs = qs.filter(content_type=ct, object_id=entity_id)

    qs = qs.order_by("-created_at")
    total = qs.count()
    offset = (page - 1) * page_size
    tasks = qs[offset : offset + page_size]

    return {
        "results": [TaskOut.from_orm(t) for t in tasks],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{task_id}", response=TaskOut)
def get_task(request, task_id: int):
    """Get a single task by ID."""
    task = get_object_or_404(
        Task.objects.select_related("assigned_to", "created_by", "content_type"),
        pk=task_id,
    )
    return task


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: TaskOut})
def create_task(request, payload: TaskCreate):
    """Create a new task. Notifies the assignee if set."""
    user = request.auth
    data = {
        "title": payload.title,
        "description": payload.description,
        "priority": payload.priority,
        "status": payload.status,
        "assigned_to_id": payload.assigned_to_id,
        "start_date": payload.start_date,
        "due_date": payload.due_date,
        "company": request.company,
        "created_by": user,
        "modified_by": user,
    }

    if payload.entity_type and payload.entity_id:
        ct = get_content_type(payload.entity_type)
        data["content_type"] = ct
        data["object_id"] = payload.entity_id

    task = Task.objects.create(**data)

    # Notify assignee
    if task.assigned_to_id:
        task_with_relations = Task.objects.select_related(
            "assigned_to", "created_by", "content_type"
        ).get(pk=task.pk)
        _notify_assignee(
            task_with_relations, user, payload.entity_type, payload.entity_id
        )
    else:
        task_with_relations = Task.objects.select_related(
            "assigned_to", "created_by", "content_type"
        ).get(pk=task.pk)

    if payload.entity_type and payload.entity_id:
        broadcast_activity_update(payload.entity_type, payload.entity_id)

    return 201, task_with_relations


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{task_id}", response=TaskOut)
def update_task(request, task_id: int, payload: TaskUpdate):
    """Update an existing task. Notifies the new assignee if changed."""
    task = get_object_or_404(Task, pk=task_id)
    user = request.auth

    old_assigned_to_id = task.assigned_to_id

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(task, attr, value)
    task.modified_by = user
    task.save()

    # Re-fetch with select_related for the response
    task = Task.objects.select_related(
        "assigned_to", "created_by", "content_type"
    ).get(pk=task.pk)

    # Notify new assignee if assignment changed
    new_assigned_to_id = task.assigned_to_id
    if new_assigned_to_id and new_assigned_to_id != old_assigned_to_id:
        entity_type_str = task.content_type.model if task.content_type else None
        _notify_assignee(task, user, entity_type_str, task.object_id)

    return task


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{task_id}", response={204: None})
def delete_task(request, task_id: int):
    """Delete a task."""
    task = get_object_or_404(Task, pk=task_id)
    task.delete()
    return 204, None

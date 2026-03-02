import uuid
from datetime import timedelta
from typing import Any, Dict, Optional

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.communication.models import CallLog
from apps.communication.api.schemas import CallLogCreate, CallLogOut, CallLogUpdate

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
# List
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_call_logs(
    request,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
):
    """List call logs, optionally filtered by entity."""
    qs = CallLog.objects.select_related(
        "caller", "receiver", "content_type"
    ).all()

    if entity_type and entity_id:
        ct = get_content_type(entity_type)
        qs = qs.filter(content_type=ct, object_id=entity_id)

    qs = qs.order_by("-created_at")
    total = qs.count()
    offset = (page - 1) * page_size
    call_logs = qs[offset : offset + page_size]

    return {
        "results": [CallLogOut.from_orm(cl) for cl in call_logs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{call_log_id}", response=CallLogOut)
def get_call_log(request, call_log_id: int):
    """Get a single call log by ID."""
    call_log = get_object_or_404(
        CallLog.objects.select_related("caller", "receiver", "content_type"),
        pk=call_log_id,
    )
    return call_log


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: CallLogOut})
def create_call_log(request, payload: CallLogCreate):
    """Create a new call log. Generates a unique call_id if not provided."""
    user = request.auth
    data = {
        "call_id": str(uuid.uuid4()),
        "caller_number": payload.caller_number,
        "receiver_number": payload.receiver_number,
        "status": payload.status,
        "call_type": payload.call_type,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
        "recording_url": payload.recording_url,
        "telephony_medium": payload.telephony_medium,
        "caller_id": payload.caller_id,
        "receiver_id": payload.receiver_id,
        "company": request.company,
        "created_by": user,
        "modified_by": user,
    }

    if payload.duration_seconds is not None:
        data["duration"] = timedelta(seconds=payload.duration_seconds)

    if payload.entity_type and payload.entity_id:
        ct = get_content_type(payload.entity_type)
        data["content_type"] = ct
        data["object_id"] = payload.entity_id

    call_log = CallLog.objects.create(**data)

    # Re-fetch with select_related for the response
    call_log = CallLog.objects.select_related(
        "caller", "receiver", "content_type"
    ).get(pk=call_log.pk)
    return 201, call_log


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{call_log_id}", response=CallLogOut)
def update_call_log(request, call_log_id: int, payload: CallLogUpdate):
    """Update an existing call log."""
    call_log = get_object_or_404(CallLog, pk=call_log_id)
    data = payload.dict(exclude_unset=True)

    # Handle duration_seconds -> duration conversion
    if "duration_seconds" in data:
        seconds = data.pop("duration_seconds")
        if seconds is not None:
            call_log.duration = timedelta(seconds=seconds)
        else:
            call_log.duration = None

    for attr, value in data.items():
        setattr(call_log, attr, value)

    call_log.modified_by = request.auth
    call_log.save()

    # Re-fetch with select_related for the response
    call_log = CallLog.objects.select_related(
        "caller", "receiver", "content_type"
    ).get(pk=call_log.pk)
    return call_log


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{call_log_id}", response={204: None})
def delete_call_log(request, call_log_id: int):
    """Delete a call log."""
    call_log = get_object_or_404(CallLog, pk=call_log_id)
    call_log.delete()
    return 204, None

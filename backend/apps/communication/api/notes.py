from typing import Any, Dict, List, Optional

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.communication.models import Note
from apps.communication.api.schemas import NoteCreate, NoteOut, NoteUpdate
from apps.realtime.utils import broadcast_activity_update

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
def list_notes(
    request,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
):
    """List notes, optionally filtered by entity_type and entity_id."""
    qs = Note.objects.select_related("created_by", "content_type").all()

    if entity_type and entity_id:
        ct = get_content_type(entity_type)
        qs = qs.filter(content_type=ct, object_id=entity_id)

    qs = qs.order_by("-created_at")
    total = qs.count()
    offset = (page - 1) * page_size
    notes = qs[offset : offset + page_size]

    return {
        "results": [NoteOut.from_orm(n) for n in notes],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{note_id}", response=NoteOut)
def get_note(request, note_id: int):
    """Get a single note by ID."""
    note = get_object_or_404(
        Note.objects.select_related("created_by", "content_type"),
        pk=note_id,
    )
    return note


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: NoteOut})
def create_note(request, payload: NoteCreate):
    """Create a new note."""
    user = request.auth
    data = {
        "title": payload.title,
        "content": payload.content,
        "company": request.company,
        "created_by": user,
        "modified_by": user,
    }

    if payload.entity_type and payload.entity_id:
        ct = get_content_type(payload.entity_type)
        data["content_type"] = ct
        data["object_id"] = payload.entity_id

    note = Note.objects.create(**data)

    # Broadcast activity update if linked to an entity
    if payload.entity_type and payload.entity_id:
        broadcast_activity_update(payload.entity_type, payload.entity_id)

    # Re-fetch with select_related for the response
    note = Note.objects.select_related("created_by", "content_type").get(pk=note.pk)
    return 201, note


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{note_id}", response=NoteOut)
def update_note(request, note_id: int, payload: NoteUpdate):
    """Update an existing note."""
    note = get_object_or_404(Note, pk=note_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(note, attr, value)
    note.modified_by = request.auth
    note.save()

    # Re-fetch with select_related for the response
    note = Note.objects.select_related("created_by", "content_type").get(pk=note.pk)

    # Broadcast activity update if linked to an entity
    if note.content_type and note.object_id:
        broadcast_activity_update(note.content_type.model, note.object_id)

    return note


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{note_id}", response={204: None})
def delete_note(request, note_id: int):
    """Delete a note."""
    note = get_object_or_404(Note, pk=note_id)
    entity_type = note.content_type.model if note.content_type else None
    entity_id = note.object_id
    note.delete()

    # Broadcast activity update if linked to an entity
    if entity_type and entity_id:
        broadcast_activity_update(entity_type, entity_id)

    return 204, None

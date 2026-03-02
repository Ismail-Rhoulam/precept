from typing import Any, Dict, List, Optional

from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from apps.communication.models import Event, EventParticipant
from apps.communication.api.schemas import (
    EventCreate,
    EventOut,
    EventParticipantOut,
    EventUpdate,
)

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_events(
    request,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    owner_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    event_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
):
    """
    List events for a date range.
    Optionally filter by owner, entity, or event_type.
    """
    qs = Event.objects.select_related("owner").prefetch_related("participants__user").all()

    if from_date:
        qs = qs.filter(starts_on__date__gte=from_date)
    if to_date:
        qs = qs.filter(starts_on__date__lte=to_date)
    if owner_id:
        qs = qs.filter(owner_id=owner_id)
    if entity_type:
        qs = qs.filter(entity_type=entity_type)
    if entity_id:
        qs = qs.filter(entity_id=entity_id)
    if event_type:
        qs = qs.filter(event_type=event_type)

    total = qs.count()
    offset = (page - 1) * page_size
    events = list(qs[offset: offset + page_size])

    return {
        "results": [EventOut.from_orm(e) for e in events],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{event_id}", response=EventOut)
def get_event(request, event_id: int):
    """Get a single event by ID, including its participants."""
    event = get_object_or_404(
        Event.objects.select_related("owner").prefetch_related("participants__user"),
        pk=event_id,
    )
    return event


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: EventOut})
def create_event(request, payload: EventCreate):
    """Create a new event. Optionally provide participants."""
    user = request.auth

    event = Event.objects.create(
        company=request.company,
        subject=payload.subject,
        description=payload.description,
        location=payload.location,
        starts_on=payload.starts_on,
        ends_on=payload.ends_on,
        all_day=payload.all_day,
        event_type=payload.event_type,
        color=payload.color,
        entity_type=payload.entity_type or "",
        entity_id=payload.entity_id,
        owner=user,
        created_by=user,
        modified_by=user,
    )

    # Add participants if provided
    if payload.participants:
        for p in payload.participants:
            EventParticipant.objects.create(
                company=request.company,
                event=event,
                user_id=p.get("user_id") if isinstance(p, dict) else getattr(p, "user_id", None),
                email=p.get("email") if isinstance(p, dict) else getattr(p, "email", ""),
                attending=p.get("attending", "Yes") if isinstance(p, dict) else getattr(p, "attending", "Yes"),
            )

    # Re-fetch with select_related for response
    event = Event.objects.select_related("owner").prefetch_related("participants__user").get(pk=event.pk)
    return 201, event


# ---------------------------------------------------------------------------
# Update (supports drag/resize via starts_on/ends_on update)
# ---------------------------------------------------------------------------


@router.patch("/{event_id}", response=EventOut)
def update_event(request, event_id: int, payload: EventUpdate):
    """
    Update an existing event.
    Supports drag/resize by accepting starts_on/ends_on updates.
    """
    event = get_object_or_404(Event, pk=event_id)
    user = request.auth

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(event, attr, value)
    event.modified_by = user
    event.save()

    # Re-fetch with select_related for response
    event = Event.objects.select_related("owner").prefetch_related("participants__user").get(pk=event.pk)
    return event


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{event_id}", response={204: None})
def delete_event(request, event_id: int):
    """Delete an event and all its participants."""
    event = get_object_or_404(Event, pk=event_id)
    event.delete()
    return 204, None


# ---------------------------------------------------------------------------
# RSVP (update attending status for current user)
# ---------------------------------------------------------------------------


@router.post("/{event_id}/rsvp", response=EventParticipantOut)
def rsvp_event(request, event_id: int, attending: str):
    """
    Update the attending status for the current user on an event.
    Creates a participant record if one does not exist for this user.
    """
    user = request.auth
    event = get_object_or_404(Event, pk=event_id)

    valid_statuses = [c[0] for c in EventParticipant.AttendingStatus.choices]
    if attending not in valid_statuses:
        raise HttpError(400, f"Invalid attending status. Must be one of: {valid_statuses}")

    participant, _ = EventParticipant.objects.get_or_create(
        event=event,
        user=user,
        defaults={
            "company": request.company,
            "email": user.email,
            "attending": attending,
        },
    )

    if participant.attending != attending:
        participant.attending = attending
        participant.save()

    # Re-fetch with select_related for response
    participant = EventParticipant.objects.select_related("user").get(pk=participant.pk)
    return participant

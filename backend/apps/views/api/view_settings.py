from typing import Any, Dict, List

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.views.api.schemas import (
    ViewSettingsCreate,
    ViewSettingsOut,
    ViewSettingsUpdate,
)
from apps.views.models import ViewSettings

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response=Dict[str, Any])
def list_views(request, entity_type: str):
    """
    List views for the current user: own views + public views.
    Filtered by entity_type (required). Ordered by pinned desc, label asc.
    """
    user = request.auth
    qs = (
        ViewSettings.objects
        .select_related("user")
        .filter(
            Q(user=user) | Q(public=True),
            entity_type=entity_type,
        )
        .order_by("-pinned", "label")
    )
    return {
        "results": [ViewSettingsOut.from_orm(v) for v in qs],
        "total": qs.count(),
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@router.get("/{view_id}", response=ViewSettingsOut)
def get_view(request, view_id: int):
    view = get_object_or_404(
        ViewSettings.objects.select_related("user"),
        pk=view_id,
    )
    return view


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/", response={201: ViewSettingsOut})
def create_view(request, payload: ViewSettingsCreate):
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["user"] = user
    data["created_by"] = user
    data["modified_by"] = user
    view = ViewSettings(**data)
    view.save()
    return 201, view


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.patch("/{view_id}", response=ViewSettingsOut)
def update_view(request, view_id: int, payload: ViewSettingsUpdate):
    view = get_object_or_404(ViewSettings, pk=view_id)
    user = request.auth
    # Only owner or admin can update
    if view.user_id != user.id and user.role != "admin":
        return router.create_response(
            request, {"detail": "Permission denied"}, status=403
        )
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(view, attr, value)
    view.modified_by = user
    view.save()
    return view


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{view_id}", response={204: None})
def delete_view(request, view_id: int):
    view = get_object_or_404(ViewSettings, pk=view_id)
    user = request.auth
    # Only owner or admin can delete
    if view.user_id != user.id and user.role != "admin":
        return router.create_response(
            request, {"detail": "Permission denied"}, status=403
        )
    view.delete()
    return 204, None


# ---------------------------------------------------------------------------
# Set Default
# ---------------------------------------------------------------------------

@router.post("/{view_id}/set-default", response=ViewSettingsOut)
def set_default_view(request, view_id: int):
    """
    Set a view as default for its entity_type.
    First unsets any existing default for the same user + entity_type + type,
    then marks the target view as default.
    """
    user = request.auth
    view = get_object_or_404(
        ViewSettings.objects.select_related("user"),
        pk=view_id,
    )
    # Unset existing defaults for the same user + entity_type + type
    ViewSettings.objects.filter(
        user=user,
        entity_type=view.entity_type,
        type=view.type,
        is_default=True,
    ).update(is_default=False)
    # Set the target as default
    view.is_default = True
    view.modified_by = user
    view.save()
    return view


# ---------------------------------------------------------------------------
# Toggle Pin
# ---------------------------------------------------------------------------

@router.post("/{view_id}/pin", response=ViewSettingsOut)
def toggle_pin(request, view_id: int):
    """Toggle the pinned status of a view."""
    user = request.auth
    view = get_object_or_404(
        ViewSettings.objects.select_related("user"),
        pk=view_id,
    )
    view.pinned = not view.pinned
    view.modified_by = user
    view.save()
    return view


# ---------------------------------------------------------------------------
# Toggle Public
# ---------------------------------------------------------------------------

@router.post("/{view_id}/toggle-public", response=ViewSettingsOut)
def toggle_public(request, view_id: int):
    """
    Toggle the public status.
    When toggling public ON: clear the user field (shared view).
    When toggling public OFF: set user to the current user (personal view).
    """
    user = request.auth
    view = get_object_or_404(
        ViewSettings.objects.select_related("user"),
        pk=view_id,
    )
    view.public = not view.public
    if view.public:
        view.user = None
    else:
        view.user = user
    view.modified_by = user
    view.save()
    return view


# ---------------------------------------------------------------------------
# Standard (create-or-update)
# ---------------------------------------------------------------------------

@router.post("/standard", response=ViewSettingsOut)
def upsert_standard_view(request, payload: ViewSettingsCreate):
    """
    Create or update a "standard" view.
    Lookup by: user + entity_type + type + is_standard=True.
    If it exists, update it; if not, create it.
    Used for auto-saving user modifications to default list/kanban/group_by.
    """
    user = request.auth
    data = payload.dict()

    view, created = ViewSettings.objects.select_related("user").get_or_create(
        user=user,
        entity_type=data.pop("entity_type"),
        type=data.pop("type"),
        is_standard=True,
        defaults={
            **data,
            "company": request.company,
            "created_by": user,
            "modified_by": user,
        },
    )

    if not created:
        for attr, value in data.items():
            setattr(view, attr, value)
        view.modified_by = user
        view.save()

    return view

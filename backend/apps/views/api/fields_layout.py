from typing import Any, Dict, Optional

from django.shortcuts import get_object_or_404
from ninja import Router

from apps.views.models import FieldsLayout
from apps.views.api.schemas import FieldsLayoutCreate, FieldsLayoutOut, FieldsLayoutUpdate

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_fields_layouts(
    request,
    dt: Optional[str] = None,
    type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
):
    """List fields layouts. Optionally filter by entity type (dt) or layout type."""
    qs = FieldsLayout.objects.all()

    if dt:
        qs = qs.filter(dt=dt)
    if type:
        qs = qs.filter(type=type)

    qs = qs.order_by("dt", "type")
    total = qs.count()
    offset = (page - 1) * page_size
    layouts = qs[offset: offset + page_size]

    return {
        "results": [FieldsLayoutOut.from_orm(l) for l in layouts],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{layout_id}", response=FieldsLayoutOut)
def get_fields_layout(request, layout_id: int):
    """Get a single fields layout by ID."""
    layout = get_object_or_404(FieldsLayout, pk=layout_id)
    return layout


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: FieldsLayoutOut})
def create_fields_layout(request, payload: FieldsLayoutCreate):
    """Create a new fields layout."""
    user = request.auth
    layout = FieldsLayout.objects.create(
        company=request.company,
        dt=payload.dt,
        type=payload.type,
        layout=payload.layout,
        created_by=user,
        modified_by=user,
    )
    return 201, layout


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{layout_id}", response=FieldsLayoutOut)
def update_fields_layout(request, layout_id: int, payload: FieldsLayoutUpdate):
    """Update an existing fields layout."""
    layout = get_object_or_404(FieldsLayout, pk=layout_id)
    user = request.auth

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(layout, attr, value)
    layout.modified_by = user
    layout.save()
    return layout


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{layout_id}", response={204: None})
def delete_fields_layout(request, layout_id: int):
    """Delete a fields layout."""
    layout = get_object_or_404(FieldsLayout, pk=layout_id)
    layout.delete()
    return 204, None


# ---------------------------------------------------------------------------
# Save Layout (upsert by dt + type)
# ---------------------------------------------------------------------------


@router.post("/save-layout", response=FieldsLayoutOut)
def save_layout(request, payload: FieldsLayoutCreate):
    """
    Upsert a fields layout by (company, dt, type).
    If a layout already exists for this company + dt + type, update it.
    Otherwise, create a new one.
    Used by the frontend to persist drag-and-drop layout changes.
    """
    user = request.auth

    layout, created = FieldsLayout.objects.get_or_create(
        company=request.company,
        dt=payload.dt,
        type=payload.type,
        defaults={
            "layout": payload.layout,
            "created_by": user,
            "modified_by": user,
        },
    )

    if not created:
        layout.layout = payload.layout
        layout.modified_by = user
        layout.save()

    return layout

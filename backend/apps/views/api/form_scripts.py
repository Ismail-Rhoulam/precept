from typing import Any, Dict, Optional

from django.shortcuts import get_object_or_404
from ninja import Router

from apps.views.models import FormScript
from apps.views.api.schemas import FormScriptCreate, FormScriptOut, FormScriptUpdate

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response=Dict[str, Any])
def list_form_scripts(
    request,
    dt: Optional[str] = None,
    view: Optional[str] = None,
    enabled: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
):
    """List form scripts. Optionally filter by entity type (dt), view target, or enabled."""
    qs = FormScript.objects.all()

    if dt:
        qs = qs.filter(dt=dt)
    if view:
        qs = qs.filter(view=view)
    if enabled is not None:
        qs = qs.filter(enabled=enabled)

    qs = qs.order_by("dt", "name")
    total = qs.count()
    offset = (page - 1) * page_size
    scripts = qs[offset: offset + page_size]

    return {
        "results": [FormScriptOut.from_orm(s) for s in scripts],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------


@router.get("/{script_id}", response=FormScriptOut)
def get_form_script(request, script_id: int):
    """Get a single form script by ID."""
    script = get_object_or_404(FormScript, pk=script_id)
    return script


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response={201: FormScriptOut})
def create_form_script(request, payload: FormScriptCreate):
    """Create a new form script."""
    user = request.auth
    script = FormScript.objects.create(
        company=request.company,
        name=payload.name,
        dt=payload.dt,
        view=payload.view,
        enabled=payload.enabled,
        script=payload.script,
        created_by=user,
        modified_by=user,
    )
    return 201, script


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.patch("/{script_id}", response=FormScriptOut)
def update_form_script(request, script_id: int, payload: FormScriptUpdate):
    """Update an existing form script."""
    script = get_object_or_404(FormScript, pk=script_id)
    user = request.auth

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(script, attr, value)
    script.modified_by = user
    script.save()
    return script


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{script_id}", response={204: None})
def delete_form_script(request, script_id: int):
    """Delete a form script."""
    script = get_object_or_404(FormScript, pk=script_id)
    script.delete()
    return 204, None

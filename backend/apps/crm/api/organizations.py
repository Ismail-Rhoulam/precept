from typing import Any, Dict, List

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Query, Router

from apps.crm.api.schemas import (
    OrganizationCreate,
    OrganizationOut,
    OrganizationUpdate,
)
from apps.crm.models import Organization
from apps.realtime.utils import broadcast_crm_update

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response=Dict[str, Any])
def list_organizations(
    request,
    order_by: str = "-updated_at",
    page: int = 1,
    page_size: int = 20,
    search: str = "",
):
    qs = Organization.objects.select_related("industry", "territory").all()

    if search:
        qs = qs.filter(
            Q(organization_name__icontains=search)
            | Q(website__icontains=search)
        )

    # Ordering
    allowed_order_fields = {
        "created_at", "-created_at",
        "updated_at", "-updated_at",
        "organization_name", "-organization_name",
    }
    if order_by not in allowed_order_fields:
        order_by = "-updated_at"
    qs = qs.order_by(order_by)

    total = qs.count()
    offset = (page - 1) * page_size
    organizations = qs[offset : offset + page_size]

    return {
        "results": [OrganizationOut.from_orm(org) for org in organizations],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@router.get("/{organization_id}", response=OrganizationOut)
def get_organization(request, organization_id: int):
    organization = get_object_or_404(
        Organization.objects.select_related("industry", "territory"),
        pk=organization_id,
    )
    return organization


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/", response={201: OrganizationOut})
def create_organization(request, payload: OrganizationCreate):
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user
    organization = Organization(**data)
    organization.save()
    broadcast_crm_update("organization_created", "organization", organization.id)
    return 201, organization


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.patch("/{organization_id}", response=OrganizationOut)
def update_organization(request, organization_id: int, payload: OrganizationUpdate):
    organization = get_object_or_404(Organization, pk=organization_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(organization, attr, value)
    organization.modified_by = request.auth
    organization.save()
    broadcast_crm_update("organization_updated", "organization", organization.id)
    return organization


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{organization_id}", response={204: None})
def delete_organization(request, organization_id: int):
    organization = get_object_or_404(Organization, pk=organization_id)
    organization.delete()
    broadcast_crm_update("organization_deleted", "organization", organization_id)
    return 204, None


# ---------------------------------------------------------------------------
# Bulk Delete
# ---------------------------------------------------------------------------

@router.post("/bulk-delete", response={204: None})
def bulk_delete_organizations(request, ids: List[int]):
    Organization.objects.filter(id__in=ids).delete()
    return 204, None

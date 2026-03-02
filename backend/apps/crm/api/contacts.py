from typing import Any, Dict, List

from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Query, Router

from apps.crm.api.schemas import ContactCreate, ContactOut, ContactUpdate
from apps.crm.models import Contact
from apps.realtime.utils import broadcast_crm_update

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response=Dict[str, Any])
def list_contacts(
    request,
    order_by: str = "-updated_at",
    page: int = 1,
    page_size: int = 20,
    search: str = "",
):
    qs = Contact.objects.all()

    if search:
        qs = qs.filter(
            Q(full_name__icontains=search)
            | Q(email_id__icontains=search)
            | Q(mobile_no__icontains=search)
            | Q(company_name__icontains=search)
        )

    # Ordering
    allowed_order_fields = {
        "created_at", "-created_at",
        "updated_at", "-updated_at",
        "full_name", "-full_name",
    }
    if order_by not in allowed_order_fields:
        order_by = "-updated_at"
    qs = qs.order_by(order_by)

    total = qs.count()
    offset = (page - 1) * page_size
    contacts = qs[offset : offset + page_size]

    return {
        "results": [ContactOut.from_orm(c) for c in contacts],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@router.get("/{contact_id}", response=ContactOut)
def get_contact(request, contact_id: int):
    contact = get_object_or_404(Contact, pk=contact_id)
    return contact


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/", response={201: ContactOut})
def create_contact(request, payload: ContactCreate):
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user
    contact = Contact(**data)
    contact.save()
    broadcast_crm_update("contact_created", "contact", contact.id)
    return 201, contact


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.patch("/{contact_id}", response=ContactOut)
def update_contact(request, contact_id: int, payload: ContactUpdate):
    contact = get_object_or_404(Contact, pk=contact_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(contact, attr, value)
    contact.modified_by = request.auth
    contact.save()
    broadcast_crm_update("contact_updated", "contact", contact.id)
    return contact


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{contact_id}", response={204: None})
def delete_contact(request, contact_id: int):
    contact = get_object_or_404(Contact, pk=contact_id)
    contact.delete()
    broadcast_crm_update("contact_deleted", "contact", contact_id)
    return 204, None


# ---------------------------------------------------------------------------
# Bulk Delete
# ---------------------------------------------------------------------------

@router.post("/bulk-delete", response={204: None})
def bulk_delete_contacts(request, ids: List[int]):
    Contact.objects.filter(id__in=ids).delete()
    return 204, None

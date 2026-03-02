from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from ninja import Query, Router, Schema

from apps.communication.services.status_change import log_status_change
from apps.crm.api.schemas import (
    DealOut,
    LeadCreate,
    LeadListFilter,
    LeadOut,
    LeadUpdate,
)
from apps.crm.api.schemas.product import LeadProductCreate, LeadProductOut
from apps.crm.models import Lead, LeadProduct, LeadStatus
from apps.crm.services.conversion import ConversionError, convert_lead_to_deal
from apps.realtime.utils import broadcast_crm_update

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response=Dict[str, Any])
def list_leads(
    request,
    filters: LeadListFilter = Query(...),
    order_by: str = "-updated_at",
    page: int = 1,
    page_size: int = 20,
):
    qs = Lead.objects.select_related(
        "status", "lead_owner", "source", "industry", "territory",
    ).all()

    # Apply FilterSchema fields (excludes 'search' which is custom).
    qs = filters.filter(qs)

    # Manual search across multiple fields.
    search = filters.search
    if search:
        qs = qs.filter(
            Q(lead_name__icontains=search)
            | Q(email__icontains=search)
            | Q(organization__icontains=search)
        )

    # Ordering
    allowed_order_fields = {
        "created_at", "-created_at",
        "updated_at", "-updated_at",
        "lead_name", "-lead_name",
        "email", "-email",
    }
    if order_by not in allowed_order_fields:
        order_by = "-updated_at"
    qs = qs.order_by(order_by)

    total = qs.count()
    offset = (page - 1) * page_size
    leads = qs[offset : offset + page_size]

    return {
        "results": [LeadOut.from_orm(lead) for lead in leads],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/", response={201: LeadOut})
def create_lead(request, payload: LeadCreate):
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user
    lead = Lead(**data)
    lead.save()
    broadcast_crm_update("lead_created", "lead", lead.id)
    return 201, lead


# ---------------------------------------------------------------------------
# Bulk Delete
# ---------------------------------------------------------------------------

@router.post("/bulk-delete", response={204: None})
def bulk_delete_leads(request, ids: List[int]):
    Lead.objects.filter(id__in=ids).delete()
    return 204, None


# ---------------------------------------------------------------------------
# Kanban  (must be before /{lead_id} to avoid route conflict)
# ---------------------------------------------------------------------------

@router.get("/kanban", response=Dict[str, Any])
def kanban_leads(
    request,
    column_field: str = "status",
    page_size: int = 20,
):
    """
    Returns leads grouped by a column field (default: status).
    For the status field, queries distinct LeadStatus records for the tenant
    and builds columns with matching leads.
    """
    columns: List[Dict[str, Any]] = []

    if column_field == "status":
        statuses = LeadStatus.objects.all().order_by("position")
        for status in statuses:
            leads_qs = (
                Lead.objects
                .select_related(
                    "status", "lead_owner", "source", "industry", "territory",
                )
                .filter(status=status)
            )
            count = leads_qs.count()
            items = [LeadOut.from_orm(lead) for lead in leads_qs[:page_size]]
            columns.append({
                "name": status.lead_status,
                "color": status.color,
                "count": count,
                "items": items,
            })
    else:
        # Generic grouping for other fields
        distinct_values = (
            Lead.objects
            .values_list(column_field, flat=True)
            .distinct()
            .order_by(column_field)
        )
        for value in distinct_values:
            leads_qs = (
                Lead.objects
                .select_related(
                    "status", "lead_owner", "source", "industry", "territory",
                )
                .filter(**{column_field: value})
            )
            count = leads_qs.count()
            items = [LeadOut.from_orm(lead) for lead in leads_qs[:page_size]]
            columns.append({
                "name": str(value) if value else "",
                "color": "",
                "count": count,
                "items": items,
            })

    return {"columns": columns}


# ---------------------------------------------------------------------------
# Group By  (must be before /{lead_id} to avoid route conflict)
# ---------------------------------------------------------------------------

@router.get("/group-by", response=Dict[str, Any])
def group_by_leads(
    request,
    group_by_field: str = "status",
    filters: LeadListFilter = Query(...),
    order_by: str = "-updated_at",
    page: int = 1,
    page_size: int = 20,
):
    """
    Returns leads with group_by aggregation.
    Provides group counts plus normal paginated results.
    """
    qs = Lead.objects.select_related(
        "status", "lead_owner", "source", "industry", "territory",
    ).all()

    # Apply FilterSchema fields
    qs = filters.filter(qs)

    # Manual search across multiple fields
    search = filters.search
    if search:
        qs = qs.filter(
            Q(lead_name__icontains=search)
            | Q(email__icontains=search)
            | Q(organization__icontains=search)
        )

    # Group counts
    groups = list(
        qs.values(group_by_field)
        .annotate(count=Count("id"))
        .order_by(group_by_field)
    )
    # Normalise keys: rename the group_by_field key to "value"
    groups = [
        {"value": g[group_by_field], "count": g["count"]}
        for g in groups
    ]

    # Ordering
    allowed_order_fields = {
        "created_at", "-created_at",
        "updated_at", "-updated_at",
        "lead_name", "-lead_name",
        "email", "-email",
    }
    if order_by not in allowed_order_fields:
        order_by = "-updated_at"
    qs = qs.order_by(order_by)

    total = qs.count()
    offset = (page - 1) * page_size
    leads = qs[offset : offset + page_size]

    return {
        "groups": groups,
        "results": [LeadOut.from_orm(lead) for lead in leads],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@router.get("/{lead_id}", response=LeadOut)
def get_lead(request, lead_id: int):
    lead = get_object_or_404(
        Lead.objects.select_related(
            "status", "lead_owner", "source", "industry", "territory",
        ),
        pk=lead_id,
    )
    return lead


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.patch("/{lead_id}", response=LeadOut)
def update_lead(request, lead_id: int, payload: LeadUpdate):
    lead = get_object_or_404(
        Lead.objects.select_related("status"), pk=lead_id
    )
    old_status = lead.status.lead_status if lead.status else ""

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(lead, attr, value)
    lead.modified_by = request.auth
    lead.save()

    # Re-fetch to get the potentially updated status FK
    lead = Lead.objects.select_related(
        "status", "lead_owner", "source", "industry", "territory",
    ).get(pk=lead.pk)
    new_status = lead.status.lead_status if lead.status else ""
    if old_status != new_status:
        log_status_change(lead, old_status, new_status, request.auth)

    broadcast_crm_update("lead_updated", "lead", lead.id)
    return lead


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{lead_id}", response={204: None})
def delete_lead(request, lead_id: int):
    lead = get_object_or_404(Lead, pk=lead_id)
    lead.delete()
    broadcast_crm_update("lead_deleted", "lead", lead_id)
    return 204, None


# ---------------------------------------------------------------------------
# Lead Products
# ---------------------------------------------------------------------------


@router.get("/{lead_id}/products", response=List[LeadProductOut])
def list_lead_products(request, lead_id: int):
    lead = get_object_or_404(Lead, pk=lead_id)
    return list(lead.products.select_related("product").all())


@router.post("/{lead_id}/products", response={201: LeadProductOut})
def add_lead_product(request, lead_id: int, payload: LeadProductCreate):
    lead = get_object_or_404(Lead, pk=lead_id)

    amount = Decimal(str(payload.qty)) * Decimal(str(payload.rate))
    discount_amount = amount * Decimal(str(payload.discount_percentage)) / Decimal("100")
    net_amount = amount - discount_amount

    lp = LeadProduct.objects.create(
        lead=lead,
        product_id=payload.product_id,
        product_name=payload.product_name,
        qty=payload.qty,
        rate=Decimal(str(payload.rate)),
        amount=amount,
        discount_percentage=Decimal(str(payload.discount_percentage)),
        discount_amount=discount_amount,
        net_amount=net_amount,
    )

    _recalculate_lead_totals(lead)
    return 201, lp


@router.delete("/{lead_id}/products/{product_id}", response={204: None})
def remove_lead_product(request, lead_id: int, product_id: int):
    lead = get_object_or_404(Lead, pk=lead_id)
    lp = get_object_or_404(LeadProduct, pk=product_id, lead=lead)
    lp.delete()
    _recalculate_lead_totals(lead)
    return 204, None


def _recalculate_lead_totals(lead: Lead) -> None:
    agg = lead.products.aggregate(
        total=Sum("amount"),
        net_total=Sum("net_amount"),
    )
    lead.total = agg["total"] or Decimal("0")
    lead.net_total = agg["net_total"] or Decimal("0")
    lead.save(update_fields=["total", "net_total", "updated_at"])


# ---------------------------------------------------------------------------
# Lead → Deal conversion
# ---------------------------------------------------------------------------


class ConvertLeadPayload(Schema):
    deal_value: Optional[float] = None
    expected_closure_date: Optional[date] = None
    status_id: Optional[int] = None


@router.post("/{lead_id}/convert", response={201: DealOut})
def convert_lead(request, lead_id: int, payload: ConvertLeadPayload = None):
    lead = get_object_or_404(
        Lead.objects.select_related(
            "status", "lead_owner", "source", "industry", "territory",
            "sla", "communication_status",
        ),
        pk=lead_id,
    )

    old_status = lead.status.lead_status if lead.status else ""

    # Build optional overrides
    deal_data: dict = {}
    if payload:
        if payload.deal_value is not None:
            deal_data["deal_value"] = payload.deal_value
        if payload.expected_closure_date is not None:
            deal_data["expected_closure_date"] = payload.expected_closure_date
        if payload.status_id is not None:
            from apps.crm.models import DealStatus

            deal_data["status"] = get_object_or_404(DealStatus, pk=payload.status_id)

    try:
        deal = convert_lead_to_deal(lead, deal_data=deal_data, user=request.auth)
    except ConversionError as exc:
        from ninja.errors import HttpError

        raise HttpError(400, str(exc))

    # Log status change if lead status changed
    lead.refresh_from_db()
    new_status = lead.status.lead_status if lead.status else ""
    if old_status != new_status:
        log_status_change(lead, old_status, new_status, request.auth)

    # Re-fetch deal with relations for serialization
    from apps.crm.models import Deal

    deal = Deal.objects.select_related(
        "status", "deal_owner", "source", "organization",
    ).get(pk=deal.pk)
    broadcast_crm_update("lead_converted", "lead", lead_id)
    return 201, deal

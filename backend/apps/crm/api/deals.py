from decimal import Decimal
from typing import Any, Dict, List

from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from ninja import Query, Router

from apps.communication.services.status_change import log_status_change
from apps.crm.api.schemas import DealCreate, DealListFilter, DealOut, DealUpdate
from apps.crm.api.schemas.product import DealProductCreate, DealProductOut
from apps.crm.models import Deal, DealProduct, DealStatus
from apps.realtime.utils import broadcast_crm_update

router = Router()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response=Dict[str, Any])
def list_deals(
    request,
    filters: DealListFilter = Query(...),
    order_by: str = "-updated_at",
    page: int = 1,
    page_size: int = 20,
):
    qs = Deal.objects.select_related(
        "status", "deal_owner", "source", "organization",
    ).all()

    # Apply FilterSchema fields (excludes 'search' which is custom).
    qs = filters.filter(qs)

    # Manual search across multiple fields.
    search = filters.search
    if search:
        qs = qs.filter(
            Q(organization_name__icontains=search)
            | Q(lead_name__icontains=search)
            | Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )

    # Ordering
    allowed_order_fields = {
        "created_at", "-created_at",
        "updated_at", "-updated_at",
        "deal_value", "-deal_value",
        "expected_closure_date", "-expected_closure_date",
    }
    if order_by not in allowed_order_fields:
        order_by = "-updated_at"
    qs = qs.order_by(order_by)

    total = qs.count()
    offset = (page - 1) * page_size
    deals = qs[offset : offset + page_size]

    return {
        "results": [DealOut.from_orm(deal) for deal in deals],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@router.get("/{deal_id}", response=DealOut)
def get_deal(request, deal_id: int):
    deal = get_object_or_404(
        Deal.objects.select_related(
            "status", "deal_owner", "source", "organization",
        ),
        pk=deal_id,
    )
    return deal


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/", response={201: DealOut})
def create_deal(request, payload: DealCreate):
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user
    deal = Deal(**data)
    deal.save()
    broadcast_crm_update("deal_created", "deal", deal.id)
    return 201, deal


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.patch("/{deal_id}", response=DealOut)
def update_deal(request, deal_id: int, payload: DealUpdate):
    deal = get_object_or_404(
        Deal.objects.select_related("status"), pk=deal_id
    )
    old_status = deal.status.deal_status if deal.status else ""

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(deal, attr, value)
    deal.modified_by = request.auth
    deal.save()

    # Re-fetch to get the potentially updated status FK
    deal = Deal.objects.select_related(
        "status", "deal_owner", "source", "organization",
    ).get(pk=deal.pk)
    new_status = deal.status.deal_status if deal.status else ""
    if old_status != new_status:
        log_status_change(deal, old_status, new_status, request.auth)

    broadcast_crm_update("deal_updated", "deal", deal.id)
    return deal


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/{deal_id}", response={204: None})
def delete_deal(request, deal_id: int):
    deal = get_object_or_404(Deal, pk=deal_id)
    deal.delete()
    broadcast_crm_update("deal_deleted", "deal", deal_id)
    return 204, None


# ---------------------------------------------------------------------------
# Bulk Delete
# ---------------------------------------------------------------------------

@router.post("/bulk-delete", response={204: None})
def bulk_delete_deals(request, ids: List[int]):
    Deal.objects.filter(id__in=ids).delete()
    return 204, None


# ---------------------------------------------------------------------------
# Kanban
# ---------------------------------------------------------------------------

@router.get("/kanban", response=Dict[str, Any])
def kanban_deals(
    request,
    column_field: str = "status",
    page_size: int = 20,
):
    """
    Returns deals grouped by a column field (default: status).
    For the status field, queries distinct DealStatus records for the tenant
    and builds columns with matching deals.
    """
    columns: List[Dict[str, Any]] = []

    if column_field == "status":
        statuses = DealStatus.objects.all().order_by("position")
        for status in statuses:
            deals_qs = (
                Deal.objects
                .select_related(
                    "status", "deal_owner", "source", "organization",
                )
                .filter(status=status)
            )
            count = deals_qs.count()
            items = [DealOut.from_orm(deal) for deal in deals_qs[:page_size]]
            columns.append({
                "name": status.deal_status,
                "color": status.color,
                "count": count,
                "items": items,
            })
    else:
        # Generic grouping for other fields
        distinct_values = (
            Deal.objects
            .values_list(column_field, flat=True)
            .distinct()
            .order_by(column_field)
        )
        for value in distinct_values:
            deals_qs = (
                Deal.objects
                .select_related(
                    "status", "deal_owner", "source", "organization",
                )
                .filter(**{column_field: value})
            )
            count = deals_qs.count()
            items = [DealOut.from_orm(deal) for deal in deals_qs[:page_size]]
            columns.append({
                "name": str(value) if value else "",
                "color": "",
                "count": count,
                "items": items,
            })

    return {"columns": columns}


# ---------------------------------------------------------------------------
# Group By
# ---------------------------------------------------------------------------

@router.get("/group-by", response=Dict[str, Any])
def group_by_deals(
    request,
    group_by_field: str = "status",
    filters: DealListFilter = Query(...),
    order_by: str = "-updated_at",
    page: int = 1,
    page_size: int = 20,
):
    """
    Returns deals with group_by aggregation.
    Provides group counts plus normal paginated results.
    """
    qs = Deal.objects.select_related(
        "status", "deal_owner", "source", "organization",
    ).all()

    # Apply FilterSchema fields
    qs = filters.filter(qs)

    # Manual search across multiple fields
    search = filters.search
    if search:
        qs = qs.filter(
            Q(organization_name__icontains=search)
            | Q(lead_name__icontains=search)
            | Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
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
        "deal_value", "-deal_value",
        "expected_closure_date", "-expected_closure_date",
    }
    if order_by not in allowed_order_fields:
        order_by = "-updated_at"
    qs = qs.order_by(order_by)

    total = qs.count()
    offset = (page - 1) * page_size
    deals = qs[offset : offset + page_size]

    return {
        "groups": groups,
        "results": [DealOut.from_orm(deal) for deal in deals],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------------------
# Deal Products
# ---------------------------------------------------------------------------


@router.get("/{deal_id}/products", response=List[DealProductOut])
def list_deal_products(request, deal_id: int):
    deal = get_object_or_404(Deal, pk=deal_id)
    return list(deal.products.select_related("product").all())


@router.post("/{deal_id}/products", response={201: DealProductOut})
def add_deal_product(request, deal_id: int, payload: DealProductCreate):
    deal = get_object_or_404(Deal, pk=deal_id)

    amount = Decimal(str(payload.qty)) * Decimal(str(payload.rate))
    discount_amount = amount * Decimal(str(payload.discount_percentage)) / Decimal("100")
    net_amount = amount - discount_amount

    dp = DealProduct.objects.create(
        deal=deal,
        product_id=payload.product_id,
        product_name=payload.product_name,
        qty=payload.qty,
        rate=Decimal(str(payload.rate)),
        amount=amount,
        discount_percentage=Decimal(str(payload.discount_percentage)),
        discount_amount=discount_amount,
        net_amount=net_amount,
    )

    _recalculate_deal_totals(deal)
    return 201, dp


@router.delete("/{deal_id}/products/{product_id}", response={204: None})
def remove_deal_product(request, deal_id: int, product_id: int):
    deal = get_object_or_404(Deal, pk=deal_id)
    dp = get_object_or_404(DealProduct, pk=product_id, deal=deal)
    dp.delete()
    _recalculate_deal_totals(deal)
    return 204, None


def _recalculate_deal_totals(deal: Deal) -> None:
    agg = deal.products.aggregate(
        total=Sum("amount"),
        net_total=Sum("net_amount"),
    )
    deal.deal_value = agg["total"] or Decimal("0")
    deal.save(update_fields=["deal_value", "updated_at"])

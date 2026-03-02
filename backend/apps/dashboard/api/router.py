from datetime import date, timedelta
from typing import Dict, List, Optional

from django.contrib.contenttypes.models import ContentType
from django.db.models import (
    Avg,
    Count,
    F,
    FloatField,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce, Concat, TruncDay, TruncMonth
from django.utils import timezone
from ninja import Router

from apps.communication.models import StatusChangeLog
from apps.crm.models import Deal, DealStatus, Lead
from apps.dashboard.api.schemas import (
    ChartDataPoint,
    DashboardResponse,
    ForecastPoint,
    NumberCardData,
    TimeSeriesPoint,
)

router = Router()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _default_dates(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> tuple[date, date]:
    """Return sensible defaults: first day of current month to today."""
    today = timezone.now().date()
    if not to_date:
        to_date = today
    if not from_date:
        from_date = today.replace(day=1)
    return from_date, to_date


def _previous_period(from_date: date, to_date: date) -> tuple[date, date]:
    """Compute a comparison period of equal length immediately before *from_date*."""
    delta = (to_date - from_date).days
    prev_to = from_date - timedelta(days=1)
    prev_from = prev_to - timedelta(days=delta)
    return prev_from, prev_to


def _calc_delta(current: float, previous: float) -> float:
    """Percentage change from *previous* to *current*, safely handling zeros."""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


# ---------------------------------------------------------------------------
# Number-card helpers
# ---------------------------------------------------------------------------


def get_total_leads(from_date: date, to_date: date) -> NumberCardData:
    """Count of leads created in the period."""
    current = Lead.objects.filter(
        created_at__date__gte=from_date,
        created_at__date__lte=to_date,
    ).count()

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = Lead.objects.filter(
        created_at__date__gte=prev_from,
        created_at__date__lte=prev_to,
    ).count()

    return NumberCardData(
        title="Total Leads",
        value=current,
        previous_value=previous,
        delta=_calc_delta(current, previous),
    )


def get_ongoing_deals(from_date: date, to_date: date) -> NumberCardData:
    """Deals whose status type is neither Won nor Lost (created in period)."""
    current = Deal.objects.filter(
        created_at__date__gte=from_date,
        created_at__date__lte=to_date,
    ).exclude(status__type__in=["Won", "Lost"]).count()

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = Deal.objects.filter(
        created_at__date__gte=prev_from,
        created_at__date__lte=prev_to,
    ).exclude(status__type__in=["Won", "Lost"]).count()

    return NumberCardData(
        title="Ongoing Deals",
        value=current,
        previous_value=previous,
        delta=_calc_delta(current, previous),
    )


def get_won_deals(from_date: date, to_date: date) -> NumberCardData:
    """Deals with status.type = Won and closed_date in [from_date, to_date]."""
    current = Deal.objects.filter(
        status__type="Won",
        closed_date__gte=from_date,
        closed_date__lte=to_date,
    ).count()

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = Deal.objects.filter(
        status__type="Won",
        closed_date__gte=prev_from,
        closed_date__lte=prev_to,
    ).count()

    return NumberCardData(
        title="Won Deals",
        value=current,
        previous_value=previous,
        delta=_calc_delta(current, previous),
    )


def get_average_deal_value(from_date: date, to_date: date) -> NumberCardData:
    """Average deal_value of ongoing + won deals created in the period."""
    qs = Deal.objects.filter(
        created_at__date__gte=from_date,
        created_at__date__lte=to_date,
    ).exclude(status__type="Lost")

    current = qs.aggregate(
        avg=Coalesce(Avg("deal_value"), 0.0, output_field=FloatField()),
    )["avg"]
    current = float(current)

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = (
        Deal.objects.filter(
            created_at__date__gte=prev_from,
            created_at__date__lte=prev_to,
        )
        .exclude(status__type="Lost")
        .aggregate(avg=Coalesce(Avg("deal_value"), 0.0, output_field=FloatField()))["avg"]
    )
    previous = float(previous)

    return NumberCardData(
        title="Average Deal Value",
        value=round(current, 2),
        previous_value=round(previous, 2),
        delta=_calc_delta(current, previous),
        prefix="$",
    )


def get_average_won_deal_value(from_date: date, to_date: date) -> NumberCardData:
    """Average deal_value of won deals closed in the period."""
    current = float(
        Deal.objects.filter(
            status__type="Won",
            closed_date__gte=from_date,
            closed_date__lte=to_date,
        ).aggregate(avg=Coalesce(Avg("deal_value"), 0.0, output_field=FloatField()))["avg"]
    )

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = float(
        Deal.objects.filter(
            status__type="Won",
            closed_date__gte=prev_from,
            closed_date__lte=prev_to,
        ).aggregate(avg=Coalesce(Avg("deal_value"), 0.0, output_field=FloatField()))["avg"]
    )

    return NumberCardData(
        title="Average Won Deal Value",
        value=round(current, 2),
        previous_value=round(previous, 2),
        delta=_calc_delta(current, previous),
        prefix="$",
    )


def get_total_deal_value(from_date: date, to_date: date) -> NumberCardData:
    """Sum of deal_value for won deals closed in the period."""
    current = float(
        Deal.objects.filter(
            status__type="Won",
            closed_date__gte=from_date,
            closed_date__lte=to_date,
        ).aggregate(total=Coalesce(Sum("deal_value"), 0.0, output_field=FloatField()))["total"]
    )

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = float(
        Deal.objects.filter(
            status__type="Won",
            closed_date__gte=prev_from,
            closed_date__lte=prev_to,
        ).aggregate(total=Coalesce(Sum("deal_value"), 0.0, output_field=FloatField()))["total"]
    )

    return NumberCardData(
        title="Total Deal Value",
        value=round(current, 2),
        previous_value=round(previous, 2),
        delta=_calc_delta(current, previous),
        prefix="$",
    )


def get_avg_time_to_close_lead(from_date: date, to_date: date) -> NumberCardData:
    """
    For leads converted in period, average days from lead.created_at
    to the first deal.created_at linked to that lead.
    """
    # Converted leads whose deals were created in the period
    converted_leads = Lead.objects.filter(
        converted=True,
        deals__created_at__date__gte=from_date,
        deals__created_at__date__lte=to_date,
    ).distinct()

    current = _avg_lead_close_days(converted_leads)

    prev_from, prev_to = _previous_period(from_date, to_date)
    prev_leads = Lead.objects.filter(
        converted=True,
        deals__created_at__date__gte=prev_from,
        deals__created_at__date__lte=prev_to,
    ).distinct()

    previous = _avg_lead_close_days(prev_leads)

    return NumberCardData(
        title="Avg. Time to Close Lead",
        value=round(current, 1),
        previous_value=round(previous, 1),
        delta=_calc_delta(current, previous),
        suffix=" days",
        negative_is_better=True,
    )


def _avg_lead_close_days(leads_qs) -> float:
    """Helper: average days between lead.created_at and its first deal.created_at."""
    from django.db.models import Min

    result = leads_qs.annotate(
        first_deal_date=Min("deals__created_at"),
    ).aggregate(
        avg_days=Avg(
            F("first_deal_date") - F("created_at"),
        ),
    )["avg_days"]

    if result is None:
        return 0.0
    # result is a timedelta
    return result.total_seconds() / 86400


def get_avg_time_to_close_deal(from_date: date, to_date: date) -> NumberCardData:
    """
    For deals closed (won) in the period, average days from
    deal.created_at to closed_date.
    """
    current = _avg_deal_close_days(from_date, to_date)

    prev_from, prev_to = _previous_period(from_date, to_date)
    previous = _avg_deal_close_days(prev_from, prev_to)

    return NumberCardData(
        title="Avg. Time to Close Deal",
        value=round(current, 1),
        previous_value=round(previous, 1),
        delta=_calc_delta(current, previous),
        suffix=" days",
        negative_is_better=True,
    )


def _avg_deal_close_days(from_date: date, to_date: date) -> float:
    """Helper: average days from created_at to closed_date for won deals."""
    deals = Deal.objects.filter(
        status__type="Won",
        closed_date__gte=from_date,
        closed_date__lte=to_date,
        closed_date__isnull=False,
    ).values_list("created_at", "closed_date")

    if not deals:
        return 0.0

    total_days = 0.0
    count = 0
    for created_at, closed_date in deals:
        delta = closed_date - created_at.date()
        total_days += delta.days
        count += 1

    return total_days / count if count else 0.0


# ---------------------------------------------------------------------------
# Chart helpers
# ---------------------------------------------------------------------------


def get_sales_pipeline(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """Bar chart: deals grouped by status (non-lost), ordered by position."""
    rows = (
        Deal.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
        )
        .exclude(status__type="Lost")
        .values(
            label=F("status__deal_status"),
            color=F("status__color"),
            position=F("status__position"),
        )
        .annotate(value=Count("id"))
        .order_by("position")
    )
    return [
        ChartDataPoint(label=r["label"], value=r["value"], color=r["color"])
        for r in rows
    ]


def get_leads_by_source(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """Donut chart: leads grouped by source_name."""
    rows = (
        Lead.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
            source__isnull=False,
        )
        .values(label=F("source__source_name"))
        .annotate(value=Count("id"))
        .order_by("-value")
    )
    return [ChartDataPoint(label=r["label"], value=r["value"]) for r in rows]


def get_deals_by_source(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """Donut chart: deals grouped by source_name."""
    rows = (
        Deal.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
            source__isnull=False,
        )
        .values(label=F("source__source_name"))
        .annotate(value=Count("id"))
        .order_by("-value")
    )
    return [ChartDataPoint(label=r["label"], value=r["value"]) for r in rows]


def get_funnel_conversion(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """
    Horizontal bar (funnel): total leads at top, then deal stages from
    StatusChangeLog to count how many leads/deals reached each DealStatus.
    """
    # Stage 1: total leads in period
    total_leads = Lead.objects.filter(
        created_at__date__gte=from_date,
        created_at__date__lte=to_date,
    ).count()

    result: list[ChartDataPoint] = [
        ChartDataPoint(label="Total Leads", value=total_leads),
    ]

    # Subsequent stages: each DealStatus ordered by position
    deal_statuses = DealStatus.objects.all().order_by("position")
    deal_ct = ContentType.objects.get_for_model(Deal)

    for ds in deal_statuses:
        count = StatusChangeLog.objects.filter(
            content_type=deal_ct,
            to_status=ds.deal_status,
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
        ).values("object_id").distinct().count()

        result.append(
            ChartDataPoint(
                label=ds.deal_status,
                value=count,
                color=ds.color,
            )
        )

    return result


def get_deals_by_territory(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """Bar chart: deals grouped by territory (count + sum of deal_value)."""
    rows = (
        Deal.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
            territory__isnull=False,
        )
        .values(label=F("territory__territory_name"))
        .annotate(
            value=Count("id"),
            value2=Coalesce(Sum("deal_value"), 0.0, output_field=FloatField()),
        )
        .order_by("-value")
    )
    return [
        ChartDataPoint(
            label=r["label"],
            value=r["value"],
            value2=float(r["value2"]),
        )
        for r in rows
    ]


def get_deals_by_salesperson(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """Bar chart: deals grouped by deal_owner (count + sum of deal_value)."""
    rows = (
        Deal.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
            deal_owner__isnull=False,
        )
        .annotate(
            owner_name=Concat(
                F("deal_owner__first_name"),
                Value(" "),
                F("deal_owner__last_name"),
            ),
        )
        .values("owner_name")
        .annotate(
            value=Count("id"),
            value2=Coalesce(Sum("deal_value"), 0.0, output_field=FloatField()),
        )
        .order_by("-value")
    )
    return [
        ChartDataPoint(
            label=r["owner_name"].strip(),
            value=r["value"],
            value2=float(r["value2"]),
        )
        for r in rows
    ]


def get_lost_deal_reasons(from_date: date, to_date: date) -> List[ChartDataPoint]:
    """Horizontal bar: lost deals grouped by lost_reason."""
    rows = (
        Deal.objects.filter(
            status__type="Lost",
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
            lost_reason__isnull=False,
        )
        .values(label=F("lost_reason__reason"))
        .annotate(value=Count("id"))
        .order_by("-value")
    )
    return [ChartDataPoint(label=r["label"], value=r["value"]) for r in rows]


def get_sales_trend(from_date: date, to_date: date) -> List[TimeSeriesPoint]:
    """
    Line chart (time series): new leads, new deals, won deals.
    If the period > 90 days group by month; otherwise group by day.
    """
    period_days = (to_date - from_date).days
    trunc_fn = TruncMonth if period_days > 90 else TruncDay
    fmt = "%Y-%m" if period_days > 90 else "%Y-%m-%d"

    # New leads by period
    lead_rows = (
        Lead.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
        )
        .annotate(period=trunc_fn("created_at"))
        .values("period")
        .annotate(count=Count("id"))
        .order_by("period")
    )
    lead_map: Dict[str, int] = {
        row["period"].strftime(fmt): row["count"] for row in lead_rows
    }

    # New deals by period
    deal_rows = (
        Deal.objects.filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
        )
        .annotate(period=trunc_fn("created_at"))
        .values("period")
        .annotate(count=Count("id"))
        .order_by("period")
    )
    deal_map: Dict[str, int] = {
        row["period"].strftime(fmt): row["count"] for row in deal_rows
    }

    # Won deals by period (using closed_date)
    won_rows = (
        Deal.objects.filter(
            status__type="Won",
            closed_date__gte=from_date,
            closed_date__lte=to_date,
        )
        .annotate(period=trunc_fn("closed_date"))
        .values("period")
        .annotate(count=Count("id"))
        .order_by("period")
    )
    won_map: Dict[str, int] = {
        row["period"].strftime(fmt): row["count"] for row in won_rows
    }

    # Build unified date list
    all_dates = sorted(set(lead_map) | set(deal_map) | set(won_map))

    return [
        TimeSeriesPoint(
            date=d,
            leads=lead_map.get(d, 0),
            deals=deal_map.get(d, 0),
            won_deals=won_map.get(d, 0),
        )
        for d in all_dates
    ]


def get_forecasted_revenue(from_date: date, to_date: date) -> List[ForecastPoint]:
    """
    Line chart: monthly forecast vs actual for the 12 months ending at to_date.
    Forecasted = sum(expected_deal_value * probability / 100) for ongoing deals.
    Actual = sum(deal_value) for won deals.
    """
    # Look back 12 months from to_date
    start = (to_date.replace(day=1) - timedelta(days=365)).replace(day=1)

    # Build month buckets
    months: list[str] = []
    cursor = start
    while cursor <= to_date:
        months.append(cursor.strftime("%Y-%m"))
        # Advance to next month
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)

    # Forecasted: ongoing deals (not Won, not Lost) by expected_closure_date month
    forecast_rows = (
        Deal.objects.filter(
            expected_closure_date__gte=start,
            expected_closure_date__lte=to_date,
        )
        .exclude(status__type__in=["Won", "Lost"])
        .annotate(month=TruncMonth("expected_closure_date"))
        .values("month")
        .annotate(
            total=Coalesce(
                Sum(F("expected_deal_value") * F("probability") / 100),
                0.0,
                output_field=FloatField(),
            ),
        )
        .order_by("month")
    )
    forecast_map: Dict[str, float] = {
        row["month"].strftime("%Y-%m"): float(row["total"])
        for row in forecast_rows
    }

    # Actual: won deals by closed_date month
    actual_rows = (
        Deal.objects.filter(
            status__type="Won",
            closed_date__gte=start,
            closed_date__lte=to_date,
        )
        .annotate(month=TruncMonth("closed_date"))
        .values("month")
        .annotate(total=Coalesce(Sum("deal_value"), 0.0, output_field=FloatField()))
        .order_by("month")
    )
    actual_map: Dict[str, float] = {
        row["month"].strftime("%Y-%m"): float(row["total"])
        for row in actual_rows
    }

    return [
        ForecastPoint(
            month=m,
            forecasted=round(forecast_map.get(m, 0.0), 2),
            actual=round(actual_map.get(m, 0.0), 2),
        )
        for m in months
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response=DashboardResponse)
def get_dashboard(
    request,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
):
    """Full dashboard payload: all number cards and charts."""
    from_date, to_date = _default_dates(from_date, to_date)
    return DashboardResponse(
        number_cards=_all_number_cards(from_date, to_date),
        charts=_all_charts(from_date, to_date),
    )


@router.get("/number-cards", response=List[NumberCardData])
def get_number_cards(
    request,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
):
    """All 8 number cards."""
    from_date, to_date = _default_dates(from_date, to_date)
    return _all_number_cards(from_date, to_date)


@router.get("/charts/{chart_name}")
def get_chart(
    request,
    chart_name: str,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
):
    """Data for a specific chart by name."""
    from_date, to_date = _default_dates(from_date, to_date)
    charts = _all_charts(from_date, to_date)
    if chart_name not in charts:
        return {"error": f"Unknown chart: {chart_name}"}
    return charts[chart_name]


# ---------------------------------------------------------------------------
# Aggregation helpers
# ---------------------------------------------------------------------------


def _all_number_cards(from_date: date, to_date: date) -> List[NumberCardData]:
    return [
        get_total_leads(from_date, to_date),
        get_ongoing_deals(from_date, to_date),
        get_won_deals(from_date, to_date),
        get_average_deal_value(from_date, to_date),
        get_average_won_deal_value(from_date, to_date),
        get_total_deal_value(from_date, to_date),
        get_avg_time_to_close_lead(from_date, to_date),
        get_avg_time_to_close_deal(from_date, to_date),
    ]


def _all_charts(from_date: date, to_date: date) -> dict:
    return {
        "sales_pipeline": [p.dict() for p in get_sales_pipeline(from_date, to_date)],
        "leads_by_source": [p.dict() for p in get_leads_by_source(from_date, to_date)],
        "deals_by_source": [p.dict() for p in get_deals_by_source(from_date, to_date)],
        "funnel_conversion": [
            p.dict() for p in get_funnel_conversion(from_date, to_date)
        ],
        "deals_by_territory": [
            p.dict() for p in get_deals_by_territory(from_date, to_date)
        ],
        "deals_by_salesperson": [
            p.dict() for p in get_deals_by_salesperson(from_date, to_date)
        ],
        "lost_deal_reasons": [
            p.dict() for p in get_lost_deal_reasons(from_date, to_date)
        ],
        "sales_trend": [p.dict() for p in get_sales_trend(from_date, to_date)],
        "forecasted_revenue": [
            p.dict() for p in get_forecasted_revenue(from_date, to_date)
        ],
    }

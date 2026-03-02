"""
SLA Engine — applies and evaluates Service Level Agreements on Leads/Deals.
"""

from __future__ import annotations

import operator
from datetime import date, datetime, time, timedelta
from typing import TYPE_CHECKING

from django.utils import timezone

if TYPE_CHECKING:
    from apps.crm.models import Lead, Deal

from apps.crm.models import ServiceDay, ServiceLevelAgreement, SLAPriority


# ── condition evaluation helpers ──────────────────────────────────────────

_OPS = {
    "=": operator.eq,
    "!=": operator.ne,
    ">": operator.gt,
    ">=": operator.ge,
    "<": operator.lt,
    "<=": operator.le,
    "like": lambda a, b: str(b).lower() in str(a).lower(),
    "not like": lambda a, b: str(b).lower() not in str(a).lower(),
    "in": lambda a, b: a in (b if isinstance(b, (list, tuple)) else [b]),
    "not in": lambda a, b: a not in (b if isinstance(b, (list, tuple)) else [b]),
    "is": lambda a, b: (a is None or a == "") if b == "empty" else (a is not None and a != ""),
}


def _evaluate_condition_json(
    condition_json: dict | list,
    entity,
) -> bool:
    """Evaluate a condition_json structure against an entity.

    Supported format (list of conditions):
        [
            {"field": "source__source_name", "operator": "=", "value": "Website"},
            {"field": "industry__industry_name", "operator": "!=", "value": ""},
        ]

    Or a dict with "conditions" key:
        {"conditions": [...]}

    All conditions are ANDed together.
    """
    if not condition_json:
        return True

    if isinstance(condition_json, dict):
        conditions = condition_json.get("conditions", [])
    elif isinstance(condition_json, list):
        conditions = condition_json
    else:
        return True

    if not conditions:
        return True

    for cond in conditions:
        field = cond.get("field", "")
        op_str = cond.get("operator", "=")
        expected = cond.get("value")

        # Resolve dotted / dunder field access on entity
        value = entity
        try:
            for part in field.replace(".", "__").split("__"):
                value = getattr(value, part, None)
                if value is None:
                    break
        except Exception:
            value = None

        op_func = _OPS.get(op_str, operator.eq)
        if not op_func(value, expected):
            return False

    return True


# ── public API ────────────────────────────────────────────────────────────


def get_applicable_sla(
    entity: "Lead | Deal",
    entity_type: str,
) -> ServiceLevelAgreement | None:
    """Find the best matching SLA for *entity* ('Lead' or 'Deal').

    Non-default SLAs whose condition matches come first; then the default SLA.
    """
    today = date.today()
    slas = (
        ServiceLevelAgreement.objects.filter(
            company=entity.company,
            apply_on=entity_type,
            enabled=True,
        )
        .prefetch_related("priorities", "working_hours")
        .order_by("is_default", "pk")
    )

    best: ServiceLevelAgreement | None = None

    for sla in slas:
        # Date-range gate
        if sla.start_date and today < sla.start_date:
            continue
        if sla.end_date and today > sla.end_date:
            continue

        if _evaluate_condition_json(sla.condition_json, entity):
            if not sla.is_default:
                return sla  # first non-default match wins
            if best is None:
                best = sla  # remember default as fallback

    return best


def apply_sla(
    entity: "Lead | Deal",
    sla: ServiceLevelAgreement,
) -> None:
    """Attach *sla* to *entity* and calculate the response deadline."""
    entity.sla = sla
    if not entity.sla_creation:
        entity.sla_creation = timezone.now()
    entity.response_by = calc_response_time(sla, entity.sla_creation)
    entity.sla_status = "First Response Due"
    entity.save(
        update_fields=[
            "sla",
            "sla_creation",
            "response_by",
            "sla_status",
            "updated_at",
        ]
    )


def calc_response_time(
    sla: ServiceLevelAgreement,
    start_time: datetime,
) -> datetime:
    """Calculate a deadline by adding the SLA response duration to *start_time*,
    counting only working hours and skipping holidays.

    Working hours come from ServiceDay records attached to the SLA.
    Holidays come from the linked HolidayList.
    """
    # Get response duration from first priority
    priority: SLAPriority | None = sla.priorities.first()
    if priority is None:
        # No priority defined — just add a default of 0
        return start_time
    remaining: timedelta = priority.response_time

    # Build working-hours map: day-name -> list of (start, end)
    working_hours: dict[str, list[tuple[time, time]]] = {}
    for sd in sla.working_hours.all():
        working_hours.setdefault(sd.day, []).append((sd.start_time, sd.end_time))

    # Build holidays set
    holiday_dates: set[date] = set()
    if sla.holiday_list_id:
        holiday_dates = set(
            sla.holiday_list.holidays.values_list("date", flat=True)
        )

    # Day-name mapping (Python weekday 0=Monday)
    _DAY_NAMES = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
    ]

    cursor = start_time
    max_iterations = 366 * 2  # safety

    for _ in range(max_iterations):
        if remaining <= timedelta(0):
            break

        cursor_date = cursor.date()
        day_name = _DAY_NAMES[cursor_date.weekday()]

        # Skip holidays
        if cursor_date in holiday_dates:
            cursor = datetime.combine(
                cursor_date + timedelta(days=1),
                time(0, 0),
                tzinfo=cursor.tzinfo,
            )
            continue

        # Get working windows for this day
        windows = working_hours.get(day_name)
        if not windows:
            # Non-working day
            cursor = datetime.combine(
                cursor_date + timedelta(days=1),
                time(0, 0),
                tzinfo=cursor.tzinfo,
            )
            continue

        # Sort windows by start_time
        windows = sorted(windows, key=lambda w: w[0])

        advanced = False
        for win_start, win_end in windows:
            win_start_dt = datetime.combine(cursor_date, win_start, tzinfo=cursor.tzinfo)
            win_end_dt = datetime.combine(cursor_date, win_end, tzinfo=cursor.tzinfo)

            if cursor >= win_end_dt:
                continue  # already past this window

            effective_start = max(cursor, win_start_dt)
            available = win_end_dt - effective_start

            if available <= timedelta(0):
                continue

            if remaining <= available:
                cursor = effective_start + remaining
                remaining = timedelta(0)
                advanced = True
                break
            else:
                remaining -= available
                cursor = win_end_dt
                advanced = True

        if remaining <= timedelta(0):
            break

        if not advanced or cursor.time() >= windows[-1][1]:
            # Move to next day
            cursor = datetime.combine(
                cursor_date + timedelta(days=1),
                time(0, 0),
                tzinfo=cursor.tzinfo,
            )

    return cursor


def check_sla_status(entity: "Lead | Deal") -> str:
    """Determine the current SLA status for *entity*."""
    if not entity.sla_id:
        return ""
    if entity.first_responded_on:
        if entity.response_by and entity.first_responded_on <= entity.response_by:
            return "Fulfilled"
        return "Failed"
    if entity.response_by and timezone.now() > entity.response_by:
        return "Failed"
    return "First Response Due"


def handle_communication_status_change(
    entity: "Lead | Deal",
    old_status,
    new_status,
) -> None:
    """Called when the communication_status FK changes on a Lead or Deal.

    Records the first-response timestamp and recalculates the SLA status.
    """
    if entity.first_responded_on is None:
        now = timezone.now()
        entity.first_responded_on = now

        # Calculate working-seconds elapsed from sla_creation to now
        if entity.sla_creation:
            entity.first_response_time = now - entity.sla_creation

    entity.last_responded_on = timezone.now()
    if entity.sla_creation:
        entity.last_response_time = timezone.now() - entity.sla_creation

    entity.sla_status = check_sla_status(entity)
    entity.save(
        update_fields=[
            "first_responded_on",
            "first_response_time",
            "last_responded_on",
            "last_response_time",
            "sla_status",
            "updated_at",
        ]
    )

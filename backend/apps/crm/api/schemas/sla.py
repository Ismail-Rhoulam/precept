from datetime import date, datetime, time
from typing import List, Optional

from ninja import Schema


# ---------------------------------------------------------------------------
# Child schemas — output
# ---------------------------------------------------------------------------


class SLAPriorityOut(Schema):
    id: int
    priority: str
    response_time_seconds: float = 0

    @staticmethod
    def resolve_response_time_seconds(obj) -> float:
        if obj.response_time is not None:
            return obj.response_time.total_seconds()
        return 0


class ServiceDayOut(Schema):
    id: int
    day: str
    start_time: time
    end_time: time


# ---------------------------------------------------------------------------
# Main SLA — output
# ---------------------------------------------------------------------------


class SLAOut(Schema):
    id: int
    sla_name: str
    apply_on: str
    enabled: bool
    is_default: bool
    rolling_responses: bool
    condition: str = ""
    condition_json: dict | list | None = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    holiday_list_name: Optional[str] = None
    priorities: List[SLAPriorityOut] = []
    working_hours: List[ServiceDayOut] = []
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_holiday_list_name(obj) -> Optional[str]:
        return obj.holiday_list.list_name if obj.holiday_list_id else None

    @staticmethod
    def resolve_priorities(obj) -> list:
        return list(obj.priorities.all())

    @staticmethod
    def resolve_working_hours(obj) -> list:
        return list(obj.working_hours.all())


# ---------------------------------------------------------------------------
# Child schemas — input
# ---------------------------------------------------------------------------


class SLAPriorityCreate(Schema):
    priority: str
    response_time_seconds: float  # seconds — converted to timedelta in the view


class ServiceDayCreate(Schema):
    day: str
    start_time: time
    end_time: time


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------


class SLACreate(Schema):
    sla_name: str
    apply_on: str
    enabled: bool = False
    is_default: bool = False
    rolling_responses: bool = False
    condition: str = ""
    condition_json: dict | list | None = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    holiday_list_id: Optional[int] = None
    priorities: List[SLAPriorityCreate] = []
    working_hours: List[ServiceDayCreate] = []


class SLAUpdate(Schema):
    sla_name: Optional[str] = None
    apply_on: Optional[str] = None
    enabled: Optional[bool] = None
    is_default: Optional[bool] = None
    rolling_responses: Optional[bool] = None
    condition: Optional[str] = None
    condition_json: Optional[dict | list] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    holiday_list_id: Optional[int] = None
    priorities: Optional[List[SLAPriorityCreate]] = None
    working_hours: Optional[List[ServiceDayCreate]] = None

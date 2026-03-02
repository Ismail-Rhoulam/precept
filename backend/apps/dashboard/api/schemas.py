from typing import List, Optional

from ninja import Schema


class NumberCardData(Schema):
    title: str
    value: float
    previous_value: float
    delta: float  # percentage change from previous period
    prefix: str = ""  # e.g. "$"
    suffix: str = ""  # e.g. " days"
    negative_is_better: bool = False


class ChartDataPoint(Schema):
    label: str
    value: float
    value2: Optional[float] = None  # for dual-axis charts
    color: Optional[str] = None


class TimeSeriesPoint(Schema):
    date: str
    leads: int = 0
    deals: int = 0
    won_deals: int = 0


class ForecastPoint(Schema):
    month: str
    forecasted: float = 0
    actual: float = 0


class DashboardResponse(Schema):
    number_cards: List[NumberCardData]
    charts: dict  # keyed by chart name

from datetime import date, datetime
from typing import Optional

from ninja import Field, FilterSchema, Schema


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class DealOut(Schema):
    id: int
    reference_id: str
    organization_name: str = ""
    status: str = ""
    status_color: str = ""
    deal_owner_email: Optional[str] = None
    deal_owner_name: Optional[str] = None
    deal_value: float = 0
    probability: float = 0
    expected_closure_date: Optional[date] = None
    currency: str = "USD"
    lead_name: str = ""
    source: Optional[str] = None
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    mobile_no: str = ""
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_status(obj) -> str:
        return obj.status.deal_status if obj.status_id else ""

    @staticmethod
    def resolve_status_color(obj) -> str:
        return obj.status.color if obj.status_id else ""

    @staticmethod
    def resolve_deal_owner_email(obj) -> Optional[str]:
        return obj.deal_owner.email if obj.deal_owner_id else None

    @staticmethod
    def resolve_deal_owner_name(obj) -> Optional[str]:
        if obj.deal_owner_id:
            owner = obj.deal_owner
            return f"{owner.first_name} {owner.last_name}".strip()
        return None

    @staticmethod
    def resolve_source(obj) -> Optional[str]:
        return obj.source.source_name if obj.source_id else None

    @staticmethod
    def resolve_deal_value(obj) -> float:
        return float(obj.deal_value)

    @staticmethod
    def resolve_probability(obj) -> float:
        return float(obj.probability)


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class DealCreate(Schema):
    organization_id: Optional[int] = None
    status_id: Optional[int] = None
    deal_owner_id: Optional[int] = None
    deal_value: float = 0
    probability: float = 0
    expected_closure_date: Optional[date] = None
    currency: str = "USD"
    source_id: Optional[int] = None
    first_name: str = ""
    last_name: str = ""
    email: str = ""


class DealUpdate(Schema):
    organization_id: Optional[int] = None
    status_id: Optional[int] = None
    deal_owner_id: Optional[int] = None
    deal_value: Optional[float] = None
    probability: Optional[float] = None
    expected_closure_date: Optional[date] = None
    currency: Optional[str] = None
    source_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    mobile_no: Optional[str] = None
    organization_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------

class DealListFilter(FilterSchema):
    status_id: Optional[int] = None
    deal_owner_id: Optional[int] = None
    source_id: Optional[int] = None
    organization_id: Optional[int] = None
    search: Optional[str] = Field(None, q=[])

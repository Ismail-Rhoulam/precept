from datetime import datetime
from typing import Optional

from ninja import Field, FilterSchema, Schema


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class LeadOut(Schema):
    id: int
    reference_id: str
    salutation: str = ""
    first_name: str
    middle_name: str = ""
    last_name: str = ""
    lead_name: str = ""
    email: str = ""
    mobile_no: str = ""
    phone: str = ""
    organization: str = ""
    website: str = ""
    job_title: str = ""
    status: str = ""
    status_color: str = ""
    lead_owner_email: Optional[str] = None
    lead_owner_name: Optional[str] = None
    source: Optional[str] = None
    industry: Optional[str] = None
    territory: Optional[str] = None
    converted: bool = False
    sla_status: str = ""
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_status(obj) -> str:
        return obj.status.lead_status if obj.status_id else ""

    @staticmethod
    def resolve_status_color(obj) -> str:
        return obj.status.color if obj.status_id else ""

    @staticmethod
    def resolve_lead_owner_email(obj) -> Optional[str]:
        return obj.lead_owner.email if obj.lead_owner_id else None

    @staticmethod
    def resolve_lead_owner_name(obj) -> Optional[str]:
        if obj.lead_owner_id:
            owner = obj.lead_owner
            return f"{owner.first_name} {owner.last_name}".strip()
        return None

    @staticmethod
    def resolve_source(obj) -> Optional[str]:
        return obj.source.source_name if obj.source_id else None

    @staticmethod
    def resolve_industry(obj) -> Optional[str]:
        return obj.industry.industry_name if obj.industry_id else None

    @staticmethod
    def resolve_territory(obj) -> Optional[str]:
        return obj.territory.territory_name if obj.territory_id else None


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class LeadCreate(Schema):
    first_name: str
    last_name: str = ""
    email: str = ""
    mobile_no: str = ""
    organization: str = ""
    status_id: Optional[int] = None
    lead_owner_id: Optional[int] = None
    source_id: Optional[int] = None
    industry_id: Optional[int] = None
    territory_id: Optional[int] = None


class LeadUpdate(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    mobile_no: Optional[str] = None
    organization: Optional[str] = None
    status_id: Optional[int] = None
    lead_owner_id: Optional[int] = None
    source_id: Optional[int] = None
    industry_id: Optional[int] = None
    territory_id: Optional[int] = None
    salutation: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    job_title: Optional[str] = None
    converted: Optional[bool] = None


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------

class LeadListFilter(FilterSchema):
    status_id: Optional[int] = None
    lead_owner_id: Optional[int] = None
    source_id: Optional[int] = None
    territory_id: Optional[int] = None
    industry_id: Optional[int] = None
    converted: Optional[bool] = None
    search: Optional[str] = Field(None, q=[])

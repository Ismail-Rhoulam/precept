from datetime import datetime
from typing import Optional

from ninja import Schema


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class OrganizationOut(Schema):
    id: int
    organization_name: str
    website: str = ""
    no_of_employees: str = ""
    annual_revenue: float = 0
    industry: Optional[str] = None
    territory: Optional[str] = None
    currency: str = "USD"
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_industry(obj) -> Optional[str]:
        return obj.industry.industry_name if obj.industry_id else None

    @staticmethod
    def resolve_territory(obj) -> Optional[str]:
        return obj.territory.territory_name if obj.territory_id else None

    @staticmethod
    def resolve_annual_revenue(obj) -> float:
        return float(obj.annual_revenue)


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class OrganizationCreate(Schema):
    organization_name: str
    website: str = ""
    no_of_employees: str = ""
    annual_revenue: float = 0
    industry_id: Optional[int] = None
    territory_id: Optional[int] = None
    currency: str = "USD"


class OrganizationUpdate(Schema):
    organization_name: Optional[str] = None
    website: Optional[str] = None
    no_of_employees: Optional[str] = None
    annual_revenue: Optional[float] = None
    industry_id: Optional[int] = None
    territory_id: Optional[int] = None
    currency: Optional[str] = None

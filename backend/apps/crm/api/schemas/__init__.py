from apps.crm.api.schemas.lead import (
    LeadCreate,
    LeadListFilter,
    LeadOut,
    LeadUpdate,
)
from apps.crm.api.schemas.deal import (
    DealCreate,
    DealListFilter,
    DealOut,
    DealUpdate,
)
from apps.crm.api.schemas.organization import (
    OrganizationCreate,
    OrganizationOut,
    OrganizationUpdate,
)
from apps.crm.api.schemas.contact import (
    ContactCreate,
    ContactOut,
    ContactUpdate,
)
from apps.crm.api.schemas.sla import (
    SLACreate,
    SLAOut,
    SLAPriorityOut,
    SLAUpdate,
    ServiceDayOut,
)
from apps.crm.api.schemas.product import (
    DealProductCreate,
    DealProductOut,
    LeadProductCreate,
    LeadProductOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)

__all__ = [
    # Lead
    "LeadOut",
    "LeadCreate",
    "LeadUpdate",
    "LeadListFilter",
    # Deal
    "DealOut",
    "DealCreate",
    "DealUpdate",
    "DealListFilter",
    # Organization
    "OrganizationOut",
    "OrganizationCreate",
    "OrganizationUpdate",
    # Contact
    "ContactOut",
    "ContactCreate",
    "ContactUpdate",
    # SLA
    "SLAOut",
    "SLACreate",
    "SLAUpdate",
    "SLAPriorityOut",
    "ServiceDayOut",
    # Product
    "ProductOut",
    "ProductCreate",
    "ProductUpdate",
    "LeadProductOut",
    "LeadProductCreate",
    "DealProductOut",
    "DealProductCreate",
]

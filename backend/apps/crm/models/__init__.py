from apps.crm.models.status import (
    CommunicationStatus,
    DealStatus,
    LeadStatus,
    LostReason,
)
from apps.crm.models.classification import Industry, LeadSource, Territory
from apps.crm.models.organization import Organization
from apps.crm.models.contact import Contact
from apps.crm.models.product import Product
from apps.crm.models.lead import Lead, LeadProduct
from apps.crm.models.deal import Deal, DealContact, DealProduct
from apps.crm.models.sla import ServiceDay, ServiceLevelAgreement, SLAPriority

__all__ = [
    # Status
    "LeadStatus",
    "DealStatus",
    "CommunicationStatus",
    "LostReason",
    # Classification
    "LeadSource",
    "Industry",
    "Territory",
    # Organization
    "Organization",
    # Contact
    "Contact",
    # Product
    "Product",
    # Lead
    "Lead",
    "LeadProduct",
    # Deal
    "Deal",
    "DealContact",
    "DealProduct",
    # SLA
    "ServiceLevelAgreement",
    "SLAPriority",
    "ServiceDay",
]

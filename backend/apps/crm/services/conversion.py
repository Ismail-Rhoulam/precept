"""
Lead-to-Deal conversion logic.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import transaction

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser

from apps.crm.models import (
    Contact,
    Deal,
    DealContact,
    DealStatus,
    Lead,
    Organization,
)


class ConversionError(Exception):
    """Raised when a lead cannot be converted."""


@transaction.atomic
def convert_lead_to_deal(
    lead: Lead,
    deal_data: dict[str, Any] | None = None,
    user: "AbstractBaseUser | None" = None,
) -> Deal:
    """Convert a Lead into a Deal.

    Steps:
        1. Validate lead is not already converted.
        2. Find or create Contact from lead.
        3. Find or create Organization from lead.organization.
        4. Create Deal with fields copied from lead.
        5. Create DealContact linking the new deal to the contact.
        6. Set deal.contact as the primary contact.
        7. Mark lead.converted = True.
    """
    # 1. Validate
    if lead.converted:
        raise ConversionError("Lead has already been converted.")

    company = lead.company
    deal_data = deal_data or {}

    # 2. Find or create Contact
    contact = _find_or_create_contact(lead, company, user)

    # 3. Find or create Organization
    org = _find_or_create_organization(lead, company, user)

    # 4. Create Deal
    first_status = DealStatus.objects.filter(company=company).order_by("position").first()
    if first_status is None:
        raise ConversionError(
            "No DealStatus records exist for this company. Cannot create a Deal."
        )

    deal_kwargs: dict[str, Any] = {
        "company": company,
        "lead": lead,
        "lead_name": lead.lead_name,
        "organization": org,
        "organization_name": org.organization_name if org else lead.organization,
        "status": first_status,
        # Copy from lead
        "deal_owner": lead.lead_owner,
        "source": lead.source,
        "territory": lead.territory,
        "industry": lead.industry,
        "website": lead.website,
        "no_of_employees": lead.no_of_employees,
        "job_title": lead.job_title,
        # Person fields from lead
        "salutation": lead.salutation,
        "first_name": lead.first_name,
        "last_name": lead.last_name,
        "email": lead.email,
        "mobile_no": lead.mobile_no,
        "phone": lead.phone,
        "gender": lead.gender,
        # Audit
        "created_by": user,
        "modified_by": user,
    }

    # Copy SLA state if lead has been responded to
    if lead.first_responded_on:
        deal_kwargs.update(
            {
                "sla": lead.sla,
                "sla_creation": lead.sla_creation,
                "response_by": lead.response_by,
                "sla_status": lead.sla_status,
                "communication_status": lead.communication_status,
                "first_response_time": lead.first_response_time,
                "first_responded_on": lead.first_responded_on,
            }
        )

    # Override with caller-supplied deal_data
    deal_kwargs.update(deal_data)

    deal = Deal(**deal_kwargs)
    deal.save()

    # 5. Create DealContact
    DealContact.objects.create(deal=deal, contact=contact, is_primary=True)

    # 6. Set primary contact
    deal.contact = contact
    deal.save(update_fields=["contact"])

    # 7. Mark lead as converted
    lead.converted = True
    lead.save(update_fields=["converted", "updated_at"])

    return deal


# ── helpers ───────────────────────────────────────────────────────────────


def _find_or_create_contact(
    lead: Lead,
    company,
    user,
) -> Contact:
    """Find an existing contact by email or create a new one from the lead."""
    if lead.email:
        existing = Contact.objects.filter(
            company=company, email_id=lead.email
        ).first()
        if existing:
            return existing

    contact = Contact(
        company=company,
        first_name=lead.first_name,
        last_name=lead.last_name,
        email_id=lead.email,
        mobile_no=lead.mobile_no,
        phone=lead.phone,
        gender=lead.gender,
        salutation=lead.salutation,
        company_name=lead.organization,
        designation=lead.job_title,
        created_by=user,
        modified_by=user,
    )
    contact.save()
    return contact


def _find_or_create_organization(
    lead: Lead,
    company,
    user,
) -> Organization | None:
    """Find an existing organization by name or create one from lead data."""
    if not lead.organization:
        return None

    existing = Organization.objects.filter(
        company=company, organization_name=lead.organization
    ).first()
    if existing:
        return existing

    org = Organization(
        company=company,
        organization_name=lead.organization,
        website=lead.website,
        territory=lead.territory,
        industry=lead.industry,
        annual_revenue=lead.annual_revenue,
        created_by=user,
        modified_by=user,
    )
    org.save()
    return org

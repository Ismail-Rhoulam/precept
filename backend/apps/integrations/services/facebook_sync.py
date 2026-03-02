import json
import logging

import requests
from django.utils import timezone

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


def sync_leads_from_facebook(sync_source):
    """Pull leads from Facebook Lead Ads API and create CRM Leads."""
    url = f"{GRAPH_API_BASE}/{sync_source.facebook_form_id}/leads"
    params = {
        "access_token": sync_source.access_token,
        "fields": "id,created_time,field_data",
        "limit": 1000,
    }
    if sync_source.last_synced_at:
        params["filtering"] = json.dumps(
            [
                {
                    "field": "time_created",
                    "operator": "GREATER_THAN",
                    "value": int(sync_source.last_synced_at.timestamp()),
                }
            ]
        )

    response = requests.get(url, params=params)
    response.raise_for_status()
    leads_data = response.json().get("data", [])

    created_count = 0
    for fb_lead in leads_data:
        if _create_lead_from_facebook(fb_lead, sync_source):
            created_count += 1

    sync_source.last_synced_at = timezone.now()
    sync_source.save(update_fields=["last_synced_at"])

    logger.info(
        "Facebook sync for source '%s': %d leads created from %d fetched",
        sync_source.name,
        created_count,
        len(leads_data),
    )
    return created_count


def _create_lead_from_facebook(fb_lead, sync_source):
    """Map Facebook lead data to CRM Lead fields and create."""
    from apps.crm.models import Lead, LeadSource, LeadStatus

    # Check for duplicate
    fb_id = fb_lead.get("id")
    if Lead.objects.filter(facebook_lead_id=fb_id).exists():
        return False

    # Map fields
    field_data = {
        item["name"]: item["values"][0]
        for item in fb_lead.get("field_data", [])
        if item.get("values")
    }
    mapping = sync_source.field_mapping or {}

    lead_data = {}
    for fb_field, crm_field in mapping.items():
        if fb_field in field_data:
            lead_data[crm_field] = field_data[fb_field]

    # Set defaults
    lead_data["facebook_lead_id"] = fb_id
    lead_data["facebook_form_id"] = sync_source.facebook_form_id
    lead_data["company"] = sync_source.company

    # Set default status
    default_status = (
        LeadStatus.objects.filter(company=sync_source.company)
        .order_by("position")
        .first()
    )
    if default_status:
        lead_data["status"] = default_status

    # Set source to Facebook if exists
    fb_source = LeadSource.objects.filter(
        company=sync_source.company, source_name="Facebook"
    ).first()
    if fb_source:
        lead_data["source"] = fb_source

    if "first_name" not in lead_data:
        lead_data["first_name"] = "Facebook Lead"

    Lead.objects.create(**lead_data)
    return True


def fetch_facebook_pages(access_token):
    """Fetch Facebook pages for the given access token."""
    url = f"{GRAPH_API_BASE}/me/accounts"
    params = {
        "access_token": access_token,
        "fields": "id,name,category,access_token",
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json().get("data", [])


def fetch_facebook_forms(page_id, access_token):
    """Fetch lead forms for a Facebook page."""
    url = f"{GRAPH_API_BASE}/{page_id}/leadgen_forms"
    params = {
        "access_token": access_token,
        "fields": "id,name,questions",
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json().get("data", [])

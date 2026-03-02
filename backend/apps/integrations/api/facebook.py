import logging
from typing import Any, Dict, List

from django.shortcuts import get_object_or_404
from ninja import Router

from apps.integrations.api.schemas import (
    FacebookFetchFormsIn,
    FacebookFetchPagesIn,
    FacebookFormOut,
    FacebookPageOut,
    LeadSyncSourceCreate,
    LeadSyncSourceOut,
    LeadSyncSourceUpdate,
)
from apps.integrations.models import LeadSyncSource
from apps.integrations.services.facebook_sync import (
    fetch_facebook_forms,
    fetch_facebook_pages,
    sync_leads_from_facebook,
)

logger = logging.getLogger(__name__)

router = Router()


# ---------------------------------------------------------------------------
# Sync Sources CRUD
# ---------------------------------------------------------------------------


@router.get("/sync-sources", response=List[LeadSyncSourceOut])
def list_sync_sources(request):
    """List all lead sync sources for the current tenant."""
    sources = LeadSyncSource.objects.all()
    return list(sources)


@router.post("/sync-sources", response={201: LeadSyncSourceOut})
def create_sync_source(request, payload: LeadSyncSourceCreate):
    """Create a new lead sync source."""
    user = request.auth
    data = payload.dict()
    data["company"] = request.company
    data["created_by"] = user
    data["modified_by"] = user
    source = LeadSyncSource.objects.create(**data)
    return 201, source


@router.patch("/sync-sources/{source_id}", response=LeadSyncSourceOut)
def update_sync_source(request, source_id: int, payload: LeadSyncSourceUpdate):
    """Update a lead sync source."""
    source = get_object_or_404(LeadSyncSource, pk=source_id)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(source, attr, value)
    source.modified_by = request.auth
    source.save()
    return source


@router.delete("/sync-sources/{source_id}", response={204: None})
def delete_sync_source(request, source_id: int):
    """Delete a lead sync source."""
    source = get_object_or_404(LeadSyncSource, pk=source_id)
    source.delete()
    return 204, None


# ---------------------------------------------------------------------------
# Manual Sync
# ---------------------------------------------------------------------------


@router.post("/sync-sources/{source_id}/sync")
def trigger_sync(request, source_id: int):
    """Trigger a manual sync for a lead sync source."""
    source = get_object_or_404(LeadSyncSource, pk=source_id)
    if not source.enabled:
        return {"error": "Sync source is not enabled", "created_count": 0}

    try:
        created_count = sync_leads_from_facebook(source)
        return {"status": "ok", "created_count": created_count}
    except Exception as e:
        logger.error("Facebook sync failed for source %s: %s", source.name, str(e))
        return {"status": "error", "error": str(e), "created_count": 0}


# ---------------------------------------------------------------------------
# Facebook Helpers
# ---------------------------------------------------------------------------


@router.post("/fetch-pages", response=List[FacebookPageOut])
def fetch_pages(request, payload: FacebookFetchPagesIn):
    """Fetch Facebook pages for the given access token."""
    try:
        pages = fetch_facebook_pages(payload.access_token)
        return pages
    except Exception as e:
        logger.error("Failed to fetch Facebook pages: %s", str(e))
        return []


@router.post("/fetch-forms", response=List[FacebookFormOut])
def fetch_forms(request, payload: FacebookFetchFormsIn):
    """Fetch lead forms for a Facebook page."""
    try:
        forms = fetch_facebook_forms(payload.page_id, payload.access_token)
        return forms
    except Exception as e:
        logger.error("Failed to fetch Facebook forms: %s", str(e))
        return []

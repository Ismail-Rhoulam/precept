from ninja import Router

from apps.integrations.api.schemas import CRMSettingsOut, CRMSettingsUpdate
from apps.settings.models import CRMSettings

router = Router()


# ---------------------------------------------------------------------------
# CRM Settings (singleton per tenant, upsert pattern)
# ---------------------------------------------------------------------------


@router.get("/", response=CRMSettingsOut)
def get_crm_settings(request):
    """Get CRM settings for the current tenant. Creates if not exists."""
    settings, _ = CRMSettings.objects.get_or_create(
        company=request.company,
    )
    return settings


@router.patch("/", response=CRMSettingsOut)
def update_crm_settings(request, payload: CRMSettingsUpdate):
    """Update CRM settings for the current tenant."""
    settings, _ = CRMSettings.objects.get_or_create(
        company=request.company,
    )
    data = payload.dict(exclude_unset=True)

    # Handle time fields that come as strings
    if "default_all_day_event_start_time" in data:
        val = data.pop("default_all_day_event_start_time")
        if val:
            from datetime import time

            parts = val.split(":")
            settings.default_all_day_event_start_time = time(
                int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
            )
        else:
            settings.default_all_day_event_start_time = None

    if "default_all_day_event_end_time" in data:
        val = data.pop("default_all_day_event_end_time")
        if val:
            from datetime import time

            parts = val.split(":")
            settings.default_all_day_event_end_time = time(
                int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
            )
        else:
            settings.default_all_day_event_end_time = None

    for attr, value in data.items():
        setattr(settings, attr, value)

    settings.save()
    return settings

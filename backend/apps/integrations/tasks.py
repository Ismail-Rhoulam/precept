import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def sync_leads_from_sources(frequency_label):
    from apps.integrations.models import LeadSyncSource
    from apps.integrations.services.facebook_sync import sync_leads_from_facebook

    sources = LeadSyncSource.objects.filter(
        enabled=True,
        sync_frequency=frequency_label,
    )
    total = 0
    for source in sources:
        try:
            count = sync_leads_from_facebook(source)
            total += count
            logger.info("Synced %d leads from %s", count, source.name)
        except Exception:
            logger.exception("Failed to sync from %s", source.name)
    return total

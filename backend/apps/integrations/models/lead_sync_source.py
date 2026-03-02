from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class LeadSyncSource(TenantMixin, TimestampMixin):
    class SourceType(models.TextChoices):
        FACEBOOK = "Facebook", "Facebook"

    class SyncFrequency(models.TextChoices):
        EVERY_5_MIN = "Every 5 minutes", "Every 5 minutes"
        EVERY_15_MIN = "Every 15 minutes", "Every 15 minutes"
        HOURLY = "Hourly", "Hourly"
        DAILY = "Daily", "Daily"

    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, choices=SourceType.choices)
    enabled = models.BooleanField(default=False)
    access_token = models.CharField(max_length=512, blank=True)
    facebook_page_id = models.CharField(max_length=255, blank=True)
    facebook_page_name = models.CharField(max_length=255, blank=True)
    facebook_form_id = models.CharField(max_length=255, blank=True)
    facebook_form_name = models.CharField(max_length=255, blank=True)
    field_mapping = models.JSONField(default=dict, blank=True)  # {"fb_field": "crm_field"}
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_frequency = models.CharField(
        max_length=50,
        choices=SyncFrequency.choices,
        default=SyncFrequency.HOURLY,
    )

    class Meta:
        db_table = "integration_lead_sync_sources"

    def __str__(self):
        return self.name

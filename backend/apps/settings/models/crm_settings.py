from django.db import models

from apps.core.models.mixins import TenantMixin


class CRMSettings(TenantMixin):
    brand_name = models.CharField(max_length=255, blank=True)
    brand_logo = models.ImageField(upload_to="settings/", blank=True, null=True)
    favicon = models.ImageField(upload_to="settings/", blank=True, null=True)
    currency = models.CharField(max_length=10, default="USD")
    enable_forecasting = models.BooleanField(default=False)
    default_all_day_event_start_time = models.TimeField(null=True, blank=True)
    default_all_day_event_end_time = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = '"precept"."crm_settings"'

    def __str__(self):
        return self.brand_name or "CRM Settings"

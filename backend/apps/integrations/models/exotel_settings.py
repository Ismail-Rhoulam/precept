from django.db import models

from apps.core.models.mixins import TenantMixin


class ExotelSettings(TenantMixin):
    enabled = models.BooleanField(default=False)
    account_sid = models.CharField(max_length=255, blank=True)
    subdomain = models.CharField(max_length=255, default="api.exotel.com")
    api_key = models.CharField(max_length=255, blank=True)
    api_token = models.CharField(max_length=255, blank=True)
    webhook_verify_token = models.CharField(max_length=255, blank=True)
    record_calls = models.BooleanField(default=False)

    class Meta:
        db_table = '"precept"."integration_exotel_settings"'

    def __str__(self):
        return f"ExotelSettings (company={self.company_id})"

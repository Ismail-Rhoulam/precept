from django.db import models

from apps.core.models.mixins import TenantMixin


class TwilioSettings(TenantMixin):
    enabled = models.BooleanField(default=False)
    account_sid = models.CharField(max_length=255, blank=True)
    auth_token = models.CharField(max_length=255, blank=True)  # encrypted in production
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    twiml_sid = models.CharField(max_length=255, blank=True)
    record_calls = models.BooleanField(default=False)

    class Meta:
        db_table = "integration_twilio_settings"

    def __str__(self):
        return f"TwilioSettings (company={self.company_id})"

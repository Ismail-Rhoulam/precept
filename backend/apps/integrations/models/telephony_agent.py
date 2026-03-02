from django.conf import settings
from django.db import models

from apps.core.models.mixins import TenantMixin


class TelephonyAgent(TenantMixin):
    class CallingMedium(models.TextChoices):
        TWILIO = "Twilio", "Twilio"
        EXOTEL = "Exotel", "Exotel"

    class ReceivingDevice(models.TextChoices):
        COMPUTER = "Computer", "Computer"
        PHONE = "Phone", "Phone"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="telephony_agent",
    )
    mobile_no = models.CharField(max_length=50, blank=True)
    default_medium = models.CharField(
        max_length=20, choices=CallingMedium.choices, blank=True
    )
    twilio_enabled = models.BooleanField(default=False)
    twilio_number = models.CharField(max_length=50, blank=True)
    exotel_enabled = models.BooleanField(default=False)
    exotel_number = models.CharField(max_length=50, blank=True)
    call_receiving_device = models.CharField(
        max_length=20,
        choices=ReceivingDevice.choices,
        default=ReceivingDevice.COMPUTER,
    )

    class Meta:
        db_table = "integration_telephony_agents"

    def __str__(self):
        return f"TelephonyAgent ({self.user_id})"

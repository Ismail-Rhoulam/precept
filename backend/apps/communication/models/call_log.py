from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class CallLog(TenantMixin, TimestampMixin):
    class Status(models.TextChoices):
        INITIATED = "Initiated", "Initiated"
        RINGING = "Ringing", "Ringing"
        IN_PROGRESS = "In Progress", "In Progress"
        COMPLETED = "Completed", "Completed"
        MISSED = "Missed", "Missed"
        FAILED = "Failed", "Failed"

    class CallType(models.TextChoices):
        INCOMING = "Incoming", "Incoming"
        OUTGOING = "Outgoing", "Outgoing"

    class TelephonyMedium(models.TextChoices):
        MANUAL = "Manual", "Manual"
        TWILIO = "Twilio", "Twilio"
        EXOTEL = "Exotel", "Exotel"

    call_id = models.CharField(max_length=255, unique=True)
    caller_number = models.CharField(max_length=50)
    receiver_number = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices)
    call_type = models.CharField(max_length=20, choices=CallType.choices)
    duration = models.DurationField(null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    recording_url = models.URLField(blank=True)
    telephony_medium = models.CharField(
        max_length=20, choices=TelephonyMedium.choices, blank=True
    )

    caller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="outgoing_calls",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="incoming_calls",
    )
    note = models.ForeignKey(
        "communication.Note",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # Generic foreign key to associate the call log with any model
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    reference = GenericForeignKey("content_type", "object_id")

    class Meta:
        db_table = '"precept"."crm_call_log"'
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.call_type} call {self.call_id}"

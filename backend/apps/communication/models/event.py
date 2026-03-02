from django.conf import settings
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Event(TenantMixin, TimestampMixin):
    class EventType(models.TextChoices):
        PRIVATE = "Private", "Private"
        PUBLIC = "Public", "Public"

    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=500, blank=True)
    starts_on = models.DateTimeField()
    ends_on = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    event_type = models.CharField(
        max_length=20, choices=EventType.choices, default=EventType.PRIVATE
    )
    color = models.CharField(max_length=20, blank=True)

    # Link to entity
    entity_type = models.CharField(max_length=50, blank=True)  # "lead", "deal"
    entity_id = models.IntegerField(null=True, blank=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="events",
    )

    class Meta:
        db_table = "crm_events"
        ordering = ["starts_on"]

    def __str__(self):
        return self.subject


class EventParticipant(TenantMixin):
    class AttendingStatus(models.TextChoices):
        YES = "Yes", "Yes"
        NO = "No", "No"
        MAYBE = "Maybe", "Maybe"

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="participants"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    email = models.EmailField()
    attending = models.CharField(
        max_length=10,
        choices=AttendingStatus.choices,
        default=AttendingStatus.YES,
    )

    class Meta:
        db_table = "crm_event_participants"

    def __str__(self):
        return f"{self.email} – {self.attending}"

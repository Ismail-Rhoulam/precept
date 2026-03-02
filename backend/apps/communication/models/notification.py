from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Notification(TenantMixin, TimestampMixin):
    class NotificationType(models.TextChoices):
        MENTION = "Mention", "Mention"
        TASK = "Task", "Task"
        ASSIGNMENT = "Assignment", "Assignment"
        WHATSAPP = "WhatsApp", "WhatsApp"

    notification_text = models.TextField(blank=True)
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_notifications",
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_notifications",
    )
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    read = models.BooleanField(default=False)
    message = models.TextField(blank=True)

    reference_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        related_name="+",
    )
    reference_object_id = models.PositiveIntegerField(null=True)

    class Meta:
        db_table = '"precept"."crm_notification"'
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification to {self.to_user} ({self.type})"

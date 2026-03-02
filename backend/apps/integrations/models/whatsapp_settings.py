from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class WhatsAppSettings(TenantMixin):
    enabled = models.BooleanField(default=False)
    phone_number_id = models.CharField(max_length=255, blank=True)
    access_token = models.CharField(max_length=512, blank=True)
    business_account_id = models.CharField(max_length=255, blank=True)
    webhook_verify_token = models.CharField(max_length=255, blank=True)
    app_secret = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = '"precept"."integration_whatsapp_settings"'

    def __str__(self):
        return f"WhatsAppSettings (company={self.company_id})"


class WhatsAppMessage(TenantMixin, TimestampMixin):
    class MessageType(models.TextChoices):
        INCOMING = "Incoming", "Incoming"
        OUTGOING = "Outgoing", "Outgoing"

    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        SENT = "Sent", "Sent"
        DELIVERED = "Delivered", "Delivered"
        READ = "Read", "Read"
        FAILED = "Failed", "Failed"

    message_id = models.CharField(max_length=255, blank=True, db_index=True)
    message_type = models.CharField(max_length=20, choices=MessageType.choices)
    from_number = models.CharField(max_length=50)
    to_number = models.CharField(max_length=50)
    content = models.TextField(blank=True)
    content_type = models.CharField(max_length=50, default="text")  # text, image, document, template, reaction
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    template_name = models.CharField(max_length=255, blank=True)
    media_url = models.URLField(blank=True)
    reply_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)

    # Generic FK to link to Lead/Deal
    content_type_fk = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    reference = GenericForeignKey("content_type_fk", "object_id")

    class Meta:
        db_table = '"precept"."integration_whatsapp_message"'
        ordering = ["-created_at"]

    def __str__(self):
        return f"WhatsApp {self.message_type} {self.message_id}"

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class EmailMessage(TenantMixin, TimestampMixin):
    class Direction(models.TextChoices):
        INCOMING = "Incoming", "Incoming"
        OUTGOING = "Outgoing", "Outgoing"

    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        QUEUED = "Queued", "Queued"
        SENDING = "Sending", "Sending"
        SENT = "Sent", "Sent"
        FAILED = "Failed", "Failed"
        RECEIVED = "Received", "Received"

    email_account = models.ForeignKey(
        "integrations.EmailAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )

    # RFC headers for threading
    message_id_header = models.CharField(max_length=512, blank=True, db_index=True)
    in_reply_to = models.CharField(max_length=512, blank=True)
    references_header = models.TextField(blank=True)
    thread_id = models.CharField(max_length=512, blank=True, db_index=True)

    direction = models.CharField(max_length=20, choices=Direction.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )

    from_email = models.EmailField()
    to_emails = models.JSONField(default=list)
    cc_emails = models.JSONField(default=list)
    bcc_emails = models.JSONField(default=list)
    reply_to_email = models.EmailField(blank=True)

    subject = models.CharField(max_length=998, blank=True)
    body_html = models.TextField(blank=True)
    body_text = models.TextField(blank=True)

    # IMAP sync tracking
    imap_uid = models.CharField(max_length=100, blank=True, db_index=True)

    # Error tracking
    error_message = models.TextField(blank=True)

    # Generic FK to link to Lead/Deal (same pattern as WhatsAppMessage)
    content_type_fk = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    reference = GenericForeignKey("content_type_fk", "object_id")

    class Meta:
        db_table = "integration_email_messages"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["company", "from_email"]),
            models.Index(fields=["company", "thread_id"]),
        ]

    def __str__(self):
        return f"Email {self.direction} — {self.subject[:50]}"


class EmailAttachment(TenantMixin):
    email_message = models.ForeignKey(
        EmailMessage, on_delete=models.CASCADE, related_name="attachments"
    )
    filename = models.CharField(max_length=512)
    file = models.FileField(upload_to="email_attachments/")
    mime_type = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "integration_email_attachments"

    def __str__(self):
        return self.filename

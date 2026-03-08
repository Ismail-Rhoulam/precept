from django.db import models
from apps.core.models.mixins import TenantMixin, TimestampMixin


class EmailTemplate(TenantMixin, TimestampMixin):
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=998)
    body_html = models.TextField()
    body_text = models.TextField(blank=True)

    class Meta:
        db_table = "integration_email_templates"
        unique_together = [("company", "name")]

    def __str__(self):
        return self.name


class EmailCampaign(TenantMixin, TimestampMixin):
    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        SCHEDULED = "Scheduled", "Scheduled"
        SENDING = "Sending", "Sending"
        SENT = "Sent", "Sent"
        PAUSED = "Paused", "Paused"
        FAILED = "Failed", "Failed"

    name = models.CharField(max_length=255)
    email_account = models.ForeignKey(
        "integrations.EmailAccount", on_delete=models.SET_NULL, null=True, blank=True
    )
    template = models.ForeignKey(
        EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True
    )
    subject = models.CharField(max_length=998, blank=True)
    body_html = models.TextField(blank=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)

    recipients = models.JSONField(default=list)

    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "integration_email_campaigns"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class EmailCampaignLog(TenantMixin):
    campaign = models.ForeignKey(
        EmailCampaign, on_delete=models.CASCADE, related_name="logs"
    )
    recipient_email = models.EmailField()
    status = models.CharField(max_length=20)
    email_message = models.ForeignKey(
        "integrations.EmailMessage", on_delete=models.SET_NULL, null=True, blank=True
    )
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "integration_email_campaign_logs"

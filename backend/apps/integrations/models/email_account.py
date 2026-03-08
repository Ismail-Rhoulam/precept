from django.db import models

from apps.core.models.mixins import TenantMixin


class EmailAccount(TenantMixin):
    class SmtpMode(models.TextChoices):
        EXTERNAL = "external", "External SMTP"
        BUILTIN = "builtin", "Built-in (Postfix)"

    enabled = models.BooleanField(default=False)
    display_name = models.CharField(max_length=255, blank=True)
    is_default = models.BooleanField(default=False)
    email_address = models.EmailField()

    # SMTP mode
    smtp_mode = models.CharField(
        max_length=20, choices=SmtpMode.choices, default=SmtpMode.EXTERNAL
    )
    # Mail domain — used when smtp_mode == "builtin" (e.g. "example.com")
    mail_domain = models.CharField(max_length=255, blank=True)

    # SMTP (outgoing) — used when smtp_mode == "external"
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.PositiveIntegerField(default=587)
    smtp_username = models.CharField(max_length=255, blank=True)
    smtp_password = models.CharField(max_length=512, blank=True)
    smtp_use_tls = models.BooleanField(default=True)
    smtp_use_ssl = models.BooleanField(default=False)

    # IMAP (incoming)
    imap_host = models.CharField(max_length=255, blank=True)
    imap_port = models.PositiveIntegerField(default=993)
    imap_username = models.CharField(max_length=255, blank=True)
    imap_password = models.CharField(max_length=512, blank=True)
    imap_use_ssl = models.BooleanField(default=True)
    imap_folder = models.CharField(max_length=255, default="INBOX")
    enable_incoming = models.BooleanField(default=False)

    # Sync state
    last_synced_at = models.DateTimeField(null=True, blank=True)
    last_synced_uid = models.CharField(max_length=255, blank=True)
    sync_frequency = models.CharField(
        max_length=50,
        default="Every 5 minutes",
        choices=[
            ("Every 5 minutes", "Every 5 minutes"),
            ("Every 15 minutes", "Every 15 minutes"),
            ("Hourly", "Hourly"),
        ],
    )

    class Meta:
        db_table = "integration_email_accounts"
        unique_together = [("company", "email_address")]

    def __str__(self):
        name = self.display_name or self.email_address
        return f"EmailAccount ({name})"

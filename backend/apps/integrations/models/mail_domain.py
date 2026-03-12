from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class MailDomain(TenantMixin, TimestampMixin):
    """A sending domain registered by a tenant for built-in (Postfix) email.

    Users first register a domain, DKIM keys are generated instantly,
    then they configure DNS records and verify them before creating
    email accounts under the domain.
    """

    domain = models.CharField(max_length=255)

    # DNS verification status
    spf_verified = models.BooleanField(default=False)
    dkim_verified = models.BooleanField(default=False)
    dmarc_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "integration_mail_domains"
        unique_together = [("company", "domain")]

    def __str__(self):
        return self.domain

    @property
    def is_verified(self):
        return self.spf_verified and self.dkim_verified and self.dmarc_verified

from django.conf import settings
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Invitation(TenantMixin, TimestampMixin):
    class InvitationStatus(models.TextChoices):
        PENDING = "Pending", "Pending"
        ACCEPTED = "Accepted", "Accepted"
        EXPIRED = "Expired", "Expired"

    email = models.EmailField()
    role = models.CharField(max_length=20, default="sales_user")
    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING,
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "crm_invitations"

    def __str__(self):
        return f"Invitation for {self.email} ({self.status})"

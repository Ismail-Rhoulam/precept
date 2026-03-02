from django.db import models

from apps.core.models.mixins import TenantMixin


class LeadStatus(TenantMixin):
    STATUS_TYPE_CHOICES = [
        ("Open", "Open"),
        ("Ongoing", "Ongoing"),
        ("On Hold", "On Hold"),
        ("Won", "Won"),
        ("Lost", "Lost"),
    ]

    lead_status = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=STATUS_TYPE_CHOICES)
    color = models.CharField(max_length=20, default="gray")
    position = models.IntegerField(default=1)

    class Meta:
        db_table = '"precept"."crm_lead_status"'
        unique_together = ("company", "lead_status")
        ordering = ["position"]

    def __str__(self):
        return self.lead_status


class DealStatus(TenantMixin):
    STATUS_TYPE_CHOICES = [
        ("Open", "Open"),
        ("Ongoing", "Ongoing"),
        ("On Hold", "On Hold"),
        ("Won", "Won"),
        ("Lost", "Lost"),
    ]

    deal_status = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=STATUS_TYPE_CHOICES)
    color = models.CharField(max_length=20, default="gray")
    position = models.IntegerField(default=1)
    probability = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        db_table = '"precept"."crm_deal_status"'
        unique_together = ("company", "deal_status")
        ordering = ["position"]

    def __str__(self):
        return self.deal_status


class CommunicationStatus(TenantMixin):
    status = models.CharField(max_length=100)

    class Meta:
        db_table = '"precept"."crm_communication_status"'
        unique_together = ("company", "status")

    def __str__(self):
        return self.status


class LostReason(TenantMixin):
    reason = models.CharField(max_length=255)

    class Meta:
        db_table = '"precept"."crm_lost_reason"'
        unique_together = ("company", "reason")

    def __str__(self):
        return self.reason

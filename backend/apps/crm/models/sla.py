from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class ServiceLevelAgreement(TenantMixin, TimestampMixin):
    APPLY_ON_CHOICES = [
        ("Lead", "Lead"),
        ("Deal", "Deal"),
    ]

    sla_name = models.CharField(max_length=255)
    apply_on = models.CharField(max_length=50, choices=APPLY_ON_CHOICES)
    enabled = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    rolling_responses = models.BooleanField(default=False)
    condition = models.TextField(blank=True)
    condition_json = models.JSONField(default=dict, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    holiday_list = models.ForeignKey(
        "crm_settings.HolidayList",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "crm_slas"
        unique_together = ("company", "sla_name")

    def __str__(self):
        return self.sla_name


class SLAPriority(models.Model):
    sla = models.ForeignKey(
        ServiceLevelAgreement,
        on_delete=models.CASCADE,
        related_name="priorities",
    )
    priority = models.CharField(max_length=50)
    response_time = models.DurationField()

    class Meta:
        db_table = "crm_sla_priorities"

    def __str__(self):
        return f"{self.sla} - {self.priority}"


class ServiceDay(models.Model):
    sla = models.ForeignKey(
        ServiceLevelAgreement,
        on_delete=models.CASCADE,
        related_name="working_hours",
    )
    day = models.CharField(max_length=20)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        db_table = "crm_service_days"

    def __str__(self):
        return f"{self.day}: {self.start_time} - {self.end_time}"

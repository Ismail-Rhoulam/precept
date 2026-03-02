from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Organization(TenantMixin, TimestampMixin):
    EMPLOYEE_COUNT_CHOICES = [
        ("1-10", "1-10"),
        ("11-50", "11-50"),
        ("51-200", "51-200"),
        ("201-500", "201-500"),
        ("501-1000", "501-1000"),
        ("1000+", "1000+"),
    ]

    organization_name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    organization_logo = models.ImageField(
        upload_to="organizations/", blank=True, null=True
    )
    no_of_employees = models.CharField(
        max_length=20, blank=True, choices=EMPLOYEE_COUNT_CHOICES
    )
    annual_revenue = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    industry = models.ForeignKey(
        "crm.Industry", on_delete=models.SET_NULL, null=True, blank=True
    )
    territory = models.ForeignKey(
        "crm.Territory", on_delete=models.SET_NULL, null=True, blank=True
    )
    currency = models.CharField(max_length=10, default="USD")
    address = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "crm_organizations"
        unique_together = ("company", "organization_name")

    def __str__(self):
        return self.organization_name

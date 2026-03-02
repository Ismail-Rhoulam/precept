from django.db import models

from apps.core.models.mixins import TenantMixin


class LeadSource(TenantMixin):
    source_name = models.CharField(max_length=100)

    class Meta:
        db_table = "crm_lead_sources"
        unique_together = ("company", "source_name")

    def __str__(self):
        return self.source_name


class Industry(TenantMixin):
    industry_name = models.CharField(max_length=100)

    class Meta:
        db_table = "crm_industries"
        unique_together = ("company", "industry_name")

    def __str__(self):
        return self.industry_name


class Territory(TenantMixin):
    territory_name = models.CharField(max_length=100)
    parent_territory = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sub_territories",
    )

    class Meta:
        db_table = "crm_territories"
        unique_together = ("company", "territory_name")

    def __str__(self):
        return self.territory_name

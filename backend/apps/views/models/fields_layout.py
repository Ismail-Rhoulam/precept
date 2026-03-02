from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class FieldsLayout(TenantMixin, TimestampMixin):
    class LayoutType(models.TextChoices):
        QUICK_ENTRY = "Quick Entry", "Quick Entry"
        SIDE_PANEL = "Side Panel", "Side Panel"
        DATA_FIELDS = "Data Fields", "Data Fields"

    dt = models.CharField(max_length=50)  # entity type
    type = models.CharField(max_length=20, choices=LayoutType.choices)
    layout = models.JSONField(default=list)  # tabs > sections > columns > fields

    class Meta:
        db_table = "crm_fields_layouts"
        unique_together = [("company", "dt", "type")]

    def __str__(self):
        return f"{self.dt} – {self.type}"

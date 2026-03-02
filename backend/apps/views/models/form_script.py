from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class FormScript(TenantMixin, TimestampMixin):
    class ViewTarget(models.TextChoices):
        FORM = "Form", "Form"
        LIST = "List", "List"

    name = models.CharField(max_length=255)
    dt = models.CharField(max_length=50)  # entity type: "lead", "deal", etc.
    view = models.CharField(
        max_length=10, choices=ViewTarget.choices, default=ViewTarget.FORM
    )
    enabled = models.BooleanField(default=True)
    script = models.TextField(blank=True)

    class Meta:
        db_table = '"precept"."crm_form_script"'

    def __str__(self):
        return f"{self.name} ({self.dt}/{self.view})"

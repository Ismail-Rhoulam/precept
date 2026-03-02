from django.conf import settings
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class ViewSettings(TenantMixin, TimestampMixin):
    class ViewType(models.TextChoices):
        LIST = "list", "List"
        KANBAN = "kanban", "Kanban"
        GROUP_BY = "group_by", "Group By"

    label = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    is_standard = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    type = models.CharField(
        max_length=20, choices=ViewType.choices, default=ViewType.LIST
    )
    entity_type = models.CharField(max_length=50)
    route_name = models.CharField(max_length=100, blank=True)
    pinned = models.BooleanField(default=False)
    public = models.BooleanField(default=False)

    filters = models.JSONField(default=dict, blank=True)
    order_by = models.JSONField(default=dict, blank=True)
    columns = models.JSONField(default=list, blank=True)
    rows = models.JSONField(default=list, blank=True)
    load_default_columns = models.BooleanField(default=False)

    group_by_field = models.CharField(max_length=100, blank=True)
    column_field = models.CharField(max_length=100, blank=True)
    title_field = models.CharField(max_length=100, blank=True)
    kanban_columns = models.JSONField(default=list, blank=True)
    kanban_fields = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "crm_view_settings"

    def __str__(self):
        return f"{self.label} ({self.entity_type})"

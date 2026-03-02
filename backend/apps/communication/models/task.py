from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Task(TenantMixin, TimestampMixin):
    class Priority(models.TextChoices):
        LOW = "Low", "Low"
        MEDIUM = "Medium", "Medium"
        HIGH = "High", "High"

    class Status(models.TextChoices):
        BACKLOG = "Backlog", "Backlog"
        TODO = "Todo", "Todo"
        IN_PROGRESS = "In Progress", "In Progress"
        DONE = "Done", "Done"
        CANCELED = "Canceled", "Canceled"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TODO
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)

    # Generic foreign key to associate the task with any model
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    reference = GenericForeignKey("content_type", "object_id")

    class Meta:
        db_table = '"precept"."crm_task"'
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

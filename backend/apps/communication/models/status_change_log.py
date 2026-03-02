from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TimestampMixin


class StatusChangeLog(TimestampMixin):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    parent = GenericForeignKey("content_type", "object_id")

    from_status = models.CharField(max_length=100, blank=True)
    to_status = models.CharField(max_length=100)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )

    class Meta:
        db_table = '"precept"."crm_status_change_log"'
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.from_status} -> {self.to_status}"

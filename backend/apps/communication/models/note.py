from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Note(TenantMixin, TimestampMixin):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)

    # Generic foreign key to associate the note with any model
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    reference = GenericForeignKey("content_type", "object_id")

    class Meta:
        db_table = "crm_notes"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

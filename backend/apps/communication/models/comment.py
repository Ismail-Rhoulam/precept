from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Comment(TenantMixin, TimestampMixin):
    content = models.TextField()
    comment_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )

    # Generic foreign key to associate the comment with any model
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    reference = GenericForeignKey("content_type", "object_id")

    class Meta:
        db_table = '"precept"."crm_comment"'
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comment by {self.comment_by} on {self.content_type}"

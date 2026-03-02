import contextvars
from datetime import datetime

from django.conf import settings
from django.db import models


# Context variable used to propagate the current tenant (company_id)
# across the request lifecycle without threading issues.
_tenant_context: contextvars.ContextVar[int | None] = contextvars.ContextVar(
    "_tenant_context", default=None
)


# ---------------------------------------------------------------------------
# TenantMixin
# ---------------------------------------------------------------------------

class TenantManager(models.Manager):
    """Default manager that automatically scopes queries to the current tenant."""

    def get_queryset(self):
        qs = super().get_queryset()
        company_id = _tenant_context.get()
        if company_id is not None:
            qs = qs.filter(company_id=company_id)
        return qs


class UnscopedManager(models.Manager):
    """Manager that returns all rows regardless of tenant context."""
    pass


class TenantMixin(models.Model):
    """
    Abstract mixin that binds a model to a Company (tenant).
    All default queries are automatically filtered by the current tenant
    stored in ``_tenant_context``.
    """

    company = models.ForeignKey(
        "core.Company",
        on_delete=models.CASCADE,
        db_index=True,
        related_name="%(class)s_set",
    )

    objects = TenantManager()
    unscoped = UnscopedManager()

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# TimestampMixin
# ---------------------------------------------------------------------------

class TimestampMixin(models.Model):
    """Adds created/updated timestamps and audit-user foreign keys."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_modified",
    )

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# NamingSeriesMixin
# ---------------------------------------------------------------------------

class NamingSeriesMixin(models.Model):
    """
    Auto-generates a human-readable ``reference_id`` on first save.

    Format: ``{PREFIX}-{YEAR}-{SEQUENCE:05d}``

    The prefix is derived from the concrete model's ``NAMING_PREFIX`` attribute.
    If not set, the upper-cased model name is used.
    """

    reference_id = models.CharField(
        max_length=50, unique=True, editable=False, db_index=True
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.reference_id:
            prefix = getattr(self, "NAMING_PREFIX", self.__class__.__name__.upper())
            year = datetime.now().year
            pattern = f"{prefix}-{year}-"

            # Count existing records that share the same prefix+year.
            existing_count = (
                self.__class__
                .unscoped.filter(reference_id__startswith=pattern)
                .count()
                if hasattr(self.__class__, "unscoped")
                else self.__class__
                .objects.filter(reference_id__startswith=pattern)
                .count()
            )
            sequence = existing_count + 1
            self.reference_id = f"{pattern}{sequence:05d}"
        super().save(*args, **kwargs)

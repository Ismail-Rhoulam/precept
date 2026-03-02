from django.db import models


class Company(models.Model):
    """
    Tenant model — each company is an isolated tenant in the system.
    """

    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_companies"
        verbose_name_plural = "companies"

    def __str__(self):
        return self.name

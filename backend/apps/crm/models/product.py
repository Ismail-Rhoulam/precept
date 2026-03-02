from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Product(TenantMixin, TimestampMixin):
    product_code = models.CharField(max_length=100)
    product_name = models.CharField(max_length=255, blank=True)
    standard_rate = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    disabled = models.BooleanField(default=False)

    class Meta:
        db_table = '"precept"."crm_product"'
        unique_together = ("company", "product_code")

    def __str__(self):
        return self.product_name or self.product_code

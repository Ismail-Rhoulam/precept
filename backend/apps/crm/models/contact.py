from django.db import models

from apps.core.models.mixins import TenantMixin, TimestampMixin


class Contact(TenantMixin, TimestampMixin):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True)
    full_name = models.CharField(max_length=512, blank=True)
    email_id = models.EmailField(blank=True, db_index=True)
    mobile_no = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    salutation = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    designation = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="contacts/", blank=True, null=True)

    class Meta:
        db_table = '"precept"."crm_contact"'

    def __str__(self):
        return self.full_name or self.first_name

    def save(self, *args, **kwargs):
        self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

from django.conf import settings
from django.db import models

from apps.core.models.mixins import NamingSeriesMixin, TenantMixin, TimestampMixin


class Lead(TenantMixin, TimestampMixin, NamingSeriesMixin):
    NAMING_PREFIX = "CRM-LEAD"

    SLA_STATUS_CHOICES = [
        ("First Response Due", "First Response Due"),
        ("Rolling Response Due", "Rolling Response Due"),
        ("Failed", "Failed"),
        ("Fulfilled", "Fulfilled"),
    ]

    EMPLOYEE_COUNT_CHOICES = [
        ("1-10", "1-10"),
        ("11-50", "11-50"),
        ("51-200", "51-200"),
        ("201-500", "201-500"),
        ("501-1000", "501-1000"),
        ("1000+", "1000+"),
    ]

    # Person fields
    salutation = models.CharField(max_length=20, blank=True)
    first_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    lead_name = models.CharField(max_length=512, blank=True, db_index=True)
    gender = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True, db_index=True)
    mobile_no = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    image = models.ImageField(upload_to="leads/", blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True)

    # Organization fields (text, not FK)
    organization = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    no_of_employees = models.CharField(
        max_length=20, blank=True, choices=EMPLOYEE_COUNT_CHOICES
    )
    annual_revenue = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Classification FKs
    status = models.ForeignKey(
        "crm.LeadStatus", on_delete=models.PROTECT, related_name="leads"
    )
    lead_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_leads",
    )
    source = models.ForeignKey(
        "crm.LeadSource", on_delete=models.SET_NULL, null=True, blank=True
    )
    industry = models.ForeignKey(
        "crm.Industry", on_delete=models.SET_NULL, null=True, blank=True
    )
    territory = models.ForeignKey(
        "crm.Territory", on_delete=models.SET_NULL, null=True, blank=True
    )

    converted = models.BooleanField(default=False)

    # SLA fields
    sla = models.ForeignKey(
        "crm.ServiceLevelAgreement",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    sla_creation = models.DateTimeField(null=True, blank=True)
    sla_status = models.CharField(
        max_length=30, blank=True, choices=SLA_STATUS_CHOICES
    )
    communication_status = models.ForeignKey(
        "crm.CommunicationStatus",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    response_by = models.DateTimeField(null=True, blank=True)
    first_response_time = models.DurationField(null=True, blank=True)
    first_responded_on = models.DateTimeField(null=True, blank=True)
    last_response_time = models.DurationField(null=True, blank=True)
    last_responded_on = models.DateTimeField(null=True, blank=True)

    # Financial
    total = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    net_total = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Facebook
    facebook_lead_id = models.CharField(
        max_length=255, blank=True, null=True, unique=True
    )
    facebook_form_id = models.CharField(max_length=255, blank=True)

    # Lost
    lost_reason = models.ForeignKey(
        "crm.LostReason", on_delete=models.SET_NULL, null=True, blank=True
    )
    lost_notes = models.TextField(blank=True)

    class Meta:
        db_table = "crm_leads"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["company", "status"]),
            models.Index(fields=["company", "email"]),
        ]

    def __str__(self):
        return self.lead_name or self.first_name

    def save(self, *args, **kwargs):
        parts = []
        if self.salutation:
            parts.append(self.salutation)
        if self.first_name:
            parts.append(self.first_name)
        if self.middle_name:
            parts.append(self.middle_name)
        if self.last_name:
            parts.append(self.last_name)
        self.lead_name = " ".join(parts)
        super().save(*args, **kwargs)


class LeadProduct(models.Model):
    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, related_name="products"
    )
    product = models.ForeignKey(
        "crm.Product", on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField(max_length=255)
    qty = models.FloatField(default=1)
    rate = models.DecimalField(max_digits=18, decimal_places=2)
    amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    discount_amount = models.DecimalField(
        max_digits=18, decimal_places=2, default=0
    )
    net_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = "crm_lead_products"

    def __str__(self):
        return self.product_name

from django.conf import settings
from django.db import models

from apps.core.models.mixins import NamingSeriesMixin, TenantMixin, TimestampMixin


class Deal(TenantMixin, TimestampMixin, NamingSeriesMixin):
    NAMING_PREFIX = "CRM-DEAL"

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

    # Organization
    organization = models.ForeignKey(
        "crm.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deals",
    )
    organization_name = models.CharField(max_length=255, blank=True)

    # Status
    status = models.ForeignKey(
        "crm.DealStatus",
        on_delete=models.PROTECT,
        related_name="deals",
    )
    deal_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_deals",
    )
    next_step = models.CharField(max_length=255, blank=True)

    # Financial
    probability = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    deal_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    expected_deal_value = models.DecimalField(
        max_digits=18, decimal_places=2, default=0
    )
    currency = models.CharField(max_length=10, default="USD")
    exchange_rate = models.FloatField(default=1.0)
    annual_revenue = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    # Dates
    expected_closure_date = models.DateField(null=True, blank=True)
    closed_date = models.DateField(null=True, blank=True)

    # Lead linkage
    lead = models.ForeignKey(
        "crm.Lead",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deals",
    )
    lead_name = models.CharField(max_length=512, blank=True)
    source = models.ForeignKey(
        "crm.LeadSource", on_delete=models.SET_NULL, null=True, blank=True
    )

    # Person fields (denormalized from primary contact)
    salutation = models.CharField(max_length=20, blank=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.CharField(max_length=255, blank=True)
    mobile_no = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=20, blank=True)

    # Classification
    territory = models.ForeignKey(
        "crm.Territory", on_delete=models.SET_NULL, null=True, blank=True
    )
    industry = models.ForeignKey(
        "crm.Industry", on_delete=models.SET_NULL, null=True, blank=True
    )
    website = models.URLField(blank=True)
    no_of_employees = models.CharField(
        max_length=20, blank=True, choices=EMPLOYEE_COUNT_CHOICES
    )
    job_title = models.CharField(max_length=255, blank=True)

    # Contacts M2M
    contacts = models.ManyToManyField(
        "crm.Contact", through="DealContact", blank=True
    )
    # Primary contact
    contact = models.ForeignKey(
        "crm.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="primary_for_deals",
    )

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

    # Lost
    lost_reason = models.ForeignKey(
        "crm.LostReason", on_delete=models.SET_NULL, null=True, blank=True
    )
    lost_notes = models.TextField(blank=True)

    class Meta:
        db_table = "crm_deals"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.reference_id


class DealContact(models.Model):
    deal = models.ForeignKey(
        Deal, on_delete=models.CASCADE, related_name="deal_contacts"
    )
    contact = models.ForeignKey(
        "crm.Contact", on_delete=models.CASCADE, related_name="contact_deals"
    )
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "crm_deal_contacts"
        unique_together = ("deal", "contact")

    def __str__(self):
        return f"{self.deal} - {self.contact}"


class DealProduct(models.Model):
    deal = models.ForeignKey(
        Deal, on_delete=models.CASCADE, related_name="products"
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
        db_table = "crm_deal_products"

    def __str__(self):
        return self.product_name

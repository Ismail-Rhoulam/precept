from django.contrib import admin

from apps.crm.models import (
    CommunicationStatus,
    Contact,
    Deal,
    DealContact,
    DealProduct,
    DealStatus,
    Industry,
    Lead,
    LeadProduct,
    LeadSource,
    LeadStatus,
    LostReason,
    Organization,
    Product,
    ServiceDay,
    ServiceLevelAgreement,
    SLAPriority,
    Territory,
)


# ---------------------------------------------------------------------------
# Status models
# ---------------------------------------------------------------------------


@admin.register(LeadStatus)
class LeadStatusAdmin(admin.ModelAdmin):
    list_display = ("lead_status", "type", "color", "position", "company")
    list_filter = ("type", "company")
    ordering = ("position",)


@admin.register(DealStatus)
class DealStatusAdmin(admin.ModelAdmin):
    list_display = ("deal_status", "type", "color", "position", "probability", "company")
    list_filter = ("type", "company")
    ordering = ("position",)


@admin.register(CommunicationStatus)
class CommunicationStatusAdmin(admin.ModelAdmin):
    list_display = ("status", "company")
    list_filter = ("company",)


@admin.register(LostReason)
class LostReasonAdmin(admin.ModelAdmin):
    list_display = ("reason", "company")
    list_filter = ("company",)


# ---------------------------------------------------------------------------
# Classification models
# ---------------------------------------------------------------------------


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display = ("source_name", "company")
    list_filter = ("company",)


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ("industry_name", "company")
    list_filter = ("company",)


@admin.register(Territory)
class TerritoryAdmin(admin.ModelAdmin):
    list_display = ("territory_name", "parent_territory", "company")
    list_filter = ("company",)


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("organization_name", "industry", "territory", "currency", "company")
    list_filter = ("company", "industry", "territory")
    search_fields = ("organization_name",)


# ---------------------------------------------------------------------------
# Contact
# ---------------------------------------------------------------------------


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email_id", "mobile_no", "company_name", "company")
    list_filter = ("company",)
    search_fields = ("first_name", "last_name", "full_name", "email_id")


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("product_code", "product_name", "standard_rate", "disabled", "company")
    list_filter = ("company", "disabled")
    search_fields = ("product_code", "product_name")


# ---------------------------------------------------------------------------
# Lead
# ---------------------------------------------------------------------------


class LeadProductInline(admin.TabularInline):
    model = LeadProduct
    extra = 0


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "reference_id",
        "lead_name",
        "email",
        "status",
        "lead_owner",
        "converted",
        "company",
    )
    list_filter = ("company", "status", "converted", "source")
    search_fields = ("reference_id", "lead_name", "email", "first_name", "last_name")
    inlines = [LeadProductInline]


@admin.register(LeadProduct)
class LeadProductAdmin(admin.ModelAdmin):
    list_display = ("lead", "product_name", "qty", "rate", "amount", "net_amount")


# ---------------------------------------------------------------------------
# Deal
# ---------------------------------------------------------------------------


class DealContactInline(admin.TabularInline):
    model = DealContact
    extra = 0


class DealProductInline(admin.TabularInline):
    model = DealProduct
    extra = 0


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = (
        "reference_id",
        "organization_name",
        "status",
        "deal_owner",
        "deal_value",
        "probability",
        "company",
    )
    list_filter = ("company", "status", "source")
    search_fields = ("reference_id", "organization_name", "first_name", "last_name", "email")
    inlines = [DealContactInline, DealProductInline]


@admin.register(DealContact)
class DealContactAdmin(admin.ModelAdmin):
    list_display = ("deal", "contact", "is_primary")
    list_filter = ("is_primary",)


@admin.register(DealProduct)
class DealProductAdmin(admin.ModelAdmin):
    list_display = ("deal", "product_name", "qty", "rate", "amount", "net_amount")


# ---------------------------------------------------------------------------
# SLA
# ---------------------------------------------------------------------------


class SLAPriorityInline(admin.TabularInline):
    model = SLAPriority
    extra = 0


class ServiceDayInline(admin.TabularInline):
    model = ServiceDay
    extra = 0


@admin.register(ServiceLevelAgreement)
class ServiceLevelAgreementAdmin(admin.ModelAdmin):
    list_display = ("sla_name", "apply_on", "enabled", "is_default", "company")
    list_filter = ("company", "apply_on", "enabled", "is_default")
    search_fields = ("sla_name",)
    inlines = [SLAPriorityInline, ServiceDayInline]


@admin.register(SLAPriority)
class SLAPriorityAdmin(admin.ModelAdmin):
    list_display = ("sla", "priority", "response_time")


@admin.register(ServiceDay)
class ServiceDayAdmin(admin.ModelAdmin):
    list_display = ("sla", "day", "start_time", "end_time")

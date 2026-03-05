import hashlib
import hmac
from datetime import datetime
from typing import Optional

from django.conf import settings
from ninja import Schema


# ---------------------------------------------------------------------------
# Twilio Settings
# ---------------------------------------------------------------------------


class TwilioSettingsOut(Schema):
    id: int
    enabled: bool
    account_sid: str
    auth_token: str
    api_key: str
    api_secret: str
    twiml_sid: str
    record_calls: bool


class TwilioSettingsCreate(Schema):
    enabled: bool = False
    account_sid: str = ""
    auth_token: str = ""
    api_key: str = ""
    api_secret: str = ""
    twiml_sid: str = ""
    record_calls: bool = False


class TwilioSettingsUpdate(Schema):
    enabled: Optional[bool] = None
    account_sid: Optional[str] = None
    auth_token: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    twiml_sid: Optional[str] = None
    record_calls: Optional[bool] = None


# ---------------------------------------------------------------------------
# Exotel Settings
# ---------------------------------------------------------------------------


class ExotelSettingsOut(Schema):
    id: int
    enabled: bool
    account_sid: str
    subdomain: str
    api_key: str
    api_token: str
    webhook_verify_token: str
    record_calls: bool


class ExotelSettingsCreate(Schema):
    enabled: bool = False
    account_sid: str = ""
    subdomain: str = "api.exotel.com"
    api_key: str = ""
    api_token: str = ""
    webhook_verify_token: str = ""
    record_calls: bool = False


class ExotelSettingsUpdate(Schema):
    enabled: Optional[bool] = None
    account_sid: Optional[str] = None
    subdomain: Optional[str] = None
    api_key: Optional[str] = None
    api_token: Optional[str] = None
    webhook_verify_token: Optional[str] = None
    record_calls: Optional[bool] = None


# ---------------------------------------------------------------------------
# WhatsApp Settings
# ---------------------------------------------------------------------------


class WhatsAppSettingsOut(Schema):
    id: int
    enabled: bool
    phone_number_id: str
    access_token: str
    business_account_id: str
    webhook_verify_token: str
    app_secret: str


class WhatsAppSettingsCreate(Schema):
    enabled: bool = False
    phone_number_id: str = ""
    access_token: str = ""
    business_account_id: str = ""
    webhook_verify_token: str = ""
    app_secret: str = ""


class WhatsAppSettingsUpdate(Schema):
    enabled: Optional[bool] = None
    phone_number_id: Optional[str] = None
    access_token: Optional[str] = None
    business_account_id: Optional[str] = None
    webhook_verify_token: Optional[str] = None
    app_secret: Optional[str] = None


# ---------------------------------------------------------------------------
# WhatsApp Message
# ---------------------------------------------------------------------------


def _sign_media_token(message_id: int) -> str:
    """Generate HMAC token for media proxy URL."""
    return hmac.new(
        settings.SECRET_KEY.encode(),
        f"wa-media-{message_id}".encode(),
        hashlib.sha256,
    ).hexdigest()[:32]


class WhatsAppMessageOut(Schema):
    id: int
    message_id: str
    message_type: str
    from_number: str
    to_number: str
    content: str
    content_type: str
    status: str
    template_name: str
    media_url: str
    mime_type: str = ""
    media_proxy_url: Optional[str] = None
    reply_to_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_media_proxy_url(obj):
        if not obj.media_url:
            return None
        token = _sign_media_token(obj.id)
        return f"/api/integrations/whatsapp/media/{obj.id}?token={token}"

    @staticmethod
    def resolve_entity_type(obj):
        if obj.content_type_fk:
            return obj.content_type_fk.model
        return None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id


class WhatsAppMessageCreate(Schema):
    to_number: str
    content: str = ""
    content_type: str = "text"
    template_name: str = ""
    media_url: str = ""
    mime_type: str = ""
    reply_to_id: Optional[int] = None
    entity_type: Optional[str] = None  # "lead" or "deal"
    entity_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Telephony Agent
# ---------------------------------------------------------------------------


class TelephonyAgentOut(Schema):
    id: int
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    mobile_no: str
    default_medium: str
    twilio_enabled: bool
    twilio_number: str
    exotel_enabled: bool
    exotel_number: str
    call_receiving_device: str

    @staticmethod
    def resolve_user_email(obj):
        return obj.user.email if obj.user else None

    @staticmethod
    def resolve_user_name(obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return None


class TelephonyAgentCreate(Schema):
    user_id: int
    mobile_no: str = ""
    default_medium: str = ""
    twilio_enabled: bool = False
    twilio_number: str = ""
    exotel_enabled: bool = False
    exotel_number: str = ""
    call_receiving_device: str = "Computer"


class TelephonyAgentUpdate(Schema):
    mobile_no: Optional[str] = None
    default_medium: Optional[str] = None
    twilio_enabled: Optional[bool] = None
    twilio_number: Optional[str] = None
    exotel_enabled: Optional[bool] = None
    exotel_number: Optional[str] = None
    call_receiving_device: Optional[str] = None


# ---------------------------------------------------------------------------
# Lead Sync Source
# ---------------------------------------------------------------------------


class LeadSyncSourceOut(Schema):
    id: int
    name: str
    source_type: str
    enabled: bool
    access_token: str
    facebook_page_id: str
    facebook_page_name: str
    facebook_form_id: str
    facebook_form_name: str
    field_mapping: dict
    last_synced_at: Optional[datetime] = None
    sync_frequency: str
    created_at: datetime
    updated_at: datetime


class LeadSyncSourceCreate(Schema):
    name: str
    source_type: str = "Facebook"
    enabled: bool = False
    access_token: str = ""
    facebook_page_id: str = ""
    facebook_page_name: str = ""
    facebook_form_id: str = ""
    facebook_form_name: str = ""
    field_mapping: dict = {}
    sync_frequency: str = "Hourly"


class LeadSyncSourceUpdate(Schema):
    name: Optional[str] = None
    source_type: Optional[str] = None
    enabled: Optional[bool] = None
    access_token: Optional[str] = None
    facebook_page_id: Optional[str] = None
    facebook_page_name: Optional[str] = None
    facebook_form_id: Optional[str] = None
    facebook_form_name: Optional[str] = None
    field_mapping: Optional[dict] = None
    sync_frequency: Optional[str] = None


# ---------------------------------------------------------------------------
# Integration Status (summary)
# ---------------------------------------------------------------------------


class IntegrationStatusOut(Schema):
    twilio_enabled: bool = False
    exotel_enabled: bool = False
    whatsapp_enabled: bool = False
    default_calling_medium: str = ""


# ---------------------------------------------------------------------------
# CRM Settings
# ---------------------------------------------------------------------------


class CRMSettingsOut(Schema):
    id: int
    brand_name: str
    brand_logo: Optional[str] = None
    favicon: Optional[str] = None
    currency: str
    enable_forecasting: bool
    default_all_day_event_start_time: Optional[str] = None
    default_all_day_event_end_time: Optional[str] = None

    @staticmethod
    def resolve_brand_logo(obj):
        return obj.brand_logo.url if obj.brand_logo else None

    @staticmethod
    def resolve_favicon(obj):
        return obj.favicon.url if obj.favicon else None

    @staticmethod
    def resolve_default_all_day_event_start_time(obj):
        return str(obj.default_all_day_event_start_time) if obj.default_all_day_event_start_time else None

    @staticmethod
    def resolve_default_all_day_event_end_time(obj):
        return str(obj.default_all_day_event_end_time) if obj.default_all_day_event_end_time else None


class CRMSettingsUpdate(Schema):
    brand_name: Optional[str] = None
    currency: Optional[str] = None
    enable_forecasting: Optional[bool] = None
    default_all_day_event_start_time: Optional[str] = None
    default_all_day_event_end_time: Optional[str] = None


# ---------------------------------------------------------------------------
# Facebook helper schemas
# ---------------------------------------------------------------------------


class FacebookPageOut(Schema):
    id: str
    name: str
    category: str = ""
    access_token: str = ""


class FacebookFormOut(Schema):
    id: str
    name: str
    questions: Optional[list] = None


class FacebookFetchPagesIn(Schema):
    access_token: str


class FacebookFetchFormsIn(Schema):
    page_id: str
    access_token: str


# ---------------------------------------------------------------------------
# Exotel Make Call
# ---------------------------------------------------------------------------


class ExotelMakeCallIn(Schema):
    from_number: str
    to_number: str
    caller_id: str = ""


# ---------------------------------------------------------------------------
# WhatsApp Send Template
# ---------------------------------------------------------------------------


class WhatsAppSendTemplateIn(Schema):
    to_number: str
    template_name: str
    language: str = "en"
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None

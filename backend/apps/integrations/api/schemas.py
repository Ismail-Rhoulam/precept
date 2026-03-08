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
    display_name: str
    is_default: bool
    phone_number_id: str
    access_token: str
    business_account_id: str
    webhook_verify_token: str
    app_secret: str


class WhatsAppSettingsCreate(Schema):
    enabled: bool = False
    display_name: str = ""
    phone_number_id: str = ""
    access_token: str = ""
    business_account_id: str = ""
    webhook_verify_token: str = ""
    app_secret: str = ""


class WhatsAppSettingsUpdate(Schema):
    enabled: Optional[bool] = None
    display_name: Optional[str] = None
    is_default: Optional[bool] = None
    phone_number_id: Optional[str] = None
    access_token: Optional[str] = None
    business_account_id: Optional[str] = None
    webhook_verify_token: Optional[str] = None
    app_secret: Optional[str] = None


# ---------------------------------------------------------------------------
# Email Account
# ---------------------------------------------------------------------------


class EmailAccountOut(Schema):
    id: int
    enabled: bool
    display_name: str
    is_default: bool
    email_address: str
    smtp_mode: str
    mail_domain: str
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_use_tls: bool
    smtp_use_ssl: bool
    imap_host: str
    imap_port: int
    imap_username: str
    imap_password: str
    imap_use_ssl: bool
    imap_folder: str
    enable_incoming: bool
    last_synced_at: Optional[datetime] = None
    sync_frequency: str


class EmailAccountCreate(Schema):
    enabled: bool = False
    display_name: str = ""
    email_address: str
    smtp_mode: str = "external"
    mail_domain: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    imap_host: str = ""
    imap_port: int = 993
    imap_username: str = ""
    imap_password: str = ""
    imap_use_ssl: bool = True
    imap_folder: str = "INBOX"
    enable_incoming: bool = False
    sync_frequency: str = "Every 5 minutes"


class EmailAccountUpdate(Schema):
    enabled: Optional[bool] = None
    display_name: Optional[str] = None
    is_default: Optional[bool] = None
    email_address: Optional[str] = None
    smtp_mode: Optional[str] = None
    mail_domain: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    smtp_use_ssl: Optional[bool] = None
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    imap_username: Optional[str] = None
    imap_password: Optional[str] = None
    imap_use_ssl: Optional[bool] = None
    imap_folder: Optional[str] = None
    enable_incoming: Optional[bool] = None
    sync_frequency: Optional[str] = None


class EmailAccountTestIn(Schema):
    test_type: str  # "smtp" or "imap"


# ---------------------------------------------------------------------------
# Email Message
# ---------------------------------------------------------------------------


class EmailAttachmentOut(Schema):
    id: int
    filename: str
    file_url: Optional[str] = None
    mime_type: str
    file_size: int

    @staticmethod
    def resolve_file_url(obj):
        return obj.file.url if obj.file else None


class EmailMessageOut(Schema):
    id: int
    direction: str
    status: str
    from_email: str
    to_emails: list
    cc_emails: list
    bcc_emails: list
    subject: str
    body_html: str
    body_text: str
    message_id_header: str
    in_reply_to: str
    thread_id: str
    email_account_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    attachments: list = []
    error_message: str = ""
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_entity_type(obj):
        if obj.content_type_fk:
            return obj.content_type_fk.model
        return None

    @staticmethod
    def resolve_entity_id(obj):
        return obj.object_id

    @staticmethod
    def resolve_attachments(obj):
        return [EmailAttachmentOut.from_orm(a) for a in obj.attachments.all()]


class EmailComposeIn(Schema):
    to_emails: list[str]
    cc_emails: list[str] = []
    bcc_emails: list[str] = []
    subject: str = ""
    body_html: str = ""
    body_text: str = ""
    account_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    in_reply_to_id: Optional[int] = None
    attachment_ids: list[int] = []


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
    whatsapp_account_id: Optional[int] = None
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
    account_id: Optional[int] = None
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
    email_enabled: bool = False
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
    account_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Email Templates & Campaigns
# ---------------------------------------------------------------------------


class EmailTemplateOut(Schema):
    id: int
    name: str
    subject: str
    body_html: str
    body_text: str
    created_at: datetime
    updated_at: datetime


class EmailTemplateCreate(Schema):
    name: str
    subject: str
    body_html: str
    body_text: str = ""


class EmailTemplateUpdate(Schema):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None


class EmailCampaignOut(Schema):
    id: int
    name: str
    email_account_id: Optional[int] = None
    template_id: Optional[int] = None
    subject: str
    body_html: str
    status: str
    scheduled_at: Optional[datetime] = None
    recipients: list = []
    total_recipients: int
    sent_count: int
    failed_count: int
    created_at: datetime
    updated_at: datetime


class EmailCampaignCreate(Schema):
    name: str
    email_account_id: Optional[int] = None
    template_id: Optional[int] = None
    subject: str = ""
    body_html: str = ""
    recipients: list = []


class EmailCampaignUpdate(Schema):
    name: Optional[str] = None
    email_account_id: Optional[int] = None
    template_id: Optional[int] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    recipients: Optional[list] = None
    status: Optional[str] = None


class EmailCampaignLogOut(Schema):
    id: int
    recipient_email: str
    status: str
    error_message: str
    sent_at: Optional[datetime] = None
    email_message_id: Optional[int] = None


class EmailTemplatePreviewIn(Schema):
    context: dict = {}

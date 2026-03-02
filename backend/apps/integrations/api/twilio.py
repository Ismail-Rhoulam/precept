import logging

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.integrations.api.schemas import (
    TwilioSettingsCreate,
    TwilioSettingsOut,
    TwilioSettingsUpdate,
)
from apps.integrations.models import TwilioSettings
from apps.integrations.services.twilio_service import (
    generate_voice_token,
    handle_status_callback,
    handle_voice_webhook,
)

logger = logging.getLogger(__name__)

router = Router()


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


@router.get("/settings", response=TwilioSettingsOut)
def get_twilio_settings(request):
    """Get Twilio settings for the current tenant."""
    settings, _ = TwilioSettings.objects.get_or_create(
        company=request.company,
    )
    return settings


@router.post("/settings", response=TwilioSettingsOut)
def upsert_twilio_settings(request, payload: TwilioSettingsCreate):
    """Create or update Twilio settings (upsert)."""
    settings, created = TwilioSettings.objects.get_or_create(
        company=request.company,
    )
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(settings, attr, value)
    settings.save()
    return settings


# ---------------------------------------------------------------------------
# Voice Token
# ---------------------------------------------------------------------------


@router.get("/token")
def get_voice_token(request):
    """Generate a VoIP access token for the current user."""
    settings = get_object_or_404(TwilioSettings, company=request.company)
    if not settings.enabled:
        return {"error": "Twilio is not enabled"}
    token = generate_voice_token(request.auth, settings)
    return {"token": token}


# ---------------------------------------------------------------------------
# Webhooks (no auth)
# ---------------------------------------------------------------------------


@router.post("/voice-webhook", auth=None)
def twilio_voice_webhook(request):
    """
    Twilio voice webhook -- returns TwiML for call routing.
    No JWT auth; validated via Twilio signature in production.
    """
    request_data = request.POST.dict()

    # Try to find Twilio settings from the request context
    twilio_settings = TwilioSettings.unscoped.filter(enabled=True).first()

    twiml = handle_voice_webhook(request_data, twilio_settings)
    return HttpResponse(twiml, content_type="application/xml")


@router.post("/status-callback", auth=None)
def twilio_status_callback(request):
    """
    Twilio call status callback -- updates call log status.
    No JWT auth.
    """
    request_data = request.POST.dict()
    handle_status_callback(request_data)
    return {"status": "ok"}


@router.post("/recording-callback", auth=None)
def twilio_recording_callback(request):
    """
    Twilio recording callback -- updates call log with recording URL.
    No JWT auth.
    """
    from apps.communication.models import CallLog

    request_data = request.POST.dict()
    call_sid = request_data.get("CallSid", "")
    recording_url = request_data.get("RecordingUrl", "")

    if call_sid and recording_url:
        try:
            call_log = CallLog.unscoped.get(call_id=call_sid)
            call_log.recording_url = recording_url
            call_log.save(update_fields=["recording_url"])
            logger.info("Recording saved for call %s", call_sid)
        except CallLog.DoesNotExist:
            logger.warning("Call log not found for recording callback: %s", call_sid)

    return {"status": "ok"}

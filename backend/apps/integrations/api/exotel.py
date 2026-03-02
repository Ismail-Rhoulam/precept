import logging
import uuid
from datetime import timedelta

import requests as http_requests
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.integrations.api.schemas import (
    ExotelMakeCallIn,
    ExotelSettingsCreate,
    ExotelSettingsOut,
    ExotelSettingsUpdate,
)
from apps.integrations.models import ExotelSettings

logger = logging.getLogger(__name__)

router = Router()


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


@router.get("/settings", response=ExotelSettingsOut)
def get_exotel_settings(request):
    """Get Exotel settings for the current tenant."""
    settings, _ = ExotelSettings.objects.get_or_create(
        company=request.company,
    )
    return settings


@router.post("/settings", response=ExotelSettingsOut)
def upsert_exotel_settings(request, payload: ExotelSettingsCreate):
    """Create or update Exotel settings (upsert)."""
    settings, created = ExotelSettings.objects.get_or_create(
        company=request.company,
    )
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(settings, attr, value)
    settings.save()
    return settings


# ---------------------------------------------------------------------------
# Webhook (no auth, validated by token query param)
# ---------------------------------------------------------------------------


@router.post("/webhook", auth=None)
def exotel_webhook(request):
    """
    Exotel incoming call webhook.
    Validated by webhook_verify_token query parameter. No JWT auth.
    """
    from apps.communication.models import CallLog

    verify_token = request.GET.get("token", "")
    exotel_settings = ExotelSettings.unscoped.filter(
        enabled=True, webhook_verify_token=verify_token
    ).first()

    if not exotel_settings and verify_token:
        return {"error": "Invalid verify token"}

    request_data = request.POST.dict()
    call_sid = request_data.get("CallSid", "")
    call_status = request_data.get("Status", "")
    from_number = request_data.get("From", "")
    to_number = request_data.get("To", "")
    call_duration = request_data.get("Duration")
    recording_url = request_data.get("RecordingUrl", "")

    status_map = {
        "completed": CallLog.Status.COMPLETED,
        "busy": CallLog.Status.MISSED,
        "no-answer": CallLog.Status.MISSED,
        "failed": CallLog.Status.FAILED,
        "ringing": CallLog.Status.RINGING,
        "in-progress": CallLog.Status.IN_PROGRESS,
    }
    mapped_status = status_map.get(call_status, CallLog.Status.INITIATED)

    # Try to update existing call log or create a new one
    try:
        call_log = CallLog.unscoped.get(call_id=call_sid)
        call_log.status = mapped_status
        if call_duration:
            call_log.duration = timedelta(seconds=int(call_duration))
        if recording_url:
            call_log.recording_url = recording_url
        call_log.save(update_fields=["status", "duration", "recording_url"])
    except CallLog.DoesNotExist:
        call_log_data = {
            "call_id": call_sid or str(uuid.uuid4()),
            "caller_number": from_number,
            "receiver_number": to_number,
            "status": mapped_status,
            "call_type": CallLog.CallType.INCOMING,
            "telephony_medium": CallLog.TelephonyMedium.EXOTEL,
        }
        if exotel_settings:
            call_log_data["company"] = exotel_settings.company
        if call_duration:
            call_log_data["duration"] = timedelta(seconds=int(call_duration))
        if recording_url:
            call_log_data["recording_url"] = recording_url
        CallLog.unscoped.create(**call_log_data)

    logger.info("Exotel webhook: CallSid=%s, Status=%s", call_sid, call_status)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Make Call
# ---------------------------------------------------------------------------


@router.post("/make-call")
def make_exotel_call(request, payload: ExotelMakeCallIn):
    """Initiate an outgoing call via Exotel API."""
    settings = get_object_or_404(ExotelSettings, company=request.company)
    if not settings.enabled:
        return {"error": "Exotel is not enabled"}

    url = (
        f"https://{settings.subdomain}/v1/Accounts/{settings.account_sid}/Calls/connect"
    )

    call_data = {
        "From": payload.from_number,
        "To": payload.to_number,
        "CallerId": payload.caller_id or payload.from_number,
    }

    try:
        response = http_requests.post(
            url,
            data=call_data,
            auth=(settings.api_key, settings.api_token),
        )
        response.raise_for_status()
        result = response.json()

        # Create a call log entry
        from apps.communication.models import CallLog

        CallLog.objects.create(
            call_id=result.get("Call", {}).get("Sid", str(uuid.uuid4())),
            caller_number=payload.from_number,
            receiver_number=payload.to_number,
            status=CallLog.Status.INITIATED,
            call_type=CallLog.CallType.OUTGOING,
            telephony_medium=CallLog.TelephonyMedium.EXOTEL,
            company=request.company,
            caller=request.auth,
        )

        return {"status": "ok", "data": result}
    except http_requests.RequestException as e:
        logger.error("Exotel make call failed: %s", str(e))
        return {"error": str(e)}

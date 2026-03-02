import logging

from django.db import models

logger = logging.getLogger(__name__)


def generate_voice_token(user, twilio_settings):
    """Generate a Twilio AccessToken with VoiceGrant for the Voice SDK."""
    from twilio.jwt.access_token import AccessToken
    from twilio.jwt.access_token.grants import VoiceGrant

    identity = user.email.replace("@", "_at_")
    token = AccessToken(
        twilio_settings.account_sid,
        twilio_settings.api_key,
        twilio_settings.api_secret,
        identity=identity,
        ttl=3600,
    )
    voice_grant = VoiceGrant(
        outgoing_application_sid=twilio_settings.twiml_sid,
        incoming_allow=True,
    )
    token.add_grant(voice_grant)
    return token.to_jwt()


def handle_voice_webhook(request_data, twilio_settings):
    """
    Handle Twilio voice webhook -- return TwiML for call routing.

    Parse the To/From numbers, determine if outgoing or incoming,
    and return TwiML XML as a string.
    """
    to_number = request_data.get("To", "")
    from_number = request_data.get("From", "")
    call_sid = request_data.get("CallSid", "")

    # If the To starts with "client:" it is a client-to-client call
    if to_number.startswith("client:"):
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            f'<Dial callerId="{from_number}">'
            f"<Client>{to_number.replace('client:', '')}</Client>"
            "</Dial>"
            "</Response>"
        )
    else:
        # Outgoing call to a phone number
        record = "true" if twilio_settings and twilio_settings.record_calls else "false"
        twiml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            f'<Dial callerId="{from_number}" record="{record}-calls">'
            f"<Number>{to_number}</Number>"
            "</Dial>"
            "</Response>"
        )

    logger.info("Twilio voice webhook: CallSid=%s, From=%s, To=%s", call_sid, from_number, to_number)
    return twiml


def handle_status_callback(request_data):
    """Update call log status from Twilio status callback."""
    from apps.communication.models import CallLog

    call_sid = request_data.get("CallSid", "")
    call_status = request_data.get("CallStatus", "")
    call_duration = request_data.get("CallDuration")
    recording_url = request_data.get("RecordingUrl", "")

    status_map = {
        "initiated": CallLog.Status.INITIATED,
        "ringing": CallLog.Status.RINGING,
        "in-progress": CallLog.Status.IN_PROGRESS,
        "completed": CallLog.Status.COMPLETED,
        "no-answer": CallLog.Status.MISSED,
        "busy": CallLog.Status.MISSED,
        "failed": CallLog.Status.FAILED,
        "canceled": CallLog.Status.FAILED,
    }

    try:
        call_log = CallLog.unscoped.get(call_id=call_sid)
        mapped_status = status_map.get(call_status, call_status)
        call_log.status = mapped_status

        if call_duration:
            from datetime import timedelta

            call_log.duration = timedelta(seconds=int(call_duration))

        if recording_url:
            call_log.recording_url = recording_url

        call_log.save(update_fields=["status", "duration", "recording_url"])
        logger.info("Updated call log %s: status=%s", call_sid, mapped_status)
    except CallLog.DoesNotExist:
        logger.warning("Call log not found for CallSid=%s", call_sid)


def find_entity_by_phone(phone_number):
    """Search Contact, Lead by phone number. Returns (entity_type, entity_id) or None."""
    from apps.crm.models import Contact, Lead

    if not phone_number or len(phone_number) < 7:
        return None

    suffix = phone_number[-10:]

    # Search contacts first, then leads
    contact = Contact.objects.filter(
        models.Q(mobile_no__endswith=suffix)
        | models.Q(phone__endswith=suffix)
    ).first()
    if contact:
        return ("contact", contact.id)

    lead = Lead.objects.filter(
        models.Q(mobile_no__endswith=suffix)
        | models.Q(phone__endswith=suffix)
    ).first()
    if lead:
        return ("lead", lead.id)

    return None

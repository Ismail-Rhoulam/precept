import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


def _notify_event(event, message):
    from django.contrib.contenttypes.models import ContentType

    from apps.communication.models import EventParticipant, Notification
    from apps.realtime.utils import send_user_notification

    ct = ContentType.objects.get_for_model(event)
    recipients = set()
    if event.owner_id:
        recipients.add(event.owner)
    for ep in EventParticipant.objects.filter(event=event).select_related("user"):
        recipients.add(ep.user)

    for user in recipients:
        Notification.objects.create(
            company=event.company,
            notification_text=message,
            from_user=event.owner,
            to_user=user,
            type="Event",
            reference_content_type=ct,
            reference_object_id=event.id,
            created_by=event.owner,
            modified_by=event.owner,
        )
        send_user_notification(user.id, {
            "notification_type": "Event",
            "event_subject": event.subject,
            "message": message,
        })


@shared_task
def trigger_offset_event_notifications():
    from apps.communication.models import Event

    now = timezone.now()
    soon = now + timedelta(minutes=15)
    events = Event.objects.filter(starts_on__gte=now, starts_on__lte=soon)
    for event in events:
        _notify_event(event, f"Your event '{event.subject}' starts in 15 minutes")


@shared_task
def trigger_hourly_event_notifications():
    from apps.communication.models import Event

    now = timezone.now()
    hour_later = now + timedelta(hours=1)
    events = Event.objects.filter(starts_on__gte=now, starts_on__lte=hour_later)
    for event in events:
        _notify_event(event, f"Your event '{event.subject}' starts in 1 hour")


@shared_task
def trigger_daily_event_notifications():
    from apps.communication.models import Event

    tomorrow = timezone.now().date() + timedelta(days=1)
    events = Event.objects.filter(starts_on__date=tomorrow)
    for event in events:
        _notify_event(event, f"Reminder: '{event.subject}' is tomorrow")


@shared_task
def trigger_weekly_event_notifications():
    from apps.communication.models import Event

    today = timezone.now().date()
    week_end = today + timedelta(days=7)
    events = Event.objects.filter(
        starts_on__date__gte=today, starts_on__date__lte=week_end
    )
    for event in events:
        _notify_event(
            event,
            f"This week: '{event.subject}' on {event.starts_on.strftime('%A %b %d')}",
        )

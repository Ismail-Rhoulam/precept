import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("precept")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "trigger-offset-event-notifications": {
        "task": "apps.communication.tasks.trigger_offset_event_notifications",
        "schedule": 60.0,
    },
    "trigger-hourly-event-notifications": {
        "task": "apps.communication.tasks.trigger_hourly_event_notifications",
        "schedule": crontab(minute=0),
    },
    "trigger-daily-event-notifications": {
        "task": "apps.communication.tasks.trigger_daily_event_notifications",
        "schedule": crontab(hour=0, minute=0),
    },
    "trigger-weekly-event-notifications": {
        "task": "apps.communication.tasks.trigger_weekly_event_notifications",
        "schedule": crontab(day_of_week=1, hour=0, minute=0),
    },
    "sync-leads-5min": {
        "task": "apps.integrations.tasks.sync_leads_from_sources",
        "schedule": crontab(minute="*/5"),
        "args": ("Every 5 minutes",),
    },
    "sync-leads-15min": {
        "task": "apps.integrations.tasks.sync_leads_from_sources",
        "schedule": crontab(minute="*/15"),
        "args": ("Every 15 minutes",),
    },
    "sync-leads-hourly": {
        "task": "apps.integrations.tasks.sync_leads_from_sources",
        "schedule": crontab(minute=0),
        "args": ("Hourly",),
    },
    "sync-leads-daily": {
        "task": "apps.integrations.tasks.sync_leads_from_sources",
        "schedule": crontab(hour=2, minute=0),
        "args": ("Daily",),
    },
    "sync-email-5min": {
        "task": "apps.integrations.tasks.sync_email_inboxes",
        "schedule": crontab(minute="*/5"),
        "args": ("Every 5 minutes",),
    },
    "sync-email-15min": {
        "task": "apps.integrations.tasks.sync_email_inboxes",
        "schedule": crontab(minute="*/15"),
        "args": ("Every 15 minutes",),
    },
    "sync-email-hourly": {
        "task": "apps.integrations.tasks.sync_email_inboxes",
        "schedule": crontab(minute=0),
        "args": ("Hourly",),
    },
}

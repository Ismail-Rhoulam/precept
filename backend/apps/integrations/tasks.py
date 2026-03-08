import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def sync_leads_from_sources(frequency_label):
    from apps.integrations.models import LeadSyncSource
    from apps.integrations.services.facebook_sync import sync_leads_from_facebook

    sources = LeadSyncSource.objects.filter(
        enabled=True,
        sync_frequency=frequency_label,
    )
    total = 0
    for source in sources:
        try:
            count = sync_leads_from_facebook(source)
            total += count
            logger.info("Synced %d leads from %s", count, source.name)
        except Exception:
            logger.exception("Failed to sync from %s", source.name)
    return total


# ---------------------------------------------------------------------------
# Email tasks
# ---------------------------------------------------------------------------


@shared_task
def send_email_task(email_message_id):
    """Send a single email asynchronously via SMTP."""
    from apps.integrations.models import EmailMessage
    from apps.integrations.services.email_service import send_email

    msg = EmailMessage.unscoped.select_related("email_account").get(pk=email_message_id)
    msg.status = EmailMessage.Status.SENDING
    msg.save(update_fields=["status"])

    try:
        send_email(msg.email_account, msg)
        msg.status = EmailMessage.Status.SENT
        msg.save(update_fields=["status"])
        logger.info("Email %d sent successfully", email_message_id)
    except Exception as e:
        msg.status = EmailMessage.Status.FAILED
        msg.error_message = str(e)
        msg.save(update_fields=["status", "error_message"])
        logger.exception("Failed to send email %d", email_message_id)


@shared_task
def sync_email_inboxes(frequency_label):
    """Sync all enabled email accounts matching the given frequency."""
    from apps.integrations.models import EmailAccount
    from apps.integrations.services.email_service import sync_imap_inbox

    accounts = EmailAccount.unscoped.filter(
        enabled=True,
        enable_incoming=True,
        sync_frequency=frequency_label,
    )
    total = 0
    for account in accounts:
        try:
            count = sync_imap_inbox(account)
            total += count
        except Exception:
            logger.exception(
                "Failed to sync email account %s", account.email_address
            )
    return total


@shared_task
def send_campaign_task(campaign_id):
    """Process and send a campaign to all recipients."""
    import time

    from django.contrib.contenttypes.models import ContentType
    from django.utils import timezone

    from apps.integrations.models.email_campaign import EmailCampaign, EmailCampaignLog
    from apps.integrations.models.email_message import EmailMessage
    from apps.integrations.services.email_service import render_template, send_email

    campaign = EmailCampaign.unscoped.select_related(
        "email_account", "template"
    ).get(pk=campaign_id)
    campaign.status = EmailCampaign.Status.SENDING
    campaign.save(update_fields=["status"])

    subject_tpl = campaign.template.subject if campaign.template else campaign.subject
    body_tpl = campaign.template.body_html if campaign.template else campaign.body_html

    sent = 0
    failed = 0

    for recipient in campaign.recipients:
        context = {**recipient}
        subject = render_template(subject_tpl, context)
        body_html = render_template(body_tpl, context)

        msg = EmailMessage(
            company=campaign.company,
            email_account=campaign.email_account,
            direction=EmailMessage.Direction.OUTGOING,
            status=EmailMessage.Status.QUEUED,
            from_email=campaign.email_account.email_address,
            to_emails=[recipient["email"]],
            subject=subject,
            body_html=body_html,
        )

        # Link to entity if provided
        entity_type = recipient.get("entity_type")
        entity_id = recipient.get("entity_id")
        if entity_type and entity_id:
            model_map = {"lead": "crm.lead", "deal": "crm.deal", "contact": "crm.contact"}
            key = model_map.get(entity_type)
            if key:
                app_label, model = key.split(".")
                ct = ContentType.objects.get(app_label=app_label, model=model)
                msg.content_type_fk = ct
                msg.object_id = entity_id

        msg.save()

        try:
            send_email(campaign.email_account, msg)
            msg.status = EmailMessage.Status.SENT
            msg.save(update_fields=["status"])
            EmailCampaignLog.objects.create(
                company=campaign.company,
                campaign=campaign,
                recipient_email=recipient["email"],
                status="Sent",
                email_message=msg,
                sent_at=timezone.now(),
            )
            sent += 1
        except Exception as e:
            msg.status = EmailMessage.Status.FAILED
            msg.error_message = str(e)
            msg.save(update_fields=["status", "error_message"])
            EmailCampaignLog.objects.create(
                company=campaign.company,
                campaign=campaign,
                recipient_email=recipient["email"],
                status="Failed",
                error_message=str(e),
                email_message=msg,
            )
            failed += 1

        # Rate limit to avoid SMTP throttling
        time.sleep(0.1)

    campaign.sent_count = sent
    campaign.failed_count = failed
    campaign.total_recipients = len(campaign.recipients)
    campaign.status = EmailCampaign.Status.SENT
    campaign.save(update_fields=["sent_count", "failed_count", "total_recipients", "status"])
    logger.info(
        "Campaign %d complete: %d sent, %d failed", campaign_id, sent, failed
    )

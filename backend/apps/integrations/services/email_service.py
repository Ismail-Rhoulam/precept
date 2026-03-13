import email as email_lib
import email.policy
import imaplib
import logging
import os
import smtplib
import uuid
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, make_msgid

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

DKIM_SELECTOR = os.environ.get("DKIM_SELECTOR", "mail")
DKIM_KEY_DIR = "/etc/opendkim/keys"


def _dkim_sign(msg_bytes: bytes, mail_domain: str) -> bytes:
    """Add a DKIM-Signature header using the domain's private key."""
    try:
        import dkim

        key_path = os.path.join(DKIM_KEY_DIR, mail_domain, f"{DKIM_SELECTOR}.private")
        with open(key_path, "rb") as f:
            private_key = f.read()

        sig = dkim.sign(
            msg_bytes,
            DKIM_SELECTOR.encode(),
            mail_domain.encode(),
            private_key,
            canonicalize=(b"relaxed", b"relaxed"),
        )
        return sig + msg_bytes
    except Exception:
        logger.exception("DKIM signing failed for %s — sending unsigned", mail_domain)
        return msg_bytes


# ---------------------------------------------------------------------------
# Connection testing
# ---------------------------------------------------------------------------


def test_smtp_connection(email_account):
    """Test SMTP connection with the given account credentials.

    Returns ``{"success": True}`` or ``{"success": False, "error": "..."}``.
    """
    try:
        if getattr(email_account, "smtp_mode", "external") == "builtin":
            host = os.environ.get("POSTFIX_HOST", "postfix")
            port = int(os.environ.get("POSTFIX_PORT", "25"))
            server = smtplib.SMTP(host, port, timeout=15)
            server.ehlo()
        elif email_account.smtp_use_ssl:
            server = smtplib.SMTP_SSL(
                email_account.smtp_host, email_account.smtp_port, timeout=15
            )
        else:
            server = smtplib.SMTP(
                email_account.smtp_host, email_account.smtp_port, timeout=15
            )
            server.ehlo()
            if email_account.smtp_use_tls:
                server.starttls()
                server.ehlo()

            if email_account.smtp_username and email_account.smtp_password:
                server.login(email_account.smtp_username, email_account.smtp_password)

        server.quit()
        return {"success": True}
    except Exception as e:
        logger.warning("SMTP test failed for %s: %s", email_account.email_address, e)
        return {"success": False, "error": str(e)}


def test_imap_connection(email_account):
    """Test IMAP connection with the given account credentials.

    Returns ``{"success": True}`` or ``{"success": False, "error": "..."}``.
    """
    try:
        if email_account.imap_use_ssl:
            conn = imaplib.IMAP4_SSL(
                email_account.imap_host, email_account.imap_port
            )
        else:
            conn = imaplib.IMAP4(
                email_account.imap_host, email_account.imap_port
            )

        conn.login(
            email_account.imap_username or email_account.smtp_username,
            email_account.imap_password or email_account.smtp_password,
        )
        conn.select(email_account.imap_folder, readonly=True)
        conn.logout()
        return {"success": True}
    except Exception as e:
        logger.warning("IMAP test failed for %s: %s", email_account.email_address, e)
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Sending via SMTP
# ---------------------------------------------------------------------------


def send_email(email_account, email_message):
    """Send an email via SMTP.

    Constructs a proper MIME message with HTML + plain text alternatives,
    attaches files, and sets threading headers.
    """
    msg = MIMEMultipart("mixed")
    msg["From"] = formataddr(
        (email_account.display_name or "", email_account.email_address)
    )
    msg["To"] = ", ".join(email_message.to_emails)
    if email_message.cc_emails:
        msg["Cc"] = ", ".join(email_message.cc_emails)
    msg["Subject"] = email_message.subject

    # Generate Message-ID
    domain = email_account.email_address.split("@")[-1]
    message_id = make_msgid(domain=domain)
    msg["Message-ID"] = message_id
    email_message.message_id_header = message_id

    # Threading headers
    if email_message.in_reply_to:
        msg["In-Reply-To"] = email_message.in_reply_to
    if email_message.references_header:
        msg["References"] = email_message.references_header

    # Body — prefer HTML with plain text alternative
    body_alt = MIMEMultipart("alternative")
    if email_message.body_text:
        body_alt.attach(MIMEText(email_message.body_text, "plain", "utf-8"))
    if email_message.body_html:
        body_alt.attach(MIMEText(email_message.body_html, "html", "utf-8"))
    elif email_message.body_text:
        pass  # Already added plain text above
    else:
        body_alt.attach(MIMEText("", "plain", "utf-8"))
    msg.attach(body_alt)

    # Attachments
    for attachment in email_message.attachments.all():
        if attachment.file:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.file.read())
            email_lib.encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                "attachment",
                filename=attachment.filename,
            )
            if attachment.mime_type:
                maintype, _, subtype = attachment.mime_type.partition("/")
                part.set_type(attachment.mime_type)
            msg.attach(part)

    # All recipients
    all_recipients = list(email_message.to_emails)
    all_recipients.extend(email_message.cc_emails or [])
    all_recipients.extend(email_message.bcc_emails or [])

    # Send — branch on smtp_mode
    is_builtin = getattr(email_account, "smtp_mode", "external") == "builtin"
    if is_builtin:
        host = os.environ.get("POSTFIX_HOST", "postfix")
        port = int(os.environ.get("POSTFIX_PORT", "25"))
        server = smtplib.SMTP(host, port, timeout=30)
        server.ehlo()
    elif email_account.smtp_use_ssl:
        server = smtplib.SMTP_SSL(
            email_account.smtp_host, email_account.smtp_port, timeout=30
        )
    else:
        server = smtplib.SMTP(
            email_account.smtp_host, email_account.smtp_port, timeout=30
        )
        server.ehlo()
        if email_account.smtp_use_tls:
            server.starttls()
            server.ehlo()

        if email_account.smtp_username and email_account.smtp_password:
            server.login(email_account.smtp_username, email_account.smtp_password)

    msg_data = msg.as_bytes()

    # DKIM-sign for built-in Postfix delivery
    if is_builtin and email_account.mail_domain:
        msg_data = _dkim_sign(msg_data, email_account.mail_domain)

    server.sendmail(email_account.email_address, all_recipients, msg_data)
    server.quit()

    # Update message ID on the record
    email_message.save(update_fields=["message_id_header"])

    logger.info(
        "Sent email from %s to %s: %s",
        email_account.email_address,
        email_message.to_emails,
        email_message.subject[:60],
    )


# ---------------------------------------------------------------------------
# IMAP Sync
# ---------------------------------------------------------------------------


def sync_imap_inbox(email_account):
    """Sync new messages from IMAP inbox. Returns count of new messages."""
    from apps.integrations.models import EmailAttachment, EmailMessage

    if email_account.imap_use_ssl:
        conn = imaplib.IMAP4_SSL(email_account.imap_host, email_account.imap_port)
    else:
        conn = imaplib.IMAP4(email_account.imap_host, email_account.imap_port)

    conn.login(
        email_account.imap_username or email_account.smtp_username,
        email_account.imap_password or email_account.smtp_password,
    )
    conn.select(email_account.imap_folder)

    # Incremental: search for UIDs greater than last synced
    if email_account.last_synced_uid:
        _, data = conn.uid("SEARCH", None, f"UID {email_account.last_synced_uid}:*")
    else:
        _, data = conn.uid("SEARCH", None, "ALL")

    uid_list = data[0].split() if data[0] else []
    # Filter out the last_synced_uid itself (IMAP range is inclusive)
    if email_account.last_synced_uid:
        uid_list = [
            u for u in uid_list
            if u.decode() != email_account.last_synced_uid
        ]

    count = 0
    max_uid = email_account.last_synced_uid or ""

    for uid_bytes in uid_list:
        uid_str = uid_bytes.decode()

        # Skip if already imported (idempotency)
        if EmailMessage.unscoped.filter(
            email_account=email_account, imap_uid=uid_str
        ).exists():
            if uid_str > max_uid:
                max_uid = uid_str
            continue

        _, msg_data = conn.uid("FETCH", uid_bytes, "(RFC822)")
        if not msg_data or not msg_data[0]:
            continue

        raw = msg_data[0][1]
        parsed = email_lib.message_from_bytes(raw, policy=email_lib.policy.default)

        from_header = parsed.get("From", "")
        from_email = _extract_email(from_header)
        to_emails = _extract_email_list(parsed.get("To", ""))
        cc_emails = _extract_email_list(parsed.get("Cc", ""))
        subject = parsed.get("Subject", "")
        message_id_header = parsed.get("Message-ID", "")
        in_reply_to = parsed.get("In-Reply-To", "")
        references = parsed.get("References", "")

        # Extract body
        body_html = ""
        body_text = ""
        if parsed.is_multipart():
            for part in parsed.walk():
                ct = part.get_content_type()
                if ct == "text/html" and not body_html:
                    body_html = part.get_content()
                elif ct == "text/plain" and not body_text:
                    body_text = part.get_content()
        else:
            ct = parsed.get_content_type()
            content = parsed.get_content()
            if ct == "text/html":
                body_html = content
            else:
                body_text = content

        # Compute thread_id from References or In-Reply-To
        thread_id = _compute_thread_id(message_id_header, in_reply_to, references)

        email_msg = EmailMessage(
            company=email_account.company,
            email_account=email_account,
            direction=EmailMessage.Direction.INCOMING,
            status=EmailMessage.Status.RECEIVED,
            from_email=from_email,
            to_emails=to_emails,
            cc_emails=cc_emails,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            message_id_header=message_id_header,
            in_reply_to=in_reply_to,
            references_header=references,
            thread_id=thread_id,
            imap_uid=uid_str,
        )
        email_msg.save()

        # Extract and save attachments
        if parsed.is_multipart():
            from django.conf import settings as django_settings

            media_dir = os.path.join(django_settings.MEDIA_ROOT, "email_attachments")
            os.makedirs(media_dir, exist_ok=True)

            for part in parsed.walk():
                if part.get_content_disposition() == "attachment":
                    filename = part.get_filename() or "attachment"
                    payload = part.get_payload(decode=True)
                    if payload:
                        ext = os.path.splitext(filename)[1]
                        stored_name = f"{uuid.uuid4().hex}{ext}"
                        filepath = os.path.join(media_dir, stored_name)
                        with open(filepath, "wb") as f:
                            f.write(payload)
                        EmailAttachment.objects.create(
                            company=email_account.company,
                            email_message=email_msg,
                            filename=filename,
                            file=f"email_attachments/{stored_name}",
                            mime_type=part.get_content_type(),
                            file_size=len(payload),
                        )

        # Auto-link to entity
        _auto_link_email(email_msg, email_account)

        # Broadcast via WebSocket
        _broadcast_email_event("new_message", {
            "email_id": email_msg.id,
            "from_email": email_msg.from_email,
            "subject": email_msg.subject,
            "email_account_id": email_account.id,
        })

        count += 1
        if uid_str > max_uid:
            max_uid = uid_str

    conn.logout()

    # Update sync state
    from django.utils import timezone

    if max_uid:
        email_account.last_synced_uid = max_uid
    email_account.last_synced_at = timezone.now()
    email_account.save(update_fields=["last_synced_uid", "last_synced_at"])

    logger.info(
        "Synced %d emails for %s", count, email_account.email_address
    )
    return count


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_email(header_value):
    """Extract email address from a header like 'Name <email@example.com>'."""
    if "<" in header_value and ">" in header_value:
        return header_value.split("<")[1].split(">")[0].strip()
    return header_value.strip()


def _extract_email_list(header_value):
    """Extract list of email addresses from a comma-separated header."""
    if not header_value:
        return []
    return [_extract_email(part) for part in header_value.split(",") if "@" in part]


def _compute_thread_id(message_id, in_reply_to, references):
    """Derive a stable thread ID for grouping messages."""
    # Use the first message ID in the References chain
    if references:
        refs = references.strip().split()
        if refs:
            return refs[0]
    # Fall back to In-Reply-To
    if in_reply_to:
        return in_reply_to.strip()
    # New thread — use own Message-ID
    return message_id.strip() if message_id else ""


def _auto_link_email(email_msg, email_account):
    """Auto-link incoming email to Lead/Deal/Contact by email address."""
    from django.contrib.contenttypes.models import ContentType

    # First check if this is part of an existing thread
    if email_msg.in_reply_to:
        from apps.integrations.models import EmailMessage

        parent = EmailMessage.unscoped.filter(
            message_id_header=email_msg.in_reply_to,
            content_type_fk__isnull=False,
        ).first()
        if parent:
            email_msg.content_type_fk = parent.content_type_fk
            email_msg.object_id = parent.object_id
            email_msg.save(update_fields=["content_type_fk", "object_id"])
            return

    # Collect external addresses
    all_addresses = set()
    all_addresses.add(email_msg.from_email)
    all_addresses.update(email_msg.to_emails)
    all_addresses.update(email_msg.cc_emails)
    all_addresses.discard(email_account.email_address)

    if not all_addresses:
        return

    from apps.crm.models.contact import Contact
    from apps.crm.models.deal import Deal
    from apps.crm.models.lead import Lead

    company = email_account.company

    for addr in all_addresses:
        # Try Lead first
        lead = Lead.objects.filter(company=company, email=addr).first()
        if lead:
            ct = ContentType.objects.get_for_model(Lead)
            email_msg.content_type_fk = ct
            email_msg.object_id = lead.pk
            email_msg.save(update_fields=["content_type_fk", "object_id"])
            return

        # Then Contact
        contact = Contact.objects.filter(company=company, email_id=addr).first()
        if contact:
            ct = ContentType.objects.get_for_model(Contact)
            email_msg.content_type_fk = ct
            email_msg.object_id = contact.pk
            email_msg.save(update_fields=["content_type_fk", "object_id"])
            return

        # Then Deal
        deal = Deal.objects.filter(company=company, email=addr).first()
        if deal:
            ct = ContentType.objects.get_for_model(Deal)
            email_msg.content_type_fk = ct
            email_msg.object_id = deal.pk
            email_msg.save(update_fields=["content_type_fk", "object_id"])
            return


def _broadcast_email_event(event_type, data):
    """Broadcast an email event to all connected WebSocket clients."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "crm_updates",
            {
                "type": "email_message",
                "data": {"type": "email_message", "event": event_type, **data},
            },
        )
    except Exception:
        logger.exception("Failed to broadcast email event via WebSocket")


# ---------------------------------------------------------------------------
# Template rendering (for campaigns)
# ---------------------------------------------------------------------------


def render_template(template_html, context):
    """Simple {{variable}} substitution."""
    import re

    def _replace(match):
        key = match.group(1).strip()
        return str(context.get(key, match.group(0)))

    return re.sub(r"\{\{(\s*\w+\s*)\}\}", _replace, template_html)

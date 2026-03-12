import json
import logging
import os
import socket
from typing import Any, Dict, List, Optional

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja import Router

from apps.integrations.api.schemas import (
    EmailAccountCreate,
    EmailAccountOut,
    EmailAccountTestIn,
    EmailAccountUpdate,
    EmailCampaignCreate,
    EmailCampaignLogOut,
    EmailCampaignOut,
    EmailCampaignUpdate,
    EmailComposeIn,
    EmailMessageOut,
    EmailTemplateCreate,
    EmailTemplateOut,
    EmailTemplatePreviewIn,
    EmailTemplateUpdate,
    MailDomainCreate,
    MailDomainOut,
)
from apps.integrations.models import EmailAccount, EmailAttachment, EmailMessage, MailDomain

logger = logging.getLogger(__name__)

router = Router()

ENTITY_MODEL_MAP = {
    "lead": "crm.lead",
    "deal": "crm.deal",
    "contact": "crm.contact",
}


def _get_content_type(entity_type: str):
    key = ENTITY_MODEL_MAP.get(entity_type)
    if not key:
        return None
    app_label, model = key.split(".")
    return ContentType.objects.get(app_label=app_label, model=model)


def _resolve_email_account(company, to_email=None, account_id=None):
    """Resolve which email account to use for sending.

    Priority: explicit account_id → conversation history → default → any.
    """
    if account_id:
        return get_object_or_404(
            EmailAccount, pk=account_id, company=company, enabled=True
        )

    if to_email:
        recent = (
            EmailMessage.objects.filter(
                company=company, email_account__isnull=False
            )
            .filter(
                Q(to_emails__contains=to_email) | Q(from_email=to_email)
            )
            .select_related("email_account")
            .order_by("-created_at")
            .first()
        )
        if recent and recent.email_account and recent.email_account.enabled:
            return recent.email_account

    default = EmailAccount.objects.filter(
        company=company, enabled=True, is_default=True
    ).first()
    if default:
        return default

    any_account = EmailAccount.objects.filter(company=company, enabled=True).first()
    return any_account


def _write_postfix_config(domain: str) -> bool:
    """Write a domain to the shared Postfix config file with world-writable permissions.

    Uses a temp file + rename for atomicity, and chmod 666 so any container
    user (backend uid 100, celery, etc.) can overwrite the file later.
    """
    config_path = "/etc/opendkim/keys/postfix_config.json"
    tmp_path = config_path + ".tmp"
    try:
        fd = os.open(tmp_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o666)
        with os.fdopen(fd, "w") as f:
            json.dump({"mail_domain": domain, "dkim_selector": "mail"}, f)
        os.replace(tmp_path, config_path)
        # Ensure the final file is also world-writable (replace preserves tmp perms)
        os.chmod(config_path, 0o666)
        logger.info("Wrote postfix config: mail_domain=%s", domain)
        return True
    except Exception:
        logger.exception("Could not write postfix config")
        return False


def _sync_postfix_config():
    """Write the active builtin mail domain to a shared config file.

    The Postfix entrypoint reads ``/etc/opendkim/keys/postfix_config.json``
    on startup to configure its domain and DKIM keys.
    """
    try:
        account = (
            EmailAccount.unscoped
            .filter(smtp_mode="builtin", enabled=True)
            .order_by("-is_default", "-pk")
            .first()
        )
        domain = account.mail_domain if account else ""
        _write_postfix_config(domain)
    except Exception:
        logger.debug("Could not write postfix config (volume may not be mounted)")


def _get_builtin_mail_domain():
    """Return the active built-in mail domain from DB, config file, or env."""
    account = (
        EmailAccount.unscoped
        .filter(smtp_mode="builtin", enabled=True)
        .order_by("-is_default", "-pk")
        .first()
    )
    if account and account.mail_domain:
        return account.mail_domain

    # Fall back to the provisioned config file (domain set before account saved)
    config_path = "/etc/opendkim/keys/postfix_config.json"
    try:
        with open(config_path) as f:
            data = json.load(f)
        domain = data.get("mail_domain", "")
        if domain:
            return domain
    except Exception:
        pass

    return os.environ.get("MAIL_DOMAIN", "")


# ---------------------------------------------------------------------------
# Settings (CRUD list) — mirrors WhatsApp account pattern
# ---------------------------------------------------------------------------


@router.get("/settings", response=List[EmailAccountOut])
def list_email_accounts(request):
    """List all email accounts for the current tenant."""
    return list(EmailAccount.objects.filter(company=request.company))


@router.post("/settings", response={201: EmailAccountOut})
def create_email_account(request, payload: EmailAccountCreate):
    """Create a new email account."""
    data = payload.dict(exclude_unset=True)
    data["company"] = request.company

    if not EmailAccount.objects.filter(company=request.company).exists():
        data["is_default"] = True

    account = EmailAccount.objects.create(**data)
    if account.smtp_mode == "builtin":
        _sync_postfix_config()
    return 201, account


@router.get("/settings/{account_id}", response=EmailAccountOut)
def get_email_account(request, account_id: int):
    """Get a single email account."""
    return get_object_or_404(EmailAccount, pk=account_id, company=request.company)


@router.patch("/settings/{account_id}", response=EmailAccountOut)
def update_email_account(request, account_id: int, payload: EmailAccountUpdate):
    """Update an email account."""
    account = get_object_or_404(EmailAccount, pk=account_id, company=request.company)
    data = payload.dict(exclude_unset=True)

    with transaction.atomic():
        if data.get("is_default"):
            EmailAccount.objects.filter(company=request.company).exclude(
                pk=account_id
            ).update(is_default=False)

        for attr, value in data.items():
            setattr(account, attr, value)
        account.save()

    if account.smtp_mode == "builtin" or "smtp_mode" in data or "mail_domain" in data:
        _sync_postfix_config()

    return account


@router.delete("/settings/{account_id}", response={204: None})
def delete_email_account(request, account_id: int):
    """Delete an email account."""
    account = get_object_or_404(EmailAccount, pk=account_id, company=request.company)
    was_default = account.is_default
    account.delete()

    if was_default:
        next_account = EmailAccount.objects.filter(company=request.company).first()
        if next_account:
            next_account.is_default = True
            next_account.save(update_fields=["is_default"])

    return 204, None


@router.post("/settings/{account_id}/test")
def test_email_connection(request, account_id: int, payload: EmailAccountTestIn):
    """Test SMTP or IMAP connection for an email account."""
    from apps.integrations.services.email_service import (
        test_imap_connection,
        test_smtp_connection,
    )

    account = get_object_or_404(EmailAccount, pk=account_id, company=request.company)

    if payload.test_type == "smtp":
        return test_smtp_connection(account)
    elif payload.test_type == "imap":
        return test_imap_connection(account)
    else:
        return {"success": False, "error": "Invalid test_type. Use 'smtp' or 'imap'."}


# ---------------------------------------------------------------------------
# Built-in SMTP (Postfix) status
# ---------------------------------------------------------------------------


@router.get("/builtin-smtp-status")
def builtin_smtp_status(request):
    """Check if the built-in Postfix SMTP container is reachable."""
    host = os.environ.get("POSTFIX_HOST", "postfix")
    port = int(os.environ.get("POSTFIX_PORT", "25"))
    mail_domain = _get_builtin_mail_domain()
    try:
        s = socket.create_connection((host, port), timeout=3)
        s.close()
        return {"available": True, "mail_domain": mail_domain}
    except Exception:
        return {"available": False, "mail_domain": mail_domain}


def _sync_postfix_config_for_domain(domain: str):
    """Write a specific domain to the shared config file so Postfix can generate DKIM keys."""
    return _write_postfix_config(domain)


def _generate_dkim_keys(mail_domain: str, selectors: list[str] | None = None):
    """Generate DKIM key pairs and write them in opendkim format.

    Uses Python's cryptography library so keys are available instantly
    without depending on the Postfix container's entrypoint.
    """
    import base64
    import textwrap

    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    if selectors is None:
        selectors = ["mail", "mail2"]

    key_dir = f"/etc/opendkim/keys/{mail_domain}"
    os.makedirs(key_dir, mode=0o755, exist_ok=True)

    for selector in selectors:
        private_path = os.path.join(key_dir, f"{selector}.private")
        txt_path = os.path.join(key_dir, f"{selector}.txt")

        # Skip if keys already exist for this selector
        if os.path.exists(private_path) and os.path.exists(txt_path):
            continue

        # Generate 2048-bit RSA key pair
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        # Write private key in PEM format (what opendkim expects)
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
        with open(private_path, "wb") as f:
            f.write(private_pem)
        os.chmod(private_path, 0o600)

        # Extract public key in DER format and base64-encode for DNS TXT record
        public_der = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        pub_b64 = base64.b64encode(public_der).decode()

        # Write .txt file in opendkim-genkey format
        # Split into 250-char chunks for DNS TXT compatibility
        record_value = f"v=DKIM1; k=rsa; p={pub_b64}"
        chunks = textwrap.wrap(record_value, 250)
        quoted = " ".join(f'"{chunk}"' for chunk in chunks)
        txt_content = (
            f"{selector}._domainkey\tIN\tTXT\t( {quoted}\n"
            f")  ; ----- DKIM key {selector} for {mail_domain}\n"
        )
        with open(txt_path, "w") as f:
            f.write(txt_content)
        os.chmod(txt_path, 0o644)

    logger.info("DKIM keys generated for %s (selectors: %s)", mail_domain, selectors)


def _read_dkim_record(mail_domain: str, selector: str) -> dict:
    """Read a single DKIM public key file and return its parsed record."""
    import re

    key_path = f"/etc/opendkim/keys/{mail_domain}/{selector}.txt"
    try:
        with open(key_path) as f:
            raw = f.read()
        parts = re.findall(r'"([^"]*)"', raw)
        record_value = "".join(parts)
        return {
            "selector": selector,
            "domain": mail_domain,
            "dns_name": f"{selector}._domainkey.{mail_domain}",
            "record": record_value,
            "status": "ready",
        }
    except FileNotFoundError:
        return {
            "selector": selector,
            "domain": mail_domain,
            "dns_name": f"{selector}._domainkey.{mail_domain}",
            "record": "",
            "status": "pending",
        }
    except Exception as e:
        return {
            "selector": selector,
            "domain": mail_domain,
            "dns_name": f"{selector}._domainkey.{mail_domain}",
            "record": "",
            "status": "error",
            "error": str(e),
        }


def _check_dns_txt(name: str, must_contain: str) -> str:
    """Return 'verified' if a TXT record containing must_contain exists, else 'pending'."""
    import dns.resolver

    try:
        answers = dns.resolver.resolve(name, "TXT")
        for rdata in answers:
            txt = b"".join(rdata.strings).decode()
            if must_contain in txt:
                return "verified"
        return "pending"
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
        return "pending"
    except Exception:
        return "error"


# ---------------------------------------------------------------------------
# Mail Domains — register domain, generate DKIM, verify DNS
# ---------------------------------------------------------------------------


@router.get("/domains", response=List[MailDomainOut])
def list_domains(request):
    """List all registered mail domains for the current tenant."""
    return list(MailDomain.objects.filter(company=request.company))


@router.post("/domains", response={201: MailDomainOut})
def add_domain(request, payload: MailDomainCreate):
    """Register a new mail domain and generate DKIM keys instantly."""
    domain = payload.domain.strip().lower()
    if not domain:
        return 400, {"error": "Domain is required."}

    if MailDomain.objects.filter(company=request.company, domain=domain).exists():
        return 409, {"error": "Domain already registered."}

    # Generate DKIM keys on the shared volume
    try:
        _generate_dkim_keys(domain)
    except Exception:
        logger.exception("Failed to generate DKIM keys for %s", domain)
        return 500, {"error": "Could not generate DKIM keys."}

    # Write postfix config so it knows about this domain
    _sync_postfix_config_for_domain(domain)

    mail_domain = MailDomain.objects.create(
        company=request.company,
        domain=domain,
    )
    return 201, mail_domain


@router.delete("/domains/{domain_id}", response={204: None})
def delete_domain(request, domain_id: int):
    """Remove a registered mail domain."""
    domain_obj = get_object_or_404(MailDomain, pk=domain_id, company=request.company)
    domain_obj.delete()
    return 204, None


@router.get("/domains/{domain_id}/dns-records")
def get_domain_dns_records(request, domain_id: int):
    """Return DKIM records and expected SPF/DMARC values for a domain."""
    domain_obj = get_object_or_404(MailDomain, pk=domain_id, company=request.company)
    d = domain_obj.domain

    dkim1 = _read_dkim_record(d, "mail")
    dkim2 = _read_dkim_record(d, "mail2")

    return {
        "domain": d,
        "records": [
            {
                "label": "SPF",
                "type": "TXT",
                "name": "@",
                "value": "v=spf1 include:precept.online ~all",
                "status": "verified" if domain_obj.spf_verified else "pending",
            },
            {
                "label": "DKIM 1",
                "type": "TXT",
                "name": dkim1["dns_name"],
                "value": dkim1["record"],
                "status": "verified" if domain_obj.dkim_verified else dkim1["status"],
            },
            {
                "label": "DKIM 2",
                "type": "TXT",
                "name": dkim2["dns_name"],
                "value": dkim2["record"],
                "status": "verified" if domain_obj.dkim_verified else dkim2["status"],
            },
            {
                "label": "DMARC",
                "type": "TXT",
                "name": f"_dmarc.{d}",
                "value": f"v=DMARC1; p=quarantine; rua=mailto:dmarc@{d}",
                "status": "verified" if domain_obj.dmarc_verified else "pending",
                "hint": "Any existing DMARC record (v=DMARC1) is accepted.",
            },
        ],
    }


@router.post("/domains/{domain_id}/verify")
def verify_domain_dns(request, domain_id: int):
    """Check and update DNS verification status for a domain."""
    domain_obj = get_object_or_404(MailDomain, pk=domain_id, company=request.company)
    d = domain_obj.domain

    spf = _check_dns_txt(d, "include:precept.online")
    dkim1 = _check_dns_txt(f"mail._domainkey.{d}", "v=DKIM1")
    dkim2 = _check_dns_txt(f"mail2._domainkey.{d}", "v=DKIM1")
    # Any valid DMARC record is sufficient for deliverability
    dmarc = _check_dns_txt(f"_dmarc.{d}", "v=DMARC1")

    domain_obj.spf_verified = spf == "verified"
    domain_obj.dkim_verified = dkim1 == "verified" and dkim2 == "verified"
    domain_obj.dmarc_verified = dmarc == "verified"
    domain_obj.save(update_fields=["spf_verified", "dkim_verified", "dmarc_verified"])

    return {
        "spf": spf,
        "dkim1": dkim1,
        "dkim2": dkim2,
        "dmarc": dmarc,
        "is_verified": domain_obj.is_verified,
    }


# ---------------------------------------------------------------------------
# Compose & Send
# ---------------------------------------------------------------------------


@router.post("/compose", response={201: EmailMessageOut})
def compose_and_send(request, payload: EmailComposeIn):
    """Compose and send an email asynchronously."""
    from apps.integrations.tasks import send_email_task

    to_email = payload.to_emails[0] if payload.to_emails else None
    email_account = _resolve_email_account(
        request.company, to_email, payload.account_id
    )
    if not email_account:
        return 400, {"error": "No enabled email account found"}

    # Generate a unique message ID
    import uuid
    message_id = f"<{uuid.uuid4().hex}@{email_account.mail_domain or 'precept.online'}>"

    # Build threading headers for replies
    in_reply_to = ""
    references = ""
    thread_id = message_id  # New conversations use their own message_id as thread_id
    if payload.in_reply_to_id:
        parent = EmailMessage.objects.filter(
            pk=payload.in_reply_to_id, company=request.company
        ).first()
        if parent:
            in_reply_to = parent.message_id_header
            references = f"{parent.references_header} {parent.message_id_header}".strip()
            thread_id = parent.thread_id or message_id

    msg = EmailMessage.objects.create(
        company=request.company,
        email_account=email_account,
        direction=EmailMessage.Direction.OUTGOING,
        status=EmailMessage.Status.QUEUED,
        from_email=email_account.email_address,
        to_emails=payload.to_emails,
        cc_emails=payload.cc_emails,
        bcc_emails=payload.bcc_emails,
        subject=payload.subject,
        body_html=payload.body_html,
        body_text=payload.body_text,
        message_id_header=message_id,
        in_reply_to=in_reply_to,
        references_header=references,
        thread_id=thread_id,
        created_by=request.auth,
        modified_by=request.auth,
    )

    # Link entity
    if payload.entity_type and payload.entity_id:
        ct = _get_content_type(payload.entity_type)
        if ct:
            msg.content_type_fk = ct
            msg.object_id = payload.entity_id
            msg.save(update_fields=["content_type_fk", "object_id"])

    # Link pre-uploaded attachments
    if payload.attachment_ids:
        EmailAttachment.objects.filter(
            pk__in=payload.attachment_ids, company=request.company
        ).update(email_message=msg)

    # Dispatch async send
    send_email_task.delay(msg.pk)

    msg = EmailMessage.objects.select_related("content_type_fk").prefetch_related(
        "attachments"
    ).get(pk=msg.pk)
    return 201, msg


@router.post("/upload-attachment")
def upload_attachment(request):
    """Upload an email attachment for later sending."""
    import os
    import uuid

    from django.conf import settings as django_settings

    uploaded = request.FILES.get("file")
    if not uploaded:
        return 400, {"error": "No file provided"}

    mime_type = uploaded.content_type or "application/octet-stream"
    ext = os.path.splitext(uploaded.name)[1] if uploaded.name else ""

    media_dir = os.path.join(django_settings.MEDIA_ROOT, "email_attachments")
    os.makedirs(media_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(media_dir, filename)

    with open(filepath, "wb") as f:
        for chunk in uploaded.chunks():
            f.write(chunk)

    attachment = EmailAttachment.objects.create(
        company=request.company,
        filename=uploaded.name or filename,
        file=f"email_attachments/{filename}",
        mime_type=mime_type,
        file_size=uploaded.size,
    )

    return {
        "id": attachment.id,
        "filename": attachment.filename,
        "mime_type": mime_type,
        "file_size": uploaded.size,
    }


# ---------------------------------------------------------------------------
# Messages for entity (Lead/Deal)
# ---------------------------------------------------------------------------


@router.get("/messages/{entity_type}/{entity_id}", response=Dict[str, Any])
def get_entity_emails(
    request, entity_type: str, entity_id: int, page: int = 1, page_size: int = 20
):
    """Get emails linked to a lead/deal."""
    ct = _get_content_type(entity_type)
    if not ct:
        return {"results": [], "total": 0, "page": page, "page_size": page_size}

    qs = (
        EmailMessage.objects.filter(content_type_fk=ct, object_id=entity_id)
        .select_related("content_type_fk")
        .prefetch_related("attachments")
        .order_by("created_at")
    )

    total = qs.count()
    offset = (page - 1) * page_size
    messages = qs[offset : offset + page_size]

    return {
        "results": [EmailMessageOut.from_orm(m) for m in messages],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/messages/detail/{message_id}", response=EmailMessageOut)
def get_email_detail(request, message_id: int):
    """Get a single email message."""
    return get_object_or_404(
        EmailMessage.objects.select_related("content_type_fk").prefetch_related(
            "attachments"
        ),
        pk=message_id,
        company=request.company,
    )


# ---------------------------------------------------------------------------
# Threads / Inbox (like WhatsApp conversations)
# ---------------------------------------------------------------------------


@router.get("/threads", response=Dict[str, Any])
def get_threads(
    request,
    page: int = 1,
    page_size: int = 20,
    account_id: Optional[int] = None,
):
    """Get email threads grouped by thread_id."""
    qs = EmailMessage.objects.filter(company=request.company)

    if account_id:
        qs = qs.filter(email_account_id=account_id)

    # Collect our email addresses to exclude from participants
    our_addresses = set(
        EmailAccount.objects.filter(company=request.company)
        .values_list("email_address", flat=True)
    )

    threads: Dict[str, dict] = {}
    for msg in (
        qs.order_by("-created_at")
        .select_related("content_type_fk", "email_account")
        .prefetch_related("attachments")
    ):
        tid = msg.thread_id or msg.message_id_header or f"msg-{msg.pk}"
        if tid not in threads:
            acct = msg.email_account

            # Collect external participants
            participants = set()
            participants.add(msg.from_email)
            participants.update(msg.to_emails or [])
            participants -= our_addresses

            threads[tid] = {
                "thread_id": tid,
                "subject": msg.subject,
                "last_message": EmailMessageOut.from_orm(msg).dict(),
                "last_message_at": msg.created_at.isoformat(),
                "participants": list(participants),
                "message_count": 1,
                "entity_type": None,
                "entity_id": None,
                "entity_name": None,
                "email_account_id": acct.id if acct else None,
                "email_account_name": (
                    acct.display_name or acct.email_address
                )
                if acct
                else None,
            }

            if msg.content_type_fk and msg.object_id:
                threads[tid]["entity_type"] = msg.content_type_fk.model
                threads[tid]["entity_id"] = msg.object_id
                try:
                    entity = msg.content_type_fk.get_object_for_this_type(
                        pk=msg.object_id
                    )
                    threads[tid]["entity_name"] = str(entity)
                except Exception:
                    pass
        else:
            threads[tid]["message_count"] += 1

    thread_list = sorted(
        threads.values(), key=lambda t: t["last_message_at"], reverse=True
    )
    total = len(thread_list)
    offset = (page - 1) * page_size
    paginated = thread_list[offset : offset + page_size]

    return {
        "results": paginated,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/threads/{thread_id}/messages", response=Dict[str, Any])
def get_thread_messages(
    request,
    thread_id: str,
    page: int = 1,
    page_size: int = 50,
    account_id: Optional[int] = None,
):
    """Get all messages in a thread."""
    # Handle synthetic thread IDs (msg-{pk}) for messages with no real thread_id
    if thread_id.startswith("msg-"):
        try:
            msg_pk = int(thread_id[4:])
        except ValueError:
            msg_pk = None
        if msg_pk:
            qs = (
                EmailMessage.objects.filter(company=request.company, pk=msg_pk)
                .select_related("content_type_fk")
                .prefetch_related("attachments")
            )
        else:
            qs = EmailMessage.objects.none()
    else:
        qs = (
            EmailMessage.objects.filter(company=request.company, thread_id=thread_id)
            .select_related("content_type_fk")
            .prefetch_related("attachments")
            .order_by("created_at")
        )

    if account_id:
        qs = qs.filter(email_account_id=account_id)

    total = qs.count()
    offset = (page - 1) * page_size
    messages = qs[offset : offset + page_size]

    return {
        "results": [EmailMessageOut.from_orm(m) for m in messages],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/sync/{account_id}")
def trigger_sync(request, account_id: int):
    """Trigger a manual IMAP sync for an account."""
    account = get_object_or_404(
        EmailAccount, pk=account_id, company=request.company, enabled=True
    )
    if not account.enable_incoming:
        return {"error": "Incoming mail is not enabled for this account"}

    from apps.integrations.services.email_service import sync_imap_inbox

    try:
        count = sync_imap_inbox(account)
        return {"status": "ok", "new_messages": count}
    except Exception as e:
        logger.exception("Manual sync failed for %s", account.email_address)
        return {"status": "error", "error": str(e)}


# ---------------------------------------------------------------------------
# Email Templates
# ---------------------------------------------------------------------------


@router.get("/templates", response=List[EmailTemplateOut])
def list_templates(request):
    from apps.integrations.models.email_campaign import EmailTemplate

    return list(EmailTemplate.objects.filter(company=request.company))


@router.post("/templates", response={201: EmailTemplateOut})
def create_template(request, payload: EmailTemplateCreate):
    from apps.integrations.models.email_campaign import EmailTemplate

    data = payload.dict(exclude_unset=True)
    data["company"] = request.company
    tpl = EmailTemplate.objects.create(**data)
    return 201, tpl


@router.get("/templates/{template_id}", response=EmailTemplateOut)
def get_template(request, template_id: int):
    from apps.integrations.models.email_campaign import EmailTemplate

    return get_object_or_404(EmailTemplate, pk=template_id, company=request.company)


@router.patch("/templates/{template_id}", response=EmailTemplateOut)
def update_template(request, template_id: int, payload: EmailTemplateUpdate):
    from apps.integrations.models.email_campaign import EmailTemplate

    tpl = get_object_or_404(EmailTemplate, pk=template_id, company=request.company)
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(tpl, attr, value)
    tpl.save()
    return tpl


@router.delete("/templates/{template_id}", response={204: None})
def delete_template(request, template_id: int):
    from apps.integrations.models.email_campaign import EmailTemplate

    tpl = get_object_or_404(EmailTemplate, pk=template_id, company=request.company)
    tpl.delete()
    return 204, None


@router.post("/templates/{template_id}/preview")
def preview_template(request, template_id: int, payload: EmailTemplatePreviewIn):
    from apps.integrations.models.email_campaign import EmailTemplate
    from apps.integrations.services.email_service import render_template

    tpl = get_object_or_404(EmailTemplate, pk=template_id, company=request.company)
    context = payload.context
    return {
        "subject": render_template(tpl.subject, context),
        "body_html": render_template(tpl.body_html, context),
    }


# ---------------------------------------------------------------------------
# Email Campaigns
# ---------------------------------------------------------------------------


@router.get("/campaigns", response=List[EmailCampaignOut])
def list_campaigns(request):
    from apps.integrations.models.email_campaign import EmailCampaign

    return list(EmailCampaign.objects.filter(company=request.company))


@router.post("/campaigns", response={201: EmailCampaignOut})
def create_campaign(request, payload: EmailCampaignCreate):
    from apps.integrations.models.email_campaign import EmailCampaign

    data = payload.dict(exclude_unset=True)
    data["company"] = request.company
    campaign = EmailCampaign.objects.create(**data)
    return 201, campaign


@router.get("/campaigns/{campaign_id}", response=EmailCampaignOut)
def get_campaign(request, campaign_id: int):
    from apps.integrations.models.email_campaign import EmailCampaign

    return get_object_or_404(EmailCampaign, pk=campaign_id, company=request.company)


@router.patch("/campaigns/{campaign_id}", response=EmailCampaignOut)
def update_campaign(request, campaign_id: int, payload: EmailCampaignUpdate):
    from apps.integrations.models.email_campaign import EmailCampaign

    campaign = get_object_or_404(
        EmailCampaign, pk=campaign_id, company=request.company
    )
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(campaign, attr, value)
    campaign.save()
    return campaign


@router.delete("/campaigns/{campaign_id}", response={204: None})
def delete_campaign(request, campaign_id: int):
    from apps.integrations.models.email_campaign import EmailCampaign

    campaign = get_object_or_404(
        EmailCampaign, pk=campaign_id, company=request.company
    )
    campaign.delete()
    return 204, None


@router.post("/campaigns/{campaign_id}/send")
def send_campaign(request, campaign_id: int):
    from apps.integrations.models.email_campaign import EmailCampaign
    from apps.integrations.tasks import send_campaign_task

    campaign = get_object_or_404(
        EmailCampaign, pk=campaign_id, company=request.company
    )
    if campaign.status not in ("Draft", "Paused", "Failed"):
        return {"error": f"Cannot send campaign in '{campaign.status}' status"}
    if not campaign.recipients:
        return {"error": "No recipients defined"}

    campaign.status = "Scheduled"
    campaign.save(update_fields=["status"])
    send_campaign_task.delay(campaign.pk)
    return {"status": "ok", "message": "Campaign queued for sending"}


@router.get("/campaigns/{campaign_id}/logs", response=Dict[str, Any])
def get_campaign_logs(
    request, campaign_id: int, page: int = 1, page_size: int = 50
):
    from apps.integrations.models.email_campaign import EmailCampaign, EmailCampaignLog

    campaign = get_object_or_404(
        EmailCampaign, pk=campaign_id, company=request.company
    )
    qs = EmailCampaignLog.objects.filter(campaign=campaign).order_by("-sent_at")
    total = qs.count()
    offset = (page - 1) * page_size
    logs = qs[offset : offset + page_size]
    return {
        "results": [EmailCampaignLogOut.from_orm(log) for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }

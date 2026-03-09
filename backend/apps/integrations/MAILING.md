# Email Integration — Module Reference

Self-hosted SMTP/IMAP email integration for Precept. Supports multi-account configuration, compose & send, inbox sync, threaded conversations, and bulk campaigns with template rendering.

---

## Architecture Overview

```
Frontend (Next.js)                       Backend (Django Ninja)
+--------------------------+             +---------------------------+
| Email Inbox Page         |  REST API   | api/email.py              |
| EmailChat (Lead/Deal)    | ----------> | (settings, compose,       |
| Email Settings Page      |             |  threads, templates,      |
| Campaign Pages           |             |  campaigns)               |
+--------------------------+             +---------------------------+
                                                    |
                                          +---------+---------+
                                          |                   |
                                   services/            tasks.py
                                   email_service.py     (Celery)
                                          |                   |
                                   +------+------+     +------+------+
                                   | smtplib     |     | send_email  |
                                   | imaplib     |     | sync_inboxes|
                                   | email.mime  |     | send_campaign|
                                   +-------------+     +-------------+
                                                              |
                                                    Celery Beat (periodic)
                                                    - Every 5 min
                                                    - Every 15 min
                                                    - Hourly
```

### Built-in SMTP (Postfix) Mode

When `smtp_mode == "builtin"`, the system uses a self-hosted Postfix container instead of an external SMTP relay. The architecture adds a Postfix + OpenDKIM sidecar:

```
                                   ┌─────────────────────┐
                                   │  Postfix Container   │
                                   │  (port 25, internal) │
                                   │  + OpenDKIM signing   │
                                   └──────────┬──────────┘
                                              │
Django backend ──── smtplib ──────────────────┘
  (smtp_mode=builtin)              (Docker network, no auth)

Shared volume: dkim_keys
  ├── postfix_config.json    ← written by Django (mail_domain)
  ├── {domain}/mail.private  ← DKIM private key (selector 1, auto-generated)
  ├── {domain}/mail.txt      ← DKIM public key (selector 1)
  ├── {domain}/mail2.private ← DKIM private key (selector 2, auto-generated)
  └── {domain}/mail2.txt     ← DKIM public key (selector 2)
```

**Configuration flow:**
1. User sets `smtp_mode = "builtin"` and enters `mail_domain` in the UI
2. Django writes `postfix_config.json` to the shared `dkim_keys` volume (volume is `chmod 777` by the Postfix entrypoint on startup so the backend user can write)
3. Postfix entrypoint reads the config file via `sed` (polls every 10s if not yet available)
4. Postfix generates both DKIM key pairs and starts accepting mail for that domain
5. User retrieves DKIM public keys via `/dkim-record` endpoint and adds DNS records
6. User clicks "Re-check DNS" to verify all 4 records (SPF, DKIM 1, DKIM 2, DMARC) via `/verify-dns`

Transport is Python stdlib only (`smtplib`, `imaplib`, `email.mime`). No external API dependencies.

---

## Database Tables

### `integration_email_accounts`

Multi-tenant email account configuration. Each company can have multiple accounts with one marked `is_default`.

| Column             | Type         | Notes                                           |
|--------------------|--------------|-------------------------------------------------|
| `id`               | PK           |                                                 |
| `company_id`       | FK           | Tenant (from `TenantMixin`)                     |
| `enabled`          | bool         |                                                 |
| `display_name`     | varchar(255) | Human label ("Sales", "Support")                |
| `is_default`       | bool         | One per company; first auto-promoted            |
| `email_address`    | email        | Unique per company                              |
| `smtp_mode`        | varchar(20)  | `external` (default) or `builtin` (Postfix)     |
| `mail_domain`      | varchar(255) | Sending domain for builtin mode (e.g. `acme.com`)|
| `smtp_host`        | varchar(255) |                                                 |
| `smtp_port`        | int          | Default 587                                     |
| `smtp_username`    | varchar(255) |                                                 |
| `smtp_password`    | varchar(512) |                                                 |
| `smtp_use_tls`     | bool         | Default True (STARTTLS)                         |
| `smtp_use_ssl`     | bool         | Default False (implicit SSL)                    |
| `imap_host`        | varchar(255) |                                                 |
| `imap_port`        | int          | Default 993                                     |
| `imap_username`    | varchar(255) | Falls back to `smtp_username`                   |
| `imap_password`    | varchar(512) | Falls back to `smtp_password`                   |
| `imap_use_ssl`     | bool         | Default True                                    |
| `imap_folder`      | varchar(255) | Default "INBOX"                                 |
| `enable_incoming`  | bool         | Enables IMAP sync                               |
| `last_synced_at`   | datetime     |                                                 |
| `last_synced_uid`  | varchar(255) | IMAP UID watermark for incremental sync         |
| `sync_frequency`   | varchar(50)  | "Every 5 minutes" / "Every 15 minutes" / "Hourly" |

**Unique constraint:** `(company, email_address)`

### `integration_email_messages`

All sent and received emails. Uses Generic FK to link to Lead/Deal/Contact.

| Column              | Type         | Notes                                          |
|---------------------|--------------|-------------------------------------------------|
| `id`                | PK           |                                                |
| `company_id`        | FK           | Tenant                                         |
| `email_account_id`  | FK (nullable)| Which account sent/received                    |
| `direction`         | varchar(20)  | `Incoming` / `Outgoing`                        |
| `status`            | varchar(20)  | `Draft`/`Queued`/`Sending`/`Sent`/`Failed`/`Received` |
| `from_email`        | email        |                                                |
| `to_emails`         | JSON         | Array of email addresses                       |
| `cc_emails`         | JSON         |                                                |
| `bcc_emails`        | JSON         |                                                |
| `reply_to_email`    | email        |                                                |
| `subject`           | varchar(998) |                                                |
| `body_html`         | text         |                                                |
| `body_text`         | text         |                                                |
| `message_id_header` | varchar(512) | RFC 2822 Message-ID                            |
| `in_reply_to`       | varchar(512) | RFC 2822 In-Reply-To                           |
| `references_header` | text         | RFC 2822 References                            |
| `thread_id`         | varchar(512) | Computed from References chain                 |
| `imap_uid`          | varchar(100) | IMAP UID for deduplication                     |
| `error_message`     | text         | Populated on send failure                      |
| `content_type_fk`   | FK (nullable)| Django ContentType for generic FK              |
| `object_id`         | int (nullable)| Entity PK (Lead/Deal/Contact)                 |
| `created_at`        | datetime     | From `TimestampMixin`                          |
| `updated_at`        | datetime     |                                                |

**Indexes:** `(company, from_email)`, `(company, thread_id)`, `message_id_header`, `thread_id`, `imap_uid`

### `integration_email_attachments`

| Column            | Type         | Notes                         |
|-------------------|--------------|-------------------------------|
| `id`              | PK           |                               |
| `company_id`      | FK           | Tenant                        |
| `email_message_id`| FK (CASCADE) |                               |
| `filename`        | varchar(512) | Original filename             |
| `file`            | FileField    | Stored in `email_attachments/`|
| `mime_type`       | varchar(255) |                               |
| `file_size`       | int          | Bytes                         |

### `integration_email_templates`

Reusable templates for campaigns with `{{variable}}` substitution.

| Column      | Type         | Notes                      |
|-------------|--------------|----------------------------|
| `id`        | PK           |                            |
| `company_id`| FK           | Tenant                     |
| `name`      | varchar(255) | Unique per company         |
| `subject`   | varchar(998) | Supports `{{variables}}`   |
| `body_html` | text         | Supports `{{variables}}`   |
| `body_text` | text         |                            |
| `created_at`| datetime     |                            |
| `updated_at`| datetime     |                            |

### `integration_email_campaigns`

Bulk email campaigns with per-recipient tracking.

| Column             | Type         | Notes                                    |
|--------------------|--------------|------------------------------------------|
| `id`               | PK           |                                          |
| `company_id`       | FK           | Tenant                                   |
| `name`             | varchar(255) |                                          |
| `email_account_id` | FK (nullable)| Account to send from                     |
| `template_id`      | FK (nullable)| Optional template reference              |
| `subject`          | varchar(998) | Inline or override                       |
| `body_html`        | text         | Inline or override                       |
| `status`           | varchar(20)  | `Draft`/`Scheduled`/`Sending`/`Sent`/`Paused`/`Failed` |
| `scheduled_at`     | datetime     |                                          |
| `recipients`       | JSON         | `[{email, first_name, entity_type, ...}]`|
| `total_recipients` | int          | Updated after send                       |
| `sent_count`       | int          |                                          |
| `failed_count`     | int          |                                          |
| `created_at`       | datetime     |                                          |
| `updated_at`       | datetime     |                                          |

### `integration_email_campaign_logs`

Per-recipient delivery log for campaigns.

| Column             | Type         | Notes                    |
|--------------------|--------------|--------------------------|
| `id`               | PK           |                          |
| `company_id`       | FK           | Tenant                   |
| `campaign_id`      | FK (CASCADE) |                          |
| `recipient_email`  | email        |                          |
| `status`           | varchar(20)  | `Sent` / `Failed`        |
| `email_message_id` | FK (nullable)| Link to the actual email |
| `error_message`    | text         |                          |
| `sent_at`          | datetime     |                          |

---

## API Endpoints

All endpoints are under `/api/integrations/email/` and require authentication. Tenant scoping is automatic via `request.company`.

### Account Settings

| Method   | Path                          | Description                           |
|----------|-------------------------------|---------------------------------------|
| `GET`    | `/settings`                   | List all email accounts               |
| `POST`   | `/settings`                   | Create account (first becomes default)|
| `GET`    | `/settings/{id}`              | Get single account                    |
| `PATCH`  | `/settings/{id}`              | Update account                        |
| `DELETE` | `/settings/{id}`              | Delete (promotes next as default)     |
| `POST`   | `/settings/{id}/test`         | Test SMTP or IMAP connection          |

### Built-in SMTP

| Method   | Path                          | Description                                          |
|----------|-------------------------------|------------------------------------------------------|
| `GET`    | `/builtin-smtp-status`        | Check if Postfix is reachable, return `{available, mail_domain, server_ip}` |
| `GET`    | `/dkim-record`                | Read both DKIM public keys, return `{records: [{selector, domain, dns_name, record}, ...]}` |
| `GET`    | `/verify-dns`                 | Check SPF, DKIM1, DKIM2, DMARC via DNS lookup, return per-record status (`verified`/`pending`/`error`) |

### Compose & Messages

| Method   | Path                              | Description                            |
|----------|-----------------------------------|----------------------------------------|
| `POST`   | `/compose`                        | Compose and queue email for async send |
| `POST`   | `/upload-attachment`              | Pre-upload attachment (FormData)       |
| `GET`    | `/messages/{entity_type}/{id}`    | Emails linked to a Lead/Deal/Contact   |
| `GET`    | `/messages/detail/{message_id}`   | Single email detail                    |

### Threads & Inbox

| Method   | Path                              | Description                        |
|----------|-----------------------------------|------------------------------------|
| `GET`    | `/threads`                        | Threads grouped by thread_id       |
| `GET`    | `/threads/{thread_id}/messages`   | All messages in a thread           |
| `POST`   | `/sync/{account_id}`             | Trigger manual IMAP sync           |

### Templates

| Method   | Path                          | Description                   |
|----------|-------------------------------|-------------------------------|
| `GET`    | `/templates`                  | List templates                |
| `POST`   | `/templates`                  | Create template               |
| `GET`    | `/templates/{id}`             | Get template                  |
| `PATCH`  | `/templates/{id}`             | Update template               |
| `DELETE` | `/templates/{id}`             | Delete template               |
| `POST`   | `/templates/{id}/preview`     | Render with sample context    |

### Campaigns

| Method   | Path                          | Description                   |
|----------|-------------------------------|-------------------------------|
| `GET`    | `/campaigns`                  | List campaigns                |
| `POST`   | `/campaigns`                  | Create campaign               |
| `GET`    | `/campaigns/{id}`             | Get campaign                  |
| `PATCH`  | `/campaigns/{id}`             | Update campaign               |
| `DELETE` | `/campaigns/{id}`             | Delete campaign               |
| `POST`   | `/campaigns/{id}/send`        | Queue campaign for sending    |
| `GET`    | `/campaigns/{id}/logs`        | Per-recipient delivery logs   |

---

## Multi-Account Resolution

When composing an email, the system selects which account to send from using a priority cascade (identical pattern to WhatsApp):

1. **Explicit `account_id`** — caller specifies which account
2. **Conversation history** — find the most recent message involving the recipient and reuse that account
3. **Default account** — company's `is_default=True` account
4. **Any enabled account** — first available
5. **None** — returns 400 error

Implementation: `_resolve_email_account()` in `api/email.py:47-79`.

---

## Email Threading

Emails are grouped into threads using RFC 2822 headers:

1. **Outgoing replies**: When `in_reply_to_id` is provided, the compose endpoint copies the parent's `message_id_header` into `In-Reply-To` and appends to `References`
2. **Incoming sync**: `_compute_thread_id()` derives `thread_id` from:
   - First Message-ID in the `References` chain (oldest ancestor)
   - Falls back to `In-Reply-To` header
   - Falls back to own `Message-ID` (new thread)
3. **Thread view**: `GET /threads` groups by `thread_id`, showing last message, participant list, and message count

---

## IMAP Sync Flow

```
Celery Beat (crontab)
  └─> sync_email_inboxes(frequency_label)
        └─> For each EmailAccount matching frequency:
              └─> sync_imap_inbox(account)
                    1. Connect via IMAP4_SSL / IMAP4
                    2. SELECT configured folder
                    3. UID SEARCH from last_synced_uid:* (incremental)
                    4. Skip already-imported UIDs (idempotent)
                    5. FETCH RFC822 for each new UID
                    6. Parse with email.message_from_bytes()
                    7. Extract: headers, body (HTML/text), attachments
                    8. Create EmailMessage (direction=Incoming, status=Received)
                    9. Save attachments to email_attachments/
                   10. _auto_link_email() — link to Lead/Contact/Deal
                   11. _broadcast_email_event() — WebSocket notification
                   12. Update last_synced_uid, last_synced_at
```

### Auto-Linking Logic

When an incoming email arrives, `_auto_link_email()` tries to associate it with a CRM entity:

1. **Thread inheritance**: If `In-Reply-To` matches an existing message that's already linked, inherit the link
2. **Address matching**: Collect all external addresses (excluding own account), then check in order:
   - `Lead.email` match
   - `Contact.email_id` match
   - `Deal.email` match

### Celery Beat Schedule

| Task Key           | Frequency    | Task                                           |
|--------------------|--------------|-------------------------------------------------|
| `sync-email-5min`  | Every 5 min  | `sync_email_inboxes("Every 5 minutes")`         |
| `sync-email-15min` | Every 15 min | `sync_email_inboxes("Every 15 minutes")`        |
| `sync-email-hourly`| Top of hour  | `sync_email_inboxes("Hourly")`                  |

---

## Campaign Send Flow

```
POST /campaigns/{id}/send
  └─> Sets status = "Scheduled"
  └─> send_campaign_task.delay(campaign_id)
        └─> For each recipient in campaign.recipients:
              1. render_template(subject, context)
              2. render_template(body_html, context)
              3. Create EmailMessage (Outgoing, Queued)
              4. Link to entity if recipient has entity_type/entity_id
              5. send_email(account, message) via SMTP
              6. Create EmailCampaignLog (Sent or Failed)
              7. time.sleep(0.1) — rate limiting
        └─> Update campaign stats (sent_count, failed_count)
        └─> Set status = "Sent"
```

### Template Variables

Simple `{{variable}}` substitution via regex. Each recipient object provides the context:

```json
{"email": "john@example.com", "first_name": "John", "last_name": "Doe", "company_name": "Acme"}
```

Available in subject and body: `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{company_name}}`.

---

## Service Layer

**File:** `services/email_service.py`

| Function                | Purpose                                           |
|-------------------------|---------------------------------------------------|
| `test_smtp_connection()`| Verify SMTP credentials; branches on `smtp_mode` (builtin → postfix:25, external → configured host) |
| `test_imap_connection()`| Verify IMAP credentials (login, SELECT, logout)   |
| `send_email()`          | Build MIME message, set threading headers, send (builtin → postfix, external → configured SMTP) |
| `sync_imap_inbox()`     | Incremental IMAP sync with UID tracking            |
| `_auto_link_email()`    | Link incoming email to Lead/Contact/Deal           |
| `_broadcast_email_event()` | WebSocket broadcast to `crm_updates` group      |
| `render_template()`     | `{{variable}}` substitution for campaigns          |

---

## Frontend Components

| Component / Page                                    | Purpose                                     |
|-----------------------------------------------------|---------------------------------------------|
| `app/(dashboard)/email/page.tsx`                    | Email inbox — thread list + chat panel      |
| `app/(dashboard)/email/templates/page.tsx`          | Template CRUD with HTML preview             |
| `app/(dashboard)/email/campaigns/page.tsx`          | Campaign list with status badges            |
| `app/(dashboard)/email/campaigns/[id]/page.tsx`     | Campaign detail, stats, logs, preview       |
| `app/(dashboard)/email/campaigns/new/page.tsx`      | 3-step campaign wizard                      |
| `app/(dashboard)/settings/integrations/email/page.tsx` | Multi-account settings with test buttons |
| `components/email/EmailChat.tsx`                    | Email timeline on Lead/Deal detail pages    |

### Hooks (`hooks/useIntegrations.ts`)

| Hook                       | Query Key                    |
|----------------------------|------------------------------|
| `useEmailAccounts()`       | `["email-accounts"]`         |
| `useEntityEmails()`        | `["email-messages", type, id]` |
| `useEmailThreads()`        | `["email-threads", accountId]` |
| `useThreadMessages()`      | `["email-thread-messages", ...]` |
| `useComposeEmail()`        | Mutation                     |
| `useUploadEmailAttachment()` | Mutation                   |
| `useTriggerEmailSync()`    | Mutation                     |
| `useBuiltinSmtpStatus()`   | `["builtin-smtp-status"]`    |
| `useDkimRecord()`          | `["dkim-record"]`            |
| `useVerifyDns()`           | `["verify-dns"]`             |

---

## WebSocket Events

Email events are broadcast to the `crm_updates` WebSocket group:

```json
{
  "type": "email_message",
  "event": "new_message",
  "email_id": 42,
  "from_email": "client@example.com",
  "subject": "Re: Your proposal",
  "email_account_id": 1
}
```

---

## Built-in SMTP — DNS Setup

When using built-in SMTP mode, four DNS records are required for email deliverability:

| Record | Type | Name | Value |
|--------|------|------|-------|
| **SPF** | TXT | `@` | `v=spf1 a mx ip4:<auto-detected> -all` (IP from `/builtin-smtp-status`) |
| **DKIM 1** | TXT | `mail._domainkey` | Retrieved from `GET /dkim-record` → `records[0]` |
| **DKIM 2** | TXT | `mail2._domainkey` | Retrieved from `GET /dkim-record` → `records[1]` |
| **DMARC** | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@yourdomain.com` |

Both DKIM keys are auto-generated by the Postfix container on first startup (selectors `mail` and `mail2`). The primary selector (`mail`) is used for signing; both are published in DNS for rotation. The public keys can be retrieved from the UI (Settings → Email → DNS Setup panel) or via the API.

### DNS Verification

The `GET /verify-dns` endpoint performs live DNS lookups using `dnspython` and returns per-record status:

```json
{
  "spf": "verified",
  "dkim1": "verified",
  "dkim2": "pending",
  "dmarc": "verified",
  "mail_domain": "example.com",
  "server_ip": "1.2.3.4"
}
```

Status values: `verified` (TXT record found with expected content), `pending` (record not found or missing), `error` (DNS lookup failed).

The frontend polls this endpoint every 10 seconds after the user clicks "Re-check DNS", stopping automatically when all four records are verified.

### Docker Services

The Postfix container is defined in `docker/postfix/`:

| File | Purpose |
|------|---------|
| `Dockerfile` | Ubuntu 22.04 + postfix + opendkim + opendkim-tools (no python3) |
| `entrypoint.sh` | Sets volume permissions (`chmod 777`), reads domain from config file via `sed` or env, generates 2 DKIM key pairs (`mail` + `mail2` selectors), configures Postfix + OpenDKIM, starts services |
| `opendkim.conf` | OpenDKIM base configuration (relaxed/simple, inet:8891) |

**Docker Compose additions:**
- `postfix` service with `dkim_keys` volume mounted at `/etc/opendkim/keys` (read-write)
- `dkim_keys` volume also mounted read-write on backend for config writes and DKIM record access
- `POSTFIX_HOST` and `POSTFIX_PORT` env vars on backend/celery services

---

## File Inventory

### Backend (Created)
- `models/email_account.py` — EmailAccount model
- `models/email_message.py` — EmailMessage + EmailAttachment models
- `models/email_campaign.py` — EmailTemplate + EmailCampaign + EmailCampaignLog models
- `services/email_service.py` — SMTP send, IMAP sync, test connections, template rendering
- `api/email.py` — All REST endpoints (settings, compose, threads, templates, campaigns)

### Docker (Created)
- `docker/postfix/Dockerfile` — Postfix + OpenDKIM container image
- `docker/postfix/entrypoint.sh` — Domain resolution, DKIM key generation, Postfix/OpenDKIM config and startup
- `docker/postfix/opendkim.conf` — OpenDKIM base configuration

### Backend (Modified)
- `models/__init__.py` — Export new models
- `api/router.py` — Mount email router at `/email/`
- `api/schemas.py` — Email schemas + `email_enabled` in IntegrationStatusOut
- `api/telephony.py` — Add `email_enabled` to status endpoint
- `tasks.py` — `send_email_task`, `sync_email_inboxes`, `send_campaign_task`
- `config/celery.py` — Email sync beat schedule
- `Dockerfile.prod` — `email_attachments` media directory
- `docker-compose.yml` / `docker-compose.prod.yml` — Added postfix service, `dkim_keys` volume, `POSTFIX_HOST`/`POSTFIX_PORT` env vars

### Frontend (Created)
- `app/(dashboard)/email/page.tsx` — Inbox page
- `app/(dashboard)/email/templates/page.tsx` — Template management
- `app/(dashboard)/email/campaigns/page.tsx` — Campaign list
- `app/(dashboard)/email/campaigns/[id]/page.tsx` — Campaign detail
- `app/(dashboard)/email/campaigns/new/page.tsx` — Campaign wizard
- `app/(dashboard)/settings/integrations/email/page.tsx` — Account settings
- `components/email/EmailChat.tsx` — Email timeline for entity detail

### Frontend (Modified)
- `types/integration.ts` — EmailMessage, EmailAttachment, EmailThread, EmailAccount interfaces
- `lib/api/integrations.ts` — Email API methods
- `hooks/useIntegrations.ts` — Email hooks
- `app/(dashboard)/settings/integrations/page.tsx` — Email card
- `components/layout/Sidebar.tsx` — Email nav item
- `app/(dashboard)/leads/[id]/page.tsx` — EmailChat integration
- `app/(dashboard)/deals/[id]/page.tsx` — EmailChat integration

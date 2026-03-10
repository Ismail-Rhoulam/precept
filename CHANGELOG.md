# Changelog

## 2026-03-10 — Two-level sidebar with icon rail and detail panel

Redesigned the sidebar navigation from a single flat list to a two-panel layout inspired by modern project management tools. The left panel is a narrow icon rail for top-level section switching; the right panel shows contextual sub-navigation with expandable dropdown sections, inline search, and a user footer.

### Frontend — Sidebar

- **`components/layout/Sidebar.tsx`** — Full rewrite. Added `IconNavigation` rail (60px, icon-only buttons with tooltips) and `DetailSidebar` panel (256px, collapsible to 60px). Each CRM section (Dashboard, Leads, Deals, Contacts, Organizations, Tasks, Notes, WhatsApp, Email, Call Logs, Calendar, Settings) has its own detail content with categorized menu sections and expandable dropdown items. Preserved integration-aware visibility (WhatsApp/Email shown only when enabled), mobile Sheet drawer, and existing route paths. Added search input, user avatar footer with name display, and smooth collapse/expand transitions.

---

## 2026-03-10 — Custom animated pointer on theme toggle

Added an animated custom cursor to the theme toggle button using Framer Motion. When hovering over the Sun/Moon toggle, the default cursor is hidden and replaced with a secondary-colored pointer SVG that smoothly scales in/out.

### Frontend — Theme Toggle

- **`components/ui/theme-toggle.tsx`** — Added `Pointer` component using `framer-motion` (`useMotionValue`, `AnimatePresence`, `motion.div`). Tracks mouse position via `mousemove`/`mouseenter`/`mouseleave` on the parent element, hides the native cursor, and renders a fixed-position animated SVG pointer styled with `text-secondary` (violet) fill and white stroke. Integrated as a child of the theme toggle `Button`.

---

## 2026-03-10 — Add "Generate DKIM Keys" button and provision-domain endpoint

Users needed to see DKIM key values before saving an email account, but keys were only generated after Postfix received the domain config (which happened on account save). Added a way to trigger key generation from the UI before the account exists.

### Backend — API

- **`apps/integrations/api/email.py`** — Added `_sync_postfix_config_for_domain()` helper and `POST /provision-domain` endpoint. Writes `postfix_config.json` to the shared volume immediately when called, so Postfix can detect it and generate DKIM keys within ~10 seconds — without requiring an email account to be saved first.

### Frontend — Settings Page

- **`app/(dashboard)/settings/integrations/email/page.tsx`** — Added "Generate DKIM Keys" button next to the Mail Domain input in the `BuiltinSmtpInfo` component. Calls `POST /provision-domain`, shows "Generating..." spinner for ~15 seconds while Postfix generates keys, then auto-refetches DKIM records.

### Frontend — API & Hooks

- **`lib/api/integrations.ts`** — Added `provisionDomain()` API method.
- **`hooks/useIntegrations.ts`** — Added `useProvisionDomain()` mutation hook with delayed `dkim-record` and `builtin-smtp-status` query invalidation (15s).

---

## 2026-03-09 — Fix DKIM key generation: volume permissions, sed parsing, dual keys

Fixed three issues preventing DKIM keys from being generated and displayed in the DNS Setup panel.

### Docker — Postfix Container

- **`docker/postfix/entrypoint.sh`** — Three fixes:
  - Added `chmod 777 /etc/opendkim/keys` at startup so the backend user (uid 100) can write `postfix_config.json` to the shared volume.
  - Replaced `python3 -c "import json; ..."` config parsing with `sed` — the `python3-minimal` package in the container lacks the `json` module, causing `resolve_domain()` to silently return empty and Postfix to poll forever.
  - Changed `chown -R opendkim:opendkim /etc/opendkim/keys` (which removed write perms on the volume root) to only chown the domain subdirectory. Added `chmod 644` on `.txt` public key files so the backend can read them.
- **`docker/postfix/Dockerfile`** — Removed `python3-minimal` from apt packages (no longer needed since config parsing uses `sed`).

### Docker Compose

- **`docker-compose.prod.yml`** / **`docker-compose.yml`** — Removed `:ro` from the backend `dkim_keys` volume mount. The backend needs read-write access to write `postfix_config.json` when a builtin email account is created.

### Frontend — Hooks

- **`hooks/useIntegrations.ts`** — `useCreateEmailAccount` and `useUpdateEmailAccount` now invalidate `dkim-record` and `builtin-smtp-status` queries after a 15-second delay, allowing Postfix time to detect the config and generate keys before the UI refetches.

### Documentation

- **`backend/apps/integrations/MAILING.md`** — Updated configuration flow (chmod, sed, dual keys, verify-dns step), Docker services table (no python3, sed-based parsing, chmod), and volume mount description (read-write).

---

## 2026-03-08 — Dual DKIM Key Rotation & DNS Verification

Enhanced the built-in SMTP integration with dual DKIM key rotation for improved deliverability and a live DNS verification system so users can confirm their records are correctly published.

### Docker — Postfix Container

- **`docker/postfix/entrypoint.sh`** — Now generates **two** 2048-bit DKIM key pairs on startup (selectors `mail` and `mail2`) in a loop. Both selectors are registered in the OpenDKIM `KeyTable`; the primary selector (`mail`) is used for signing via `SigningTable`. The second key is available for DNS publication and future rotation.

### Backend — API

- **`apps/integrations/api/email.py`** — Refactored DKIM record reading:
  - Extracted `_read_dkim_record()` helper to parse a single DKIM `.txt` file from the shared volume.
  - `GET /dkim-record` now returns `{records: [{selector, domain, dns_name, record}, ...]}` with both `mail` and `mail2` selectors (was single record).
  - Added `GET /verify-dns` endpoint that performs live DNS lookups (via `dnspython`) for SPF, DKIM1, DKIM2, and DMARC TXT records, returning per-record status: `verified` / `pending` / `error`.
- **`backend/pyproject.toml`** — Added `dnspython>=2.6,<3` dependency.

### Frontend — Settings Page

- **`app/(dashboard)/settings/integrations/email/page.tsx`** — Redesigned the DNS Setup panel:
  - Replaced inline `DnsRecord` component with a structured DNS table showing all 4 records (SPF, DKIM 1, DKIM 2, DMARC) with Record/Type/Name/Value/Status columns.
  - Added `CopyButton` component for copying Name and Value fields.
  - Added `DnsStatusBadge` component showing `Pending` / `Verified` / `Error` per record.
  - Added "Re-check DNS" button that triggers `GET /verify-dns` and auto-polls every 10 seconds until all records are verified.
  - Shows success alert when all 4 records are verified.

### Frontend — API & Hooks

- **`lib/api/integrations.ts`** — Updated `getDkimRecord()` return type to `{records: [...]}`. Added `verifyDns()` API method.
- **`hooks/useIntegrations.ts`** — Added `useVerifyDns(enabled)` hook with `refetchInterval` that polls every 10s and stops when all records are verified.

### Documentation

- **`backend/apps/integrations/MAILING.md`** — Updated shared volume diagram (2 key pairs), API table (new `/verify-dns` endpoint), DNS setup section (4 records), DNS verification docs, and hooks table.

---

## 2026-03-08 — Built-in SMTP Server (Self-hosted Postfix with DKIM)

Added the option to send emails through a self-hosted Postfix container instead of requiring an external SMTP relay. The built-in mode auto-generates DKIM keys for email authentication and exposes DNS setup guidance in the UI.

### Docker — Postfix Container

- **`docker/postfix/Dockerfile`** — New container image: Ubuntu 22.04 + Postfix + OpenDKIM + opendkim-tools. Exposes port 25 internally (Docker network only).
- **`docker/postfix/entrypoint.sh`** — Reads mail domain from shared config file (`postfix_config.json` written by Django) or falls back to `MAIL_DOMAIN` env var. Polls every 10s if no domain configured yet. Auto-generates 2048-bit DKIM key, writes OpenDKIM tables (KeyTable, SigningTable, TrustedHosts), configures Postfix `main.cf` with Docker-internal `mynetworks`, opportunistic outbound TLS, and DKIM milter.
- **`docker/postfix/opendkim.conf`** — OpenDKIM base config: relaxed/simple canonicalization, sv mode, socket `inet:8891@localhost`.
- **`docker-compose.yml`** / **`docker-compose.prod.yml`** — Added `postfix` service with `dkim_keys` named volume. Volume mounted read-write on both Postfix and backend (backend writes config, reads DKIM public keys). Added `POSTFIX_HOST=postfix` and `POSTFIX_PORT=25` env vars to backend and celery services.

### Backend — Model

- **`apps/integrations/models/email_account.py`** — Added `SmtpMode` choices (`external`, `builtin`), `smtp_mode` field (default `external`), and `mail_domain` field for the sending domain when using builtin mode.

### Backend — Service Layer

- **`apps/integrations/services/email_service.py`** — `test_smtp_connection()` and `send_email()` now branch on `smtp_mode`: builtin connects to `postfix:25` without auth/TLS (trusted Docker network), external uses the existing configured SMTP host.

### Backend — API

- **`apps/integrations/api/email.py`** — Added `_sync_postfix_config()` helper that writes the active builtin mail domain to the shared volume as `postfix_config.json`. Called on account create/update when smtp_mode is builtin. Added two new endpoints:
  - `GET /builtin-smtp-status` — Checks Postfix reachability via socket connect, returns `{available, mail_domain}`.
  - `GET /dkim-record` — Reads DKIM public key from shared volume, parses BIND format, returns `{selector, domain, dns_name, record}` for DNS setup.
- **`apps/integrations/api/schemas.py`** — Added `smtp_mode` and `mail_domain` to `EmailAccountOut`, `EmailAccountCreate`, and `EmailAccountUpdate` schemas.

### Frontend — Settings Page

- **`app/(dashboard)/settings/integrations/email/page.tsx`** — Added SMTP mode selector (External vs Built-in toggle buttons). When "Built-in" selected: hides SMTP host/port/credentials fields, shows `BuiltinSmtpInfo` component with Postfix status indicator, editable mail domain input, and collapsible DNS Setup panel with SPF, DKIM, and DMARC record templates. Account list shows "Built-in" badge for builtin accounts.

### Frontend — API & Hooks

- **`lib/api/integrations.ts`** — Added `getBuiltinSmtpStatus()` and `getDkimRecord()` API methods.
- **`hooks/useIntegrations.ts`** — Added `useBuiltinSmtpStatus()` and `useDkimRecord()` hooks.
- **`types/integration.ts`** — Added `smtp_mode: "external" | "builtin"` and `mail_domain: string` to `EmailAccount` interface.

### Documentation

- **`backend/apps/integrations/MAILING.md`** — Updated with built-in SMTP architecture, Postfix container details, DNS setup guidance, new API endpoints, and updated file inventory.

---

## 2026-03-08 — Email Integration (SMTP/IMAP, Compose, Inbox Sync, Campaigns)

Added a complete Brevo-style email integration covering multi-account SMTP/IMAP configuration, compose & send from CRM, automatic inbox sync with entity auto-linking, threaded conversations, email templates, and bulk campaigns with per-recipient variable substitution.

### Backend — Models

- **`apps/integrations/models/email_account.py`** — New `EmailAccount` model with SMTP credentials (host, port, username, password, TLS/SSL), IMAP credentials (host, port, username, password, SSL, folder), sync state (`last_synced_uid`, `last_synced_at`, `sync_frequency`), and multi-account support (`display_name`, `is_default`, unique constraint on `(company, email_address)`).
- **`apps/integrations/models/email_message.py`** — New `EmailMessage` model with RFC 2822 threading headers (`message_id_header`, `in_reply_to`, `references_header`, `thread_id`), direction/status enums, HTML+text body, and Generic FK to link to Lead/Deal/Contact. New `EmailAttachment` model with file storage in `email_attachments/`.
- **`apps/integrations/models/email_campaign.py`** — New `EmailTemplate` model (name, subject, body with `{{variable}}` placeholders). New `EmailCampaign` model with status workflow (Draft → Scheduled → Sending → Sent), JSON recipients list, and delivery stats. New `EmailCampaignLog` for per-recipient tracking.
- **`apps/integrations/models/__init__.py`** — Exports all six new models.

### Backend — API Endpoints

- **`apps/integrations/api/email.py`** — 22 endpoints covering:
  - **Settings CRUD**: `GET/POST/PATCH/DELETE /settings`, `POST /settings/{id}/test` (test SMTP or IMAP connection). First account auto-promoted to default; default promoted on delete.
  - **Compose**: `POST /compose` with async Celery send, `POST /upload-attachment` for pre-upload. Account resolution cascade: explicit `account_id` → conversation history → default → any enabled.
  - **Messages**: `GET /messages/{entity_type}/{entity_id}` for entity emails, `GET /messages/detail/{id}`.
  - **Threads**: `GET /threads` groups messages by `thread_id` with participant list and entity linking. `GET /threads/{thread_id}/messages` returns full thread. `POST /sync/{account_id}` triggers manual IMAP sync.
  - **Templates**: Full CRUD + `POST /templates/{id}/preview` with sample context rendering.
  - **Campaigns**: Full CRUD + `POST /campaigns/{id}/send` queues async send + `GET /campaigns/{id}/logs` for delivery logs.
- **`apps/integrations/api/schemas.py`** — Added `EmailAccountOut/Create/Update`, `EmailAccountTestIn`, `EmailMessageOut`, `EmailAttachmentOut`, `EmailComposeIn`, `EmailTemplateOut/Create/Update`, `EmailCampaignOut/Create/Update`, `EmailCampaignLogOut`, `EmailTemplatePreviewIn`. Added `email_enabled: bool` to `IntegrationStatusOut`.
- **`apps/integrations/api/router.py`** — Mounted email router at `/email/`.
- **`apps/integrations/api/telephony.py`** — Added `email_enabled` check to integration status endpoint.

### Backend — Service Layer

- **`apps/integrations/services/email_service.py`** — New service with:
  - `test_smtp_connection()` / `test_imap_connection()` — credential verification.
  - `send_email()` — builds `MIMEMultipart` with HTML+text alternatives, file attachments, and RFC threading headers (`Message-ID`, `In-Reply-To`, `References`).
  - `sync_imap_inbox()` — incremental IMAP sync using UID watermark, parses RFC822 messages, extracts bodies and attachments, computes `thread_id` from References chain, auto-links to Lead/Contact/Deal by email address matching, broadcasts WebSocket events.
  - `render_template()` — simple `{{variable}}` regex substitution for campaign templates.

### Backend — Celery Tasks

- **`apps/integrations/tasks.py`** — Three new tasks:
  - `send_email_task(email_message_id)` — async SMTP send with status tracking (Queued → Sending → Sent/Failed).
  - `sync_email_inboxes(frequency_label)` — syncs all enabled accounts matching the given frequency.
  - `send_campaign_task(campaign_id)` — iterates recipients, renders templates per-recipient, sends individually with `time.sleep(0.1)` rate limiting, creates `EmailCampaignLog` entries, updates campaign stats.
- **`config/celery.py`** — Added three beat schedule entries: `sync-email-5min` (*/5), `sync-email-15min` (*/15), `sync-email-hourly` (top of hour).

### Backend — Docker

- **`backend/Dockerfile.prod`** — Added `email_attachments` to the media directory creation.

### Frontend — Email Inbox Page

- **`app/(dashboard)/email/page.tsx`** — Split-view email inbox mirroring WhatsApp layout: thread list on left, email panel on right. Account selector, search, manual sync button, compose modal. Blue theme for email (vs green for WhatsApp).

### Frontend — Email on Lead/Deal Detail

- **`components/email/EmailChat.tsx`** — Email timeline component showing emails linked to an entity. Chronological display with from/to, subject, HTML body, attachments, timestamp, and status. Inline compose form with reply pre-fill. Collapsible view showing last 3 messages.
- **`app/(dashboard)/leads/[id]/page.tsx`** — Added `EmailChat` component below WhatsApp chat, shown when email is enabled and lead has an email address.
- **`app/(dashboard)/deals/[id]/page.tsx`** — Same `EmailChat` integration for deals.

### Frontend — Settings Page

- **`app/(dashboard)/settings/integrations/email/page.tsx`** — Multi-account email settings page with SMTP config (host, port, username, password, TLS/SSL), IMAP config (toggled by enable_incoming), sync frequency selector, and "Test SMTP" / "Test IMAP" buttons. Account list with enable indicator, default badge, set-default/edit/delete actions.
- **`app/(dashboard)/settings/integrations/page.tsx`** — Added Email card with `Mail` icon and `email_enabled` status key.

### Frontend — Campaign Pages

- **`app/(dashboard)/email/templates/page.tsx`** — Template CRUD with inline HTML editor and live preview toggle. Variable hint display.
- **`app/(dashboard)/email/campaigns/page.tsx`** — Campaign list with status badges (Draft, Sending, Sent, Failed) and delivery stats.
- **`app/(dashboard)/email/campaigns/[id]/page.tsx`** — Campaign detail with stats cards (recipients, sent, failed), recipient list, send log with per-recipient status, and email body preview.
- **`app/(dashboard)/email/campaigns/new/page.tsx`** — 3-step campaign wizard: (1) name + account + template selection, (2) subject + body editor with preview, (3) recipients via single add or bulk paste.

### Frontend — API & Hooks

- **`lib/api/integrations.ts`** — Added `composeEmail`, `uploadEmailAttachment`, `getEntityEmails`, `getEmailDetail`, `getEmailThreads`, `getThreadMessages`, `triggerEmailSync` methods.
- **`hooks/useIntegrations.ts`** — Added `useEntityEmails`, `useComposeEmail`, `useUploadEmailAttachment`, `useEmailThreads`, `useThreadMessages`, `useTriggerEmailSync` hooks with proper query key invalidation.
- **`types/integration.ts`** — Added `EmailMessage`, `EmailAttachment`, `EmailThread` interfaces. Added `email_enabled` to `IntegrationStatus`.
- **`components/layout/Sidebar.tsx`** — Added Email nav item with `Mail` icon, conditionally shown when `email_enabled`.

### Documentation

- **`backend/apps/integrations/MAILING.md`** — Module reference documenting database tables, API endpoints, service layer, IMAP sync flow, auto-linking logic, campaign send flow, multi-account resolution, and file inventory.

---

## 2026-03-08 — Multi WhatsApp Business Account Support

Added support for multiple WhatsApp Business Accounts per company. Each company can now configure multiple phone numbers (e.g. "Sales", "Support"), with conversations separated per account and automatic outgoing number selection based on conversation history.

### Backend — Model Changes
- **`apps/integrations/models/whatsapp_settings.py`** — Added `display_name` (human label), `is_default` (default account flag), and `unique_together` constraint on `(company, phone_number_id)` to `WhatsAppSettings`. Added `whatsapp_account` FK on `WhatsAppMessage` linking each message to the account that sent/received it.

### Backend — API (Singleton → CRUD)
- **`apps/integrations/api/whatsapp.py`** — Converted settings endpoints from singleton `get_or_create` to full CRUD list: `GET /settings` returns array, `POST /settings` creates new account, `PATCH /settings/{id}` updates, `DELETE /settings/{id}` removes (with default promotion). Added `_resolve_wa_account()` helper that selects the outgoing account by priority: explicit `account_id` → conversation history → default account → any enabled account. Conversations endpoint accepts optional `account_id` filter and includes `whatsapp_account_id`/`whatsapp_account_name` in results. Removed dangerous webhook fallback that could route messages to the wrong company — unknown `phone_number_id` values are now logged and ignored.
- **`apps/integrations/api/schemas.py`** — Added `display_name`, `is_default` to settings schemas. Added `whatsapp_account_id` to message output. Added `account_id` to message create and send-template schemas.

### Backend — Service Layer
- **`apps/integrations/services/whatsapp_service.py`** — `handle_webhook()` now sets `whatsapp_account=wa_settings` on created messages. WebSocket broadcasts include `whatsapp_account_id` for frontend routing.

### Backend — Data Migration
- **`apps/integrations/management/commands/backfill_whatsapp_accounts.py`** — New management command (runs at startup, idempotent) that backfills `is_default` and `display_name` on existing accounts, and links orphaned messages to their accounts by `company_id`.
- **`docker-compose.yml`** / **`docker-compose.prod.yml`** — Added `backfill_whatsapp_accounts` to startup command sequence after migrations.

### Frontend — Settings Page
- **`app/(dashboard)/settings/integrations/whatsapp/page.tsx`** — Redesigned from single-form to multi-account list with add/edit/delete dialogs, "Set as Default" action, and shared webhook URL display.

### Frontend — Conversations Page
- **`app/(dashboard)/whatsapp/page.tsx`** — Added account selector dropdown in header. Conversations filtered by selected account. `account_id` passed when sending messages.

### Frontend — Chat Component
- **`components/telephony/WhatsAppChat.tsx`** — Accepts optional `accountId` prop, passes it in all send operations (text, sticker, voice).

### Frontend — Lead/Deal Detail
- **`app/(dashboard)/leads/[id]/page.tsx`** / **`app/(dashboard)/deals/[id]/page.tsx`** — Updated WhatsApp enabled check from `whatsAppSettings?.enabled` to `whatsAppSettings?.some((a) => a.enabled)` since settings is now an array.

### Frontend — API & Hooks
- **`lib/api/integrations.ts`** — `getWhatsAppSettings` returns array. Added `createWhatsAppAccount`, `updateWhatsAppAccount`, `deleteWhatsAppAccount`. Conversations and messages accept optional `accountId` param.
- **`hooks/useIntegrations.ts`** — Updated hooks for array-based settings. Added create/update/delete mutations. Query keys include `accountId` for proper cache separation.
- **`types/integration.ts`** — Added `display_name`, `is_default` to `WhatsAppSettings`. Added `whatsapp_account_id` to `WhatsAppMessage` and `WhatsAppConversation`.

### Documentation
- **`backend/apps/integrations/WHATSAPP.md`** — New module reference documenting database tables, API endpoints, webhook flow, account resolution logic, media handling, and architectural decisions.

---

## 2026-03-05 — Fix Setup Wizard Seed Data Crash

### Setup Endpoint 500 Error
The "Launch Precept" button on the setup screen failed with a generic "An error occurred" message. The `_seed_lookup_data` function used incorrect field names (`name`, `category`, `order`) that didn't match the actual model fields.

- **`backend/apps/core/api/router.py`** — Fixed `_seed_lookup_data` to use correct model field names: `lead_status`/`type`/`position` for `LeadStatus`, `deal_status`/`type`/`position`/`probability` for `DealStatus`, `source_name` for `LeadSource`, and `industry_name` for `Industry`. Refactored the seed config to specify each model's key field explicitly.

---

## 2026-03-05 — Fix Multi-Schema Migrations & Celery Beat Startup

### Database Migration Order Fix
Migrations failed on fresh deploy because `core.0001_initial` referenced `auth_group` (in infra schema) before it was created.

- **`docker-compose.prod.yml`** — Swapped migration order: `--database=infra` now runs before `--database=default`, ensuring auth/contenttypes tables exist when core migrations create FK references to them.

### Database Router Fix — Admin Cross-Schema Dependency
`admin.0001_initial` failed because `admin.LogEntry` has a FK to `core.User` (precept schema), but admin was routed to the infra database where `core_users` doesn't exist.

- **`config/db_router.py`** — Removed `admin` from `INFRA_APPS`. Admin now migrates on the `default` database alongside `core`, resolving the cross-schema FK dependency.

### Celery Beat Race Condition Fix
Celery beat crashed on startup with `relation "django_celery_beat_crontabschedule" does not exist` because it started before backend finished running migrations.

- **`docker-compose.prod.yml`** — Added TCP socket healthcheck to backend service (checks gunicorn is listening on port 8000). Changed celery-beat and celery-worker to `depends_on: backend: condition: service_healthy` instead of `service_started`.

### Health Check Endpoint
- **`config/urls.py`** — Added `/api/health/` endpoint returning `{"status": "ok"}` (no auth required) for future monitoring use.

---

## 2026-03-05 — Emoji Picker: Dark/Light Theme & Multi-Pick Fix

### Emoji Picker Theme Support
- **`components/chat/ChatEmojiPicker.tsx`** — Emoji picker now follows the app's dark/light theme using `useTheme()` from `next-themes` and the `Theme` prop from `emoji-picker-react`.

### Emoji Picker No Longer Closes After First Pick
- **`components/chat/ChatEmojiPicker.tsx`** — Fixed popover closing immediately after selecting an emoji. Internal clicks inside the picker are now intercepted via `onInteractOutside` with a ref-based check, while genuine outside clicks still dismiss the popover. Updated button styling to match WhatsApp chat design (`rounded-full`, `hover:bg-muted/60`, `rounded-2xl` popover).

---

## 2026-03-05 — WhatsApp Chat: Voice Recording, Real-Time Updates & Modern UI

### Voice Recording with Live Waveform
Added voice note recording to WhatsApp chat with real-time audio visualization.

- **`components/chat/VoiceRecorder.tsx`** — New component using MediaRecorder API + AudioContext/AnalyserNode for live waveform bars. Three states: mic button (default), recording (24 animated bars + timer + cancel/send), sending (spinner). Smooth slide-in/fade-in animations and pulsing red recording indicator.
- **`components/telephony/WhatsAppChat.tsx`** — Integrated VoiceRecorder with `handleVoiceSend` callback; mic button replaces send when input is empty.

### Custom Inline Audio Player
Replaced native `<audio>` element with a WhatsApp-style audio player.

- **`components/chat/ChatMediaRenderer.tsx`** — New `AudioPlayer` component with play/pause button, 32-bar waveform progress visualization, click-to-seek, and time display. Colors adapt to outgoing (white-on-green) vs incoming (green-on-white) messages.

### WhatsApp API Audio Fix
WhatsApp Cloud API rejects `audio/webm` uploads, causing "An error occurred" when sending voice notes.

- **`apps/integrations/api/whatsapp.py`** — Added ffmpeg conversion (webm → ogg/opus) before upload. Added try/except around `upload_media()` and `send_media_message()` with proper error responses. Strips codec params from MIME type before upload.
- **`backend/Dockerfile.prod`** — Added `ffmpeg` to runtime apt packages.

### Real-Time Message Updates via WebSocket
Messages now appear instantly without page reload.

- **`.env`** / **`docker-compose.prod.yml`** — Fixed WebSocket URL from `wss://precept.online/ws` to `wss://precept.online/ws/crm/` matching Django Channels routing.

### Modern WhatsApp UI Redesign
Redesigned the WhatsApp page with shadcn v4-inspired patterns and WhatsApp-green theme.

- **`app/(dashboard)/whatsapp/page.tsx`** — WhatsApp-green (emerald-600) message bubbles, backdrop-blur sticky headers, date separators (Today/Yesterday), content type icons in previews, `data-[active=true]:bg-accent` conversation items. Removed non-functional Call/Search/More buttons.
- **`apps/integrations/api/schemas.py`** — Updated API schemas for WhatsApp integration.
- **`apps/integrations/services/whatsapp_service.py`** — WhatsApp service improvements.
- **`frontend/src/hooks/useWebSocket.ts`** — WebSocket hook updates.
- **`frontend/src/types/integration.ts`** — Updated WhatsApp type definitions.

### Error Handling Improvements
- **`lib/api/client.ts`** — `extractErrorMessage` now checks both `error.detail` and `error.error` fields.

---

## 2026-03-04 — Docker: Expose PostgreSQL & Explicit Container Names

### Production Docker Compose
- **`docker-compose.prod.yml`** — Exposed PostgreSQL on `127.0.0.1:5432` for local tooling access (pgAdmin, VSCode extensions)
- **`docker-compose.prod.yml`** — Added explicit `container_name` to all services, removing the auto-generated `-1` suffix

---

## 2026-03-04 — Auth Redesign, Brand Color Palette & Dark Mode

### Authentication Page Redesign
Redesigned the login page using the shadcn/ui authentication example pattern.

- **`app/(auth)/layout.tsx`** — Two-column split layout: left panel with brand-black background, logo, and testimonial; right panel with centered form and theme toggle
- **`app/(auth)/login/page.tsx`** — Minimal auth form (no Card wrapper), sr-only labels, placeholder-driven inputs, loading spinner on submit

### Brand Color Palette
Introduced a four-color brand palette applied across the entire design system.

| Color  | Hex       | Usage                              |
|--------|-----------|------------------------------------|
| Black  | `#010203` | Auth branding panel, foreground     |
| Violet | `#7e3bed` | Primary (buttons, links, rings)     |
| White  | `#f0eee9` | Available as `brand-white` utility  |
| Lime   | `#c6ff34` | Charts, badges, special highlights  |

- **`styles/globals.css`** — Rewired all CSS variables: primary → violet, accent → violet tints, neutrals derived from violet spectrum
- **`tailwind.config.js`** — Added `brand-black`, `brand-violet`, `brand-white`, `brand-lime` utility classes

### Dark/Light Theme Toggle
Added full dark mode support with a one-click toggle.

- **`app/providers.tsx`** — Wrapped app with `next-themes` ThemeProvider (class-based, system default)
- **`app/layout.tsx`** — Added `suppressHydrationWarning` on `<html>`, updated theme-color meta to violet
- **`components/ui/theme-toggle.tsx`** — Sun/Moon icon button, single click toggles between light and dark
- **`components/layout/Header.tsx`** — Theme toggle added to dashboard header

### Dark Mode Color Fixes
Replaced hardcoded gray colors with theme-aware equivalents across 17 files.

| Hardcoded                        | Replaced with              |
|----------------------------------|----------------------------|
| `text-gray-900/800`              | `text-foreground`          |
| `text-gray-700/600/500/400`      | `text-muted-foreground`    |
| `text-gray-300`                  | `text-muted-foreground/50` |
| `bg-gray-100/200`                | `bg-muted`                 |
| `bg-gray-50`                     | `bg-muted/50`              |
| `bg-white`                       | `bg-card`                  |
| `border-gray-100/200/300`        | `border-border`            |

**Affected pages:** Leads, Lead Detail, Deals, Deal Detail, Contacts, Tasks, Notes, Call Logs, Calendar, Settings (General, Products, SLA, all Integrations)
**Affected components:** ActivityTimeline, NotificationPanel, TaskItem, BarChart, LineChart, SLABadge

---

## 2026-03-04 — WhatsApp Integration UI & Lead/Deal Creation Fix

### WhatsApp Conversations Page
Added a dedicated WhatsApp page accessible from the sidebar navigation.

#### Backend
- **`apps/integrations/api/whatsapp.py`** — Two new endpoints:
  - `GET /conversations` — Lists all WhatsApp conversations grouped by remote phone number, with last message preview and linked entity info
  - `GET /conversations/{phone_number}/messages` — Returns full message history for a specific conversation

#### Frontend
- **`app/(dashboard)/whatsapp/page.tsx`** — New WhatsApp page with split-view layout: conversation list on the left, chat panel on the right. Shows "not configured" prompt if WhatsApp is disabled
- **`components/layout/Sidebar.tsx`** — Added "WhatsApp" link with MessageCircle icon
- **`app/(dashboard)/leads/[id]/page.tsx`** — WhatsApp chat panel shown on lead detail when WhatsApp is enabled and lead has a phone number
- **`app/(dashboard)/deals/[id]/page.tsx`** — Same WhatsApp chat on deal detail pages
- **`lib/api/integrations.ts`** — Added `getWhatsAppConversations()` and `getConversationMessages()` API methods
- **`hooks/useIntegrations.ts`** — Added `useWhatsAppConversations()` and `useConversationMessages()` hooks
- **`types/integration.ts`** — Added `WhatsAppConversation` interface

### Lead/Deal Creation Fix — `status_id: Field required`
Creating leads or deals from the frontend failed because the backend required `status_id` (integer FK) but the frontend form doesn't send it.

#### Changes
- **`apps/crm/api/schemas/lead.py`** — Made `status_id` optional in `LeadCreate`
- **`apps/crm/api/schemas/deal.py`** — Made `status_id` optional in `DealCreate`
- **`apps/crm/api/leads.py`** — Auto-assigns the first `LeadStatus` (by position) when no `status_id` is provided
- **`apps/crm/api/deals.py`** — Auto-assigns the first `DealStatus` (by position) when no `status_id` is provided

### API Error Display Fix — `[object Object]`
Error messages from the API were showing as `[object Object]` instead of readable text.

#### Changes
- **`lib/api/client.ts`** — Added `extractErrorMessage()` that handles Django Ninja validation errors (arrays of `{loc, msg}` objects) and converts them to readable strings like `"status_id: Field required"`

### Lead Detail Page Crash — `i.map is not a function`
Clicking on a lead detail page caused a client-side crash.

#### Root Cause
The backend WhatsApp messages endpoint (`GET /messages/{entity_type}/{entity_id}`) returns a paginated object `{ results: [], total, page, page_size }`, but the frontend API client expected a flat `WhatsAppMessage[]` array. The `WhatsAppChat` component then called `.map()` on the object, which crashed.

#### Changes
- **`lib/api/integrations.ts`** — `getWhatsAppMessages()` now extracts `.results` from the paginated response before returning

---

## 2026-03-03 — Kanban Drag-and-Drop Fix & Default View

### Problem
Kanban drag-and-drop on Leads and Deals pages appeared to work visually but never persisted status changes. Cards would snap back to their original column after dropping.

### Root Cause
Two issues were at play:

1. **Code never deployed**: The production setup (`docker-compose.prod.yml`) bakes code into Docker images with no volume mounts. All backend and frontend code changes existed only on disk — the running containers still had the old code. Rebuilding images with `docker compose -f docker-compose.prod.yml build` was required.

2. **Missing column IDs**: The kanban API returned column names (strings like "New", "Open") but the PATCH endpoint expects `status_id` (integer FK). The frontend was sending string names instead of integer IDs.

### Changes

#### Backend
- **`apps/crm/api/leads.py`** — Kanban endpoint now returns `column_id` (the `LeadStatus.id`) with each column
- **`apps/crm/api/deals.py`** — Same `column_id` addition for deal statuses and FK-based columns

#### Frontend
- **`components/views/KanbanBoard.tsx`** — `KanbanColumn` interface includes `column_id`; drag start/drop handlers pass integer IDs instead of column names
- **`hooks/useKanban.ts`** — `KanbanColumn<T>` type updated with `column_id: number | null`
- **`app/(dashboard)/leads/page.tsx`** — `onCardMove` sends `{ status_id: toColumnId }` via `useUpdateLead` mutation; default view changed from `"list"` to `"kanban"`
- **`app/(dashboard)/deals/page.tsx`** — Same pattern with `useUpdateDeal`; default view set to `"kanban"`

### Deployment
```bash
docker compose -f docker-compose.prod.yml build backend frontend
docker compose -f docker-compose.prod.yml up -d backend frontend
```

### Verification
Tested end-to-end via curl:
- `GET /api/crm/leads/kanban` returns `column_id` per column
- `PATCH /api/crm/leads/{id}` with `{"status_id": 2}` updates the lead status successfully

### Lesson Learned
When running production Docker images (no bind mounts), always rebuild images after code changes. `docker compose restart` only restarts the container with the same baked-in image.

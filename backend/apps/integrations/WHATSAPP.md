# WhatsApp Module — Architecture & Reference

## Overview

The WhatsApp module integrates with the **Meta WhatsApp Cloud API (Graph API v19.0)** to enable two-way messaging between the CRM and WhatsApp contacts. It supports **multiple WhatsApp Business Accounts per company/tenant**, with conversations scoped per account and automatic outgoing account selection based on conversation history.

---

## Database Tables

### `integration_whatsapp_settings`

Stores WhatsApp Business Account credentials. One row per phone number per company.

| Column | Type | Notes |
|--------|------|-------|
| `id` | int (PK) | Auto-increment |
| `company_id` | int (FK → companies) | Tenant scope (from `TenantMixin`) |
| `enabled` | bool | Whether this account is active |
| `display_name` | varchar(255) | Human label (e.g. "Sales", "Support") |
| `is_default` | bool | Default account for new conversations |
| `phone_number_id` | varchar(255) | Meta phone number ID (from WhatsApp Business settings) |
| `access_token` | varchar(512) | Permanent or long-lived Graph API token |
| `business_account_id` | varchar(255) | WhatsApp Business Account ID |
| `webhook_verify_token` | varchar(255) | Token for GET webhook verification |
| `app_secret` | varchar(255) | App secret for X-Hub-Signature-256 validation |

**Constraints:**
- `unique_together: (company, phone_number_id)` — prevents duplicate phone numbers within a company

**Default account rules:**
- First account created for a company is automatically set as default
- When the default account is deleted, the next account is promoted
- Setting a new default unsets `is_default` on all other accounts (atomic transaction)

### `integration_whatsapp_messages`

Stores all incoming and outgoing WhatsApp messages.

| Column | Type | Notes |
|--------|------|-------|
| `id` | int (PK) | Auto-increment |
| `company_id` | int (FK → companies) | Tenant scope |
| `whatsapp_account_id` | int (FK → integration_whatsapp_settings, nullable) | Which account sent/received this message |
| `message_id` | varchar(255) | WhatsApp message ID from Meta (indexed, used for idempotency) |
| `message_type` | varchar(20) | `Incoming` or `Outgoing` |
| `from_number` | varchar(50) | Sender phone number (phone_number_id for outgoing) |
| `to_number` | varchar(50) | Recipient phone number |
| `content` | text | Message body (text, caption, or empty for media) |
| `content_type` | varchar(50) | `text`, `image`, `video`, `audio`, `document`, `sticker`, `template`, `reaction` |
| `status` | varchar(20) | `Pending`, `Sent`, `Delivered`, `Read`, `Failed` |
| `template_name` | varchar(255) | Template name (for template messages) |
| `media_url` | varchar(512) | Local path (`/media/whatsapp/...`) or legacy Facebook URL |
| `mime_type` | varchar(128) | MIME type of media |
| `reply_to_id` | int (FK → self, nullable) | Threaded replies |
| `content_type_fk` | int (FK → django_content_type, nullable) | Generic FK — entity type (Lead/Deal) |
| `object_id` | int (nullable) | Generic FK — entity ID |
| `created_at` | datetime | Auto-set on creation |
| `updated_at` | datetime | Auto-set on save |
| `created_by_id` | int (nullable) | User who sent (outgoing only) |
| `modified_by_id` | int (nullable) | |

**Ordering:** `-created_at` (newest first by default)

---

## File Structure

```
backend/apps/integrations/
├── models/
│   ├── __init__.py                    # Exports WhatsAppSettings, WhatsAppMessage
│   └── whatsapp_settings.py           # Model definitions
├── api/
│   ├── schemas.py                     # Pydantic schemas (input/output)
│   └── whatsapp.py                    # API endpoints (Django Ninja router)
├── services/
│   └── whatsapp_service.py            # Graph API calls, webhook processing, WebSocket broadcast
├── management/
│   └── commands/
│       └── backfill_whatsapp_accounts.py  # Data migration command
└── migrations/                        # Auto-generated at container startup

frontend/src/
├── types/integration.ts               # TypeScript interfaces
├── lib/api/integrations.ts            # API client functions
├── hooks/useIntegrations.ts           # React Query hooks
├── app/(dashboard)/
│   ├── whatsapp/page.tsx              # Conversations page with account selector
│   ├── leads/[id]/page.tsx            # Lead detail (embedded WhatsApp chat)
│   ├── deals/[id]/page.tsx            # Deal detail (embedded WhatsApp chat)
│   └── settings/integrations/whatsapp/page.tsx  # Multi-account settings management
└── components/telephony/
    └── WhatsAppChat.tsx               # Reusable chat component (used in lead/deal detail)
```

---

## API Endpoints

All endpoints are under `/api/integrations/whatsapp/` and require JWT auth unless noted.

### Settings (CRUD)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings` | List all accounts for this company → `WhatsAppSettings[]` |
| `POST` | `/settings` | Create a new account → `WhatsAppSettings` |
| `GET` | `/settings/{account_id}` | Get single account |
| `PATCH` | `/settings/{account_id}` | Update account fields |
| `DELETE` | `/settings/{account_id}` | Delete account (promotes next default) |

### Messages

| Method | Path | Query Params | Description |
|--------|------|-------------|-------------|
| `GET` | `/messages/{entity_type}/{entity_id}` | `page`, `page_size` | Messages linked to a lead/deal |
| `GET` | `/conversations` | `page`, `page_size`, `account_id` | Conversations grouped by remote phone number |
| `GET` | `/conversations/{phone_number}/messages` | `page`, `page_size`, `account_id` | Full message history for a phone number |
| `POST` | `/messages` | — | Send text or media message |
| `POST` | `/send-template` | — | Send a template message |
| `POST` | `/upload` | — | Upload media file (multipart/form-data) |
| `GET` | `/media/{message_id}` | `token` | Serve media (HMAC-signed, no JWT) |

### Webhooks (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/webhook` | Meta verification handshake (`hub.verify_token`) |
| `POST` | `/webhook` | Incoming messages and status updates |

**Single webhook URL** — All accounts share the same webhook URL. Routing is done by extracting `phone_number_id` from the payload metadata and matching it to a `WhatsAppSettings` row.

---

## Account Resolution Logic

When sending a message, the system determines which WhatsApp account to use via `_resolve_wa_account()`:

```
1. Explicit account_id provided?  → Use that account (must be enabled)
2. Conversation history exists?   → Use the account from the most recent message to/from that number
3. Company has a default account? → Use the is_default=True account
4. Any enabled account exists?    → Use the first one found
5. None of the above?             → Return 400 error
```

This allows:
- **Manual override**: Frontend can pass `account_id` to force a specific account
- **Continuity**: Replies automatically go through the same number the contact last interacted with
- **Fallback**: New conversations use the default account

---

## Webhook Flow

```
Meta Cloud API → POST /api/integrations/whatsapp/webhook
                    │
                    ├── Parse JSON body
                    ├── Extract phone_number_id from payload.entry[].changes[].value.metadata
                    ├── Lookup WhatsAppSettings by phone_number_id (unscoped, bypasses tenant filter)
                    │     └── If no match → log warning, return {"status": "ok"} (ignore)
                    │
                    └── handle_webhook(payload, wa_settings)
                          ├── Messages: create WhatsAppMessage rows (idempotent by message_id)
                          │     ├── Download & store media locally (/media/whatsapp/)
                          │     ├── Set whatsapp_account FK
                          │     └── Broadcast via WebSocket → "crm_updates" group
                          │
                          └── Status updates: update message status (sent/delivered/read/failed)
                                └── Broadcast status change via WebSocket
```

---

## Multi-Tenant Notes

- Both models inherit from `TenantMixin` which auto-filters queries by `request.company`
- Use `.unscoped` manager to bypass tenant filtering (needed in webhooks where there's no request context)
- The webhook handler uses `WhatsAppSettings.unscoped.filter(phone_number_id=...)` since incoming webhooks have no auth/tenant context

---

## Media Handling

### Incoming media
1. Webhook receives message with media type (image, video, audio, document, sticker)
2. `_download_and_store_media()` fetches the file via Graph API (two-step: get URL, then download)
3. File saved to `/media/whatsapp/{uuid}.{ext}`
4. `media_url` stored as `/media/whatsapp/...`

### Outgoing media
1. Frontend uploads file via `POST /upload` → saved to `/media/whatsapp/`
2. `POST /messages` with `content_type=image` and `media_url=/media/whatsapp/...`
3. Backend uploads to WhatsApp via `upload_media()`, then sends via `send_media_message()`

### Media proxy
- `GET /media/{message_id}?token=...` serves files with HMAC-signed tokens (since `<img>` tags can't send JWT headers)
- Local files served directly; legacy Facebook URLs proxied using the account's access token

### Audio conversion
- WhatsApp rejects `audio/webm` — backend auto-converts to OGG/Opus via ffmpeg
- OGG files sent with `audio/ogg; codecs=opus` MIME type so WhatsApp renders them as voice notes

### Animated sticker compression
- WhatsApp limits stickers to 500KB
- `_compress_animated_sticker()` uses `webpmux`/`img2webp` to re-encode at decreasing quality levels

---

## WebSocket Events

Broadcast to the `crm_updates` channel group via Django Channels:

```json
{
  "type": "whatsapp_message",
  "event": "new_message" | "status_update",
  "phone_number": "...",
  "message_id": 123,
  "whatsapp_account_id": 1,
  ...
}
```

Frontend listens on `wss://{host}/ws/crm/` and uses `whatsapp_account_id` to route updates to the correct account view.

---

## Management Commands

### `backfill_whatsapp_accounts`

Runs at container startup (after migrations). Safe to run multiple times (idempotent).

- Sets `is_default=True` on all existing `WhatsAppSettings` rows that don't have it
- Sets `display_name` from `phone_number_id` if blank
- Links orphaned `WhatsAppMessage` rows (where `whatsapp_account` is null) to the correct account by matching `company_id`

---

## Frontend Architecture

### Settings page (`/settings/integrations/whatsapp`)
- Lists all configured accounts in a table (display name, phone number ID, enabled, default badge)
- Add/edit/delete accounts via dialog forms
- Webhook URL displayed once (shared by all accounts)

### Conversations page (`/whatsapp`)
- Account selector dropdown in the header (filters conversations by account)
- Split view: conversation list (left) + chat panel (right)
- `account_id` passed to all API calls for scoping

### Lead/Deal detail pages
- Embedded `WhatsAppChat` component when WhatsApp is enabled and entity has a phone number
- Checks `whatsAppSettings?.some((a) => a.enabled)` since settings is now an array
- `accountId` prop passed to chat component for sending

### React Query hooks
- `useWhatsAppConversations(accountId?)` — includes `accountId` in query key for proper cache separation
- `useConversationMessages(phoneNumber, accountId?)` — same pattern
- Mutations invalidate `whatsapp-settings` query key on success

---

## Key Design Decisions

1. **Management command over data migration**: Auto-generated migrations (`makemigrations` at startup) make traditional Django data migrations unreliable. The `backfill_whatsapp_accounts` command runs after migrate and is idempotent.

2. **Single webhook URL**: All accounts share one webhook endpoint. Routing is by `phone_number_id` in the payload. Unknown phone numbers are silently ignored (logged as warning).

3. **No dangerous fallback**: The webhook handler does NOT fall back to "any enabled account" if `phone_number_id` doesn't match. This prevents messages from being attributed to the wrong company/account.

4. **Account resolution cascade**: Explicit → history → default → any. This gives users both automatic continuity and manual control.

5. **`unique_together` on `(company, phone_number_id)`**: Prevents accidentally configuring the same Meta phone number twice within a company.

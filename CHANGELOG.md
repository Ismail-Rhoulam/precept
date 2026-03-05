# Changelog

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

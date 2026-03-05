# Changelog

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

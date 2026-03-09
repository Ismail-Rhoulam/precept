# Precept: Django + Next.js (Inspired by Frappe CRM)

## Context

Build a new CRM application called **Precept** at `/opt/frappe_docker/precept/`, using **Django + Django Ninja** (backend) and **Next.js App Router** (frontend) with **PostgreSQL**, taking Frappe CRM's feature set as the blueprint. The Frappe CRM source at `/opt/frappe_docker/crm/` and `/opt/frappe_docker/frontend/` serves as reference only — the new project is a clean build using each framework's native conventions.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Backend** | Django 5.1 + Django Ninja 1.3 |
| **API** | Django Ninja (auto OpenAPI docs, type-hinted) |
| **Auth** | django-ninja-jwt (JWT) |
| **Database** | PostgreSQL 16 (row-level multi-tenancy, `company_id` on every row) |
| **Background Jobs** | Celery + Redis + django-celery-beat |
| **Real-time** | Django Channels (WebSocket via Daphne) |
| **Frontend** | Next.js 14+ (App Router, Client Components) |
| **State** | Zustand (client) + TanStack Query (server) |
| **UI** | shadcn/ui + Tailwind CSS 3.4 |
| **Rich Editor** | TipTap (React) |
| **Charts** | ECharts (echarts-for-react) |
| **Drag & Drop** | @dnd-kit |
| **Table** | TanStack Table |
| **Telephony** | @twilio/voice-sdk |
| **PWA** | next-pwa |
| **i18n** | next-intl |

---

## Multi-Tenant Database Architecture

### PostgreSQL Schema Layout
```
PostgreSQL
│
├── schema: precept              → All business data · Django owns and migrates
│                                  company_id on every row · row-level tenancy
│
└── schema: infra                → Platform internals · Django owns and migrates
    └── django_migrations        → Django migration state
                                   (no django_sessions — sessions are Redis-backed
                                    via redis-cache db=1;
                                    no celery_results — Celery result backend is
                                    redis-broker db=1, not PostgreSQL)
```

### Row-Level Tenancy Design

**Company model** (`apps/core/models/company.py`) — the tenant identifier:
```python
class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"precept"."company"'
```

**TenantMixin** — added to every business model:
```python
class TenantMixin(models.Model):
    company = models.ForeignKey(
        "core.Company", on_delete=models.CASCADE, db_index=True
    )

    class Meta:
        abstract = True
```

**Automatic scoping**:
- **Middleware** (`apps/core/middleware/tenant.py`) — resolves `company_id` from JWT claims or request header, sets `request.company`
- **TenantManager** — custom default manager that auto-filters by `company_id` from current request context (using `threading.local()` or `contextvars`)
- **All querysets** automatically scoped: `Lead.objects.all()` → `WHERE company_id = <current_company>`
- **Admin/superuser bypass** — platform admins can query across tenants

**Database routers** (`config/db_router.py`):
- Business models → `precept` schema (default)
- Django internals (migrations) → `infra` schema
- Sessions → Redis (db=1), not PostgreSQL
- Celery results → Redis (db=1), not PostgreSQL

**Django settings**:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {'options': '-c search_path=precept,public'},
    },
    'infra': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {'options': '-c search_path=infra,public'},
    },
}

# Sessions via Redis, not DB
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'

CACHES = {
    'default': {'BACKEND': 'django_redis.cache.RedisCache', 'LOCATION': 'redis://redis:6379/0'},
    'sessions': {'BACKEND': 'django_redis.cache.RedisCache', 'LOCATION': 'redis://redis:6379/1'},
}

# Celery results via Redis, not DB
CELERY_RESULT_BACKEND = 'redis://redis:6379/1'
```

**Every business model** inherits `TenantMixin` + `TimestampMixin`:
- Lead, Deal, Organization, Contact, Product, Task, Note, CallLog, Comment, Notification
- ViewSettings, FieldsLayout, FormScript, CRMSettings, Holiday, etc.
- Status models (LeadStatus, DealStatus, etc.) — also per-tenant so each company can customize

**Indexes**: Composite index on `(company_id, <primary_lookup_field>)` for all major models

---

## Project Structure

```
/opt/frappe_docker/precept/
├── docker-compose.yml
├── .env.example
├── Makefile
│
├── backend/
│   ├── config/                    # Django settings, urls, celery, asgi
│   │   ├── settings/{base,dev,prod,test}.py
│   │   ├── urls.py                # Mounts Ninja API at /api/
│   │   ├── celery.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── core/                  # User model, auth, permissions, mixins
│   │   ├── crm/                   # Lead, Deal, Organization, Contact, Product, Status models
│   │   ├── communication/         # Task, Note, CallLog, Comment, Notification
│   │   ├── dashboard/             # Analytics service + API
│   │   ├── views/                 # ViewSettings, FieldsLayout, FormScript, DropdownItem
│   │   ├── integrations/          # Twilio, Exotel, WhatsApp, Facebook sync, ERPNext
│   │   ├── settings/              # CRMSettings (singleton), Invitation, Holiday
│   │   └── realtime/              # Django Channels consumers
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── (auth)/login/
│   │   │   └── (dashboard)/       # Layout shell (sidebar + header)
│   │   │       ├── leads/         # page.tsx + [id]/page.tsx
│   │   │       ├── deals/
│   │   │       ├── contacts/
│   │   │       ├── organizations/
│   │   │       ├── tasks/, notes/, call-logs/, calendar/
│   │   │       ├── dashboard/
│   │   │       ├── data-import/
│   │   │       └── settings/
│   │   ├── components/            # ui/, layout/, views/, activities/, dashboard/, telephony/, modals/
│   │   ├── lib/api/               # API client (fetch + JWT), per-entity API modules
│   │   ├── hooks/                 # useLeads, useDeals, useAuth, useWebSocket, etc.
│   │   ├── stores/                # Zustand: auth, views, notifications, global
│   │   └── types/                 # TypeScript interfaces
│   └── tailwind.config.js
│
└── nginx/nginx.conf
```

---

## Django Models (39 DocTypes → ~30 Django models)

### Core Mixins (`apps/core/models/mixins.py`)
- **TenantMixin** — `company` FK (every business model), auto-scoped via TenantManager
- **TimestampMixin** — `created_at`, `updated_at`, `created_by`, `modified_by`
- **NamingSeriesMixin** — Auto-generated `reference_id` (e.g., `CRM-LEAD-2026-00001`)

### Primary Entities (`apps/crm/models/`)

**Lead** — Person fields (name, email, phone, job_title), organization (text), classification FKs (status→LeadStatus, source, industry, territory), SLA fields (sla, sla_status, response_by, first/last_response_time), products (reverse FK), facebook_lead_id, lost_reason
> Reference: `/opt/frappe_docker/crm/fcrm/doctype/crm_lead/crm_lead.py`

**Deal** — Organization FK, status→DealStatus, financial fields (deal_value, probability, currency, exchange_rate), expected_closure_date, contacts M2M (via DealContact through model), lead FK (optional), SLA fields, products
> Reference: `/opt/frappe_docker/crm/fcrm/doctype/crm_deal/crm_deal.py`

**Organization** — name, website, logo, employees, revenue, industry, territory, address (JSONB)

**Contact** — first/last name, email, mobile, phone, company, designation, image

**DealContact** — Through model: deal FK, contact FK, is_primary boolean

### Status & Classification (`apps/crm/models/status.py`, `classification.py`)
- **LeadStatus** — name, type (Open/Ongoing/Won/Lost), color, position
- **DealStatus** — name, type, color, position, probability%
- **CommunicationStatus**, **LostReason**, **LeadSource**, **Industry**, **Territory**

### Products (`apps/crm/models/product.py`)
- **Product** — code, name, rate, description
- **LeadProduct** / **DealProduct** — FK to parent, product FK, qty, rate, discount, amount

### SLA (`apps/crm/models/sla.py`)
- **ServiceLevelAgreement** — name, apply_on (Lead/Deal), condition (JSONB), holiday_list FK
- **SLAPriority** — sla FK, priority, response_time (Duration)
- **ServiceDay** — sla FK, day, start/end time

### Communication (`apps/communication/models/`)
- **Task** — title, description, priority, status, assigned_to, due_date, GenericFK (lead/deal)
- **Note** — title, content (rich text), GenericFK
- **CallLog** — call_id, caller/receiver numbers, status, type, duration, recording_url, telephony_medium
- **Comment** — content (HTML), GenericFK, with @mention extraction
- **Notification** — type (Mention/Task/Assignment/WhatsApp), from/to user, read, GenericFK
- **StatusChangeLog** — GenericFK, from/to status, timestamp

### Views & Settings (`apps/views/`, `apps/settings/`)
- **ViewSettings** — label, user FK, type (list/kanban/group_by), entity_type, filters/columns/order (JSONB)
- **FieldsLayout**, **FormScript**, **DropdownItem**
- **CRMSettings** (singleton) — branding, currency, forecasting toggle
- **Invitation**, **Holiday**, **HolidayList**

### Integrations (`apps/integrations/models/`)
- **TwilioSettings**, **ExotelSettings**, **TelephonyAgent**, **TelephonyPhone**
- **ERPNextSettings**, **HelpdeskSettings**

---

## API Architecture (Django Ninja)

### Router Structure (`config/urls.py`)
```
/api/auth/       → core_router     (login, register, session, users)
/api/crm/        → crm_router      (leads, deals, organizations, contacts, products)
/api/comm/       → comm_router     (activities, comments, notifications, tasks, notes)
/api/dashboard/  → dashboard_router (KPIs, charts)
/api/views/      → views_router    (custom views CRUD)
/api/integrations/ → integrations_router (twilio, exotel, whatsapp, facebook sync)
/api/settings/   → settings_router (global settings, invitations, onboarding)
/api/docs        → Auto-generated OpenAPI (Swagger)
```

### Key Endpoint Mapping (Frappe → Django Ninja)

| Frappe Source | Django Ninja Endpoint | Purpose |
|---|---|---|
| `api/doc.py:get_data()` | `GET /api/crm/leads/`, `GET /api/crm/deals/` | List with filter/sort/paginate, supports list+kanban+group_by |
| `crm_lead.py:convert_to_deal()` | `POST /api/crm/leads/{id}/convert` | Lead-to-deal conversion |
| `api/activities.py` | `GET /api/comm/activities/{entity}/{id}` | Unified activity timeline |
| `api/dashboard.py` | `GET /api/dashboard/`, `GET /api/dashboard/charts/{chart}` | 15+ chart/KPI endpoints |
| `api/comment.py:add_comment()` | `POST /api/comm/comments/` | Comment with @mention detection |
| `api/views.py` | `CRUD /api/views/` | Custom view management |
| `api/whatsapp.py` | `/api/integrations/whatsapp/*` | WhatsApp messaging |
| `integrations/twilio/api.py` | `/api/integrations/twilio/*` | Voice token, call management |
| `integrations/exotel/handler.py` | `/api/integrations/exotel/webhook` | Exotel webhooks |

---

## Background Jobs (Celery Beat)

Mapped from `hooks.py` scheduler_events:

| Frappe Frequency | Celery Schedule | Task |
|---|---|---|
| `all` (every minute) | `60.0` | `trigger_offset_event_notifications` |
| `hourly` | `crontab(minute=0)` | `trigger_hourly_event_notifications` |
| `daily` | `crontab(hour=0)` | `trigger_daily_event_notifications` |
| `weekly` | `crontab(dow=1)` | `trigger_weekly_event_notifications` |
| `cron */5, */10, */15` | Matching crontabs | `sync_leads_from_sources(frequency)` |
| `hourly_long`, `daily_long`, `monthly_long` | Matching crontabs | Lead sync long-running tasks |

---

## Real-time (Django Channels)

- **CRMConsumer** WebSocket consumer — user joins `user_{id}` group + `crm_updates` broadcast group
- Replaces `frappe.publish_realtime('refetch_resource')` → sends `crm_update` event
- Replaces `frappe.publish_realtime('whatsapp_message')` → sends `whatsapp_message` event
- Frontend: TanStack Query cache invalidation on WebSocket events

---

## Docker Compose (Development)

```
Services:
  postgres:16       → port 5432
  redis:7-alpine    → port 6379
  backend (Django)  → port 8000 (runserver)
  celery-worker     → background tasks
  celery-beat       → periodic scheduler
  channels (Daphne) → port 8001 (WebSocket)
  frontend (Next.js)→ port 3000 (dev server)
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Django project scaffold + Docker Compose + PostgreSQL (precept + infra schemas)
- **Multi-tenancy foundation**: Company model, TenantMixin, TenantManager, tenant middleware, DB router
- Core models: User, Company, Lead, Deal, Organization, Contact + status/classification models (all with `company_id`)
- JWT auth (login, register, session) with company claim in token
- Redis-backed sessions (db=1) and Celery result backend (db=1)
- CRUD APIs for leads, deals, organizations, contacts (list with filter/sort/paginate, auto-scoped by tenant)
- Next.js scaffold: auth flow, layout shell (sidebar + header), login page
- Lead list (table view), Lead detail, Deal list, Deal detail pages
- Seed data: default statuses, sources (per-company)

### Phase 2: Views & Filtering (Weeks 4-5)
- ViewSettings model + CRUD API
- Kanban view with @dnd-kit drag-drop
- Group By view (aggregation)
- Advanced filter builder (nested AND/OR)
- Column customization per view
- Save/load custom views (pinned, default, public/private)

### Phase 3: Communication Hub (Weeks 6-8)
- Activity timeline (merges versions, comments, emails, calls, notes, tasks)
- Comment system with @mention detection (BeautifulSoup HTML parsing)
- Notes CRUD with TipTap rich text editor
- Tasks CRUD with assignment + notifications
- Email composition with TipTap
- Notification system (Mention, Task, Assignment types)
- Status change logging
- File attachments

### Phase 4: SLA & Products (Weeks 9-10)
- SLA model with priorities, working hours, holidays
- SLA engine (condition evaluation, response time tracking)
- Product catalog + Lead/Deal line items
- Lead-to-Deal conversion workflow
- Rolling response times

### Phase 5: Dashboard & Analytics (Weeks 11-12)
- Dashboard layout (configurable grid)
- Number cards: Total Leads, Ongoing Deals, Won Deals, Avg Deal Value
- Line/Bar/Donut charts (15+ chart types from `dashboard.py`)
- Date range filtering with period comparison
- Role-based data scoping

### Phase 6: Real-time & Notifications (Week 13)
- Django Channels + Redis channel layer
- WebSocket consumer + Next.js client
- Real-time document updates + notification bell
- Event notifications via Celery Beat

### Phase 7: Integrations (Weeks 14-17)
- Twilio: settings, VoIP, call logs, recordings, Voice SDK frontend
- Exotel: settings, webhooks, agent routing
- WhatsApp: send/receive, templates, reactions
- Facebook: lead form syncing at configurable intervals
- ERPNext: customer creation on deal updates

### Phase 8: Polish & Mobile (Weeks 18-20)
- Responsive mobile layouts (< 768px)
- PWA (manifest, service worker)
- Calendar view (FullCalendar)
- Data import tool (CSV/Excel)
- i18n support
- Form scripts + fields layout editor
- Keyboard shortcuts

---

## Key Reference Files (Frappe CRM)

| File | What to reference |
|------|-------------------|
| `crm/fcrm/doctype/crm_lead/crm_lead.py` | Lead business logic, validation, SLA, conversion |
| `crm/fcrm/doctype/crm_deal/crm_deal.py` | Deal business logic, contact sync, probability |
| `crm/api/doc.py` | Core data retrieval: list/kanban/group_by views, filtering engine |
| `crm/api/dashboard.py` | 15+ analytics queries (aggregations, CASE, period comparisons) |
| `crm/api/activities.py` | Activity timeline assembly (versions + comments + calls + notes) |
| `crm/hooks.py` | All lifecycle hooks, scheduler jobs, doctype overrides |
| `frontend/src/router.js` | Routing architecture, view type resolution, mobile detection |
| `frontend/src/pages/Leads.vue` | List page pattern (filter bar + multi-view + selection) |
| `frontend/src/components/Activities/Activities.vue` | Communication hub UI (27KB, tab-based) |
| `crm/integrations/twilio/twilio_handler.py` | Twilio webhook handling, call log creation |

---

## Verification

1. **Backend**: `pytest` with factory-boy fixtures, test CRUD + filtering + SLA + conversion
2. **Frontend**: Playwright E2E tests for critical flows (login → create lead → convert to deal)
3. **API docs**: Visit `/api/docs` for auto-generated Swagger UI
4. **Real-time**: Open two browser tabs, create a lead in one, verify it appears in the other
5. **Docker**: `docker compose up` should bring up all services and be accessible at `localhost:3000`

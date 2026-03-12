# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Precept is a multi-tenant CRM built with Django 5.1 + Django Ninja (backend) and Next.js 14 App Router (frontend). It runs in Docker with PostgreSQL, Redis, Celery, and Daphne (WebSockets). Production domain: `precept.online`.

## Common Commands

### Development (Docker)
```bash
make up              # Start dev stack (docker compose up -d)
make down            # Stop dev stack
make build           # Build dev images
make logs            # Follow all container logs
make migrate         # Run Django migrations
make seed            # Seed test data (seed_data management command)
make test            # Run pytest in backend container
make shell           # Django shell in backend container
```

Note: The dev backend container auto-runs `create_schemas`, `makemigrations`, and `migrate` on startup — you rarely need `make migrate` separately during development.

### Running a Single Test
```bash
docker compose exec backend pytest apps/crm/tests/test_leads.py -v
docker compose exec backend pytest -k "test_name" -v
```

### Linting
```bash
# Backend (ruff) — configured in backend/pyproject.toml
cd backend && ruff check .
cd backend && ruff format .

# Frontend (ESLint via Next.js)
cd frontend && npm run lint
```

### Production
```bash
make prod-build      # Build production images (multi-stage Dockerfiles)
make prod-up         # Start production stack
make prod-down       # Stop production stack
make reload-front    # Rebuild and restart frontend only
make reload-back     # Rebuild and restart backend + channels
make rebuild-all     # Full teardown with volumes + rebuild (destructive)
```

### Local Development (without Docker)
```bash
cd frontend && npm run dev      # Next.js dev server (port 3000)
cd backend && python manage.py runserver  # Django dev server (port 8000)
```

## Architecture

### Backend (`backend/`)

**Framework**: Django 5.1 + Django Ninja 1.3 (REST API with auto OpenAPI docs at `/api/docs`)

**Django Apps** (`backend/apps/`):
- `core` — Company, User models, authentication (JWT via ninja_jwt), data import, translations
- `crm` — Lead, Contact, Deal, Organization, Product, Classification, Status, SLA
- `communication` — Activities, Comments, Events, Tasks, Notes, Notifications
- `dashboard` — Analytics queries
- `views` — Custom CRM views and kanban states
- `integrations` — WhatsApp, Twilio, Exotel, Email (SMTP/IMAP), Facebook Lead Ads
- `settings` — CRM settings, field layouts, form scripts
- `realtime` — WebSocket consumers (Django Channels)

**API Routes** (`backend/config/urls.py`):
- `/api/auth/` — JWT login, token refresh, user profile, company management, first-time setup
- `/api/crm/` — Leads, contacts, deals, organizations, products
- `/api/comm/` — Activities, comments, events, tasks, notes
- `/api/dashboard/` — Dashboard metrics
- `/api/views/` — Custom views
- `/api/integrations/` — Integration settings and webhooks
- `/api/settings/` — CRM settings
- `/api/health/` — Health check
- `/ws/crm/` — WebSocket endpoint (via Daphne ASGI on port 8001)

**Configuration**: `backend/config/settings/` with `base.py`, `development.py`, `production.py`, `test.py`

### Multi-Tenancy

Row-level isolation using `company_id` on all business models. Key pieces:

- **`TenantMixin`** (`apps/core/models/mixins.py`) — adds `company` ForeignKey to models, sets `TenantManager` as default manager
- **`TenantManager`** — auto-filters querysets by current company from `_tenant_context` (Python contextvars). Use the `.unscoped` manager to bypass tenant filtering (needed for data import, seeding, cross-tenant queries)
- **`TimestampMixin`** — adds `created_at`, `updated_at`, `created_by`, `modified_by`
- **`NamingSeriesMixin`** — auto-generates `reference_id` on first save in format `{PREFIX}-{YEAR}-{SEQUENCE:05d}` (e.g., `CRM-LEAD-2026-00001`). Each model sets `NAMING_PREFIX`
- **`TenantMiddleware`** (`apps/core/middleware/tenant.py`) — resolves company from JWT claims, sets `_tenant_context`. Skips `/admin/` and `/api/auth/` paths
- **`PreceptDBRouter`** (`config/db_router.py`) — routes `auth`, `contenttypes`, `sessions`, `django_celery_beat` to the `infra` PostgreSQL schema; everything else to `default` (precept schema)

### Frontend (`frontend/`)

**Framework**: Next.js 14 App Router with TypeScript (strict mode)

**Route Groups**:
- `src/app/(auth)/` — Login/setup pages (unauthenticated)
- `src/app/(dashboard)/` — All authenticated pages

**Key Patterns**:
- `src/lib/api/client.ts` — HTTP client with auto token refresh on 401, Bearer auth injection. Base URL from `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8000/api`)
- `src/lib/api/*.ts` — Typed API modules per entity (e.g., `leadsApi.list()`, `leadsApi.create()`)
- `src/types/*.ts` — TypeScript interfaces for all entities. `PaginatedResponse<T>` has `{ results: T[], total, page, page_size }`
- `src/stores/` — Zustand stores: `authStore` (JWT + user state), `viewStore` (list/kanban/group-by view state with per-entity column defaults), `notificationStore`, `i18nStore`
- `src/hooks/` — 25+ hooks including `useAuth()`, `useWebSocket()` (auto-reconnect with exponential backoff, invalidates React Query on entity updates), `useLeads()`, `useDeals()`, etc.
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)

**Path alias**: `@/*` maps to `./src/*`

**State management**: Zustand for client state, TanStack React Query for server state (60s staleTime default).

**Styling**: Tailwind CSS with HSL CSS variable color system (light/dark mode via `next-themes`), Shadcn/ui components (Radix UI primitives), Plus Jakarta Sans font. Brand primary: violet `#7e3bed`.

### Infrastructure

- **PostgreSQL 16**: Two schemas — `precept` (business data) and `infra` (Django internals). Initialized via `docker/init-db.sql`
- **Redis 7**: db=0 cache, db=1 sessions + Celery results, db=2 Celery broker
- **Celery 5.4**: Background tasks with django-celery-beat. Beat schedules include event notifications and integration syncs (WhatsApp, Twilio, Email, Facebook)
- **Daphne**: ASGI server for WebSocket on port 8001. `CRMConsumer` joins `user_{id}` and `crm_updates` channel groups
- **Postfix**: Email relay with DKIM support
- **Nginx**: Host-level reverse proxy (not in Docker) at `/etc/nginx/sites-available/precept`. Handles SSL termination for `precept.online`

### Docker Setup

- `docker-compose.yml` — Development: hot-reload via volume mounts, ports exposed on `0.0.0.0`
- `docker-compose.prod.yml` — Production: multi-stage builds, ports bound to `127.0.0.1` only, `precept-net` bridge network, health checks with start periods
- Frontend `NEXT_PUBLIC_*` env vars are baked at build time via Docker build args

## Backend Conventions

- Python 3.12+, ruff for linting (line-length 110, rules: F, E, W, I, UP, B, RUF)
- pytest with `config.settings.test` (uses `precept_test` DB, MD5 hasher, eager Celery)
- Django Ninja routers live in `apps/<app>/api/router.py`
- JWT auth: 12-hour access tokens, 7-day refresh tokens. `company_id` embedded in JWT claims
- User model is email-based (no username field), custom `UserManager`
- **Route ordering**: In Django Ninja, literal path endpoints (`/kanban`, `/group-by`, `/bulk-delete`) must be defined **before** parameterized routes (`/{id}`) to avoid 422 errors

## Frontend Conventions

- TypeScript strict mode, ESLint via `next lint`
- Next.js standalone output mode (optimized for Docker)
- All paginated API responses use `results` field (not entity-specific names)
- WebSocket URL from `NEXT_PUBLIC_WS_URL` env var (defaults to `ws://localhost:8001/ws/crm/`)
- `next dev` does not type-check — run `next build` to catch TypeScript errors

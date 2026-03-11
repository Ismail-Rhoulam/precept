# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Precept is a multi-tenant CRM built with Django 5.1 + Django Ninja (backend) and Next.js 14 App Router (frontend). It runs in Docker with PostgreSQL, Redis, Celery, and Daphne (WebSockets).

## Common Commands

### Development (Docker)
```bash
make up              # Start dev stack (docker compose up -d)
make down            # Stop dev stack
make build           # Build dev images
make logs            # Follow all container logs
make migrate         # Run Django migrations (infra + default DBs)
make seed            # Seed test data
make test            # Run pytest in backend container
make shell           # Django shell in backend container
```

### Local Development (without Docker)
```bash
cd frontend && npm run dev      # Next.js dev server (port 3000)
cd backend && python manage.py runserver  # Django dev server (port 8000)
```

### Production
```bash
make prod-build      # Build production images
make prod-up         # Start production stack
make prod-down       # Stop production stack
make reload-front    # Rebuild and restart frontend only
make reload-back     # Rebuild and restart backend + channels
make rebuild-all     # Full teardown with volumes + rebuild
```

### Linting
```bash
# Backend (ruff) — configured in backend/pyproject.toml
cd backend && ruff check .
cd backend && ruff format .

# Frontend (ESLint)
cd frontend && npm run lint
```

### Running a Single Test
```bash
docker compose exec backend pytest apps/crm/tests/test_leads.py -v
docker compose exec backend pytest -k "test_name" -v
```

## Architecture

### Backend (`backend/`)

**Framework**: Django 5.1 + Django Ninja 1.3 (REST API with auto OpenAPI docs at `/api/docs`)

**Django Apps** (`backend/apps/`):
- `core` — Company, User models, authentication, data import, translations
- `crm` — Lead, Contact, Deal, Organization, Product, Classification, Status, SLA
- `communication` — Activities, Comments, Events, Tasks, Notes, Notifications
- `dashboard` — Analytics queries
- `views` — Custom CRM views and kanban states
- `integrations` — WhatsApp, Twilio, Exotel, Email (SMTP/IMAP), Facebook Lead Ads
- `settings` — CRM settings, field layouts, form scripts
- `realtime` — WebSocket consumers (Django Channels)

**API Routes** (`backend/config/urls.py`):
- `/api/auth/` — JWT login, token refresh, user profile
- `/api/crm/` — Leads, contacts, deals, organizations, products
- `/api/comm/` — Activities, comments, events, tasks, notes
- `/api/dashboard/` — Dashboard metrics
- `/api/views/` — Custom views
- `/api/integrations/` — Integration settings and webhooks
- `/api/settings/` — CRM settings
- `/api/health/` — Health check
- `/ws/` — WebSocket (via Daphne ASGI on port 8001)

**Configuration**: `backend/config/settings/` with `base.py`, `development.py`, `production.py`, `test.py`

### Multi-Tenancy

Row-level isolation using `company_id` on all business models. Key pieces:
- `TenantMixin` — adds `company_id` ForeignKey to models
- `TenantManager` — auto-filters queries by current company from middleware context
- `TenantMiddleware` — resolves company from JWT claims
- `PreceptDBRouter` (`config/db_router.py`) — routes `auth`, `contenttypes`, `sessions`, `django_celery_beat` to the `infra` PostgreSQL schema; everything else to `default` (precept schema)

Migrations must run on both databases: `--database=infra` then `--database=default` (the `make migrate` target handles this).

### Frontend (`frontend/`)

**Framework**: Next.js 14 App Router with TypeScript (strict mode)

**Route Groups**:
- `src/app/(auth)/` — Login/register pages
- `src/app/(dashboard)/` — All authenticated pages (leads, deals, contacts, organizations, calendar, tasks, notes, settings)

**Key Directories**:
- `src/components/` — Feature-organized components (chat, email, telephony, calendar, dashboard, activities)
- `src/components/ui/` — Shadcn/ui + custom components (Radix UI primitives)
- `src/hooks/` — Custom hooks (useAuth, useWebSocket, useKanban, useIntegrations, etc.)
- `src/stores/` — Zustand stores (authStore, viewStore, notificationStore, i18nStore)
- `src/lib/api/` — HTTP client (`client.ts`) + typed API endpoint modules
- `src/types/` — TypeScript interfaces for API responses

**Path alias**: `@/*` maps to `./src/*`

**State management**: Zustand for client state, TanStack React Query for server state cache.

### Infrastructure

- **PostgreSQL 16**: Two schemas (`precept` for business data, `infra` for Django internals)
- **Redis 7**: Caching, sessions (db=1), Celery broker and result backend
- **Celery 5.4**: Background tasks with django-celery-beat for scheduling
- **Daphne**: ASGI server for WebSocket connections (port 8001)
- **Postfix**: Email relay for outbound transactional email

## Backend Conventions

- Python 3.12+, ruff for linting (line-length 110, rules: F, E, W, I, UP, B, RUF)
- pytest with `config.settings.test` (uses `precept_test` DB, MD5 hasher, eager Celery)
- Django Ninja routers live in `apps/<app>/api/router.py`
- JWT authentication via `ninja_jwt` on all API endpoints by default

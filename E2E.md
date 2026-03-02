# E2E Test Report — Precept ERP API

**Date:** 2026-03-02
**Environment:** Production (precept.online)
**Result:** 62/62 endpoints passing

---

## What Was Done

A comprehensive end-to-end test was run against all 62 API endpoints across 20 categories. The test covered the full CRUD lifecycle for every entity, plus dashboards, integrations, views, and lead-to-deal conversion.

### Test Coverage

| # | Category | Endpoints Tested | Result |
|---|----------|-----------------|--------|
| 1 | Auth (me, companies) | 2 | Pass |
| 2 | Settings (get, update) | 2 | Pass |
| 3 | Leads (CRUD, kanban, group-by) | 6 | Pass |
| 4 | Contacts (CRUD) | 4 | Pass |
| 5 | Organizations (CRUD) | 4 | Pass |
| 6 | Deals (CRUD, kanban, group-by) | 6 | Pass |
| 7 | Products (CRUD) | 3 | Pass |
| 8 | Lead Products (add, list) | 2 | Pass |
| 9 | SLA (list) | 1 | Pass |
| 10 | Tasks (CRUD, linked entity) | 5 | Pass |
| 11 | Notes (create, list) | 2 | Pass |
| 12 | Comments (create, list) | 2 | Pass |
| 13 | Events (CRUD) | 3 | Pass |
| 14 | Call Logs & Notifications | 2 | Pass |
| 15 | Activities (lead, deal) | 2 | Pass |
| 16 | Views (settings, layout, scripts) | 4 | Pass |
| 17 | Dashboard (full, number cards) | 2 | Pass |
| 18 | Integrations (twilio, exotel, whatsapp, telephony, facebook) | 6 | Pass |
| 19 | Lead Conversion | 1 | Pass |
| 20 | Delete (cleanup) | 3 | Pass |

---

## Bugs Found & Fixed

### 1. `createsuperuser` crash — missing UserManager

**Symptom:** `TypeError: UserManager.create_superuser() missing 1 required positional argument: 'username'`

**Root cause:** The custom `User` model sets `username = None` and `USERNAME_FIELD = "email"` but inherits `AbstractUser` which ships with a `UserManager` whose `create_superuser(username, ...)` signature requires a `username` argument.

**Fix:** Added a custom `UserManager` extending `BaseUserManager` with `create_user(email, ...)` and `create_superuser(email, ...)` signatures.

**File:** `apps/core/models/user.py`

---

### 2. Tenant resolution failure — superuser without company

**Symptom:** Every tenant-scoped endpoint returned 500 (IntegrityError) or "An error occurred" because `request.company` was `None`.

**Root cause:** The superuser was created via `createsuperuser` which doesn't set a `company`. The JWT token issued at login had no `company_id` claim. The `TenantMiddleware` only resolved company from the JWT claim, so `request.company` stayed `None`. All tenant endpoints then crashed on `get_or_create(company=None)` against a non-nullable FK.

**Fix (two parts):**
1. **Middleware fallback** — When the JWT lacks a `company_id` claim, the middleware now decodes `user_id` from the token and looks up the user's current company from the database. This handles tokens issued before a company was assigned.
2. **Company management endpoints** — Added `GET/POST /api/auth/companies/` and `POST /api/auth/companies/{id}/switch/` so superusers can create and switch companies from the frontend without needing shell access.
3. **Guard on settings** — The settings endpoint now returns a clear 400 error instead of crashing when `request.company` is `None`.

**Files:** `apps/core/middleware/tenant.py`, `apps/core/api/router.py`, `apps/core/api/schemas.py`, `apps/settings/api/router.py`

---

### 3. Dashboard 500 — mixed field types in aggregation

**Symptom:** `GET /api/dashboard/` returned 500.

**Root cause:** `FieldError: Expression contains mixed types: DecimalField, FloatField. You must set output_field.` — The `deal_value` column is a `DecimalField`, but `Coalesce(Avg("deal_value"), 0.0)` uses a Python `float` as the default. Django cannot resolve the output type when mixing `Decimal` and `float`.

**Fix:** Added `output_field=FloatField()` to all 10 `Coalesce` expressions in the dashboard module.

**File:** `apps/dashboard/api/router.py`

---

### 4. Route conflict — kanban/group-by matched by `{deal_id}`

**Symptom:** `GET /api/crm/deals/kanban` and `GET /api/crm/deals/group-by` returned 422 with "Input should be a valid integer, unable to parse string as an integer".

**Root cause:** In both `leads.py` and `deals.py`, the `/{id}` route was defined **before** `/kanban` and `/group-by`. Django Ninja processes routes in definition order, so it tried to parse `"kanban"` as an integer `deal_id` parameter.

**Fix:** Moved all literal path endpoints (`/bulk-delete`, `/kanban`, `/group-by`) before the `/{id}` parameterized route in both files.

**Files:** `apps/crm/api/leads.py`, `apps/crm/api/deals.py`

---

### 5. Container ports exposed to internet

**Symptom:** Ports 8000 (backend), 8001 (channels), and 3000 (frontend) were bound to `0.0.0.0` on the host, making them directly accessible from the internet and bypassing nginx/SSL.

**Fix:** Changed port mappings to bind to `127.0.0.1` only, so only the server-level nginx can reach them.

**File:** `docker-compose.prod.yml`

---

## Recommendations

### High Priority

1. **Seed data on first startup** — Lead/deal statuses are required to create leads and deals, but the database starts empty. Add a `post_migrate` signal or management command (`create_default_statuses`) that seeds default statuses, sources, industries, and territories when a new company is created. Without this, the frontend will fail on a fresh deployment until someone manually creates statuses.

2. **Error responses for missing tenant** — Only the settings endpoint currently guards against `request.company = None`. Every other tenant-scoped endpoint (leads, deals, tasks, etc.) will crash with an unhandled `IntegrityError` if a user somehow has no company. Consider adding a global middleware check that returns a structured 400 response for any non-auth endpoint when `request.company` is `None`.

3. **Access logging** — Gunicorn with `gthread` workers doesn't log individual requests by default. Add `--access-logfile -` to the gunicorn command so request logs appear in `docker compose logs`. This is critical for debugging production issues.

### Medium Priority

4. **Token refresh should update company_id** — The `/api/auth/token/refresh` endpoint carries forward the `company_id` from the old token. If a superuser switches companies, old refresh tokens still point to the previous company. Consider always looking up the user's current `company_id` from the database during refresh.

5. **Role-based access control** — Currently all authenticated users can access all endpoints. The `User.role` field (admin, manager, sales_user, sales_agent) exists but isn't enforced anywhere. Add permission decorators or a middleware that checks role before allowing write operations.

6. **Celery beat is crash-looping** — During testing, `precept-celery-beat-1` was in a restart loop. This should be investigated (likely a missing or misconfigured periodic task schedule).

### Low Priority

7. **Product schema inconsistency** — `LeadProductCreate` requires `product_name` as a string but also accepts `product_id` as optional. If a product already exists, the user shouldn't need to re-type the name. Consider auto-populating `product_name` from the `Product` record when `product_id` is provided.

8. **Pagination consistency** — List endpoints return `{"results": [...], "total": N, "page": N, "page_size": N}` but don't include `total_pages` or `has_next`. Adding these would make frontend pagination simpler.

9. **API versioning** — The API is currently unversioned (`/api/`). As this grows into a full ERP, consider versioning (`/api/v1/`) early to avoid breaking changes.

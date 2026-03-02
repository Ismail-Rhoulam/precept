# Precept CRM — Milestones

Track of every completed task during the build of Precept CRM.

---

## Phase 1: Foundation

### Backend Scaffold
- [x] Created Django project structure at `backend/` with `config/` package
- [x] Created `pyproject.toml` with all dependencies (Django 5.1, Django Ninja 1.3, django-ninja-jwt, psycopg, django-redis, celery, channels, django-cors-headers, Pillow, beautifulsoup4, phonenumbers, twilio, gunicorn)
- [x] Created `manage.py` with `DJANGO_SETTINGS_MODULE=config.settings.development`
- [x] Created settings split: `base.py`, `development.py`, `production.py`, `test.py`
- [x] Configured dual PostgreSQL databases (`default` → precept schema, `infra` → infra schema)
- [x] Configured Redis caches (db=0 default, db=1 sessions) and Redis-backed sessions
- [x] Configured Celery broker (db=2) and result backend (db=1)
- [x] Created `config/db_router.py` — routes admin/auth/contenttypes/sessions/celery_beat to `infra` db
- [x] Created `config/urls.py` — NinjaAPI at `/api/` with JWTAuth, mounts auth + crm routers
- [x] Created `config/celery.py` — beat_schedule with all Frappe scheduler events mapped
- [x] Created `config/asgi.py` — ProtocolTypeRouter for HTTP + WebSocket with JWTAuthMiddleware
- [x] Created `config/wsgi.py` — standard WSGI application

### Core App (`apps/core/`)
- [x] Created `models/mixins.py` — TenantMixin (company FK + TenantManager with contextvars), TimestampMixin, NamingSeriesMixin
- [x] Created `models/user.py` — Custom User model (email-based auth, role choices: ADMIN/MANAGER/SALES_USER/SALES_AGENT)
- [x] Created `models/company.py` — Tenant model (name, slug, is_active)
- [x] Created `middleware/tenant.py` — Resolves company from JWT, sets request.company + ContextVar
- [x] Created `api/router.py` — Auth endpoints: POST /login, POST /register, GET /me, POST /token/refresh
- [x] Created `api/schemas.py` — LoginIn, TokenOut, RegisterIn, UserOut
- [x] Created `management/commands/create_schemas.py` — Creates precept + infra PostgreSQL schemas
- [x] Created `management/commands/seed_data.py` — Seeds demo company, admin user, statuses, sources, industries
- [x] Created `admin.py` and `apps.py`

### CRM App Models (`apps/crm/models/`)
- [x] Created `status.py` — LeadStatus, DealStatus (with probability), CommunicationStatus, LostReason
- [x] Created `classification.py` — LeadSource, Industry, Territory (self-referential)
- [x] Created `lead.py` — Lead model (TenantMixin + TimestampMixin + NamingSeriesMixin, prefix="CRM-LEAD"), LeadProduct
- [x] Created `deal.py` — Deal model (prefix="CRM-DEAL"), DealContact through model, DealProduct
- [x] Created `organization.py` — Organization with JSONB address field
- [x] Created `contact.py` — Contact with auto-computed full_name
- [x] Created `product.py` — Product catalog model
- [x] Created `sla.py` — ServiceLevelAgreement, SLAPriority, ServiceDay
- [x] Created `admin.py` and `apps.py`

### CRM App API (`apps/crm/api/`)
- [x] Created `router.py` — Mounts sub-routers: /leads, /deals, /organizations, /contacts
- [x] Created `schemas/lead.py` — LeadOut, LeadCreate, LeadUpdate, LeadListFilter (FilterSchema)
- [x] Created `schemas/deal.py` — DealOut, DealCreate, DealUpdate, DealListFilter
- [x] Created `schemas/organization.py` — OrganizationOut, OrganizationCreate, OrganizationUpdate, OrganizationListFilter
- [x] Created `schemas/contact.py` — ContactOut, ContactCreate, ContactUpdate, ContactListFilter
- [x] Created `leads.py` — Full CRUD: list (filter/search/sort/paginate), detail, create, update, delete, bulk-delete
- [x] Created `deals.py` — Full CRUD with same pattern
- [x] Created `organizations.py` — Full CRUD with same pattern
- [x] Created `contacts.py` — Full CRUD with same pattern

### Communication App (`apps/communication/`)
- [x] Created `models/task.py` — Task with GenericFK (polymorphic Lead/Deal)
- [x] Created `models/note.py` — Note with GenericFK
- [x] Created `models/call_log.py` — CallLog with telephony fields
- [x] Created `models/comment.py` — Comment with @mention extraction
- [x] Created `models/notification.py` — Notification (Mention/Task/Assignment/WhatsApp types)
- [x] Created `models/status_change_log.py` — StatusChangeLog with GenericFK
- [x] Created `api/router.py` — stub router

### Supporting Apps
- [x] Created `apps/views/models/view_settings.py` — Per-user view config (list/kanban/group_by, JSONB filters/columns/order)
- [x] Created `apps/views/api/router.py` — stub router
- [x] Created `apps/settings/models/crm_settings.py` — Singleton CRMSettings per tenant
- [x] Created `apps/settings/models/holiday.py` — HolidayList + Holiday
- [x] Created `apps/settings/models/invitation.py` — Invitation model
- [x] Created `apps/settings/api/router.py` — stub router
- [x] Created `apps/dashboard/api/router.py` — stub router
- [x] Created `apps/integrations/api/router.py` — stub router

### Real-time App (`apps/realtime/`)
- [x] Created `consumers.py` — CRMConsumer WebSocket consumer (joins user + broadcast groups)
- [x] Created `middleware.py` — JWTAuthMiddleware for WebSocket auth
- [x] Created `routing.py` — WebSocket URL patterns

### Docker & DevOps
- [x] Created `docker-compose.yml` — 7 services: postgres, redis, backend, celery-worker, celery-beat, channels, frontend
- [x] Created `backend/Dockerfile` — Python 3.12-slim
- [x] Created `frontend/Dockerfile` — Node 20-alpine
- [x] Created `docker/init-db.sql` — Creates precept + infra schemas on DB init
- [x] Created `.env.example` — All environment variables documented
- [x] Created `Makefile` — up, down, build, logs, migrate, seed, shell, test commands

### Frontend Scaffold (Next.js + Tailwind + shadcn/ui)
- [x] Created `package.json` with dependencies (Next.js, React, TanStack Query, Zustand, Tailwind CSS)
- [x] Created `next.config.js`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`
- [x] Created `src/styles/globals.css` — Tailwind base styles
- [x] Created `src/app/layout.tsx` — Root layout
- [x] Created `src/app/page.tsx` — Root redirect
- [x] Created `src/app/providers.tsx` — QueryClientProvider wrapper
- [x] Created `src/app/(auth)/layout.tsx` + `login/page.tsx` — Auth layout and login page
- [x] Created `src/app/(dashboard)/layout.tsx` — Dashboard shell layout
- [x] Created `src/components/layout/Sidebar.tsx` — Navigation sidebar
- [x] Created `src/components/layout/Header.tsx` — Top header bar
- [x] Created `src/lib/api/client.ts` — Fetch client with JWT interceptor
- [x] Created `src/lib/api/auth.ts` — Auth API functions
- [x] Created `src/lib/api/leads.ts` — Leads API functions
- [x] Created `src/lib/api/deals.ts` — Deals API functions
- [x] Created `src/lib/utils.ts` — Utility functions
- [x] Created `src/stores/authStore.ts` — Zustand auth store
- [x] Created `src/hooks/useAuth.ts` — Auth hook with TanStack Query
- [x] Created `src/hooks/useLeads.ts` — Leads hook with TanStack Query
- [x] Created `src/hooks/useDeals.ts` — Deals hook with TanStack Query
- [x] Created `src/types/api.ts` — API response types
- [x] Created `src/types/lead.ts` — Lead TypeScript interfaces
- [x] Created `src/types/deal.ts` — Deal TypeScript interfaces
- [x] Created page stubs for directory structure

### Frontend — Full Pages (List + Detail)
- [x] Created `src/app/(dashboard)/leads/page.tsx` — Full leads list: debounced search, filter panel (status/source), sortable table (Lead Name, Email, Org, Status badge, Source, Owner, Created), pagination, inline "New Lead" form, loading/empty/error states
- [x] Created `src/app/(dashboard)/leads/[id]/page.tsx` — Lead detail: view/edit toggle, 2-column grid, editable fields, status/SLA badges, delete with confirmation, timestamps
- [x] Created `src/app/(dashboard)/deals/page.tsx` — Deals list: debounced search, sortable table (Ref ID, Deal Name, Org, Status badge, Deal Value formatted, Probability %, Owner, Created), inline creation form, pagination
- [x] Created `src/app/(dashboard)/deals/[id]/page.tsx` — Deal detail: view/edit toggle, 2-column grid, deal value + probability header, delete with confirmation modal, timestamps
- [x] Updated `src/types/deal.ts` — Aligned with backend DealOut schema (organization_name, status/status_color, deal_value, expected_closure_date, first_name/last_name/email/mobile_no)
- [x] Created `src/types/contact.ts` — Contact, ContactCreate, ContactListParams interfaces
- [x] Created `src/types/organization.ts` — Organization, OrganizationCreate, OrganizationListParams interfaces
- [x] Created `src/lib/api/contacts.ts` — Contacts API client (list, get, create, update, delete, bulkDelete)
- [x] Created `src/lib/api/organizations.ts` — Organizations API client (list, get, create, update, delete, bulkDelete)
- [x] Created `src/hooks/useContacts.ts` — TanStack Query hooks (useContacts, useContact, useCreateContact, useUpdateContact, useDeleteContact)
- [x] Created `src/hooks/useOrganizations.ts` — TanStack Query hooks (useOrganizations, useOrganization, useCreateOrganization, useUpdateOrganization, useDeleteOrganization)
- [x] Created `src/app/(dashboard)/contacts/page.tsx` — Contacts list: search, sortable table (Full Name, Email, Mobile, Company, Designation, Created), inline creation form, pagination
- [x] Created `src/app/(dashboard)/contacts/[id]/page.tsx` — Contact detail: view/edit toggle, 2-column grid, salutation/gender dropdowns, delete with confirmation
- [x] Created `src/app/(dashboard)/organizations/page.tsx` — Organizations list: search, sortable table (Name, Website links, Employees, Revenue formatted, Industry, Territory, Created), inline creation form
- [x] Created `src/app/(dashboard)/organizations/[id]/page.tsx` — Organization detail: view/edit toggle, 2-column grid, revenue formatting, website link

### Frontend — Stub Pages
- [x] Created `src/app/(dashboard)/dashboard/page.tsx` — Dashboard with 4 placeholder metric cards (Total Leads, Active Deals, Won Deals, Deal Value)
- [x] Created `src/app/(dashboard)/tasks/page.tsx` — Tasks stub
- [x] Created `src/app/(dashboard)/notes/page.tsx` — Notes stub
- [x] Created `src/app/(dashboard)/call-logs/page.tsx` — Call Logs stub
- [x] Created `src/app/(dashboard)/calendar/page.tsx` — Calendar stub
- [x] Created `src/app/(dashboard)/data-import/page.tsx` — Data Import stub
- [x] Created `src/app/(dashboard)/settings/page.tsx` — Settings stub

### Backend — API Router Wiring
- [x] Wired `apps.communication.api.router` → `/api/comm/` in `config/urls.py`
- [x] Wired `apps.dashboard.api.router` → `/api/dashboard/` in `config/urls.py`
- [x] Wired `apps.views.api.router` → `/api/views/` in `config/urls.py`
- [x] Wired `apps.integrations.api.router` → `/api/integrations/` in `config/urls.py`
- [x] Wired `apps.settings.api.router` → `/api/settings/` in `config/urls.py`

---

## Phase 2: Views & Filtering

### Backend — ViewSettings CRUD API
- [x] Created `apps/views/api/schemas.py` — ViewSettingsOut (with resolved user_email), ViewSettingsCreate, ViewSettingsUpdate schemas
- [x] Built `apps/views/api/router.py` — 8 endpoints: list (own+public, filtered by entity_type), get, create, update, delete, set-default, toggle-pin, toggle-public, upsert-standard
- [x] Set-default endpoint unsets existing defaults for same user+entity_type+type before setting new
- [x] Toggle-public clears user when public, restores user when private
- [x] Standard view upsert uses get_or_create for auto-saving user modifications

### Backend — Kanban & Group By Endpoints
- [x] Added `GET /api/crm/leads/kanban` — Groups leads by column_field (default: status), returns columns with color, count, and paginated items
- [x] Added `GET /api/crm/leads/group-by` — Aggregates leads by group_by_field using Django annotate(Count), returns groups + paginated results
- [x] Added `GET /api/crm/deals/kanban` — Same pattern for deals with DealStatus
- [x] Added `GET /api/crm/deals/group-by` — Same pattern for deals

### Frontend — Views Infrastructure
- [x] Created `src/types/view.ts` — ViewSettings, ViewSettingsCreate, ColumnDef, KanbanColumnDef, KanbanData, KanbanColumn, GroupByData, GroupByGroup, FilterCondition interfaces
- [x] Created `src/lib/api/views.ts` — Views API client (list, get, create, update, delete, setDefault, pin, togglePublic, createOrUpdateStandard)
- [x] Created `src/hooks/useViews.ts` — 9 TanStack Query hooks (useViews, useView, useCreateView, useUpdateView, useDeleteView, useSetDefaultView, usePinView, useTogglePublicView, useSaveStandardView)
- [x] Created `src/stores/viewStore.ts` — Zustand store for active view state (viewType, filters, orderBy, columns, groupByField, columnField) with default columns per entity type

### Frontend — View Control Components
- [x] Created `src/components/views/ViewControls.tsx` — Main toolbar: view type pills (List/Kanban/Group By), view name dropdown with actions (Set Default, Pin, Public, Duplicate, Delete), filter/sort/columns buttons with count badges, save view form
- [x] Created `src/components/views/FilterBuilder.tsx` — Advanced filter builder: per-row field/operator/value selectors, type-aware operators (text/number/select/boolean/date), entity-specific field definitions (Lead 11 fields, Deal 8 fields, Contact 7 fields, Organization 7 fields), clear all, active count badge
- [x] Created `src/components/views/SortControls.tsx` — Multi-field sort configuration: field selector, asc/desc toggle, add/remove sort fields, entity-specific sort fields
- [x] Created `src/components/views/ColumnSettings.tsx` — Column visibility/ordering: visible columns with grip handles, hidden columns list, show/hide toggle, reset to defaults, entity-specific available columns

### Frontend — Kanban & Group By Views
- [x] Created `src/hooks/useKanban.ts` — useLeadKanban, useDealKanban hooks with params for column_field, page_size, filters
- [x] Created `src/hooks/useGroupBy.ts` — useLeadGroupBy, useDealGroupBy hooks with params for group_by_field, filters
- [x] Created `src/components/views/KanbanBoard.tsx` — Generic Kanban board: HTML5 drag-and-drop between columns, visual drag/drop feedback (opacity + highlight border), collapsible columns, color-coded headers, loading skeleton, empty state
- [x] Created `src/components/views/KanbanCard.tsx` — LeadKanbanCard (name, email, org tag, source tag, owner avatar) + DealKanbanCard (name, org, deal value formatted, probability badge color-coded, close date, owner)
- [x] Created `src/components/views/GroupByView.tsx` — Accordion-style grouped view: collapsible sections, group headers with count badges, entity-specific row rendering (status badges, deal values), summary bar, loading/empty states

### Frontend — Page Integration
- [x] Updated `src/app/(dashboard)/leads/page.tsx` — Added view type tabs (List/Kanban/Group By), kanban column field selector, group-by field selector, integrated KanbanBoard+LeadKanbanCard and GroupByView components
- [x] Updated `src/app/(dashboard)/deals/page.tsx` — Same treatment: view type tabs, kanban/group-by views with DealKanbanCard, field selectors

## Phase 3: Communication Hub

### Backend — Communication API Schemas
- [x] Created `apps/communication/api/schemas.py` — 13 schemas: TaskOut/TaskCreate/TaskUpdate, NoteOut/NoteCreate/NoteUpdate, CommentOut/CommentCreate, CallLogOut/CallLogCreate/CallLogUpdate, NotificationOut, StatusChangeLogOut, ActivityOut (unified timeline entry)
- [x] All Out schemas use static resolvers for FK fields (assigned_to_name/email, comment_by_name/email, caller/receiver names, entity_type/entity_id from GenericFK)
- [x] CallLogOut resolves duration from timedelta to human-readable format (e.g., "5m 30s")

### Backend — Communication API Endpoints
- [x] Replaced `apps/communication/api/router.py` — Mounts 6 sub-routers: activities, comments, notes, tasks, notifications, call-logs
- [x] Created `apps/communication/api/activities.py` — `GET /api/comm/activities/{entity_type}/{entity_id}` unified timeline merging comments, notes, tasks, call_logs, status_change_logs sorted by created_at DESC
- [x] Created `apps/communication/api/comments.py` — List (by entity), Create (with @mention detection via BeautifulSoup HTML parsing for `<span data-type="mention">`), Delete. Auto-creates "Mention" Notifications for mentioned users (skips self-mentions)
- [x] Created `apps/communication/api/notes.py` — Full CRUD with optional entity filtering and pagination
- [x] Created `apps/communication/api/tasks.py` — Full CRUD with filters (status, priority, assigned_to_id, entity_type, entity_id), pagination. Auto-creates "Assignment" Notifications when task assigned or reassigned
- [x] Created `apps/communication/api/notifications.py` — List for current user, unread-count, mark-read (single), mark-all-read
- [x] Created `apps/communication/api/call_logs.py` — Full CRUD with auto-generated UUID call_id, duration_seconds to timedelta conversion

### Backend — Status Change Logging
- [x] Created `apps/communication/services/status_change.py` — Reusable `log_status_change(instance, old_status, new_status, user)` service function
- [x] Updated `apps/crm/api/leads.py` — Added status change detection in `update_lead` (captures old status before save, logs change after save)
- [x] Updated `apps/crm/api/deals.py` — Same status change logging in `update_deal`

### Frontend — Communication Types
- [x] Created `src/types/activity.ts` — Activity (unified timeline entry with activity_type discriminator), ActivitiesResponse
- [x] Created `src/types/task.ts` — Task, TaskCreate, TaskUpdate, TaskListParams with priority/status enums
- [x] Created `src/types/note.ts` — Note, NoteCreate, NoteUpdate
- [x] Created `src/types/comment.ts` — Comment, CommentCreate
- [x] Created `src/types/call-log.ts` — CallLog, CallLogCreate with status/type enums
- [x] Created `src/types/notification.ts` — Notification with type enum (Mention/Task/Assignment/WhatsApp)

### Frontend — API Clients
- [x] Created `src/lib/api/activities.ts` — activitiesApi.getActivities(entityType, entityId)
- [x] Created `src/lib/api/tasks.ts` — Full CRUD (list, get, create, update, delete)
- [x] Created `src/lib/api/notes.ts` — Full CRUD (list, get, create, update, delete)
- [x] Created `src/lib/api/comments.ts` — list (by entity), create, delete
- [x] Created `src/lib/api/call-logs.ts` — Full CRUD
- [x] Created `src/lib/api/notifications.ts` — list, markRead, markAllRead, unreadCount

### Frontend — TanStack Query Hooks
- [x] Created `src/hooks/useActivities.ts` — useActivities(entityType, entityId) with enabled guard
- [x] Created `src/hooks/useTasks.ts` — useTasks, useTask, useCreateTask, useUpdateTask, useDeleteTask (all mutations invalidate both tasks and activities)
- [x] Created `src/hooks/useNotes.ts` — useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote
- [x] Created `src/hooks/useComments.ts` — useComments, useCreateComment, useDeleteComment
- [x] Created `src/hooks/useCallLogs.ts` — useCallLogs, useCallLog, useCreateCallLog, useUpdateCallLog, useDeleteCallLog
- [x] Created `src/hooks/useNotifications.ts` — useNotifications, useUnreadCount (30s polling), useMarkNotificationRead, useMarkAllNotificationsRead

### Frontend — Notification Store
- [x] Created `src/stores/notificationStore.ts` — Zustand store: unreadCount, showPanel, setUnreadCount, setShowPanel, togglePanel

### Frontend — Activity Components
- [x] Created `src/components/activities/ActivityTimeline.tsx` — Main unified timeline with 5 tabs (Activity, Comments, Notes, Tasks, Calls), vertical timeline with type-specific icons, inline creation forms per tab, count badges, loading skeletons, empty states
- [x] Created `src/components/activities/CommentBox.tsx` — Textarea input with submit button, loading state, error display, auto-clear on success
- [x] Created `src/components/activities/NoteCard.tsx` — Card with title, content preview (line-clamp-3), author, timestamp, edit/delete actions with confirmation
- [x] Created `src/components/activities/TaskItem.tsx` — Checkbox toggle (Todo/Done), strikethrough on Done, priority badge (color-coded), status badge, assigned user, due date with overdue highlighting, delete with confirmation
- [x] Created `src/components/activities/NotificationBell.tsx` — Bell icon with red unread count badge, click-outside handler, toggles NotificationPanel dropdown
- [x] Created `src/components/activities/NotificationPanel.tsx` — Dropdown panel with type-specific icons, notification text, from-user, relative timestamps, unread dot indicator, mark-read on click with entity navigation, "Mark all read" button

### Frontend — Page Integration
- [x] Updated `src/components/layout/Header.tsx` — Added NotificationBell between search and user dropdown
- [x] Updated `src/app/(dashboard)/leads/[id]/page.tsx` — Added ActivityTimeline below lead detail card
- [x] Updated `src/app/(dashboard)/deals/[id]/page.tsx` — Added ActivityTimeline below deal detail card

### Frontend — Full Pages (Replaced Stubs)
- [x] Replaced `src/app/(dashboard)/tasks/page.tsx` — Full tasks page: "New Task" button with inline form (title, description, priority, status, due date), filter bar (status/priority dropdowns, search), TaskItem list with status change and delete, pagination
- [x] Replaced `src/app/(dashboard)/notes/page.tsx` — Full notes page: "New Note" button with inline form, search by title, responsive grid (1/2/3 columns) of NoteCards with edit/delete handlers
- [x] Replaced `src/app/(dashboard)/call-logs/page.tsx` — Full call logs page: table (Call ID, Caller, Receiver, Type badge, Status badge, Duration, Medium, Date), pagination

## Phase 3: Remaining (Pending)
- [ ] File attachments system
- [ ] TipTap rich text editor integration for notes and comments

## Phase 4: SLA & Products

### Backend — SLA Engine Service
- [x] Created `apps/crm/services/__init__.py` + `apps/crm/services/sla.py` — Full SLA engine with 5 functions:
  - `get_applicable_sla()` — Finds matching SLAs by apply_on, enabled, date range, condition_json evaluation (supports 11 operators: =, !=, >, >=, <, <=, like, not like, in, not in, is). Non-default SLAs take priority.
  - `apply_sla()` — Attaches SLA, sets sla_creation, calculates response_by deadline, sets "First Response Due" status
  - `calc_response_time()` — Walks forward through time adding duration only during working hours (from ServiceDay), skipping holidays (from HolidayList) and non-working days
  - `check_sla_status()` — Returns "Fulfilled"/"Failed"/"First Response Due"/"" based on response_by vs first_responded_on vs now()
  - `handle_communication_status_change()` — Tracks first_responded_on, first_response_time, last_responded_on, recalculates sla_status

### Backend — SLA API
- [x] Created `apps/crm/api/schemas/sla.py` — SLAOut (with nested SLAPriorityOut + ServiceDayOut lists, holiday_list_name resolver), SLACreate (with nested priorities + working_hours), SLAUpdate (all Optional for PATCH)
- [x] Created `apps/crm/api/sla.py` — 5 endpoints: List (prefetch priorities+working_hours), Get, Create (nested creation with response_time_seconds→timedelta conversion), Update (replaces nested if provided), Delete

### Backend — Product Catalog API
- [x] Created `apps/crm/api/schemas/product.py` — ProductOut, ProductCreate, ProductUpdate, LeadProductOut/Create, DealProductOut/Create (all Decimal fields resolved to float)
- [x] Created `apps/crm/api/products.py` — 5 endpoints: List (search by name/code, pagination), Get, Create, Update, Delete

### Backend — Lead/Deal Product Line Items
- [x] Added to `apps/crm/api/leads.py` — 3 endpoints: GET/POST/DELETE /{lead_id}/products with auto-calculation (amount = qty * rate, discount_amount = amount * discount_percentage / 100, net_amount = amount - discount_amount) and parent total recalculation (lead.total, lead.net_total)
- [x] Added to `apps/crm/api/deals.py` — 3 endpoints: GET/POST/DELETE /{deal_id}/products with same calculations, recalculates deal.deal_value

### Backend — Lead-to-Deal Conversion
- [x] Created `apps/crm/services/conversion.py` — `convert_lead_to_deal()` wrapped in @transaction.atomic: validates not already converted, finds-or-creates Contact (matches by email_id), finds-or-creates Organization (matches by organization_name), creates Deal (copies owner/source/territory/industry/website/person fields, sets lead FK, copies SLA state if first_responded_on exists), creates DealContact (is_primary=True), marks lead.converted=True
- [x] Added `POST /{lead_id}/convert` endpoint to leads.py — Accepts optional ConvertLeadPayload (deal_value, expected_closure_date, status_id), returns DealOut (201), logs status change

### Backend — Router Wiring
- [x] Updated `apps/crm/api/router.py` — Added SLA router at /sla and Products router at /products
- [x] Updated `apps/crm/api/schemas/__init__.py` — Re-exports all new schemas (SLA + Product)

### Frontend — SLA & Product Types
- [x] Created `src/types/sla.ts` — SLA, SLAPriority, ServiceDay, SLACreate, SLAUpdate interfaces
- [x] Created `src/types/product.ts` — Product, ProductCreate, ProductUpdate, LineItem, LineItemCreate, ProductListParams interfaces

### Frontend — API Clients
- [x] Created `src/lib/api/sla.ts` — slaApi: list, get, create, update, delete
- [x] Created `src/lib/api/products.ts` — productsApi: CRUD + leadProducts (list/add/remove) + dealProducts (list/add/remove) + convertLeadToDeal

### Frontend — Hooks
- [x] Created `src/hooks/useSLA.ts` — useSLAs, useSLA, useCreateSLA, useUpdateSLA, useDeleteSLA
- [x] Created `src/hooks/useProducts.ts` — useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct, useLeadProducts, useAddLeadProduct, useRemoveLeadProduct, useDealProducts, useAddDealProduct, useRemoveDealProduct, useConvertLead (invalidates leads+deals)

### Frontend — Components
- [x] Created `src/components/products/ProductLineItems.tsx` — Reusable line items table: inline add form row, auto-calculated Amount/Discount/Net Amount, delete per row, total row, loading/empty states
- [x] Created `src/components/modals/ConvertLeadModal.tsx` — Modal with Deal Value, Expected Closure Date, Notes fields, loading/error states, navigates to new deal on success
- [x] Created `src/components/sla/SLABadge.tsx` — Color-coded badge (yellow=First Response Due with countdown, green=Fulfilled, red=Failed), overdue indicator

### Frontend — Settings Pages
- [x] Created `src/app/(dashboard)/settings/products/page.tsx` — Full product catalog: search, paginated table (Code, Name, Rate, Description, Status, Created), inline creation, edit modal, active/disabled toggle, delete with confirmation
- [x] Created `src/app/(dashboard)/settings/sla/page.tsx` — Full SLA management: expandable cards (name, Apply On badge, enabled status, priority count), expanded view with priorities (hours+minutes), working hours (day+times), condition JSON editor, create/edit forms
- [x] Updated `src/app/(dashboard)/settings/page.tsx` — Replaced stub with settings hub linking to Products and SLA sub-pages

### Frontend — Page Integration
- [x] Updated `src/app/(dashboard)/leads/[id]/page.tsx` — Added "Convert to Deal" button (only when not converted), ConvertLeadModal, ProductLineItems above ActivityTimeline, SLABadge in status section
- [x] Updated `src/app/(dashboard)/deals/[id]/page.tsx` — Added ProductLineItems above ActivityTimeline, SLABadge in header next to status badge

## Phase 5: Dashboard & Analytics

### Backend — Dashboard API
- [x] Created `apps/dashboard/api/schemas.py` — 5 schemas: NumberCardData (title, value, previous_value, delta, prefix/suffix, negative_is_better), ChartDataPoint (label, value, value2, color), TimeSeriesPoint, ForecastPoint, DashboardResponse
- [x] Replaced `apps/dashboard/api/router.py` — 3 endpoints:
  - `GET /` — Full DashboardResponse with all 8 number cards + 9 charts
  - `GET /number-cards` — Just the 8 number cards
  - `GET /charts/{chart_name}` — Individual chart data by name
- [x] 3 utility functions: _default_dates (1st of month to today), _previous_period (equal-length comparison), _calc_delta (safe percentage change)

### Backend — 8 Number Card Functions
- [x] `get_total_leads` — Leads created in period with delta
- [x] `get_ongoing_deals` — Deals with status type NOT IN (Won, Lost) with delta
- [x] `get_won_deals` — Won deals by closed_date with delta
- [x] `get_average_deal_value` — Avg deal_value of non-lost deals (prefix=$)
- [x] `get_average_won_deal_value` — Avg deal_value of won deals (prefix=$)
- [x] `get_total_deal_value` — Sum deal_value of won deals (prefix=$)
- [x] `get_avg_time_to_close_lead` — Avg days lead→deal (suffix= days, negative_is_better)
- [x] `get_avg_time_to_close_deal` — Avg days deal→close (suffix= days, negative_is_better)

### Backend — 9 Chart Functions
- [x] `get_sales_pipeline` — Bar: deals by DealStatus (non-lost), ordered by position, with status color
- [x] `get_leads_by_source` — Donut: leads grouped by source_name
- [x] `get_deals_by_source` — Donut: deals grouped by source_name
- [x] `get_funnel_conversion` — Funnel: total leads → each DealStatus stage via StatusChangeLog (distinct object_ids)
- [x] `get_deals_by_territory` — Bar+Line dual-axis: count + sum deal_value by territory
- [x] `get_deals_by_salesperson` — Bar+Line dual-axis: count + sum deal_value by deal_owner
- [x] `get_lost_deal_reasons` — Horizontal bar: lost deals by lost_reason
- [x] `get_sales_trend` — Line time-series: daily (or monthly if >90 days) leads/deals/won_deals
- [x] `get_forecasted_revenue` — Line: 12-month forecasted (expected_deal_value * probability/100) vs actual (won deal_value)

### Frontend — Dashboard Types & Infrastructure
- [x] Created `src/types/dashboard.ts` — NumberCardData, ChartDataPoint, TimeSeriesPoint, ForecastPoint, DashboardData, DashboardFilters
- [x] Created `src/lib/api/dashboard.ts` — dashboardApi.getDashboard(fromDate, toDate)
- [x] Created `src/hooks/useDashboard.ts` — useDashboard(filters) with auto-refetch on date change

### Frontend — Dashboard Components (Pure SVG/CSS Charts)
- [x] Created `src/components/dashboard/NumberCard.tsx` — White card with large formatted value (K/M abbreviations), delta indicator (green ▲ / red ▼, inverted for negative_is_better), prefix/suffix support
- [x] Created `src/components/dashboard/BarChart.tsx` — Vertical + horizontal bar charts, value2 dot markers for dual-axis, hover tooltips, default 10-color palette, empty state
- [x] Created `src/components/dashboard/DonutChart.tsx` — SVG arc-based donut with center total, hover segment grow/fade, interactive legend grid with percentages
- [x] Created `src/components/dashboard/LineChart.tsx` — SVG smooth curves (Catmull-Rom spline), trend mode (3 lines) + forecast mode (2 lines), hover vertical line + tooltip, auto-thinned x-axis labels
- [x] Created `src/components/dashboard/DateRangePicker.tsx` — 8 presets (Last 7/30/60/90 Days, This/Last Month, This Quarter, This Year) + custom range with date inputs, click-outside close

### Frontend — Dashboard Page
- [x] Replaced `src/app/(dashboard)/dashboard/page.tsx` — Full dashboard: header with refresh + date picker, responsive number cards grid (4 cols desktop), 5 chart rows (2 cols): Sales Pipeline + Leads by Source, Sales Trend + Deals by Source, Funnel + Forecast, Salesperson + Lost Reasons, Territory (full width). Loading skeletons, error state with retry, empty state.
- [x] Updated `frontend/package.json` — Added echarts + echarts-for-react dependencies for future migration

## Phase 6: Real-time & Notifications

### Backend — Real-time Broadcasting
- [x] Created `apps/realtime/utils.py` — 3 broadcast helpers: `broadcast_crm_update()` (all users via crm_updates group), `send_user_notification()` (specific user via user_{id} group), `broadcast_activity_update()` (convenience wrapper for activity events)
- [x] Updated `apps/realtime/consumers.py` — Added `receive_json` handler (ping/pong heartbeat) and `whatsapp_message` handler

### Backend — Broadcast Wiring (17 broadcast calls across 8 files)
- [x] Updated `apps/crm/api/leads.py` — Broadcasts on create, update, delete, convert (4 calls)
- [x] Updated `apps/crm/api/deals.py` — Broadcasts on create, update, delete (3 calls)
- [x] Updated `apps/crm/api/contacts.py` — Broadcasts on create, update, delete (3 calls)
- [x] Updated `apps/crm/api/organizations.py` — Broadcasts on create, update, delete (3 calls)
- [x] Updated `apps/communication/api/comments.py` — Broadcasts activity_update + send_user_notification per @mention
- [x] Updated `apps/communication/api/tasks.py` — Broadcasts activity_update + send_user_notification on assignment
- [x] Updated `apps/communication/api/notes.py` — Broadcasts activity_update on create, update, delete

### Frontend — WebSocket Infrastructure
- [x] Created `src/hooks/useWebSocket.ts` — WebSocket hook: connects to ws://localhost:8001/ws/crm/?token=jwt, 30s ping heartbeat, exponential backoff reconnection (3s→30s max), routes messages to cache invalidation handlers
- [x] Created `src/components/providers/WebSocketProvider.tsx` — Thin wrapper calling useWebSocket()

### Frontend — TanStack Query Cache Invalidation
- [x] `handleCrmUpdate()` — Maps backend events to query invalidations: *_created/*_deleted invalidates list + dashboard, *_updated invalidates list + detail + dashboard, lead_converted invalidates leads + deals, activity_updated invalidates activities + comments + tasks + notes
- [x] `handleNotification()` — Invalidates notifications + unread-count queries on real-time notification events

### Frontend — UI Integration
- [x] Updated `src/app/(dashboard)/layout.tsx` — Wrapped authenticated content with WebSocketProvider
- [x] Updated `src/hooks/useNotifications.ts` — Reduced polling from 30s to 60s (WebSocket handles real-time now)
- [x] Created `src/components/layout/ConnectionStatus.tsx` — Offline indicator (red pill with WifiOff icon, shows only when browser goes offline)
- [x] Updated `src/components/layout/Header.tsx` — Added ConnectionStatus before NotificationBell

## Phase 7: Integrations

### Backend — Integration Models (`apps/integrations/models/`)
- [x] Created `twilio_settings.py` — TwilioSettings (TenantMixin, account_sid, auth_token, api_key, api_secret, twiml_sid, record_calls, enabled)
- [x] Created `exotel_settings.py` — ExotelSettings (TenantMixin, account_sid, subdomain, api_key, api_token, webhook_verify_token, record_calls, enabled)
- [x] Created `whatsapp_settings.py` — WhatsAppSettings (TenantMixin, phone_number_id, access_token, business_account_id, webhook_verify_token, enabled) + WhatsAppMessage (TenantMixin+TimestampMixin, GenericFK, MessageType/Status choices, from/to_number, content, content_type, status, template_name, media_url, reply_to self-FK)
- [x] Created `telephony_agent.py` — TelephonyAgent (TenantMixin, OneToOneField to User, CallingMedium/ReceivingDevice choices)
- [x] Created `lead_sync_source.py` — LeadSyncSource (TenantMixin+TimestampMixin, SourceType/SyncFrequency choices, Facebook fields: page_id, page_access_token, form_id, field_mapping JSONField, last_synced_at)
- [x] Created `__init__.py` — Imports all 6 model classes

### Backend — Integration Schemas
- [x] Created `apps/integrations/api/schemas.py` — All Out/Create/Update schemas for TwilioSettings, ExotelSettings, WhatsAppSettings, WhatsAppMessage, TelephonyAgent, LeadSyncSource + IntegrationStatusOut + CRMSettingsOut/Update + Facebook helper schemas (FacebookPage, FacebookForm)

### Backend — Integration Services
- [x] Created `apps/integrations/services/twilio_service.py` — generate_voice_token (Twilio AccessToken with VoiceGrant), handle_voice_webhook (TwiML response), handle_status_callback (call status updates), find_entity_by_phone (reverse lookup)
- [x] Created `apps/integrations/services/whatsapp_service.py` — send_text_message (Graph API), send_template_message, handle_webhook (message+status routing), verify_webhook_signature (HMAC-SHA256)
- [x] Created `apps/integrations/services/facebook_sync.py` — sync_leads_from_facebook (pulls from Lead Ads API, creates CRM Leads with field mapping, deduplicates by facebook_lead_id), fetch_facebook_pages, fetch_facebook_forms

### Backend — Integration API Routers (5 sub-routers)
- [x] Created `apps/integrations/api/twilio.py` — GET/POST settings (upsert), GET token, POST voice-webhook/status-callback/recording-callback (auth=None for external webhooks)
- [x] Created `apps/integrations/api/exotel.py` — GET/POST settings (upsert), POST webhook (auth=None), POST make-call
- [x] Created `apps/integrations/api/whatsapp.py` — GET/POST settings (upsert), GET messages/{entity_type}/{entity_id}, POST messages, POST send-template, GET/POST webhook (auth=None for Meta verification)
- [x] Created `apps/integrations/api/facebook.py` — CRUD sync-sources, POST sync-sources/{id}/sync (trigger manual sync), POST fetch-pages, POST fetch-forms
- [x] Created `apps/integrations/api/telephony.py` — CRUD agents, GET integration status
- [x] Created `apps/integrations/api/router.py` — Mounts 5 sub-routers: /twilio/, /exotel/, /whatsapp/, /facebook/, /telephony/

### Backend — Settings API
- [x] Replaced `apps/settings/api/router.py` — CRM settings GET (upsert with get_or_create) + PATCH

### Frontend — Integration Types
- [x] Created `src/types/integration.ts` — TwilioSettings, ExotelSettings, WhatsAppSettings, WhatsAppMessage, TelephonyAgent, LeadSyncSource, FacebookPage, FacebookForm, IntegrationStatus, CRMSettingsData

### Frontend — API Client & Hooks
- [x] Created `src/lib/api/integrations.ts` — integrationsApi object with all integration API calls grouped by service
- [x] Created `src/hooks/useIntegrations.ts` — 18+ hooks: useTwilioSettings, useSaveTwilioSettings, useExotelSettings, useSaveExotelSettings, useWhatsAppSettings, useSaveWhatsAppSettings, useWhatsAppMessages, useSendWhatsAppMessage, useSyncSources, useCreateSyncSource, useUpdateSyncSource, useDeleteSyncSource, useTriggerSync, useTelephonyAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, useIntegrationStatus, useCRMSettings, useUpdateCRMSettings, useMakeExotelCall

### Frontend — Integration Settings Pages
- [x] Created `src/app/(dashboard)/settings/integrations/page.tsx` — Integrations hub with 5 cards (Twilio, Exotel, WhatsApp, Facebook, Telephony) showing connection status
- [x] Created `src/app/(dashboard)/settings/integrations/twilio/page.tsx` — Twilio settings form with password show/hide, test connection
- [x] Created `src/app/(dashboard)/settings/integrations/exotel/page.tsx` — Exotel settings form
- [x] Created `src/app/(dashboard)/settings/integrations/whatsapp/page.tsx` — WhatsApp settings form with webhook URL display
- [x] Created `src/app/(dashboard)/settings/integrations/facebook/page.tsx` — Facebook sync sources CRUD with field mapping editor, manual sync trigger
- [x] Created `src/app/(dashboard)/settings/integrations/telephony/page.tsx` — Telephony agents management

### Frontend — General Settings & Telephony Components
- [x] Created `src/app/(dashboard)/settings/general/page.tsx` — General CRM settings (brand name, currency, forecasting toggle)
- [x] Updated `src/app/(dashboard)/settings/page.tsx` — Settings hub with General + Integrations + Products + SLA cards
- [x] Created `src/components/telephony/WhatsAppChat.tsx` — Chat widget with message bubbles, status indicators, auto-scroll to latest
- [x] Created `src/components/telephony/CallButton.tsx` — Click-to-call button with Twilio/Exotel provider dropdown, VoIP token fetch

## Phase 8: Polish & Mobile

### Backend — Calendar/Event Model + API
- [x] Created `apps/communication/models/event.py` — Event model (TenantMixin+TimestampMixin, subject, description, location, starts_on, ends_on, all_day, event_type Private/Public, color, entity_type, entity_id, owner FK) + EventParticipant model (event FK, user FK, email, attending Yes/No/Maybe)
- [x] Updated `apps/communication/models/__init__.py` — Added Event, EventParticipant imports
- [x] Added event schemas to `apps/communication/api/schemas.py` — EventOut, EventCreate, EventUpdate, EventParticipantOut, EventParticipantCreate
- [x] Created `apps/communication/api/events.py` — 6 endpoints: list (date range + owner + entity filters), get (with prefetched participants), create (with participants), update (drag/resize support), delete, RSVP
- [x] Updated `apps/communication/api/router.py` — Mounted events sub-router

### Backend — Data Import API
- [x] Created `apps/core/api/data_import.py` — 4 endpoints: GET importable-entities (6 entity types with field definitions), POST import/preview (CSV parsing with first 5 rows), POST import (full CSV import with validation + per-row errors), GET import/template/{entity_type} (downloadable CSV template)
- [x] Added import schemas to `apps/core/api/schemas.py` — ImportFieldDef, ImportableEntity, ImportPreviewOut, ImportResultOut
- [x] Updated `apps/core/api/router.py` — Mounted data-import + i18n sub-routers

### Backend — Form Script + Fields Layout Models
- [x] Created `apps/views/models/form_script.py` — FormScript (TenantMixin+TimestampMixin, name, dt, view Form/List, enabled, script)
- [x] Created `apps/views/models/fields_layout.py` — FieldsLayout (TenantMixin+TimestampMixin, dt, type Quick Entry/Side Panel/Data Fields, layout JSONField, unique_together on company+dt+type)
- [x] Updated `apps/views/models/__init__.py` — Added FormScript, FieldsLayout imports
- [x] Added schemas to `apps/views/api/schemas.py` — FormScriptOut/Create/Update, FieldsLayoutOut/Create/Update
- [x] Created `apps/views/api/form_scripts.py` — Full CRUD (list with dt/view/enabled filters, get, create, update, delete)
- [x] Created `apps/views/api/fields_layout.py` — CRUD + POST /save-layout upsert (get_or_create by company+dt+type)
- [x] Refactored `apps/views/api/router.py` — Parent router mounting view_settings, form-scripts, fields-layout sub-routers

### Backend — i18n Translation API
- [x] Created `apps/core/api/translations.py` — GET /translations?lang=en (returns flat dict, ready for translation strings), GET /languages (15 supported languages)

### Frontend — Responsive Mobile Layout
- [x] Created `src/hooks/useMobile.ts` — `useMobile(breakpoint)` hook with resize listener
- [x] Updated `src/components/layout/Sidebar.tsx` — Desktop: static sidebar with `hidden md:flex`; Mobile: full-screen overlay drawer with backdrop, auto-close on navigation
- [x] Updated `src/components/layout/Header.tsx` — Added hamburger menu button (mobile only), expandable search, compact breadcrumbs on mobile
- [x] Updated `src/app/(dashboard)/layout.tsx` — Mobile sidebar state management, responsive padding `p-4 md:p-6`

### Frontend — PWA Support
- [x] Created `public/manifest.json` — Web App Manifest (name, icons 192/512, theme color #4f46e5, standalone display)
- [x] Created `public/sw.js` — Service worker with install (cache static assets), fetch (network-first with cache fallback), activate (old cache cleanup)
- [x] Created `src/lib/pwa.ts` — `registerSW()` utility for service worker registration
- [x] Updated `src/app/layout.tsx` — Added manifest link, theme-color meta, apple-mobile-web-app-capable meta

### Frontend — Calendar View
- [x] Created `src/types/event.ts` — CalendarEvent, EventParticipant, EventCreate, EventUpdate interfaces
- [x] Created `src/lib/api/events.ts` — eventsApi: list (date range), get, create, update, delete, rsvp
- [x] Created `src/hooks/useEvents.ts` — useEvents, useEvent, useCreateEvent, useUpdateEvent, useDeleteEvent hooks
- [x] Created `src/components/calendar/CalendarGrid.tsx` — Month view (7-column grid with event pills, "+N more"), Week view (hourly time slots 8am-8pm), Day view (single column hourly slots), color-coded events
- [x] Created `src/components/calendar/EventModal.tsx` — Create/edit event form (subject, dates, all-day toggle, color picker 8 swatches, event type, entity link, participant management)
- [x] Replaced `src/app/(dashboard)/calendar/page.tsx` — Full calendar: Month/Week/Day view toggle, prev/next/today navigation, click date → create event, click event → edit, `N` shortcut for new event

### Frontend — Data Import Tool
- [x] Created `src/types/data-import.ts` — ImportableEntity, ImportFieldDef, ImportPreview, ImportResult interfaces
- [x] Created `src/lib/api/data-import.ts` — dataImportApi: getEntities, preview, importData (FormData multipart), getTemplate
- [x] Created `src/hooks/useDataImport.ts` — useImportEntities, usePreviewImport, useImportData, useDownloadTemplate hooks
- [x] Replaced `src/app/(dashboard)/data-import/page.tsx` — 5-step wizard: entity selection, CSV upload (drag & drop), column mapping (auto-map by name), preview table, import with progress bar + error details. Browser-side CSV parsing (no external library)

### Frontend — i18n Support
- [x] Created `src/lib/i18n.ts` — loadTranslations(lang), t(key, replacements), setTranslations(data) utilities
- [x] Created `src/stores/i18nStore.ts` — Zustand store: locale + setLocale

### Frontend — Keyboard Shortcuts
- [x] Created `src/hooks/useKeyboardShortcuts.ts` — Generic shortcut hook: key + modifier matching, input element skipping, enabled toggle
- [x] Created `src/components/modals/KeyboardShortcutsModal.tsx` — Shortcuts modal grouped by category (Navigation, Actions, Leads, Deals, Calendar), Cmd/Ctrl platform detection
- [x] Updated `src/app/(dashboard)/leads/page.tsx` — `N` → new lead, `?` → shortcuts modal
- [x] Updated `src/app/(dashboard)/deals/page.tsx` — `N` → new deal, `?` → shortcuts modal
- [x] Calendar page — `N` → new event

### Frontend — Form Scripts & Fields Layout Settings
- [x] Created `src/types/form-script.ts` — FormScript, FormScriptCreate, FormScriptUpdate interfaces
- [x] Created `src/types/fields-layout.ts` — FieldsLayout, LayoutDefinition, LayoutSection interfaces
- [x] Created `src/lib/api/form-scripts.ts` — formScriptsApi: list, get, create, update, toggle, delete
- [x] Created `src/lib/api/fields-layout.ts` — fieldsLayoutApi: list, get, create, update, upsert, delete
- [x] Created `src/hooks/useFormScripts.ts` — 6 TanStack Query hooks
- [x] Created `src/hooks/useFieldsLayout.ts` — 6 TanStack Query hooks
- [x] Created `src/app/(dashboard)/settings/form-scripts/page.tsx` — Script list with enable/disable toggle, inline code editor (dark monospace textarea), CRUD operations
- [x] Created `src/app/(dashboard)/settings/fields-layout/page.tsx` — Entity type + layout type selector, JSON editor with real-time validation, load defaults, save/saved state
- [x] Updated `src/app/(dashboard)/settings/page.tsx` — Added Form Scripts and Fields Layout cards to settings hub

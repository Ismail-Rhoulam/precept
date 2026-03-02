# Production Build Fixes

TypeScript errors caught during the first `make prod-build` run. The development server (`next dev`) does not type-check on the fly, so these only surfaced in the production build (`next build`).

## 1. PaginatedResponse property mismatch

**Files:**
- `frontend/src/app/(dashboard)/call-logs/page.tsx`
- `frontend/src/app/(dashboard)/notes/page.tsx`
- `frontend/src/app/(dashboard)/tasks/page.tsx`

**Problem:** Pages accessed non-existent properties (`data?.call_logs`, `data?.notes`, `data?.tasks`, `data?.items`) on the `PaginatedResponse<T>` type, which only has a `results` field.

```ts
// Before
const callLogs: CallLog[] = Array.isArray(data) ? data : data?.call_logs || data?.items || []
const notes: Note[]       = Array.isArray(data) ? data : data?.notes || data?.items || []
const tasks               = Array.isArray(data) ? data : data?.tasks || data?.items || []

// After
const callLogs: CallLog[] = Array.isArray(data) ? data : data?.results || []
const notes: Note[]       = Array.isArray(data) ? data : data?.results || []
const tasks               = Array.isArray(data) ? data : data?.results || []
```

**Root cause:** The `PaginatedResponse<T>` type in `frontend/src/types/api.ts` uses `results: T[]`, but page components were written assuming endpoint-specific field names.

## 2. React 18 RefObject type incompatibility

**File:** `frontend/src/components/views/ViewControls.tsx`

**Problem:** The `actionMenuRef` prop was typed as `React.RefObject<HTMLDivElement | null>`, which is valid in React 19 but incompatible with React 18's JSX `ref` attribute that expects `React.RefObject<HTMLDivElement>`.

```ts
// Before
actionMenuRef: React.RefObject<HTMLDivElement | null>

// After
actionMenuRef: React.RefObject<HTMLDivElement>
```

**Root cause:** In React 18, `useRef<HTMLDivElement>(null)` returns `RefObject<HTMLDivElement>` — the `null` is implicit. The explicit `| null` in the generic parameter is a React 19 pattern.

## 3. Missing package-lock.json

**File:** `frontend/Dockerfile.prod`

**Problem:** `npm ci` requires a `package-lock.json` file, which didn't exist in the repo.

```dockerfile
# Before
RUN npm ci

# After
RUN [ -f package-lock.json ] && npm ci || npm install
```

## 4. Obsolete compose version key

**File:** `docker-compose.prod.yml`

Removed the `version: "3.8"` key which is obsolete in modern Docker Compose and produced a warning.

# API Contracts & Envelope Standards

_Last updated: April 19, 2026_

## Overview

This document defines the API contract standards for the Choices platform, including response envelope formats, error codes, and metadata conventions.

## Response Envelope Format

All API endpoints return standardized response envelopes:

Success (`ApiSuccessResponse`):

```typescript
{
  success: true;
  data: T;
  metadata?: { timestamp: string; pagination?: {...}; ... };
}
```

Error (`ApiErrorResponse` — see `web/lib/api/types.ts`):

```typescript
{
  success: false;
  error: string;       // human-readable message (sanitized in production for generic errors)
  code?: string;       // e.g. VALIDATION_ERROR, AUTH_ERROR, RATE_LIMIT
  details?: string | Record<string, unknown>;
  metadata?: { timestamp: string; ... };
}
```

## Health Check Endpoints

### GET /api/health

Consolidated health check endpoint supporting multiple check types.

**Query Parameters:**
- `type`: `basic` | `database` | `supabase` | `civics` | `all` (default: `basic`)

**Response Codes:**
- `200`: Health check passed (or warnings in CI/test environments)
- `500`: Health check failed (production only; CI/test returns 200 with status in payload)
- `503`: Service degraded

**Recent Changes (2025-11-16):**
- Updated civics health check to return HTTP 200 in CI/test environments while still reporting actual status in payload
- Added graceful handling for missing Supabase credentials in CI/test
- Database connection failures in CI/test are reported as warnings, not errors

### GET /api/site-messages

Retrieves active site messages for display.

**Recent Changes (2025-11-16):**
- Added graceful fallback for missing Supabase credentials in CI/test environments
- Returns empty messages array when Supabase is not configured (CI/test only)

## Admin API Endpoints

### GET /api/admin/site-messages

Retrieves site messages for admin management.

**Authentication:** Requires admin authentication via `requireAdminOr401()`

**Query Parameters:**
- `status`: `all` | `active` | `inactive` | `scheduled` (default: `all`)
- `priority`: `all` | `low` | `medium` | `high` | `critical` (default: `all`)
- `limit`: Number (default: 50, max: 200)

**Response:**
```typescript
{
  success: true,
  data: {
    messages: SiteMessage[],
    filters: {
      status: string,
      priority: string,
      limit: number
    },
    total: number,
    adminUser: {
      id: string,
      email: string
    }
  }
}
```

### POST /api/admin/site-messages

Creates a new site message.

**Authentication:** Requires admin authentication

**Request Body:**
```typescript
{
  title: string; // Required
  message: string; // Required
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'inactive' | 'scheduled';
  target_audience?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}
```

**Response:** Returns created site message with 201 status code

### PATCH /api/admin/site-messages/[id]

Updates an existing site message.

**Authentication:** Requires admin authentication

**Request Body:** Partial update of site message fields (all optional except those being updated)

**Response:** Returns updated site message

### DELETE /api/admin/site-messages/[id]

Deletes a site message.

**Authentication:** Requires admin authentication

**Response:** Returns deleted site message

**Recent Changes (2025-11-16):**
- Implemented full CRUD operations for site messages admin interface
- Replaced mock data with real API calls in SiteMessagesAdmin component
- Added edit form functionality for updating messages

## Error codes and helpers (implementation)

**Source of truth:** `web/lib/api/response-utils.ts` (import from `@/lib/api` alongside `withErrorHandling`).

| Helper | HTTP | `code` (when set) | Notes |
|--------|------|-------------------|--------|
| `validationError` | 400 | `VALIDATION_ERROR` | Field map in `details` |
| `authError` | 401 | `AUTH_ERROR` | |
| `forbiddenError` | 403 | `FORBIDDEN` | |
| `notFoundError` | 404 | `NOT_FOUND` | |
| `rateLimitError` | 429 | `RATE_LIMIT` | Optional **`Retry-After`** header (seconds) |
| `errorResponse` | configurable | optional 4th arg | Production sanitizes message body |

**Types:** `web/lib/api/types.ts` — `ApiErrorResponse`: `success: false`, **`error: string`**, optional **`details`**, optional **`code`**, **`metadata`** (includes `timestamp` on helpers). Success: `ApiSuccessResponse` with `data` + `metadata`.

Legacy routes may still drift; **`web/tests/contracts/**`** and **`npm run verify:docs`** (inventory vs routes) catch gaps.

### Documented error codes (semantic)

- `VALIDATION_ERROR` — Request validation failed
- `AUTH_ERROR` — Authentication required / invalid session
- `FORBIDDEN` — Authenticated but not allowed
- `RATE_LIMIT` — Too many requests
- `NOT_FOUND` — Resource not found
- Handlers may define additional `code` strings for domain errors; prefer the helpers for common HTTP semantics.

### Profile subroutes (privacy / media)

- **`DELETE /api/profile/data?type=…`** — Session via `supabase.auth.getSession()`; state-changing requests require **`X-CSRF-Token`** matching the CSRF cookie (see `validateCsrfProtection` in `web/app/api/auth/_shared/csrf.ts`; Jest and E2E bypass headers skip the check). Success payload is under **`data`**: `{ message, deletedCount, dataType }`. Contract suite: `web/tests/contracts/profile-data.contract.test.ts`.
- **`POST /api/profile/avatar`** — `multipart/form-data` with field **`avatar`** (image file, ≤5MB). Authenticates with **`getCurrentUser`** (JWT from `Authorization: Bearer` or `auth-token` cookie). Same CSRF rules as above. Success **`data`**: `{ avatarUrl }`. Contract suite: `web/tests/contracts/profile-avatar.contract.test.ts`.

### Privacy and onboarding (session)

- **`POST /api/privacy/preferences`** — JSON body; Supabase session via `getUser`; CSRF required outside test/E2E bypass. Contract: `web/tests/contracts/privacy-preferences.contract.test.ts`.
- **`POST /api/onboarding/progress`** — JSON `{ step, action?, data? }`; session `getUser`; CSRF as above. **`POST /api/onboarding/complete`** and **`POST /api/user/complete-onboarding`** — session mutations with the same CSRF gate. Contract: `web/tests/contracts/onboarding-session.contract.test.ts`.

### Notifications, civics follow, analytics layout, PWA push

- **`POST` / `PUT` `/api/notifications`** — Authenticated `getUser`; CSRF on mutating methods. `notification_type` includes `hashtag_trending` for hashtag alerts.
- **`POST` / `DELETE` `/api/representatives/[id]/follow`** — Session `getUser` plus admin client for follow rows; CSRF required.
- **`POST` / `DELETE` `/api/analytics/dashboard/layout`** — Persists or clears `dashboard_layout` on `user_profiles`; CSRF required (browser: `widgetStore.saveLayout`).
- **`POST` / `PUT` / `DELETE` `/api/pwa/notifications/subscribe`** — Push subscription lifecycle when the PWA feature flag is enabled; CSRF required. **`POST /api/pwa/offline/sync`** is not CSRF-gated yet (no first-party page client; a service-worker–driven flow would need a dedicated sync token).

### Hashtags (moderation)

- **`GET /api/hashtags?action=moderation&hashtagId=…`** — Session required; returns **`data`** as a moderation summary for that hashtag (derived from `hashtag_flags`).
- **`GET /api/hashtags?action=moderation-queue&limit=…`** — Session required; returns **`data`** as an array of hashtag records plus a nested **`moderation`** object per item (pending flags only).
- **`POST /api/hashtags`** — CSRF required for mutating actions: **`?action=flag`**, **`?action=approve&flagId=…`**, **`?action=reject&flagId=…`**, **`?action=moderate`** (JSON body: **`hashtagId`**, **`status`** in `approved` \| `rejected` \| `flagged`, optional **`reason`**).

### Polls (lifecycle and trending)

- **`POST /api/polls/[id]/close`** — Creator (or allowed role per handler) closes an active poll; session + CSRF.
- **`POST` / `DELETE` `/api/polls/[id]/lock`** — Lock or unlock a poll; creator-only; CSRF on both methods.
- **`POST` / `DELETE` `/api/polls/[id]/post-close`** — Enable or disable post-close voting on a closed poll; creator-only; CSRF.
- **`DELETE /api/polls/[id]`** — Creator deletes the poll; CSRF.
- **`POST /api/trending?type=hashtags`** — Authenticated hashtag engagement tracking; JSON body; CSRF.

### Contact and moderation (session)

- **`POST /api/contact/submit`** — Authenticated representative contact submission; CSRF.
- **`POST /api/contact/messages`** — Authenticated messaging; CSRF.
- **`POST` / `PUT` `/api/contact/threads`** — Create thread or update thread status/priority; CSRF.
- **`PATCH` / `DELETE` `/api/contact/[id]`** — Update or withdraw own unverified contact row; CSRF.
- **`POST /api/moderation/reports`** — Authenticated user reports; CSRF.
- **`POST /api/moderation/appeals`** — Authenticated appeals; CSRF.
- **`POST` / `PATCH` `/api/representatives/self/overrides`** — Linked representative public-field overrides (`PATCH` delegates to `POST`); CSRF.

## Metadata Fields

Common metadata fields in API responses:

- `timestamp`: ISO 8601 timestamp of the response
- `cached`: Boolean indicating if response was served from cache
- `ttl`: Cache time-to-live in seconds
- `version`: API version identifier

## Contract testing

Jest contract suites live in **`web/tests/contracts/`**. A **file ↔ route** map (maintain when adding suites) is in [`docs/TESTING.md` § CI Test Jobs](../TESTING.md#ci-test-jobs-github-actions). Directory listing may include helpers under `contracts/helpers/`. Full route listing: [`inventory.md`](inventory.md) (`npm run docs:api-inventory`). **Drift guard:** `npm run verify:docs` (repo root).

The archived planning doc [`docs/archive/reference/testing/TESTING/api-contract-plan.md`](../archive/reference/testing/TESTING/api-contract-plan.md) is **historical only** (superseded by this file + `TESTING.md`).

## Governance

When modifying API handlers:
1. Update this file to document contract changes
2. Update contract tests in `web/tests/contracts/`
3. Update [`docs/TESTING.md`](../TESTING.md) or release notes (`docs/archive/release-notes/CHANGELOG.md`) as appropriate; regenerate [`inventory.md`](inventory.md) when routes change

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** 2026-04-19 (profile data / avatar contract suites + CSRF alignment; hashtag moderation + poll lifecycle / trending POST + contact / moderation / rep overrides contracts)


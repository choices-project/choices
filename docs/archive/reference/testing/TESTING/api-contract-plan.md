# API Contract Test Plan

_Last updated: 2025-11-14 · Owner: GPT-5 Codex_

## Objective

Establish a lightweight Jest contract suite that hits `web/app/api/**` handlers directly (via Next.js route mocks) using the same MSW fixtures and response builders as the Playwright harness. The suite will:

1. Ensure every handler emits the standardized `{ success, data, metadata }` envelope (or the documented error helpers).
2. Assert critical response shapes for high-signal routes (auth/profile, civics, contact, dashboard).
3. Run quickly enough for PR/CI gating (`npm run test:contracts` target < 60s).

## Scope (Phase 2)

1. **Profile & Auth surfaces**  
   - `/api/profile` (GET/POST/PUT/PATCH) via shared `createProfilePayload`.  
   - `/api/user/complete-onboarding`, `/api/privacy/preferences`.
   - `/api/auth/register` contract tests assert CSRF + rate-limit guards, username regex validation, Supabase sign-up failures, profile insert warnings, and metadata timestamp envelopes (no mocking of `withErrorHandling`).  
   - `/api/auth/sync-user` suite now covers missing-auth guard, lookup/create failure payload details, and metadata timestamp assertions for every envelope (`AUTH_ERROR`, `SYNC_PROFILE_LOOKUP_FAILED`, `SYNC_PROFILE_CREATE_FAILED`).
   - `/api/profile` onboarding POST now has explicit invalid-payload coverage asserting `VALIDATION_ERROR` envelopes (metadata timestamps + field-level error details) when onboarding fields fail schema validation.
2. **Civics endpoints**  
   - `/api/v1/civics/address-lookup` (POST), `/api/v1/civics/by-state`, `/api/v1/civics/elections`.  
   - Address lookup assertions:
     - Returns jurisdiction payload and sets jurisdiction cookie (state, optional district/county)
     - Enforces per-IP rate limiting (expect 429 when exceeded)
     - Serves cached responses within TTL window (meta.cached = true)
     - Never exposes `GOOGLE_CIVIC_API_KEY` to client
   - Address lookup now validates cookie writes, pepper config, and fallback metadata when Google Civic API fails.  
   - `/api/v1/civics/elections` asserts count metadata for empty RPC results plus `divisions` query parsing.  
   - `/api/v1/civics/by-state` asserts success + validation + Supabase failure envelopes **and** emits filtering metadata for `fields`/`include` queries.
3. **Contact & Dashboard**  
   - `/api/contact/messages`, `/api/contact/threads`, `/api/dashboard`.  
   - Contact routes now cover auth + Supabase failure envelopes plus POST validation/not-found/conflict paths.
4. **Notifications / Poll basics**  
   - ✅ `/api/notifications` GET/POST/PUT (happy + validation/not-found paths).  
   - ✅ `/api/polls` list (GET) + creation (POST) verified, including analytics/option inserts and validation + insert-failure paths.
5. **Shared & Privacy endpoints**  
   - ✅ `/api/shared/vote` anonymous vote path validated.  
   - ✅ `/api/privacy/preferences` GET/POST contract-tested.
6. **Analytics / Demographics**  
   - ✅ `/api/dashboard` cache-hit + cache-miss + auth + fallback failure flows.  
   - ✅ `/api/demographics` success + user-profile failure envelopes.
7. **Feeds & Trending**  
   - ✅ `/api/feeds` success + rate-limit + Supabase failure paths, plus rate limiter invocation and civic-action failure warning coverage.  
   - ✅ `/api/trending` polls/hashtags/topics + POST tracking validation, including hashtag tracker metadata plumbing + failure envelope.  
   - ✅ `/api/polls/trending` pagination metadata (hasMore/totalPages) asserted for constrained `limit`.
   - MSW + contract fixtures for feeds now include the `bookmarks` metric so they stay aligned with the updated `FeedEngagement` type—update `web/tests/msw/feeds-handlers.ts` whenever engagement fields change.
8. **Onboarding & Profile**  
   - ✅ `/api/user/complete-onboarding` auth + invalid payload + update failure.  
   - ✅ `/api/profile` onboarding POST validation coverage.
9. **Workflow C — Analytics/Admin/Candidate**  
   - ✅ `/api/analytics/dashboard/layout`, `/api/analytics/trends`, `/api/analytics/trust-tiers`, `/api/analytics/temporal`, `/api/analytics/poll/[id]` now exercise cache headers, RPC failure codes (`ANALYTICS_RPC_FAILED`, `ANALYTICS_POLL_FAILED`, etc.), and real Supabase mocks.  
   - ✅ `/api/admin/breaking-news` POST asserts admin guard, payload validation, and audit logging.  
   - ✅ `/api/candidate/journey/send-email` POST covers rate limiting (`RATE_LIMIT`), ownership guards, and reminder payloads; `/api/cron/candidate-reminders` GET asserts idempotent success envelopes plus Supabase failure logging.

## Coverage Matrix (2025-11-15)

| Area | Routes | Status | Notes |
| --- | --- | --- | --- |
| Auth/Profile | `/api/auth/*`, `/api/profile`, `/api/user/complete-onboarding`, `/api/privacy/preferences` | ✅ | WebAuthn + onboarding POST now emit shared envelopes; add new codes in `docs/API/contracts.md` when extending. |
| Civics | `/api/v1/civics/address-lookup` (POST), `/by-state`, `/elections` | ✅ | Address lookup asserts cookie + metadata, rate limit (429), and caching; elections asserts pagination + `fields/include` filters. |
| Dashboard/Analytics | `/api/dashboard`, `/api/analytics/**` | ✅ | Cache metadata + error codes validated. Update MSW fixtures when TTL/headers change. |
| Feeds/Trending | `/api/feeds`, `/api/trending`, `/api/polls/trending` | ✅ | Pagination + rate limit metadata asserted; keep tracker metadata stable. |
| Contact/Notifications | `/api/contact/messages|threads`, `/api/notifications` | ✅ | Validation + not-found flows covered. |
| Admin/Candidate/Cron | `/api/admin/breaking-news`, `/api/candidate/journey/send-email`, `/api/cron/candidate-reminders` | ✅ | Ensure audit logging mocks assert payload. |
| Legacy Admin/Civics (Workflow C follow-up) | `/api/admin/*` (legacy), `/api/candidate/*` extras | 🚧 | Track remaining legacy handlers in `scratch/gpt5-codex/store-roadmaps/api-response-modernization.md`. |

## Dev Server Hygiene & Harness Reliability

- **Chunk 500s / `_next/static` MIME errors**: aggressive `splitChunks` tuning now runs only in production. If contract or Playwright suites start logging chunk 500s again, ensure the webpack optimization block inside `next.config.js` is still guarded by `process.env.NODE_ENV === 'production'`.
- **Harness boot timeout**: The Playwright helpers respect `HARNESS_NAV_TIMEOUT` (default 45000 ms). Set `HARNESS_NAV_TIMEOUT=60000 NEXT_PUBLIC_ENABLE_E2E_HARNESS=1 npx playwright test …` when running the full suite locally so the first Next.js compile has time to finish before navigation assertions fire.
- **Allowed dev origins / CSP warnings**: Add additional sources to `ALLOWED_DEV_ORIGINS` (comma-separated) when hitting the dev server from non-default hosts (e.g., GitHub Codespaces). `next.config.js` merges these into the development CSP (`connect-src`, `script-src`, etc.) and emits an `X-Allowed-Dev-Origins` header so diagnostics stay visible.

## Test Harness Design

- **Runner**: Jest (existing config). New script: `npm run test:contracts`.
- **Command**: `npm run test:contracts` (or `npx jest tests/contracts`) executes only the contract suites for fast CI gating.
- **Setup**:
  - Use `@testing-library/next-route-handler` (or custom Next mock) to invoke route exports with mocked `NextRequest`.
  - Mock Supabase client & Redis via existing helpers (see `web/tests/setup/api.ts`).
  - Reuse MSW fixtures where available: move canonical payloads under `web/tests/fixtures/api/`.
- **Assertions**:
  - Envelope: `expect(response.success).toBe(true)` and `expect(response).toHaveProperty('data.profile')`, etc.
  - Error paths: supply invalid payloads and assert `success: false`, proper `code`.
- **Performance**: Keep each file < ~5 tests; mock DB/responses to avoid network.

### Fixture & Playwright Alignment
- Every contract-tested route must also have a deterministic MSW handler registered via `web/tests/msw/server.ts`. Shared payloads now live under `web/tests/fixtures/api/**` and are imported by both MSW (`api-handlers.ts`) and Playwright (`tests/e2e/helpers/e2e-setup.ts`), so updating a fixture keeps Jest/MSW/Playwright aligned.
- `setupExternalAPIMocks` consumes these fixtures directly—treat it as the canonical offline behavior for harness runs.
- After changing a payload, update:
  1. The route handler (shared envelope helpers).
  2. Contract assertions.
  3. Fixtures under `web/tests/fixtures/api/**` plus any MSW/Playwright handler that consumes them.
  4. `docs/API/contracts.md` if new codes/metadata fields were introduced.

### Adding a New Route Checklist
1. Implement handler with `withErrorHandling` + response helpers.
2. Create contract test under `web/tests/contracts/<feature>.contract.test.ts`.
3. Add MSW fixture + extend `setupExternalAPIMocks`.
4. Update the coverage matrix table above.
5. Mention the change in release notes if externally visible.

## Tasks

1. [x] Create `web/tests/contracts/` with utility to invoke API routes (mock Supabase, request objects).  
2. [x] Add fixtures for profile, civics, contact, dashboard, polls, notifications, share analytics, and PWA responses under `web/tests/fixtures/api/`.  
3. [x] Author initial contract suites:
   - `profile.contract.test.ts`
   - `civics.contract.test.ts`
   - `contact.contract.test.ts`
   - `dashboard.contract.test.ts`
4. [x] Wire npm script: `"test:contracts": "npx jest tests/contracts"` and add `contracts` Jest project.
5. [x] Document in `docs/TECHNICAL/testing-harness-playbooks.md` (Phase 2 exit criterion).  
6. [x] Update CI workflow to run `npm run test:contracts` after API lint/format steps.

## Exit Criteria

1. Contract suite passes locally and in CI, covering the Phase 2 endpoints above.
2. Fixtures shared between MSW/Playwright and Jest to avoid drift.
3. Failures produce actionable error messages (route name + missing field).
4. Documentation references contract suite usage and fixtures.


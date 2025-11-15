# Testing Harness Playbooks (Quick Reference)

_Last updated: November 15, 2025_

This page highlights the key testing workflows and points to the archived deep dives kept for historical context.

## Commands to Remember

```bash
npm run test             # Jest unit + integration suites
npm run test:e2e         # Playwright harness suite (web/playwright.config.ts)
npm run test:e2e:axe     # Axe-tagged Playwright smoke (chromium, @axe specs)
PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:staging    # Hit staging services
PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:production # Read-only prod smoke
```

When invoking Playwright manually, always target the `web` config:

```bash
cd web && npx playwright test --config=playwright.config.ts
cd web && npx playwright test --config=playwright.config.ts tests/e2e/specs/user-store.spec.ts
```

## Contract Testing Harness

- `npm run test:contracts` executes the Next.js route contracts (analytics, admin, civics, candidate, cron). Suites live under `web/tests/contracts/**` and must keep runtime < 60s so CI can gate every PR.
- Mock only leaf dependencies (Supabase client, Redis, trackers); never stub `withErrorHandling` or the response helpers so envelope/timestamp assertions remain meaningful. Prefer `jest.isolateModules` + `createPostgrestBuilder` for PostgREST mocks and don’t over-mock `withErrorHandling`.
- Route modules that pull shared singletons (`global.fetch`, rate limiters, env guards) should be loaded inside `jest.isolateModules` after mocks are defined to avoid leaking state between tests (see `civics-address.contract.test.ts` for the canonical pattern).
- Analytics routes are now validated end-to-end: `/api/analytics/dashboard/layout`, `/api/analytics/trends`, `/api/analytics/trust-tiers`, `/api/analytics/temporal`, `/api/analytics/poll/[id]` must emit cache headers (`Cache-Control`, `ETag`) and failure codes such as `ANALYTICS_RPC_FAILED`.
- Admin + candidate coverage expects role guards (`FORBIDDEN`), audit logging (`createAuditLogService.logAdminAction`), rate limiting (`rateLimitError`) and reminder metadata. Cron suites assert idempotent envelopes (`sent`, `skipped`, `errors`) and log forwarding on Supabase failures.
- Civics + feeds + trending coverage (Workflow B) now asserts pep/CSRF helpers, cookie writes, fallback metadata, rate limiter invocations, tracker source/metadata plumbing, and pagination metadata. Keep mocks narrow so the suites continue to exercise the real handlers.
- When adding a new route contract, document the scope in `docs/TESTING/api-contract-plan.md` and keep fixtures under `web/tests/fixtures/api/` so Playwright/MSW reuse the same payloads.

### MSW Fixture Troubleshooting
- **Missing handler errors** (`[MSW] Warning: captured "GET /api/...`): add/update the handler under `web/tests/msw/handlers` and ensure `setupExternalAPIMocks` registers it before specs run. The API harness boots with `PLAYWRIGHT_USE_MOCKS=1` by default, so every route must exist offline.
- **Contract suite fails but Playwright passes**: verify the real handler returns `successResponse`/`errorResponse`. MSW might still serve the legacy shape, masking the regression. Fix the handler first, then regenerate fixtures.
- **Hanging dev server**: clear `.next`, run `PLAYWRIGHT_NO_SERVER=1 npm run test:e2e -- --grep <spec>` and start `npm run dev` manually. Ensure `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` is set so harness pages expose bridges.
- Always type fixtures via `ApiSuccessResponse<T>` to get TypeScript failures when payloads drift.

### Contract Coverage Quick Checks
- `npm run test:contracts -- --listTests` surfaces every suite wired into CI. Compare against the coverage matrix in `docs/TESTING/api-contract-plan.md` before declaring parity.
- `rg "NextResponse\.json" web/app/api` should return zero matches (except tests) once a route migrates. Any remaining hits need envelope helpers.
- Before merging, run `npm run test:contracts -- --runTestsByPath web/tests/contracts/<route>.contract.test.ts` plus `npm run test:e2e -- --grep @api` to ensure both the contract harness and Playwright/MSW agree on response shapes.

## Harness Coverage Snapshot

- Store harness pages: `admin-store`, `analytics-dashboard`, `analytics-store`, `app-store`, `auth-access`, `feeds-store`, `feedback`, `notification-store`, `onboarding-store`, `onboarding-flow`, `poll-create`, `poll-run/[id]`, `poll-wizard`, `polls-store`, `profile-store`, `pwa-analytics`, `pwa-store`, `user-store`, `voting-store`, `widget-dashboard`.
- Playwright spec spotlight: `npx playwright test tests/e2e/specs/widget-dashboard-keyboard.spec.ts` drives keyboard move/resize flows (uses `window.__widgetDashboardHarness` + mocked persistence). As of 2025-11-14 the spec depends on the in-place widget mutation logic introduced in `widgetStore.moveWidget/resizeWidget`—confirm downstream overrides aren’t cloning stale copies. The spec now asserts screen reader announcements via `installScreenReaderCapture(page)` / `waitForAnnouncement(page, ...)`, so keep `ScreenReaderSupport.announce` instrumentation intact when refactoring. `npx playwright test tests/e2e/specs/analytics-dashboard-axe.spec.ts` runs the remediation gate; `npx playwright test tests/e2e/specs/analytics-axe-baseline.spec.ts` stores the daily axe snapshot for dashboard harness (pulls console logs only when debugging—default run stays silent).
- Screen reader harness coverage now also includes `npx playwright test tests/e2e/specs/analytics-dashboard-screen-reader.spec.ts` (refresh + tab announcements on the analytics harness) and the updated `npx playwright test tests/e2e/specs/poll-create.spec.ts` (wizard step progression, publish success, share focus). Both rely on the shared screen-reader helpers—wire them up before navigation so announcements are captured.
- API harness coverage: `npx playwright test tests/e2e/api-endpoints.spec.ts` now exercises all REST routes through mocked responses provided by `setupExternalAPIMocks(page, { api: true })`. The helper publishes deterministic handlers for `/api/auth/*`, `/api/polls`, `/api/dashboard`, `/api/v1/civics/*`, `/api/profile`, `/api/pwa/**`, etc., so the suite no longer needs Supabase credentials while still proving that clients send the right payloads. When adding endpoints, extend the helper mocks first so the spec can run offline.
- Locale harness coverage: `npx playwright test tests/e2e/specs/locale-switch.spec.ts` mounts the global navigation harness (`/e2e/global-navigation`) so the language selector is available without Supabase auth. The spec drives locale persistence entirely in that harness (query params + selector helpers) to keep runs deterministic; keep the `/api/i18n/sync` MSW handler up to date or the spec will fail.
- Analytics harness auth seeding: `web/app/(app)/e2e/analytics-dashboard/page.tsx` seeds an admin user via `userStore.initializeAuth` once the persisted store hydrates, so the dashboard never falls back to `<UnauthorizedAccess />`. If you refactor that harness, keep the hydration guard (or call `initializeAuth` yourself) or the screen-reader spec will only ever see the “Access denied” layout and fail before the Refresh button appears.
- Analytics reference patterns: review `web/features/analytics/components/AnalyticsSummaryTable.tsx` for the accessible table scaffold used by dashboard sweeps and baseline snapshots.
- Widget modernization reference: bookmark `scratch/gpt5-codex/store-roadmaps/widget-store-checklist.md` for acceptance criteria that harmonise harness expectations, keyboard affordances, and analytics announcements.
- MSW fixtures live under `web/tests/msw/`. Use `setupExternalAPIMocks(page, { auth: true })` for Playwright and `tests/setup.ts` for Jest.
- Shared guidance on modernization + selectors: `docs/STATE_MANAGEMENT.md`.
- Admin navigation sanity: run `npm run test -- --runInBand tests/unit/admin/Sidebar.test.tsx` after tweaking breadcrumb/selector wiring; it stubs system metrics and verifies the sidebar highlights the section registered via `useAppActions`.
- **Cross-store cascade testing**: When testing auth flows (login/logout, session expiry), verify that `userStore.signOut()` or unauthenticated transitions reset `profileStore` and `adminStore`. See `web/tests/unit/stores/authCascade.test.ts` for unit coverage and `web/tests/e2e/specs/dashboard-auth.spec.ts` for E2E validation. The cascade ensures no stale user data persists after logout.

## Where to Dive Deeper

| Topic | Archived Reference |
| --- | --- |
| Authentication & passkey harness | `docs/archive/reference/testing/AUTH.md` |
| Onboarding flow plan & scenarios | `docs/archive/reference/testing/ONBOARDING.md` |
| Additional harness guidance | `web/tests/e2e/README.md` (active) |

## Quick Tips

- Set `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` when running harness pages locally.
- If the widget dashboard harness refuses to reflect keyboard updates, verify you are instantiating the store via `createWidgetStore` (post-2025-11-14 change mutates widgets in place). Clearing `.next` can recover from ENOSPC build artefacts when Playwright boots dev servers. When debugging keyboard specs, inspect `window.__announceLogs` in the browser console to confirm `[WidgetRenderer][announce]` messages are firing, and lean on the shared announcement helpers instead of inlining ad-hoc waiters.
- Prefer `findBy*` queries in RTL tests to allow harness hydration.
- Keep MSW handlers in sync with Supabase schema changes to avoid brittle mocks.
- When adding or updating dashboard specs, cross-check table summaries against `AnalyticsSummaryTable.tsx` and ensure widget interactions align with the widget checklist linked above. Run baseline specs outside `--debug` mode to avoid harness console spam (Playwright clears the listener by default).

## Contract Testing Harness

- Contract suites live in `web/tests/contracts/**` and run via `npm run test:contracts` (selecting the `contracts` Jest project).
- Set up spies/mocks *before* loading a route by calling `jest.isolateModulesAsync` (or `jest.isolateModules`) so each test gets a clean copy of the handler. Never mock `@/lib/api` or `withErrorHandling`; instead, mock only boundary integrations such as `getSupabaseServerClient`, rate limiters, CSRF helpers, or `global.fetch`.
- Use shared helpers like `createNextRequest` and `createPostgrestBuilder` to avoid re-implementing Next/Supabase plumbing. Keep mocks narrow: prefer small builder factories (e.g., for `user_profiles` inserts) over sprawling manual objects.
- `/api/auth/register`: assert CSRF guard invocation, rate limiting (IP + `user-agent` metadata), `supabase.auth.signUp` arguments, username regex failures, non-conflict Supabase errors (400 + error details), and `user_profiles` insert failures (500 + warning log). Do not stub `withErrorHandling`.
- `/api/auth/sync-user`: cover missing-auth (`AUTH_ERROR`), lookup hits vs. misses, Supabase errors for lookup/create (`SYNC_PROFILE_LOOKUP_FAILED`, `SYNC_PROFILE_CREATE_FAILED`), and verify `successResponse` metadata retains timestamps.
- `/api/profile` onboarding POST: validate malformed payloads return `VALIDATION_ERROR`, and when valid ensure Supabase receives the demographics payload, trust tier promotion, participation default, cleared arrays, and an `updated_at` timestamp.
- Document any new route expectations inside `docs/TESTING/api-contract-plan.md` alongside the suite so other workflows know what is already covered.

Update this summary whenever new harnesses or workflows are introduced.

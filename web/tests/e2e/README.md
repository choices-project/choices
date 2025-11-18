## Playwright Suite (Rebuilt)

For the canonical Playwright/auth/onboarding guidance, see:
- [`docs/testing/AUTH.md`](../../../docs/testing/AUTH.md)
- [`docs/testing/ONBOARDING.md`](../../../docs/testing/ONBOARDING.md)

- All scenarios belong under `specs/`, one journey per file. Run with `npx playwright test --config=playwright.config.ts` or the repo-level `npm run test:e2e`.
- Use deterministic seed helpers from `fixtures/` (add as we implement).
- Tests should log in via explicit setup steps or seeded tokens—no hidden state.
- Each spec must be runnable in isolation with `npx playwright test path/to/spec`.
- `feedback-widget.spec.ts` exercises the floating widget end-to-end using mocked `/api/feedback` responses against the `/e2e/feedback` harness page.
- `poll-create.spec.ts` runs exclusively on `/e2e/poll-create`, a pared-down wizard that mirrors the production flow without Supabase or analytics dependencies. The page now publishes `window.__pollWizardHarness` so specs can tweak wizard settings/state directly (e.g., toggling privacy modes) without relying on brittle checkbox interactions.
- `poll-create-validation.spec.ts` covers the guardrails on the same harness, checking that each step blocks progression until required fields are complete.
- `feedback-widget.spec.ts` now also verifies that analytics events are emitted when the widget opens, via the `AnalyticsTestBridge` helper exposed on `/e2e/feedback`.
- `poll-create.spec.ts` enables the same bridge and asserts that we emit `poll_created` and `poll_share_opened` events when the harness publishes a poll.
- `poll-run.spec.ts` runs against `/e2e/poll-run/[id]`, a poll detail harness that exercises share, start-voting, and vote submission analytics via mocked API responses.
- `poll-production.spec.ts` uses real Supabase auth (test credentials) to create a poll through `/api/polls` and walk the production voting experience end-to-end.
- `locale-switch.spec.ts` mounts the global navigation harness (`/e2e/global-navigation`) so the language selector is available without Supabase auth. All locale persistence assertions (reloads, simulated navigation, UI label changes) stay within that harness by swapping query parameters, which keeps the suite deterministic and CI-friendly. Run this + the other nav/a11y specs locally with `npm run test:e2e:nav` before promoting CI gates.
- `locale-switch.spec.ts` mounts the global navigation harness (`/e2e/global-navigation`) so the language selector is available without Supabase auth. All locale persistence assertions (reloads, simulated navigation, UI label changes) stay within that harness by swapping query parameters, which keeps the suite deterministic and CI-friendly.
- `api-endpoints.spec.ts` drives the REST API harness. It boots `setupExternalAPIMocks(page, { api: true })`, which serves deterministic responses for `/api/auth/*`, `/api/polls`, `/api/dashboard`, `/api/v1/civics/*`, `/api/profile`, `/api/pwa/**`, etc. The spec authenticates once via the mocked `/api/auth/login`, then verifies creation/listing/voting flows, profile updates, WebAuthn routes, civics lookups, dashboard metrics, and PWA endpoints without touching live Supabase services. Update the helper mocks first whenever you add or change API routes so the suite remains offline-friendly.
- The Playwright config automatically boots `npm run dev -- --turbo`. Override with `PLAYWRIGHT_SERVE` or disable with `PLAYWRIGHT_NO_SERVER=1` if you prefer to manage the server manually. Harness pages expose an `__playwrightAnalytics` bridge so specs can opt-in to analytics tracking without touching production flows.
- Cold starts now take ~45 s; export `HARNESS_NAV_TIMEOUT=60000 NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` when running `npx playwright test …` so navigation waits for the initial compile.
- When tunneling or running inside Codespaces/Gitpod, set `ALLOWED_DEV_ORIGINS=https://<tunnel-host>` before `npm run dev` so the CSP includes that origin and `_next/static`/font loads don’t trigger browser warnings.

### MSW & Offline Harnesses
- Specs default to offline mode via `PLAYWRIGHT_USE_MOCKS=1`; MSW handlers in `web/tests/msw/` must mirror production envelopes (`successResponse`, etc.) so contract tests and Playwright stay aligned.
- To sanity-check mocks locally:
  ```bash
  cd web
  PLAYWRIGHT_USE_MOCKS=1 npm run test:e2e -- --grep @api
  ```
- Shipping a new API route requires: (1) handler emits shared envelope, (2) add Jest contract test, (3) extend MSW handler + `setupExternalAPIMocks`, (4) update this README + `docs/TESTING/api-contract-plan.md` coverage matrix.
- `[MSW] Warning: captured "GET /api/...` means the handler is missing—add it before debugging Playwright assertions.
- **Feeds store harness (`/e2e/feeds-store`)**  
  - Exposes `window.__feedsStoreHarness` with:
    - `actions`: `loadFeeds`, `refreshFeeds`, `loadMoreFeeds`, `setFilters`, `clearFilters`, `bookmarkFeed`, `unbookmarkFeed`, `setSelectedCategory`, `resetFeedsState`.
    - `selectors`: `getState()`, `getSummary()`, `getFilters()`, `getFeedById(id)`.
  - Primary data-test ids:
    - Summary: `feeds-total-count`, `feeds-filtered-count`, `feeds-total-available`, `feeds-has-more`, `feeds-remaining`, `feeds-loading`, `feeds-refreshing`, `feeds-error`.
    - Filters/prefs: `feeds-filters-categories`, `feeds-filters-tags`, `feeds-filters-read-status`, `feeds-filters-district`, `feeds-preferences-sort`, `feeds-categories-count`.
    - Feed list: `feeds-filtered-list`, `feed-item-<id>`, `feed-item-<id>-title`, `feed-item-<id>-category`, `feed-item-<id>-tags`, `feed-item-<id>-bookmarked`.
  - Specs should call `resetFeedsState({ preserveFilters?: boolean, preservePreferences?: boolean, preserveRecentSearches?: boolean })` before mutating, then drive interactions through the harness actions and assert against the rendered list.
  - `dashboard-feeds.spec.ts` demonstrates canonical usage (load, filter, bookmark, pagination).

- **Profile store harness (`/e2e/profile-store`) — next scenario plan**  
  - Extend the existing spec with a `privacy-preferences` scenario that:
    - Calls `resetProfile({ preservePreferences: false })`, seeds a profile + `privacy_settings`, then uses harness actions to flip a preference and assert DOM updates (`profile-preferences` test ids).
    - Exercises the export flow by invoking the harness `exportProfile` helper (or triggering the My Data dashboard harness surface) and confirming the download bridge + success banner (mirrors RTL coverage).
    - Injects a failing export path via harness flag to assert error surfaces without leaving stale state.
  - Add supporting helpers in `web/app/(app)/e2e/profile-store/page.tsx` to expose privacy toggle + export actions so Playwright can drive the UI without touching internal state directly.

- **Civics representative/contact harness (planned)**  
  - Target `/e2e/representative-contact` harness (new) that mounts representative cards, countdown badge, and contact modal backed by store hooks.  
  - Scenario outline: load harness, trigger CTA to open contact modal, assert countdown renders (<90 day badge), send message via harness helpers, and verify analytics bridge emits the typed `civics_representative_contact_*` payload.  
  - Error path: simulate failed send to confirm optimistic rollback + error toast behaviour.  
  - Dependencies: expose analytics event log on `window.__representativeContactHarness`, seed representative/contact stores with mock elections + divisions, and reuse `useRepresentativeCtaAnalytics` to drive assertions.

- **Dashboard journey harness (`/e2e/dashboard-journey`)**  
  - Seeds user session, profile, polls, and feature flag state so we can rehearse the post-onboarding dashboard experience without hitting production APIs.
  - `tests/e2e/specs/dashboard-journey.spec.ts` asserts settings persistence, the transition to the feed page, and feed error notifications. The spec reads the persistent notification harness (`window.__notificationHarnessRef`) after forcing a refresh failure, so it no longer relies on the toast DOM and now runs green. Next step: add it to the Playwright CI matrix once traces are captured.

### Troubleshooting
- **Server never boots** → run `PLAYWRIGHT_NO_SERVER=1 npm run test:e2e <spec>` and start `npm run dev` manually (still export `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`).
- **Chunk 500s / `_next/static` MIME errors** → clear `.next`, ensure `npm run dev` restarted after switching branches, and confirm `next.config.js` only applies `splitChunks`/`runtimeChunk` tweaks when `NODE_ENV === 'production'`. Setting `ALLOWED_DEV_ORIGINS` adds extra hosts to the CSP headers if you are not hitting `localhost`.
- **Announcements missing** → inspect `window.__announceLogs` to confirm `ScreenReaderSupport` instrumentation is wired before tweaking test expectations.
- **Locale specs flaky** → `await page.waitForResponse('**/api/i18n/sync')` after `LanguageSelector` interactions so the MSW handler completes before asserting.


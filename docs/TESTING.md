# Testing Guide

_Last updated: January 2026 (RTL component integration patterns, consent guard testing, accessibility testing)_

This guide explains how we exercise the Choices web app and where to add coverage when working on new features or store refactors.

---

## Test Commands

```bash
# From the repository root:
npm run test                  # Delegates to web/test (Jest unit + integration)
npm run test -- <pattern>     # Pass flags straight through to Jest (e.g. --testPathPattern=admin)
npm run test:e2e              # Runs Playwright with the curated web/playwright.config.ts (harness suite)
npm run test:e2e:axe          # Accessibility smoke (chromium, @axe-tagged specs)

# When running Playwright manually, always point at the web config:
cd web && npx playwright test --config=playwright.config.ts
cd web && npx playwright test --config=playwright.config.ts tests/e2e/specs/user-store.spec.ts
```

> ℹ️ **Playwright server lifecycle**
>
> Running `npm run test:e2e` (or any `npx playwright test` invocation that points at `web/playwright.config.ts`) automatically boots a Next.js dev server for you. The `webServer` stanza runs `npm run dev` with the same deterministic harness env vars used in CI (`NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`, `NEXT_DISABLE_REACT_DEV_OVERLAY=1`, etc.), reuses an existing server locally, and times out after 120s on CI so we fail fast if bootstrapping stalls. You only need to start a server manually if you want to attach a debugger/headed browser to an already-running `npm run dev` session—see the “Manual Playwright Startup” checklist below.

### CI Test Jobs (GitHub Actions)

- **Types / Lint**
  - Workflow file: `.github/workflows/types.yml`
  - Installs dependencies with:
    - `cd web && npm ci`
  - Runs:
    - `npm run lint:strict`
    - `npm run types:ci`
  - Local equivalent:
    ```bash
    cd web
    npm run lint:strict
    npm run types:ci
    ```

- **Contracts**
  - Contract tests live under `web/tests/contracts/**`.
  - Local equivalent for a single contract:
    ```bash
    cd web
    npm run test:contracts -- tests/contracts/candidate-journey.contract.test.ts
    ```
  - When adding new contracts:
    - Keep mocks hoisted and avoid referencing `jest.mock`-local variables before initialization (no TDZ/hoist issues).

- **Playwright E2E**
  - CI currently runs the curated Playwright projects defined in `web/playwright.config.ts` (e.g., `chromium`, `api-tests`, `pwa-tests`).
  - When adding new projects:
    - Ensure the CI jobs reference only existing `projects` names.
    - Tag performance-sensitive specs with `@performance` to participate in the `Performance Tests` job.

See also:
- `docs/technical/testing-harness-playbooks.md` for quick-reference workflows
- `docs/ROADMAP_SINGLE_SOURCE.md` for in-flight test gaps and priorities

### Quick Runbook (Copy/Paste)

```bash
# Types, lint, tests baseline (from web/)
cd web
npm run check

# Locale literal-scan (candidate + civics surfaces)
npm run lint:locale

# I18N extraction refresh
npm run i18n:extract

# Full workflow + guardrails live in `docs/INTERNATIONALIZATION.md`.

# E2E smoke (Chromium, key suites)
npm run test:e2e           # autostarts Next dev server via webServer config
npm run test:e2e:axe

# Manual Playwright startup (only when you want to reuse an existing server):
npm run dev                # terminal 1
NEXT_PUBLIC_ENABLE_E2E_HARNESS=1 npx playwright test --config=playwright.config.ts
```

Utilities:
- `npm run lint` — ESLint (use before submitting PRs).
- `npm run lint:hooks` — Focused React Hooks audit (`react-hooks/rules-of-hooks` + `react-hooks/exhaustive-deps` forced to `error`), useful before large refactors.
- `npm run lint:locale` — FormatJS literal-string enforcement for `/app/(app)/candidates/**` and `features/civics/**`; blocks CI if untranslated copy slips in.
- `npm run type-check` — TypeScript project references check.
- `npm run governance:check` — Verifies store/API changes have the required roadmap/doc/changelog updates (CI gate).

## Accessibility Regression (Axe + Screen Readers)

- `npm run test:e2e:axe` — Runs the Playwright axe-tagged suite (also executed in CI via the new **Playwright Axe A11y** job). Keep specs tagged with `@axe` focused on fast dashboards/widgets to maintain sub-5 minute runtime.
- **Manual NVDA sweep** — When charts or navigation paradigms change, run through the Windows NVDA checklist:
  1. `cd web && npm run dev`
  2. Start NVDA (2024.4 or newer) with keyboard layout = desktop.
  3. Visit `/admin/analytics` and tab through Poll Heatmap, Demographics, and Trends dashboards ensuring the new textual summaries are announced (look for “poll engagement heatmap” / “largest age band”).
  4. Record findings in your PR description (e.g., _“NVDA Jan 2026: PollHeatmap, Demographics, Trends readouts verified”_).
- **Screen-reader hooks** — `ScreenReaderSupport.announce` logs are suppressed in production builds; use `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` locally to surface deterministic harness data when testing with NVDA or VoiceOver.

---

## Testing Layers

| Layer | Tooling | What to Cover | Example |
| --- | --- | --- | --- |
| Unit | Jest + ts-jest | Pure functions, store actions, Supabase helpers | `tests/unit/stores/notification.store.test.ts`, `tests/unit/stores/deviceStore.test.ts`, `tests/unit/stores/pwaStore.test.ts`, `tests/unit/stores/widgetStore.keyboard.test.ts`, `tests/unit/features/civics/useElectionCountdown.test.ts`, `tests/unit/api/analytics/election-notifications.test.ts` |
| RTL integration | React Testing Library + Jest | Components that interact with stores, timers, or async flows | `tests/unit/features/analytics/AnalyticsPanel.test.tsx`, `tests/unit/components/PWAStatus.test.tsx`, `tests/unit/components/AppShell.test.tsx` |
| Playwright harness | Playwright | Cross-store and UI journeys, feature flags, notification flows | `tests/e2e/specs/analytics-store.spec.ts`, `tests/e2e/specs/notification-store.spec.ts`, `tests/e2e/specs/pwa-store.spec.ts`, `tests/e2e/specs/widget-dashboard-keyboard.spec.ts` |
| API integration | Jest + supertest (when needed) | Next.js API routes with Supabase mocks | `tests/unit/api/pwa/notifications/subscribe.test.ts`, `tests/unit/api/pwa/notifications/send.test.ts`, `tests/unit/api/analytics/election-notifications.test.ts` |

---

## Harness Pages

We expose store and feature harnesses under `/app/(app)/e2e/*` to keep Playwright suites deterministic (set `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` before starting the dev server if you need to hit them locally):

- `admin-store`
- `analytics-store`
- `app-store`
- `auth-access`
- `admin-navigation`
- `global-navigation`
- `feeds-store`
- `feedback`
  - Floating widget suppresses itself automatically when `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` or when visiting `/e2e/*` pages so axe audits remain deterministic.
- `notification-store`
  - Election countdown notifications now have dedicated unit coverage (`tests/unit/stores/notification.integration.test.tsx` + `tests/unit/features/civics/useElectionCountdown.test.ts`) to assert analytics hooks + dedupe behaviour before wiring Playwright.
- `onboarding-store`

### Harness Patterns

- Every harness sets a `data-*` ready flag (e.g., `document.documentElement.dataset.feedsStoreHarness = 'ready'`) and exposes a typed handle on `window.__<store>Harness`. Playwright helpers wait on both signals before touching store state—see `tests/e2e/specs/feeds-store.spec.ts` for the reference `gotoHarness()` helper.
- Shared utilities such as `waitForPageReady` (`tests/e2e/helpers/e2e-setup.ts`) centralize hydration waits and guarantee we don’t start asserting before providers mount.
- When you add a new harness page, export its TypeScript interface so specs can import it for runtime/compile-time safety.
- Always keep harness state-reset actions close to their store. Most suites call `reset*State()` or `clear*Selections()` in `beforeEach` to avoid leaky state between tests.

#### Harness Implementation Checklist (2026 refresh)

1. Scaffold the page under `app/(app)/e2e/<store>/page.tsx`, wrap it in `'use client'`, and guard it with `if (isProduction && !allowHarness) notFound()`.
2. Expose a typed handle on `window.__<store>Harness` (derive from the store’s selector bundle or `Store` interface—avoid `any` so Playwright specs get autocomplete).
3. Emit readiness markers: set `document.documentElement.dataset.<store>Harness = 'ready'` **and** expose a promise on the harness so `waitForHarnessReady(page, '<store>')` resolves deterministically.
4. Surface deterministic fixtures: when the harness mirrors Supabase/API behaviour, reuse the MSW handlers that Playwright loads when `PLAYWRIGHT_USE_MOCKS=1`.
5. Document the harness by adding it to the list above and linking back to the owning feature/stores in the PR description.

### Shared Test Fixtures

- **Schema-aware API payloads** live under `tests/fixtures/api/**` and power MSW, contract, and Playwright suites. When adding new fixtures, prefer co-locating TypeScript helpers (see `tests/fixtures/api/candidates.ts`) so mocks stay strongly typed.
- **MSW + Playwright parity** is achieved via `tests/msw/server.ts`. Playwright specs can opt into the same handlers by setting `PLAYWRIGHT_USE_MOCKS=1`, which loads the fixture-backed routes defined in MSW for deterministic responses (especially for analytics dashboards and push notifications).
- **Contract + E2E sharing**: `tests/contracts/helpers/request.ts` exports `buildAuthedRequest` and other helpers that Playwright uses via the REST client utilities in `tests/e2e/helpers`. This keeps signatures in sync and prevents drift between suites.
- Document new fixture patterns by updating this file and, when relevant, `tests/e2e/README.md` so other contributors know how to reuse them.

---

## Targeted Examples & Test Conventions

- **Selector verification tests** (`tests/integration/stores/*selector-verification*.test.ts`) instantiate the actual store creator/middleware stack and assert each exported selector points at the expected slice. Use these when refactoring selector bundles (see the polls, app, and pwa store suites for references).
- **Persistence tests** (`tests/integration/stores/*-persistence.test.ts`) hydrate via `createSafeStorage()` to ensure `partialize` payloads survive reloads. Anytime you add/remove persisted fields (app/pwa/poll-wizard stores), update the matching test.
- **RTL component integration tests** (`tests/unit/components/*.test.tsx`) test components that consume stores via selector hooks. These verify that components correctly reflect store state changes and handle edge cases like persistence across remounts. See `tests/unit/components/AppShell.test.tsx` for examples of:
  - Testing theme persistence and system theme resolution
  - Testing sidebar state (collapsed, width, pinned) with edge cases (width clamping, pinning behavior)
  - Verifying components use selector hooks correctly (not direct store access)
  - Testing state persistence across component remounts
- **Consent guard tests** (`tests/unit/stores/analyticsStore.test.ts`) verify that analytics tracking respects user consent. These tests ensure events are not tracked or sent when consent is not given, and that consent status can be checked correctly.
- **API integration suites** (`tests/integration/api/**`) share fixtures with MSW and Playwright. Prefer this layer for Next.js routes with complex Supabase mocking (e.g., candidate verification, device flow).
- **Multi-surface E2E flows**: use `tests/e2e/specs/push-notifications.spec.ts`, `tests/e2e/specs/auth-production.spec.ts`, and `tests/e2e/specs/candidate-verification.spec.ts` as blueprints. They mix harness helpers, REST helpers, and accessibility assertions to keep CI deterministic.

**Conventions**

1. Mirror source paths in test filenames (`web/lib/stores/profileStore.ts` ↔ `web/tests/unit/stores/profileStore.test.ts`).
2. Keep `describe` blocks scoped to the thing under test (`describe('POST /api/...')`, `describe('useProfileActions')`). This keeps reports scannable.
3. Reach for the shared helpers (`tests/msw/server.ts`, `tests/e2e/helpers`, `tests/fixtures/api`) before inventing new ones.
4. Default to the scripted commands (`npm run test:contracts`, `npm run test:integration`, `npm run test:e2e:smoke`, `npm run test:e2e:axe`) so local runs match CI exactly.

## Test Hygiene Conventions (Phase 6)

- Type definitions in tests
  - Prefer `type` aliases over `interface` to satisfy `@typescript-eslint/consistent-type-definitions`.
  - Exception: Global augmentations like `declare global { interface Window { ... } }` should remain `interface` for correct merging; these blocks may include local rule disables.

- Import typing in tests
  - Prefer `typeof import('module')` module typing patterns when mocking:
    - Example:
      - `type I18nModule = typeof import('@/hooks/useI18n')`
      - `const mocked = jest.requireMock('@/hooks/useI18n') as { [K in keyof I18nModule]: jest.Mock }`
  - Avoid inline `import('module').Type` annotations; use module-level `typeof import` or value imports instead.
  - Example (React mocks):
    ```ts
    // Good: avoids self-referential typeof React
    const ReactActual = jest.requireActual<typeof import('react')>('react');
    ```

- Playwright harness
  - Use `web/tests/e2e/playwright.config.ts` as the single config.
  - The standalone server script `tests/e2e/scripts/start-standalone-server.cjs` is Node‑scoped and includes the required `/* eslint-env node */` header and globals (`__dirname`, `process`).
  - Environment flags for deterministic runs:
    - `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`
    - `NEXT_DISABLE_REACT_DEV_OVERLAY=1`
  - Default base URL: `http://localhost:3000` (override with `PLAYWRIGHT_BASE_URL`).

- React controlled inputs in E2E tests
  - **Critical:** The application uses React controlled inputs where form state is managed by React, not the DOM.
  - **Never use `fill()`** for form inputs - it doesn't trigger React's `onChange` handlers, so React state won't update and form validation won't work.
  - **Always use `pressSequentially()`** to properly trigger React's `onChange` handlers:
    ```typescript
    // ❌ WRONG - Button will stay disabled
    await emailInput.fill('test@example.com');
    
    // ✅ CORRECT - React state updates properly
    await emailInput.click();
    await emailInput.pressSequentially('test@example.com', { delay: 20 });
    await page.waitForTimeout(300); // Wait for React to process
    ```
  - The `loginTestUser()` helper in `tests/e2e/helpers/e2e-setup.ts` handles this correctly - always use helper functions when available.
  - See `web/tests/e2e/README.md` for detailed examples and best practices.

## Mocking Patterns (January 2025)

### Supabase Query Chain Mocking

When testing API routes that use Supabase, create shared query chain instances in `beforeEach` to ensure proper test isolation:

```typescript
describe('API Route Tests', () => {
  let queryChain: any;
  let mockSupabase: any;

  beforeEach(async () => {
    // Create a reusable query builder chain
    queryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null })
    };

    // Setup mock Supabase - return the same chain instance
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ /* ... */ })
      },
      from: jest.fn(() => queryChain)
    };

    // Configure mocks before importing handler
    jest.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);
  });

  it('should handle query correctly', async () => {
    // Configure the query chain response for this test
    queryChain.maybeSingle.mockResolvedValue({
      data: { /* test data */ },
      error: null
    });

    // Test the handler
    const response = await POST(mockRequest);
    // Assertions...
  });
});
```

**Key Points:**
- Create query chain instances in `beforeEach` for test isolation
- Use `mockReturnThis()` for chained methods (select, eq, order, etc.)
- Configure `maybeSingle`, `insert`, `update` responses per test case
- Import the handler **after** setting up mocks

### Logger Mocking Pattern

For modules that use default exports for logger:

```typescript
jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
  };
});
```

**Key Points:**
- Use `__esModule: true` to support ES module imports
- Provide both `default` and named export for compatibility
- Works for both `import logger from '@/lib/utils/logger'` and `import { logger } from '@/lib/utils/logger'`

### API Response Structure

When testing API routes that use `validationError()`:

- **Correct:** `data.details?.code` or `data.details?.rate`
- **Incorrect:** `data.fieldErrors?.code` or `data.error` (for validation errors)

The `validationError()` function from `@/lib/api` returns responses with this structure:
```typescript
{
  success: false,
  error: "Validation failed", // Default message
  details: { // The validation errors object
    code: "Error message here",
    // or
    rate: "Too many requests"
  },
  code: "VALIDATION_ERROR"
}
```

**Key Points:**
- Validation errors are in `data.details`, not `data.fieldErrors`
- The main error message is in `data.error` (usually "Validation failed")
- Specific field errors are in `data.details[fieldName]`

These conventions are enforced by the repo ESLint configuration and should keep test suites lint‑clean and consistent.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD


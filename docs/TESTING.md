# Testing Guide

_Last updated: November 30, 2025_

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

See also:
- `docs/technical/testing-harness-playbooks.md` for quick-reference workflows
- `docs/ROADMAP_SINGLE_SOURCE.md` for in-flight test gaps and priorities

### Quick Runbook (Copy/Paste)

```bash
# Types, lint, tests baseline (from web/)
cd web
npm run check

# I18N extraction refresh
npm run i18n:extract

# E2E smoke (Chromium, key suites)
npm run test:e2e
npm run test:e2e:axe
```

Utilities:
- `npm run lint` — ESLint (use before submitting PRs).
- `npm run type-check` — TypeScript project references check.
- `npm run governance:check` — Verifies store/API changes have the required roadmap/doc/changelog updates (CI gate).

---

## Testing Layers

| Layer | Tooling | What to Cover | Example |
| --- | --- | --- | --- |
| Unit | Jest + ts-jest | Pure functions, store actions, Supabase helpers | `tests/unit/stores/notification.store.test.ts`, `tests/unit/stores/deviceStore.test.ts`, `tests/unit/stores/pwaStore.test.ts`, `tests/unit/stores/widgetStore.keyboard.test.ts`, `tests/unit/features/civics/useElectionCountdown.test.ts`, `tests/unit/api/analytics/election-notifications.test.ts` |
| RTL integration | React Testing Library + Jest | Components that interact with stores, timers, or async flows | `tests/unit/features/analytics/AnalyticsPanel.test.tsx`, `tests/unit/components/PWAStatus.test.tsx` |
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

---

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

- Playwright harness
  - Use `web/tests/e2e/playwright.config.ts` as the single config.
  - The standalone server script `tests/e2e/scripts/start-standalone-server.cjs` is Node‑scoped and includes the required `/* eslint-env node */` header and globals (`__dirname`, `process`).
  - Environment flags for deterministic runs:
    - `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`
    - `NEXT_DISABLE_REACT_DEV_OVERLAY=1`
  - Default base URL: `http://localhost:3000` (override with `PLAYWRIGHT_BASE_URL`).

These conventions are enforced by the repo ESLint configuration and should keep test suites lint‑clean and consistent.

---

## Recent Updates (November 2025)

### CI Gates

All test gates are now blocking in CI:
- **Lint**: `npm run lint:strict` (blocking, `--max-warnings=0`)
- **Type Check**: `tsc --noEmit` (blocking)
- **Unit Tests**: Jest unit tests (blocking)
- **Contract Tests**: `npm run test:contracts` (blocking)
- **Smoke Tests**: `npm run test:e2e:smoke` (blocking)

See `.github/workflows/ci.yml` for the complete CI pipeline.

### Testing Best Practices

1. **Store Tests**: Use `create<Store>()(immer(<store>Creator))` for unit tests. Avoid browser APIs in store creators.
2. **API Tests**: Use contract tests to verify API request/response schemas match Zod validation.
3. **E2E Tests**: Use harness pages (`/app/(app)/e2e/*`) for deterministic Playwright tests.
4. **Mock Data**: Replace mock analytics data with real Supabase queries where possible (see `docs/ANALYTICS_REAL_DATA_STATUS.md`).

### Security Testing

- **Rate Limiting**: Test rate limit behavior in API route tests
- **Input Validation**: Verify Zod schemas reject invalid inputs
- **Log Sanitization**: Ensure sensitive data is not logged in tests

See `docs/RATE_LIMITING_AUDIT.md`, `docs/INPUT_VALIDATION_AUDIT.md`, and `docs/SENSITIVE_LOG_AUDIT.md` for security testing patterns.
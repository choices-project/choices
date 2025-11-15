# Testing Guide

_Last updated: November 13, 2025 (widget keyboard coverage added)_

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

Utilities:
- `npm run lint` — ESLint (use before submitting PRs).
- `npm run type-check` — TypeScript project references check.

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
# Testing Guide

_Last updated: November 13, 2025_

This guide explains how we exercise the Choices web app and where to add coverage when working on new features or store refactors.

---

## Test Commands

```bash
# From the repository root:
npm run test                  # Delegates to web/test (Jest unit + integration)
npm run test -- <pattern>     # Pass flags straight through to Jest (e.g. --testPathPattern=admin)
npm run test:e2e              # Runs Playwright with the curated web/playwright.config.ts (harness suite)

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
| Unit | Jest + ts-jest | Pure functions, store actions, Supabase helpers | `tests/unit/stores/notification.store.test.ts`, `tests/unit/stores/deviceStore.test.ts`, `tests/unit/stores/pwaStore.test.ts` |
| RTL integration | React Testing Library + Jest | Components that interact with stores, timers, or async flows | `tests/unit/features/analytics/AnalyticsPanel.test.tsx`, `tests/unit/components/PWAStatus.test.tsx` |
| Playwright harness | Playwright | Cross-store and UI journeys, feature flags, notification flows | `tests/e2e/specs/analytics-store.spec.ts`, `tests/e2e/specs/notification-store.spec.ts`, `tests/e2e/specs/pwa-store.spec.ts` |
| API integration | Jest + supertest (when needed) | Next.js API routes with Supabase mocks | TBD; follow roadmap tasks |

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
- `notification-store`
- `onboarding-store`
- `onboarding-flow`
- `poll-create`
- `poll-run/[id]`
- `poll-wizard`
- `polls-store`
- `profile-store` *(see profile harness plan below for upcoming privacy/export scenario)*
- `pwa-analytics`
- `pwa-store`
- `dashboard-journey` *(seeds user/profile/polls state for the post-onboarding dashboard journey; current Playwright spec `dashboard-journey.spec.ts` is marked `fixme` while we resolve a `PersonalDashboard` “Maximum update depth exceeded” loop surfaced in harness mode.)*
- `user-store`
- `voting-store`
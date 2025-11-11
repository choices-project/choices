# Testing Guide

_Last updated: November 10, 2025_

This guide explains how we exercise the Choices web app and where to add coverage when working on new features or store refactors.

---

## Test Commands

```bash
# From the repository root:
npm run test                 # Delegates to web/test (Jest unit + integration)
npm run test -- <pattern>    # Pass flags straight through to Jest (e.g. --testPathPattern=admin)

# Direct Playwright usage remains unchanged:
npx playwright test          # Playwright end-to-end suites
npx playwright test <spec>   # Run a specific Playwright file
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
| Playwright harness | Playwright | Cross-store and UI journeys, feature flags, notification flows | `tests/e2e/specs/analytics-store.spec.ts`, `tests/e2e/specs/notification-store.spec.ts` |
| API integration | Jest + supertest (when needed) | Next.js API routes with Supabase mocks | TBD; follow roadmap tasks |

---

## Harness Pages

We expose store and feature harnesses under `/app/(app)/e2e/*` to keep Playwright suites deterministic:

- `admin-store`
- `analytics-store`
- `app-store`
- `notification-store`
- `onboarding-store`
- `poll-create`
- `poll-run/[id]`
- `poll-wizard`
- `polls-store`
- `profile-store`
- `user-store`

Each harness registers a `window.__<feature>Harness` object so Playwright tests can drive state transitions without touching production pages. When modernizing a store, add a harness + spec to mirror the notification-store pattern.

---

## Writing New Tests

1. **Identify the layer** (unit, RTL, Playwright) that best matches the behaviour you need to verify.
2. **Leverage helpers**:
   - `tests/setup.ts` provides global mocks (TextEncoder, crypto, etc.).
   - `tests/helpers/e2e-setup.ts` contains Playwright navigation helpers.
3. **Keep tests deterministic** — mock timers with `jest.useFakeTimers({ legacyFakeTimers: true })` when stores schedule timeouts (notifications, admin banners, etc.).
4. **Document coverage** — update the relevant store checklist (`scratch/gpt5-codex/store-roadmaps/…`) and mention new suites in PR descriptions. Recent additions: device & PWA store unit suites, `PWAStatus` RTL coverage, and `adminUserSelectors` unit coverage.

---

## Gaps & TODOs

- Add Jest coverage for analytics client utilities once Supabase endpoints are unmocked.
- Stand up Playwright specs for polls, admin dashboards, and feed personalization after harness pages are created.
- Evaluate K6/load testing scripts once the Supabase analytics pipeline is stable.

For questions, sync with the web platform team in `#web-platform`.

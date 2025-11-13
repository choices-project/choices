# Testing Harness Playbooks (Quick Reference)

_Last updated: November 12, 2025_

This page highlights the key testing workflows and points to the archived deep dives kept for historical context.

## Commands to Remember

```bash
npm run test             # Jest unit + integration suites
npm run test:e2e         # Playwright harness suite (web/playwright.config.ts)
PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:staging    # Hit staging services
PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:production # Read-only prod smoke
```

When invoking Playwright manually, always target the `web` config:

```bash
cd web && npx playwright test --config=playwright.config.ts
cd web && npx playwright test --config=playwright.config.ts tests/e2e/specs/user-store.spec.ts
```

## Harness Coverage Snapshot

- Store harness pages: `admin-store`, `analytics-store`, `app-store`, `auth-access`, `feeds-store`, `feedback`, `notification-store`, `onboarding-store`, `onboarding-flow`, `poll-create`, `poll-run/[id]`, `poll-wizard`, `polls-store`, `profile-store`, `pwa-analytics`, `pwa-store`, `user-store`, `voting-store`.
- MSW fixtures live under `web/tests/msw/`. Use `setupExternalAPIMocks(page, { auth: true })` for Playwright and `tests/setup.ts` for Jest.
- Shared guidance on modernization + selectors: `docs/STATE_MANAGEMENT.md`.

## Where to Dive Deeper

| Topic | Archived Reference |
| --- | --- |
| Authentication & passkey harness | `docs/archive/reference/testing/AUTH.md` |
| Onboarding flow plan & scenarios | `docs/archive/reference/testing/ONBOARDING.md` |
| Additional harness guidance | `web/tests/e2e/README.md` (active) |

## Quick Tips

- Set `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` when running harness pages locally.
- Prefer `findBy*` queries in RTL tests to allow harness hydration.
- Keep MSW handlers in sync with Supabase schema changes to avoid brittle mocks.

Update this summary whenever new harnesses or workflows are introduced.

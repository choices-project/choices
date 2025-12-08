# Testing Status - Current

> Canonical testing strategies live under [`docs/testing/`](../../docs/testing).  
> Use this file for a quick snapshot; update the docs for detailed procedures.

**Date**: November 30, 2025  
**Last Run**: Pending automated CI sweep

---

## Summary

- ✅ Reactivated end-to-end coverage for the feedback widget (`tests/e2e/specs/feedback-widget.spec.ts`).
- ✅ Added server-side unit tests for session cookies, differential privacy budgets, cache invalidation helpers, and electoral schemas.
- ✅ Added ranked voting strategy unit coverage to guard validation, processing, and instant-runoff results.
- ✅ Removed duplicated legacy `logic-verification` suite from the archive in favour of targeted, deterministic tests.
- ✅ Playwright config now boots `npm run dev -- --turbo` automatically (configurable via env) so CI/local runs require fewer manual steps.
- ✅ Poll authoring now executes against the deterministic `/e2e/poll-create` harness (plus unit coverage for `pollWizardStore` gating logic) instead of the flaky Supabase-backed flow.
- ⚠️ Integration suite still empty; archived API and analytics journeys remain to be ported once environments support live Supabase auth.

---

## Current Issues

- **Integration coverage gap**: `tests/integration/` has no active specs. We still need smoke coverage for multi-service flows (auth ↔ polls ↔ analytics).
- **Supabase-dependent E2E**: Archived journeys require real database fixtures. Reintroduction is blocked on stable seeded data.
- **CI parity**: New unit tests run in the Node project; Playwright specs expect a running dev server. Add a `webServer` command or document manual startup for CI.

---

## Notable Passing Suites

- `web/tests/unit/auth/session-cookies.test.ts` – environment guard rails.
- `web/tests/unit/privacy/differential-privacy.test.ts` – epsilon allocation + deterministic noise.
- `web/tests/unit/cache/cache-invalidation.test.ts` – wildcard expansion and queue teardown.
- `web/tests/unit/electoral/schemas.test.ts` – runtime type validation defaults.
- `web/tests/unit/vote/ranked-strategy.test.ts` – ranked-choice validation, submission metadata, and IRV results.
- `web/tests/e2e/specs/poll-create.spec.ts`, `web/tests/e2e/specs/poll-create-validation.spec.ts` & `web/tests/e2e/specs/feedback-widget.spec.ts` – Playwright journeys with route stubbing + harnesses (poll & feedback specs now assert analytics events in addition to UI flows).
- `web/tests/e2e/specs/poll-run.spec.ts` – Harnessed poll detail journey validating share flow, start voting CTA, and vote telemetry via `__playwrightAnalytics` bridge.
- `web/tests/e2e/specs/poll-production.spec.ts` – Credentials-backed journey that logs in with real Supabase auth, creates a poll through `/api/polls`, and votes via the production UI.
- `web/tests/unit/polls/poll-wizard.store.test.ts` – wizard state validation without localStorage persistence.
- `web/tests/unit/polls/poll-milestones.test.ts` – verifies milestone preferences hydrate from `localStorage` and persist updates.

---

## Next Steps

1. **Port critical API E2E flows**: Prioritise `/api/polls` happy path with request stubbing so it can run without Supabase.
2. **Backfill integration smoke tests**: Add a thin Jest project under `tests/integration/` once shared fixtures are ready.
3. **Automate Playwright startup**: Update `tests/e2e/playwright.config.ts` with a `webServer` command (e.g. `npm run dev`) for CI friendliness.
4. **Run full Jest suite**: Confirm the new server-side tests pass on CI (`npm test`).

---

## Useful Commands

```bash
npm test -- web/tests/unit/auth/session-cookies.test.ts
npm test -- web/tests/unit/privacy/differential-privacy.test.ts
npx playwright test web/tests/e2e/specs/feedback-widget.spec.ts --config=web/tests/e2e/playwright.config.ts
```

---

## Status

**Overall**: ✅ Infrastructure healthy & docs current  
**Coverage**: ⚠️ Integration backlog  
**Focus**: Migrate remaining archive flows with modern helpers

## Recent Changes (November 30, 2025)

- ✅ Archived duplicate `AuthSetupStep.test.tsx` (kept version in `unit/features/onboarding/`)
- ✅ Archived 21 production monitoring test files (`choices-app-*.spec.ts`) to `archive/production-monitoring/`
- ✅ Archived outdated E2E documentation reports to `archive/outdated-docs/`
- ✅ Updated test directory structure documentation
- ✅ Created `TEST_AUDIT_REPORT.md` documenting the audit


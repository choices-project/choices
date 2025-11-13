# Testing Guide

**Last Updated**: November 7, 2025

---

## Canonical Testing Docs

- Global auth guidance: [`docs/testing/AUTH.md`](../../docs/testing/AUTH.md)
- Onboarding harness plan: [`docs/testing/ONBOARDING.md`](../../docs/testing/ONBOARDING.md)
- Passkey rollback runbook: [`docs/operations/passkey-rollback-playbook.md`](../../docs/operations/passkey-rollback-playbook.md)

Use this README for quick commands; update the docs above for authoritative instructions.

---

## Quick Start

### Poll Creation Regression
```bash
# Run targeted unit coverage for the poll authoring flow
npm test -- web/tests/unit/polls/create-poll.schema.test.ts
npm test -- web/tests/unit/polls/create-poll.api.test.ts
npm test -- web/tests/unit/polls/poll-wizard.store.test.ts
npm test -- web/tests/unit/polls/poll-milestones.test.ts

# Exercise the happy-path wizard journey (uses the lightweight local Playwright config)
npx playwright test web/tests/e2e/specs/poll-create.spec.ts --config=web/tests/e2e/playwright.config.ts
# Exercise validation guardrails (checks the wizard refuses to advance with missing fields)
npx playwright test web/tests/e2e/specs/poll-create-validation.spec.ts --config=web/tests/e2e/playwright.config.ts

# Verify feedback widget analytics instrumentation
npx playwright test web/tests/e2e/specs/feedback-widget.spec.ts --config=web/tests/e2e/playwright.config.ts --grep "analytics"

# Verify poll authoring analytics instrumentation
npx playwright test web/tests/e2e/specs/poll-create.spec.ts --config=web/tests/e2e/playwright.config.ts --grep "analytics"

# Verify poll detail analytics instrumentation
npx playwright test web/tests/e2e/specs/poll-run.spec.ts --config=web/tests/e2e/playwright.config.ts

# Production-backed journey (requires E2E_USER_* env vars)
npx playwright test web/tests/e2e/specs/poll-production.spec.ts --config=web/tests/e2e/playwright.config.ts
```

### Feedback Widget Smoke
```bash
# Validate the floating widget UI and submission payload
npx playwright test web/tests/e2e/specs/feedback-widget.spec.ts --config=web/tests/e2e/playwright.config.ts
```

### Full Suites
```bash
npm test             # runs all Jest projects
npm run test:e2e     # Playwright suite (configured in package.json)
# from repo root you can also run: npm run test:e2e
```

> Tip: the Playwright spec stubs the `/api/polls` request, so it is safe to run against `npm run dev` without a Supabase backend. Set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` if you are using a non-default port.
>
> Playwright now starts the Next.js dev server automatically via `npm run dev -- --turbo`. Set `PLAYWRIGHT_NO_SERVER=1` to skip (e.g. when the app is already running) or customise the command with `PLAYWRIGHT_SERVE="next start"`.
>
> When you need a production build (to avoid dev overlays), use `PLAYWRIGHT_SERVE="npm run start:playwright"`. The feedback widget suite exercises the lightweight harness at `/e2e/feedback` so it stays isolated from heavier app flows.
>
> The poll creation journey now targets the dedicated harness page at `/e2e/poll-create`, which mirrors the wizard without depending on analytics stores or persisted state. This keeps CI runs fast and deterministic.

---

## Test Users

✅ **Admin**: `michaeltempesta@gmail.com` (password in `.env.test.local`)  
✅ **Regular**: `anonysendlol@gmail.com` (password in `.env.test.local`)

---

## Test Structure

```
web/tests/
├── e2e/              ← Active Playwright specs (canonical suite lives in specs/)
├── unit/             ← Jest unit coverage (polls/, vote/, privacy/, etc.)
├── api/              ← API surface tests executed via Jest
└── archive/          ← Legacy suites kept for reference only
```

---

## Documentation

- **Canonical references**  
  - [`docs/testing/AUTH.md`](../../docs/testing/AUTH.md) – Auth/Playwright harness strategy  
  - [`docs/testing/ONBOARDING.md`](../../docs/testing/ONBOARDING.md) – Upcoming onboarding plan  
  - [`docs/operations/passkey-rollback-playbook.md`](../../docs/operations/passkey-rollback-playbook.md) – Rollback procedure

- **Local indexes**  
  - [`e2e/README.md`](./e2e/README.md) – Playwright configuration & helpers  
  - [`TEST_STATUS.md`](./TEST_STATUS.md) – Snapshot of current suites (links back to canonical docs)

---

## Running Tests

### All Tests
```bash
npm run test:e2e        # Playwright
npm test                # Jest (both client + server projects)
```

### Specific Tests
```bash
npx playwright test web/tests/e2e/specs/poll-create.spec.ts --config=web/tests/e2e/playwright.config.ts
npm test -- web/tests/unit/polls/
npm test -- web/tests/unit/vote/ranked-strategy.test.ts
```

### Interactive
```bash
npm run test:e2e:ui     # Playwright UI
npx playwright test --ui --config=web/tests/e2e/playwright.config.ts
npm run test:e2e:debug  # Debug mode (headed)
```

---

## Test Users & Auth

All legacy suites assumed **real Supabase authentication**. Most new Playwright specs now stub network calls where appropriate; if you need to exercise real auth, keep the original `.env.test.local` credentials handy and remove the `page.route('**/api/...')` overrides in your spec.

---

**Status**: ✅ Infrastructure Ready  
**Next**: Continue migrating legacy specs from `tests/archive/` into the rebuilt `web/tests/e2e/specs/` and `web/tests/unit/` directories.

## Playwright Suite (Rebuilt)

For the canonical Playwright/auth/onboarding guidance, see:
- [`docs/testing/AUTH.md`](../../../docs/testing/AUTH.md)
- [`docs/testing/ONBOARDING.md`](../../../docs/testing/ONBOARDING.md)

- All scenarios belong under `specs/`, one journey per file.
- Use deterministic seed helpers from `fixtures/` (add as we implement).
- Tests should log in via explicit setup steps or seeded tokens—no hidden state.
- Each spec must be runnable in isolation with `npx playwright test path/to/spec`.
- `feedback-widget.spec.ts` exercises the floating widget end-to-end using mocked `/api/feedback` responses against the `/e2e/feedback` harness page.
- `poll-create.spec.ts` runs exclusively on `/e2e/poll-create`, a pared-down wizard that mirrors the production flow without Supabase or analytics dependencies.
- `poll-create-validation.spec.ts` covers the guardrails on the same harness, checking that each step blocks progression until required fields are complete.
- `feedback-widget.spec.ts` now also verifies that analytics events are emitted when the widget opens, via the `AnalyticsTestBridge` helper exposed on `/e2e/feedback`.
- `poll-create.spec.ts` enables the same bridge and asserts that we emit `poll_created` and `poll_share_opened` events when the harness publishes a poll.
- `poll-run.spec.ts` runs against `/e2e/poll-run/[id]`, a poll detail harness that exercises share, start-voting, and vote submission analytics via mocked API responses.
- `poll-production.spec.ts` uses real Supabase auth (test credentials) to create a poll through `/api/polls` and walk the production voting experience end-to-end.
- The Playwright config automatically boots `npm run dev -- --turbo`. Override with `PLAYWRIGHT_SERVE` or disable with `PLAYWRIGHT_NO_SERVER=1` if you prefer to manage the server manually. Harness pages expose an `__playwrightAnalytics` bridge so specs can opt-in to analytics tracking without touching production flows.
- **Coming soon:** `feeds-store.spec.ts` + `/e2e/feeds-store` harness and a dashboard-focused spec will cover feed filters, bookmarks, pagination, and analytics/notifications once the auth harness is green and feed fixtures land.


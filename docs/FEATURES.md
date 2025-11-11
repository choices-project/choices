# Feature Inventory — November 2025

_Last updated: November 9, 2025_

The table below reflects the current maturity of the major product surfaces. Rows are intentionally concise—see the linked files or code locations for deeper implementation notes.

| Feature | Status | Notes & Follow-up |
| --- | --- | --- |
| Poll creation & voting | ✅ Stable | Wizard, sharing, and vote recording operate against live Supabase tables. Modernization work is focused on the surrounding stores (polls, poll wizard, voting) and regression coverage. |
| Notification system | ✅ Stable | Store refactor complete; React integration updated to the shared hooks; Playwright harness ensures auto-dismiss/admin flows keep working. Continue migrating remaining consumers away from legacy selectors. |
| Onboarding & profile | 🔄 In progress | Profile store modernization underway; onboarding flows consume refactored selectors but still rely on older Supabase mocks in tests. Additional RTL and Playwright coverage is planned. |
| Admin dashboard | 🚧 Needs attention | Feature flag UI uses modern hooks, but analytics widgets still reference mocked data and legacy store patterns. Admin store refactor and Supabase-backed analytics endpoints are on the roadmap. |
| Analytics & reporting | 🚧 Needs attention | UI components exist (charts, heatmaps), yet the backing APIs remain partially mocked and Redis caching is experimental. Privacy filter enforcement and end-to-end validation are outstanding. |
| Civic data (representatives, actions) | ✅ Stable foundation | Core queries and UI flows function, but we lack modern integration tests. Future iterations should align these modules with the refreshed store standards. |
| PWA & offline features | ⚠️ Lightly exercised | Service worker, push notifications, and background sync are present but not covered by current regression suites. Re-validate before promising offline guarantees. |

---

## Recent Changes

- Notification store refactor landed with jest + RTL + Playwright coverage.
- Admin notification widget now consumes shared hooks reducing bespoke logic.
- Documentation and roadmap are being refreshed to remove outdated “perfect completion” claims.

---

## Open Threads

1. **Store modernization rollout** — Track progress in `scratch/gpt5-codex/store-roadmaps/` and update this file as additional stores reach "stable" status.
2. **Analytics data pipeline** — Replace mock responses with Supabase queries and document the privacy model before advertising analytics as complete.
3. **Testing coverage** — Ensure each feature row above maps to at least one unit suite and, where practical, a harness-driven E2E scenario.

---

## References

- Technical roadmap: `docs/ROADMAP.md`
- State management standards: `docs/STATE_MANAGEMENT.md`
- Testing overview: `docs/TESTING.md`
- Architecture overview: `docs/ARCHITECTURE.md`


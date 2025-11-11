# Project Status — November 2025

_Last updated: November 9, 2025_

The Choices platform is mid-stream on a modernization pass. Core civic features remain available, but several stores, docs, and analytics surfaces still require investment before we can claim production readiness.

---

## Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Store modernization | 🔄 In progress | Notification store complete with integration + E2E coverage; profile/user stores partially migrated; app/admin/polls stores queued. |
| Documentation | 🔄 In progress | Core docs are being refreshed; legacy “100% complete” narratives are being archived. |
| Testing | 🚧 Needs expansion | Jest suites cover key stores; Playwright harnesses exist for profile + notification stores; analytics and civic flows still lack modern coverage. |
| Analytics dashboard | 🚧 Partially wired | UI components exist, but endpoints rely on mocks and Redis caching experiments. |
| Admin tooling | 🔄 Being refit | Feature flag UI and notification system now consume shared hooks; broader audit tooling still references legacy patterns. |
| Civic/notifications UX | ✅ Stable surface | Poll creation, onboarding, and notifications flows run on refactored APIs but still need ongoing regression coverage. |

---

## Recent Highlights

- **Notification store** migrated to the shared creator/selectors pattern with unit, RTL integration, and new Playwright harness coverage (`/e2e/notification-store`).
- **Admin notification widget** updated to consume shared hooks, aligning admin toasts with global behaviour.
- **Documentation cleanup** underway: development guide refreshed, modernization guidelines captured, and outdated “perfect completion” docs queued for archival.

---

## Active Workstreams

1. **Store modernization (Q4 2025)**  
   Complete app/admin/polls store refactors, publish helper hooks, and backfill unit + harness coverage for each store.

2. **Documentation refresh (Nov–Dec 2025)**  
   Replace legacy status/feature docs with accurate inventories, produce testing/state-management guides, and archive superseded references.

3. **Analytics & admin debt**  
   Replace mock analytics endpoints with Supabase-backed queries, re-enable Redis caching once typing debt is cleared, and tighten admin feature flag + audit logging flows.

---

## Known Gaps & Risks

- **TypeScript debt**: `TS2589` recursion and strict optional property errors persist in profile, feeds, and analytics modules.
- **Testing coverage**: Analytics dashboards, civic engagement flows, and feature flag toggles have minimal Jest/Playwright coverage.
- **Docs accuracy**: Several markdown files still advertise “fully complete” features; these are being rewritten or archived.
- **Analytics data**: Dashboard charts currently rely on stubbed data; real aggregation and privacy filters are pending.

---

## Next Milestones

| Target | Description | Status |
| --- | --- | --- |
| Notification docs shipped | Finalize modernization + harness notes in core docs | 🔄 |
| App/admin store refactor | Apply shared creator/selectors and add smoke tests | 🔄 |
| Analytics endpoint audit | Replace mocks with Supabase queries + Redis guardrails | ⏳ |
| Documentation archival pass | Move legacy “perfect completion” docs into `/docs/archive` | 🔄 |

---

## References

- Store modernization checklist: `scratch/gpt5-codex/store-roadmaps/notification-store-checklist.md`
- Technical roadmap: `docs/ROADMAP.md`
- Testing strategy: `docs/TESTING.md`
- State management standards: `docs/STATE_MANAGEMENT.md`

For ongoing progress notes, continue tracking in the `/scratch` workspace directories.


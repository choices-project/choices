# Project Status — January 2026

_Last updated: January 2026_

The Choices platform is mid-stream on a modernization pass. Core civic features remain available, but several stores, docs, and analytics surfaces still require investment before we can claim production readiness.

**Recent Updates (December 2024):**
- ✅ All critical environment variables configured in Vercel (26 total)
- ✅ Fixed critical table name mismatch (`representative_follows` vs `user_followed_representatives`)
- ✅ Store modernization largely complete (most stores follow creator pattern)

---

## Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Store modernization | 🔄 In progress | Notification store complete with integration + E2E coverage; profile/user stores partially migrated; app/admin/polls stores queued. |
| Documentation | ✅ Current | Core docs refreshed; scratch materials archived; single-source roadmap established. |
| Testing | 🚧 Needs expansion | Jest suites cover key stores; Playwright harnesses exist for profile + notification stores; analytics and civic flows still lack modern coverage. |
| Analytics dashboard | ✅ Real data live | Supabase-backed endpoints (`/api/analytics/**`, unified API) with privacy-aware queries, Redis caching, and admin gating; see `docs/ANALYTICS_PIPELINE.md`. |
| Admin tooling | 🔄 Being refit | Feature flag UI and notification system now consume shared hooks; broader audit tooling still references legacy patterns. |
| Civic/notifications UX | ✅ Stable surface | Poll creation, onboarding, and notifications flows run on refactored APIs but still need ongoing regression coverage. |

---

## Recent Highlights

- **OpenStates ingest overhaul** — Parser/stager now capture biographies, aliases, extras, expanded office metadata, and identifier maps; downstream enrichers + preview tooling surface the full dataset.
- **Notification store** migrated to the shared creator/selectors pattern with unit, RTL integration, and new Playwright harness coverage (`/e2e/notification-store`).
- **Admin notification widget** updated to consume shared hooks, aligning admin toasts with global behaviour.
- **Voter registration CTA shipped** — Address lookup now renders state-specific registration links, Vote.gov guidance, and status checks backed by the new Supabase table + modernized store.
- **Documentation cleanup** underway: development guide refreshed, modernization guidelines captured, and outdated “perfect completion” docs queued for archival.
- **Analytics funnels & KPIs** — `/api/analytics/funnels` + `/api/analytics/kpi` power the new dashboard funnel + KPI widgets; Playwright now covers admin feature-flag toggles via harness + API.

---

## Active Workstreams

1. **Store modernization (Q4 2025)**  
   Complete app/admin/polls store refactors, publish helper hooks, and backfill unit + harness coverage for each store.

2. **Documentation refresh (Nov–Dec 2025)**  
   Replace legacy status/feature docs with accurate inventories, produce testing/state-management guides, and archive superseded references.

3. **Analytics & admin follow-through**  
   Monitor Redis cache health, expand accessibility audits on analytics dashboards, and keep admin audit logs/feature-flag tooling aligned with the new data surfaces.

---

## Civics Ingest Status (OpenStates)

- Phase 2 — Validation harness: In progress. Staging fixtures and CLI smoke-test template to be added (see `services/civics-backend/ROADMAP.md`).
- Phase 3 — Crosswalk + dedupe automation: Planned. API call optimization matrix pending implementation.
- Phase 4 — Types: Next schema change will trigger Supabase types regeneration (run `cd web && npm run types:generate`).
- Phase 5 — Documentation: High-level ingest summary will be maintained here; detailed runbooks under `services/supabase-operations-guide.md`.

References:
- Single-source roadmap entries: `docs/ROADMAP_SINGLE_SOURCE.md` (Section E)
- Backend plan: `services/civics-backend/ROADMAP.md`

---

## Civics Ingest Status (OpenStates)

- Phase 2 — Validation harness: In progress. Staging fixtures and CLI smoke-test template to be added (see `services/civics-backend/ROADMAP.md`).
- Phase 3 — Crosswalk + dedupe automation: Planned. API call optimization matrix pending implementation.
- Phase 4 — Types: Next schema change will trigger Supabase types regeneration (run `cd web && npm run types:generate`).
- Phase 5 — Documentation: High-level ingest summary will be maintained here; detailed runbooks under `services/supabase-operations-guide.md`.

References:
- Single-source roadmap entries: `docs/ROADMAP_SINGLE_SOURCE.md` (Section E)
- Backend plan: `services/civics-backend/ROADMAP.md`

---

## Known Gaps & Risks

- **TypeScript debt**: `TS2589` recursion remains in several feeds/store modules; strict optional property errors are now limited to legacy feeds/contact routes (analytics/profile surfaces compile under `npm run types:strict-optional`).
- **Testing coverage**: Analytics dashboards, civic engagement flows, and feature flag toggles have minimal Jest/Playwright coverage.
- **Docs accuracy**: Several markdown files still advertise “fully complete” features; these are being rewritten or archived.
- **Analytics accessibility**: Text alternatives and axis summaries still need to be hardened for screen readers despite the real-data rollout.

---

## Next Milestones

| Target | Description | Status |
| --- | --- | --- |
| Notification docs shipped | Finalize modernization + harness notes in core docs | 🔄 |
| App/admin store refactor | Apply shared creator/selectors and add smoke tests | 🔄 |
| OpenStates ingest QA harness | Add fixture-based staging test + Supabase smoke-test script | 🔄 |
| Analytics endpoint audit | Replace mocks with Supabase queries + Redis guardrails | ✅ |
| Documentation archival pass | Move legacy “perfect completion” docs into `/docs/archive` | 🔄 |

---

## References

- Technical roadmap (single source): `docs/ROADMAP_SINGLE_SOURCE.md`
- Testing strategy: `docs/TESTING.md`
- State management standards: `docs/STATE_MANAGEMENT.md`

For ongoing progress updates, track in `docs/ROADMAP_SINGLE_SOURCE.md`.


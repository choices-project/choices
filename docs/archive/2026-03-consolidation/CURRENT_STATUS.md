# Project Status — March 2026

_Last updated: March 2026 (2026-03-13)_

The Choices platform MVP is **complete and production-ready**. All core features are implemented, tested, and documented. Active development continues on enhancements and optimizations.

**MVP Status: ✅ Complete**

All MVP features are implemented, tested, and production-ready. The platform is ready for deployment.

**GA features (default on):** Contact Information System, Push Notifications, Civic Engagement v2. Quarantined features (AUTOMATED_POLLS, SOCIAL_SHARING_CIVICS/VISUAL/OG, CIVICS_TESTING_STRATEGY, etc.) require no active work—see `docs/FEATURE_STATUS.md` § Feature Quarantine.

**Recent Updates (February 2026):**
- ✅ **WebAuthn trust visibility** — Profile Account & Security shows trust tier (e.g. "Trusted (passkey verified)"); TrustScoreCard displays trust score and recommendations; dynamic "Set Up" vs "Manage Passkeys" button; ARIA on error/success regions; E2E tests for biometric setup flow
- ✅ **Contact system** — Bulk approve/reject (API + UI), batch notifications; rejected-status storage; admin rep-name search; My Submissions with rejected badge
- ✅ **Breadcrumbs** — Deep routes (representatives/[id], representatives/[id]/accountability, poll results)
- ✅ **E2E expansion** — poll-templates.spec.ts, civics-navigation.spec.ts; auth, account, profile, poll analytics specs
- ✅ **Axe CI** — accessibility-axe job in ci.yml; fail on violations
- ✅ **EnhancedEmptyState/EnhancedErrorDisplay** — Civics page, RepresentativeList, representatives page

**Recent Updates (March 2026) — Comprehensive UX/UI & Production Hardening:**
- ✅ **Security hardening** — Rate limiting on 20+ API routes (polls, voting, feedback, profile, CSP report); CSRF on login; E2E bypass locked out of production; Resend webhook secret enforcement; UUID validation on OG images; health/ingest protected with admin auth
- ✅ **Design token migration** — 40+ files migrated from hardcoded gray/blue to semantic tokens (`bg-card`, `text-foreground`, `border-border`); full dark mode on privacy page, error pages, voting components, hero section
- ✅ **Animation system** — Framer Motion `AnimatedCard`, `AnimatedVoteBar`, `PageTransition`, `BottomSheet`; `prefers-reduced-motion` respected across all animations
- ✅ **Accessibility** — Focus traps (`useAccessibleDialog`), keyboard navigation on cards, `aria-label` on icon-only buttons, `LiveAnnouncer` for screen readers, password show/hide toggles, `htmlFor`/`id` on registration forms, consistent `focus:ring-ring` focus rings
- ✅ **Performance** — `React.memo` on `PollCard`/`RepresentativeCard`/`CivicActionCard`; `next/dynamic` for 6 chart components; `FeedContext` replacing 22-prop FeedCore interface; scroll restoration; blur-up image placeholders; `AbortController` cleanup in data fetching
- ✅ **Error handling** — `global-error.tsx` root boundary; 6 route-level `error.tsx` files; `response.ok` checks on all fetch calls; toast notifications replacing all `window.alert()` and `window.confirm()` calls
- ✅ **Code quality** — 50+ `any` types replaced with proper types; 8 dead files deleted; 19 unused exports removed; 4 duplicate components consolidated; `console.log` purged from production code; Zod env validation module created
- ✅ **Production readiness** — 7 `loading.tsx` files for main routes; `VoteSubmitButton` shared component; standardized API responses; PWA localStorage sanitized; cookie secure flag fixed; memory leak fix in service worker; missing `/hashtags` route created

**Recent Updates (January 2026):**
- ✅ **P0 Production Readiness Complete** - All critical production readiness items completed
  - OG image test logger mocks fixed (11/11 tests passing)
  - Candidate verification edge cases verified (53/53 tests passing)
  - DMARC policy implementation documented
  - Admin audit list/diff functionality enhanced
  - Rate limit production verification documented
  - Admin stats endpoint sanity checks enhanced
- ✅ All critical environment variables configured in Vercel (26 total)
- ✅ Fixed critical table name mismatch (`representative_follows` vs `user_followed_representatives`)
- ✅ Store modernization largely complete (most stores follow creator pattern)

---

## Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Store modernization | ✅ Logout cascade complete | All 17 stores reset on sign-out; stores typed |
| Documentation | ✅ Current | Core docs refreshed; scratch materials archived; single-source roadmap established. |
| Testing | ✅ Comprehensive | Jest suites, Playwright smoke/axe/critical; 7 loading.tsx files; global-error.tsx |
| Analytics dashboard | ✅ Real data live | Supabase-backed endpoints (`/api/analytics/**`, unified API) with privacy-aware queries, Redis caching, and admin gating; see `docs/archive/reference/civics/civic-engagement-v2/` for analytics context. |
| Admin tooling | ✅ Enhanced | Feature flag UI and notification system now consume shared hooks; audit tooling enhanced with diff functionality, filtering, and comprehensive logging. |
| Civic/notifications UX | ✅ Stable surface | Poll creation, onboarding, and notifications flows run on refactored APIs but still need ongoing regression coverage. |

---

## Recent Highlights

- **P0 Production Readiness Complete (December 2025)** — All critical production readiness items completed:
  - OG image test logger mocks fixed (all 11 tests passing)
  - Candidate verification edge cases verified (expired/wrong code handling working correctly)
  - DMARC policy implementation documented with DNS configuration guide
  - Admin audit endpoints enhanced with diff comparison, filtering, and search
  - Rate limit production verification guide created
  - Admin stats endpoints enhanced with comprehensive logging and error handling
- **OpenStates ingest overhaul** — Parser/stager now capture biographies, aliases, extras, expanded office metadata, and identifier maps; downstream enrichers + preview tooling surface the full dataset.
- **Notification store** migrated to the shared creator/selectors pattern with unit, RTL integration, and new Playwright harness coverage (`/e2e/notification-store`).
- **Admin notification widget** updated to consume shared hooks, aligning admin toasts with global behaviour.
- **Voter registration CTA shipped** — Address lookup now renders state-specific registration links, Vote.gov guidance, and status checks backed by the new Supabase table + modernized store.
- **Documentation cleanup** underway: development guide refreshed, modernization guidelines captured, and outdated "perfect completion" docs queued for archival.
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

**Summary:** Ingest loads state/local reps from OpenStates (YAML + API) and federal reps from Congress.gov, FEC, and GovInfo into Supabase. Order: baseline (YAML stage + merge) → OpenStates API sync (committees, activity, events) → federal enrichment (Congress IDs, FEC finance). Key commands: `npm run ingest` (full), `npm run ingest:validate` (check + unit tests, no DB), `npm run ingest:qa` (gaps + smoke + metrics). Legacy scripts removed during audit are listed in `services/civics-backend/NEW_civics_ingest/docs/REMOVED_SCRIPTS.md`.

- **Phase 2** — Validation harness: ✅ Staging fixtures in `NEW_civics_ingest/__tests__/fixtures/staging/`; `__tests__/staging-validation.test.ts` validates fixture shape without Supabase; CLI smoke template: `npm run ingest:validate` (runs `ingest:check` + `npm run test`).
- **Phase 3** — Crosswalk + dedupe: `tools:verify:crosswalk` and `tools:audit:duplicates`; API call optimization matrix in `NEW_civics_ingest/docs/RATE_LIMITS.md` § API call optimization matrix.
- **Phase 4** — Types: After any Supabase schema change, run `cd web && npm run types:generate` to regenerate types.
- **Phase 5** — Documentation: This section is the high-level ingest summary; detailed runbooks: `services/civics-backend/NEW_civics_ingest/docs/README.md`, `GETTING_STARTED.md`, `OPERATOR_RUNBOOK.md`; legacy script list: `REMOVED_SCRIPTS.md`.

References:
- Definitive MVP roadmap: `docs/ROADMAP.md` (civics ingest in §2.3)
- Backend plan: `services/civics-backend/NEW_civics_ingest/docs/README.md`

---

## Known Gaps & Risks

- **Testing coverage**: Analytics dashboards, civic engagement flows, and feature flag toggles have minimal Jest/Playwright coverage.
- **Docs accuracy**: Several markdown files still advertise “fully complete” features; March 2026 refresh in progress.
- **Known technical debt**: A small number of `TODO`/`FIXME` comments remain in `web/`; tracked below and in `docs/ROADMAP.md` §4 (Code TODOs).

**Code TODOs (on hold / P2):**

| Location | Description |
| --- | --- |
| `web/features/polls/components/AdvancedAnalytics.tsx` | Chart visualization (Recharts) – placeholder |
| `web/features/feeds/components/core/FeedCore.tsx` | Theme actions integration for immediate update. ✅ Done: FeedContext replaces 22-prop interface (March 2026). |
| `web/features/admin/components/UserManagement.tsx` | Full edit modal for other fields |

---

## Next Milestones

| Target | Description | Status |
| --- | --- | --- |
| Notification docs shipped | Finalize modernization + harness notes in core docs | 🔄 |
| App/admin store refactor | Apply shared creator/selectors and add smoke tests | 🔄 |
| OpenStates ingest QA harness | Fixture-based staging test + `ingest:validate` CLI (Phase 2) | ✅ |
| Analytics endpoint audit | Replace mocks with Supabase queries + Redis guardrails | ✅ |
| Documentation archival pass | Move legacy “perfect completion” docs into `/docs/archive` | 🔄 |

---

## References

- Definitive MVP roadmap: `docs/ROADMAP.md`
- Testing strategy: `docs/TESTING.md`
- State management standards: `docs/STATE_MANAGEMENT.md`
- For the full prioritized backlog (including E2E): [ROADMAP.md](ROADMAP.md). E2E detail: [PRODUCTION_TESTING_STATUS.md](PRODUCTION_TESTING_STATUS.md) § Remaining Work.

For ongoing progress updates, update checkboxes and notes in `docs/ROADMAP.md`.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** 2026-03-13


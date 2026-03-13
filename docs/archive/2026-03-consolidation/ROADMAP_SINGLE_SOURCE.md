# Choices – Roadmap & Next Steps (Legacy Sections + Runbooks)

**Note:** This is a legacy document. The canonical roadmap is [docs/ROADMAP.md](docs/ROADMAP.md).

Last updated: March 2026  
**Definitive MVP roadmap:** [`docs/ROADMAP.md`](./ROADMAP.md) — all remaining work is consolidated there (no duplication).

This document keeps **immediate actions**, **runbooks**, and **sectioned detail (A–H)** for reference. When closing items, update the checkbox in **ROADMAP.md** and link the PR there.

**MVP:** Contact, Push, Civic Engagement v2 are GA. Quarantined features (see `docs/FEATURE_STATUS.md`) require no active work.

**Recent (March 2026):** Definitive roadmap created at `docs/ROADMAP.md`; ROADMAP_SINGLE_SOURCE reconciled to point to it. Doc dates refreshed.

Quick links: [Immediate Actions](#immediate-actions) • [Recurring Runbooks](#recurring-runbooks) • [Ownership & Updates](#ownership--updates)

See also: `docs/CODEBASE_NAVIGATION.md` § Canonical Utilities for import paths.

Legend: [P0]=blocking, [P1]=launch‑critical, [P2]=post‑launch

---

## Immediate Actions

**Do these first** before pushing or merging:

1. **Run full CI locally:** `cd web && npm run test:ci` (build → Jest → Playwright). Ensure port 3000 is free.
2. **Verify GitHub Actions** after merge: `.github/workflows/ci.yml`, `test.yml`, `web-ci.yml`.
3. **Supabase mock:** If adding new query patterns, extend `web/jest.setup.after.js` with chainable methods (`order`, `limit`, `gte`, `lte`, etc.) to avoid "X is not a function" errors.

**Before every PR:**
```bash
cd web && npm run types:ci && npm run lint:strict && npm run test
```

---

## For New Developers

1. Read `docs/GETTING_STARTED.md` and set up the dev environment.
2. Run `npm run dev` and confirm http://localhost:3000 loads.
3. Run `npm run test` and `npm run lint:strict` to verify baseline.
4. Skim `docs/CODEBASE_NAVIGATION.md` for import paths.
5. Read `CONTRIBUTING.md` for branch naming and PR workflow.

**Key paths:** `web/app/` (routes), `web/lib/stores/` (state), `web/app/api/` (API), `web/tests/` (tests), `web/utils/supabase/` (Supabase).

---

## Top P0 Focus

- ✅ Infra & Domain (secrets/region/rotation) — see section A (partial: verification guide created)
- ✅ Email deliverability (DMARC + webhook signing) — ✅ COMPLETE (Dec 2025) — see section A
- ✅ Candidate verification edge cases (resend throttle/expired codes) — ✅ COMPLETE (Dec 2025) — see section A
- ✅ Admin observability (stats/audit/revert checks) — ✅ COMPLETE (Dec 2025) — see section A
- ✅ Security baseline (rate limits, validation, sensitive log checks) — ✅ COMPLETE (Dec 2025) — see section A
- CI gates green: `tsc --noEmit`, eslint, unit, critical smoke — see section F

---

## A) Production Readiness Gaps [mixed]

- [P0] Infra & Domain: verify Vercel env, secrets, region; document key rotation runbook
- [P0] ✅ Email deliverability: DMARC policy + webhook signing verification in code — ✅ COMPLETE (Dec 2025)
  - **Action Required:** Configure DMARC DNS records (manual DNS setup)
  - **Files:** `web/app/api/webhooks/resend/route.ts`, `docs/archive/runbooks/operations/email-deliverability-setup.md`
- [P0] ✅ Candidate verification edge cases — ✅ COMPLETE (Dec 2025)
  - **Files:** `web/app/api/candidates/verify/*`
- [P0] ✅ Admin observability — ✅ COMPLETE (Dec 2025)
  - **Files:** `web/app/api/admin/audit/*`, `web/app/api/admin/system-metrics/route.ts`
- [P0] ✅ Security baseline — ✅ DOCUMENTED (Dec 2025)
  - **Action Required:** Execute rate limit verification in production per `docs/archive/runbooks/operations/rate-limit-production-verification.md`
- [P0] Testing & CI: ensure lint, `tsc --noEmit`, unit/contract, and key E2E smoke run green in CI
- [P1] Moderation & reporting: user→admin report endpoint + triage workflow
- [P1] Performance & caching: ETag on candidate pages; short TTL caching on representative reads; TTFB monitoring
- [P1] Docs & runbooks: incident response; admin key rotation; revert procedure
- [P1] Governance/open source: footer links to ToS/Privacy; "suggest correction" link on public profile

---

## B) Feature Flags & Product Surfaces [mixed]

Source: `docs/FEATURE_STATUS.md`

- [P1] ✅ Contact Information System: **GA** (default true). RLS, rate limits, admin UI. Post-deploy: verify bulk approve/reject.
- [P1] ✅ Civic Engagement v2: **GA** (default true). API + UI on rep detail; create/sign at `/civic-actions/*`.
- [P1] ✅ Push Notifications: **GA** (default true). Delivery logging. Post-deploy: validate VAPID.
- [P1] Social Sharing: API + poll UI shipped; default false. Civics/OG pipelines **quarantined**.
- [P1] Internationalisation: en/es coverage; extraction not wired. **Quarantined** for MVP.
- [P2] Device Flow Auth: Implementation complete. E2E + OAuth config **quarantined**.
- [P2] Themes/Dark Mode: decide or remove flag
- [P2] Advanced Privacy/ZK/DP: **Quarantined** – remove placeholder or scope initiative

---

## C) Web Store Modernization [primarily P1]

Outstanding per‑store (implement standards, align consumers, add tests/harnesses):

- `adminStore.ts`: finish RTL + integration for users/settings/jobs; align analytics widgets
- `analyticsStore.ts`: extract async service helpers; consent guard tests
- `appStore.ts`: broaden RTL coverage (theme/sidebar persistence)
- `deviceStore.ts`: migrate PWA/device consumers; unit/RTL coverage
- `feedsStore.ts`: resolve harness flake; document telemetry; expand RTL
- `hashtagStore.ts` / `hashtagModerationStore.ts`: tighten typing; async error coverage; dashboard tests
- `notificationStore.ts`: migrate admin/dashboard toasts to action bundle; feature E2E for toast flows
- `pollsStore.ts`: add RTL + dashboard widget regression suite
- `pollWizardStore.ts`: progressive saving tests; finalize consumer alignment
- `profileStore.ts`: add remaining unit + Playwright coverage for profile edit/onboarding/dashboard
- `pwaStore.ts`: align ServiceWorker/provider; offline sync + playback tests
- `representativeStore.ts`: add E2E checks
- `votingStore.ts`: confirmation wiring; undo flows; Playwright coverage

Cross‑cutting: remove residual `withOptional`; memoize action selectors; document creators/base actions.

**Store changes:** Update this section and `docs/STATE_MANAGEMENT.md` when modifying stores. Governance check enforces this.

---

## D) Analytics, Admin, Accessibility & I18N [mixed]

- [P1] Analytics real data: ✅ COMPLETE (Jan 2026)
- [P1] Analytics features backlog (funnels, KPIs, admin flag coverage): ✅ COMPLETE (Jan 2026)
- [P1] Admin feature flags + audit logging: expand Playwright coverage for toggles and logging
- [P1] Accessibility – Analytics dashboards: textual summaries; axis labels; axe gating in CI ✅
- [P1] Notification alignment: ensure all surfaces use `useNotificationActions`; finalize Playwright specs
- [P1] Test coverage: stabilize feeds/admin harness suites; add RTL for voting/notification stores
- [P2] Governance/process: keep owner columns updated; prefer this file as the single source

---

## E) Civics Backend Ingest [P1]

See `services/civics-backend/NEW_civics_ingest/docs/README.md` and `docs/CURRENT_STATUS.md`.

- [P1] ✅ Phase 2 – Validation harness: staging fixtures, `staging-validation.test.ts` (no Supabase), CLI `ingest:validate`
- [P1] ✅ Phase 3 – Crosswalk + dedupe: `tools:verify:crosswalk`, `tools:audit:duplicates`; API optimization matrix in RATE_LIMITS.md
- [P1] ✅ Phase 4 – Regenerate Supabase types after schema change: `cd web && npm run types:generate`
- [P1] ✅ Phase 5 – Ingest summary in `docs/CURRENT_STATUS.md`; legacy scripts in REMOVED_SCRIPTS.md
- [P2] Phase 6 – CI ingest smoke tests; metrics/logging for scripts

---

## F) Testing & CI [P0/P1]

- [P0] CI gates: `tsc --noEmit`, eslint, unit, contracts, critical Playwright smoke
- [P1] **Production E2E:** Smoke 21/21 ✅; full suite 193 passed, 12 failed, 5 flaky (see `docs/PRODUCTION_TESTING_STATUS.md`). Remaining: auth, civics, contact, polls, account export, reps load time. E2E remaining items (auth, contact, civics, polls, account export, reps load time, Jest GovInfo, CI smoke gate) are listed in [docs/PRODUCTION_TESTING_STATUS.md](docs/PRODUCTION_TESTING_STATUS.md) § Remaining Work.
- [P1] Stabilize Playwright store harnesses; reduce flake; expand admin/app/specs. Harness patterns and stability notes: `docs/TESTING.md` § Store modernization and harness stability (ROADMAP C, F).
- [P1] Contract tests remain green for candidate/civics/admin routes
- [P1] i18n enforcement: automate `npm run i18n:extract`; promote locale lint to error post soak

**Verification notes:**
- Jest "open handles" warning: run `npx jest --detectOpenHandles` to find leaks (MSW, Supabase realtime, timers).
- Playwright port conflict: stop `npm run dev` or set `reuseExistingServer: true` locally.
- Supabase mock: `web/jest.setup.after.js` must include all chainable Postgrest methods used by audit/API routes.

---

## G) Documentation Hygiene [P1]

- Keep `docs/FEATURE_STATUS.md` in sync with shipped features; delete dormant flags quarterly
- Update `docs/STATE_MANAGEMENT.md` with latest selector/action bundle guidance and store creators
- Extend `docs/TESTING.md` with harness patterns, Supabase mock notes, and targeted examples

---

## H) Codebase Hygiene Updates (Completed)

- Canonical import paths: `@/lib/http/origin`, `@/lib/api/response-utils`, `@/lib/trending/TrendingHashtags`, `@/lib/utils/browser-utils`, `@/lib/utils/format-utils`
- Barrel hygiene: `web/lib/utils/index.ts` exports only canonical utilities
- ESLint: disallows removed legacy paths; messages point to canonical replacements

---

## Recurring Runbooks

| Task | Command |
|------|---------|
| Supabase types | `cd web && npm run types:generate` |
| I18N extraction | `cd web && npm run i18n:extract` |
| CI baseline | `cd web && npm run check` |
| Supabase migrations | `cd supabase && supabase db push` |

---

## Quick Reference: Commands

```bash
# From web/
npm run types:ci        # TypeScript
npm run lint:strict     # ESLint
npm run test            # Jest
npm run test:ci         # Build + Jest + Playwright (full CI)
npm run test:e2e        # Playwright only
npm run test:e2e:smoke  # Smoke tests only
npm run build           # Next.js build
```

---

## Ownership & Updates

- When starting work: add Owner and Target date (Owner: @you • Target: YYYY‑MM‑DD • PRs: #1234)
- Close items only with tests/docs updated and links added
- **Update cadence:** Review on major feature changes and at least monthly

# Choices – Single Source Roadmap (Outstanding Work Only)

Last updated: 2025‑12‑23  
**Note:** This file has been moved to `scratch/ROADMAP_SINGLE_SOURCE.md` to better consolidate work.  
**Canonical location:** `scratch/ROADMAP_SINGLE_SOURCE.md`

Quick links: [Recurring Runbooks](#recurring-runbooks) • [Ownership & Updates](#ownership--updates)

This document consolidates all remaining work items from `scratch/`, service roadmaps, production‑readiness, feature status, and code comments. Treat this file as the single source of truth for outstanding work. When closing an item, link the PR and update status here.

See also: `docs/UTILS_GUIDE.md` for canonical utilities and import paths.

Legend: [P0]=blocking, [P1]=launch‑critical, [P2]=post‑launch

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
Source: `docs/ROADMAP/PRODUCTION_READINESS.md`

- [P0] Infra & Domain: verify Vercel env, secrets, region; document key rotation runbook
- [P0] ✅ Email deliverability: DMARC policy + webhook signing verification in code — ✅ COMPLETE (Dec 2025)
  - Webhook signature verification verified in code
  - DNS configuration documented (SPF, DKIM, DMARC)
  - Email deliverability setup guide updated
  - **Action Required:** Configure DMARC DNS records (manual DNS setup)
  - **Files:** `web/app/api/webhooks/resend/route.ts`, `docs/archive/runbooks/operations/email-deliverability-setup.md`
- [P0] ✅ Candidate verification edge cases: expired/wrong code flows; resend throttle tests — ✅ COMPLETE (Dec 2025)
  - Expired code handling: Clear messages with `canRequestNew: true` flag
  - Wrong code handling: Attempt tracking, lockout after 5 attempts, rate limiting
  - All 53 candidate verification tests passing
  - **Files:** `web/app/api/candidates/verify/*`
- [P0] ✅ Admin observability: stats endpoint sanity; audit list/diff; field‑level revert verification — ✅ COMPLETE (Dec 2025)
  - Stats endpoint sanity: Enhanced `/api/admin/system-metrics` with logging and error handling
  - Audit list/diff: Enhanced `/api/admin/audit/representatives` and `/api/admin/audit/candidates` with diff comparison, filtering, and search
  - Field-level revert: Already implemented, requires production testing
  - **Files:** `web/app/api/admin/audit/*`, `web/app/api/admin/system-metrics/route.ts`
- [P0] ✅ Security baseline: rate limits confirmed in prod; input validation coverage; sensitive log checks — ✅ DOCUMENTED (Dec 2025)
  - Rate limits: Comprehensive verification guide created (`docs/archive/runbooks/operations/rate-limit-production-verification.md`)
  - **Action Required:** Execute verification in production environment (requires production access)
  - Input validation coverage: Pending audit
  - Sensitive log checks: Pending audit
- [P0] Testing & CI: ensure lint, `tsc --noEmit`, unit/contract, and key E2E smoke run green in CI
- [P1] Moderation & reporting: user→admin report endpoint + triage workflow
- [P1] Performance & caching: ETag on candidate pages; short TTL caching on representative reads; TTFB monitoring
- [P1] Analytics & dashboards: funnel events emitted; admin KPIs surfacing
- [P2] i18n/a11y/SEO polish: extract candidate flow strings; keyboard/ARIA checks; OG/Twitter cards
- [P1] Docs & runbooks: incident response; admin key rotation; revert procedure
- [P1] Governance/open source: footer links to ToS/Privacy; “suggest correction” link on public profile

---

## B) Feature Flags & Product Surfaces [mixed]
Source: `docs/FEATURE_STATUS.md`

- [P1] Social Sharing (master + polls): persist events to Supabase; expose metrics; admin dashboards
  - Implemented: API persists to `analytics_events` (typed) in `web/app/api/share/route.ts`; GET aggregates by `event_type='share'`
- [P2] Social Sharing (civics/visual/OG): decide keep or delete flags; scope if kept
- [P1] Contact Information System: complete ingestion + notification flows; clarify CRM vs MVP
- [P2] Device Flow Auth: OAuth 2.0 Device Authorization handlers + polling UX + rate limiting
- [P2] Themes/Dark Mode: decide or remove flag
- [P1] Internationalisation: finish extraction tooling; expand catalogue coverage; enable lint job
- [P1] Civic Engagement v2: integrate with Supabase and UI; QA plan
- [P1] Performance Optimization: audit adoption of utilities; promote where valuable
- [P1] Push Notifications: client opt‑in + delivery guarantees; tests + product sign‑off
- [P2] Advanced Privacy/ZK/DP: remove placeholder or scope initiative

---

## C) Web Store Modernization [primarily P1]
Source: `scratch/store-modernization-roadmap.md` and `scratch/gpt5-codex/store-roadmaps/*`

Outstanding per‑store highlights (implement standards, align consumers, add tests/harnesses):
- `adminStore.ts`: finish RTL + integration for users/settings/jobs; align analytics widgets; ensure async return usage across pages
- `analyticsStore.ts`: extract async service helpers; consent guard tests; wire event helpers for civics notifications
- `appStore.ts`: broaden RTL coverage (theme/sidebar persistence); verify selectors adopted everywhere
- `deviceStore.ts`: migrate PWA/device consumers; unit/RTL coverage
- `feedsStore.ts`: resolve harness flake; document telemetry; expand RTL; finish success‑toast analytics
- `hashtagStore.ts` / `hashtagModerationStore.ts`: tighten typing; async error coverage; dashboard tests; selector adoption
- `notificationStore.ts`: migrate admin/dashboard toasts to action bundle; feature E2E for toast flows; document election alert analytics hooks
- `pollsStore.ts`: add RTL + dashboard widget regression suite; analytics/notification helper sync
- `pollWizardStore.ts`: progressive saving tests; finalize consumer alignment
- `profileStore.ts`: add remaining unit + Playwright coverage for profile edit/onboarding/dashboard reflection
- `pwaStore.ts`: align ServiceWorker/provider; offline sync + playback tests
- `representativeStore.ts`: add E2E checks; populate `user_id` at source (see P0 item below)
- `votingStore.ts`: confirmation wiring; undo flows; Playwright coverage
- Cross‑cutting: remove any residual `withOptional`; memoize action selectors; ensure creators/base actions and `partialize` rules documented

Immediate P0/P1 from code/TODO reconciliation:
- [P0] Populate `user_id` during representative hydration (prefer server route) and enforce type guarantees — Implemented (`/api/representatives/my`, `representativeStore`), migration added, types regenerated
- [P0] Add DB table `representative_follows` (user_id, representative_id, notify fields, notes, tags, created_at, updated_at) and grant RLS; update API route join to typed table — Implemented via migration `2025-11-16_008_representative_follows.sql`; Supabase types regenerated (run: `cd web && npm run types:generate`; refs: `services/supabase-operations-guide.md`, `web/types/README.md`)
- [P1] Widget editor configuration UI is now implemented; ensure roadmap docs reflect completion and add global settings tests where missing
- [P1] Reverse‑geocoding flow implemented (server‑proxied); ensure API key configuration + tests documented
- [P1] Analytics DB migrations implemented (entries table + RPC); follow through with docs/ADR and test updates where referenced
- [P2] Wikipedia photo service integration (MediaWiki) – implemented with caching and attribution
- [P2] Replace data‑layer “TBD” strings with null + localized UI fallbacks – implemented in `services/civics-shared/estimateDeadline`; web layer fallbacks remain localized
- [P2] Hashtag engagement metrics persistence endpoint and UI wiring
  - Implemented: API `web/app/api/analytics/hashtag/engagement/route.ts` and UI tracking in `web/features/polls/components/PollHashtagIntegration.tsx`
- [P2] Clean up onboarding helper to delegate to secure action or remove duplicate – helper mirrors secure redirect; no action required
- [P2] Decide fate of generic `auth.ts` placeholders (remove or thin Supabase wrappers) – already wired to Supabase; no action required

---

## D) Analytics, Admin, Accessibility & I18N [mixed]
Sources: `docs/ROADMAP.md`, `docs/qa/i18n-accessibility-playbook.md`, `scratch/gpt5-codex/roadmaps/2025-11-17-outstanding-backlog-roadmap.md`, inclusive archive

- [P1] Analytics real data: ✅ COMPLETE (Jan 2026) — `/api/analytics/**` + unified routes now source Supabase data with `PrivacyAwareQueryBuilder`, Redis cache helpers, and documented pipeline (`docs/ANALYTICS_PIPELINE.md`)
- [P1] Analytics features backlog (funnels, KPIs, admin flag coverage): ✅ COMPLETE (Jan 2026) — see `docs/ANALYTICS_FEATURES_PLAN.md` for the shipped summary + references
- [P1] Admin feature flags + audit logging: expand Playwright coverage for toggles and logging once modernized
- [P1] Accessibility – Analytics dashboards: textual summaries; axis labels; re‑run NVDA; enable axe gating in CI
- [P1] Notification alignment: ensure all surfaces use `useNotificationActions`; finalize Playwright specs
- [P1] Test coverage: stabilize feeds/admin harness suites; add RTL for voting/notification stores; nav breadcrumbs/sidebar E2E
- [P2] Governance/process: keep owner columns updated where used; prefer this file as the single source; archive superseded docs

---

## E) Civics Backend Ingest [P1]
Source: `services/civics-backend/ROADMAP.md`

- [P1] Phase 2 – Validation harness: staging/merge fixtures (mock Supabase) and CLI smoke‑test template
- [P1] Phase 3 – Crosswalk + dedupe automation; API call optimization matrix implementation
- [P1] Phase 4 – Regenerate Supabase types after next schema change
- [P1] Phase 5 – Summarize ingest in `docs/CURRENT_STATUS.md` and archive legacy scripts
- [P2] Phase 6 – CI ingest smoke tests; metrics/logging for scripts; optional raw YAML snapshot/hashes; prep next API scaffolding

---

## F) Testing & CI [P0/P1]
Sources: multiple

- [P0] CI gates: `tsc --noEmit`, eslint, unit, contracts, critical Playwright smoke
- [P1] Stabilize Playwright store harnesses; reduce flake; expand admin/app/specs
- [P1] Contract tests remain green for candidate/civics/admin routes; keep fixtures shared across MSW/Playwright
- [P1] i18n enforcement: automate `npm run i18n:extract`; promote locale lint to error post soak

---

## G) Documentation Hygiene [P1]

- Promote this file in `docs/ROADMAP.md` header; archive/annotate superseded roadmaps under `docs/archive`
- Keep `docs/FEATURE_STATUS.md` in sync with shipped features; delete dormant flags quarterly
- Update `docs/STATE_MANAGEMENT.md` with latest selector/action bundle guidance and store creators
- Extend `docs/TESTING.md` with harness patterns and targeted examples

---

## H) Codebase Hygiene Updates (Completed)

- Canonical utilities and removals:
  - Duplicates removed: `web/lib/utils/rate-limit.ts`, `web/lib/http.ts`, `web/lib/utils/http.ts`, `web/lib/utils/cors.ts`, `web/lib/utils/csrf.ts`, `web/lib/utils/csrf-fetch.ts`, `web/ssr-safe.ts`, `web/features/feeds/lib/TrendingHashtags.ts`.
  - Rare but supported modules annotated and feature‑gated:
    - `web/lib/utils/sophisticated-analytics.ts` (dev‑only usage ping; stable API surface)
    - `web/lib/utils/sophisticated-civic-engagement.ts` (guarded by `CIVIC_ENGAGEMENT_V2`)
- Canonical import paths:
  - Origin/HTTP: use `@/lib/http/origin`
  - CORS helpers: use `@/lib/api/response-utils` (`withCors`, `corsPreflightResponse`)
  - Trending hashtags: use `@/lib/trending/TrendingHashtags`
  - Device detection: prefer `@/lib/utils/browser-utils` with graceful fallback
  - Date/time helpers: `nowISO()`, `formatISODateOnly()` from `@/lib/utils/format-utils`
- Barrel hygiene:
  - `web/lib/utils/index.ts` now exports only canonical, supported utilities; removed re‑exports for unused hooks and removed modules.
- ESLint enforcement (prevent regressions):
  - Disallow imports from removed legacy paths (`@/lib/utils/http`, `@/lib/http`, `@/lib/utils/cors`, `@/lib/utils/csrf*`, and `@/features/feeds/lib/TrendingHashtags`).
  - Messages point to canonical replacements.
- Small API consistency:
  - Consolidated timestamp generation to `nowISO()`; date‑only strings to `formatISODateOnly()` across updated modules.

Action for teams: follow canonical paths above for any new code; avoid introducing feature‑local duplicates of utilities. If a new utility is broadly useful, add to `@/lib/utils/**` and document here.

---

## Recurring Runbooks

- Types (Supabase) – canonical generation:
  - Location: `web/types/supabase.ts`
  - Command: `cd web && npm run types:generate`
  - References: `services/supabase-operations-guide.md`, `web/types/README.md`

- I18N extraction (keep messages snapshot fresh):
  - Command: `cd web && npm run i18n:extract`
  - Output: `web/messages/en.snapshot.json`

- CI baseline (local quick equivalent):
  - Command: `cd web && npm run check`
  - Gates: TypeScript (noEmit), eslint (strict), Jest CI

- Supabase migrations (fetch/apply and verify):
  - Link (one‑time): `cd supabase && supabase link --project-ref muqwrehywjrbaeerjgfb`
  - Fetch: `cd supabase && supabase migration fetch`
  - Apply: `cd supabase && supabase db push`
  - References: `services/supabase-operations-guide.md`

---

## Ownership & Updates

- When you start work on any item, add Owner and Target date:
  - Owner: @you • Target: YYYY‑MM‑DD • PRs: #1234
- Close items only with tests/docs updated and links added. If an external doc is updated, ensure this file reflects the change.



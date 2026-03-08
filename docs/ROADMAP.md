# MVP Roadmap — Definitive Remaining Work

_Last updated: March 2026. Single source of truth for all remaining work. Reconciles `docs/ROADMAP_SINGLE_SOURCE.md`, `docs/FEATURE_FLAGS_REMAINING_ISSUES.md`, `docs/PRODUCTION_TESTING_STATUS.md`, `docs/CURRENT_STATUS.md`, and `scratch/`._

**Canonical location:** `docs/ROADMAP.md`

**MVP scope:** Contact Information System, Push Notifications, Civic Engagement v2 are GA. Quarantined features (see `docs/FEATURE_STATUS.md`) require no active work. This document lists only **remaining** work.

---

## How to use this document

- **Before PR:** Run `cd web && npm run check` (types:ci, lint:strict, Jest). See [Commands](#commands).
- **When closing an item:** Update the checkbox, add a short “Done” note and PR link, and move to [Completed reference](#completed-reference) if useful.
- **Do not duplicate:** Each work item appears once. Related detail lives in the linked doc (e.g. FEATURE_FLAGS_REMAINING_ISSUES, PRODUCTION_TESTING_STATUS).
- **Scratch / other .md:** `scratch/roadmap.md`, `scratch/manual-tasks.md`, and “next steps” in other docs point here for remaining work.

---

## 1. Pre-launch (P0 / P1)

### 1.1 Feature-flag gating (contact)

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| ~~Gate `/api/contact/messages` and `/api/contact/threads` with `CONTACT_INFORMATION_SYSTEM`~~ | P1 | ✅ Done: both routes return 403 when flag off. | [FEATURE_FLAGS_REMAINING_ISSUES.md](./FEATURE_FLAGS_REMAINING_ISSUES.md) §2.2 |
| ~~Gate My Submissions page when flag off~~ | P1 | ✅ Done: `useFeatureFlag` + “Feature disabled” card (same pattern as ContactSystemAdmin). | [FEATURE_FLAGS_REMAINING_ISSUES.md](./FEATURE_FLAGS_REMAINING_ISSUES.md) §2.4 |
| ~~Optionally gate `/contact/history`~~ | P2 | ✅ Done: page shows “Feature disabled” when flag off (aligned with messages/threads). | [FEATURE_FLAGS_REMAINING_ISSUES.md](./FEATURE_FLAGS_REMAINING_ISSUES.md) §2.4 |

### 1.2 Production verification (manual)

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| Contact system post-deploy | P1 | Verify admin bulk approve/reject and rep-name search in production; run contact E2E after deploy. | [FEATURE_STATUS.md](./FEATURE_STATUS.md) § Production Checklists |
| Push / VAPID post-deploy | P1 | Validate VAPID keys and web-push delivery in production; confirm failures logged to `notification_log`. | [FEATURE_STATUS.md](./FEATURE_STATUS.md) § Push Notifications |
| DMARC DNS | P0 (config) | Configure DMARC DNS records for production email (implementation in code complete). | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § A |
| Rate limits production | P0 (ops) | Execute rate-limit verification in production per runbook. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § A |

### 1.3 CI and testing

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| CI gates green | P0 | Ensure `tsc` (types:ci), eslint (lint:strict), unit, contracts, and critical Playwright smoke run green in CI. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § F |
| Production E2E remaining failures | P1 | Auth (login/registration), contact-admin, contact-edge (long email), poll-creation-flow, account export, representatives load time; see PRODUCTION_TESTING_STATUS § Remaining Work. | [PRODUCTION_TESTING_STATUS.md](./PRODUCTION_TESTING_STATUS.md) |
| Deploy contact validation | P1 | Code path verified: `validateAndNormalizeContact` runs before DB; invalid/long email returns 400. Deploy to production so clients see 400; if 500 persists in prod, debug env/DB path. | [PRODUCTION_TESTING_STATUS.md](./PRODUCTION_TESTING_STATUS.md) § Remaining Work |

---

## 2. Post-launch (P2)

### 2.1 Feature flags and product

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| ~~ShareAnalyticsPanel hook~~ | P3 | ✅ Done: uses `useFeatureFlag('SOCIAL_SHARING')` so admin toggles apply without refresh (March 2026). | [FEATURE_FLAGS_REMAINING_ISSUES.md](./FEATURE_FLAGS_REMAINING_ISSUES.md) §3.2 |
| Device Flow Auth | P2 | E2E + OAuth provider config; implementation complete. | [FEATURE_STATUS.md](./FEATURE_STATUS.md) § Quarantine |
| Themes / Dark Mode | P2 | Decide or remove flag. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § B |
| Quarterly flag review | P2 | Delete quarantined placeholders when product deprecates; keep FEATURE_STATUS in sync. | [FEATURE_STATUS.md](./FEATURE_STATUS.md) § Suggested Next Steps |

### 2.2 Store modernization and tests

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| Store coverage and harnesses | P1/P2 | Per-store: adminStore (RTL, users/settings/jobs), analyticsStore (consent guards), appStore (theme/sidebar RTL), deviceStore (PWA consumers), feedsStore (harness flake), hashtag/notification/polls/pollWizard/profile/pwa/representative/voting stores (tests, alignment, E2E). | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § C |
| Playwright harness stability | P1 | Reduce flake; expand admin/app specs; use data-*-harness and stable selectors. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § F, [TESTING.md](./TESTING.md) § Store modernization |
| Contract tests | P1 | Keep candidate/civics/admin route contracts green. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § F |
| i18n extraction | P2 | Automate `npm run i18n:extract`; promote locale lint to error after soak. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § F |

### 2.3 Civics ingest

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| Phase 6 CI ingest smoke | P2 | CI smoke tests and metrics/logging for ingest scripts. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § E, [CURRENT_STATUS.md](./CURRENT_STATUS.md) § Civics Ingest |

### 2.4 Docs and governance

| Item | Priority | Detail | Doc reference |
|------|----------|--------|----------------|
| Keep FEATURE_STATUS in sync | P1 | Update when shipping or quarantining features; delete dormant flags quarterly. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § G |
| STATE_MANAGEMENT and TESTING | P1 | Update with selector/action bundle guidance, harness patterns, Supabase mock notes. | [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) § G |
| Governance check | P0 (process) | Run `npm run governance:check` from repo root when changing stores/APIs; ensure roadmap/doc/changelog updates. | [CONTRIBUTING.md](../CONTRIBUTING.md) |

---

## 3. Manual and ops (checklists)

These require human action; not automated in CI.

### 3.1 Production verification (scratch/manual-tasks)

- [ ] **Auth:** Password reset full flow; OAuth (Google/GitHub) in production; passkey registration and login on real device.
- [ ] **Onboarding & profile:** All 6 onboarding steps; profile edit save; biometric setup flows in production.
- [ ] **Core:** Representatives load more / location lookup; poll analytics data and admin access.
- [ ] **Production E2E:** Run production E2E (a11y, auth, account, profile) post-deploy with E2E credentials.
- [ ] **A11y:** Screen reader (NVDA/JAWS/VoiceOver), keyboard navigation, heading hierarchy, analytics chart text alternatives.
- [ ] **Security & ops:** Security Advisor remaining RLS warnings; rate limits production verification; sensitive log audit.
- [ ] **Performance:** Bundle analysis; LCP &lt; 2s; mobile touch targets ≥44px.

### 3.2 OAuth and env (manual)

- Supabase Dashboard → Auth → Providers → enable Google/GitHub; add redirect URLs.
- Vercel: `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS`, passkey envs (`RP_ID`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_ENABLE_PASSKEYS=1`). See `docs/ENVIRONMENT_VARIABLES.md`.

---

## 4. Code TODOs (tracked, P2)

| Location | Description | Action |
|----------|-------------|--------|
| `web/features/admin/components/UserManagement.tsx` | Full edit modal for user fields (other than role) | Documented as deferred; role edit via prompt retained. |
| `web/features/polls/components/AdvancedAnalytics.tsx` | Chart visualization (Recharts) placeholder | Documented as deferred; data available via API. |
| `web/features/feeds/components/core/FeedCore.tsx` | Theme actions integration for immediate update | ✅ Done: uses `useAppStore` `setTheme` for immediate update (no reload). |

No other in-code TODO/FIXME in `web/` (app code) are tracked as MVP blockers; the above are optional enhancements.

---

## 5. Quarantined / no active work

The following are **not** on the MVP roadmap; do not start work unless product unquarantines:

- **Flags:** AUTOMATED_POLLS, SOCIAL_SHARING_CIVICS, SOCIAL_SHARING_VISUAL, SOCIAL_SHARING_OG, CIVICS_TESTING_STRATEGY, ADVANCED_PRIVACY, SOCIAL_SIGNUP (OAuth).
- **Features:** Device Flow (implementation done; E2E/OAuth config deferred), Internationalisation (en/es coverage; extraction not wired), Performance Optimization (partial adoption), Accessibility (QA; dashboards compliant).

See `docs/FEATURE_STATUS.md` § Feature Quarantine.

---

## 6. Commands

```bash
# From web/
npm run check            # types:ci + lint:strict + Jest (CI baseline)
npm run types:ci         # TypeScript (app)
npm run lint:strict      # ESLint
npm run test             # Jest
npm run test:e2e:smoke   # Playwright smoke
npm run test:e2e:critical # Error paths + critical journey
npm run test:e2e:axe     # Accessibility
npm run test:e2e:nav     # Nav + a11y specs
npm run build            # Next.js build

# Repo root only
npm run governance:check # Store/API change doc check
```

---

## 7. Related docs (no duplication of work items)

| Doc | Purpose |
|-----|--------|
| [ROADMAP_SINGLE_SOURCE.md](./ROADMAP_SINGLE_SOURCE.md) | Legacy sections A–H; immediate actions; runbooks. **Remaining work is consolidated here (ROADMAP.md).** |
| [FEATURE_STATUS.md](./FEATURE_STATUS.md) | Feature readiness, GA checklist, quarantine. |
| [FEATURE_FLAGS_REMAINING_ISSUES.md](./FEATURE_FLAGS_REMAINING_ISSUES.md) | Contact/SOCIAL_SHARING flag gating detail. |
| [PRODUCTION_TESTING_STATUS.md](./PRODUCTION_TESTING_STATUS.md) | Production E2E pass/fail, remaining failures, fixes applied. |
| [CURRENT_STATUS.md](./CURRENT_STATUS.md) | Snapshot, highlights, civics ingest status, known gaps. |
| [DOCS_MANIFEST.md](./DOCS_MANIFEST.md) | Canonical doc set. |
| `scratch/manual-tasks.md` | Human checklists (points here for roadmap). |
| `scratch/roadmap.md` | Points to this file. |

---

## 8. Completed reference

- **P0 production readiness (Dec 2025):** Email deliverability (DMARC in code), candidate verification edge cases, admin observability, security baseline (rate limits, validation, sensitive logs), CI gates.
- **Contact system GA:** RLS, rate limits, admin UI, bulk approve/reject, My Submissions.
- **Civic Engagement v2 GA:** API + UI on rep detail; create/sign at `/civic-actions/*`.
- **Push Notifications GA:** Delivery logging, notification_log.
- **Testing (March 2026):** Jest 352 tests; E2E smoke 13; axe 36; error-paths + critical-journey E2E; contact validation and input-sanitization unit tests; feature-flags-public contract; TEST_SUITE_AUDIT and TESTING.md aligned.
- **Roadmap execution (March 2026):** P1 contact feature-flag gating: `/api/contact/messages` and `/api/contact/threads` return 403 when flag off; My Submissions page shows “Feature disabled” when flag off. P2: `/contact/history` gated with same pattern. P3: ShareAnalyticsPanel uses `useFeatureFlag('SOCIAL_SHARING')` so admin toggles apply without refresh. Code TODOs: FeedCore theme uses app store `setTheme` for immediate update; UserManagement/AdvancedAnalytics deferred and documented. E2E empty-block lint fixed (critical-journey, error-paths). Contract tests: 30 passed. Contact submit: validation path returns 400 for invalid/long email (code verified). FEATURE_FLAGS_REMAINING_ISSUES.md updated; governance:check passes.

---

**Ownership:** Core maintainer. **Update:** When completing or adding items; review at least monthly.

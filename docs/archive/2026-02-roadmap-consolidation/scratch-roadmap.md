# Choices — Remaining Work Roadmap

**Last updated:** February 2026  
**Status:** MVP ~95% complete. Lint, type-check, build green. E2E smoke passing.  
**Purpose:** Single source of truth for all remaining work. **Verified against codebase (Feb 2026).**

---

## Folder Verification Summary (scratch/archived/*-README.md)

| Area | Status (verified) | Done | Remaining |
|------|------------------|------|-----------|
| **contactSystem** | Complete | APIs, admin UI, bulk approve/reject, rep_name filter, My Submissions, rejected_at, ContactSubmissionForm on rep page | Analytics dashboard, email notifications |
| **govinfoMCP** | Phases 1–4 done | Constituent will polls, accountability dashboard, rep→accountability link, bill context | Phase 5: electoral feed, shareable reports, report card |
| **civicsBackendIngest** | Phase 2–3 in progress | OpenStates rate limit handling, schema | Validation harness, crosswalk/dedupe, term verification |
| **accessibility** | Axe CI done | accessibility-axe job in ci.yml, dashboards compliant | Keyboard sweep, screen reader testing |
| **deviceFlowAuth** | Developer preview | API routes (authorize, poll, verify), DeviceFlowAuth component, docs/features/device-flow.md | Supabase polling UX, rate limiting, E2E |
| **pushNotifications** | Beta | Admin UI, PWA client, API routes, NotificationPreferences | Staged delivery, analytics backfill; push-notifications.spec.ts archived |
| **internationalization** | en/es done | useI18n, en.json, es.json, LanguageSelector; **CI extraction in ci.yml** | Locale expansion (fr, de, zh, ja, pt), copy freeze docs |
| **civicEngagementV2** | Beta | sophisticated-civic-engagement.ts, migrations, calculateCivicEngagementMetrics | Admin widget (CivicEngagementMetrics.tsx), GET /api/admin/civic-engagement/metrics, integration tests |
| **socialSharing** | Complete | POST/GET /api/share, PollShare, ShareButton, ShareAnalyticsPanel, event persistence | OG images, conversion tracking (optional) |
| **storeModernization** | Complete | All stores modernized per STATE_MANAGEMENT | — |
| **representativeChangeTracking** | Schema done | Migration 20260127130600 (status enum, replaced_by_id, status_reason) | Replacement detection script, OpenStates optimization |

---

## 1. Next: Production Verification (do first)

See **[manual-tasks.md](./manual-tasks.md)** for the full checklist. Summary:

- [ ] Password reset, OAuth, passkey (real-device)
- [ ] Onboarding, profile edit, biometric setup
- [ ] Representatives (load more, location lookup), poll analytics
- [ ] Production E2E suites (a11y, auth, account, profile)

---

## 2. MVP & Core (completed)

- [x] **Nested `<main>`** — Dashboard, Feed, Profile, Account, representatives/accountability use div; root SkipNavTarget provides single main
- [x] **Integrity badges** — Per-poll IntegrityBadge with excluded %, confidence tier, expandable explainer
- [x] **Integrity verified toggle** — "Show verified results only" on poll results
- [x] **Contact system** — ContactSubmissionForm on rep detail; server-side search (rep_name); My Submissions; rejected status; bulk approve/reject
- [x] **GovInfo integration** — Rep detail has link to `/representatives/[id]/accountability`; accountability dashboard live
- [x] **EnhancedEmptyState/EnhancedErrorDisplay** — Civics, RepresentativeList, representatives page, feed, dashboard, polls
- [x] **Breadcrumbs** — Deep routes (representatives/[id], accountability, poll results)
- [x] **Docs consolidation** — Non-canonical docs archived; dead links fixed
- [x] **Axe CI gating** — `accessibility-axe` job in ci.yml runs `--grep @axe`; fail on violations
- [x] **E2E coverage** — auth-flow, account-settings, mvp-critical-flows, poll-templates, civics-navigation, poll-analytics-verification, contact-admin-management, onboarding-complete-flow

---

## 3. Accessibility

- [ ] **Screen reader testing** — Manual NVDA, JAWS, VoiceOver on auth, onboarding, polls, profile, navigation
- [x] **ARIA completeness** — aria-label on icon buttons, dismiss, clear; aria-expanded/controls where needed
- [x] **Keyboard navigation** — Escape closes modals (DeviceList QR); useAccessibleDialog handles focus trap; keyboard-navigation.spec.ts
- [x] **Skip navigation** — SkipNavLink has aria-label; SkipNavTarget provides main#main-content (verified)
- [x] **Heading hierarchy** — Logical h1–h6; no skipped levels (account export/delete: sr-only h2, h4→h3)
- [x] **Analytics charts** — PollHeatmap sr-only stats summary; DemographicsChart, TemporalAnalysisChart have aria-describedby

---

## 4. UX/UI

- [x] **Loading states** — Progress indicators for multi-step flows; consistent skeletons; `role="status"`, `aria-busy` (accountability, contact submissions, rep detail; FeedCore, polls, profile, dashboard already had)
- [x] **Error handling** — Recovery suggestions, retry; contextual diagnostics (accountability, rep detail now use EnhancedErrorDisplay)
- [x] **Empty states** — Contextual copy, primary actions (accountability now uses EnhancedEmptyState)
- [x] **Forms** — aria-invalid, aria-describedby for ContactSubmissionForm, CreateCivicActionForm; role="alert" on errors
- [x] **Mobile** — Touch targets ≥44px (mobile menu, dismiss, account back buttons)
- [x] **First impressions** — Landing: aria-labels, min-h touch targets on nav/CTAs

---

## 5. GovInfo / Walk the Talk (Phase 5)

- [ ] **Electoral feed** — Add accountability / constituent-will to feed
- [ ] **Shareable accountability reports** — Broader share/export (e.g. PDF)
- [ ] **Representative Report Card** — Aggregate accountability view
- [ ] **Vote lookup caching** — Optional performance
- [ ] **Notifications when representative votes** — Optional

---

## 6. Representative Change Tracking

- [x] **Status tracking schema** — Migration `20260127130600` adds status enum, `replaced_by_id`, `status_reason`, `status_changed_at`
- [ ] **Replacement detection** — Script to detect same district/office different person; set `replaced_by_id`, status
- [ ] **OpenStates API optimization** — Rate limit tracking, exponential backoff on 429; first-time vs enrichment pattern

---

## 7. Civics Backend Ingest

- [ ] **Validation harness** — Staging/merge fixtures, CLI smoke-test for live Supabase
- [ ] **Term/next_election verification** — Validate term and election dates
- [ ] **Crosswalk + dedupe** — Automated duplicate auditing
- [ ] **OpenStates** — Test with real API key; optional resume/batch optimizations
- [ ] **Types & docs** — Regenerate Supabase types after schema change

---

## 8. Testing

- [ ] **E2E: passkey** — Registration and login flows
- [x] **E2E: biometric setup** — biometric-setup-flow.spec.ts covers page load, support check, auth gate, profile nav
- [ ] **E2E: device flow** — Device code request, authorization, polling, redirect, errors
- [x] **A11y suites** — Landing added to critical-pages-a11y; keyboard-navigation.spec.ts added
- [ ] **Store coverage** — adminStore, analyticsStore, appStore, feedsStore, pollsStore, profileStore (see docs/ROADMAP_SINGLE_SOURCE)
- [x] **API contract tests** — Feeds, health, admin-breaking-news, profile, analytics (critical endpoints)

---

## 9. Features & Product

- [ ] **Device flow** — Supabase polling UX in DeviceFlowAuth, rate limiting finalization, E2E coverage
- [ ] **Push notifications GA** — Staged delivery, analytics backfill; graduate flag (push-notifications.spec.ts archived; needs active E2E)
- [ ] **Civic Engagement v2** — Admin dashboard metrics, integration tests
- [ ] **i18n** — Expand locales (fr, de, zh, ja, pt); copy freeze docs (CI extraction done in ci.yml)
- [ ] **Contact analytics** — Analytics dashboard for submissions; email notifications

---

## 10. Performance

- [ ] **Bundle analysis** — Run `npm run bundle:report`; identify large deps
- [ ] **Code splitting** — Route-based and lazy loading opportunities
- [ ] **Images** — Use `next/image`; optimize formats (WebP, AVIF)
- [ ] **Fonts** — Optimize loading (e.g. `font-display: swap`)
- [ ] **React Query cache** — Review `staleTime` / `gcTime`

---

## 11. Security & Integrity

- [ ] **Security Advisor** — Review remaining RLS warnings
- [ ] **Rate limits** — Production verification (see rate-limit runbook)
- [ ] **Input validation** — Audit coverage for user input
- [ ] **Sensitive logs** — Audit for PII/credentials in logs

---

## 12. Polls

- [ ] **Cursor pagination** — Add cursor-based pagination for `GET /api/polls` when doing deep-pagination work

---

## 13. Documentation

- [x] **Component library** — docs/COMPONENT_LIBRARY.md
- [x] **API response guide** — docs/API/response-guide.md
- [x] **Accessibility guidelines** — ARIA, keyboard, screen reader patterns (docs/TESTING.md)

---

## 14. Tech Debt & Ops

- [ ] **TypeScript** — Resolve `TS2589` recursion in feeds/store modules; strict-optional cleanup
- [x] **Store modernization** — All stores modernized per docs/STATE_MANAGEMENT (verified)
- [ ] **Civics ingest** — CI ingest smoke test; metrics/logging
- [x] **Analytics a11y** — PollHeatmap stats sr-only; charts have aria-describedby

---

## 15. Optional / Backlog

- [ ] **Social sharing (optional)** — OG image generation, conversion tracking, A/B testing (core sharing complete)
- [ ] **GovInfo** — PDF export, native share dialog
- [ ] **MCP tool test from API routes** — Optional (REST is primary)

---

## Execution Order (recommended)

1. **Phase 1:** Production verification (password reset, OAuth, onboarding, profile, representatives, poll analytics)
2. **Phase 2:** Accessibility (screen reader, ARIA, keyboard)
3. **Phase 3:** UX/UI polish (loading, errors, forms, mobile)
4. **Phase 4:** Features (device flow, push GA, civic v2, i18n)
5. **Phase 5:** Testing expansion, performance, documentation

---

## Quick Reference

| Doc | Purpose |
|-----|---------|
| [manual-tasks.md](./manual-tasks.md) | **Manual tasks** — verification, setup, testing, review |
| [reference.md](./reference.md) | Implementation patterns, commands, quality gates |
| [verification.md](./verification.md) | Run commands, MVP verification |
| [agent.md](./agent.md) | Agent onboarding, skills, MCP |
| `docs/GETTING_STARTED.md` | Setup, runbook |
| `docs/ROADMAP_SINGLE_SOURCE.md` | Technical roadmap (stores, P0) |

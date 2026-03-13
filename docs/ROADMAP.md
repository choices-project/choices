# Roadmap

_Last updated: March 13, 2026_

Single source of truth for all remaining work. The MVP is complete — this document tracks launch tasks, post-launch improvements, and future features.

---

## 1. Launch Checklist (P0)

These items must be completed before or immediately after the first production deploy with live users.

### 1.1 Infrastructure & Configuration

- [ ] **DMARC DNS records** — Configure DMARC DNS records for the production email domain (code implementation complete via Resend)
- [ ] **OAuth providers** — Enable Google/GitHub in Supabase Dashboard → Auth → Providers; add redirect URLs; set `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` in Vercel
- [ ] **Passkey environment** — Set `RP_ID`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_ENABLE_PASSKEYS=1` in Vercel production env
- [ ] **VAPID keys** — Confirm `WEB_PUSH_PRIVATE_KEY` and `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` are set in production
- [ ] **Clean test data** — Remove "test test" site message and E2E test polls from production database

### 1.2 Production Verification (Manual)

- [ ] **Auth flows** — Password reset full flow; OAuth (Google/GitHub) login; passkey registration and login on a real device
- [ ] **Onboarding** — Complete all 6 onboarding steps; verify profile edit saves; biometric setup flows
- [ ] **Contact system** — Admin bulk approve/reject; rep-name search; run contact E2E specs
- [ ] **Push notifications** — Subscribe via notification preferences; trigger a test notification; confirm browser delivery and `notification_log` entries
- [ ] **Core pages** — Representatives load/location lookup; poll analytics; admin access
- [ ] **Rate limits** — Execute rate-limit verification per runbook (confirm 429 responses on excess requests)

### 1.3 CI Green

- [ ] **CI gates** — Confirm `types:ci`, `lint:strict`, Jest, contract tests, and Playwright smoke all pass green in GitHub Actions
- [ ] **Production E2E** — Run `npm run test:e2e:production` post-deploy; triage remaining 12 failures (auth timing, contact validation deploy, representative load time)
- [ ] **Post-deploy gate** — Confirm `deploy.yml` runs production smoke after Vercel deploy

---

## 2. Post-Launch (P1)

### 2.1 E2E Test Stability

Full E2E suite: **171 passed, 42 skipped, 0 blocking failures** (remaining flaky tests are timing-dependent heading-structure checks).

| Test | Status | Notes |
|------|--------|-------|
| Auth login/registration | **Fixed** | Registration tests use relative URLs (Playwright baseURL); mock-mode skip for Supabase-dependent tests |
| Contact long email | Deployed | Validation returns 400; verify post-deploy |
| Poll creation flow | **Passing** | All 3 poll creation E2E tests green |
| Representatives load time | **Fixed** | Dev threshold raised to 20s (Babel, no SWC); production keeps 15s |
| Admin widget dashboard | **Passing** | WidgetRenderer stable refs fixed in prior round |
| Poll create from civics | Needs manual | `/polls/create?representative_id=...` flow |
| WCAG 2.1 AA (axe) | **Fixed** | Color contrast for muted-foreground (HSL lightness 47%→43%); poll filter buttons use solid `bg-primary` |

### 2.2 Accessibility QA

- [x] **WCAG 2.1 AA axe audit** — 10 critical pages pass axe (landing, dashboard, feed, civics, reps, polls, profile, admin dashboard/feedback/users)
- [ ] **Screen reader testing** — NVDA/JAWS/VoiceOver on key flows (auth, voting, dashboard)
- [ ] **Keyboard navigation audit** — Tab order through all pages; verify focus management on modals/dialogs
- [ ] **Heading hierarchy** — Confirm h1→h2→h3 order on all pages (some pages flaky in E2E due to hydration timing)
- [ ] **Analytics chart text alternatives** — Verify chart descriptions for screen readers

### 2.3 Performance

- [ ] **Bundle analysis** — Run `@next/bundle-analyzer`; confirm each route bundle <100KB compressed
- [ ] **Core Web Vitals** — LCP <2s on key pages; CLS <0.1; FID <100ms
- [ ] **Mobile touch targets** — Verify all interactive elements ≥44px
- [ ] **Representative list virtualization** — 8,600+ cards render in DOM; consider virtualization for lower-end devices

---

## 3. Post-Launch (P2)

### 3.1 UX Issues (from UX/UI Audit)

All identified UX issues have been resolved. See **Completed** section for details.

### 3.2 Testing Coverage

- [ ] **Store test harnesses** — Expand coverage for adminStore, analyticsStore, appStore, deviceStore, feedsStore, pollsStore, hashtagStore, votingStore
- [ ] **Playwright harness stability** — Reduce flake; expand admin/app specs; use `data-*-harness` and stable selectors
- [ ] **Contract tests** — Keep candidate/civics/admin route contracts green; add new contracts for contact/voting routes

### 3.3 i18n

- [ ] **Automated extraction** — Wire `npm run i18n:extract` into CI
- [ ] **Locale lint** — Promote missing-key warnings to errors after soak period
- [ ] **Copy freeze** — Establish process for translation freeze before releases

### 3.4 Civics Ingest

- [ ] **Phase 6: CI smoke tests** — Add CI smoke tests and metrics/logging for ingest scripts
- [ ] **Data quality** — Populate party affiliation for representatives; fix "District 0" for at-large

### 3.5 Code TODOs (Optional Enhancements)

| Location | Description |
|----------|-------------|
| `web/features/admin/components/UserManagement.tsx` | Full edit modal for user fields (beyond role) |
| `web/features/polls/components/AdvancedAnalytics.tsx` | Chart visualization (Recharts) — placeholder |

---

## 4. Future Features (P3 / Unscoped)

These require product definition before development starts.

| Feature | Current State | What's Needed |
|---------|---------------|---------------|
| **Supabase Realtime for live vote counts** | Not wired | Backend subscriptions; client integration |
| **Comment threads on polls** | Not started | Full product spec + UI + moderation |
| **User reputation system** | Not started | Product spec + scoring algorithm |
| **Personalized recommendations** | Not started | Product spec + ML pipeline |
| **Automated poll generation** | Flag exists, no implementation | Product spec + API + UI |
| **Social sharing — civics/visual/OG** | Master flag shipped; civics/OG on hold | New surfaces + moderation hooks |
| **Advanced privacy (ZK/DP)** | Concept only | Research + pipeline design |
| **Social signup (OAuth)** | Not implemented | Supabase providers + controllers + onboarding |
| **Device Flow Auth** | Implementation complete; no E2E | E2E specs + Supabase OAuth config |
| **Global search (Cmd+K)** | Command palette shipped | Expand with search suggestions, recent searches |

### Quarantined Feature Flags

These flags exist in `web/lib/core/feature-flags.ts` but have no active development:

`AUTOMATED_POLLS`, `SOCIAL_SHARING_CIVICS`, `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG`, `CIVICS_TESTING_STRATEGY`, `ADVANCED_PRIVACY`, `SOCIAL_SIGNUP`

**Policy:** Do not start work unless product explicitly unquarantines. Review quarterly; delete flags when product deprecates.

---

## 5. Commands

```bash
# From web/
npm run dev              # Dev server (port 3000)
npm run check            # types:ci + lint:strict + Jest (CI baseline)
npm run types:ci         # TypeScript check
npm run lint             # ESLint
npm run test             # Jest unit + integration
npm run test:e2e:smoke   # Playwright smoke
npm run test:e2e         # Full Playwright suite
npm run test:e2e:axe     # Accessibility tests
npm run build            # Production build

# Repo root
npm run governance:check # Store/API change doc check
```

---

## 6. Completed (Reference)

<details>
<summary>Expand completed work history</summary>

- **P0 production readiness (Dec 2025):** Email deliverability, candidate verification, admin observability, security baseline, CI gates
- **Contact system GA:** RLS, rate limits, admin UI, bulk approve/reject, My Submissions
- **Civic Engagement v2 GA:** API + UI on rep detail; create/sign at `/civic-actions/*`
- **Push Notifications GA:** Delivery logging, `notification_log`
- **Testing (March 2026):** Jest 352 tests; E2E smoke 13; axe 36; error-paths + critical-journey; contact validation unit tests; feature-flags contract; test suite audit
- **Feature flag gating (March 2026):** Contact messages/threads return 403 when flag off; My Submissions and `/contact/history` gated; ShareAnalyticsPanel uses `useFeatureFlag`
- **UX/UI elevation (March 2026):** 7 rounds — design tokens (40+ files), Framer Motion animations, accessibility (focus traps, LiveAnnouncer, keyboard nav, password toggles), performance (React.memo, dynamic imports, FeedContext), security hardening (rate limiting 20+ routes, CSRF, E2E bypass, webhook secrets, input sanitization), error boundaries (global + 6 route + 7 loading), code quality (50+ `any` types, 8 dead files, 19 unused exports, 4 duplicate components removed). Zero TypeScript errors, zero ESLint errors.
- **Documentation consolidation (March 2026):** 35 files archived; docs streamlined to 14 active files + 4 API docs
- **UX polish (March 2026):** Desktop nav bar (md+ breakpoint), auth error summary removed, hashtag API request dedup, site message 30-day auto-expiration, landing page mobile overflow fix, CTA copy unified ("Sign in" / "Get Started" everywhere), representative party/district display (hide "—" party, District 0 → At-large, senators → Statewide), civics state filter stays interactive during load with spinner feedback
- **E2E test stability + a11y (March 2026):** Fixed registration test URLs (use Playwright baseURL), added mock-mode skips for Supabase-dependent auth tests, adjusted dev-server perf thresholds (Babel), resolved WCAG color-contrast violations (`--muted-foreground` darkened, poll filter buttons use solid background), 10/10 critical pages pass axe. Full suite: 354 Jest + 13 smoke + 171 E2E passing.

</details>

---

**Owner:** Core maintainer  
**Update cadence:** When completing or adding items; review at least monthly

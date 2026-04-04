# Roadmap

_Last updated: April 4, 2026_

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

- [x] **CI gates** — `types:ci`, `lint:strict`, Jest (357), contract tests (30), Playwright smoke (13) all pass green (verified locally March 2026)
- [ ] **Production E2E** — Run `npm run test:e2e:production` post-deploy; triage remaining failures (auth timing, contact validation deploy, representative load time). Requires `E2E_USER_*` and `E2E_ADMIN_*` secrets.
- [x] **Post-deploy gate** — `deploy.yml` runs `test:e2e:production:smoke` after Vercel deploy (workflow_dispatch only)

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
- [ ] **Screen reader testing** — NVDA/JAWS/VoiceOver on key flows. Checklist: `docs/SCREEN_READER_TESTING.md`
- [x] **Keyboard navigation audit** — Tab order through all pages; verify focus management on modals/dialogs. _Checklist: `docs/KEYBOARD_NAVIGATION_AUDIT.md`_ E2E expanded; BottomSheet Escape support added.
- [x] **Heading hierarchy** — `docs/HEADING_HIERARCHY.md` documents expected structure; E2E uses assertAnyVisible + data-testid fallbacks
- [x] **Analytics chart text alternatives** — Chart containers have `role="img"`, `aria-labelledby`, and sr-only summaries with data

### 2.3 Performance

- [x] **Bundle analysis** — `npm run bundle:report` runs bundle-check; all chunks within thresholds (500KB max, 250KB chunk). See `docs/PERFORMANCE.md`.
- [ ] **Core Web Vitals** — LCP <2.5s on key pages; CLS <0.1; FID/INP <100ms. Measurement script: `npm run lighthouse:cwv` (see `docs/PERFORMANCE.md`)
- [x] **Mobile touch targets** — All interactive elements ≥44px (UX audit March 2026)
- [x] **Representative list virtualization** — `@tanstack/react-virtual` for 50+ cards; prevents DOM bloat on civics/representatives

---

## 3. Social-App Engagement Elevation

Vision: Make polling and data representation feel as fluid and engaging as social apps. Prioritize perceived speed, micro-interactions, and sticky engagement.

### 3.1 Phase 0 — Perceived Speed ✓

- [x] **Optimistic voting** — Single, approval, and multiple-choice: vote counts update immediately; rollback on failure. (Ranked/quadratic/range still refetch.)
- [x] **Skeleton loaders** — PollListSkeleton, RepresentativeCardSkeleton, FeedSkeleton, FeedItemSkeleton already in use on polls, civics, feed

### 3.2 Phase 1 — Fluid Data Display

- [x] **Infinite scroll** — Load more polls on scroll via IntersectionObserver; civics "Load more" triggers automatically when sentinel visible
- [x] **Animated vote bars** — AnimatedVoteBar wired to PollClient poll options; PollResults components already use it
- [x] **Sticky filter tabs** — Poll filters, civics search/filters, representatives sidebar, contact history filter bar all sticky
- [x] **Smooth scroll** — `scroll-behavior: smooth` on html; BackToTop button on polls page

### 3.3 Phase 2 — Social-Style Engagement

- [ ] **Activity feed** — "Your rep responded to a poll", "New poll in your district", "3 people you follow voted"
- [ ] **Notifications** — Push for poll closing soon, rep responses, new polls in followed topics
- [x] **Share cards (OG images)** — Poll opengraph-image with title, options, vote counts (polls/[id]/opengraph-image.tsx)
- [x] **Pull-to-refresh** — usePullToRefresh on polls page; feed already has it

### 3.4 Phase 3 — Scale & Polish

- [x] **Representative list virtualization** — `@tanstack/react-virtual` for 50+ cards on civics/representatives
- [x] **Route prefetching** — PrefetchLink on polls (View/Results), nav, rep cards; prefetch on rep list hover
- [x] **Bottom sheet modals** — Vote confirmation on mobile before submitting (single, approval, multiple, ranked, range, quadratic)
- [x] **Haptic feedback** — Vote success, poll/civics filters, feed like/bookmark/share, rep follow/contact, hashtag follow/ unfollow, contact history actions

### 3.5 Data Visualization Enhancements

- [x] **Progress indicators** — "Community engagement" bar with X of Y votes toward next milestone (25, 50, 100, …) on poll detail
- [x] **Sparklines** — Small trend charts for poll activity over time (PollActivitySparkline on poll detail; `/api/polls/[id]/activity`)
- [x] **Comparison views** — Side-by-side comparison of top 2 poll options (PollOptionComparison on poll detail)

---

## 3.6 Data Integrity (Audit March 2026)

- [x] **Feedback API XSS** — Sanitize `title` and `description` with `sanitizeInput` before DB insert (admin views feedback in UI)
- [x] **Hashtag flags API** — Validate and sanitize `hashtag`, `reason` before insert; add Zod schema; use session.user.id (no impersonation)
- [x] **DB unique constraints** — `UNIQUE (poll_id, user_id)` on `poll_rankings` applied; vote route handles 23505 as "already voted"
- [x] **Input sanitization audit** — Feedback, hashtags, contact, polls, site-messages, moderation reports/appeals, admin feedback respond now sanitize user text

---

## 3.7 Voting Integrity (Audit March 2026)

- [x] **Race condition (ranked)** — DB `UNIQUE` on poll_rankings prevents double-vote when two requests race; vote route returns "already voted" on 23505
- [x] **Optimistic voting** — Extended to approval and multiple-choice; ranked/quadratic/range still refetch
- [x] **Vote confirmation (mobile)** — Bottom-sheet confirmation before submit to reduce mis-taps
- [x] **Offline vote sync** — PWA sync route checks (poll_id, user_id) before insert; skips duplicates; prefers online vote
- [x] **Admin vote audit** — View vote history (who voted when, poll, option) for investigations (API + VoteAuditPanel on poll page for admins)

---

## 4. Post-Launch (P2)

### 4.1 UX Issues (from UX/UI Audit)

All identified UX issues have been resolved. See **Completed** section for details.

### 4.2 Testing Coverage

- [x] **Store test harnesses** — feedsStore (7 tests), pollsStore (7 tests) unit tests added; adminStore, analyticsStore, deviceStore, votingStore have integration/unit coverage
- [x] **Playwright harness stability** — `docs/HEADING_HIERARCHY.md` documents expected structure and data-testid fallbacks; admin pages use stable selectors
- [x] **Contract tests** — Admin vote-audit, contact (messages/threads 403 when flag off), device-flow; 9 suites, 37 tests green

### 4.3 i18n

- [x] **Automated extraction** — `ci.yml` and `web-ci.yml` run `i18n:extract` and fail if `messages/en.snapshot.json` changed
- [x] **Locale lint** — `i18n:validate` blocks CI; `i18n:sync` copies missing en keys to es as placeholders. Run `npm run i18n:sync` after adding new keys, then translate.
- [x] **Copy freeze** — Process documented in `docs/COPY_FREEZE.md` (announce freeze, extract, complete translations, verify CI)

### 4.4 Civics Ingest

- [x] **Phase 6: CI smoke tests** — `civics-backend-ci.yml` runs `tools:smoke-test --quick` (continue-on-error for forked PRs)
- [x] **Data quality** — Populate party affiliation for representatives. _District 0 → At-large fixed._ Enrich-congress-ids now backfills `party` from Congress.gov when rep has bioguide but empty party.

### 4.5 Code TODOs (Optional Enhancements)

| Location | Description |
|----------|-------------|
| ~~`web/features/admin/components/UserManagement.tsx`~~ | ~~Full edit modal for user fields (beyond role)~~ — UserEditModal added; Edit opens modal for username + role |
| ~~`web/features/polls/components/AdvancedAnalytics.tsx`~~ | ~~Chart visualization (Recharts)~~ — trust-tier, temporal, geographic charts added |

---

## 5. Future Features (P3 / Unscoped)

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
| **Device Flow Auth** | Implementation complete; contract tests added | Contract tests for POST /api/auth/device-flow; Supabase OAuth config for full E2E |
| **Global search (Cmd+K)** | Command palette shipped | Expand with search suggestions, recent searches |

### Quarantined Feature Flags

These flags exist in `web/lib/core/feature-flags.ts` but have no active development:

`AUTOMATED_POLLS`, `SOCIAL_SHARING_CIVICS`, `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG`, `CIVICS_TESTING_STRATEGY`, `ADVANCED_PRIVACY`, `SOCIAL_SIGNUP`

**Policy:** Do not start work unless product explicitly unquarantines. Review quarterly; delete flags when product deprecates.

---

## 6. Commands

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
npm run lighthouse:cwv    # Run Lighthouse on key pages (dev server or pass URL)
npm run i18n:extract      # Refresh en.snapshot.json
npm run i18n:validate     # Ensure en keys exist in es (CI-blocking)
npm run i18n:sync         # Copy missing en keys to es as placeholders (run after adding new keys)

# Repo root
npm run governance:check # Store/API change doc check
```

---

## 7. Completed (Reference)

<details>
<summary>Expand completed work history</summary>

- **P0 production readiness (Dec 2025):** Email deliverability, candidate verification, admin observability, security baseline, CI gates
- **Contact system GA:** RLS, rate limits, admin UI, bulk approve/reject, My Submissions
- **Civic Engagement v2 GA:** API + UI on rep detail; create/sign at `/civic-actions/*`
- **Push Notifications GA:** Delivery logging, `notification_log`
- **Testing (March 2026):** Jest 352 tests; E2E smoke 13; axe 36; error-paths + critical-journey; contact validation unit tests; feature-flags contract; test suite audit
- **Feature flag gating (March 2026):** Contact messages/threads return 403 when flag off; My Submissions and `/contact/history` gated; ShareAnalyticsPanel uses `useFeatureFlag`
- **UX/UI elevation (March 2026):** 7 rounds — design tokens (40+ files), Framer Motion animations, accessibility (focus traps, LiveAnnouncer, keyboard nav, password toggles), performance (React.memo, dynamic imports, FeedContext), security hardening (rate limiting 20+ routes, CSRF, E2E bypass, webhook secrets, input sanitization), error boundaries (global + 6 route + 7 loading), code quality (50+ `any` types, 8 dead files, 19 unused exports, 4 duplicate components removed). Zero TypeScript errors, zero ESLint errors.
- **Social-App Phase 0 (March 2026):** Optimistic voting for single-choice polls; skeleton loaders (PollListSkeleton, RepresentativeCardSkeleton, FeedSkeleton) in use; AnimatedVoteBar wired to PollClient poll options.
- **Social-App Phase 1–2 polish (March 2026):** Pull-to-refresh on polls (usePullToRefresh); haptic on vote success + filter/category taps; participation progress bar on poll detail ("X of Y" toward milestones); sticky filters + BackToTop on civics; OG share cards for polls (existing).
- **Documentation consolidation (March 2026):** 35 files archived; docs streamlined to 14 active files + 4 API docs
- **UX polish (March 2026):** Desktop nav bar (md+ breakpoint), auth error summary removed, hashtag API request dedup, site message 30-day auto-expiration, landing page mobile overflow fix, CTA copy unified ("Sign in" / "Get Started" everywhere), representative party/district display (hide "—" party, District 0 → At-large, senators → Statewide), civics state filter stays interactive during load with spinner feedback
- **E2E test stability + a11y (March 2026):** Fixed registration test URLs (use Playwright baseURL), added mock-mode skips for Supabase-dependent auth tests, adjusted dev-server perf thresholds (Babel), resolved WCAG color-contrast violations (`--muted-foreground` darkened, poll filter buttons use solid background), 10/10 critical pages pass axe. Full suite: 354 Jest + 13 smoke + 171 E2E passing.
- **Deploy (March 2026):** Pushed UX/UI audit + E2E/a11y fixes to `origin/main`; types, lint, build all green.
- **Roadmap elevation (March 2026):** Added Social-App Engagement section (Phases 0–3 + data viz); checked off mobile touch targets, WCAG axe audit.
- **Comprehensive UX consistency (March 2026):** BackToTop on feed, representatives, contact, hashtags, poll/rep detail, analytics, profile; pull-to-refresh on civics, representatives, contact history; haptic on rep card, representatives page, contact history, hashtags, feed share, analytics tabs, profile buttons; sticky sidebar (representatives), sticky filters (contact history); route prefetch on rep list hover; ContactThreadListSkeleton, HashtagDisplaySkeleton, HashtagTrendingSkeleton; infinite scroll on civics via IntersectionObserver.
- **Data & voting integrity (March 2026):** Feedback API sanitizes title/description (XSS); hashtag flags API validates + sanitizes with Zod; poll_rankings UNIQUE(poll_id, user_id) prevents ranked double-vote; vote route returns "already voted" on unique violation; site-messages, moderation reports/appeals, admin feedback respond sanitize user text.
- **Roadmap verification (March 2026):** CI gates verified (types, lint, Jest 357, contracts 30, smoke 13); bundle-check passes; i18n extraction already in CI; post-deploy smoke gate confirmed in deploy.yml.
- **Roadmap automation (March 2026):** Admin vote audit (API + VoteAuditPanel); vote-audit contract test; civics ingest CI smoke step; store harness expansion deferred.
- **Roadmap thorough pass (March 2026):** feedsStore + pollsStore unit tests (14 tests); contact API contract (2 tests); HEADING_HIERARCHY.md; roadmap §4.2 and §2.2 updated.
- **Civics + i18n (March 2026):** formatRepresentativeLocation normalizes "District 0"/"0"/"at-large" → "At-large"; COPY_FREEZE.md process; i18n:validate script + CI step (continue-on-error until en/es synced).

</details>

---

**Owner:** Core maintainer  
**Update cadence:** When completing or adding items; review at least monthly  
**Last verified:** 2026-04-04 (documentation accuracy and codebase-reference review)

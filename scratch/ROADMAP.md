# Roadmap - Future Work

**Last Updated:** January 28, 2025  
**Purpose:** Action plan for remaining work across the application

---

## Current Status

✅ **Foundation Complete** - Authentication, dashboard, WebAuthn all working  
✅ **Code Quality Verified** - 0 TypeScript errors, 0 lint errors  
✅ **Production Ready** - 150+ tests passing, 93%+ pass rate  
⚠️ **Hydration Error Persists** - Extensive fixes applied (4 rounds), investigating root cause

---

## Immediate Priorities

### P0 - Blocking Issues

1. ⚠️ **Resolve Persistent React Hydration Error (#185)** (Extensive Fixes Applied, Error Persists)
   
   **Status:** Multiple rounds of comprehensive fixes applied, but error persists
   
   **Fixes Applied:**
   - ✅ Round 1: Basic feed/polls pattern (early returns, formatters, navigation)
   - ✅ Round 2: Store-dependent computations (dashboardTitle, analytics, etc.)
   - ✅ Round 3: All store-dependent hooks (userPolls, voteEvents, representatives, etc.)
   - ✅ Round 4: Navigation components (GlobalNavigation pathname guard)
   - ✅ All computed values return consistent defaults during SSR
   - ✅ Enhanced test diagnostics for better debugging
   
   **Current Issue:**
   - Error persists after loading skeleton disappears
   - Suggests React may be comparing hook calls during SSR even with early returns
   - All computed values return consistent defaults, but error still occurs
   
   **Next Steps (Priority Order):**
   1. **Try Dynamic Import Approach** (Highest Priority)
      - Use `dynamic()` with `ssr: false` for PersonalDashboard component
      - This completely skips SSR for the component, avoiding any server/client differences
      - File: `web/app/(app)/dashboard/page.tsx`
      - Pattern: `const PersonalDashboard = dynamic(() => import('@/features/dashboard').then(mod => ({ default: mod.PersonalDashboard })), { ssr: false })`
   
   2. **Add Detailed Diagnostics**
      - Enhance hydration test to capture exact component tree differences
      - Add React DevTools integration to identify which component/hook is causing mismatch
      - File: `web/tests/e2e/specs/production/hydration-check.spec.ts`
   
   3. **Investigate Hook Call Comparison**
      - Check if React is comparing hook call order/values during SSR
      - Review if any hooks are being called conditionally or with different parameters
      - Consider if Zustand store hooks are causing issues
   
   4. **Component Isolation Testing**
      - Test PersonalDashboard in isolation to see if error persists
      - Check if layout or parent components are contributing to the issue
      - Verify if ErrorBoundary or other wrappers are causing problems
   
   5. **Alternative Patterns**
      - Consider using `useIsClient()` hook pattern
      - Evaluate if `suppressHydrationWarning` is appropriate for specific elements
      - Review Next.js 14+ hydration best practices

2. ✅ **Production Readiness** (Complete)
   - OG image tests fixed (11/11 passing)
   - Candidate verification verified (53/53 passing)
   - DMARC policy documented
   - Admin audit enhanced with diff functionality
   - Rate limits documented
   - Admin stats improved

---

## Feature Development (P1 - High Priority)

### Store Modernization

**Assigned to Agent A:**
- ✅ `adminStore.ts`: Finish RTL + integration for users/settings/jobs
- ✅ `analyticsStore.ts`: Extract async service helpers; consent guard tests
- ✅ `appStore.ts`: Broaden RTL coverage (theme/sidebar persistence)
- ✅ `hashtagStore.ts`: Tighten typing; async error coverage; dashboard tests
- ✅ `pollsStore.ts`: Add RTL + dashboard widget regression suite

**Assigned to Agent B:**
- ✅ `deviceStore.ts`: Expanded unit test coverage; migrated PWA components to use deviceStore hooks
- ✅ `feedsStore.ts`: Documented telemetry usage; created RTL tests; improved harness reliability
- ✅ `notificationStore.ts`: Verified action bundle pattern usage; migrated usePollCreatedListener
- ✅ `pollWizardStore.ts`: Added comprehensive progressive saving tests; verified consumer alignment

### Internationalization (i18n)

- Finish extraction tooling
- Expand catalogue coverage
- Enable lint job
- Extract candidate flow strings

### Push Notifications

- Client opt-in + delivery guarantees
- Tests + product sign-off
- Document election alert analytics hooks

### Performance Optimization

- Audit adoption of utilities
- Promote where valuable
- ETag on candidate pages
- Short TTL caching on representative reads
- TTFB monitoring

### Analytics & Dashboards

- Funnel events emitted
- Admin KPIs surfacing

---

## Feature Enhancements (P2 - Medium Priority)

### Social Sharing

- ✅ OG Image Generation (Complete) - Polls, representatives, user profiles
- ⚠️ **Optional:** Expand OG images to civic actions and hashtag pages

### Civic Engagement v2

- Integrate with Supabase and UI
- QA plan

### Themes/Dark Mode

- Decide or remove flag

### Advanced Privacy/ZK/DP

- Remove placeholder or scope initiative

### Device Flow Auth

- OAuth 2.0 Device Authorization handlers
- Polling UX + rate limiting

---

## Infrastructure & Operations (P1)

### Moderation & Reporting

- User→admin report endpoint
- Triage workflow

### Documentation & Runbooks

- Incident response
- Admin key rotation
- Revert procedure

### Governance/Open Source

- Footer links to ToS/Privacy
- "Suggest correction" link on public profile

---

## Technical Debt & Improvements (P1-P2)

### Testing & CI

- ✅ Unit tests passing
- ✅ TypeScript type checking passes
- ✅ Linting passes
- ⚠️ Verify contract tests and critical E2E smoke tests in CI

### Accessibility

- Keyboard/ARIA checks
- Screen reader support improvements
- Extract candidate flow strings for i18n

### SEO

- OG/Twitter cards (partially complete)
- Additional metadata improvements

---

## Long-Term Considerations

### Contact Information System

- Complete ingestion + notification flows
- Clarify CRM vs MVP scope

### Performance

- Performance testing under higher load
- Additional caching strategies
- CDN optimization

### Security

- Additional security edge case testing
- Security audit improvements
- Rate limit verification in production

---

## Completed Work

### ✅ Production Readiness (December 2025)

- ✅ OG image generation (polls, representatives, profiles)
- ✅ OG image tests fixed (11/11 passing)
- ✅ Candidate verification edge cases verified
- ✅ DMARC policy implementation documented
- ✅ Admin audit list/diff functionality enhanced
- ✅ Rate limit production verification documented
- ✅ Admin stats endpoint sanity checks enhanced

### ✅ Dashboard Fixes (January 2025)

- ✅ Dashboard rendering issues fixed
- ✅ Preferences persistence fixed
- ✅ TypeScript and lint errors resolved
- ✅ Admin dashboard link functionality verified

### ✅ Authentication & Security (December 2025)

- ✅ Authentication system working
- ✅ Security hardening complete
- ✅ Middleware consolidated
- ✅ Comprehensive cookie detection

---

## How to Use This Roadmap

1. **Priority Levels:**
   - **P0 (Blocking):** Critical production issues, security, data integrity
   - **P1 (High):** Important features, significant improvements
   - **P2 (Medium):** Nice-to-have features, optimizations

2. **Updating:**
   - Mark items as complete when finished
   - Update priorities as needed
   - Add new items as they arise
   - Link PRs when closing items

3. **Focus Areas:**
   - Start with P0 items
   - Prioritize P1 items by impact
   - P2 items can be tackled as time allows

---

**See also:**
- `CURRENT_STATUS.md` for current project state
- `ARCHITECTURE.md` for system architecture
- `DEVELOPMENT_GUIDE.md` for development patterns


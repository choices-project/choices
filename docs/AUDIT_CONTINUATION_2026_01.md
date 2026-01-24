# Codebase Audit Continuation — January 2026

**Date:** January 24, 2026  
**Scope:** Continuing best-practices audit for Supabase/Vercel patterns and UX/UI improvements  
**Previous work:** See [BEST_PRACTICES_AUDIT.md](../scratch/BEST_PRACTICES_AUDIT.md), [APPLICATION_AUDIT_OPTIMIZATION.md](../scratch/APPLICATION_AUDIT_OPTIMIZATION.md)

---

## Executive Summary

This audit continues the systematic review of the codebase for:
1. **Remaining `select('*')` usage** — Replace with explicit column selects
2. **API route waterfalls** — Parallelize independent operations
3. **UX/UI improvements** — Loading states, error boundaries, empty states, accessibility
4. **Bundle optimization** — Dynamic imports, code splitting opportunities

**Status:** ~65% of `select('*')` refactors complete. P1 API count queries **done**. Remaining work primarily in civics services, analytics, and feature libs.

---

## 1. Remaining `select('*')` Usage

### P1 — High Priority (API Routes & Core Services) ✅ DONE

**Completed (Jan 2026):** All P1 count queries now use `select('id')` (or explicit column). Admin store, contact messages/threads, analytics, stats/public, representatives/my, admin civics/stats, admin candidates/stats.

- [x] **1.1 Admin Store** — `select('id')` for user_profiles, polls, votes counts.
- [x] **1.2 Contact Messages API** — `select('id')` for count; messages + count parallelized; count filters (threadId, status, priority) aligned with data query.
- [x] **1.3 Contact Threads API** — `select('id')` for count; threads + count parallelized.
- [x] **1.4 Analytics API** — `select('id')` for polls count.
- [x] **1.5 Stats/Public API** — `select('id')` for polls count.
- [x] **1.6 Representatives/My API** — `select('id')` for count.
- [x] **1.7 Admin Civics Stats** — `select('id')` for reps count.
- [x] **1.8 Admin Candidates Stats** — `select('id')` for all three count queries.

---

### P2 — Medium Priority (Feature Services)

#### 2.1 FEC Service (`web/lib/civics/fec-service.ts`)
**Lines:** 343, 367, 387, 411, 435, 543, 605, 661, 722, 782-786  
**Issue:** Multiple `select('*')` calls for FEC data  
**Impact:** Medium — FEC tables may have many columns  
**Fix:** Create `FEC_*_SELECT_COLUMNS` constants in `response-builders.ts`:
```typescript
// Add to response-builders.ts
export const FEC_CYCLE_SELECT_COLUMNS = 'id, cycle, is_current, start_date, end_date, created_at, updated_at';
export const FEC_CANDIDATE_SELECT_COLUMNS = 'id, candidate_id, name, party, office, state, district, cycle, ...';
// etc.
```

**Files to update:**
- `getFECCycle()` — line 343
- `getAllFECCycles()` — line 367
- `getCurrentFECCycle()` — line 387
- `getFECCommittee()` — line 411
- `getFECCommittees()` — line 435
- `getFECContributions()` — line 543
- `getFECDisbursements()` — line 605
- `getFECIndependentExpenditures()` — line 661
- `getFECStats()` — lines 782-786 (count queries)

#### 2.2 Provenance Service (`web/lib/civics/provenance-service.ts`)
**Lines:** 419, 500, 580  
**Issue:** `select('*')` for provenance data  
**Fix:** Create `PROVENANCE_*_SELECT_COLUMNS` constants.

#### 2.3 Geographic Service (`web/lib/civics/geographic-service.ts`)
**Lines:** 172, 224, 271, 328, 432-435  
**Issue:** `select('*')` for geographic lookups  
**Fix:** Create `GEOGRAPHIC_*_SELECT_COLUMNS` constants.

#### 2.4 Civics Integration (`web/lib/services/civics-integration.ts`)
**Line:** 226  
**Issue:** `select('*')` for representative data  
**Fix:** Use explicit columns (may already have constants).

#### 2.5 Civic Actions Integration (`web/lib/utils/civic-actions-integration.ts`)
**Lines:** 46, 154, 192  
**Issue:** `select('*')` for civic actions  
**Fix:** Use `CIVIC_ACTION_SELECT_COLUMNS` (already defined in `response-builders.ts`).

#### 2.6 Canonical ID Service (`web/lib/civics/canonical-id-service.ts`)
**Line:** 121  
**Issue:** `select('*')` for canonical IDs  
**Fix:** Create `CANONICAL_ID_SELECT_COLUMNS` constant.

#### 2.7 Hashtag Service (`web/features/hashtags/lib/hashtag-service.ts`)
**Lines:** 539, 1008, 1022, 1160, 1188, 1748, 1814  
**Issue:** Multiple `select('*')` calls  
**Fix:** Use existing `HASHTAGS_*_SELECT_COLUMNS` constants from `response-builders.ts`.

#### 2.8 Hashtag Moderation (`web/features/hashtags/lib/hashtag-moderation.ts`)
**Lines:** 396, 618-623  
**Issue:** Count queries and data queries using `select('*')`  
**Fix:** Use existing constants for data queries, `select('id')` for counts.

#### 2.9 Analytics Service (`web/features/analytics/lib/analytics-service.ts`)
**Lines:** 276, 848  
**Issue:** `select('*')` for analytics queries  
**Fix:** Use explicit columns (analytics tables may have many columns).

---

### P3 — Low Priority (Scripts & Tests)

#### 3.1 Scripts
- `web/scripts/check-feedback.ts` — line 48
- `web/scripts/verify-admin-user.ts` — line 79
- `web/scripts/production-readiness-check.ts` — line 197

**Note:** Scripts are lower priority but should still use explicit selects for consistency.

#### 3.2 Tests
- Various test files use `select('*')` in mocks — acceptable for test code, but consider updating for consistency.

---

## 2. API Route Waterfall Opportunities

### 2.1 Analytics Unified Route (`web/app/api/analytics/unified/[id]/route.ts`)
**Status:** ✅ Already parallelized with `Promise.all()`

### 2.2 Demographics Route (`web/app/api/demographics/route.ts`)
**Status:** ✅ Done. Users, polls, votes parallelized with `Promise.all()`.

### 2.3 Contact Messages Route (`web/app/api/contact/messages/route.ts`)
**Status:** ✅ Done. Messages + count parallelized; count filters (threadId, status, priority) aligned with data query.

### 2.4 Contact Threads Route (`web/app/api/contact/threads/route.ts`)
**Status:** ✅ Done. Threads + count parallelized with `Promise.all()`.

### 2.5 Admin Dashboard Route (`web/app/api/admin/dashboard/route.ts`)
**Review needed:** Check for sequential independent queries that could be parallelized.

---

## 3. UX/UI Improvements

### 3.1 Loading States

#### ✅ Good Examples (Already Implemented)
- `DeviceList.tsx` — Has loading skeleton with spinner
- `ContactHistoryPage.tsx` — Has loading state with icon
- `SystemSettings.tsx` — Has skeleton loading state
- `ProfilePage.tsx` — Uses loading states from hooks

#### 🔧 Opportunities

**3.1.1 Feed Page (`web/app/(app)/feed/page.tsx`)**
**Issue:** Basic skeleton, could be more detailed  
**Recommendation:** Add skeleton cards matching feed item structure.

**3.1.2 Analytics Page (`web/app/(app)/analytics/page.tsx`)**
**Review needed:** Check if loading states are comprehensive for all chart/widget loads.

**3.1.3 Multi-step Forms**
- Onboarding flow — Add progress indicators
- Poll creation — Add step-by-step progress
- Candidate journey — Add progress tracking

### 3.2 Error Boundaries & Error Handling

#### ✅ Good Examples
- `DeviceList.tsx` — Uses `EnhancedErrorDisplay` with retry
- `ContactHistoryPage.tsx` — Has error state with retry
- `SystemSettings.tsx` — Has error display

#### 🔧 Opportunities

**3.2.1 Global Error Boundary**
**Recommendation:** Add React Error Boundary at app level to catch unhandled errors.

**3.2.2 API Error Recovery**
**Recommendation:** Add retry logic with exponential backoff for transient failures.

**3.2.3 Form Validation Errors**
**Status:** Some forms have validation, but could be more consistent  
**Recommendation:** Standardize inline validation patterns across all forms.

### 3.3 Empty States

#### ✅ Good Examples
- `DeviceList.tsx` — Uses `EnhancedEmptyState` with action button
- `ContactHistoryPage.tsx` — Has empty state message

#### 🔧 Opportunities

**3.3.1 Feed Empty State**
**Recommendation:** Add empty state with "Create Poll" CTA when feed is empty.

**3.3.2 Notifications Empty State**
**Recommendation:** Add contextual message when no notifications.

**3.3.3 Poll Results Empty State**
**Recommendation:** Add message when poll has no votes yet.

**3.3.4 Representatives List**
**Recommendation:** Add empty state with "Find Representatives" action.

### 3.4 Accessibility Improvements

#### ✅ Good Examples
- `LowBandwidthRankingForm.tsx` — Comprehensive ARIA labels, keyboard navigation
- `AccessibleRankingInterface.tsx` — Full keyboard support, screen reader announcements
- Focus management utilities in `web/lib/accessibility/screen-reader.ts`

#### 🔧 Opportunities

**3.4.1 Form Focus Management**
**Recommendation:** Ensure all modals and multi-step forms:
- Trap focus within modal
- Return focus on close
- Focus first invalid field on submit

**3.4.2 ARIA Landmarks**
**Status:** Partially implemented  
**Recommendation:** Verify `<main>` / `role="main"` on:
- Dashboard ✅ (check)
- Feed ✅ (check)
- Profile ✅ (check)
- Account ✅ (check)

**3.4.3 Keyboard Navigation**
**Recommendation:** Full keyboard-only pass on:
- Poll creation flow
- Onboarding steps
- Admin dashboard
- Contact forms

**3.4.4 Screen Reader Testing**
**Recommendation:** Manual testing with NVDA/JAWS/VoiceOver on:
- Auth flows
- Poll voting
- Profile editing
- Navigation

### 3.5 Mobile & Touch Improvements

#### 🔧 Opportunities

**3.5.1 Touch Targets**
**Recommendation:** Audit all buttons/links to ensure ≥44px touch targets.

**3.5.2 Mobile Forms**
**Recommendation:** 
- Avoid zoom traps (use `font-size: 16px` minimum on inputs)
- Add swipe gestures where appropriate
- Optimize form layouts for mobile

**3.5.3 Mobile Navigation**
**Recommendation:** Review mobile menu and navigation patterns.

---

## 4. Bundle Optimization Opportunities

### 4.1 Dynamic Imports

#### ✅ Already Implemented
- `UserManagement.tsx` — Already lazy loaded
- Some components use `next/dynamic`

#### 🔧 Opportunities

**4.1.1 Heavy Components**
**Recommendation:** Lazy load:
- Analytics charts/widgets
- Admin dashboard components
- Heavy form components (e.g., `BulkContactModal`)

**4.1.2 Third-Party Libraries**
**Recommendation:** Defer non-critical libraries:
- Analytics SDKs (load after hydration)
- Chart libraries (load on demand)
- Heavy UI libraries

### 4.2 Code Splitting

**4.2.1 Route-Based Splitting**
**Status:** Next.js App Router handles this automatically  
**Review:** Verify bundle sizes per route.

**4.2.2 Feature-Based Splitting**
**Recommendation:** Consider splitting large features:
- Analytics dashboard
- Admin panel
- Civics integration

### 4.3 Barrel File Imports

**Review needed:** Check for barrel file imports that could be direct imports:
- Icon libraries (lucide-react, etc.)
- Component libraries
- Utility libraries

---

## 5. Feature Flag Cleanup

### 5.1 Dead FeatureWrapper Helpers (`web/components/shared/FeatureWrapper.tsx`)
**Lines:** 365-403  
**Issue:** Several convenience components use non-existent flag IDs:
- `AuthFeature` → `"authentication"` ❌
- `VotingFeature` → `"voting"` ❌
- `DatabaseFeature` → `"database"` ❌
- `APIFeature` → `"api"` ❌
- `UIFeature` → `"ui"` ❌
- `AuditFeature` → `"audit"` ❌
- `ExperimentalUIFeature` → `"experimentalUI"` ❌

**Valid helpers:**
- `AnalyticsFeature` → `"analytics"` ✅
- `PWAFeature` → `"pwa"` ✅
- `AdminFeature` → `"admin"` ✅
- `AIFeaturesFeature` → `"aiFeatures"` ✅

**Recommendation:** Remove dead helpers or remap to real flag IDs if needed.

---

## 6. Recommended Action Plan

### Phase 1: High-Impact Quick Wins ✅ DONE
1. ✅ Fix count queries in API routes (use `select('id')` instead of `select('*')`) — admin store, contact messages/threads, analytics, stats/public, reps/my, admin civics/candidates stats
2. ✅ Parallelize independent queries: `demographics` (users+polls+votes), `contact/messages` (messages+count), `contact/threads` (threads+count)
3. ✅ Remove dead FeatureWrapper helpers (AuthFeature, VotingFeature, etc.)

### Phase 2: Service Refactors (3-5 days)
1. Create `FEC_*_SELECT_COLUMNS` constants and refactor FEC service
2. Create `PROVENANCE_*_SELECT_COLUMNS` and refactor provenance service
3. Create `GEOGRAPHIC_*_SELECT_COLUMNS` and refactor geographic service
4. Refactor hashtag service to use existing constants
5. Refactor analytics service

### Phase 3: UX/UI Enhancements (5-7 days)
1. Add comprehensive loading states to feed, analytics, and other pages
2. Implement global error boundary
3. Add empty states with CTAs
4. Improve form focus management
5. Complete ARIA landmarks audit
6. Mobile touch target audit

### Phase 4: Bundle Optimization (2-3 days)
1. Lazy load heavy components
2. Audit and fix barrel imports
3. Defer non-critical third-party libraries

---

## 7. Metrics & Success Criteria

### Performance
- [ ] All API routes use explicit `select()` columns
- [ ] No sequential waterfalls in API routes (independent queries parallelized)
- [ ] Bundle size reduced by 10-20% through lazy loading

### UX/UI
- [ ] All pages have loading states
- [ ] All pages have error states with recovery
- [ ] All pages have empty states with CTAs
- [ ] All forms have inline validation
- [ ] All modals have focus management
- [ ] Keyboard navigation works on all interactive elements

### Accessibility
- [ ] All pages have proper ARIA landmarks
- [ ] Screen reader testing completed on core flows
- [ ] All touch targets ≥44px
- [ ] Forms pass WCAG 2.1 AA

---

## 8. References

- [BEST_PRACTICES_AUDIT.md](../scratch/BEST_PRACTICES_AUDIT.md) — Previous audit work
- [APPLICATION_AUDIT_OPTIMIZATION.md](../scratch/APPLICATION_AUDIT_OPTIMIZATION.md) — Optimization backlog
- [FEATURE_FLAGS_AUDIT.md](./FEATURE_FLAGS_AUDIT.md) — Feature flag audit
- [Vercel React Best Practices](../.agents/skills/vercel-react-best-practices/AGENTS.md)
- [Supabase Postgres Best Practices](../.agents/skills/supabase-postgres-best-practices/AGENTS.md)

---

**Next Steps:** Prioritize Phase 1 items for immediate impact, then proceed with service refactors and UX improvements.

# Additional Issues Found During Fixes
**Date:** November 5, 2025  
**Priority:** 🟡 HIGH to 🟢 MEDIUM

These issues were discovered while fixing the critical problems but weren't addressed in the initial fix pass.

---

## 🔴 CRITICAL - Immediate Attention

### 1. **Duplicate Admin Hooks with Mock Data**
**Priority:** 🔴 CRITICAL  
**Impact:** Inconsistent admin functionality, mock data still in production

**Problem:**
There are **TWO** admin hooks files:
- ✅ `/web/lib/admin/hooks.ts` - Fixed (no mock data)
- ❌ `/web/features/admin/lib/hooks.ts` - **Still has mock data!**

**Evidence:**
```typescript
// web/features/admin/lib/hooks.ts (Lines 14-45)
const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Climate Change Policy',
    description: 'Analysis of climate change policy impacts...',
    // ... FAKE DATA
  }
];

const mockGeneratedPolls: GeneratedPoll[] = [ /* ... */ ];
const mockSystemMetrics: SystemMetrics = { /* ... */ };

// Line 60-63: STILL USING MOCK DATA
return data.topics || mockTrendingTopics;
// ...
devLog('Error fetching trending topics, using mock data', { error });
return mockTrendingTopics;
```

**Action Required:**
1. Determine which hooks file is canonical
2. Apply the same fixes to `/web/features/admin/lib/hooks.ts`
3. Or consolidate into one file
4. Check which components import which version

---

### 2. **Poll Service Using Mock Data by Default**
**Priority:** 🔴 CRITICAL  
**Impact:** Users may be seeing fake polls

**Problem:**
`/web/shared/core/services/lib/poll-service.ts` has config set to use mock data:

```typescript
// Line 224-229
const config = {
  useMockData: true, // ⚠️ Toggle between mock and real data
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  enableUserPolls: true,
  mockDataEnabled: true // ⚠️ Keep mock data available for testing
};
```

**Mock Data Present:**
- 6 fake polls (lines 57-218)
- All marked with `is_mock: true`
- Used when `useMockData: true`

**Action Required:**
1. Change `useMockData: false` in production
2. Add environment variable check
3. Log warnings when mock data is used
4. Remove mock data entirely or move to test files

---

### 3. **System Settings Page Using Mock Config**
**Priority:** 🟡 HIGH  
**Impact:** Admin seeing fake system configuration

**Problem:**
`/web/app/(app)/admin/system/page.tsx` falls back to mock data when API fails:

```typescript
// Lines 162-170
} else {
  logger.error('Failed to fetch system status:', new Error(`HTTP ${response.status}`));
  // Fall back to mock data if API fails
  setConfig(getMockConfig());  // ⚠️ Showing fake data
}

// Lines 179-228: Large getMockConfig() function with fake data
const getMockConfig = (): SystemConfig => ({
  general: {
    siteName: 'Choices Platform',  // Fake
    adminEmail: 'admin@choices.com',  // Fake
    // ...
  },
  database: {
    host: 'localhost',  // Fake
    connectionStatus: 'connected' as const,  // Misleading!
    // ...
  }
})
```

**Action Required:**
1. Show empty/error state instead of fake data
2. Add clear warning banner when showing mock data
3. Or remove mock fallback entirely

---

### 4. **Representative Service Has Mock Data**
**Priority:** 🟡 HIGH  
**Impact:** Users might see fake representatives

**Problem:**
`/web/lib/services/representative-service.ts` has hardcoded mock representatives:

```typescript
// Lines 27-116
// MOCK DATA (for development before real data is ready)
const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 1,
    name: "Alexandria Ocasio-Cortez",  // Real person but fake data
    party: "Democratic",
    // ... extensive fake data
  },
  {
    id: 2,
    name: "Ted Cruz",  // Real person but fake data
    // ...
  }
  // ... more fake representatives
];
```

**Action Required:**
1. Check if this mock data is actually being used
2. If yes, replace with API calls
3. If no, delete it
4. Move to test fixtures if needed for tests

---

## 🟡 HIGH PRIORITY

### 5. **Unused Import in Admin Hooks**
**Priority:** 🟢 MEDIUM  
**File:** `/web/lib/admin/hooks.ts`

**Problem:**
```typescript
// Line 6
import { mockActivityFeed } from './mock-data';
```

This import is no longer used after removing mock data but is still present.

**Action Required:**
Remove the import.

---

### 6. **TypeScript `any` Usage in UnifiedFeed**
**Priority:** 🟡 HIGH  
**File:** `/web/features/feeds/components/UnifiedFeed.tsx`

**Problem:**
7 instances of `: any` that should be properly typed:

```typescript
// Line 391
const scoredItems = filtered.map((item: any) => {

// Line 423
const trackEvent = useCallback((event: string, data?: any) => {

// Line 453
const trackEngagement = useCallback((action: string, itemId: string, metadata?: any) => {

// Line 507
const item = feeds.find((item: any) => item.id === itemId);

// Lines 1191, 1204, 1266
hashtagPollsFeed.recommended_polls.map((poll: any) => (
poll.hashtags.map((hashtag: any) => (
hashtagPollsFeed.hashtag_analytics.map((analytic: any) => (
```

**Action Required:**
1. Create proper types for feed items
2. Create proper types for polls and hashtags
3. Replace all `: any` with specific types

**Suggested Types:**
```typescript
type FeedItemWithScore = {
  item: FeedItem;
  score: number;
}

type TrackEventData = {
  platform?: string;
  handle?: string;
  url?: string;
  representative?: string;
}

type EngagementMetadata = {
  source?: string;
  context?: string;
  [key: string]: unknown;
}
```

---

### 7. **Database Migration Files Deleted?**
**Priority:** 🟡 HIGH  
**Concern:** Version control issue

**Problem:**
Git status shows:
```
D supabase/migrations/20251105000000_critical_missing_tables.sql
D supabase/migrations/20251105000001_critical_missing_tables.sql
```

These migration files were deleted but the tables they create are referenced in code.

**Questions:**
1. Were these migrations already applied?
2. Should they be deleted?
3. Do we need new migrations for the civic_database_entries table?

**Action Required:**
1. Check if tables exist in database
2. If not, restore migration files
3. If yes, document that migrations were applied
4. Create proper migration strategy going forward

---

### 8. **No Proper Logging Service**
**Priority:** 🟡 HIGH  
**Impact:** Console warnings in production

**Problem:**
During fixes, I added many `console.warn()` calls:
```typescript
console.warn('⚠️ Admin API: Trending topics endpoint failed. Returning empty data.');
console.warn('⚠️ Admin Dashboard: No trending topics data available.');
```

**Concerns:**
1. These appear in user's browser console
2. No central logging/monitoring
3. Can't track how often these occur
4. No alerting on production issues

**Action Required:**
1. Implement proper logging service (Sentry, LogRocket, etc.)
2. Replace `console.warn()` with proper logger
3. Add production monitoring
4. Set up alerts for critical warnings

---

## 🟢 MEDIUM PRIORITY

### 9. **Inconsistent Error Handling Patterns**
**Priority:** 🟢 MEDIUM  
**Impact:** Code maintainability

**Problem:**
Different files handle errors differently:
- Some throw errors
- Some log and continue
- Some return empty data
- Some return mock data

**Example Patterns Found:**
```typescript
// Pattern 1: Throw
if (error) {
  throw new Error('Failed to...')
}

// Pattern 2: Log and return empty
catch (error) {
  devLog('Error...', error);
  return [];
}

// Pattern 3: Log and return mock
catch (error) {
  devLog('Error...', error);
  return mockData;
}

// Pattern 4: Silent failure
catch (error) {
  // Don't throw - log and continue
}
```

**Action Required:**
1. Define standard error handling patterns
2. Document when to throw vs. when to return empty
3. Create error handling guidelines
4. Refactor for consistency

---

### 10. **Feature Flag Abstraction Needed**
**Priority:** 🟢 MEDIUM  
**Impact:** Future flexibility

**Current State:**
Good - using `isFeatureEnabled('FEATURE_NAME')` consistently

**Opportunity:**
Could enhance with:
```typescript
// Current: Binary on/off
isFeatureEnabled('WEBAUTHN')

// Enhanced: Gradual rollout, A/B testing
isFeatureEnabledForUser('WEBAUTHN', userId)
isFeatureEnabledWithPercentage('NEW_FEED', 50) // 50% of users

// With fallback handling
withFeatureFallback('WEBAUTHN', {
  enabled: () => biometricAuth(),
  disabled: () => passwordAuth(),
  fallback: 'password'
})
```

**Action Required:**
Consider implementing advanced feature flag system if needed.

---

### 11. **Test Coverage for Fixed Code**
**Priority:** 🟢 MEDIUM  
**Impact:** Regression prevention

**Problem:**
All the code I fixed/re-enabled needs tests:
- Analytics tracking with missing tables
- Hashtag filtering functionality
- WebAuthn fallback behavior
- PWA unregistration
- Mock data replacement

**Action Required:**
1. Add unit tests for re-enabled analytics functions
2. Add integration tests for hashtag filtering
3. Add E2E tests for WebAuthn fallback
4. Add tests for PWA lifecycle
5. Add tests that verify no mock data in production mode

---

## 📊 SUMMARY

| Issue Category | Count | Priority |
|----------------|-------|----------|
| Mock Data Still in Production | 4 | 🔴 CRITICAL |
| TypeScript Type Issues | 7+ | 🟡 HIGH |
| Unused Imports | 1 | 🟢 MEDIUM |
| Migration Concerns | 2 | 🟡 HIGH |
| Logging/Monitoring | 1 | 🟡 HIGH |
| Code Consistency | 2 | 🟢 MEDIUM |
| Test Coverage | 5 | 🟢 MEDIUM |

**Total Additional Issues: 22**

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Critical (This Week)
1. ✅ Fix duplicate admin hooks
2. ✅ Fix poll service mock data
3. ✅ Fix system settings mock data
4. ✅ Audit representative service usage

### Phase 2: High Priority (Next Week)
5. ✅ Remove unused imports
6. ✅ Fix TypeScript `any` usage
7. ✅ Resolve migration file issues
8. ✅ Implement proper logging service

### Phase 3: Medium Priority (This Month)
9. ✅ Standardize error handling
10. ✅ Add test coverage
11. ✅ Consider feature flag enhancements

---

## 🔍 DETECTION PATTERNS

For future audits, search for:
```bash
# Mock data patterns
grep -r "mock.*Data\|Mock.*=\|mockActivity\|mockTrending" web/

# Any type usage
grep -r ": any\b" web/ --include="*.ts" --include="*.tsx"

# Unused imports
# (Use eslint with no-unused-vars rule)

# Console statements in production
grep -r "console\.\(log\|warn\|error\)" web/ --include="*.ts" --include="*.tsx" | grep -v "// "

# Duplicate files (same name in different directories)
find web/ -name "hooks.ts" -o -name "store.ts" -o -name "types.ts"
```

---

**Next Steps:**
1. Review and prioritize these issues
2. Create GitHub issues for tracking
3. Assign to appropriate developers
4. Set deadlines based on priority

---

**Generated:** November 5, 2025  
**Discovered During:** Critical fixes audit and implementation  
**Status:** 📋 DOCUMENTED - Awaiting prioritization


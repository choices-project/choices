# Store Refactor Progress - Live Tracking

## ✅ ALREADY PERFECT (4/17 stores)
1. pollsStore.ts ✅
2. hashtagStore.ts ✅  
3. profileStore.ts ✅
4. representativeStore.ts ✅

## 🚧 QUICK WINS - IN PROGRESS

### 1. votingStore.ts
**Status**: Starting
**Action**: Import Poll, PollOption, Vote from features/voting/types
**Estimate**: 5 min

### 2. adminStore.ts
**Status**: Queued
**Action**: Import AdminNotification, PerformanceMetric from features/admin/types
**Estimate**: 5 min

### 3. analyticsStore.ts  
**Status**: Queued
**Action**: Import AnalyticsEvent, AnalyticsDashboard from features/analytics/types
**Estimate**: 5 min

### 4. pollWizardStore.ts
**Status**: Queued
**Action**: Import Poll from features/polls/types
**Estimate**: 5 min

## 📋 MEDIUM COMPLEXITY

### 5. userStore.ts
**Status**: Pending
**Action**: Import from features/auth/types and types/profile
**Estimate**: 10 min

### 6. feedsStore.ts
**Status**: Pending  
**Action**: Check feed_items table, import Row types
**Estimate**: 15 min

### 7. notificationStore.ts
**Status**: Pending
**Action**: Check notifications table, import Row types
**Estimate**: 10 min

## ✅ UI STORES (ACCEPTABLE AS-IS)

### 8. appStore.ts
**Status**: ✅ NO CHANGE NEEDED
**Reason**: UI state only (theme, sidebar) - no DB tables

### 9. deviceStore.ts
**Status**: ✅ NO CHANGE NEEDED
**Reason**: Device/network info - no DB tables

### 10. pwaStore.ts
**Status**: ✅ ALREADY IMPORTS
**Reason**: Already imports from types/pwa.ts

## 🔍 NEED REVIEW

### 11. onboardingStore.ts
**Status**: Review
**Question**: Should onboarding state be persisted to DB?
**Action**: TBD

### 12. performanceStore.ts
**Status**: Review
**Question**: Should performance metrics be in DB?
**Action**: TBD

### 13. hashtagModerationStore.ts
**Status**: Review
**Size**: Small (481 lines)
**Action**: Check if imports from features/hashtags

---

**Current Progress**: 4/17 perfect (23.5%)
**Target**: 17/17 perfect (100%)
**Est. Time Remaining**: 1-2 hours

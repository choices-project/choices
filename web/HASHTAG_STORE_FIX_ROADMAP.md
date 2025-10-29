# Hashtag Store Infinite Loop Fix Roadmap

**Created:** January 28, 2025  
**Status:** 🔧 IN PROGRESS  
**Priority:** HIGH - Critical functionality disabled

## 🎯 Objective
Fix the infinite loop issue in hashtag store hooks and restore all disabled functionality while maintaining system stability.

## 🔍 Root Cause Analysis
**UPDATED:** The infinite loop is caused by hashtag store hooks (`useHashtagStore`, `useHashtagActions`, `useHashtagStats`) that are triggering re-renders in a circular pattern.

**INVESTIGATION FINDINGS:**
- ✅ **Memoization Applied:** Added `shallow` equality checks to all hashtag store hooks
- ❌ **Still Failing:** Infinite loop persists even with memoization
- 🔍 **Deeper Issue:** The problem is likely in the store's internal state management or action implementations

## 📋 Disabled Functionality Inventory

### 1. **Hashtag Store Hooks** (CRITICAL)
- **File:** `web/lib/stores/hashtagStore.ts`
- **Disabled:** `useHashtagStore()`, `useHashtagActions()`, `useHashtagStats()`
- **Location:** `web/app/(app)/polls/page.tsx` (lines 85-96)
- **Impact:** No hashtag data loading, trending hashtags not working

### 2. **Hashtag Components** (HIGH)
- **Files:** 
  - `web/features/hashtags/components/HashtagInput.tsx`
  - `web/features/hashtags/components/HashtagDisplay.tsx`
- **Disabled:** Import and usage in polls page
- **Location:** `web/app/(app)/polls/page.tsx` (lines 7-9, 234-241, 315-335)
- **Impact:** Manual hashtag input only, no advanced hashtag features

### 3. **Enhanced Feedback Widget** (MEDIUM)
- **File:** `web/features/analytics/components/FeedbackWidget.tsx`
- **Status:** ✅ RESTORED with memoization fixes
- **Location:** `web/app/(app)/layout.tsx` (line 68)

## 🛠️ Fix Roadmap

### Phase 1: Diagnose Hashtag Store Issues (Priority: CRITICAL)
**Estimated Time:** 2-3 hours

#### 1.1 Analyze Hashtag Store Implementation
- [ ] **Examine `web/lib/stores/hashtagStore.ts`**
  - Check for circular dependencies in state updates
  - Look for `useEffect` with problematic dependencies
  - Identify state setters in dependency arrays
  - Check for infinite subscription patterns

#### 1.2 Check Store Hook Patterns
- [ ] **Review `useHashtagStore` implementation**
  - Verify selector functions are stable
  - Check for object/array recreation on every call
  - Ensure proper memoization

- [ ] **Review `useHashtagActions` implementation**
  - Check if actions are properly memoized
  - Verify no state updates in action definitions
  - Look for circular action calls

- [ ] **Review `useHashtagStats` implementation**
  - Check for derived state calculations
  - Verify no side effects in selectors

#### 1.3 Identify Specific Infinite Loop Pattern
- [ ] **Create minimal reproduction**
  - Isolate hashtag store usage
  - Create test component with only hashtag hooks
  - Identify exact trigger point

### Phase 1.5: Deep Store Investigation (Priority: CRITICAL)
**Estimated Time:** 1-2 hours

#### 1.5.1 Investigate Store Actions
- [ ] **Check action implementations**
  - Look for circular state updates in actions
  - Check for actions that call other actions
  - Verify no side effects in action definitions

#### 1.5.2 Check Store State Updates
- [ ] **Examine state update patterns**
  - Look for state updates that trigger other state updates
  - Check for immer usage causing issues
  - Verify no infinite state update loops

#### 1.5.3 Test Individual Hooks
- [ ] **Isolate each hook**
  - Test `useHashtagStore()` alone
  - Test `useHashtagActions()` alone  
  - Test `useHashtagStats()` alone
  - Identify which specific hook causes the loop

### Phase 2: Fix Hashtag Store Implementation (Priority: CRITICAL)
**Estimated Time:** 3-4 hours

#### 2.1 Fix State Management Issues
- [ ] **Fix circular dependencies**
  - Remove state setters from `useEffect` dependencies
  - Use `useCallback` for action functions
  - Implement proper memoization

- [ ] **Fix subscription patterns**
  - Ensure subscriptions are properly cleaned up
  - Prevent unnecessary re-subscriptions
  - Use stable references for callbacks

#### 2.2 Optimize Store Hooks
- [ ] **Memoize selectors**
  - Use `useMemo` for expensive calculations
  - Ensure selectors return stable references
  - Implement proper equality checks

- [ ] **Fix action memoization**
  - Wrap actions in `useCallback`
  - Ensure action dependencies are stable
  - Prevent action recreation on every render

#### 2.3 Test Store Fixes
- [ ] **Create isolated test**
  - Test hashtag store hooks in isolation
  - Verify no infinite loops
  - Check performance impact

### Phase 3: Restore Hashtag Components (Priority: HIGH)
**Estimated Time:** 1-2 hours

#### 3.1 Re-enable Hashtag Store Hooks
- [ ] **Restore in polls page**
  - Uncomment hashtag store calls (lines 85-96)
  - Test for infinite loops
  - Verify data loading works

#### 3.2 Restore Hashtag Components
- [ ] **Re-enable HashtagInput**
  - Uncomment import (line 8)
  - Replace manual input with component (lines 234-241)
  - Test functionality

- [ ] **Re-enable HashtagDisplay**
  - Uncomment import (line 9)
  - Replace manual display with component (lines 315-335)
  - Test trending hashtags display

#### 3.3 Test Integration
- [ ] **End-to-end testing**
  - Test hashtag input functionality
  - Test hashtag filtering
  - Test trending hashtags display
  - Verify no infinite loops

### Phase 4: Comprehensive Testing (Priority: HIGH)
**Estimated Time:** 1-2 hours

#### 4.1 E2E Test Validation
- [ ] **Run system-tailored E2E tests**
  - Verify polls page loads without infinite loops
  - Test hashtag functionality
  - Check performance metrics

#### 4.2 Performance Testing
- [ ] **Monitor render cycles**
  - Check for excessive re-renders
  - Verify memory usage
  - Test with large datasets

#### 4.3 Regression Testing
- [ ] **Test other pages using hashtag store**
  - Check civics-2-0 page
  - Test feed page
  - Verify no new issues introduced

### Phase 5: Documentation and Cleanup (Priority: MEDIUM)
**Estimated Time:** 30 minutes

#### 5.1 Update Documentation
- [ ] **Document fixes applied**
  - Update component documentation
  - Add performance notes
  - Document best practices

#### 5.2 Clean Up Temporary Code
- [ ] **Remove debug code**
  - Clean up console.log statements
  - Remove temporary fallbacks
  - Clean up test files

## 🚨 Risk Mitigation

### Backup Strategy
- [ ] **Create branch before changes**
  - `git checkout -b fix-hashtag-store-infinite-loop`
  - Commit current working state
  - Tag as `hashtag-store-backup`

### Rollback Plan
- [ ] **If fixes cause new issues**
  - Revert to backup branch
  - Investigate specific failure points
  - Apply incremental fixes

### Testing Strategy
- [ ] **Incremental testing**
  - Test each fix individually
  - Use feature flags for gradual rollout
  - Monitor production metrics

## 📊 Success Criteria

### Functional Requirements
- [ ] **Hashtag store hooks work without infinite loops**
- [ ] **HashtagInput component fully functional**
- [ ] **HashtagDisplay component shows trending hashtags**
- [ ] **Polls page loads in < 5 seconds**
- [ ] **No console errors related to infinite loops**

### Performance Requirements
- [ ] **No excessive re-renders**
- [ ] **Memory usage stable**
- [ ] **E2E tests pass consistently**

### Quality Requirements
- [ ] **Code follows React best practices**
- [ ] **Proper error handling**
- [ ] **TypeScript errors resolved**

## 🔧 Implementation Notes

### Key Files to Modify
1. `web/lib/stores/hashtagStore.ts` - Main store implementation
2. `web/app/(app)/polls/page.tsx` - Restore disabled functionality
3. `web/features/hashtags/components/` - Component integration

### Testing Files
1. `web/tests/playwright/e2e/core/system-tailored-e2e.spec.ts`
2. `web/app/test-infinite-loop/page.tsx` - Debug page
3. `web/app/test-minimal-polls/page.tsx` - Minimal test

### Monitoring
- Watch browser console for infinite loop errors
- Monitor E2E test performance
- Check React DevTools for render cycles

## 📅 Timeline

- **Phase 1-2:** Day 1 (Diagnosis + Fix)
- **Phase 3-4:** Day 2 (Restore + Test)
- **Phase 5:** Day 3 (Documentation)

**Total Estimated Time:** 6-8 hours over 2-3 days

---

**Next Action:** Start with Phase 1.1 - Analyze hashtag store implementation to identify the root cause of infinite loops.

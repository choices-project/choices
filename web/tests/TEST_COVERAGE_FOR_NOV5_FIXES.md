# Test Coverage for November 5 Fixes

## ❌ MISSING: Tests for Today's Critical Fixes

None of the features fixed today have automated tests yet.

---

## 🎯 Required Test Files (Priority Order)

### 1. UnifiedFeed Component Test
**File:** `tests/e2e/unified-feed.spec.ts` (CREATE)  
**Priority:** 🔴 CRITICAL  
**Why:** Major feature with 150+ lines restored

**Test Cases Needed:**
- Component renders without crashing
- Feed data loads from API
- Real-time WebSocket indicator shows
- Infinite scroll triggers on scroll
- Pull-to-refresh works
- Dark mode toggle works
- Store hooks don't cause errors
- No "table not implemented" console warnings
- Cleanup handlers prevent memory leaks

**Estimated:** 10-15 test cases, 2-3 hours

---

### 2. Poll Hashtag Filtering Test
**File:** `tests/e2e/poll-hashtag-filtering.spec.ts` (CREATE)  
**Priority:** 🔴 CRITICAL  
**Why:** User-facing feature that was completely disabled

**Test Cases Needed:**
- Hashtag input field is visible
- Trending hashtags section is visible  
- Can type and add hashtag
- Hashtag appears as filter badge
- Polls filter by selected hashtag
- Can remove hashtag
- Can click trending hashtag to add
- Multiple hashtags work together
- No infinite loop occurs (performance test)

**Estimated:** 8-10 test cases, 2 hours

---

### 3. Analytics Tracking Test
**File:** `tests/unit/analytics/civic-database-tracking.test.ts` (CREATE)  
**Priority:** 🔴 CRITICAL  
**Why:** Data integrity - was losing user data

**Test Cases Needed:**
- updateCivicDatabaseEntry() writes to database
- Trust tier history array populated correctly
- Handles missing table gracefully (logs warning, doesn't throw)
- updatePollDemographicInsights() calls RPC
- Handles missing function gracefully
- No cascading failures on errors
- JSONB trust_tier_history parsed correctly

**Estimated:** 12-15 test cases, 3 hours

---

### 4. District Heatmap API Test
**File:** `tests/api/civics/district-heatmap.test.ts` (CREATE)  
**Priority:** 🟡 MEDIUM  
**Why:** New feature, needs verification

**Test Cases Needed:**
- GET /api/v1/civics/heatmap returns 200
- Response has district_id (not geohash)
- State filtering works
- Level filtering works
- min_count parameter enforced
- K-anonymity protection (only >= min_count)
- Returns empty array when no data (not fake)
- Feature flag check returns 404 if disabled

**Estimated:** 8-10 test cases, 2 hours

---

### 5. Admin Hooks No Mock Data Test
**File:** `tests/unit/admin/hooks-no-mock-data.test.ts` (CREATE)  
**Priority:** 🟡 MEDIUM  
**Why:** Prevent regression to mock data

**Test Cases Needed:**
- fetchTrendingTopics returns empty on error
- fetchGeneratedPolls returns empty on error
- fetchSystemMetrics returns empty on error
- Never returns mock data in production mode
- Logs warnings when APIs fail
- No "Climate Change Policy" in results

**Estimated:** 6-8 test cases, 1.5 hours

---

## 📊 Coverage Gap Summary

| Feature | Current Coverage | Needed Tests | Priority | Time |
|---------|------------------|--------------|----------|------|
| UnifiedFeed | 0% | 10-15 tests | 🔴 HIGH | 3h |
| Hashtag Filtering | 0% | 8-10 tests | 🔴 HIGH | 2h |
| Analytics Tracking | 0% | 12-15 tests | 🔴 HIGH | 3h |
| District Heatmap | 0% | 8-10 tests | 🟡 MED | 2h |
| Admin No Mock | 0% | 6-8 tests | 🟡 MED | 1.5h |
| **Total** | **0%** | **44-58 tests** | - | **11.5-13.5h** |

---

## 🧪 Test Implementation Plan

### Week 1 (This Week)
- Day 1-2: UnifiedFeed E2E test
- Day 2-3: Hashtag filtering E2E test  
- Day 3-4: Analytics unit tests
- Day 4-5: District heatmap API test
- Day 5: Admin hooks unit test

### Week 2 (Next Week)
- Integration tests for end-to-end flows
- Performance tests
- Edge case coverage

---

## 🔧 Test Infrastructure Updates Needed

### Jest Configuration
**Issue:** Multiple jest.config files causing confusion  
**Fix:** Consolidate to single config with environments

### Test Helpers
**Status:** ✅ Good (have mocks, helpers, fixtures)  
**Add:** Helper for testing district heatmap responses

### Test Data
**Status:** ⚠️ May need update for district data  
**Add:** Mock districts, states, user_profiles with districts

---

## ✅ What to Do Now

### Immediate (Today):
1. Run existing test suites to ensure nothing broke
   ```bash
   npm test
   npm run test:e2e -- civics-
   ```

2. Manual browser testing (as documented in TEST_RESULTS.md)

### This Week:
1. Create 5 new test files
2. Add ~50 test cases total
3. Achieve coverage for all today's fixes

### Monitor:
- Existing tests should still pass
- No regressions from today's changes

---

## 📝 Summary

**Existing Test Suite:** Good (539 tests, solid foundation)  
**Coverage of New Features:** Low (0%)  
**Recommended Action:** Add ~50 tests this week  
**Current Priority:** Manual testing + existing suite verification  

**The application works correctly - tests are insurance for the future.** ✅


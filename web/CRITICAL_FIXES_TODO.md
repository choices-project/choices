# Critical Fixes - Action Items
**Created:** November 5, 2025  
**Status:** 🔴 IN PROGRESS  
**Deadline:** Complete CRITICAL items by Nov 12, 2025

---

## 🔴 CRITICAL - Must Fix Immediately

### [ ] 1. Re-enable Analytics Tracking
**File:** `/web/features/analytics/lib/analytics-service.ts` (Lines 195-290)  
**Impact:** DATA LOSS - User engagement metrics not being tracked  
**Estimated Time:** 4-6 hours

**Subtasks:**
- [ ] Create database migration for `civic_database_entries` table
- [ ] Implement `update_poll_demographic_insights` RPC function
- [ ] Uncomment lines 201-206 (poll demographic insights)
- [ ] Uncomment lines 248-288 (civic database entry updates)
- [ ] Test with real data
- [ ] Verify trust tier tracking works
- [ ] Add error handling for missing data

**Migration Script Needed:**
```sql
-- Create civic_database_entries table
CREATE TABLE civic_database_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stable_user_id UUID NOT NULL,
  user_hash TEXT NOT NULL,
  total_polls_participated INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  average_engagement_score NUMERIC(5,2) DEFAULT 0,
  current_trust_tier TEXT,
  trust_tier_history JSONB DEFAULT '[]',
  trust_tier_upgrade_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RPC function
CREATE OR REPLACE FUNCTION update_poll_demographic_insights(p_poll_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Implementation needed
  RAISE NOTICE 'Updating demographic insights for poll: %', p_poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### [ ] 2. Fix Polls Hashtag Filtering (Infinite Loop)
**File:** `/web/app/(app)/polls/page.tsx` (Lines 206, 290)  
**Impact:** Major feature broken, users cannot filter by hashtags  
**Estimated Time:** 2-3 hours

**Subtasks:**
- [ ] Identify infinite loop root cause in useEffect
- [ ] Refactor state management to prevent loop
- [ ] Re-enable hashtag input (line 206)
- [ ] Re-enable trending hashtags display (line 290)
- [ ] Add useCallback/useMemo as needed
- [ ] Test thoroughly with React DevTools
- [ ] Verify no performance issues

**Likely Fix:**
```typescript
// Change from:
useEffect(() => {
  getTrendingHashtags(); // Causes infinite loop
}, [getTrendingHashtags]);

// To:
const getTrendingHashtagsStable = useCallback(() => {
  // implementation
}, []); // Empty deps or stable deps only

useEffect(() => {
  getTrendingHashtagsStable();
}, [getTrendingHashtagsStable]);
```

---

### [ ] 3. Fix or Remove Disabled APIs
**Files:** 4 disabled API endpoints  
**Impact:** Features appear to exist but are non-functional  
**Estimated Time:** 3-4 hours

**Option A: Implement**
- [ ] `/web/app/api/district/route.ts` - Implement district lookup
- [ ] Install missing monitoring dependencies
- [ ] Implement chaos testing endpoints
- [ ] Test all endpoints

**Option B: Remove** (Recommended if not needed soon)
- [ ] Remove `/web/app/api/district/route.ts`
- [ ] Remove chaos testing endpoints
- [ ] Remove monitoring red-dashboard endpoint
- [ ] Remove SLO monitoring endpoint
- [ ] Update any frontend code calling these
- [ ] Remove from documentation

---

### [ ] 4. Fix Feed Personalization
**File:** `/web/features/feeds/index.ts`  
**Impact:** Feed recommendations not working  
**Estimated Time:** 3-5 hours

**Subtasks:**
- [ ] Fix hydration issue in `InterestBasedPollFeed`
- [ ] Re-enable `InterestBasedPollFeed` export (line 64)
- [ ] Create `useFeed` hook (line 59)
- [ ] Create `useHashtags` hook (line 60)
- [ ] Create `useFeedPersonalization` hook (line 61)
- [ ] Test for hydration errors
- [ ] Verify SSR compatibility
- [ ] Update components using these hooks

---

### [ ] 5. Stop Using Mock Data in Production
**File:** `/web/lib/admin/hooks.ts`  
**Impact:** Admin dashboard may show fake data to users  
**Estimated Time:** 4-6 hours

**Subtasks:**
- [ ] Implement real-time news service OR
- [ ] Remove all references to real-time news OR
- [ ] Add clear UI indicator "Using Mock Data"
- [ ] Verify `mockActivityFeed` not shown to users
- [ ] Verify `mockTrendingTopics` not shown to users
- [ ] Verify `mockGeneratedPolls` not shown to users
- [ ] Add feature flag check before using mocks
- [ ] Log warning when mocks are used

---

## 🟡 HIGH PRIORITY - Complete Within 2 Weeks

### [ ] 6. Implement WebAuthn Graceful Degradation
**Files:** 3 WebAuthn API routes  
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Check feature flag state
- [ ] If disabled, redirect to password auth
- [ ] Return 302 redirect instead of 403 error
- [ ] Update client to handle redirect
- [ ] Add UI message "Biometric auth unavailable"
- [ ] Test complete flow

---

### [ ] 7. PWA Service Worker Unregistration
**File:** `/web/features/pwa/index.ts`  
**Estimated Time:** 2-3 hours

**Subtasks:**
- [ ] Implement `unregisterServiceWorker` function
- [ ] Add cleanup for caches
- [ ] Add cleanup for IndexedDB
- [ ] Test uninstall flow
- [ ] Verify clean state after unregister

---

### [ ] 8. Remove Archived Code
**Location:** `/web/_archived/`  
**Estimated Time:** 30 minutes

**Subtasks:**
- [ ] Verify all archived code is in git history
- [ ] Delete `/web/_archived/2025-11-05-typescript-cleanup/`
- [ ] Delete `/web/_archived/2025-11-pwa-old-hook-system/`
- [ ] Update any remaining references
- [ ] Commit with message "Remove archived code (in git history)"

---

### [ ] 9. Convert TODOs to GitHub Issues
**Count:** 48 TODOs across 30 files  
**Estimated Time:** 2-3 hours

**Subtasks:**
- [ ] Extract all TODOs with context
- [ ] Create GitHub issues for each
- [ ] Add appropriate labels
- [ ] Link to code locations
- [ ] Assign priority
- [ ] Remove TODO comments, link to issues instead

**Template:**
```typescript
// TODO: Add caching
// Replace with:
// See GitHub Issue #XXX for caching implementation
```

---

### [ ] 10. Clean Up Large Commented Code Blocks
**Estimated Time:** 1-2 hours

**Files to Review:**
- [ ] `/web/features/analytics/lib/analytics-service.ts` - Either re-enable or delete
- [ ] `/web/features/feeds/index.ts` - Either re-enable or delete
- [ ] `/web/app/(app)/polls/page.tsx` - Already tracked above

**Rule:** Delete any commented block > 10 lines if:
- Not being worked on actively
- Older than 1 month
- Already in git history

---

## 🟢 MEDIUM PRIORITY - Complete Within 1 Month

### [ ] 11. Migrate to UnifiedFeed
**Files:** Components still using deprecated feeds  
**Estimated Time:** 8-10 hours

**Subtasks:**
- [ ] Find all uses of `SocialFeed`
- [ ] Find all uses of `EnhancedSocialFeed`
- [ ] Find all uses of `FeedHashtagIntegration`
- [ ] Migrate each to `UnifiedFeed`
- [ ] Test each migration
- [ ] Delete deprecated components
- [ ] Update exports in `/web/features/feeds/index.ts`

---

### [ ] 12. Review and Fix ESLint Disables
**Count:** 48 instances across 21 files  
**Estimated Time:** 4-6 hours

**Subtasks:**
- [ ] Create list of all eslint-disable comments
- [ ] For each, determine if still needed
- [ ] Fix underlying issue if possible
- [ ] Document why disable is needed if kept
- [ ] Remove unnecessary disables

---

### [ ] 13. Add Feature Flag UI Indicators
**Estimated Time:** 3-4 hours

**Subtasks:**
- [ ] Create `FeatureFlagIndicator` component
- [ ] Add indicator to disabled features
- [ ] Show "Coming Soon" or "Unavailable"
- [ ] Link to status page or roadmap
- [ ] Test in all themes/modes

---

### [ ] 14. Database Migration Audit
**Estimated Time:** 4-6 hours

**Subtasks:**
- [ ] List all referenced tables
- [ ] List all referenced RPC functions
- [ ] Verify each exists in database
- [ ] Create migrations for missing items
- [ ] Document expected schema
- [ ] Add schema validation tests

---

### [ ] 15. Monitoring and Alerting
**Estimated Time:** 4-6 hours

**Subtasks:**
- [ ] Add monitoring for disabled features
- [ ] Alert when mock data is used in prod
- [ ] Alert on analytics tracking failures
- [ ] Add health checks for critical paths
- [ ] Set up error tracking for TODO items
- [ ] Create runbook for common issues

---

## 📊 PROGRESS TRACKING

### Overall Progress
- **Critical Issues:** 0/5 complete (0%)
- **High Priority:** 0/10 complete (0%)
- **Medium Priority:** 0/5 complete (0%)

### By Category
- **Data Integrity:** 0/3 complete (Analytics, DB migrations, Mock data)
- **User-Facing Features:** 0/4 complete (Polls hashtags, Feed personalization, WebAuthn, PWA)
- **Code Quality:** 0/5 complete (Commented code, TODOs, ESLint, Deprecated, Archived)
- **Infrastructure:** 0/3 complete (APIs, Monitoring, Feature flags)

---

## 🎯 MILESTONES

### Week 1 (Nov 5-12) - CRITICAL FIXES
- [ ] All CRITICAL items complete
- [ ] No data loss
- [ ] All user-facing features working

### Week 2 (Nov 12-19) - HIGH PRIORITY
- [ ] HIGH priority items complete
- [ ] All code cleanup done
- [ ] Technical debt reduced

### Month 1 (By Dec 5) - MEDIUM PRIORITY
- [ ] All MEDIUM priority items complete
- [ ] Migration to UnifiedFeed complete
- [ ] Full monitoring in place

---

## 📝 NOTES FOR DEVELOPERS

### Before Starting Any Fix
1. Create a feature branch
2. Add tests first (TDD)
3. Make changes
4. Run full test suite
5. Check for new lint errors
6. Update this checklist
7. Create PR with before/after

### Testing Checklist
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] No new TypeScript errors
- [ ] No new ESLint errors
- [ ] No console errors in browser
- [ ] Tested on mobile
- [ ] Tested offline (PWA)

### Commit Message Format
```
type(scope): description

- Detail 1
- Detail 2

Fixes #issue_number
Resolves CRITICAL_FIXES_TODO item #N
```

---

## 🚨 BLOCKERS

Document any blockers here:

1. **Database Access:** Need production DB access for migration testing
2. **Feature Flag Access:** Need admin access to toggle flags
3. **Analytics Access:** Need access to verify data flow
4. **Monitoring Access:** Need access to Sentry/monitoring platform

---

**Last Updated:** November 5, 2025  
**Updated By:** AI Assistant  
**Next Review:** November 12, 2025


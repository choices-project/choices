# Post-Migration Code Updates

**Date**: November 3, 2025  
**Purpose**: Update code to use new schema after migration is applied  
**Prerequisite**: Migration `20251103_schema_additions.sql` must be applied first

---

## 🎯 Overview

After schema migration is applied, we need to:
1. Regenerate TypeScript types from Supabase
2. Revert Phase 1 workarounds to use proper schema
3. Update imports and queries
4. Verify error reduction

---

## 📋 STEP-BY-STEP UPDATES

### Step 1: Regenerate TypeScript Types (CRITICAL)

```bash
cd /Users/alaughingkitsune/src/Choices/web

# Generate new types from Supabase
npx supabase gen types typescript \
  --project-id <your-project-id> \
  > utils/supabase/database.types.ts

# Or if using connection string:
npx supabase gen types typescript \
  --db-url "postgresql://..." \
  > utils/supabase/database.types.ts
```

**Why**: New tables/columns won't be in TypeScript until regenerated

---

### Step 2: Update Analytics Service (Priority 1)

**File**: `lib/types/analytics.ts`

**Change 1: recordPollAnalytics (lines 133-161)**
```typescript
// CURRENT (Phase 1 workaround):
const { error: insertError } = await supabase
  .from('analytics_events')
  .insert({
    event_type: 'poll_participation',
    user_id: userId,
    event_data: {
      poll_id: pollId,
      trust_tier: trustTierScore.trust_tier,
      // ... all fields in JSONB
    }
  })

// AFTER MIGRATION (use proper table):
const { error: insertError } = await supabase
  .from('poll_participation_analytics')
  .insert({
    user_id: userId,
    poll_id: pollId,
    trust_tier: trustTierScore.trust_tier,
    trust_score: trustTierScore.score,
    age_group: demographicData?.age_group,
    geographic_region: demographicData?.geographic_region,
    education_level: demographicData?.education_level,
    income_bracket: demographicData?.income_bracket,
    political_affiliation: demographicData?.political_affiliation,
    voting_history_count: trustTierScore.factors.voting_history_count,
    biometric_verified: trustTierScore.factors.biometric_verified,
    phone_verified: trustTierScore.factors.phone_verified,
    identity_verified: trustTierScore.factors.identity_verified,
    verification_methods: verificationMethods,
    data_quality_score: trustTierScore.score,
    confidence_level: trustTierScore.score
  })
```

**Change 2: Query poll analytics**
```typescript
// Add function to query poll analytics:
async getPollParticipationAnalytics(pollId: string): Promise<PollDemographicInsights> {
  const supabase = await getSupabaseServerClient()
  
  const { data: analytics, error } = await supabase
    .from('poll_participation_analytics')
    .select('*')
    .eq('poll_id', pollId)
  
  if (error) throw error
  
  // Aggregate by trust tier, region, etc.
  return {
    trustTierBreakdown: aggregateByTrustTier(analytics),
    regionalBreakdown: aggregateByRegion(analytics),
    demographicInsights: aggregateDemographics(analytics)
  }
}
```

---

### Step 3: Update Voting Action (Priority 2)

**File**: `shared/actions/vote.ts`

**Change: Use direct column instead of JSONB (lines 61-63)**
```typescript
// CURRENT (Phase 1 workaround):
const pollSettings = poll.poll_settings as { allow_multiple_votes?: boolean } | null
if (!pollSettings?.allow_multiple_votes) {
  // Check for duplicate votes
}

// AFTER MIGRATION (use dedicated column):
if (!poll.allow_multiple_votes) {
  // Check for duplicate votes
}
```

**Benefit**: Cleaner code, direct column access, better type safety

---

### Step 4: Update Civic Actions (Priority 3)

**File**: `lib/utils/sophisticated-civic-engagement.ts`

**Change: Revert to use category column (line 421-423)**
```typescript
// CURRENT (Phase 1 workaround):
if (category) {
  query = query.eq('action_type', category);  // Using wrong column
}

// AFTER MIGRATION (use proper column):
if (category) {
  query = query.eq('category', category);  // Correct column
}
```

**Also update**: Line 220 - Add category back to object creation
```typescript
const civicAction: SophisticatedCivicAction = {
  // ... other fields
  action_type: actionData.actionType,
  category: actionData.category,  // ← Add this back
  // ... rest of fields
}
```

---

### Step 5: Update Performance Monitoring (Priority 4)

**Files to Update**:
1. `lib/database/performance-monitor.ts`
2. `shared/core/performance/lib/performance-monitor.ts`
3. `shared/core/performance/lib/performance-monitor-simple.ts`

**Changes Needed**: None! These files will work once tables exist.

**Just verify**:
- Imports are correct
- Table names match migration
- RPC function names match migration

---

## 🧪 TESTING PLAN

### Test 1: Poll Participation Analytics
```typescript
// Create test poll
// Vote on poll as test user
// Query poll_participation_analytics table
// Verify record was created with all fields

const { data } = await supabase
  .from('poll_participation_analytics')
  .select('*')
  .eq('poll_id', testPollId);

// Should have: trust_tier, age_group, verification_methods, etc.
```

### Test 2: Allow Multiple Votes
```typescript
// Create poll with allow_multiple_votes = true
// Vote as same user twice
// Should allow second vote

// Create poll with allow_multiple_votes = false
// Vote as same user twice
// Should reject second vote
```

### Test 3: Civic Actions Category
```typescript
// Create civic action with category = 'healthcare'
// Query civic_actions WHERE category = 'healthcare'
// Should return the created action

const { data } = await supabase
  .from('civic_actions')
  .select('*')
  .eq('category', 'healthcare');
```

### Test 4: Performance Monitoring
```typescript
// Track a query
const logId = await supabase.rpc('analyze_query_performance', {
  p_query_hash: 'hash123',
  p_query_signature: 'SELECT * FROM polls',
  p_query_type: 'SELECT',
  p_execution_time_ms: 250
});

// Should return UUID
// Check query_performance_log table has record
```

---

## 📊 EXPECTED ERROR REDUCTION

### Before Migration
- Total Errors: 416
- Schema-related: ~174

### After Migration + Code Updates
- Total Errors: ~242 (-174)
- Remaining: exactOptionalPropertyTypes, misc TypeScript strict

### Breakdown
- Poll analytics: -30 errors
- Civic actions category: -8 errors  
- Performance monitoring: -86 errors (dead code becomes working code)
- Polls allow_multiple_votes: -5 errors
- Type safety improvements: -45 errors

---

## ✅ VERIFICATION CHECKLIST

After migration and code updates:
- [ ] TypeScript types regenerated
- [ ] All 4 code files updated
- [ ] Poll creation works with new column
- [ ] Poll voting respects allow_multiple_votes
- [ ] Civic actions can be filtered by category
- [ ] Poll participation analytics records created
- [ ] Performance metrics can be logged
- [ ] Error count reduced to ~242
- [ ] No new errors introduced
- [ ] All tests pass

---

## 🚨 CRITICAL NOTES

1. **Regenerate Types FIRST** - Code won't compile without updated types
2. **Test in Development** - Apply migration to dev DB first
3. **Backup Production** - Before applying to production
4. **Monitor Performance** - Performance tables have high write volume
5. **Schedule Cleanup** - Set up daily cleanup job for performance data

---

## 📞 SUPPORT

If issues occur:
1. Check verification queries in migration file
2. Review Supabase logs for errors
3. Run rollback script if needed
4. Regenerate types again if schema mismatch

---

_Ready for migration application_


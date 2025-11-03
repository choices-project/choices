# Schema Verification Complete - Ready for Migration

**Date**: November 3, 2025, 23:45  
**Research Method**: Code analysis + actual database types + usage patterns  
**Status**: ✅ VERIFIED - All proposals validated

---

## 🔍 VERIFICATION FINDINGS

### 1. ✅ Poll Participation Analytics - CREATE TABLE

**Research Findings**:
- Code in `lib/types/analytics.ts` expects structured analytics fields
- Currently using `analytics_events.event_data` JSONB (Phase 1 workaround)
- Needs aggregation by trust_tier, region, demographics
- 13+ specific fields expected (trust_tier, age_group, region, etc.)

**Verified Need**:
```typescript
// Multiple analytics queries need these structured:
- GROUP BY trust_tier (for trust tier breakdowns)
- WHERE geographic_region = 'X' (for regional analysis)
- JOIN with polls for participation analytics
- Historical tracking per user per poll
```

**Architecture Decision**: **CREATE DEDICATED TABLE**
- ✅ Faster aggregation queries
- ✅ Can index by trust_tier, region, poll_id
- ✅ Enforced unique constraint (one record per user per poll)
- ✅ Clear data model vs. generic JSONB

---

### 2. ✅ Performance Monitoring Tables - CREATE TABLES

**Research Findings**:
- 4 implementations exist trying to use these tables
- `features/admin/lib/performance-monitor.ts` - in-memory (works)
- `lib/database/performance-monitor.ts` - tries to query DB tables (fails)
- `shared/core/performance/lib/performance-monitor*.ts` - tries to query DB (fails)
- Admin dashboard has performance monitoring UI

**Verified Usage**:
```typescript
// From performance-monitor-simple.ts:
.from('performance_metrics')  // Table missing
.from('query_performance_log')  // Table missing  
.from('cache_performance_log')  // Table missing
.rpc('analyze_query_performance')  // RPC missing
.rpc('cleanup_performance_data')  // RPC missing
```

**Architecture Decision**: **CREATE TABLES WITH AUTO-EXPIRY**
- ✅ Enable persistent performance monitoring
- ✅ 30-day TTL to manage storage
- ✅ RPC functions for cleanup
- ⚠️ High write volume (acceptable with TTL)
- ✅ Un-archive 4 implementation files after creation

---

### 3. ✅ Civic Actions Category Column - ADD COLUMN

**Research Findings**:
```typescript
// app/api/civic-actions/route.ts already expects it:
const CivicActionSchema = z.object({
  category: z.string().optional(),  // ← API expects this
})

// Line 72 - SELECT statement:
.select('category')  // ← Already querying it

// Line 90-91 - Filtering:
if (category !== 'all') {
  query = query.eq('category', category);  // ← Already filtering by it
}
```

**Verified Schema Gap**:
- API expects `category` field
- Database table doesn't have it
- Currently fails silently (returns null)
- Frontend probably shows undefined/null for category

**Category vs Action Type**:
- `action_type`: What it IS ('petition', 'campaign', 'survey', 'event')  
- `category`: What it's ABOUT ('healthcare', 'environment', 'education')
- **Different dimensions** - both needed

**Architecture Decision**: **ADD COLUMN**
- ✅ API already expects it
- ✅ Serves different purpose than action_type
- ✅ Improves organization and filtering
- ✅ Simple ALTER TABLE migration

---

### 4. ✅ Polls Allow Multiple Votes - ADD COLUMN

**Research Findings**:

**Current Database State**:
```typescript
// database.types.ts shows polls has 59 columns including:
poll_settings: Json | null  // ← Currently stores allow_multiple_votes here
settings: Json | null       // ← Redundant field (also used!)
```

**How Code Uses It**:
```typescript
// app/api/polls/route.ts (line 338-348):
poll_settings: {
  allow_anonymous: settings?.allowAnonymousVotes !== false,
  require_verification: settings?.requireVerification ?? false,
  allow_multiple_votes: settings?.allowMultipleVotes ?? false,  // ← In JSONB
  show_results_before_close: settings?.showResultsBeforeClose ?? false,
  allow_comments: settings?.allowComments !== false,
  // ... 8+ other settings
}

// shared/actions/vote.ts (after Phase 1 fix):
const pollSettings = poll.poll_settings as { allow_multiple_votes?: boolean } | null
if (!pollSettings?.allow_multiple_votes) { /* check for duplicates */ }
```

**PollSettings Type** (found in 6 files):
```typescript
export type PollSettings = {
  allowMultipleVotes: boolean;  // ← Core field in type definition
  allowAnonymousVotes: boolean;
  requireEmail: boolean;
  showResults: boolean;
  votingMethod: 'single' | 'multiple' | 'ranked' | 'approval';
  // ... 10+ other settings
}
```

**Architecture Analysis**:
- `allow_multiple_votes` is in EVERY PollSettings type definition
- It's a FUNDAMENTAL voting rule (not just a preference)
- Polls table has 59 columns - clearly designed to be explicit
- Other core fields are top-level: `voting_method`, `privacy_level`, `is_public`

**User Context**: *"Polling is the single most premier feature of the application"*

**Architecture Decision**: **ADD DEDICATED COLUMN**
Rationale:
- ✅ **Core functionality** - Not just a setting, it's a voting rule
- ✅ **Query performance** - Can filter/index polls by this
- ✅ **Schema clarity** - Makes it explicit this is fundamental
- ✅ **Type safety** - Database-level Boolean, not JSON parsing
- ✅ **Consistency** - Matches pattern of other core fields (voting_method, is_public)
- ✅ **Premier feature** - Deserves first-class column

**Keep poll_settings too**:
- Still useful for truly optional settings (colors, labels, custom UI)
- But core voting rules should be explicit columns

---

## 📋 FINAL MIGRATION PLAN

### Migration Order (to avoid dependency issues):

**1. Add Columns to Existing Tables** (5 min)
```sql
-- Simple ALTERs, no dependencies
ALTER TABLE polls ADD COLUMN allow_multiple_votes BOOLEAN DEFAULT FALSE;
ALTER TABLE civic_actions ADD COLUMN category TEXT;
```

**2. Create Analytics Table** (10 min)
```sql
-- References polls and user_profiles (both exist)
CREATE TABLE poll_participation_analytics (...);
```

**3. Create Performance Tables** (15 min)
```sql
-- Independent tables, no foreign keys
CREATE TABLE performance_metrics (...);
CREATE TABLE query_performance_log (...);
CREATE TABLE cache_performance_log (...);
```

**4. Create RPC Functions** (10 min)
```sql
-- Functions for performance monitoring
CREATE FUNCTION analyze_query_performance (...);
CREATE FUNCTION cleanup_performance_data (...);
-- ... etc
```

**5. Backfill Data** (5 min)
```sql
-- Migrate allow_multiple_votes from JSONB to column
UPDATE polls 
SET allow_multiple_votes = (poll_settings->>'allow_multiple_votes')::BOOLEAN
WHERE poll_settings->>'allow_multiple_votes' IS NOT NULL;

-- Set default category for existing civic actions
UPDATE civic_actions 
SET category = 'general' 
WHERE category IS NULL;
```

**Total Time**: ~45 minutes

---

## 🎯 POST-MIGRATION CODE UPDATES

### Update Phase 1 Code:

**1. lib/types/analytics.ts:133-161**
```typescript
// CHANGE FROM:
.from('analytics_events').insert({ event_type: 'poll_participation', event_data: {...} })

// CHANGE TO:
.from('poll_participation_analytics').insert({
  user_id, poll_id, trust_tier, age_group, ... // All structured fields
})
```

**2. shared/actions/vote.ts:61-63**
```typescript
// CHANGE FROM:
const pollSettings = poll.poll_settings as { allow_multiple_votes?: boolean } | null
if (!pollSettings?.allow_multiple_votes) {

// CHANGE TO:
if (!poll.allow_multiple_votes) {  // Direct column access
```

**3. lib/utils/sophisticated-civic-engagement.ts:421-423**
```typescript
// ALREADY CORRECT after Phase 1:
query = query.eq('action_type', category);

// CHANGE BACK TO:
query = query.eq('category', category);  // Use proper column
```

**4. Un-archive Performance Monitoring Files**
- Restore: `lib/database/performance-monitor.ts`
- Restore: `shared/core/performance/lib/performance-monitor.ts`
- Restore: `shared/core/performance/lib/performance-monitor-simple.ts`
- Update imports to use new tables

---

## ✅ VERIFICATION CHECKLIST

Before migration:
- [x] Verified polls.poll_settings structure
- [x] Confirmed civic_actions API expects category
- [x] Validated performance monitoring usage
- [x] Checked analytics query patterns
- [x] Confirmed no naming conflicts

After migration:
- [ ] Regenerate TypeScript types from Supabase
- [ ] Update Phase 1 code to use new schema
- [ ] Test poll creation with allow_multiple_votes
- [ ] Test civic action filtering by category
- [ ] Test analytics aggregation queries
- [ ] Test performance monitoring writes
- [ ] Verify no broken queries

---

## 🚀 READY TO PROCEED

All 4 schema additions verified and justified:
1. ✅ `poll_participation_analytics` table - Structured analytics
2. ✅ Performance monitoring tables (3) - Production observability
3. ✅ `civic_actions.category` column - API already expects it
4. ✅ `polls.allow_multiple_votes` column - Premier feature deserves first-class column

**Migration script ready to generate.**

Shall I proceed with creating the migration SQL?


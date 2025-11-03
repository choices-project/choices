# Database Schema Design Proposal - Informed Decisions

**Date**: November 3, 2025, 23:30  
**Purpose**: Propose proper schema additions based on comprehensive audit  
**Philosophy**: Create tables intentionally when they improve architecture, not spuriously

---

## 🎯 Core Question

**Phase 1 worked around missing schema. Should we instead ADD proper schema?**

For each "missing" piece, let's evaluate:
1. **Is it architecturally sound?**
2. **Does it improve data integrity?**
3. **Does it enable better features?**
4. **Is there a better alternative?**

---

## 📊 PROPOSAL 1: Poll Participation Analytics Table

### Current State
- Using `analytics_events` with JSONB for poll participation
- `trust_tier_analytics` exists but only tracks tier changes (6 columns)
- Code expects dedicated poll analytics with structured fields

### Proposal: Create `poll_participation_analytics` Table

**Rationale**:
✅ **Structured data** - Better than JSONB for known fields  
✅ **Query performance** - Can index specific columns  
✅ **Type safety** - Enforced at database level  
✅ **Clear purpose** - Separate from generic analytics_events  
✅ **Historical tracking** - Captures participation over time  

**Schema**:
```sql
CREATE TABLE poll_participation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  
  -- Trust & Verification
  trust_tier INTEGER NOT NULL,
  trust_score NUMERIC,
  biometric_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  verification_methods TEXT[] DEFAULT '{}',
  
  -- Demographics (bucketed for privacy)
  age_group TEXT,
  geographic_region TEXT,
  education_level TEXT,
  income_bracket TEXT,
  political_affiliation TEXT,
  
  -- Engagement Metrics
  voting_history_count INTEGER DEFAULT 0,
  data_quality_score NUMERIC,
  confidence_level NUMERIC,
  
  -- Timestamps
  participated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_poll_participation UNIQUE(user_id, poll_id),
  CONSTRAINT valid_trust_tier CHECK (trust_tier BETWEEN 0 AND 3)
);

-- Indexes for common queries
CREATE INDEX idx_poll_participation_user ON poll_participation_analytics(user_id);
CREATE INDEX idx_poll_participation_poll ON poll_participation_analytics(poll_id);
CREATE INDEX idx_poll_participation_trust_tier ON poll_participation_analytics(trust_tier);
CREATE INDEX idx_poll_participation_region ON poll_participation_analytics(geographic_region);
CREATE INDEX idx_poll_participation_date ON poll_participation_analytics(participated_at);
```

**Benefits**:
- Fast aggregation queries (GROUP BY trust_tier, region, etc.)
- Clear data model for analytics dashboards
- Enforced referential integrity
- Indexable for performance
- Separate from audit logs (trust_tier_analytics)

**Alternative (Current)**:
- Store in `analytics_events.event_data` JSONB
- Pros: Flexible, no migration
- Cons: Slower queries, no type enforcement, harder to index

**RECOMMENDATION**: ✅ **CREATE TABLE** - Better architecture for structured analytics

---

## 📊 PROPOSAL 2: Performance Monitoring Tables

### Current State
- 4 implementations trying to use missing tables
- Using in-memory monitoring (works but no persistence)
- Admin dashboard has performance tab (partially working)

### Proposal: Create Performance Monitoring Schema

**Rationale**:
✅ **Observability** - Critical for production debugging  
✅ **Trend analysis** - Historical performance data  
✅ **Alerting** - Detect degradation early  
✅ **Optimization** - Identify slow queries  
⚠️ **Cost** - High write volume (100K+ rows/week)  

**Schema**:
```sql
-- 1. General Performance Metrics
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'query_time', 'api_response', 'cache_hit_rate', etc.
  metric_value NUMERIC NOT NULL,
  
  -- Context
  table_name TEXT,
  endpoint TEXT,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Metadata
  tags JSONB DEFAULT '{}',
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Retention: Auto-delete after 30 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_perf_metrics_name ON performance_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_perf_metrics_expires ON performance_metrics(expires_at);

-- 2. Query Performance Log (detailed)
CREATE TABLE query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL,
  query_signature TEXT NOT NULL,
  
  -- Performance
  execution_time_ms NUMERIC NOT NULL,
  planning_time_ms NUMERIC,
  rows_affected INTEGER,
  rows_scanned INTEGER,
  
  -- Query Analysis
  table_name TEXT,
  slow_query BOOLEAN GENERATED ALWAYS AS (execution_time_ms > 1000) STORED,
  
  -- Context
  user_id UUID,
  endpoint TEXT,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_query_perf_hash ON query_performance_log(query_hash);
CREATE INDEX idx_query_perf_slow ON query_performance_log(slow_query, recorded_at DESC) WHERE slow_query = TRUE;

-- 3. Cache Performance Log
CREATE TABLE cache_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'HIT', 'MISS', 'SET', 'DELETE'
  
  -- Performance
  operation_time_ms NUMERIC,
  cache_size_bytes INTEGER,
  ttl_seconds INTEGER,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_cache_perf_key ON cache_performance_log(cache_key, recorded_at DESC);
```

**RPC Functions**:
```sql
-- Cleanup expired data automatically
CREATE OR REPLACE FUNCTION cleanup_expired_performance_data()
RETURNS void AS $$
BEGIN
  DELETE FROM performance_metrics WHERE expires_at < NOW();
  DELETE FROM query_performance_log WHERE expires_at < NOW();
  DELETE FROM cache_performance_log WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron or external job
```

**Benefits**:
- Real production monitoring
- Identify performance regressions
- Query optimization opportunities
- Cache effectiveness tracking

**Costs**:
- High write volume (~50-100 inserts/second at peak)
- Storage: ~1-2GB/month with 30-day retention
- Index maintenance overhead

**Alternative**:
- Use external APM (Datadog, New Relic)
- Pros: Professional tooling, less DB load
- Cons: Cost ($$$), data export

**RECOMMENDATION**: ⚠️ **EVALUATE PRIORITY**
- If budget allows: Use external APM service
- If cost-sensitive: Create tables with aggressive TTL
- For MVP: Current in-memory monitoring is sufficient

**DECISION NEEDED**: Do we need persistent performance monitoring now or later?

---

## 📊 PROPOSAL 3: Polls - Allow Multiple Votes Column

### Current State
- Using `poll_settings` JSONB field
- Code reads: `poll.poll_settings.allow_multiple_votes`

### Proposal: Add Dedicated Column

**Option A: Keep JSONB (Current)**
```sql
-- No change needed
-- Access: poll.poll_settings->>'allow_multiple_votes'
```

**Option B: Add Column**
```sql
ALTER TABLE polls 
ADD COLUMN allow_multiple_votes BOOLEAN DEFAULT FALSE;

-- Backfill from JSONB if needed
UPDATE polls 
SET allow_multiple_votes = (poll_settings->>'allow_multiple_votes')::BOOLEAN
WHERE poll_settings->>'allow_multiple_votes' IS NOT NULL;
```

**Comparison**:

| Aspect | JSONB (Current) | Dedicated Column |
|--------|-----------------|------------------|
| Type Safety | ⚠️ Runtime only | ✅ Database enforced |
| Query Performance | ⚠️ Slower | ✅ Indexable |
| Schema Clarity | ⚠️ Hidden in JSONB | ✅ Explicit |
| Flexibility | ✅ Easy to add fields | ⚠️ Requires migration |
| Current State | ✅ Already working | ❌ Needs migration |

**RECOMMENDATION**: ⚠️ **KEEP JSONB FOR NOW**
- Already working with Phase 1 fix
- `poll_settings` is designed for configuration
- Other settings likely needed (voting_weights, time_limits, etc.)
- Migration can happen later if needed

**ALTERNATIVE**: If we add column, move ALL boolean flags out of JSONB

---

## 📊 PROPOSAL 4: Civic Actions - Category Column

### Current State
- Using `action_type` for categorization
- Code now queries: `.eq('action_type', category)`

### Proposal: Add Category Column

**Schema**:
```sql
ALTER TABLE civic_actions 
ADD COLUMN category TEXT;

CREATE INDEX idx_civic_actions_category ON civic_actions(category);

-- Backfill from action_type
UPDATE civic_actions 
SET category = action_type;
```

**Question**: What's the difference between `action_type` and `category`?

**Use Cases**:
- `action_type`: Technical type (petition, campaign, referendum, initiative)
- `category`: Topic/domain (healthcare, education, environment, justice)

**Example**:
```sql
-- Without category column:
action_type: 'petition'
(no way to filter by topic)

-- With category column:
action_type: 'petition'
category: 'healthcare'
```

**Benefits**:
✅ Filter by topic AND type  
✅ Better organization  
✅ Richer analytics  

**Costs**:
⚠️ Adds complexity  
⚠️ Needs UI for category selection  

**RECOMMENDATION**: ✅ **ADD COLUMN**
- Makes sense architecturally
- `action_type` and `category` serve different purposes
- Improves searchability
- Simple migration

**Migration**:
```sql
ALTER TABLE civic_actions ADD COLUMN category TEXT;
CREATE INDEX idx_civic_actions_category ON civic_actions(category);

-- Set default categories based on action_type (can refine later)
UPDATE civic_actions SET category = 'uncategorized' WHERE category IS NULL;
```

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1.5: Schema Additions (INFORMED DECISIONS)

**Priority 1: MUST ADD** 🟢
1. ✅ **`poll_participation_analytics` table**
   - Clear architectural benefit
   - Enables proper analytics
   - Better than JSONB approach
   - Time: 30 minutes

2. ✅ **`civic_actions.category` column**
   - Distinct from action_type
   - Improves filtering/search
   - Simple addition
   - Time: 15 minutes

**Priority 2: EVALUATE** 🟡
3. ⚠️ **Performance monitoring tables**
   - Decide: In-house vs APM service
   - If in-house: Create tables
   - If APM: Archive dead code
   - Time: 2 hours (if creating)

**Priority 3: DEFER** 🔴
4. ❌ **`polls.allow_multiple_votes` column**
   - JSONB works fine
   - No immediate benefit
   - Can migrate later if needed
   - Time: Keep current approach

---

## 📋 MIGRATION SCRIPT - Phase 1.5

```sql
-- Phase 1.5: Informed Schema Additions
-- Date: 2025-11-03
-- Purpose: Add architecturally sound tables based on comprehensive audit

BEGIN;

-- ============================================================================
-- 1. POLL PARTICIPATION ANALYTICS TABLE
-- ============================================================================

CREATE TABLE poll_participation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  
  -- Trust & Verification
  trust_tier INTEGER NOT NULL,
  trust_score NUMERIC,
  biometric_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  verification_methods TEXT[] DEFAULT '{}',
  
  -- Demographics (bucketed for privacy)
  age_group TEXT,
  geographic_region TEXT,
  education_level TEXT,
  income_bracket TEXT,
  political_affiliation TEXT,
  
  -- Engagement Metrics
  voting_history_count INTEGER DEFAULT 0,
  data_quality_score NUMERIC,
  confidence_level NUMERIC,
  
  -- Timestamps
  participated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_poll_participation UNIQUE(user_id, poll_id),
  CONSTRAINT valid_trust_tier CHECK (trust_tier BETWEEN 0 AND 3)
);

-- Indexes for query performance
CREATE INDEX idx_poll_participation_user ON poll_participation_analytics(user_id);
CREATE INDEX idx_poll_participation_poll ON poll_participation_analytics(poll_id);
CREATE INDEX idx_poll_participation_trust_tier ON poll_participation_analytics(trust_tier);
CREATE INDEX idx_poll_participation_region ON poll_participation_analytics(geographic_region);
CREATE INDEX idx_poll_participation_date ON poll_participation_analytics(participated_at);

-- ============================================================================
-- 2. CIVIC ACTIONS CATEGORY COLUMN
-- ============================================================================

ALTER TABLE civic_actions ADD COLUMN category TEXT;
CREATE INDEX idx_civic_actions_category ON civic_actions(category);

-- Set default for existing records
UPDATE civic_actions SET category = 'general' WHERE category IS NULL;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback:
-- DROP TABLE IF EXISTS poll_participation_analytics CASCADE;
-- ALTER TABLE civic_actions DROP COLUMN IF EXISTS category;

COMMIT;
```

---

## 🤔 QUESTIONS FOR USER

Before proceeding, need decisions on:

1. **Poll Participation Analytics**: 
   - ✅ Create dedicated table? (Recommended: YES)
   - ❌ Keep using analytics_events JSONB? (Current Phase 1 fix)

2. **Performance Monitoring**:
   - ⚠️ Create in-house tables now?
   - ⚠️ Use external APM service instead?
   - ⚠️ Defer until later (keep in-memory)?

3. **Civic Actions Category**:
   - ✅ Add category column? (Recommended: YES)
   - Define: How should we categorize existing actions?

4. **Polls Multiple Votes**:
   - ❌ Add dedicated column? (Recommended: NO, keep JSONB)
   - ✅ Keep current JSONB approach?

---

## 🎯 MY RECOMMENDATION

**Implement Priority 1 (Must Add)**:
1. Create `poll_participation_analytics` table
2. Add `civic_actions.category` column
3. Update Phase 1 code to use new table
4. Total time: 45 minutes

**Defer Priority 2 (Evaluate)**:
- Performance monitoring: Decide based on monitoring needs
- Can add later without impact

**Benefits**:
- ✅ Proper architectural foundation
- ✅ Better query performance
- ✅ Type safety at database level
- ✅ Clear data models
- ✅ Minimal complexity added

---

**Ready to proceed with informed schema additions?**


# Database Schema Audit - TypeScript Strict Errors Analysis

**Date**: November 3, 2025  
**Purpose**: Comprehensive audit of database schema mismatches causing TypeScript strict errors  
**Status**: 🔴 CRITICAL - 414 TypeScript errors, many due to schema gaps  
**Methodology**: Code analysis + type definition cross-reference + partially implemented feature review

---

## 📊 Executive Summary

### Current State
- **Total TypeScript Errors**: 414 (down from 517)
- **Schema-Related Errors**: ~250 (60% of total)
- **Missing Tables**: 3 (performance_metrics, query_performance_log, cache_performance_log, user_consent)
- **Missing Columns**: 15+ across multiple tables
- **Missing RPC Functions**: 5 (performance monitoring functions)
- **Partially Implemented Features**: 8 requiring schema additions

### Impact
- **HIGH**: Performance monitoring completely non-functional (missing tables + RPC functions)
- **HIGH**: Analytics features broken (missing columns in trust_tier_analytics)
- **MEDIUM**: Privacy consent system broken (missing user_consent table)
- **MEDIUM**: Poll voting broken (missing columns in polls table)
- **LOW**: Civic engagement features have stubs (waiting for backend)

---

## 🗄️ MISSING TABLES (Priority 1 - Breaking Features)

### 1. ❌ `performance_metrics` Table
**Status**: 🔴 MISSING - Referenced but doesn't exist  
**Impact**: Performance monitoring completely non-functional  
**Files Affected**:
- `shared/core/performance/lib/performance-monitor-simple.ts` (lines 103-105)
- `shared/core/performance/lib/performance-monitor.ts`
- `features/admin/lib/store.ts`

**Error Messages**:
```
Property 'performance_metrics' does not exist on type 'Tables'
No overload matches this call with relation: "performance_metrics"
```

**Code Reference**:
```typescript:103:105:shared/core/performance/lib/performance-monitor-simple.ts
const { error } = await supabaseClient
  .from('performance_metrics')
  .select('count')
```

**Required Schema**:
```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'query_time', 'cache_hit_rate', 'error_rate', etc.
  metric_value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Performance dimensions
  query_hash TEXT,
  query_signature TEXT,
  execution_time_ms NUMERIC,
  rows_affected INTEGER,
  
  -- Context
  user_id UUID REFERENCES user_profiles(id),
  session_id TEXT,
  client_ip INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
```

**Feature Implementation Status**: 60% complete
- ✅ Client-side tracking code exists
- ✅ Monitoring logic implemented
- ❌ Database table missing
- ❌ RPC functions missing
- ❌ Admin dashboard queries broken

---

### 2. ❌ `query_performance_log` Table
**Status**: 🔴 MISSING - Referenced but doesn't exist  
**Impact**: Query performance analysis completely non-functional  
**Files Affected**:
- `shared/core/performance/lib/performance-monitor-simple.ts` (line 295)

**Error Messages**:
```
Argument of type '"query_performance_log"' is not assignable to parameter
```

**Required Schema**:
```sql
CREATE TABLE query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL,
  query_signature TEXT NOT NULL,
  query_type TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  
  -- Performance metrics
  execution_time_ms NUMERIC NOT NULL,
  planning_time_ms NUMERIC,
  rows_affected INTEGER,
  rows_scanned INTEGER,
  buffer_reads INTEGER,
  buffer_hits INTEGER,
  
  -- Query details
  table_name TEXT,
  index_used TEXT[],
  slow_query BOOLEAN GENERATED ALWAYS AS (execution_time_ms > 1000) STORED,
  
  -- Context
  user_id UUID,
  session_id TEXT,
  client_ip INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0)
);

CREATE INDEX idx_query_perf_hash ON query_performance_log(query_hash);
CREATE INDEX idx_query_perf_slow ON query_performance_log(slow_query) WHERE slow_query = TRUE;
CREATE INDEX idx_query_perf_timestamp ON query_performance_log(created_at);
```

---

### 3. ❌ `cache_performance_log` Table
**Status**: 🔴 MISSING - Referenced but doesn't exist  
**Impact**: Cache performance analysis completely non-functional  
**Files Affected**:
- `shared/core/performance/lib/performance-monitor-simple.ts` (line 306)

**Required Schema**:
```sql
CREATE TABLE cache_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  cache_operation TEXT NOT NULL, -- 'HIT', 'MISS', 'SET', 'DELETE', 'INVALIDATE'
  
  -- Performance metrics
  operation_time_ms NUMERIC,
  cache_size_bytes INTEGER,
  ttl_seconds INTEGER,
  
  -- Cache statistics
  hit_rate NUMERIC,
  miss_rate NUMERIC,
  eviction_count INTEGER,
  
  -- Context
  cache_type TEXT, -- 'redis', 'memory', 'cdn'
  namespace TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_perf_key ON cache_performance_log(cache_key);
CREATE INDEX idx_cache_perf_operation ON cache_performance_log(cache_operation);
CREATE INDEX idx_cache_perf_timestamp ON cache_performance_log(created_at);
```

---

### 4. ❌ `user_consent` Table
**Status**: 🔴 MISSING - Privacy consent system broken  
**Impact**: GDPR/CCPA compliance features non-functional  
**Files Affected**:
- `utils/privacy/consent.ts` (lines 107, 129)

**Error Messages**:
```
Argument of type '{ consent_type: ConsentType; granted: boolean; ... }' is not assignable to parameter of type 'never'
```

**Required Schema**:
```sql
CREATE TABLE user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_type TEXT NOT NULL, -- 'analytics', 'marketing', 'personalization', 'data_sharing'
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  purpose TEXT NOT NULL,
  data_types TEXT[] NOT NULL,
  consent_version INTEGER NOT NULL DEFAULT 1,
  
  -- Legal tracking
  ip_address INET,
  user_agent TEXT,
  consent_method TEXT, -- 'explicit', 'implicit', 'opt_in', 'opt_out'
  
  -- Timestamps
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_consent_type UNIQUE(user_id, consent_type)
);

CREATE INDEX idx_user_consent_user ON user_consent(user_id);
CREATE INDEX idx_user_consent_type ON user_consent(consent_type);
CREATE INDEX idx_user_consent_active ON user_consent(granted, revoked_at) WHERE revoked_at IS NULL;
```

---

## 🔧 MISSING COLUMNS (Priority 2 - Feature Broken)

### 1. ❌ `trust_tier_analytics` Table - Missing Analytics Columns
**Status**: 🔴 MISSING COLUMNS - Analytics features broken  
**Current Schema**: Only has tier change tracking fields  
**Expected Schema**: Should have full analytics data

**Missing Columns**:
- `poll_id` (UUID, references polls)
- `age_group` (TEXT)
- `geographic_region` (TEXT)
- `education_level` (TEXT)
- `income_bracket` (TEXT)
- `political_affiliation` (TEXT)
- `voting_history_count` (INTEGER)
- `biometric_verified` (BOOLEAN)
- `phone_verified` (BOOLEAN)
- `identity_verified` (BOOLEAN)
- `verification_methods` (TEXT[])
- `data_quality_score` (NUMERIC)
- `confidence_level` (NUMERIC)
- `last_activity` (TIMESTAMPTZ)

**Files Affected**:
- `lib/types/analytics.ts` (lines 136-152, 475-479)
- `features/analytics/lib/analytics-service.ts`

**Error Messages**:
```
Property 'poll_id' does not exist on type 'trust_tier_analytics'
Property 'age_group' does not exist on type 'trust_tier_analytics'
Property 'last_activity' does not exist on type 'trust_tier_analytics'
```

**Migration Required**:
```sql
ALTER TABLE trust_tier_analytics
ADD COLUMN poll_id UUID REFERENCES polls(id),
ADD COLUMN age_group TEXT,
ADD COLUMN geographic_region TEXT,
ADD COLUMN education_level TEXT,
ADD COLUMN income_bracket TEXT,
ADD COLUMN political_affiliation TEXT,
ADD COLUMN voting_history_count INTEGER DEFAULT 0,
ADD COLUMN biometric_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_methods TEXT[] DEFAULT '{}',
ADD COLUMN data_quality_score NUMERIC,
ADD COLUMN confidence_level NUMERIC,
ADD COLUMN last_activity TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX idx_trust_tier_analytics_poll ON trust_tier_analytics(poll_id);
CREATE INDEX idx_trust_tier_analytics_region ON trust_tier_analytics(geographic_region);
```

**Design Decision**: This table currently appears to be tracking tier *changes*, but the code expects it to track full *analytics* per poll participation. 

**Recommendation**: 
- **OPTION A**: Rename current `trust_tier_analytics` to `trust_tier_progression` (matches actual use)
- **OPTION B**: Create new `poll_participation_analytics` table with these fields
- **OPTION C**: Add columns to existing table (makes it dual-purpose)

---

### 2. ❌ `polls` Table - Missing Voting Control Columns
**Status**: 🔴 MISSING COLUMNS - Voting logic broken  
**Impact**: Can't validate voting rules, duplicate vote prevention broken

**Missing Columns**:
- `owner_id` (UUID, references user_profiles) - Poll creator
- `allow_multiple_votes` (BOOLEAN) - Whether user can vote multiple times

**Files Affected**:
- `shared/actions/vote.ts` (lines 56, 61)

**Error Messages**:
```
Property 'end_date' does not exist on type 'SelectQueryError<"column 'owner_id' does not exist on 'polls'.">'
Property 'allow_multiple_votes' does not exist on type 'SelectQueryError<...>'
```

**Current Schema Has**:
- ✅ `end_date` exists
- ✅ `created_by` exists (likely same as owner_id?)
- ❌ `allow_multiple_votes` missing

**Migration Required**:
```sql
-- Option 1: If created_by is meant to be owner_id
ALTER TABLE polls
ADD COLUMN allow_multiple_votes BOOLEAN DEFAULT FALSE;

-- Option 2: If we need separate owner_id
ALTER TABLE polls
ADD COLUMN owner_id UUID REFERENCES user_profiles(id),
ADD COLUMN allow_multiple_votes BOOLEAN DEFAULT FALSE;

-- Backfill owner_id from created_by if using Option 2
UPDATE polls SET owner_id = created_by::UUID WHERE created_by IS NOT NULL;
```

---

### 3. ❌ `votes` Table - Missing Civic Engagement Columns
**Status**: 🔴 MISSING COLUMNS - Analytics broken  
**Impact**: Can't track civic engagement metrics

**Missing Columns**:
- `total_polls_participated` - User's total poll participation count
- `total_votes_cast` - User's total votes cast
- `average_engagement_score` - User's average engagement

**Files Affected**:
- `lib/types/analytics.ts` (lines 469-471)

**Error Messages**:
```
Property 'total_votes_cast' does not exist on type 'votes'
Property 'average_engagement_score' does not exist on type 'votes'
```

**Analysis**: These look like they should be on `user_profiles` table, not `votes` table. This is likely a code bug, not a schema issue.

**Recommendation**: **FIX CODE** - Query should join with user engagement metrics table or calculate from aggregates, not expect these columns on individual votes.

---

### 4. ❌ `civic_actions` Table - Missing Category Column
**Status**: 🔴 MISSING COLUMN - Civic action filtering broken

**Missing Column**:
- `category` (TEXT) - Action category for filtering/grouping

**Files Affected**:
- `lib/utils/sophisticated-civic-engagement.ts` (line 439)

**Error Messages**:
```
SelectQueryError<"column 'category' does not exist on 'civic_actions'.">
```

**Migration Required**:
```sql
ALTER TABLE civic_actions
ADD COLUMN category TEXT;

CREATE INDEX idx_civic_actions_category ON civic_actions(category);
```

---

## 🔌 MISSING RPC FUNCTIONS (Priority 2)

### 1. ❌ `analyze_query_performance`
**Status**: 🔴 MISSING  
**Called From**: `shared/core/performance/lib/performance-monitor-simple.ts:131`  
**Purpose**: Analyze and log query performance metrics

**Required Signature**:
```sql
CREATE OR REPLACE FUNCTION analyze_query_performance(
  p_query_hash TEXT,
  p_query_signature TEXT,
  p_query_type TEXT,
  p_execution_time_ms NUMERIC,
  p_planning_time_ms NUMERIC,
  p_rows_affected INTEGER,
  p_rows_scanned INTEGER,
  p_buffer_reads INTEGER,
  p_buffer_hits INTEGER,
  p_user_id UUID,
  p_session_id TEXT,
  p_client_ip INET,
  p_user_agent TEXT
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO query_performance_log (
    query_hash, query_signature, query_type,
    execution_time_ms, planning_time_ms,
    rows_affected, rows_scanned,
    buffer_reads, buffer_hits,
    user_id, session_id, client_ip, user_agent
  ) VALUES (
    p_query_hash, p_query_signature, p_query_type,
    p_execution_time_ms, p_planning_time_ms,
    p_rows_affected, p_rows_scanned,
    p_buffer_reads, p_buffer_hits,
    p_user_id, p_session_id, p_client_ip, p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  -- Alert if slow query
  IF p_execution_time_ms > 1000 THEN
    -- Could trigger notification system here
    RAISE NOTICE 'Slow query detected: % ms', p_execution_time_ms;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 2. ❌ `update_cache_performance_metrics`
**Status**: 🔴 MISSING  
**Called From**: `shared/core/performance/lib/performance-monitor-simple.ts:174`  
**Purpose**: Log cache performance data

**Required Signature**:
```sql
CREATE OR REPLACE FUNCTION update_cache_performance_metrics(
  p_cache_key TEXT,
  p_operation TEXT,
  p_operation_time_ms NUMERIC,
  p_cache_size_bytes INTEGER,
  p_ttl_seconds INTEGER,
  p_hit_rate NUMERIC,
  p_miss_rate NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO cache_performance_log (
    cache_key, cache_operation, operation_time_ms,
    cache_size_bytes, ttl_seconds, hit_rate, miss_rate
  ) VALUES (
    p_cache_key, p_operation, p_operation_time_ms,
    p_cache_size_bytes, p_ttl_seconds, p_hit_rate, p_miss_rate
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 3. ❌ `run_maintenance_job`
**Status**: 🔴 MISSING  
**Called From**: `shared/core/performance/lib/performance-monitor-simple.ts:215`  
**Purpose**: Execute database maintenance tasks

**Required Signature**:
```sql
CREATE OR REPLACE FUNCTION run_maintenance_job(
  p_job_name TEXT,
  p_job_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
BEGIN
  v_start_time := NOW();
  
  CASE p_job_type
    WHEN 'vacuum' THEN
      EXECUTE format('VACUUM ANALYZE %I', p_job_name);
      
    WHEN 'reindex' THEN
      EXECUTE format('REINDEX TABLE %I', p_job_name);
      
    WHEN 'cleanup_old_logs' THEN
      DELETE FROM query_performance_log WHERE created_at < NOW() - INTERVAL '30 days';
      DELETE FROM cache_performance_log WHERE created_at < NOW() - INTERVAL '30 days';
      
    ELSE
      RAISE EXCEPTION 'Unknown job type: %', p_job_type;
  END CASE;
  
  v_end_time := NOW();
  
  v_result := jsonb_build_object(
    'job_name', p_job_name,
    'job_type', p_job_type,
    'start_time', v_start_time,
    'end_time', v_end_time,
    'duration_ms', EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000,
    'success', TRUE
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 4. ❌ `get_performance_recommendations`
**Status**: 🔴 MISSING  
**Called From**: `shared/core/performance/lib/performance-monitor-simple.ts:242`  
**Purpose**: Generate performance improvement recommendations

**Required Signature**:
```sql
CREATE OR REPLACE FUNCTION get_performance_recommendations()
RETURNS TABLE(
  recommendation_type TEXT,
  severity TEXT,
  description TEXT,
  affected_tables TEXT[],
  suggested_action TEXT,
  estimated_impact TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Slow queries
  SELECT 
    'slow_queries'::TEXT,
    'high'::TEXT,
    'Multiple slow queries detected'::TEXT,
    ARRAY_AGG(DISTINCT table_name)::TEXT[],
    'Add indexes or optimize queries'::TEXT,
    '50-90% improvement'::TEXT
  FROM query_performance_log
  WHERE slow_query = TRUE 
    AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY 1,2,3
  HAVING COUNT(*) > 10
  
  UNION ALL
  
  -- Low cache hit rate
  SELECT 
    'low_cache_hit_rate'::TEXT,
    'medium'::TEXT,
    'Cache hit rate below 80%'::TEXT,
    NULL::TEXT[],
    'Increase cache TTL or improve cache strategy'::TEXT,
    '20-40% improvement'::TEXT
  FROM cache_performance_log
  WHERE cache_operation = 'MISS'
    AND created_at > NOW() - INTERVAL '1 day'
  GROUP BY 1,2,3
  HAVING (COUNT(*) FILTER (WHERE cache_operation = 'MISS')) * 100.0 / 
         NULLIF(COUNT(*), 0) > 20;
         
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 5. ❌ `cleanup_performance_data`
**Status**: 🔴 MISSING  
**Called From**: `shared/core/performance/lib/performance-monitor-simple.ts:266`  
**Purpose**: Clean up old performance logs

**Required Signature**:
```sql
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS JSONB AS $$
DECLARE
  v_query_logs_deleted INTEGER;
  v_cache_logs_deleted INTEGER;
  v_metrics_deleted INTEGER;
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM query_performance_log 
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_query_logs_deleted = ROW_COUNT;
  
  DELETE FROM cache_performance_log 
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_cache_logs_deleted = ROW_COUNT;
  
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_metrics_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'query_logs_deleted', v_query_logs_deleted,
    'cache_logs_deleted', v_cache_logs_deleted,
    'metrics_deleted', v_metrics_deleted,
    'cleanup_time', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔮 PARTIALLY IMPLEMENTED FEATURES REQUIRING SCHEMA

### 1. Performance Monitoring System
**Status**: 🟡 60% COMPLETE - Code exists, database missing  
**Priority**: HIGH - Admin dashboard depends on this

**Required Schema**:
- ✅ Tables: `performance_metrics`, `query_performance_log`, `cache_performance_log`
- ✅ RPC Functions: All 5 performance functions listed above
- ✅ Indexes: Performance-optimized indexes on timestamp columns
- ⚠️ Materialized Views: Consider for dashboard aggregations

**Files Implementing Feature**:
- `shared/core/performance/lib/performance-monitor-simple.ts` (380 lines)
- `shared/core/performance/lib/performance-monitor.ts` (570 lines)
- `features/admin/components/ComprehensiveAdminDashboard.tsx` (performance tab)

**Estimated Completion**: 2-3 hours
- Create tables (30 min)
- Create RPC functions (90 min)
- Test integration (60 min)

---

### 2. Privacy Consent Management
**Status**: 🟡 70% COMPLETE - Code exists, table missing  
**Priority**: HIGH - GDPR/CCPA compliance

**Required Schema**:
- ✅ Table: `user_consent` (detailed above)
- ✅ Indexes: User ID, consent type, active consents
- ⚠️ RLS Policies: User can only see/modify own consents

**Files Implementing Feature**:
- `utils/privacy/consent.ts` (330 lines)
- `utils/privacy/data-management.ts` (references consent manager)
- `app/api/privacy/preferences/route.ts`

**Estimated Completion**: 1 hour
- Create table (20 min)
- Add RLS policies (20 min)
- Test integration (20 min)

---

### 3. Enhanced Analytics System
**Status**: 🟡 50% COMPLETE - Code exists, columns missing  
**Priority**: MEDIUM - Analytics dashboard broken

**Required Schema Changes**:
- ✅ Modify `trust_tier_analytics` table (add 13 columns)
- ⚠️ OR create separate `poll_participation_analytics` table
- ✅ Indexes: poll_id, geographic_region, timestamp

**Files Implementing Feature**:
- `lib/types/analytics.ts` (500 lines)
- `features/analytics/lib/analytics-service.ts` (237 lines)
- `features/analytics/lib/enhanced-analytics-service.ts`

**Design Decision Needed**: 
Should `trust_tier_analytics` be dual-purpose (tier changes + poll analytics) or should we split into two tables?

**Recommendation**: Split into two tables:
1. `trust_tier_progression` - Tracks tier changes (current functionality)
2. `poll_participation_analytics` - Tracks poll analytics (new functionality)

**Estimated Completion**: 2 hours
- Design decision (15 min)
- Create/modify tables (30 min)
- Update queries in code (60 min)
- Test (15 min)

---

### 4. Poll Voting System Enhancement
**Status**: 🟡 90% COMPLETE - Missing one column  
**Priority**: LOW - Core voting works, just missing duplicate vote prevention

**Required Schema Change**:
```sql
ALTER TABLE polls ADD COLUMN allow_multiple_votes BOOLEAN DEFAULT FALSE;
```

**Files Implementing Feature**:
- `shared/actions/vote.ts` (line 61)
- `app/actions/vote.ts`

**Estimated Completion**: 15 minutes

---

### 5. Civic Engagement Tracking
**Status**: 🟡 40% COMPLETE - Category filtering broken  
**Priority**: MEDIUM - Impacts user experience

**Required Schema Change**:
```sql
ALTER TABLE civic_actions ADD COLUMN category TEXT;
CREATE INDEX idx_civic_actions_category ON civic_actions(category);
```

**Files Implementing Feature**:
- `lib/utils/sophisticated-civic-engagement.ts`
- `app/api/civic-actions/route.ts`

**Estimated Completion**: 30 minutes

---

## 🎯 IMPLEMENTATION PRIORITY MATRIX

### 🔴 Priority 1: MUST FIX (Breaking Features)
| Feature | Tables | Columns | RPC Functions | Estimated Time |
|---------|--------|---------|---------------|----------------|
| Performance Monitoring | 3 | 0 | 5 | 3 hours |
| Privacy Consent | 1 | 0 | 0 | 1 hour |
| Poll Voting Logic | 0 | 1 | 0 | 15 min |

**Total P1**: 4 tables, 1 column, 5 RPC functions, **~4.25 hours**

---

### 🟡 Priority 2: SHOULD FIX (Degraded Features)
| Feature | Tables | Columns | RPC Functions | Estimated Time |
|---------|--------|---------|---------------|----------------|
| Enhanced Analytics | 0-1 | 13 | 0 | 2 hours |
| Civic Engagement | 0 | 1 | 0 | 30 min |

**Total P2**: 0-1 tables, 14 columns, 0 RPC functions, **~2.5 hours**

---

### 🟢 Priority 3: NICE TO HAVE (Future Features)
| Feature | Status | Timeline |
|---------|--------|----------|
| Full Hashtag System | Intentionally incomplete | Future sprint |
| PWA Features | Framework only | Future sprint |
| Internationalization | Stub service | Future sprint |

---

## 📋 RECOMMENDED ACTION PLAN

### Phase 1: Critical Schema Additions (P1)
**Timeline**: 4-5 hours  
**Goal**: Restore all broken features

1. **Create Performance Tables** (30 min)
   ```sql
   CREATE TABLE performance_metrics (...);
   CREATE TABLE query_performance_log (...);
   CREATE TABLE cache_performance_log (...);
   ```

2. **Create Performance RPC Functions** (90 min)
   - `analyze_query_performance`
   - `update_cache_performance_metrics`
   - `run_maintenance_job`
   - `get_performance_recommendations`
   - `cleanup_performance_data`

3. **Create Privacy Table** (20 min)
   ```sql
   CREATE TABLE user_consent (...);
   -- Add RLS policies
   ```

4. **Add Poll Column** (5 min)
   ```sql
   ALTER TABLE polls ADD COLUMN allow_multiple_votes BOOLEAN DEFAULT FALSE;
   ```

5. **Regenerate TypeScript Types** (5 min)
   ```bash
   npx supabase gen types typescript --project-id <project-id> > utils/supabase/database.types.ts
   ```

6. **Test All Changes** (60 min)
   - Test performance monitoring
   - Test privacy consent
   - Test poll voting
   - Verify TypeScript errors reduced

---

### Phase 2: Analytics Enhancement (P2)
**Timeline**: 2-3 hours  
**Goal**: Restore analytics features

1. **Design Decision**: Split `trust_tier_analytics` (15 min)
   - Rename to `trust_tier_progression`
   - Create `poll_participation_analytics`

2. **Implement Schema Changes** (30 min)

3. **Update Application Code** (60 min)
   - Update queries in `analytics-service.ts`
   - Update type imports
   - Update API routes

4. **Add Civic Actions Category** (30 min)
   ```sql
   ALTER TABLE civic_actions ADD COLUMN category TEXT;
   ```

5. **Test & Verify** (30 min)

---

### Phase 3: Verification & Documentation (P3)
**Timeline**: 1-2 hours  
**Goal**: Ensure all changes are correct

1. **Run Full Type Check** (10 min)
   ```bash
   npm run lint:strict
   ```

2. **Document Schema Changes** (30 min)
   - Update migration docs
   - Document new RPC functions
   - Update API documentation

3. **Create Migration Scripts** (30 min)
   - Forward migration
   - Rollback migration
   - Seed data for testing

4. **Update Tests** (30 min)
   - Add tests for new tables
   - Add tests for RPC functions

---

## 🚨 CRITICAL NOTES

### Data Integrity Concerns

1. **`trust_tier_analytics` Dual Purpose**
   - Current table tracks tier changes
   - Code expects it to track poll analytics
   - **MUST DECIDE**: Rename existing table or make it dual-purpose
   - **RECOMMENDATION**: Rename to avoid confusion

2. **Performance Tables Will Grow Fast**
   - Expect 100K+ rows per week
   - **MUST IMPLEMENT**: Automated cleanup (30-day retention)
   - **CONSIDER**: Partitioning by timestamp
   - **CONSIDER**: Materialized views for dashboard

3. **Privacy Consent**
   - Legal requirement to maintain consent history
   - **MUST NOT**: Delete old consent records
   - **IMPLEMENT**: Soft deletes only (revoked_at timestamp)
   - **CONSIDER**: Audit log for consent changes

---

## 📊 EXPECTED ERROR REDUCTION

### Current State
- **Total Errors**: 414
- **Schema-Related**: ~250 (60%)

### After Phase 1 (P1 Fixes)
- **Expected Errors**: ~200 (-214)
- **Tables Fixed**: 4
- **Columns Fixed**: 1
- **RPC Functions**: 5

### After Phase 2 (P2 Fixes)
- **Expected Errors**: ~150 (-50)
- **Columns Fixed**: 14

### After Phase 3 (P3 - All Fixes)
- **Expected Errors**: ~100 (-50)
- **Remaining**: Primarily `exactOptionalPropertyTypes` issues

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ All performance monitoring features functional
- ✅ Privacy consent system operational
- ✅ Poll voting duplicate prevention works
- ✅ TypeScript errors < 200
- ✅ Admin dashboard performance tab loads

### Phase 2 Complete When:
- ✅ Enhanced analytics queries return data
- ✅ Civic action filtering works
- ✅ TypeScript errors < 150
- ✅ Analytics dashboard fully functional

### Phase 3 Complete When:
- ✅ All schema changes documented
- ✅ Migration scripts tested
- ✅ TypeScript errors < 100
- ✅ All features tested end-to-end

---

## 📝 MIGRATION SCRIPT TEMPLATE

```sql
-- Migration: Add Performance Monitoring Schema
-- Date: 2025-11-03
-- Priority: P1 - Critical

BEGIN;

-- 1. Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  -- [Full schema from above]
);

-- 2. Create query_performance_log table
CREATE TABLE IF NOT EXISTS query_performance_log (
  -- [Full schema from above]
);

-- 3. Create cache_performance_log table
CREATE TABLE IF NOT EXISTS cache_performance_log (
  -- [Full schema from above]
);

-- 4. Create user_consent table
CREATE TABLE IF NOT EXISTS user_consent (
  -- [Full schema from above]
);

-- 5. Add missing column to polls
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS allow_multiple_votes BOOLEAN DEFAULT FALSE;

-- 6. Create RPC functions
CREATE OR REPLACE FUNCTION analyze_query_performance(...)
RETURNS UUID AS $$ ... $$;

-- [Add all 5 RPC functions]

-- 7. Add indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name 
  ON performance_metrics(metric_name);
-- [Add all other indexes]

-- 8. Set up RLS policies for user_consent
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent"
  ON user_consent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent"
  ON user_consent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consent"
  ON user_consent FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;
```

---

## 🔄 ROLLBACK SCRIPT TEMPLATE

```sql
-- Rollback: Remove Performance Monitoring Schema
-- Date: 2025-11-03

BEGIN;

-- Drop tables in reverse order
DROP TABLE IF EXISTS user_consent CASCADE;
DROP TABLE IF EXISTS cache_performance_log CASCADE;
DROP TABLE IF EXISTS query_performance_log CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;

-- Remove column from polls
ALTER TABLE polls 
DROP COLUMN IF EXISTS allow_multiple_votes;

-- Drop RPC functions
DROP FUNCTION IF EXISTS analyze_query_performance CASCADE;
DROP FUNCTION IF EXISTS update_cache_performance_metrics CASCADE;
DROP FUNCTION IF EXISTS run_maintenance_job CASCADE;
DROP FUNCTION IF EXISTS get_performance_recommendations CASCADE;
DROP FUNCTION IF EXISTS cleanup_performance_data CASCADE;

COMMIT;
```

---

## 📞 QUESTIONS FOR USER

Before proceeding with schema changes, need decisions on:

1. **`trust_tier_analytics` Table**:
   - Option A: Rename to `trust_tier_progression`, create new `poll_participation_analytics`
   - Option B: Keep name, add columns (dual-purpose table)
   - Option C: Keep as-is, fix code to use correct table
   - **RECOMMENDATION**: Option A

2. **Performance Data Retention**:
   - How long to keep performance logs? (Suggest: 30 days)
   - Should we implement table partitioning? (Suggest: Yes, if > 1M rows expected)
   
3. **Privacy Consent History**:
   - Keep full history or soft-delete after N days?
   - **RECOMMENDATION**: Keep full history for legal compliance

4. **Migration Timing**:
   - Deploy during maintenance window?
   - Incremental migration or all at once?
   - **RECOMMENDATION**: All at once during maintenance window

---

**End of Audit Report**

_Generated: November 3, 2025_  
_Next Update: After Phase 1 implementation_


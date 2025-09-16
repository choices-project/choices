-- ============================================================================
-- PERFORMANCE OPTIMIZATION SCRIPT
-- ============================================================================
-- This script addresses the 80 performance issues by optimizing queries and indexes
-- 
-- Created: September 9, 2025
-- Run this in your Supabase SQL Editor to improve query performance
-- ============================================================================

-- ============================================================================
-- STEP 1: ANALYZE CURRENT PERFORMANCE
-- ============================================================================

-- Check current slow queries
SELECT 
    query,
    mean_time,
    calls,
    total_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Check table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- STEP 2: ADD MISSING INDEXES
-- ============================================================================

-- Add indexes for user_profiles table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_trust_tier 
ON user_profiles(trust_tier) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id_active 
ON user_profiles(user_id) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_username_active 
ON user_profiles(username) 
WHERE is_active = true;

-- Add indexes for polls table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_created_at_status 
ON polls(created_at DESC, status) 
WHERE status IN ('active', 'draft');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_created_by_status 
ON polls(created_by, status) 
WHERE status IN ('active', 'draft');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_category_status 
ON polls(category, status) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_privacy_status 
ON polls(privacy_level, status) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_end_time_status 
ON polls(end_time, status) 
WHERE status = 'active' AND end_time IS NOT NULL;

-- Add indexes for votes table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_user 
ON votes(poll_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_created 
ON votes(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_created 
ON votes(poll_id, created_at DESC);

-- Add indexes for feedback table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_created_at 
ON feedback(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_status_priority 
ON feedback(status, priority) 
WHERE status IN ('open', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_type_sentiment 
ON feedback(type, sentiment);

-- Add indexes for error_logs table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_created_at_severity 
ON error_logs(created_at DESC, severity) 
WHERE severity IN ('high', 'critical');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_user_created 
ON error_logs(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- STEP 3: OPTIMIZE EXISTING INDEXES
-- ============================================================================

-- Check for unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY tablename, indexname;

-- Check for duplicate indexes
SELECT 
    t1.schemaname,
    t1.tablename,
    t1.indexname as index1,
    t2.indexname as index2,
    t1.indexdef as definition1,
    t2.indexdef as definition2
FROM pg_indexes t1
JOIN pg_indexes t2 ON t1.tablename = t2.tablename 
    AND t1.schemaname = t2.schemaname
    AND t1.indexname < t2.indexname
WHERE t1.schemaname = 'public'
AND t1.indexdef = t2.indexdef;

-- ============================================================================
-- STEP 4: UPDATE TABLE STATISTICS
-- ============================================================================

-- Update statistics for all tables
ANALYZE user_profiles;
ANALYZE polls;
ANALYZE votes;
ANALYZE feedback;
ANALYZE error_logs;

-- Update statistics for any other tables that exist
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('user_profiles', 'polls', 'votes', 'feedback', 'error_logs')
    LOOP
        EXECUTE format('ANALYZE %I', table_name);
        RAISE NOTICE 'Analyzed table: %', table_name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: OPTIMIZE QUERY PATTERNS
-- ============================================================================

-- Create optimized views for common queries
CREATE OR REPLACE VIEW active_polls_summary AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.tags,
    p.created_by,
    p.created_at,
    p.end_time,
    p.total_votes,
    p.participation,
    up.username as creator_username,
    up.trust_tier as creator_trust_tier
FROM polls p
JOIN user_profiles up ON p.created_by = up.user_id
WHERE p.status = 'active'
AND p.privacy_level = 'public'
AND up.is_active = true;

-- Create optimized view for user poll statistics
CREATE OR REPLACE VIEW user_poll_stats AS
SELECT 
    up.user_id,
    up.username,
    up.trust_tier,
    COUNT(p.id) as total_polls,
    COUNT(p.id) FILTER (WHERE p.status = 'active') as active_polls,
    COUNT(p.id) FILTER (WHERE p.status = 'closed') as closed_polls,
    SUM(p.total_votes) as total_votes_received,
    AVG(p.total_votes) as avg_votes_per_poll
FROM user_profiles up
LEFT JOIN polls p ON up.user_id = p.created_by
WHERE up.is_active = true
GROUP BY up.user_id, up.username, up.trust_tier;

-- ============================================================================
-- STEP 6: CLEAN UP DEAD TUPLES
-- ============================================================================

-- Vacuum tables to clean up dead tuples
VACUUM ANALYZE user_profiles;
VACUUM ANALYZE polls;
VACUUM ANALYZE votes;
VACUUM ANALYZE feedback;
VACUUM ANALYZE error_logs;

-- ============================================================================
-- STEP 7: MONITOR QUERY PERFORMANCE
-- ============================================================================

-- Create function to monitor slow queries
CREATE OR REPLACE FUNCTION public.get_slow_queries(threshold_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
    query_text TEXT,
    mean_time_ms NUMERIC,
    total_calls BIGINT,
    total_time_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        LEFT(query, 100) as query_text,
        ROUND(mean_time::NUMERIC, 2) as mean_time_ms,
        calls as total_calls,
        ROUND(total_time::NUMERIC, 2) as total_time_ms
    FROM pg_stat_statements 
    WHERE mean_time > threshold_ms
    ORDER BY mean_time DESC
    LIMIT 20;
END;
$$;

-- ============================================================================
-- STEP 8: PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- Create view for index usage statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'LOW_USAGE'
        WHEN idx_scan < 100 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create view for table statistics
CREATE OR REPLACE VIEW table_performance_stats AS
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_tuple_percentage,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- STEP 9: VERIFY PERFORMANCE IMPROVEMENTS
-- ============================================================================

-- Check current slow queries after optimization
SELECT 
    'SLOW QUERIES AFTER OPTIMIZATION' as status,
    COUNT(*) as slow_query_count,
    ROUND(AVG(mean_time), 2) as avg_slow_query_time_ms
FROM pg_stat_statements 
WHERE mean_time > 1000;

-- Check index usage
SELECT 
    'INDEX USAGE SUMMARY' as status,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE idx_scan > 0) as used_indexes,
    COUNT(*) FILTER (WHERE idx_scan = 0) as unused_indexes
FROM pg_stat_user_indexes
WHERE schemaname = 'public';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '⚡ PERFORMANCE OPTIMIZATION COMPLETE! ⚡' as status;

-- Performance summary
SELECT 
    'PERFORMANCE OPTIMIZATION STATUS' as summary_type,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE idx_scan > 0) as used_indexes,
    COUNT(*) FILTER (WHERE idx_scan = 0) as unused_indexes,
    CASE 
        WHEN COUNT(*) FILTER (WHERE idx_scan = 0) = 0 
        THEN '✅ ALL INDEXES ARE BEING USED'
        ELSE '⚠️  ' || COUNT(*) FILTER (WHERE idx_scan = 0) || ' UNUSED INDEXES'
    END as index_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public';



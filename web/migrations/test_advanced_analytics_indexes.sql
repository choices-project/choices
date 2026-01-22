-- Test script: Verify indexes are being used for advanced_analytics_usage queries
-- Purpose: Test that indexes are properly utilized when queries run
-- Created: January 2025
--
-- Run this after the table has some data and queries have been executed
-- to verify indexes are working correctly

-- 1. Check current index usage statistics
SELECT 
  schemaname, 
  relname as tablename, 
  indexrelname as indexname, 
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️  Never used'
    WHEN idx_scan < 10 THEN '⚠️  Rarely used'
    ELSE '✅ Used'
  END as usage_status
FROM pg_stat_user_indexes
WHERE relname = 'advanced_analytics_usage'
ORDER BY idx_scan DESC, indexrelname;

-- 2. Check table statistics (should have data for indexes to be useful)
SELECT 
  schemaname,
  relname as tablename,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'advanced_analytics_usage';

-- 3. Test query with EXPLAIN to verify index usage
-- Replace 'test-user-id' with an actual user_id from your table
-- 
-- This should show "Index Scan using idx_analytics_usage_user_week" in the plan
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM advanced_analytics_usage
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND created_at >= NOW() - INTERVAL '7 days';

-- 4. Test oldest query (should use idx_analytics_usage_user_created_asc)
EXPLAIN ANALYZE
SELECT created_at 
FROM advanced_analytics_usage
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at ASC
LIMIT 1;

-- 5. Check index sizes (to verify they exist and have reasonable size)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  pg_size_pretty(pg_relation_size(indexrelid)::bigint) as size_bytes
FROM pg_indexes
WHERE tablename = 'advanced_analytics_usage'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 6. Reset statistics (optional - only if you want fresh stats)
-- WARNING: This resets ALL statistics for the database
-- Only run in development/testing environments
-- SELECT pg_stat_reset();

-- Notes:
-- - idx_scan = 0 is normal if no queries have run yet
-- - Indexes will show usage once:
--   1. Rate limiting queries are executed
--   2. Analytics requests are made
--   3. The table has data
-- - Check again after 24-48 hours of actual usage
-- - Use EXPLAIN ANALYZE to verify indexes are being used in query plans

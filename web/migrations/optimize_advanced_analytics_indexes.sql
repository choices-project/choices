-- Migration: Optimize indexes for advanced_analytics_usage table
-- Purpose: Optimize indexes based on actual query patterns for rate limiting
-- Created: January 2025
-- 
-- This migration optimizes indexes based on analysis of query patterns:
-- 1. Count queries: WHERE user_id = ? AND created_at >= ?
-- 2. Oldest queries: WHERE user_id = ? AND created_at >= ? ORDER BY created_at ASC LIMIT 1
-- 3. Upsert queries: ON CONFLICT (user_id, poll_id, analytics_type)
--
-- Note: Run this after the initial migration and after Index Advisor has had time
-- to analyze query patterns (24-48 hours after table creation)

-- Analysis of current indexes:
-- 1. idx_analytics_usage_user_week (user_id, created_at DESC)
--    - Good for count queries
--    - Can be used in reverse for ORDER BY ASC, but not optimal
--    - Recommendation: Keep but consider adding ASC version if needed
--
-- 2. idx_analytics_usage_poll (poll_id)
--    - Not used in rate limiting queries
--    - May be useful for other analytics queries
--    - Recommendation: Keep if used elsewhere, otherwise remove
--
-- 3. idx_analytics_usage_type (analytics_type)
--    - Not used in rate limiting queries
--    - May be useful for analytics reporting
--    - Recommendation: Keep if used elsewhere, otherwise remove
--
-- 4. idx_analytics_usage_created_at (created_at)
--    - Not optimal for our queries (we always filter by user_id first)
--    - May be useful for cleanup queries
--    - Recommendation: Keep for cleanup/maintenance queries

-- OPTIMIZATION: Create a composite index optimized for our query pattern
-- This index supports both count and ORDER BY queries efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_usage_user_created_asc
ON advanced_analytics_usage(user_id, created_at ASC);

-- Note: We keep the DESC index for count queries (which are more common)
-- The ASC index is specifically for the "find oldest" query pattern
-- PostgreSQL can use indexes in reverse, but having both directions
-- can help the query planner choose the optimal index

-- ANALYZE to update statistics for query planner
ANALYZE advanced_analytics_usage;

-- Verification queries (run these to check index usage):
-- 
-- 1. Check if indexes are being used:
-- SELECT schemaname, relname as tablename, indexrelname as indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE relname = 'advanced_analytics_usage'
-- ORDER BY idx_scan DESC;
--
-- 2. Test query performance:
-- EXPLAIN ANALYZE
-- SELECT COUNT(*) FROM advanced_analytics_usage
-- WHERE user_id = 'some-user-id'
--   AND created_at >= NOW() - INTERVAL '7 days';
--
-- 3. Test oldest query:
-- EXPLAIN ANALYZE
-- SELECT created_at FROM advanced_analytics_usage
-- WHERE user_id = 'some-user-id'
--   AND created_at >= NOW() - INTERVAL '7 days'
-- ORDER BY created_at ASC
-- LIMIT 1;

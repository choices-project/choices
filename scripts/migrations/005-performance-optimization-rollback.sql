-- Rollback Migration 005: Performance Optimization
-- This script reverts the performance optimization changes

-- Step 1: Drop RLS policies
DROP POLICY IF EXISTS "Admins can manage performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Admins can manage query performance" ON query_performance_log;
DROP POLICY IF EXISTS "Admins can manage index usage" ON index_usage_analytics;
DROP POLICY IF EXISTS "Admins can manage connection pools" ON connection_pool_metrics;
DROP POLICY IF EXISTS "Admins can manage cache performance" ON cache_performance_log;
DROP POLICY IF EXISTS "Admins can manage maintenance jobs" ON maintenance_jobs;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS trg_index_usage_analytics_updated ON index_usage_analytics;
DROP TRIGGER IF EXISTS trg_cache_performance_log_updated ON cache_performance_log;
DROP TRIGGER IF EXISTS trg_maintenance_jobs_updated ON maintenance_jobs;

-- Step 3: Drop helper functions
DROP FUNCTION IF EXISTS analyze_query_performance(TEXT, TEXT, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, UUID, VARCHAR, INET, TEXT);
DROP FUNCTION IF EXISTS update_index_usage_analytics(VARCHAR, VARCHAR, VARCHAR, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, DECIMAL);
DROP FUNCTION IF EXISTS update_connection_pool_metrics(VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_cache_performance_metrics(VARCHAR, VARCHAR, BIGINT, BIGINT, INTEGER, INTEGER, INTEGER, BIGINT, BIGINT, BIGINT);
DROP FUNCTION IF EXISTS run_maintenance_job(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS get_performance_recommendations();
DROP FUNCTION IF EXISTS cleanup_performance_data();

-- Step 4: Drop indexes for performance_metrics
DROP INDEX IF EXISTS idx_performance_metrics_type_name;
DROP INDEX IF EXISTS idx_performance_metrics_created_at;
DROP INDEX IF EXISTS idx_performance_metrics_table;
DROP INDEX IF EXISTS idx_performance_metrics_query_hash;

-- Step 5: Drop indexes for query_performance_log
DROP INDEX IF EXISTS idx_query_performance_hash;
DROP INDEX IF EXISTS idx_query_performance_type;
DROP INDEX IF EXISTS idx_query_performance_execution_time;
DROP INDEX IF EXISTS idx_query_performance_created_at;
DROP INDEX IF EXISTS idx_query_performance_user_id;
DROP INDEX IF EXISTS idx_query_performance_ttl;

-- Step 6: Drop indexes for index_usage_analytics
DROP INDEX IF EXISTS idx_index_usage_table_name;
DROP INDEX IF EXISTS idx_index_usage_efficiency;
DROP INDEX IF EXISTS idx_index_usage_recommended;
DROP INDEX IF EXISTS idx_index_usage_last_used;

-- Step 7: Drop indexes for connection_pool_metrics
DROP INDEX IF EXISTS idx_connection_pool_name;
DROP INDEX IF EXISTS idx_connection_pool_health;
DROP INDEX IF EXISTS idx_connection_pool_created_at;

-- Step 8: Drop indexes for cache_performance_log
DROP INDEX IF EXISTS idx_cache_performance_name;
DROP INDEX IF EXISTS idx_cache_performance_hit_rate;
DROP INDEX IF EXISTS idx_cache_performance_created_at;

-- Step 9: Drop indexes for maintenance_jobs
DROP INDEX IF EXISTS idx_maintenance_jobs_name;
DROP INDEX IF EXISTS idx_maintenance_jobs_status;
DROP INDEX IF EXISTS idx_maintenance_jobs_type;
DROP INDEX IF EXISTS idx_maintenance_jobs_created_at;

-- Step 10: Drop tables (in dependency order)
DROP TABLE IF EXISTS maintenance_jobs;
DROP TABLE IF EXISTS cache_performance_log;
DROP TABLE IF EXISTS connection_pool_metrics;
DROP TABLE IF EXISTS index_usage_analytics;
DROP TABLE IF EXISTS query_performance_log;
DROP TABLE IF EXISTS performance_metrics;

-- Step 11: Remove comments (they will be dropped with the tables)

-- Rollback completed
-- All performance optimization tables and functions have been removed
-- The database is back to the state before Week 6 migration













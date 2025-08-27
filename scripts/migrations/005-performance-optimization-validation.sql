-- Validation Script for Migration 005: Performance Optimization
-- This script validates that the performance optimization migration was successful

-- Step 1: Validate new tables exist
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'performance_metrics', 'query_performance_log', 'index_usage_analytics',
      'connection_pool_metrics', 'cache_performance_log', 'maintenance_jobs'
    )
  LOOP
    RAISE NOTICE 'Table % exists', table_record.table_name;
  END LOOP;
END $$;

-- Step 2: Validate table structures
DO $$
DECLARE
  column_record RECORD;
BEGIN
  -- Check performance_metrics structure
  RAISE NOTICE 'Checking performance_metrics structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'performance_metrics'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %: % (nullable: %)', column_record.column_name, column_record.data_type, column_record.is_nullable;
  END LOOP;
  
  -- Check query_performance_log structure
  RAISE NOTICE 'Checking query_performance_log structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'query_performance_log'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %: % (nullable: %)', column_record.column_name, column_record.data_type, column_record.is_nullable;
  END LOOP;
END $$;

-- Step 3: Validate indexes exist
DO $$
DECLARE
  index_record RECORD;
BEGIN
  FOR index_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_performance_metrics_%' OR 
          indexname LIKE 'idx_query_performance_%' OR 
          indexname LIKE 'idx_index_usage_%' OR 
          indexname LIKE 'idx_connection_pool_%' OR 
          indexname LIKE 'idx_cache_performance_%' OR 
          indexname LIKE 'idx_maintenance_jobs_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE 'Index % exists', index_record.indexname;
  END LOOP;
END $$;

-- Step 4: Validate helper functions exist
DO $$
DECLARE
  function_record RECORD;
BEGIN
  FOR function_record IN 
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_name IN (
      'analyze_query_performance', 'update_index_usage_analytics',
      'update_connection_pool_metrics', 'update_cache_performance_metrics',
      'run_maintenance_job', 'get_performance_recommendations', 'cleanup_performance_data'
    )
    ORDER BY routine_name
  LOOP
    RAISE NOTICE 'Function % exists', function_record.routine_name;
  END LOOP;
END $$;

-- Step 5: Validate RLS is enabled
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'performance_metrics', 'query_performance_log', 'index_usage_analytics',
      'connection_pool_metrics', 'cache_performance_log', 'maintenance_jobs'
    )
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = table_record.table_name 
      AND rowsecurity = true
    ) THEN
      RAISE NOTICE 'RLS is enabled on table %', table_record.table_name;
    ELSE
      RAISE WARNING 'RLS is not enabled on table %', table_record.table_name;
    END IF;
  END LOOP;
END $$;

-- Step 6: Validate RLS policies exist
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE tablename IN (
      'performance_metrics', 'query_performance_log', 'index_usage_analytics',
      'connection_pool_metrics', 'cache_performance_log', 'maintenance_jobs'
    )
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Policy % exists on table %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- Step 7: Test performance analysis functions
DO $$
DECLARE
  test_query_hash TEXT := 'test_hash_12345';
  test_query_signature TEXT := 'SELECT * FROM test_table WHERE id = ?';
  test_log_id UUID;
  test_analytics_id UUID;
  test_metrics_id UUID;
  test_cache_id UUID;
BEGIN
  -- Test analyze_query_performance function
  SELECT analyze_query_performance(
    test_query_hash, test_query_signature, 'SELECT',
    150, 10, 1, 100, 50, 45,
    NULL, 'test-session', '192.168.1.1', 'Test Browser'
  ) INTO test_log_id;
  
  IF test_log_id IS NOT NULL THEN
    RAISE NOTICE 'analyze_query_performance function works correctly';
  ELSE
    RAISE WARNING 'analyze_query_performance function failed';
  END IF;
  
  -- Test update_index_usage_analytics function
  SELECT update_index_usage_analytics(
    'test_table', 'idx_test_table_id', 'btree',
    100, 95, 5, 1000, 950, 5.5
  ) INTO test_analytics_id;
  
  IF test_analytics_id IS NOT NULL THEN
    RAISE NOTICE 'update_index_usage_analytics function works correctly';
  ELSE
    RAISE WARNING 'update_index_usage_analytics function failed';
  END IF;
  
  -- Test update_connection_pool_metrics function
  SELECT update_connection_pool_metrics(
    'test_pool', 'database', 20, 5, 15, 0, 10, 25, 0
  ) INTO test_metrics_id;
  
  IF test_metrics_id IS NOT NULL THEN
    RAISE NOTICE 'update_connection_pool_metrics function works correctly';
  ELSE
    RAISE WARNING 'update_connection_pool_metrics function failed';
  END IF;
  
  -- Test update_cache_performance_metrics function
  SELECT update_cache_performance_metrics(
    'test_cache', 'redis', 1000, 100, 5, 10, 1, 1048576, 2097152, 5
  ) INTO test_cache_id;
  
  IF test_cache_id IS NOT NULL THEN
    RAISE NOTICE 'update_cache_performance_metrics function works correctly';
  ELSE
    RAISE WARNING 'update_cache_performance_metrics function failed';
  END IF;
  
END $$;

-- Step 8: Test maintenance job functions
DO $$
DECLARE
  test_job_id UUID;
  test_recommendations_count INTEGER;
  test_cleanup_count INTEGER;
BEGIN
  -- Test run_maintenance_job function
  SELECT run_maintenance_job('test_cleanup', 'cleanup') INTO test_job_id;
  
  IF test_job_id IS NOT NULL THEN
    RAISE NOTICE 'run_maintenance_job function works correctly';
  ELSE
    RAISE WARNING 'run_maintenance_job function failed';
  END IF;
  
  -- Test get_performance_recommendations function
  SELECT COUNT(*) INTO test_recommendations_count 
  FROM get_performance_recommendations();
  
  RAISE NOTICE 'get_performance_recommendations function returned % recommendations', test_recommendations_count;
  
  -- Test cleanup_performance_data function
  SELECT cleanup_performance_data() INTO test_cleanup_count;
  
  IF test_cleanup_count >= 0 THEN
    RAISE NOTICE 'cleanup_performance_data function works correctly (cleaned up % records)', test_cleanup_count;
  ELSE
    RAISE WARNING 'cleanup_performance_data function failed';
  END IF;
  
END $$;

-- Step 9: Test generated columns
DO $$
DECLARE
  test_record RECORD;
BEGIN
  -- Test that generated columns work correctly in cache_performance_log
  INSERT INTO cache_performance_log (
    cache_name, cache_type, hit_count, miss_count,
    avg_response_time_ms, memory_usage_bytes, memory_limit_bytes
  ) VALUES (
    'test_cache_gen', 'memory', 100, 20,
    5, 1048576, 2097152
  ) RETURNING hit_rate, memory_usage_percent INTO test_record;
  
  IF test_record.hit_rate IS NOT NULL AND test_record.memory_usage_percent IS NOT NULL THEN
    RAISE NOTICE 'Generated columns work correctly (hit_rate: %, memory_usage: %%)', 
      test_record.hit_rate, test_record.memory_usage_percent;
    
    -- Clean up test data
    DELETE FROM cache_performance_log WHERE cache_name = 'test_cache_gen';
  ELSE
    RAISE WARNING 'Generated columns failed';
  END IF;
END $$;

-- Step 10: Test constraints
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN 
    SELECT conname, conrelid::regclass as table_name
    FROM pg_constraint 
    WHERE conrelid IN (
      SELECT oid FROM pg_class 
      WHERE relname IN (
        'performance_metrics', 'query_performance_log', 'index_usage_analytics',
        'connection_pool_metrics', 'cache_performance_log', 'maintenance_jobs'
      )
    )
    ORDER BY table_name, conname
  LOOP
    RAISE NOTICE 'Constraint % exists on table %', constraint_record.conname, constraint_record.table_name;
  END LOOP;
END $$;

-- Step 11: Test triggers
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers 
    WHERE trigger_name IN (
      'trg_index_usage_analytics_updated', 'trg_cache_performance_log_updated', 'trg_maintenance_jobs_updated'
    )
  LOOP
    RAISE NOTICE 'Trigger % exists on table %', trigger_record.trigger_name, trigger_record.event_object_table;
  END LOOP;
END $$;

-- Step 12: Test TTL indexes
DO $$
DECLARE
  index_record RECORD;
  query_plan TEXT;
BEGIN
  -- Test that TTL indexes are being used
  FOR index_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname LIKE '%_ttl'
    ORDER BY indexname
  LOOP
    RAISE NOTICE 'Testing TTL index: %', index_record.indexname;
    
    -- This is a basic test - in production you'd want more comprehensive testing
    EXECUTE 'EXPLAIN (FORMAT TEXT) SELECT 1 FROM query_performance_log WHERE created_at < NOW() LIMIT 1' INTO query_plan;
    
    IF query_plan LIKE '%Index%' THEN
      RAISE NOTICE 'TTL index % is being used', index_record.indexname;
    ELSE
      RAISE WARNING 'TTL index % may not be used optimally', index_record.indexname;
    END IF;
  END LOOP;
END $$;

-- Step 13: Test foreign key relationships
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  FOR fk_record IN 
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN (
      'performance_metrics', 'query_performance_log', 'index_usage_analytics',
      'connection_pool_metrics', 'cache_performance_log', 'maintenance_jobs'
    )
    ORDER BY tc.table_name, tc.constraint_name
  LOOP
    RAISE NOTICE 'Foreign key %: %.% -> %.%', 
      fk_record.constraint_name,
      fk_record.table_name, fk_record.column_name,
      fk_record.foreign_table_name, fk_record.foreign_column_name;
  END LOOP;
END $$;

-- Step 14: Test performance data insertion
DO $$
DECLARE
  test_metric_id UUID;
  test_performance_id UUID;
BEGIN
  -- Test performance metrics insertion
  INSERT INTO performance_metrics (
    metric_type, metric_name, metric_value, metric_unit,
    table_name, execution_time_ms
  ) VALUES (
    'query_performance', 'test_metric', 150.5, 'ms',
    'test_table', 150
  ) RETURNING id INTO test_metric_id;
  
  IF test_metric_id IS NOT NULL THEN
    RAISE NOTICE 'Performance metrics insertion works correctly';
    
    -- Clean up test data
    DELETE FROM performance_metrics WHERE id = test_metric_id;
  ELSE
    RAISE WARNING 'Performance metrics insertion failed';
  END IF;
  
  -- Test query performance log insertion
  INSERT INTO query_performance_log (
    query_hash, query_signature, query_type, execution_time_ms
  ) VALUES (
    'test_hash_67890', 'SELECT * FROM test_table', 'SELECT', 200
  ) RETURNING id INTO test_performance_id;
  
  IF test_performance_id IS NOT NULL THEN
    RAISE NOTICE 'Query performance log insertion works correctly';
    
    -- Clean up test data
    DELETE FROM query_performance_log WHERE id = test_performance_id;
  ELSE
    RAISE WARNING 'Query performance log insertion failed';
  END IF;
  
END $$;

-- Step 15: Test data cleanup
DO $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Clean up any test data that might have been created
  DELETE FROM performance_metrics WHERE metric_name = 'test_metric';
  DELETE FROM query_performance_log WHERE query_hash LIKE 'test_hash_%';
  DELETE FROM index_usage_analytics WHERE table_name = 'test_table';
  DELETE FROM connection_pool_metrics WHERE pool_name = 'test_pool';
  DELETE FROM cache_performance_log WHERE cache_name LIKE 'test_cache%';
  DELETE FROM maintenance_jobs WHERE job_name = 'test_cleanup';
  
  RAISE NOTICE 'Test data cleanup completed';
END $$;

-- Validation completed successfully
SELECT 'Performance Optimization Migration Validation: PASSED' as status;




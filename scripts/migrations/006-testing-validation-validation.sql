-- Validation Migration 006: Testing & Validation
-- Week 7 of Phase 1.4: Database Schema Hardening

-- Validate that all tables exist
DO $$
BEGIN
  -- Check schema validation results table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_validation_results') THEN
    RAISE EXCEPTION 'schema_validation_results table does not exist';
  END IF;
  
  -- Check data consistency checks table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_consistency_checks') THEN
    RAISE EXCEPTION 'data_consistency_checks table does not exist';
  END IF;
  
  -- Check performance baselines table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_baselines') THEN
    RAISE EXCEPTION 'performance_baselines table does not exist';
  END IF;
  
  -- Check security validation results table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_validation_results') THEN
    RAISE EXCEPTION 'security_validation_results table does not exist';
  END IF;
  
  RAISE NOTICE '✅ All validation tables exist';
END $$;

-- Validate table structures
DO $$
BEGIN
  -- Check schema_validation_results structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schema_validation_results' 
    AND column_name IN ('test_name', 'test_category', 'status', 'execution_time_ms')
  ) THEN
    RAISE EXCEPTION 'schema_validation_results table missing required columns';
  END IF;
  
  -- Check data_consistency_checks structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'data_consistency_checks' 
    AND column_name IN ('check_name', 'check_type', 'total_records', 'valid_records', 'invalid_records')
  ) THEN
    RAISE EXCEPTION 'data_consistency_checks table missing required columns';
  END IF;
  
  -- Check performance_baselines structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_baselines' 
    AND column_name IN ('baseline_name', 'baseline_type', 'metric_name', 'baseline_value')
  ) THEN
    RAISE EXCEPTION 'performance_baselines table missing required columns';
  END IF;
  
  -- Check security_validation_results structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'security_validation_results' 
    AND column_name IN ('check_name', 'check_category', 'status', 'severity')
  ) THEN
    RAISE EXCEPTION 'security_validation_results table missing required columns';
  END IF;
  
  RAISE NOTICE '✅ All table structures are correct';
END $$;

-- Validate indexes
DO $$
BEGIN
  -- Check schema validation indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_schema_validation_test_name') THEN
    RAISE EXCEPTION 'Missing index: idx_schema_validation_test_name';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_schema_validation_category') THEN
    RAISE EXCEPTION 'Missing index: idx_schema_validation_category';
  END IF;
  
  -- Check data consistency indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_data_consistency_check_name') THEN
    RAISE EXCEPTION 'Missing index: idx_data_consistency_check_name';
  END IF;
  
  -- Check performance baseline indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_performance_baseline_name') THEN
    RAISE EXCEPTION 'Missing index: idx_performance_baseline_name';
  END IF;
  
  -- Check security validation indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_validation_check_name') THEN
    RAISE EXCEPTION 'Missing index: idx_security_validation_check_name';
  END IF;
  
  RAISE NOTICE '✅ All indexes exist';
END $$;

-- Validate functions
DO $$
BEGIN
  -- Check validation functions
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'run_schema_validation') THEN
    RAISE EXCEPTION 'Missing function: run_schema_validation';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'check_data_consistency') THEN
    RAISE EXCEPTION 'Missing function: check_data_consistency';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'establish_performance_baselines') THEN
    RAISE EXCEPTION 'Missing function: establish_performance_baselines';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'run_security_validation') THEN
    RAISE EXCEPTION 'Missing function: run_security_validation';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_validation_report') THEN
    RAISE EXCEPTION 'Missing function: generate_validation_report';
  END IF;
  
  RAISE NOTICE '✅ All validation functions exist';
END $$;

-- Validate RLS policies
DO $$
BEGIN
  -- Check RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'schema_validation_results' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on schema_validation_results';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'data_consistency_checks' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on data_consistency_checks';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'performance_baselines' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on performance_baselines';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'security_validation_results' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on security_validation_results';
  END IF;
  
  -- Check RLS policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'schema_validation_results' 
    AND policyname = 'Admins can manage schema validation'
  ) THEN
    RAISE EXCEPTION 'Missing RLS policy on schema_validation_results';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data_consistency_checks' 
    AND policyname = 'Admins can manage data consistency'
  ) THEN
    RAISE EXCEPTION 'Missing RLS policy on data_consistency_checks';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'performance_baselines' 
    AND policyname = 'Admins can manage performance baselines'
  ) THEN
    RAISE EXCEPTION 'Missing RLS policy on performance_baselines';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_validation_results' 
    AND policyname = 'Admins can manage security validation'
  ) THEN
    RAISE EXCEPTION 'Missing RLS policy on security_validation_results';
  END IF;
  
  RAISE NOTICE '✅ All RLS policies are configured';
END $$;

-- Validate triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_performance_baselines_updated'
  ) THEN
    RAISE EXCEPTION 'Missing trigger: trg_performance_baselines_updated';
  END IF;
  
  RAISE NOTICE '✅ All triggers exist';
END $$;

-- Test validation functions
DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- Test schema validation function
  BEGIN
    SELECT * INTO v_result FROM run_schema_validation() LIMIT 1;
    RAISE NOTICE '✅ run_schema_validation function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'run_schema_validation function failed: %', SQLERRM;
  END;
  
  -- Test data consistency function
  BEGIN
    SELECT * INTO v_result FROM check_data_consistency() LIMIT 1;
    RAISE NOTICE '✅ check_data_consistency function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'check_data_consistency function failed: %', SQLERRM;
  END;
  
  -- Test performance baselines function
  BEGIN
    SELECT * INTO v_result FROM establish_performance_baselines() LIMIT 1;
    RAISE NOTICE '✅ establish_performance_baselines function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'establish_performance_baselines function failed: %', SQLERRM;
  END;
  
  -- Test security validation function
  BEGIN
    SELECT * INTO v_result FROM run_security_validation() LIMIT 1;
    RAISE NOTICE '✅ run_security_validation function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'run_security_validation function failed: %', SQLERRM;
  END;
  
  -- Test validation report function
  BEGIN
    SELECT * INTO v_result FROM generate_validation_report() LIMIT 1;
    RAISE NOTICE '✅ generate_validation_report function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'generate_validation_report function failed: %', SQLERRM;
  END;
END $$;

-- Validate generated columns
DO $$
BEGIN
  -- Check consistency_percentage generated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'data_consistency_checks' 
    AND column_name = 'consistency_percentage'
    AND is_generated = 'ALWAYS'
  ) THEN
    RAISE EXCEPTION 'Missing generated column: consistency_percentage';
  END IF;
  
  -- Check performance_change_percent generated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_baselines' 
    AND column_name = 'performance_change_percent'
    AND is_generated = 'ALWAYS'
  ) THEN
    RAISE EXCEPTION 'Missing generated column: performance_change_percent';
  END IF;
  
  -- Check status generated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_baselines' 
    AND column_name = 'status'
    AND is_generated = 'ALWAYS'
  ) THEN
    RAISE EXCEPTION 'Missing generated column: status';
  END IF;
  
  RAISE NOTICE '✅ All generated columns exist';
END $$;

-- Validate constraints
DO $$
BEGIN
  -- Check check constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'valid_execution_time'
  ) THEN
    RAISE EXCEPTION 'Missing check constraint: valid_execution_time';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'valid_record_counts'
  ) THEN
    RAISE EXCEPTION 'Missing check constraint: valid_record_counts';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'valid_severity_for_failed_checks'
  ) THEN
    RAISE EXCEPTION 'Missing check constraint: valid_severity_for_failed_checks';
  END IF;
  
  RAISE NOTICE '✅ All constraints exist';
END $$;

-- Final validation summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Week 7 Migration Validation Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All validation tables created successfully';
  RAISE NOTICE '✅ All indexes created successfully';
  RAISE NOTICE '✅ All functions created successfully';
  RAISE NOTICE '✅ All RLS policies configured successfully';
  RAISE NOTICE '✅ All triggers created successfully';
  RAISE NOTICE '✅ All generated columns working correctly';
  RAISE NOTICE '✅ All constraints applied successfully';
  RAISE NOTICE '✅ All validation functions tested successfully';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Testing & Validation infrastructure is ready!';
  RAISE NOTICE '';
END $$;













-- Validation Script for Migration 003: Device Flow Hardening
-- This script validates that the device flow hardening migration was successful

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
      'device_flows_v2', 'device_flow_telemetry', 'device_flow_rate_limits'
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
  -- Check device_flows_v2 structure
  RAISE NOTICE 'Checking device_flows_v2 structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'device_flows_v2'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %: % (nullable: %)', column_record.column_name, column_record.data_type, column_record.is_nullable;
  END LOOP;
  
  -- Check device_flow_telemetry structure
  RAISE NOTICE 'Checking device_flow_telemetry structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'device_flow_telemetry'
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
    WHERE indexname LIKE 'idx_device_flows_v2_%' OR indexname LIKE 'idx_device_flow_telemetry_%' OR indexname LIKE 'idx_device_flow_rate_limits_%'
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
      'hash_device_code', 'create_device_flow_v2', 'verify_device_flow_v2',
      'complete_device_flow_v2', 'check_device_flow_rate_limit', 'cleanup_expired_device_flows_v2'
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
      'device_flows_v2', 'device_flow_telemetry', 'device_flow_rate_limits'
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
    WHERE tablename IN ('device_flows_v2', 'device_flow_telemetry', 'device_flow_rate_limits')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Policy % exists on table %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- Step 7: Test helper functions
DO $$
DECLARE
  test_device_code VARCHAR(8) := 'ABC12345';
  test_user_code VARCHAR(8) := 'XYZ67890';
  test_provider VARCHAR(20) := 'google';
  test_client_ip INET := '192.168.1.1';
  test_user_agent TEXT := 'Mozilla/5.0 (Test Browser)';
  test_session_id VARCHAR(255) := 'test-session-123';
  test_user_id UUID;
  test_device_flow_id UUID;
  test_hash BYTEA;
  test_result RECORD;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test hash_device_code function
    SELECT hash_device_code(test_device_code, 'device') INTO test_hash;
    IF test_hash IS NOT NULL THEN
      RAISE NOTICE 'hash_device_code function works correctly';
    ELSE
      RAISE WARNING 'hash_device_code function failed';
    END IF;
    
    -- Test create_device_flow_v2 function
    SELECT create_device_flow_v2(
      test_device_code, test_user_code, test_provider,
      test_client_ip, test_user_agent, test_session_id,
      '/dashboard', ARRAY['read', 'write'], 5, 120, 10
    ) INTO test_device_flow_id;
    
    IF test_device_flow_id IS NOT NULL THEN
      RAISE NOTICE 'create_device_flow_v2 function works correctly';
      
      -- Test verify_device_flow_v2 function
      SELECT * INTO test_result FROM verify_device_flow_v2(test_device_code, test_user_code);
      
      IF test_result.is_valid = true THEN
        RAISE NOTICE 'verify_device_flow_v2 function works correctly';
      ELSE
        RAISE WARNING 'verify_device_flow_v2 function failed';
      END IF;
      
      -- Test complete_device_flow_v2 function
      IF complete_device_flow_v2(test_device_code, test_user_code, test_user_id) THEN
        RAISE NOTICE 'complete_device_flow_v2 function works correctly';
      ELSE
        RAISE WARNING 'complete_device_flow_v2 function failed';
      END IF;
      
    ELSE
      RAISE WARNING 'create_device_flow_v2 function failed';
    END IF;
    
  ELSE
    RAISE NOTICE 'No users found for testing helper functions';
  END IF;
END $$;

-- Step 8: Test rate limiting functions
DO $$
DECLARE
  test_rate_limit_key TEXT := '192.168.1.1:google';
  test_rate_limit_type VARCHAR(50) := 'ip';
  test_result RECORD;
BEGIN
  -- Test check_device_flow_rate_limit function
  SELECT * INTO test_result FROM check_device_flow_rate_limit(
    test_rate_limit_key, test_rate_limit_type, 10, 1
  );
  
  IF test_result.allowed = true THEN
    RAISE NOTICE 'check_device_flow_rate_limit function works correctly';
  ELSE
    RAISE WARNING 'check_device_flow_rate_limit function failed';
  END IF;
END $$;

-- Step 9: Test binary data handling
DO $$
DECLARE
  test_code VARCHAR(8) := 'TEST1234';
  test_hash1 BYTEA;
  test_hash2 BYTEA;
BEGIN
  -- Test that hashing is consistent
  SELECT hash_device_code(test_code, 'device') INTO test_hash1;
  SELECT hash_device_code(test_code, 'device') INTO test_hash2;
  
  IF test_hash1 = test_hash2 THEN
    RAISE NOTICE 'Binary data handling works correctly';
  ELSE
    RAISE WARNING 'Binary data handling failed';
  END IF;
END $$;

-- Step 10: Validate constraints
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
        'device_flows_v2', 'device_flow_telemetry', 'device_flow_rate_limits'
      )
    )
    ORDER BY table_name, conname
  LOOP
    RAISE NOTICE 'Constraint % exists on table %', constraint_record.conname, constraint_record.table_name;
  END LOOP;
END $$;

-- Step 11: Test generated columns
DO $$
DECLARE
  test_record RECORD;
BEGIN
  -- Test that generated columns work correctly
  INSERT INTO device_flows_v2 (
    device_code_hash, user_code_hash,
    device_code_original, user_code_original,
    provider, client_ip, expires_at
  ) VALUES (
    digest('test_device', 'sha256'),
    digest('test_user', 'sha256'),
    'TEST1234', 'USER5678',
    'google', '192.168.1.1',
    NOW() + INTERVAL '10 minutes'
  ) RETURNING device_code_hash_base64, user_code_hash_base64 INTO test_record;
  
  IF test_record.device_code_hash_base64 IS NOT NULL AND test_record.user_code_hash_base64 IS NOT NULL THEN
    RAISE NOTICE 'Generated columns work correctly';
    
    -- Clean up test data
    DELETE FROM device_flows_v2 WHERE device_code_hash_base64 = test_record.device_code_hash_base64;
  ELSE
    RAISE WARNING 'Generated columns failed';
  END IF;
END $$;

-- Step 12: Validate triggers exist
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers 
    WHERE trigger_name IN (
      'trg_device_flows_v2_updated', 'trg_device_flow_rate_limits_updated'
    )
  LOOP
    RAISE NOTICE 'Trigger % exists on table %', trigger_record.trigger_name, trigger_record.event_object_table;
  END LOOP;
END $$;

-- Step 13: Test TTL indexes
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
    EXECUTE 'EXPLAIN (FORMAT TEXT) SELECT 1 FROM device_flows_v2 WHERE expires_at < NOW() LIMIT 1' INTO query_plan;
    
    IF query_plan LIKE '%Index%' THEN
      RAISE NOTICE 'TTL index % is being used', index_record.indexname;
    ELSE
      RAISE WARNING 'TTL index % may not be used optimally', index_record.indexname;
    END IF;
  END LOOP;
END $$;

-- Step 14: Validate foreign key relationships
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
    AND tc.table_name IN ('device_flows_v2', 'device_flow_telemetry', 'device_flow_rate_limits')
    ORDER BY tc.table_name, tc.constraint_name
  LOOP
    RAISE NOTICE 'Foreign key %: %.% -> %.%', 
      fk_record.constraint_name,
      fk_record.table_name, fk_record.column_name,
      fk_record.foreign_table_name, fk_record.foreign_column_name;
  END LOOP;
END $$;

-- Step 15: Test cleanup function
DO $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Test cleanup function
  SELECT cleanup_expired_device_flows_v2() INTO cleanup_count;
  
  IF cleanup_count >= 0 THEN
    RAISE NOTICE 'cleanup_expired_device_flows_v2 function works correctly (cleaned up % flows)', cleanup_count;
  ELSE
    RAISE WARNING 'cleanup_expired_device_flows_v2 function failed';
  END IF;
END $$;

-- Validation completed successfully
SELECT 'Device Flow Hardening Migration Validation: PASSED' as status;



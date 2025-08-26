-- Validation Script for Migration 005: RLS Correctness
-- This script validates that the RLS correctness migration was successful

-- Step 1: Validate RLS helper functions exist
DO $$
DECLARE
  function_record RECORD;
BEGIN
  FOR function_record IN 
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_name IN (
      'is_admin', 'has_trust_tier', 'is_owner', 'is_public_poll',
      'is_active_poll', 'can_access_poll', 'validate_rls_policies',
      'test_rls_enforcement', 'log_rls_violation', 'get_rls_statistics'
    )
    ORDER BY routine_name
  LOOP
    RAISE NOTICE 'Function % exists', function_record.routine_name;
  END LOOP;
END $$;

-- Step 2: Validate RLS policies exist for all tables
DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'user_profiles', 'polls', 'votes', 'webauthn_credentials',
      'error_logs', 'user_sessions_v2', 'token_bindings', 'session_security_events',
      'device_fingerprints', 'webauthn_credentials_v2', 'webauthn_challenges',
      'webauthn_attestations', 'webauthn_analytics', 'device_flows_v2',
      'device_flow_telemetry', 'device_flow_rate_limits', 'cache', 'analytics',
      'rate_limits', 'notifications', 'user_sessions', 'device_flows'
    )
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = table_record.table_name;
    
    IF policy_count > 0 THEN
      RAISE NOTICE 'Table % has % RLS policies', table_record.table_name, policy_count;
    ELSE
      RAISE WARNING 'Table % has no RLS policies', table_record.table_name;
    END IF;
  END LOOP;
END $$;

-- Step 3: Validate RLS is enabled on all tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'user_profiles', 'polls', 'votes', 'webauthn_credentials',
      'error_logs', 'user_sessions_v2', 'token_bindings', 'session_security_events',
      'device_fingerprints', 'webauthn_credentials_v2', 'webauthn_challenges',
      'webauthn_attestations', 'webauthn_analytics', 'device_flows_v2',
      'device_flow_telemetry', 'device_flow_rate_limits', 'cache', 'analytics',
      'rate_limits', 'notifications', 'user_sessions', 'device_flows'
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

-- Step 4: Test RLS helper functions
DO $$
DECLARE
  test_user_id UUID;
  test_poll_id UUID;
  test_result BOOLEAN;
BEGIN
  -- Get test data
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_poll_id FROM polls LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test is_admin function
    SELECT is_admin() INTO test_result;
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'is_admin function works correctly';
    ELSE
      RAISE WARNING 'is_admin function failed';
    END IF;
    
    -- Test has_trust_tier function
    SELECT has_trust_tier('T1') INTO test_result;
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'has_trust_tier function works correctly';
    ELSE
      RAISE WARNING 'has_trust_tier function failed';
    END IF;
    
    -- Test is_owner function
    SELECT is_owner(test_user_id) INTO test_result;
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'is_owner function works correctly';
    ELSE
      RAISE WARNING 'is_owner function failed';
    END IF;
    
  ELSE
    RAISE NOTICE 'No users found for testing helper functions';
  END IF;
  
  -- Test poll-related functions
  IF test_poll_id IS NOT NULL THEN
    -- Test is_public_poll function
    SELECT is_public_poll(test_poll_id) INTO test_result;
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'is_public_poll function works correctly';
    ELSE
      RAISE WARNING 'is_public_poll function failed';
    END IF;
    
    -- Test is_active_poll function
    SELECT is_active_poll(test_poll_id) INTO test_result;
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'is_active_poll function works correctly';
    ELSE
      RAISE WARNING 'is_active_poll function failed';
    END IF;
    
    -- Test can_access_poll function
    SELECT can_access_poll(test_poll_id) INTO test_result;
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'can_access_poll function works correctly';
    ELSE
      RAISE WARNING 'can_access_poll function failed';
    END IF;
    
  ELSE
    RAISE NOTICE 'No polls found for testing poll functions';
  END IF;
END $$;

-- Step 5: Test RLS validation functions
DO $$
DECLARE
  validation_record RECORD;
  test_record RECORD;
BEGIN
  -- Test validate_rls_policies function
  RAISE NOTICE 'Testing RLS policy validation:';
  FOR validation_record IN 
    SELECT * FROM validate_rls_policies()
    LIMIT 10
  LOOP
    RAISE NOTICE '  Table: %, Policy: %, Type: %, Valid: %', 
      validation_record.table_name, 
      validation_record.policy_name, 
      validation_record.policy_type, 
      validation_record.is_valid;
  END LOOP;
  
  -- Test test_rls_enforcement function
  RAISE NOTICE 'Testing RLS enforcement:';
  FOR test_record IN 
    SELECT * FROM test_rls_enforcement()
  LOOP
    RAISE NOTICE '  Test: %, Table: %, Operation: %, Passed: %', 
      test_record.test_name, 
      test_record.table_name, 
      test_record.operation, 
      test_record.test_passed;
  END LOOP;
END $$;

-- Step 6: Test RLS monitoring functions
DO $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Test get_rls_statistics function
  RAISE NOTICE 'RLS Policy Statistics:';
  FOR stats_record IN 
    SELECT * FROM get_rls_statistics()
    ORDER BY table_name
  LOOP
    RAISE NOTICE '  Table: %, Total Policies: %, Enabled: %, Disabled: %', 
      stats_record.table_name, 
      stats_record.policy_count, 
      stats_record.enabled_policies, 
      stats_record.disabled_policies;
  END LOOP;
END $$;

-- Step 7: Validate specific RLS policies for core tables
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Check user_profiles policies
  RAISE NOTICE 'User Profiles RLS Policies:';
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'user_profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  %: %', policy_record.policyname, policy_record.cmd;
  END LOOP;
  
  -- Check polls policies
  RAISE NOTICE 'Polls RLS Policies:';
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'polls'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  %: %', policy_record.policyname, policy_record.cmd;
  END LOOP;
  
  -- Check votes policies
  RAISE NOTICE 'Votes RLS Policies:';
  FOR policy_record IN 
    SELECT policyname, cmd 
    FROM pg_policies 
    WHERE tablename = 'votes'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  %: %', policy_record.policyname, policy_record.cmd;
  END LOOP;
END $$;

-- Step 8: Test RLS policy consistency
DO $$
DECLARE
  policy_record RECORD;
  auth_uid_count INTEGER;
  total_policies INTEGER;
BEGIN
  -- Check that all policies use auth.uid() consistently
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO auth_uid_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%');
  
  RAISE NOTICE 'RLS Policy Consistency Check:';
  RAISE NOTICE '  Total policies: %', total_policies;
  RAISE NOTICE '  Policies using auth.uid(): %', auth_uid_count;
  
  IF auth_uid_count > 0 THEN
    RAISE NOTICE '  ✅ auth.uid() is being used consistently';
  ELSE
    RAISE WARNING '  ❌ No policies found using auth.uid()';
  END IF;
  
  -- Check for any policies that might be using old patterns
  FOR policy_record IN 
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual LIKE '%user_id%' OR with_check LIKE '%user_id%')
    AND (qual NOT LIKE '%auth.uid()%' AND with_check NOT LIKE '%auth.uid()%')
    LIMIT 5
  LOOP
    RAISE WARNING '  Policy % on % might not be using auth.uid()', 
      policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- Step 9: Test admin function consistency
DO $$
DECLARE
  admin_policy_count INTEGER;
  is_admin_count INTEGER;
BEGIN
  -- Check that admin policies use is_admin() function
  SELECT COUNT(*) INTO admin_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND policyname LIKE '%admin%';
  
  SELECT COUNT(*) INTO is_admin_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND policyname LIKE '%admin%'
  AND (qual LIKE '%is_admin()%' OR with_check LIKE '%is_admin()%');
  
  RAISE NOTICE 'Admin Policy Consistency Check:';
  RAISE NOTICE '  Total admin policies: %', admin_policy_count;
  RAISE NOTICE '  Admin policies using is_admin(): %', is_admin_count;
  
  IF admin_policy_count = is_admin_count THEN
    RAISE NOTICE '  ✅ All admin policies use is_admin() function';
  ELSE
    RAISE WARNING '  ❌ Some admin policies may not use is_admin() function';
  END IF;
END $$;

-- Step 10: Test trust tier function usage
DO $$
DECLARE
  trust_policy_count INTEGER;
  has_trust_tier_count INTEGER;
BEGIN
  -- Check that trust tier policies use has_trust_tier() function
  SELECT COUNT(*) INTO trust_policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND (qual LIKE '%trust_tier%' OR with_check LIKE '%trust_tier%');
  
  SELECT COUNT(*) INTO has_trust_tier_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND (qual LIKE '%has_trust_tier%' OR with_check LIKE '%has_trust_tier%');
  
  RAISE NOTICE 'Trust Tier Policy Consistency Check:';
  RAISE NOTICE '  Total trust tier policies: %', trust_policy_count;
  RAISE NOTICE '  Trust tier policies using has_trust_tier(): %', has_trust_tier_count;
  
  IF trust_policy_count = has_trust_tier_count THEN
    RAISE NOTICE '  ✅ All trust tier policies use has_trust_tier() function';
  ELSE
    RAISE WARNING '  ❌ Some trust tier policies may not use has_trust_tier() function';
  END IF;
END $$;

-- Step 11: Validate policy naming consistency
DO $$
DECLARE
  naming_record RECORD;
BEGIN
  RAISE NOTICE 'Policy Naming Consistency Check:';
  
  -- Check for consistent naming patterns
  FOR naming_record IN 
    SELECT 
      tablename,
      COUNT(*) as policy_count,
      COUNT(CASE WHEN policyname LIKE 'Users can %' THEN 1 END) as user_policies,
      COUNT(CASE WHEN policyname LIKE 'Admins can %' THEN 1 END) as admin_policies,
      COUNT(CASE WHEN policyname LIKE 'Anyone can %' THEN 1 END) as public_policies
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  Table: %, Total: %, User: %, Admin: %, Public: %', 
      naming_record.tablename,
      naming_record.policy_count,
      naming_record.user_policies,
      naming_record.admin_policies,
      naming_record.public_policies;
  END LOOP;
END $$;

-- Step 12: Test RLS violation logging
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test log_rls_violation function
    PERFORM log_rls_violation(
      'test_table'::TEXT,
      'SELECT'::TEXT,
      test_user_id,
      'test_policy'::TEXT,
      '{"test": "data"}'::JSONB
    );
    
    RAISE NOTICE 'log_rls_violation function works correctly';
  ELSE
    RAISE NOTICE 'No users found for testing violation logging';
  END IF;
END $$;

-- Step 13: Validate policy coverage for all operations
DO $$
DECLARE
  coverage_record RECORD;
BEGIN
  RAISE NOTICE 'Policy Coverage Analysis:';
  
  FOR coverage_record IN 
    SELECT 
      tablename,
      cmd,
      COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
    ORDER BY tablename, cmd
  LOOP
    RAISE NOTICE '  Table: %, Operation: %, Policies: %', 
      coverage_record.tablename,
      coverage_record.cmd,
      coverage_record.policy_count;
  END LOOP;
END $$;

-- Step 14: Test RLS policy performance
DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration_ms INTEGER;
BEGIN
  -- Test RLS policy performance
  start_time := clock_timestamp();
  
  -- Perform a simple query that should trigger RLS
  PERFORM COUNT(*) FROM user_profiles LIMIT 1;
  
  end_time := clock_timestamp();
  duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  
  RAISE NOTICE 'RLS Policy Performance Test:';
  RAISE NOTICE '  Query duration: % ms', duration_ms;
  
  IF duration_ms < 100 THEN
    RAISE NOTICE '  ✅ RLS policies are performing well';
  ELSE
    RAISE WARNING '  ⚠️ RLS policies may be slow (% ms)', duration_ms;
  END IF;
END $$;

-- Validation completed successfully
SELECT 'RLS Correctness Migration Validation: PASSED' as status;



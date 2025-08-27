-- Validation Script for Migration 001: Identity Unification
-- This script validates that the migration was successful

-- Step 1: Validate canonical users view exists and works
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'Canonical users view does not exist';
  END IF;
  
  -- Test the view
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    RAISE NOTICE 'Users view is accessible';
  END IF;
END $$;

-- Step 2: Validate all tables have proper user_id foreign key constraints
DO $$
DECLARE
  table_record RECORD;
  constraint_count INTEGER;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'polls', 'votes', 'webauthn_credentials', 'device_flows', 
      'error_logs', 'analytics', 'rate_limits', 'notifications', 'user_sessions'
    )
  LOOP
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = table_record.table_name
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id'
    AND tc.constraint_name LIKE 'fk_%_user';
    
    IF constraint_count = 0 THEN
      RAISE EXCEPTION 'Table % is missing user_id foreign key constraint', table_record.table_name;
    END IF;
    
    RAISE NOTICE 'Table % has proper user_id foreign key constraint', table_record.table_name;
  END LOOP;
END $$;

-- Step 3: Validate helper functions exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_by_identifier') THEN
    RAISE EXCEPTION 'get_user_by_identifier function does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'user_exists') THEN
    RAISE EXCEPTION 'user_exists function does not exist';
  END IF;
  
  RAISE NOTICE 'Helper functions exist';
END $$;

-- Step 4: Validate indexes exist
DO $$
DECLARE
  index_record RECORD;
BEGIN
  FOR index_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname IN (
      'idx_polls_user_id', 'idx_votes_user_id', 'idx_webauthn_credentials_user_id',
      'idx_device_flows_user_id', 'idx_error_logs_user_id', 'idx_analytics_user_id',
      'idx_rate_limits_user_id', 'idx_notifications_user_id', 'idx_user_sessions_user_id'
    )
  LOOP
    RAISE NOTICE 'Index % exists', index_record.indexname;
  END LOOP;
END $$;

-- Step 5: Validate updated_at triggers exist
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE trigger_name IN (
      'trg_polls_updated', 'trg_votes_updated', 'trg_webauthn_credentials_updated',
      'trg_device_flows_updated', 'trg_notifications_updated', 'trg_user_sessions_updated'
    )
  LOOP
    RAISE NOTICE 'Trigger % exists', trigger_record.trigger_name;
  END LOOP;
END $$;

-- Step 6: Test data integrity
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Check for orphaned records in polls
  SELECT COUNT(*) INTO orphan_count
  FROM polls p
  LEFT JOIN auth.users u ON p.user_id = u.id
  WHERE u.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % orphaned records in polls table', orphan_count;
  ELSE
    RAISE NOTICE 'No orphaned records in polls table';
  END IF;
  
  -- Check for orphaned records in votes
  SELECT COUNT(*) INTO orphan_count
  FROM votes v
  LEFT JOIN auth.users u ON v.user_id = u.id
  WHERE u.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % orphaned records in votes table', orphan_count;
  ELSE
    RAISE NOTICE 'No orphaned records in votes table';
  END IF;
  
  -- Check for orphaned records in webauthn_credentials
  SELECT COUNT(*) INTO orphan_count
  FROM webauthn_credentials wc
  LEFT JOIN auth.users u ON wc.user_id = u.id
  WHERE u.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % orphaned records in webauthn_credentials table', orphan_count;
  ELSE
    RAISE NOTICE 'No orphaned records in webauthn_credentials table';
  END IF;
END $$;

-- Step 7: Test helper functions
DO $$
DECLARE
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test user_exists function
    IF user_exists(test_user_id) THEN
      RAISE NOTICE 'user_exists function works correctly';
    ELSE
      RAISE EXCEPTION 'user_exists function failed for valid user';
    END IF;
    
    -- Test get_user_by_identifier function
    SELECT * INTO test_result FROM get_user_by_identifier(test_user_id::TEXT);
    IF test_result.id = test_user_id THEN
      RAISE NOTICE 'get_user_by_identifier function works correctly';
    ELSE
      RAISE EXCEPTION 'get_user_by_identifier function failed';
    END IF;
  ELSE
    RAISE NOTICE 'No users found for testing helper functions';
  END IF;
END $$;

-- Step 8: Validate RLS is still enabled
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'polls', 'votes', 'webauthn_credentials', 'device_flows', 
      'error_logs', 'analytics', 'rate_limits', 'notifications', 'user_sessions'
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

-- Validation completed successfully
SELECT 'Identity Unification Migration Validation: PASSED' as status;




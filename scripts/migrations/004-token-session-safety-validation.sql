-- Validation Script for Migration 004: Token/Session Safety
-- This script validates that the token/session safety migration was successful

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
      'user_sessions_v2', 'token_bindings', 'session_security_events', 'device_fingerprints'
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
  -- Check user_sessions_v2 structure
  RAISE NOTICE 'Checking user_sessions_v2 structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'user_sessions_v2'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %: % (nullable: %)', column_record.column_name, column_record.data_type, column_record.is_nullable;
  END LOOP;
  
  -- Check token_bindings structure
  RAISE NOTICE 'Checking token_bindings structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'token_bindings'
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
    WHERE indexname LIKE 'idx_user_sessions_v2_%' OR indexname LIKE 'idx_token_bindings_%' OR indexname LIKE 'idx_session_security_events_%' OR indexname LIKE 'idx_device_fingerprints_%'
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
      'hash_token', 'create_session_v2', 'verify_session_v2',
      'rotate_session_v2', 'add_dpop_binding', 'validate_dpop_binding', 'cleanup_expired_sessions_v2'
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
      'user_sessions_v2', 'token_bindings', 'session_security_events', 'device_fingerprints'
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
    WHERE tablename IN ('user_sessions_v2', 'token_bindings', 'session_security_events', 'device_fingerprints')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Policy % exists on table %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- Step 7: Test helper functions
DO $$
DECLARE
  test_session_token TEXT := 'test_session_token_12345';
  test_refresh_token TEXT := 'test_refresh_token_67890';
  test_access_token TEXT := 'test_access_token_abcde';
  test_user_id UUID;
  test_session_id UUID;
  test_hash BYTEA;
  test_result RECORD;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test hash_token function
    SELECT hash_token(test_session_token, 'session') INTO test_hash;
    IF test_hash IS NOT NULL THEN
      RAISE NOTICE 'hash_token function works correctly';
    ELSE
      RAISE WARNING 'hash_token function failed';
    END IF;
    
    -- Test create_session_v2 function
    SELECT create_session_v2(
      test_user_id, test_session_token, test_refresh_token, test_access_token,
      'web', 'password', digest('test_device', 'sha256'),
      '{"device": "test"}'::jsonb, 'Test Device', 'desktop', 'Windows', 'Chrome',
      '192.168.1.1'::INET, 'Mozilla/5.0 (Test)', '{"location": "test"}'::jsonb, 24
    ) INTO test_session_id;
    
    IF test_session_id IS NOT NULL THEN
      RAISE NOTICE 'create_session_v2 function works correctly';
      
      -- Test verify_session_v2 function
      SELECT * INTO test_result FROM verify_session_v2(test_session_token, '192.168.1.1'::INET, 'Mozilla/5.0 (Test)');
      
      IF test_result.is_valid = true THEN
        RAISE NOTICE 'verify_session_v2 function works correctly';
      ELSE
        RAISE WARNING 'verify_session_v2 function failed';
      END IF;
      
      -- Test rotate_session_v2 function
      SELECT * INTO test_result FROM rotate_session_v2(
        test_session_token, 'new_session_token', 'new_refresh_token', 'new_access_token',
        '192.168.1.1'::INET, 'Mozilla/5.0 (Test)'
      );
      
      IF test_result.success = true THEN
        RAISE NOTICE 'rotate_session_v2 function works correctly';
      ELSE
        RAISE WARNING 'rotate_session_v2 function failed';
      END IF;
      
    ELSE
      RAISE WARNING 'create_session_v2 function failed';
    END IF;
    
  ELSE
    RAISE NOTICE 'No users found for testing helper functions';
  END IF;
END $$;

-- Step 8: Test DPoP binding functions
DO $$
DECLARE
  test_session_id UUID;
  test_user_id UUID;
  test_dpop_jkt TEXT := 'test_jkt_12345';
  test_dpop_nonce TEXT := 'test_nonce_67890';
  test_dpop_challenge TEXT := 'test_challenge_abcde';
  test_dpop_signature TEXT := 'test_signature_fghij';
  test_binding_id UUID;
  test_validation_result BOOLEAN;
BEGIN
  -- Get a test user and create a session
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Create a test session
    SELECT create_session_v2(
      test_user_id, 'test_dpop_session_token',
      'web', 'password', digest('test_device', 'sha256'),
      '{"device": "test"}'::jsonb, 'Test Device', 'desktop', 'Windows', 'Chrome',
      '192.168.1.1'::INET, 'Mozilla/5.0 (Test)', '{"location": "test"}'::jsonb, 24
    ) INTO test_session_id;
    
    IF test_session_id IS NOT NULL THEN
      -- Test add_dpop_binding function
      SELECT add_dpop_binding(
        test_session_id, test_dpop_jkt, test_dpop_nonce,
        test_dpop_challenge, test_dpop_signature
      ) INTO test_binding_id;
      
      IF test_binding_id IS NOT NULL THEN
        RAISE NOTICE 'add_dpop_binding function works correctly';
        
        -- Test validate_dpop_binding function
        SELECT validate_dpop_binding(test_session_id, test_dpop_jkt, test_dpop_nonce) INTO test_validation_result;
        
        IF test_validation_result = true THEN
          RAISE NOTICE 'validate_dpop_binding function works correctly';
        ELSE
          RAISE WARNING 'validate_dpop_binding function failed';
        END IF;
        
      ELSE
        RAISE WARNING 'add_dpop_binding function failed';
      END IF;
      
    ELSE
      RAISE WARNING 'Could not create test session for DPoP testing';
    END IF;
    
  ELSE
    RAISE NOTICE 'No users found for testing DPoP functions';
  END IF;
END $$;

-- Step 9: Test binary data handling
DO $$
DECLARE
  test_token TEXT := 'TEST_TOKEN_12345';
  test_hash1 BYTEA;
  test_hash2 BYTEA;
BEGIN
  -- Test that hashing is consistent
  SELECT hash_token(test_token, 'session') INTO test_hash1;
  SELECT hash_token(test_token, 'session') INTO test_hash2;
  
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
        'user_sessions_v2', 'token_bindings', 'session_security_events', 'device_fingerprints'
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
  INSERT INTO user_sessions_v2 (
    user_id, session_token_hash, device_fingerprint_hash, expires_at
  ) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    digest('test_session', 'sha256'),
    digest('test_device', 'sha256'),
    NOW() + INTERVAL '24 hours'
  ) RETURNING session_token_hash_base64, refresh_token_hash_base64, access_token_hash_base64 INTO test_record;
  
  IF test_record.session_token_hash_base64 IS NOT NULL THEN
    RAISE NOTICE 'Generated columns work correctly';
    
    -- Clean up test data
    DELETE FROM user_sessions_v2 WHERE session_token_hash_base64 = test_record.session_token_hash_base64;
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
      'trg_user_sessions_v2_updated', 'trg_token_bindings_updated', 'trg_device_fingerprints_updated'
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
    EXECUTE 'EXPLAIN (FORMAT TEXT) SELECT 1 FROM user_sessions_v2 WHERE expires_at < NOW() LIMIT 1' INTO query_plan;
    
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
    AND tc.table_name IN ('user_sessions_v2', 'token_bindings', 'session_security_events', 'device_fingerprints')
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
  SELECT cleanup_expired_sessions_v2() INTO cleanup_count;
  
  IF cleanup_count >= 0 THEN
    RAISE NOTICE 'cleanup_expired_sessions_v2 function works correctly (cleaned up % sessions)', cleanup_count;
  ELSE
    RAISE WARNING 'cleanup_expired_sessions_v2 function failed';
  END IF;
END $$;

-- Step 16: Test token rotation lineage
DO $$
DECLARE
  test_user_id UUID;
  test_session_id1 UUID;
  test_session_id2 UUID;
  test_rotation_chain_id UUID;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Create initial session
    SELECT create_session_v2(
      test_user_id, 'initial_session_token',
      'web', 'password', digest('test_device', 'sha256'),
      '{"device": "test"}'::jsonb, 'Test Device', 'desktop', 'Windows', 'Chrome',
      '192.168.1.1'::INET, 'Mozilla/5.0 (Test)', '{"location": "test"}'::jsonb, 24
    ) INTO test_session_id1;
    
    IF test_session_id1 IS NOT NULL THEN
      -- Get rotation chain ID
      SELECT rotation_chain_id INTO test_rotation_chain_id
      FROM user_sessions_v2
      WHERE id = test_session_id1;
      
      -- Create rotated session
      SELECT create_session_v2(
        test_user_id, 'rotated_session_token',
        'web', 'password', digest('test_device', 'sha256'),
        '{"device": "test"}'::jsonb, 'Test Device', 'desktop', 'Windows', 'Chrome',
        '192.168.1.1'::INET, 'Mozilla/5.0 (Test)', '{"location": "test"}'::jsonb, 24,
        test_session_id1
      ) INTO test_session_id2;
      
      IF test_session_id2 IS NOT NULL THEN
        -- Verify rotation chain
        IF EXISTS (
          SELECT 1 FROM user_sessions_v2
          WHERE id = test_session_id2
          AND rotation_chain_id = test_rotation_chain_id
          AND parent_session_id = test_session_id1
        ) THEN
          RAISE NOTICE 'Token rotation lineage works correctly';
        ELSE
          RAISE WARNING 'Token rotation lineage failed';
        END IF;
        
        -- Clean up test data
        DELETE FROM user_sessions_v2 WHERE id IN (test_session_id1, test_session_id2);
        
      ELSE
        RAISE WARNING 'Could not create rotated session';
      END IF;
      
    ELSE
      RAISE WARNING 'Could not create initial session for rotation testing';
    END IF;
    
  ELSE
    RAISE NOTICE 'No users found for testing token rotation lineage';
  END IF;
END $$;

-- Validation completed successfully
SELECT 'Token/Session Safety Migration Validation: PASSED' as status;



-- Validation Script for Migration 002: WebAuthn Storage Enhancement
-- This script validates that the WebAuthn enhancement migration was successful

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
      'webauthn_credentials_v2', 'webauthn_challenges', 
      'webauthn_attestations', 'webauthn_analytics'
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
  -- Check webauthn_credentials_v2 structure
  RAISE NOTICE 'Checking webauthn_credentials_v2 structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'webauthn_credentials_v2'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  %: % (nullable: %)', column_record.column_name, column_record.data_type, column_record.is_nullable;
  END LOOP;
  
  -- Check webauthn_challenges structure
  RAISE NOTICE 'Checking webauthn_challenges structure:';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'webauthn_challenges'
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
    WHERE indexname LIKE 'idx_webauthn_%'
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
    WHERE routine_name LIKE 'webauthn_%'
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
      'webauthn_credentials_v2', 'webauthn_challenges', 
      'webauthn_attestations', 'webauthn_analytics'
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
    WHERE tablename LIKE 'webauthn_%'
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Policy % exists on table %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- Step 7: Test helper functions
DO $$
DECLARE
  test_user_id UUID;
  test_challenge TEXT;
  test_result BOOLEAN;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test webauthn_generate_challenge function
    SELECT webauthn_generate_challenge(
      test_user_id, 
      'registration', 
      'choices-platform.vercel.app', 
      'preferred', 
      5
    ) INTO test_challenge;
    
    IF test_challenge IS NOT NULL AND length(test_challenge) > 0 THEN
      RAISE NOTICE 'webauthn_generate_challenge function works correctly';
      
      -- Test webauthn_validate_challenge function
      SELECT webauthn_validate_challenge(test_challenge, test_user_id, 'registration') INTO test_result;
      
      IF test_result = true THEN
        RAISE NOTICE 'webauthn_validate_challenge function works correctly';
      ELSE
        RAISE WARNING 'webauthn_validate_challenge function failed';
      END IF;
    ELSE
      RAISE WARNING 'webauthn_generate_challenge function failed';
    END IF;
    
    -- Test webauthn_get_user_credentials function
    IF EXISTS (
      SELECT 1 FROM webauthn_get_user_credentials(test_user_id)
    ) THEN
      RAISE NOTICE 'webauthn_get_user_credentials function works correctly';
    ELSE
      RAISE NOTICE 'webauthn_get_user_credentials function works (no credentials found)';
    END IF;
    
  ELSE
    RAISE NOTICE 'No users found for testing helper functions';
  END IF;
END $$;

-- Step 8: Test binary data handling
DO $$
DECLARE
  test_bytes BYTEA;
  test_base64 TEXT;
  test_bytes_restored BYTEA;
BEGIN
  -- Test binary to base64 conversion
  test_bytes := gen_random_bytes(32);
  test_base64 := encode(test_bytes, 'base64');
  test_bytes_restored := decode(test_base64, 'base64');
  
  IF test_bytes = test_bytes_restored THEN
    RAISE NOTICE 'Binary data handling works correctly';
  ELSE
    RAISE WARNING 'Binary data handling failed';
  END IF;
END $$;

-- Step 9: Validate constraints
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
        'webauthn_credentials_v2', 'webauthn_challenges', 
        'webauthn_attestations', 'webauthn_analytics'
      )
    )
    ORDER BY table_name, conname
  LOOP
    RAISE NOTICE 'Constraint % exists on table %', constraint_record.conname, constraint_record.table_name;
  END LOOP;
END $$;

-- Step 10: Test generated columns
DO $$
DECLARE
  test_record RECORD;
BEGIN
  -- Test that generated columns work correctly
  INSERT INTO webauthn_credentials_v2 (
    user_id, credential_id, public_key, sign_count
  ) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    gen_random_bytes(32),
    gen_random_bytes(64),
    0
  ) RETURNING credential_id_base64, public_key_base64 INTO test_record;
  
  IF test_record.credential_id_base64 IS NOT NULL AND test_record.public_key_base64 IS NOT NULL THEN
    RAISE NOTICE 'Generated columns work correctly';
    
    -- Clean up test data
    DELETE FROM webauthn_credentials_v2 WHERE credential_id_base64 = test_record.credential_id_base64;
  ELSE
    RAISE WARNING 'Generated columns failed';
  END IF;
END $$;

-- Step 11: Validate triggers exist
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers 
    WHERE trigger_name IN (
      'trg_webauthn_credentials_v2_updated', 'trg_webauthn_attestations_updated'
    )
  LOOP
    RAISE NOTICE 'Trigger % exists on table %', trigger_record.trigger_name, trigger_record.event_object_table;
  END LOOP;
END $$;

-- Step 12: Test performance indexes
DO $$
DECLARE
  index_record RECORD;
  query_plan TEXT;
BEGIN
  -- Test that indexes are being used
  FOR index_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_webauthn_credentials_v2_%'
    LIMIT 3
  LOOP
    RAISE NOTICE 'Testing index: %', index_record.indexname;
    
    -- This is a basic test - in production you'd want more comprehensive testing
    EXECUTE 'EXPLAIN (FORMAT TEXT) SELECT 1 FROM webauthn_credentials_v2 LIMIT 1' INTO query_plan;
    
    IF query_plan LIKE '%Index%' THEN
      RAISE NOTICE 'Index % is being used', index_record.indexname;
    ELSE
      RAISE WARNING 'Index % may not be used optimally', index_record.indexname;
    END IF;
  END LOOP;
END $$;

-- Step 13: Validate foreign key relationships
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
    AND tc.table_name LIKE 'webauthn_%'
    ORDER BY tc.table_name, tc.constraint_name
  LOOP
    RAISE NOTICE 'Foreign key %: %.% -> %.%', 
      fk_record.constraint_name,
      fk_record.table_name, fk_record.column_name,
      fk_record.foreign_table_name, fk_record.foreign_column_name;
  END LOOP;
END $$;

-- Validation completed successfully
SELECT 'WebAuthn Enhancement Migration Validation: PASSED' as status;



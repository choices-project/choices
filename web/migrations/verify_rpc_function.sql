-- Verification Script: Check if update_poll_vote_count function exists and works
-- Run this after applying fix_polls_rls_for_vote_counts.sql

-- ============================================================================
-- 1. Check if function exists
-- ============================================================================
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as function_owner,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'update_poll_vote_count'
  AND pronamespace = 'public'::regnamespace;

-- Expected: Should return 1 row with is_security_definer = true

-- ============================================================================
-- 2. Check function permissions
-- ============================================================================
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'update_poll_vote_count'
ORDER BY grantee, privilege_type;

-- Expected: Should see EXECUTE granted to authenticated, service_role, anon

-- ============================================================================
-- 3. Check polls table policies (especially service_role)
-- ============================================================================
SELECT 
  policyname,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'polls'
ORDER BY policyname;

-- Expected: Should see polls_service_full policy with service_role

-- ============================================================================
-- 4. Test the function with a real poll (replace with actual poll ID)
-- ============================================================================
-- Uncomment and replace poll_id with an actual poll ID to test:
-- SELECT update_poll_vote_count('your-poll-id-here');

-- ============================================================================
-- 5. Check if function can actually update polls
-- ============================================================================
-- This query checks if the function owner has the necessary privileges
SELECT 
  p.proname as function_name,
  r.rolname as function_owner,
  CASE 
    WHEN r.rolsuper THEN 'SUPERUSER - has all privileges'
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'polls' 
        AND 'service_role' = ANY(roles)
        AND cmd = 'UPDATE'
    ) THEN 'Has service_role policy - should work'
    ELSE 'WARNING: May not have UPDATE privileges on polls table'
  END as privilege_status
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'update_poll_vote_count'
  AND p.pronamespace = 'public'::regnamespace;

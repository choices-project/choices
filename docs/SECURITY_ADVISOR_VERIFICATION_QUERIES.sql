-- ============================================================================
-- Security Advisor Fixes - Verification Queries
-- Run these queries in Supabase SQL Editor to verify all fixes are applied
-- ============================================================================

-- ============================================================================
-- 1. Verify voter_registration_resources_view was created correctly
-- ============================================================================

-- Check if view exists
SELECT
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'voter_registration_resources_view';

-- Check view definition (should not have any SECURITY DEFINER references)
SELECT
  pg_get_viewdef('public.voter_registration_resources_view', true) as view_definition;

-- Verify view can be queried
SELECT COUNT(*) as row_count
FROM public.voter_registration_resources_view;

-- ============================================================================
-- 2. Verify function search_path fixes (12 functions)
-- ============================================================================

-- Check all 12 functions have search_path set correctly
SELECT
  p.proname as function_name,
  p.proconfig as search_path_config,
  CASE
    WHEN p.proconfig IS NULL THEN '❌ Missing search_path'
    WHEN EXISTS (
      SELECT 1
      FROM unnest(p.proconfig) AS config_item
      WHERE config_item LIKE 'search_path=%'
    ) THEN '✅ search_path set'
    ELSE '❌ search_path not set correctly'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_duplicate_canonical_ids',
    'set_updated_at',
    'update_poll_demographic_insights',
    'get_table_columns',
    'update_device_flow_updated_at',
    'cleanup_expired_device_flows',
    'trigger_update_poll_insights',
    'tg_set_updated_at',
    'get_upcoming_elections',
    'touch_representative_divisions',
    'tg_audit_candidate_profiles',
    'tg_audit_rep_overrides'
  )
ORDER BY p.proname;

-- Count functions with search_path set
SELECT
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1
    FROM unnest(p.proconfig) AS config_item
    WHERE config_item LIKE 'search_path=%'
  )) as functions_with_search_path,
  COUNT(*) as total_functions
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_duplicate_canonical_ids',
    'set_updated_at',
    'update_poll_demographic_insights',
    'get_table_columns',
    'update_device_flow_updated_at',
    'cleanup_expired_device_flows',
    'trigger_update_poll_insights',
    'tg_set_updated_at',
    'get_upcoming_elections',
    'touch_representative_divisions',
    'tg_audit_candidate_profiles',
    'tg_audit_rep_overrides'
  );

-- ============================================================================
-- 3. Verify view dependencies and permissions
-- ============================================================================

-- Check view permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'voter_registration_resources_view';

-- Check underlying table has RLS enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'voter_registration_resources';

-- Check RLS policies on underlying table
SELECT
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'voter_registration_resources';

-- ============================================================================
-- 4. Summary Verification
-- ============================================================================

-- Count of functions that should have search_path set
SELECT
  'Functions with search_path set' as check_type,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1
    FROM unnest(p.proconfig) AS config_item
    WHERE config_item LIKE 'search_path=%'
  )) as count,
  COUNT(*) as total,
  CASE
    WHEN COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1
      FROM unnest(p.proconfig) AS config_item
      WHERE config_item LIKE 'search_path=%'
    )) = COUNT(*) THEN '✅ All fixed'
    ELSE '❌ Some missing'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_duplicate_canonical_ids',
    'set_updated_at',
    'update_poll_demographic_insights',
    'get_table_columns',
    'update_device_flow_updated_at',
    'cleanup_expired_device_flows',
    'trigger_update_poll_insights',
    'tg_set_updated_at',
    'get_upcoming_elections',
    'touch_representative_divisions',
    'tg_audit_candidate_profiles',
    'tg_audit_rep_overrides'
  );

-- Check if view exists
SELECT
  'View exists' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ View exists'
    ELSE '❌ View missing'
  END as status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'voter_registration_resources_view';

-- ============================================================================
-- 5. Test function execution (sample test)
-- ============================================================================

-- Test a sample function to ensure it still works after search_path fix
-- Uncomment to test:
-- SELECT public.get_duplicate_canonical_ids();
-- SELECT public.get_table_columns('voter_registration_resources');


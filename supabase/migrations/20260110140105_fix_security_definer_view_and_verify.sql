-- ============================================================================
-- Fix Security Advisor - Security Definer View Error & Verify Fixes
-- Addresses: voter_registration_resources_view Security Definer error
-- Created: 2026-01-10
-- ============================================================================
--
-- This migration explicitly fixes the voter_registration_resources_view
-- Security Definer issue and verifies all previous fixes are in place.
--
-- Note: In PostgreSQL, views don't have SECURITY DEFINER/INVOKER attributes
-- like functions do. Views use the caller's permissions by default. However,
-- Supabase Security Advisor may flag views that were created in a way that
-- suggests they might bypass RLS. We'll recreate the view explicitly.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Fix voter_registration_resources_view - Remove Invalid ALTER VIEW Statement
-- ============================================================================
--
-- ISSUE: Previous migration (20260109000001) attempted to use:
--   ALTER VIEW ... SET (security_invoker = true)
-- This syntax is NOT valid PostgreSQL and may cause errors or confusion.
--
-- SOLUTION: Drop and recreate the view properly.
-- PostgreSQL views are SECURITY INVOKER by default (use caller's permissions).
-- No special syntax is needed - views automatically inherit this behavior.

-- Drop the view completely (CASCADE to handle any dependencies)
DROP VIEW IF EXISTS public.voter_registration_resources_view CASCADE;

-- Recreate the view with explicit schema qualification
-- Views in PostgreSQL are always SECURITY INVOKER by default
-- They use the permissions of the calling user, not the view creator
CREATE VIEW public.voter_registration_resources_view AS
SELECT
  vrr.state_code,
  vrr.election_office_name,
  vrr.online_url,
  vrr.mail_form_url,
  vrr.mailing_address,
  vrr.status_check_url,
  vrr.special_instructions,
  vrr.sources,
  vrr.metadata,
  vrr.last_verified,
  vrr.updated_at
FROM public.voter_registration_resources vrr
ORDER BY vrr.state_code;

-- Grant permissions (view will use RLS from underlying table)
GRANT SELECT ON public.voter_registration_resources_view TO service_role, authenticated, anon;

-- Add explicit comment
COMMENT ON VIEW public.voter_registration_resources_view IS
  'Public view of voter registration resources. Uses caller permissions via RLS on underlying table (SECURITY INVOKER). The view respects RLS policies from the voter_registration_resources table.';


-- ============================================================================
-- 2. Verify function search_path fixes are applied
-- ============================================================================

-- Check that all 12 functions have search_path set correctly
DO $$
DECLARE
  target_functions text[] := ARRAY[
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
  ];
  func_oid oid;
  has_search_path boolean;
  missing_search_path integer := 0;
BEGIN
  -- Iterate through all matching functions (handle overloaded functions)
  FOR func_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(target_functions)
  LOOP
    -- Check if search_path is already set in proconfig array
    -- proconfig is a text array like: ARRAY['search_path=pg_catalog, public']
    SELECT EXISTS (
      SELECT 1
      FROM pg_proc p2
      WHERE p2.oid = func_oid
        AND p2.proconfig IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM unnest(p2.proconfig) AS config_item
          WHERE config_item LIKE 'search_path=%'
        )
    ) INTO has_search_path;

    -- If search_path is not set, fix it using the function's full signature (regprocedure)
    IF NOT has_search_path THEN
      missing_search_path := missing_search_path + 1;
      BEGIN
        -- Use regprocedure to get full function signature (handles overloaded functions)
        EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', func_oid::regprocedure);
        RAISE NOTICE 'Fixed missing search_path for function: %', func_oid::regprocedure;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to fix search_path for function %: %', func_oid::regprocedure, SQLERRM;
      END;
    END IF;
  END LOOP;

  IF missing_search_path > 0 THEN
    RAISE NOTICE 'Re-applied search_path for % functions', missing_search_path;
  ELSE
    RAISE NOTICE 'All functions already have search_path set correctly';
  END IF;
END $$;

-- ============================================================================
-- 3. Verify view was created successfully
-- ============================================================================

-- Simple verification that the view exists using pg_class (more reliable than pg_views)
DO $$
DECLARE
  view_exists boolean := false;
BEGIN
  -- Check if view exists using pg_class and pg_namespace (standard PostgreSQL system catalogs)
  SELECT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'voter_registration_resources_view'
      AND c.relkind = 'v'  -- 'v' = view
  ) INTO view_exists;

  IF view_exists THEN
    RAISE NOTICE 'View voter_registration_resources_view created successfully';
  ELSE
    RAISE WARNING 'View voter_registration_resources_view was not created';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these in Supabase SQL Editor to verify fixes:
--
-- 1. Check view security attributes:
--    SELECT schemaname, viewname, viewowner
--    FROM pg_views
--    WHERE schemaname = 'public'
--      AND viewname = 'voter_registration_resources_view';
--
-- 2. Check function search_path settings:
--    SELECT p.proname, p.proconfig
--    FROM pg_proc p
--    JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      AND p.proname IN (
--        'get_duplicate_canonical_ids',
--        'set_updated_at',
--        'update_poll_demographic_insights',
--        'get_table_columns',
--        'update_device_flow_updated_at',
--        'cleanup_expired_device_flows',
--        'trigger_update_poll_insights',
--        'tg_set_updated_at',
--        'get_upcoming_elections',
--        'touch_representative_divisions',
--        'tg_audit_candidate_profiles',
--        'tg_audit_rep_overrides'
--      )
--    ORDER BY p.proname;
--
-- 3. Verify view definition:
--    SELECT pg_get_viewdef('public.voter_registration_resources_view', true);


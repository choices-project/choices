-- ============================================================================
-- Fix Security Advisor Warnings - Function Search Path Mutable
-- Addresses: 12 functions with mutable search_path
-- Created: 2026-01-10
-- ============================================================================
--
-- This migration fixes Security Advisor warnings for functions that have
-- mutable search_path, which could allow schema injection attacks.
--
-- By setting search_path explicitly, we prevent attackers from manipulating
-- the search path to call malicious functions or access unauthorized schemas.
--
-- All functions are set to use: pg_catalog, public
-- This ensures system functions are found first, followed by public schema.
-- ============================================================================

BEGIN;

-- Fix function search_path for all functions flagged by Security Advisor
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
  fn regprocedure;
  fixed_count integer := 0;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(target_functions)
  LOOP
    BEGIN
      -- Set search_path to prevent schema injection attacks
      -- pg_catalog must be first to ensure system functions are found
      -- public is second to allow access to public schema objects
      EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', fn);
      fixed_count := fixed_count + 1;
      RAISE NOTICE 'Fixed search_path for function: %', fn;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to fix search_path for function %: %', fn, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Fixed search_path for % functions', fixed_count;
END $$;

COMMIT;

-- Verify: Check that all functions now have search_path set
-- Run in Supabase SQL Editor to verify:
-- SELECT p.proname, p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_duplicate_canonical_ids',
--     'set_updated_at',
--     'update_poll_demographic_insights',
--     'get_table_columns',
--     'update_device_flow_updated_at',
--     'cleanup_expired_device_flows',
--     'trigger_update_poll_insights',
--     'tg_set_updated_at',
--     'get_upcoming_elections',
--     'touch_representative_divisions',
--     'tg_audit_candidate_profiles',
--     'tg_audit_rep_overrides'
--   )
--   AND (p.proconfig IS NULL OR NOT ('search_path=pg_catalog, public' = ANY(p.proconfig::text[])));


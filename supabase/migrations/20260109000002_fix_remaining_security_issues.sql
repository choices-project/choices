-- ============================================================================
-- Fix Remaining Security Advisor Issues
-- Addresses remaining view issue and critical RLS warnings
-- Created: January 9, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Fix voter_registration_resources_view Security Definer issue
-- ============================================================================

-- Drop and recreate the view to ensure it's SECURITY INVOKER (default)
-- PostgreSQL views are SECURITY INVOKER by default (uses caller's permissions)
-- Only explicitly created with SECURITY DEFINER would use definer's permissions
DROP VIEW IF EXISTS public.voter_registration_resources_view CASCADE;

-- Recreate without any security definer clause (defaults to SECURITY INVOKER)
CREATE VIEW public.voter_registration_resources_view AS
SELECT
  state_code,
  election_office_name,
  online_url,
  mail_form_url,
  mailing_address,
  status_check_url,
  special_instructions,
  sources,
  metadata,
  last_verified,
  updated_at
FROM public.voter_registration_resources
ORDER BY state_code;

-- Grant permissions (view will use RLS from underlying table)
GRANT SELECT ON public.voter_registration_resources_view TO service_role, authenticated, anon;

COMMENT ON VIEW public.voter_registration_resources_view IS
  'Public view of voter registration resources. Uses caller permissions via RLS on underlying table (SECURITY INVOKER).';

-- ============================================================================
-- 2. Enable RLS on poll_demographic_insights (if not already enabled)
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.poll_demographic_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS poll_demographic_insights_authenticated_read ON public.poll_demographic_insights;
DROP POLICY IF EXISTS poll_demographic_insights_service_full ON public.poll_demographic_insights;

-- Authenticated users can read (insights are for authenticated users)
CREATE POLICY poll_demographic_insights_authenticated_read ON public.poll_demographic_insights
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access (for data updates)
CREATE POLICY poll_demographic_insights_service_full ON public.poll_demographic_insights
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. Ensure civic_database_entries has RLS enabled
-- ============================================================================

-- Enable RLS (policy already exists from comprehensive_rls_policies migration)
ALTER TABLE IF EXISTS public.civic_database_entries ENABLE ROW LEVEL SECURITY;

-- Verify the policy exists, create if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'civic_database_entries'
    AND policyname = 'civic_database_entries_public_read'
  ) THEN
    CREATE POLICY civic_database_entries_public_read ON public.civic_database_entries
      FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Service role full access
DROP POLICY IF EXISTS civic_database_entries_service_full ON public.civic_database_entries;
CREATE POLICY civic_database_entries_service_full ON public.civic_database_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Fixed:
-- 1. Recreated voter_registration_resources_view to ensure SECURITY INVOKER
-- 2. Enabled RLS on poll_demographic_insights with authenticated read + service_role full access
-- 3. Ensured civic_database_entries has RLS enabled with proper policies
--
-- Note: The 50 warnings may include:
-- - Functions with SECURITY DEFINER (may be intentional for admin functions)
-- - Other views that need review
-- - Tables in other schemas
-- Review Security Advisor for complete list of remaining warnings.


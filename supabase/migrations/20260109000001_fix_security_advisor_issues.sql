-- ============================================================================
-- Fix Security Advisor Issues
-- Addresses RLS disabled warnings and Security Definer View issues
-- Created: January 9, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. civic_elections - Enable RLS and create public read policy
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.civic_elections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS civic_elections_public_read ON public.civic_elections;
DROP POLICY IF EXISTS civic_elections_service_full ON public.civic_elections;

-- Public read access (election data should be publicly accessible)
CREATE POLICY civic_elections_public_read ON public.civic_elections
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Service role has full access (for data updates)
CREATE POLICY civic_elections_service_full ON public.civic_elections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. representative_divisions - Enable RLS and create public read policy
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.representative_divisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS representative_divisions_public_read ON public.representative_divisions;
DROP POLICY IF EXISTS representative_divisions_service_full ON public.representative_divisions;

-- Public read access (division mappings should be publicly accessible)
CREATE POLICY representative_divisions_public_read ON public.representative_divisions
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Service role has full access (for data updates)
CREATE POLICY representative_divisions_service_full ON public.representative_divisions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. voter_registration_resources - Enable RLS and create public read policy
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.voter_registration_resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS voter_registration_resources_public_read ON public.voter_registration_resources;
DROP POLICY IF EXISTS voter_registration_resources_service_full ON public.voter_registration_resources;

-- Public read access (voter registration info should be publicly accessible)
CREATE POLICY voter_registration_resources_public_read ON public.voter_registration_resources
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Service role has full access (for data updates)
CREATE POLICY voter_registration_resources_service_full ON public.voter_registration_resources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. voter_registration_resources_view - Fix Security Definer issue
-- ============================================================================

-- Drop and recreate the view without SECURITY DEFINER
-- The view should use the permissions of the caller, not the definer
-- Views are SECURITY INVOKER by default in PostgreSQL, but we explicitly set it
DROP VIEW IF EXISTS public.voter_registration_resources_view CASCADE;

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

-- Explicitly set security invoker (uses caller's permissions, not definer's)
ALTER VIEW public.voter_registration_resources_view SET (security_invoker = true);

-- Grant permissions on the view
GRANT SELECT ON public.voter_registration_resources_view TO service_role, authenticated, anon;

-- Add comment
COMMENT ON VIEW public.voter_registration_resources_view IS
  'Public view of voter registration resources. Uses caller permissions via RLS on underlying table.';

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Fixed:
-- 1. Enabled RLS on civic_elections with public read + service_role full access
-- 2. Enabled RLS on representative_divisions with public read + service_role full access
-- 3. Enabled RLS on voter_registration_resources with public read + service_role full access
-- 4. Recreated voter_registration_resources_view without SECURITY DEFINER
--
-- These tables contain reference data that should be publicly readable but
-- only updatable by the service role (for data synchronization).


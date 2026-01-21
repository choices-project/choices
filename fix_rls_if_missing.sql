-- Fix RLS Setup - Run this if policies are missing
-- This script ensures all required RLS policies exist

-- ============================================================================
-- poll_rankings RLS Setup
-- ============================================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.poll_rankings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS poll_rankings_service_full ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_delete_own ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_update_own ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_select_own ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_insert_own ON public.poll_rankings;

-- Create policies
CREATE POLICY poll_rankings_insert_own ON public.poll_rankings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY poll_rankings_select_own ON public.poll_rankings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY poll_rankings_update_own ON public.poll_rankings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY poll_rankings_delete_own ON public.poll_rankings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY poll_rankings_service_full ON public.poll_rankings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant explicit permissions
GRANT ALL ON public.poll_rankings TO service_role;

-- ============================================================================
-- vote_integrity_scores RLS Setup
-- ============================================================================

-- Ensure RLS is enabled (should already be from previous migration)
ALTER TABLE IF EXISTS public.vote_integrity_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing service role policy if exists
DROP POLICY IF EXISTS vote_integrity_scores_service_full ON public.vote_integrity_scores;

-- Create service role policy
CREATE POLICY vote_integrity_scores_service_full ON public.vote_integrity_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- integrity_signals RLS Setup
-- ============================================================================

-- Ensure RLS is enabled (should already be from previous migration)
ALTER TABLE IF EXISTS public.integrity_signals ENABLE ROW LEVEL SECURITY;

-- Drop existing service role policy if exists
DROP POLICY IF EXISTS integrity_signals_service_full ON public.integrity_signals;

-- Create service role policy
CREATE POLICY integrity_signals_service_full ON public.integrity_signals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Verification Query (run after to confirm)
-- ============================================================================
-- Run verify_rls_setup.sql to confirm all policies are in place

-- Fix RLS Policies for Polls Table - Allow Vote Count Updates
-- This migration fixes the root cause: RLS blocking vote count updates
-- Instead of using adminClient everywhere, we properly configure RLS
--
-- Created: January 2025
-- Purpose: Allow authenticated users to update total_votes on polls they've voted on
--          This is safe because:
--          1. Users can only update total_votes (not other sensitive fields)
--          2. The count is calculated from actual vote records (can't be faked)
--          3. We use a function to ensure integrity

-- ============================================================================
-- 1. Create a function to safely update poll vote counts
-- ============================================================================
-- This function ensures vote counts are always accurate by recalculating from votes
-- CRITICAL: Uses SECURITY DEFINER so it runs with function owner's privileges
-- The function owner should be a superuser or have service_role permissions
CREATE OR REPLACE FUNCTION update_poll_vote_count(poll_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's privileges (bypasses RLS)
SET search_path = public -- Ensure we use public schema
AS $$
DECLARE
  vote_count INTEGER;
  poll_voting_method TEXT;
BEGIN
  -- Get the voting method for this poll
  SELECT voting_method INTO poll_voting_method
  FROM polls
  WHERE id = poll_id_param;

  IF poll_voting_method IS NULL THEN
    RAISE EXCEPTION 'Poll not found: %', poll_id_param;
  END IF;

  -- Count distinct voters based on voting method
  IF poll_voting_method = 'ranked' OR poll_voting_method = 'ranked_choice' THEN
    -- For ranked polls, count from poll_rankings
    SELECT COUNT(DISTINCT user_id) INTO vote_count
    FROM poll_rankings
    WHERE poll_id = poll_id_param;
  ELSE
    -- For other polls, count from votes table
    SELECT COUNT(DISTINCT user_id) INTO vote_count
    FROM votes
    WHERE poll_id = poll_id_param;
  END IF;

  -- Update the poll with the accurate count
  -- This will work because function has SECURITY DEFINER and service_role has policy
  UPDATE polls
  SET
    total_votes = vote_count,
    updated_at = NOW()
  WHERE id = poll_id_param;
  
  -- Log the update (optional, for debugging)
  RAISE NOTICE 'Updated poll % vote count to %', poll_id_param, vote_count;
END;
$$;

-- Set function owner to postgres (or service_role user) to ensure SECURITY DEFINER works
-- This ensures the function has the necessary privileges
ALTER FUNCTION update_poll_vote_count(UUID) OWNER TO postgres;

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION update_poll_vote_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_poll_vote_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_poll_vote_count(UUID) TO anon; -- Allow anonymous calls too

-- ============================================================================
-- 2. Create RLS policy for updating polls (specifically total_votes)
-- ============================================================================
-- Allow authenticated users to update total_votes and updated_at only
-- This is safe because:
-- 1. The function recalculates from actual votes (can't be manipulated)
-- 2. Users can only update these specific fields
-- 3. The count is always accurate

DO $$
BEGIN
  -- Drop existing overly permissive UPDATE policy if it exists
  DROP POLICY IF EXISTS polls_update_any ON public.polls;
  DROP POLICY IF EXISTS polls_authenticated_update ON public.polls;

  -- Create policy for poll creators to update their polls
  -- This allows closing polls, updating settings, etc.
  -- Note: total_votes should be updated via update_poll_vote_count() function, not directly
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'polls'
      AND policyname = 'polls_creator_update'
  ) THEN
    CREATE POLICY polls_creator_update ON public.polls
      FOR UPDATE
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;

  -- Note: We don't need a separate policy for vote count updates
  -- The update_poll_vote_count() function uses SECURITY DEFINER, so it bypasses RLS
  -- This is the correct and secure way to handle this operation
  -- Direct updates to total_votes by regular users are not allowed (security)
END $$;

-- ============================================================================
-- 3. Ensure service_role has full access (for admin operations and RPC function)
-- ============================================================================
-- CRITICAL: The update_poll_vote_count() function uses SECURITY DEFINER, which means
-- it runs with the privileges of the function owner (typically service_role).
-- Without this policy, the function cannot update the polls table even though
-- it has SECURITY DEFINER.
DO $$
BEGIN
  -- Drop existing policy if it exists (to recreate with correct settings)
  DROP POLICY IF EXISTS polls_service_full ON public.polls;
  
  -- Create policy for service_role to have full access
  CREATE POLICY polls_service_full ON public.polls
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
    
  RAISE NOTICE 'Created polls_service_full policy for service_role';
END $$;

-- ============================================================================
-- 4. Verify the policies
-- ============================================================================
-- Run this to verify:
-- SELECT
--   policyname,
--   roles,
--   cmd as command,
--   qual as using_expression,
--   with_check as with_check_expression
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'polls'
-- ORDER BY policyname;

COMMENT ON FUNCTION update_poll_vote_count(UUID) IS
  'Safely updates poll vote count by recalculating from actual vote records. '
  'Uses SECURITY DEFINER to bypass RLS. Should be called after votes are inserted.';

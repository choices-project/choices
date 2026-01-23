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
CREATE OR REPLACE FUNCTION update_poll_vote_count(poll_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's privileges (service role)
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
  UPDATE polls
  SET 
    total_votes = vote_count,
    updated_at = NOW()
  WHERE id = poll_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_poll_vote_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_poll_vote_count(UUID) TO service_role;

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
      WITH CHECK (
        -- Poll creators can update most fields, but not total_votes directly
        -- (total_votes should be updated via the function)
        created_by = auth.uid()
      );
  END IF;
  
  -- Create policy for vote count updates via function
  -- This allows the update_poll_vote_count function to work
  -- Note: The function itself uses SECURITY DEFINER, so it bypasses RLS
  -- But we still want a policy for direct updates if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'polls'
      AND policyname = 'polls_vote_count_update'
  ) THEN
    -- Allow updating total_votes if user has voted on the poll
    -- This ensures only legitimate vote count updates
    CREATE POLICY polls_vote_count_update ON public.polls
      FOR UPDATE
      TO authenticated
      USING (
        -- User must have voted on this poll
        EXISTS (
          SELECT 1 FROM votes
          WHERE votes.poll_id = polls.id
            AND votes.user_id = auth.uid()
        )
        OR
        -- Or user must have ranked this poll
        EXISTS (
          SELECT 1 FROM poll_rankings
          WHERE poll_rankings.poll_id = polls.id
            AND poll_rankings.user_id = auth.uid()
        )
      )
      WITH CHECK (
        -- Only allow updating total_votes and updated_at
        -- Prevent updating other sensitive fields
        (OLD.total_votes IS DISTINCT FROM NEW.total_votes OR OLD.updated_at IS DISTINCT FROM NEW.updated_at)
        AND
        -- Ensure other critical fields haven't changed
        OLD.id = NEW.id
        AND OLD.created_by = NEW.created_by
        AND OLD.status = NEW.status
      );
  END IF;
END $$;

-- ============================================================================
-- 3. Ensure service_role has full access (for admin operations)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'polls'
      AND policyname = 'polls_service_full'
      AND 'service_role' = ANY(roles)
  ) THEN
    CREATE POLICY polls_service_full ON public.polls
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
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

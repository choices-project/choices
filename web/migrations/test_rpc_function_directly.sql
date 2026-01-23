-- Direct Test: Call update_poll_vote_count function
-- Replace 'YOUR_POLL_ID' with an actual poll ID that has votes

-- ============================================================================
-- Test 1: Check current vote count
-- ============================================================================
SELECT
  id,
  title,
  total_votes,
  voting_method,
  updated_at
FROM polls
WHERE id = 'YOUR_POLL_ID';

-- ============================================================================
-- Test 2: Count actual votes (for comparison)
-- ============================================================================
-- For ranked polls:
SELECT COUNT(DISTINCT user_id) as actual_voters
FROM poll_rankings
WHERE poll_id = 'YOUR_POLL_ID';

-- For regular polls:
SELECT COUNT(DISTINCT user_id) as actual_voters
FROM votes
WHERE poll_id = 'YOUR_POLL_ID';

-- ============================================================================
-- Test 3: Call the function
-- ============================================================================
SELECT update_poll_vote_count('YOUR_POLL_ID');

-- ============================================================================
-- Test 4: Check if vote count was updated
-- ============================================================================
SELECT
  id,
  title,
  total_votes,
  voting_method,
  updated_at
FROM polls
WHERE id = 'YOUR_POLL_ID';

-- ============================================================================
-- Expected Results:
-- - Function should execute without error
-- - total_votes should match actual_voters count
-- - updated_at should be recent
-- ============================================================================

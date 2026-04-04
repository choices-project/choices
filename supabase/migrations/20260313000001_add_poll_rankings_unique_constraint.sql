-- Add UNIQUE constraint on poll_rankings to prevent duplicate ballots per user per poll
-- Enforces one ranked ballot per user per poll at the database level (race-condition safe)
-- migrate:up

-- Remove duplicate ballots for authenticated users (keep most recent)
DELETE FROM public.poll_rankings a
USING public.poll_rankings b
WHERE a.poll_id = b.poll_id
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL
  AND a.created_at < b.created_at;

-- Create unique index: one ballot per (poll_id, user_id) for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_rankings_poll_user_unique
  ON public.poll_rankings (poll_id, user_id)
  WHERE user_id IS NOT NULL;

-- For anonymous (user_id IS NULL), we cannot have a simple unique - multiple anon users could vote
-- The app should use voter_session or similar for anonymous. No additional constraint for anon.

COMMENT ON INDEX idx_poll_rankings_poll_user_unique IS 'Prevents duplicate ranked ballots per user per poll; handles race conditions';

-- migrate:down
DROP INDEX IF EXISTS idx_poll_rankings_poll_user_unique;

-- Polls and votes indexes for API and RPC usage
-- GET /api/polls: sort by created_at, filter by status; dashboard RPC: created_by, status
-- Votes: filter by user_id, poll_id; joins in get_dashboard_data
-- Use IF NOT EXISTS so migration is idempotent.

CREATE INDEX IF NOT EXISTS idx_polls_created_at ON public.polls (created_at);
CREATE INDEX IF NOT EXISTS idx_polls_status ON public.polls (status);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON public.polls (created_by);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes (user_id);

COMMENT ON INDEX idx_polls_created_at IS 'Supports GET /api/polls sort=newest and cursor pagination';
COMMENT ON INDEX idx_polls_status IS 'Supports filtering active polls; get_dashboard_data';
COMMENT ON INDEX idx_polls_created_by IS 'Supports get_dashboard_data and creator-scoped queries';
COMMENT ON INDEX idx_votes_poll_id IS 'Supports vote count and join in get_dashboard_data';
COMMENT ON INDEX idx_votes_user_id IS 'Supports user voting history and RPC user_id filters';

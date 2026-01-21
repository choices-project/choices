-- migrate:up
-- Enable Row Level Security on poll_rankings table
ALTER TABLE IF EXISTS public.poll_rankings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own rankings
CREATE POLICY poll_rankings_insert_own ON public.poll_rankings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can select their own rankings
CREATE POLICY poll_rankings_select_own ON public.poll_rankings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own rankings
CREATE POLICY poll_rankings_update_own ON public.poll_rankings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own rankings
CREATE POLICY poll_rankings_delete_own ON public.poll_rankings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for server-side operations)
-- Note: Service role should bypass RLS, but this policy ensures access if RLS is enforced
CREATE POLICY poll_rankings_service_full ON public.poll_rankings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant explicit permissions to service role (redundant but ensures access)
GRANT ALL ON public.poll_rankings TO service_role;

-- migrate:down
DROP POLICY IF EXISTS poll_rankings_service_full ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_delete_own ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_update_own ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_select_own ON public.poll_rankings;
DROP POLICY IF EXISTS poll_rankings_insert_own ON public.poll_rankings;
ALTER TABLE IF EXISTS public.poll_rankings DISABLE ROW LEVEL SECURITY;

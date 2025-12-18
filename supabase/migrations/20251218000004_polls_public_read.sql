-- Ensure polls table has RLS enabled and public read access
-- This is critical for the polls API to work

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.polls ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS polls_public_read ON public.polls;

-- Create public read policy
CREATE POLICY polls_public_read ON public.polls
  FOR SELECT
  USING (true);

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.polls TO anon;
GRANT SELECT ON public.polls TO authenticated;


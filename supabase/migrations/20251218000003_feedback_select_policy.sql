-- Migration: Add SELECT policy for feedback table
-- The diagnostics endpoint needs to query feedback to check table health
-- Only authenticated users with service_role should read feedback

-- Enable RLS on feedback if not already enabled
ALTER TABLE IF EXISTS public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS feedback_service_read ON public.feedback;
DROP POLICY IF EXISTS feedback_public_read ON public.feedback;

-- Allow service role to read feedback (for diagnostics and admin)
-- For regular users, we don't expose feedback data
CREATE POLICY feedback_service_read ON public.feedback
  FOR SELECT
  TO service_role
  USING (true);

-- Allow anon/public to read their own feedback submissions (if needed)
-- This is optional - uncomment if users should see their own feedback
-- CREATE POLICY feedback_own_read ON public.feedback
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid()::text = user_id);


-- ============================================================================
-- Fix Feedback Admin Access
-- Ensures admin client (service role) can read feedback
-- Created: January 9, 2026
-- ============================================================================

BEGIN;

-- Drop and recreate the policy to ensure service_role can access
DROP POLICY IF EXISTS feedback_service_read ON public.feedback;

-- Service role should bypass RLS, but we'll create a policy anyway for explicit access
-- Using service_role key in createClient should automatically grant service_role permissions
CREATE POLICY feedback_service_read ON public.feedback
  FOR SELECT
  TO service_role
  USING (true);

-- Also allow authenticated admin users (if they have is_admin flag)
-- This provides a fallback if service_role key isn't working
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feedback'
    AND policyname = 'feedback_admin_read'
  ) THEN
    EXECUTE '
      CREATE POLICY feedback_admin_read ON public.feedback
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.is_admin = true
          )
        )';
  END IF;
END $$;

COMMIT;


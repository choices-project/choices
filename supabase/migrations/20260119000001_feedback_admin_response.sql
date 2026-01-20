-- ============================================================================
-- Feedback admin responses
-- Adds admin response fields and update policy for admins.
-- Created: January 19, 2026
-- ============================================================================

BEGIN;

ALTER TABLE IF EXISTS public.feedback
  ADD COLUMN IF NOT EXISTS admin_response text,
  ADD COLUMN IF NOT EXISTS admin_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_response_by uuid;

-- Ensure admins can update feedback responses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feedback'
      AND policyname = 'feedback_admin_update'
  ) THEN
    EXECUTE '
      CREATE POLICY feedback_admin_update ON public.feedback
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
              AND user_profiles.is_admin = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
              AND user_profiles.is_admin = true
          )
        )';
  END IF;
END $$;

COMMIT;

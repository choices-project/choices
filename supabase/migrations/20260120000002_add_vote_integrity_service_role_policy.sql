-- migrate:up
-- Add service role policy for vote_integrity_scores to ensure admin client access
-- Service role should bypass RLS by default, but explicit policy ensures clarity

CREATE POLICY IF NOT EXISTS vote_integrity_scores_service_full ON public.vote_integrity_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- migrate:down
DROP POLICY IF EXISTS vote_integrity_scores_service_full ON public.vote_integrity_scores;

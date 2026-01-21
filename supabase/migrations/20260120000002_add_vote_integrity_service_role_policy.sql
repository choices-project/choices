-- migrate:up
-- Add service role policies for integrity tables to ensure admin client access
-- Service role should bypass RLS by default, but explicit policies ensure clarity

-- Policy for vote_integrity_scores
CREATE POLICY IF NOT EXISTS vote_integrity_scores_service_full ON public.vote_integrity_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for integrity_signals
CREATE POLICY IF NOT EXISTS integrity_signals_service_full ON public.integrity_signals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- migrate:down
DROP POLICY IF EXISTS integrity_signals_service_full ON public.integrity_signals;
DROP POLICY IF EXISTS vote_integrity_scores_service_full ON public.vote_integrity_scores;

-- Index on representative_divisions(representative_id)
-- Covers FK representative_divisions_representative_id_fkey; supports joins and
-- lookups by representative_id (ingest, web API). Verified via Supabase MCP
-- get_advisors (performance) and execute_sql FK/index checks.

CREATE INDEX IF NOT EXISTS idx_representative_divisions_representative_id
  ON public.representative_divisions (representative_id);

COMMENT ON INDEX idx_representative_divisions_representative_id IS
  'Covers FK to representatives_core; supports rep-scoped division lookups and ingest.';

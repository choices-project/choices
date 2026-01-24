-- Composite index for register-verify challenge lookup
-- Query: WHERE user_id = $1 AND kind = 'registration' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1
-- Supabase best practice: index columns used in WHERE (INDEX_OPTIMIZATION_GUIDE, Postgres skill 1.3)

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id_kind_used_at
  ON public.webauthn_challenges (user_id, kind, used_at);

COMMENT ON INDEX idx_webauthn_challenges_user_id_kind_used_at
  IS 'Register-verify challenge lookup by user_id, kind, used_at';

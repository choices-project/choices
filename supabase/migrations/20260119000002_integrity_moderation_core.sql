-- ============================================================================
-- Integrity + Moderation core tables (consent-first)
-- Created: January 19, 2026
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- User profile consent metadata
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS integrity_consent_scope text,
  ADD COLUMN IF NOT EXISTS integrity_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trust_tier_version integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS trust_tier_score numeric;

-- ---------------------------------------------------------------------------
-- Integrity signals (behavior + advanced, opt-in)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integrity_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  poll_id uuid NOT NULL,
  vote_id uuid,
  signal_type text NOT NULL CHECK (signal_type IN ('behavior', 'advanced')),
  consent_scope text NOT NULL CHECK (consent_scope IN ('behavior', 'advanced')),
  signals jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days')
);

CREATE INDEX IF NOT EXISTS integrity_signals_poll_id_idx ON public.integrity_signals (poll_id);
CREATE INDEX IF NOT EXISTS integrity_signals_user_id_idx ON public.integrity_signals (user_id);
CREATE INDEX IF NOT EXISTS integrity_signals_expires_at_idx ON public.integrity_signals (expires_at);

ALTER TABLE public.integrity_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrity_signals_insert_own ON public.integrity_signals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY integrity_signals_select_own ON public.integrity_signals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY integrity_signals_admin_read ON public.integrity_signals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Vote integrity scores (gated results)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vote_integrity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid NOT NULL,
  vote_type text NOT NULL DEFAULT 'vote' CHECK (vote_type IN ('vote', 'ranked')),
  poll_id uuid NOT NULL,
  user_id uuid,
  score integer NOT NULL,
  reason_codes text[] NOT NULL DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  CONSTRAINT vote_integrity_scores_unique UNIQUE (vote_id, vote_type)
);

CREATE INDEX IF NOT EXISTS vote_integrity_scores_poll_id_idx ON public.vote_integrity_scores (poll_id);
CREATE INDEX IF NOT EXISTS vote_integrity_scores_score_idx ON public.vote_integrity_scores (score);
CREATE INDEX IF NOT EXISTS vote_integrity_scores_expires_at_idx ON public.vote_integrity_scores (expires_at);

ALTER TABLE public.vote_integrity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY vote_integrity_scores_insert_own ON public.vote_integrity_scores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY vote_integrity_scores_select_own ON public.vote_integrity_scores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY vote_integrity_scores_admin_read ON public.vote_integrity_scores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Moderation reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_reports_insert_own ON public.moderation_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY moderation_reports_select_own ON public.moderation_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY moderation_reports_admin_read ON public.moderation_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Moderation actions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  action text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_actions_admin_manage ON public.moderation_actions
  FOR ALL TO authenticated
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
  );

-- ---------------------------------------------------------------------------
-- Moderation appeals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  message text NOT NULL,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_appeals_insert_own ON public.moderation_appeals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY moderation_appeals_select_own ON public.moderation_appeals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY moderation_appeals_admin_manage ON public.moderation_appeals
  FOR ALL TO authenticated
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
  );

COMMIT;

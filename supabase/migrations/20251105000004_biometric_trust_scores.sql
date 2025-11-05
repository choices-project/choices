-- Migration: Biometric Trust Scores Table
-- Created: November 5, 2025
-- Purpose: Track trust scores from biometric authentication

-- ============================================================================
-- BIOMETRIC TRUST SCORES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.biometric_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trust scoring
  trust_score NUMERIC(3,2) CHECK (trust_score >= 0 AND trust_score <= 1),
  confidence_level NUMERIC(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  
  -- Verification factors (JSONB for flexibility)
  factors JSONB DEFAULT '{}'::jsonb,
  
  -- Device and context
  device_info JSONB,
  credential_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_biometric_trust_user 
  ON public.biometric_trust_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_biometric_trust_score 
  ON public.biometric_trust_scores(trust_score);

CREATE INDEX IF NOT EXISTS idx_biometric_trust_created 
  ON public.biometric_trust_scores(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.biometric_trust_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own trust scores
CREATE POLICY "Users can view own biometric trust scores"
  ON public.biometric_trust_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all trust scores
CREATE POLICY "Service role can manage biometric trust scores"
  ON public.biometric_trust_scores
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_biometric_trust_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER biometric_trust_scores_updated_at
  BEFORE UPDATE ON public.biometric_trust_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_biometric_trust_scores_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.biometric_trust_scores IS 
  'Trust scores derived from biometric authentication factors';

COMMENT ON COLUMN public.biometric_trust_scores.factors IS 
  'JSONB object containing verification factors (biometric_verified, phone_verified, etc.)';


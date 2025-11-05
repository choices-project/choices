-- Migration: Civic Database Entries Table
-- Created: November 5, 2025
-- Purpose: Track comprehensive civic engagement records for analytics

-- ============================================================================
-- CIVIC DATABASE ENTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.civic_database_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_hash TEXT NOT NULL,
  
  -- Engagement metrics
  total_polls_participated INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  average_engagement_score NUMERIC(5,2) DEFAULT 0,
  
  -- Trust tier tracking
  current_trust_tier TEXT,
  trust_tier_history JSONB DEFAULT '[]'::jsonb,
  trust_tier_upgrade_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per user
  UNIQUE(stable_user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_civic_db_entries_user 
  ON public.civic_database_entries(stable_user_id);

CREATE INDEX IF NOT EXISTS idx_civic_db_entries_trust_tier 
  ON public.civic_database_entries(current_trust_tier);

CREATE INDEX IF NOT EXISTS idx_civic_db_entries_created 
  ON public.civic_database_entries(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.civic_database_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own civic entry
CREATE POLICY "Users can view own civic database entry"
  ON public.civic_database_entries
  FOR SELECT
  USING (auth.uid() = stable_user_id);

-- System can insert/update civic entries
CREATE POLICY "Service role can manage civic database entries"
  ON public.civic_database_entries
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_civic_database_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER civic_database_entries_updated_at
  BEFORE UPDATE ON public.civic_database_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_civic_database_entries_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.civic_database_entries IS 
  'Comprehensive civic engagement records for analytics and trust tier tracking';

COMMENT ON COLUMN public.civic_database_entries.user_hash IS 
  'Anonymized hash for privacy-preserving analytics';

COMMENT ON COLUMN public.civic_database_entries.trust_tier_history IS 
  'JSONB array tracking trust tier changes over time';


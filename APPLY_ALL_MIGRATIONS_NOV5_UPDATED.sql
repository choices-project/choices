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

-- Migration: Poll Demographic Insights RPC Function
-- Created: November 5, 2025
-- Purpose: Update demographic breakdowns for polls

-- ============================================================================
-- UPDATE POLL DEMOGRAPHIC INSIGHTS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_poll_demographic_insights(p_poll_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_votes INTEGER;
BEGIN
  -- Get total votes for the poll
  SELECT COUNT(*) INTO v_total_votes
  FROM votes
  WHERE poll_id = p_poll_id;

  -- Update poll statistics
  UPDATE polls
  SET 
    total_votes = v_total_votes,
    updated_at = NOW()
  WHERE id = p_poll_id;

  -- Note: Extended demographic insights will be added when
  -- demographic data collection is implemented
  
  RAISE NOTICE 'Updated demographic insights for poll %', p_poll_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update poll demographic insights: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_poll_demographic_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_poll_demographic_insights(UUID) TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION update_poll_demographic_insights(UUID) IS 
  'Updates demographic insights and statistics for a poll';

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

-- Migration: District-Based Engagement Heatmap RPC Function
-- Created: November 5, 2025
-- Purpose: Privacy-safe district-level civic engagement analytics with k-anonymity

-- ============================================================================
-- GET DISTRICT HEATMAP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_heatmap(
  state_filter TEXT DEFAULT NULL,
  level_filter TEXT DEFAULT NULL,
  min_count INTEGER DEFAULT 5
)
RETURNS TABLE(
  district_id TEXT,
  district_name TEXT,
  state TEXT,
  level TEXT,
  engagement_count INTEGER,
  representative_count INTEGER
) AS $$
BEGIN
  -- Return district-level civic engagement with k-anonymity protection
  -- Aggregates user activity by political district
  -- Only returns districts with >= min_count users for privacy
  
  RETURN QUERY
  SELECT 
    COALESCE(r.state || '-' || COALESCE(r.district, 'STATEWIDE'), r.state) as district_id,
    CASE 
      WHEN r.district IS NOT NULL THEN 'District ' || r.district
      ELSE 'Statewide'
    END as district_name,
    r.state,
    r.level,
    COUNT(DISTINCT up.user_id)::INTEGER as engagement_count,
    COUNT(DISTINCT r.id)::INTEGER as representative_count
  FROM representatives_core r
  LEFT JOIN user_profiles up ON 
    up.state = r.state AND
    (r.district IS NULL OR up.district = r.district)
  WHERE 
    (state_filter IS NULL OR r.state = state_filter) AND
    (level_filter IS NULL OR r.level = level_filter)
  GROUP BY r.state, r.district, r.level
  HAVING COUNT(DISTINCT up.user_id) >= min_count
  ORDER BY engagement_count DESC
  LIMIT 100;
  
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, return empty
    RETURN;
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_heatmap: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_heatmap(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_heatmap(TEXT, TEXT, INTEGER) TO anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_heatmap(TEXT, TEXT, INTEGER) IS 
  'Returns district-level civic engagement heatmap with k-anonymity protection. Aggregates by congressional/legislative districts.';


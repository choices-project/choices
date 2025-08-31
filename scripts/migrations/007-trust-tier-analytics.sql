-- Migration 007: Trust Tier Analytics System
-- Goal: Implement comprehensive analytics system for data quality analysis based on user trust tiers

-- Create trust tier analytics table
CREATE TABLE IF NOT EXISTS trust_tier_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Core analytics data
  user_id UUID NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  trust_tier VARCHAR(10) NOT NULL CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  
  -- Demographic data for analysis
  age_group VARCHAR(20),
  geographic_region VARCHAR(100),
  education_level VARCHAR(50),
  income_bracket VARCHAR(30),
  political_affiliation VARCHAR(50),
  voting_history_count INTEGER DEFAULT 0,
  
  -- Trust tier specific data
  biometric_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  verification_methods TEXT[] DEFAULT '{}',
  
  -- Analytics metadata
  data_quality_score DECIMAL(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  last_activity TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT trust_tier_analytics_user_poll_unique UNIQUE (user_id, poll_id)
);

-- Create poll demographic insights table
CREATE TABLE IF NOT EXISTS poll_demographic_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Poll reference
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  
  -- Demographic breakdowns
  total_responses INTEGER NOT NULL DEFAULT 0,
  trust_tier_breakdown JSONB NOT NULL DEFAULT '{}',
  age_group_breakdown JSONB NOT NULL DEFAULT '{}',
  geographic_breakdown JSONB NOT NULL DEFAULT '{}',
  education_breakdown JSONB NOT NULL DEFAULT '{}',
  income_breakdown JSONB NOT NULL DEFAULT '{}',
  political_breakdown JSONB NOT NULL DEFAULT '{}',
  
  -- Data quality metrics
  average_confidence_level DECIMAL(3,2),
  data_quality_distribution JSONB NOT NULL DEFAULT '{}',
  verification_method_distribution JSONB NOT NULL DEFAULT '{}',
  
  -- Cross-tabulation data
  trust_tier_by_demographic JSONB NOT NULL DEFAULT '{}',
  demographic_by_trust_tier JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one insight per poll
  CONSTRAINT poll_demographic_insights_poll_unique UNIQUE (poll_id)
);

-- Create civic database foundation table
CREATE TABLE IF NOT EXISTS civic_database_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User identification (anonymized)
  user_hash VARCHAR(64) NOT NULL UNIQUE,
  stable_user_id UUID NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  
  -- Civic engagement data
  total_polls_participated INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  average_engagement_score DECIMAL(3,2),
  
  -- Trust tier progression
  current_trust_tier VARCHAR(10) NOT NULL DEFAULT 'T0',
  trust_tier_history JSONB NOT NULL DEFAULT '[]',
  trust_tier_upgrade_date TIMESTAMPTZ,
  
  -- Representative connection (future feature)
  representative_district VARCHAR(100),
  representative_id UUID,
  last_representative_contact TIMESTAMPTZ,
  
  -- Privacy and consent
  data_sharing_consent BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  consent_version VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trust_tier_analytics_user_id ON trust_tier_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_tier_analytics_poll_id ON trust_tier_analytics(poll_id);
CREATE INDEX IF NOT EXISTS idx_trust_tier_analytics_trust_tier ON trust_tier_analytics(trust_tier);
CREATE INDEX IF NOT EXISTS idx_trust_tier_analytics_created_at ON trust_tier_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_poll_demographic_insights_poll_id ON poll_demographic_insights(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_demographic_insights_updated_at ON poll_demographic_insights(updated_at);

CREATE INDEX IF NOT EXISTS idx_civic_database_entries_user_hash ON civic_database_entries(user_hash);
CREATE INDEX IF NOT EXISTS idx_civic_database_entries_trust_tier ON civic_database_entries(current_trust_tier);
CREATE INDEX IF NOT EXISTS idx_civic_database_entries_representative ON civic_database_entries(representative_district);

-- Add RLS policies
ALTER TABLE trust_tier_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_demographic_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_database_entries ENABLE ROW LEVEL SECURITY;

-- Trust tier analytics policies
CREATE POLICY "Users can view own trust tier analytics" ON trust_tier_analytics
  FOR SELECT USING (
    auth.uid()::text = user_id::text
  );

CREATE POLICY "System can insert trust tier analytics" ON trust_tier_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update trust tier analytics" ON trust_tier_analytics
  FOR UPDATE USING (true);

-- Poll demographic insights policies (read-only for users, full access for system)
CREATE POLICY "Users can view poll demographic insights" ON poll_demographic_insights
  FOR SELECT USING (true);

CREATE POLICY "System can manage poll demographic insights" ON poll_demographic_insights
  FOR ALL USING (true);

-- Civic database policies
CREATE POLICY "Users can view own civic database entry" ON civic_database_entries
  FOR SELECT USING (
    auth.uid()::text = stable_user_id::text
  );

CREATE POLICY "System can manage civic database entries" ON civic_database_entries
  FOR ALL USING (true);

-- Functions for analytics calculations
CREATE OR REPLACE FUNCTION calculate_trust_tier_score(
  p_biometric_verified BOOLEAN,
  p_phone_verified BOOLEAN,
  p_identity_verified BOOLEAN,
  p_voting_history_count INTEGER
) RETURNS DECIMAL(3,2) LANGUAGE plpgsql AS $$
DECLARE
  v_score DECIMAL(3,2) := 0.0;
BEGIN
  -- Base score from verification methods
  IF p_biometric_verified THEN v_score := v_score + 0.3; END IF;
  IF p_phone_verified THEN v_score := v_score + 0.3; END IF;
  IF p_identity_verified THEN v_score := v_score + 0.4; END IF;
  
  -- Bonus for engagement (capped at 0.1)
  v_score := v_score + LEAST(p_voting_history_count * 0.01, 0.1);
  
  -- Ensure score is between 0 and 1
  RETURN GREATEST(0.0, LEAST(1.0, v_score));
END;
$$;

-- Function to determine trust tier from score
CREATE OR REPLACE FUNCTION determine_trust_tier(p_score DECIMAL(3,2))
RETURNS VARCHAR(10) LANGUAGE plpgsql AS $$
BEGIN
  IF p_score >= 0.8 THEN RETURN 'T3';
  ELSIF p_score >= 0.6 THEN RETURN 'T2';
  ELSIF p_score >= 0.3 THEN RETURN 'T1';
  ELSE RETURN 'T0';
  END IF;
END;
$$;

-- Function to update poll demographic insights
CREATE OR REPLACE FUNCTION update_poll_demographic_insights(p_poll_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_insight_record poll_demographic_insights%ROWTYPE;
  v_trust_tier_data JSONB;
  v_demographic_data JSONB;
BEGIN
  -- Get trust tier breakdown
  SELECT jsonb_object_agg(trust_tier, count) INTO v_trust_tier_data
  FROM (
    SELECT trust_tier, COUNT(*) as count
    FROM trust_tier_analytics
    WHERE poll_id = p_poll_id
    GROUP BY trust_tier
  ) tier_counts;
  
  -- Get demographic breakdowns
  SELECT jsonb_build_object(
    'age_groups', jsonb_object_agg(age_group, count),
    'regions', jsonb_object_agg(geographic_region, count),
    'education', jsonb_object_agg(education_level, count),
    'income', jsonb_object_agg(income_bracket, count),
    'political', jsonb_object_agg(political_affiliation, count)
  ) INTO v_demographic_data
  FROM (
    SELECT 
      age_group, COUNT(*) as count
    FROM trust_tier_analytics
    WHERE poll_id = p_poll_id AND age_group IS NOT NULL
    GROUP BY age_group
  ) demo_counts;
  
  -- Insert or update insights
  INSERT INTO poll_demographic_insights (
    poll_id,
    total_responses,
    trust_tier_breakdown,
    age_group_breakdown,
    geographic_breakdown,
    education_breakdown,
    income_breakdown,
    political_breakdown,
    average_confidence_level
  ) VALUES (
    p_poll_id,
    (SELECT COUNT(*) FROM trust_tier_analytics WHERE poll_id = p_poll_id),
    v_trust_tier_data,
    v_demographic_data->'age_groups',
    v_demographic_data->'regions',
    v_demographic_data->'education',
    v_demographic_data->'income',
    v_demographic_data->'political',
    (SELECT AVG(confidence_level) FROM trust_tier_analytics WHERE poll_id = p_poll_id)
  )
  ON CONFLICT (poll_id) DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    trust_tier_breakdown = EXCLUDED.trust_tier_breakdown,
    age_group_breakdown = EXCLUDED.age_group_breakdown,
    geographic_breakdown = EXCLUDED.geographic_breakdown,
    education_breakdown = EXCLUDED.education_breakdown,
    income_breakdown = EXCLUDED.income_breakdown,
    political_breakdown = EXCLUDED.political_breakdown,
    average_confidence_level = EXCLUDED.average_confidence_level,
    updated_at = NOW();
END;
$$;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER trigger_update_trust_tier_analytics_updated_at
  BEFORE UPDATE ON trust_tier_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trigger_update_poll_demographic_insights_updated_at
  BEFORE UPDATE ON poll_demographic_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trigger_update_civic_database_entries_updated_at
  BEFORE UPDATE ON civic_database_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

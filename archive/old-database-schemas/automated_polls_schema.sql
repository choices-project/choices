-- Automated Trending Topics & Poll Generation Database Schema
-- This schema extends the existing Choices platform for automated poll generation

-- ============================================================================
-- TRENDING TOPICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('news', 'social', 'search', 'academic')),
  category TEXT[] DEFAULT '{}',
  trending_score DECIMAL(5,2) DEFAULT 0.0,
  velocity DECIMAL(5,2) DEFAULT 0.0,
  momentum DECIMAL(5,2) DEFAULT 0.0,
  sentiment_score DECIMAL(3,2) DEFAULT 0.0,
  entities JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_data JSONB DEFAULT '{}',
  last_processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GENERATED POLLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES trending_topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'closed')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  topic_analysis JSONB DEFAULT '{}',
  quality_metrics JSONB DEFAULT '{}',
  generation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DATA SOURCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('news', 'social', 'search', 'academic')),
  api_endpoint TEXT,
  api_key TEXT,
  rate_limit INTEGER DEFAULT 1000,
  reliability DECIMAL(3,2) DEFAULT 0.9,
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- POLL GENERATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS poll_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES trending_topics(id) ON DELETE CASCADE,
  poll_id UUID REFERENCES generated_polls(id) ON DELETE CASCADE,
  generation_step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  error_message TEXT,
  processing_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUALITY METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES generated_polls(id) ON DELETE CASCADE,
  bias_score DECIMAL(3,2) DEFAULT 0.0,
  clarity_score DECIMAL(3,2) DEFAULT 0.0,
  completeness_score DECIMAL(3,2) DEFAULT 0.0,
  relevance_score DECIMAL(3,2) DEFAULT 0.0,
  controversy_score DECIMAL(3,2) DEFAULT 0.0,
  overall_score DECIMAL(3,2) DEFAULT 0.0,
  assessment_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Trending Topics Indexes
CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON trending_topics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON trending_topics USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_trending_topics_created_at ON trending_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_status ON trending_topics(processing_status);
CREATE INDEX IF NOT EXISTS idx_trending_topics_source ON trending_topics(source_name, source_type);
CREATE INDEX IF NOT EXISTS idx_trending_topics_entities ON trending_topics USING GIN(entities);

-- Generated Polls Indexes
CREATE INDEX IF NOT EXISTS idx_generated_polls_status ON generated_polls(status);
CREATE INDEX IF NOT EXISTS idx_generated_polls_quality ON generated_polls(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_generated_polls_category ON generated_polls(category);
CREATE INDEX IF NOT EXISTS idx_generated_polls_created_at ON generated_polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_polls_topic_id ON generated_polls(topic_id);
CREATE INDEX IF NOT EXISTS idx_generated_polls_tags ON generated_polls USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_generated_polls_voting_method ON generated_polls(voting_method);

-- Data Sources Indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_reliability ON data_sources(reliability DESC);

-- Poll Generation Logs Indexes
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_topic_id ON poll_generation_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_poll_id ON poll_generation_logs(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_status ON poll_generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_created_at ON poll_generation_logs(created_at DESC);

-- Quality Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_quality_metrics_poll_id ON quality_metrics(poll_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_overall_score ON quality_metrics(overall_score DESC);

-- System Configuration Indexes
CREATE INDEX IF NOT EXISTS idx_system_configuration_key ON system_configuration(key);
CREATE INDEX IF NOT EXISTS idx_system_configuration_active ON system_configuration(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configuration ENABLE ROW LEVEL SECURITY;

-- Trending Topics Policies
CREATE POLICY "Anyone can view trending topics" ON trending_topics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trending topics" ON trending_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

-- Generated Polls Policies
CREATE POLICY "Anyone can view approved generated polls" ON generated_polls
    FOR SELECT USING (status IN ('approved', 'active'));

CREATE POLICY "Admins can view all generated polls" ON generated_polls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

CREATE POLICY "Admins can manage generated polls" ON generated_polls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

-- Data Sources Policies
CREATE POLICY "Admins can manage data sources" ON data_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

-- Poll Generation Logs Policies
CREATE POLICY "Admins can view poll generation logs" ON poll_generation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

-- Quality Metrics Policies
CREATE POLICY "Anyone can view quality metrics for approved polls" ON quality_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM generated_polls 
            WHERE generated_polls.id = quality_metrics.poll_id 
            AND generated_polls.status IN ('approved', 'active')
        )
    );

CREATE POLICY "Admins can view all quality metrics" ON quality_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

-- System Configuration Policies
CREATE POLICY "Admins can manage system configuration" ON system_configuration
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.verification_tier IN ('T2', 'T3')
        )
    );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_trending_topics_updated_at 
    BEFORE UPDATE ON trending_topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_polls_updated_at 
    BEFORE UPDATE ON generated_polls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at 
    BEFORE UPDATE ON data_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_metrics_updated_at 
    BEFORE UPDATE ON quality_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at 
    BEFORE UPDATE ON system_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA INSERTION
-- ============================================================================

-- Insert default data sources
INSERT INTO data_sources (name, type, api_endpoint, rate_limit, reliability) VALUES
('NewsAPI.org', 'news', 'https://newsapi.org/v2', 1000, 0.95),
('Twitter API', 'social', 'https://api.twitter.com/2', 300, 0.90),
('Reddit API', 'social', 'https://www.reddit.com/api', 60, 0.85),
('Hacker News API', 'social', 'https://hacker-news.firebaseio.com/v0', 1000, 0.80),
('Google Trends', 'search', 'https://trends.google.com/trends/api', 100, 0.90)
ON CONFLICT (name) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_configuration (key, value, description) VALUES
('poll_generation', '{"enabled": true, "max_polls_per_day": 100, "min_quality_score": 0.7}', 'Poll generation settings'),
('data_sources', '{"refresh_interval_minutes": 15, "max_concurrent_requests": 5}', 'Data source settings'),
('quality_assurance', '{"auto_approval_threshold": 0.85, "require_human_review": true}', 'Quality assurance settings'),
('trending_analysis', '{"min_trending_score": 0.5, "max_topics_per_batch": 20}', 'Trending analysis settings')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
    p_velocity DECIMAL,
    p_momentum DECIMAL,
    p_sentiment DECIMAL,
    p_engagement JSONB
) RETURNS DECIMAL AS $$
DECLARE
    engagement_score DECIMAL := 0.0;
    final_score DECIMAL := 0.0;
BEGIN
    -- Extract engagement metrics from JSONB
    IF p_engagement IS NOT NULL THEN
        engagement_score := COALESCE((p_engagement->>'engagement_rate')::DECIMAL, 0.0);
    END IF;
    
    -- Calculate weighted score
    final_score := (
        p_velocity * 0.3 +
        p_momentum * 0.3 +
        ABS(p_sentiment) * 0.2 +
        engagement_score * 0.2
    );
    
    RETURN LEAST(GREATEST(final_score, 0.0), 10.0);
END;
$$ LANGUAGE plpgsql;

-- Function to update topic processing status
CREATE OR REPLACE FUNCTION update_topic_processing_status(
    p_topic_id UUID,
    p_status TEXT,
    p_analysis_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE trending_topics 
    SET 
        processing_status = p_status,
        analysis_data = COALESCE(p_analysis_data, analysis_data),
        last_processed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE last_processed_at END,
        updated_at = NOW()
    WHERE id = p_topic_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log poll generation step
CREATE OR REPLACE FUNCTION log_poll_generation_step(
    p_topic_id UUID,
    p_poll_id UUID,
    p_step TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO poll_generation_logs (
        topic_id, poll_id, generation_step, status, 
        error_message, processing_time_ms, metadata
    ) VALUES (
        p_topic_id, p_poll_id, p_step, p_status,
        p_error_message, p_processing_time_ms, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for trending topics with analysis
CREATE OR REPLACE VIEW trending_topics_with_analysis AS
SELECT 
    tt.*,
    COUNT(gp.id) as generated_polls_count,
    AVG(gp.quality_score) as avg_poll_quality
FROM trending_topics tt
LEFT JOIN generated_polls gp ON tt.id = gp.topic_id
GROUP BY tt.id;

-- View for generated polls with topic info
CREATE OR REPLACE VIEW generated_polls_with_topic AS
SELECT 
    gp.*,
    tt.title as topic_title,
    tt.source_name,
    tt.category as topic_category,
    tt.trending_score,
    qm.overall_score as quality_overall_score
FROM generated_polls gp
LEFT JOIN trending_topics tt ON gp.topic_id = tt.id
LEFT JOIN quality_metrics qm ON gp.id = qm.poll_id;

-- View for system health metrics
CREATE OR REPLACE VIEW system_health_metrics AS
SELECT 
    'trending_topics' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_processing,
    COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_processing,
    AVG(trending_score) as avg_trending_score
FROM trending_topics
UNION ALL
SELECT 
    'generated_polls' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_approval,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_polls,
    AVG(quality_score) as avg_quality_score
FROM generated_polls;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trending_topics IS 'Stores trending topics from various data sources';
COMMENT ON TABLE generated_polls IS 'Stores automatically generated polls from trending topics';
COMMENT ON TABLE data_sources IS 'Configuration for data sources used for topic detection';
COMMENT ON TABLE poll_generation_logs IS 'Audit log for poll generation process';
COMMENT ON TABLE quality_metrics IS 'Quality assessment metrics for generated polls';
COMMENT ON TABLE system_configuration IS 'System-wide configuration settings';

COMMENT ON COLUMN trending_topics.trending_score IS 'Calculated trending score (0-10)';
COMMENT ON COLUMN trending_topics.velocity IS 'Rate of topic growth';
COMMENT ON COLUMN trending_topics.momentum IS 'Acceleration of topic growth';
COMMENT ON COLUMN trending_topics.sentiment_score IS 'Sentiment analysis score (-1 to 1)';
COMMENT ON COLUMN generated_polls.quality_score IS 'Overall quality score (0-1)';
COMMENT ON COLUMN generated_polls.status IS 'Current status of the generated poll';

-- ============================================================================
-- GRANTS (if using separate roles)
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON trending_topics TO authenticated;
GRANT SELECT ON generated_polls TO authenticated;
GRANT SELECT ON quality_metrics TO authenticated;
GRANT SELECT ON trending_topics_with_analysis TO authenticated;
GRANT SELECT ON generated_polls_with_topic TO authenticated;
GRANT SELECT ON system_health_metrics TO authenticated;

-- Grant permissions to service role (for automated processes)
GRANT ALL ON trending_topics TO service_role;
GRANT ALL ON generated_polls TO service_role;
GRANT ALL ON data_sources TO service_role;
GRANT ALL ON poll_generation_logs TO service_role;
GRANT ALL ON quality_metrics TO service_role;
GRANT ALL ON system_configuration TO service_role;
GRANT EXECUTE ON FUNCTION calculate_trending_score TO service_role;
GRANT EXECUTE ON FUNCTION update_topic_processing_status TO service_role;
GRANT EXECUTE ON FUNCTION log_poll_generation_step TO service_role;


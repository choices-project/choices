
-- ============================================================================
-- AUTOMATED POLLS TABLES
-- ============================================================================

-- Trending Topics Table
CREATE TABLE IF NOT EXISTS trending_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    source_url TEXT,
    sentiment_score DECIMAL(3,2),
    engagement_score INTEGER DEFAULT 0,
    trending_score DECIMAL(5,2) DEFAULT 0.0,
    keywords TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Generated Polls Table
CREATE TABLE IF NOT EXISTS generated_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES trending_topics(id),
    title TEXT NOT NULL,
    description TEXT,
    options TEXT[] NOT NULL,
    voting_method TEXT DEFAULT 'single' CHECK (voting_method IN ('single', 'multiple', 'ranked')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'closed')),
    quality_score DECIMAL(3,2),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Sources Table
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('news', 'social', 'search', 'api')),
    url TEXT,
    api_key TEXT,
    rate_limit INTEGER DEFAULT 100,
    last_fetched TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll Generation Logs Table
CREATE TABLE IF NOT EXISTS poll_generation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES trending_topics(id),
    poll_id UUID REFERENCES generated_polls(id),
    action TEXT NOT NULL,
    details JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Metrics Table
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES generated_polls(id),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(5,2),
    threshold DECIMAL(5,2),
    passed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Configuration Table
CREATE TABLE IF NOT EXISTS system_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Trending topics indexes
CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON trending_topics(category);
CREATE INDEX IF NOT EXISTS idx_trending_topics_status ON trending_topics(status);
CREATE INDEX IF NOT EXISTS idx_trending_topics_trending_score ON trending_topics(trending_score DESC);

-- Generated polls indexes
CREATE INDEX IF NOT EXISTS idx_generated_polls_status ON generated_polls(status);
CREATE INDEX IF NOT EXISTS idx_generated_polls_topic_id ON generated_polls(topic_id);
CREATE INDEX IF NOT EXISTS idx_generated_polls_quality_score ON generated_polls(quality_score DESC);

-- Data sources indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);

-- Poll generation logs indexes
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_topic_id ON poll_generation_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_poll_id ON poll_generation_logs(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_generation_logs_created_at ON poll_generation_logs(created_at DESC);

-- Quality metrics indexes
CREATE INDEX IF NOT EXISTS idx_quality_metrics_poll_id ON quality_metrics(poll_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_metric_name ON quality_metrics(metric_name);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER update_system_configuration_updated_at
    BEFORE UPDATE ON system_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial data sources
INSERT INTO data_sources (name, type, url, status) VALUES
('News API', 'news', 'https://newsapi.org', 'active'),
('Twitter API', 'social', 'https://api.twitter.com', 'active'),
('Google Trends', 'search', 'https://trends.google.com', 'active')
ON CONFLICT DO NOTHING;

-- Insert system configuration
INSERT INTO system_configuration (key, value, description) VALUES
('automated_polls_enabled', 'true', 'Enable automated poll generation'),
('analysis_frequency_hours', '24', 'How often to analyze trending topics'),
('max_polls_per_day', '10', 'Maximum number of polls to generate per day'),
('quality_threshold', '0.7', 'Minimum quality score for poll approval')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trending_topics IS 'Stores trending topics for poll generation';
COMMENT ON TABLE generated_polls IS 'Stores automatically generated polls';
COMMENT ON TABLE data_sources IS 'Stores data sources for topic analysis';
COMMENT ON TABLE poll_generation_logs IS 'Logs poll generation activities';
COMMENT ON TABLE quality_metrics IS 'Stores quality metrics for generated polls';
COMMENT ON TABLE system_configuration IS 'Stores system configuration settings';

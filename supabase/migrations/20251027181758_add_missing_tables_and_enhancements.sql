-- Add missing tables and schema enhancements for optimal Choices platform
-- Created: 2025-10-27
-- Migration: add_missing_tables_and_enhancements

-- ============================================================================
-- SITE MESSAGES TABLE
-- ============================================================================
-- For admin announcements, maintenance notices, and platform communications

CREATE TABLE IF NOT EXISTS site_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  type TEXT DEFAULT 'announcement' CHECK (type IN ('announcement', 'maintenance', 'feature', 'warning', 'info', 'security')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'authenticated', 'admin', 'new_users', 'verified')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional fields for enhanced functionality
  dismissible BOOLEAN DEFAULT true,
  action_url TEXT,
  action_text TEXT,
  metadata JSONB DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ
);

-- ============================================================================
-- ENHANCED FEEDBACK TABLE COLUMNS
-- ============================================================================
-- Add missing columns to existing feedback table

DO $$ 
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'type') THEN
    ALTER TABLE feedback ADD COLUMN type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'sentiment') THEN
    ALTER TABLE feedback ADD COLUMN sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'screenshot') THEN
    ALTER TABLE feedback ADD COLUMN screenshot TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'user_journey') THEN
    ALTER TABLE feedback ADD COLUMN user_journey JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'ai_analysis') THEN
    ALTER TABLE feedback ADD COLUMN ai_analysis JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'metadata') THEN
    ALTER TABLE feedback ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  
  -- Add additional useful columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'severity') THEN
    ALTER TABLE feedback ADD COLUMN severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'reproducibility') THEN
    ALTER TABLE feedback ADD COLUMN reproducibility TEXT DEFAULT 'unknown' CHECK (reproducibility IN ('always', 'sometimes', 'rarely', 'unknown'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'impact_score') THEN
    ALTER TABLE feedback ADD COLUMN impact_score INTEGER DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 10);
  END IF;
END $$;

-- ============================================================================
-- USER SESSIONS TABLE
-- ============================================================================
-- For tracking user sessions and analytics

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  location JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  page_views INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  
  -- Performance metrics
  avg_page_load_time DECIMAL(10,3),
  total_session_duration INTEGER, -- in seconds
  bounce_rate DECIMAL(5,2),
  conversion_events JSONB DEFAULT '[]'
);

-- ============================================================================
-- PLATFORM ANALYTICS TABLE
-- ============================================================================
-- For comprehensive platform analytics and metrics

CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
  dimensions JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Indexing fields
  category TEXT,
  subcategory TEXT,
  source TEXT DEFAULT 'system'
);

-- ============================================================================
-- FEATURE USAGE TRACKING TABLE
-- ============================================================================
-- For tracking feature adoption and usage patterns

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'click', 'interact', 'complete', 'abandon')),
  context JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  duration INTEGER, -- in milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- SYSTEM HEALTH MONITORING TABLE
-- ============================================================================
-- For monitoring system health and performance

CREATE TABLE IF NOT EXISTS system_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  response_time INTEGER, -- in milliseconds
  error_rate DECIMAL(5,4), -- 0.0000 to 1.0000
  uptime_percentage DECIMAL(5,2),
  last_check TIMESTAMPTZ DEFAULT NOW(),
  next_check TIMESTAMPTZ,
  details JSONB DEFAULT '{}',
  alerts JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Site Messages RLS
ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active messages
CREATE POLICY "Anyone can read active site messages" ON site_messages
  FOR SELECT USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= NOW()) 
    AND (end_date IS NULL OR end_date >= NOW())
    AND (
      target_audience = 'all' 
      OR (target_audience = 'authenticated' AND auth.uid() IS NOT NULL)
      OR (target_audience = 'verified' AND EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND trust_tier IN ('T1', 'T2', 'T3')
      ))
    )
  );

-- Only admins can manage site messages
CREATE POLICY "Admins can manage site messages" ON site_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- User Sessions RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Platform Analytics RLS
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view platform analytics" ON platform_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can manage platform analytics" ON platform_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Feature Usage RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feature usage" ON feature_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage feature usage" ON feature_usage
  FOR ALL USING (auth.role() = 'service_role');

-- System Health RLS
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system health" ON system_health
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can manage system health" ON system_health
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Site Messages indexes
CREATE INDEX IF NOT EXISTS idx_site_messages_active ON site_messages(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_site_messages_priority ON site_messages(priority);
CREATE INDEX IF NOT EXISTS idx_site_messages_type ON site_messages(type);
CREATE INDEX IF NOT EXISTS idx_site_messages_target_audience ON site_messages(target_audience);
CREATE INDEX IF NOT EXISTS idx_site_messages_created_at ON site_messages(created_at DESC);

-- User Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- Platform Analytics indexes
CREATE INDEX IF NOT EXISTS idx_platform_analytics_metric_name ON platform_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_timestamp ON platform_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_category ON platform_analytics(category, subcategory);

-- Feature Usage indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_timestamp ON feature_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_action_type ON feature_usage(action_type);

-- System Health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_service_name ON system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(health_status);
CREATE INDEX IF NOT EXISTS idx_system_health_last_check ON system_health(last_check DESC);

-- Enhanced feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON feedback(severity);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_site_messages_updated_at 
  BEFORE UPDATE ON site_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Session cleanup function
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE is_active = true 
    AND last_activity < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Analytics aggregation function
CREATE OR REPLACE FUNCTION aggregate_platform_metrics(
  metric_name_param TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)
RETURNS TABLE (
  metric_name TEXT,
  total_value DECIMAL(15,4),
  avg_value DECIMAL(15,4),
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),
  count_records BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.metric_name,
    SUM(pa.metric_value) as total_value,
    AVG(pa.metric_value) as avg_value,
    MIN(pa.metric_value) as min_value,
    MAX(pa.metric_value) as max_value,
    COUNT(*) as count_records
  FROM platform_analytics pa
  WHERE pa.metric_name = metric_name_param
    AND pa.timestamp BETWEEN start_time AND end_time
  GROUP BY pa.metric_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample site messages
INSERT INTO site_messages (title, message, priority, type, target_audience) VALUES
  ('Welcome to Choices!', 'Thank you for joining our platform. We''re excited to have you participate in democratic decision-making.', 'medium', 'announcement', 'new_users'),
  ('Platform Maintenance', 'Scheduled maintenance will occur on Sunday from 2-4 AM EST. Some features may be temporarily unavailable.', 'high', 'maintenance', 'all'),
  ('New Feature: Trust Tiers', 'We''ve introduced trust tiers to ensure quality participation. Complete your profile to advance through tiers.', 'medium', 'feature', 'authenticated'),
  ('Security Update', 'We''ve enhanced our security measures. Please update your password if you haven''t done so recently.', 'urgent', 'security', 'all')
ON CONFLICT DO NOTHING;

-- Insert sample system health records
INSERT INTO system_health (service_name, health_status, response_time, error_rate, uptime_percentage) VALUES
  ('database', 'healthy', 45, 0.0001, 99.99),
  ('api', 'healthy', 120, 0.0005, 99.95),
  ('auth', 'healthy', 80, 0.0002, 99.98),
  ('storage', 'healthy', 200, 0.001, 99.90)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions
GRANT SELECT ON site_messages TO authenticated;
GRANT ALL ON site_messages TO service_role;

GRANT SELECT ON user_sessions TO authenticated;
GRANT ALL ON user_sessions TO service_role;

GRANT SELECT ON platform_analytics TO authenticated;
GRANT ALL ON platform_analytics TO service_role;

GRANT SELECT ON feature_usage TO authenticated;
GRANT ALL ON feature_usage TO service_role;

GRANT SELECT ON system_health TO authenticated;
GRANT ALL ON system_health TO service_role;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION cleanup_inactive_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION aggregate_platform_metrics(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_platform_metrics(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

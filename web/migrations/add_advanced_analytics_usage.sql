-- Migration: Add advanced analytics usage tracking
-- Purpose: Track user analytics requests for rate limiting (3 per week per user, admins unlimited)
-- Created: January 2025

-- Create table to track advanced analytics usage
CREATE TABLE IF NOT EXISTS advanced_analytics_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  analytics_type TEXT NOT NULL CHECK (analytics_type IN ('demographics', 'geographic', 'trust_tier', 'temporal', 'funnel')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate entries (same user, poll, type)
  CONSTRAINT unique_user_poll_type UNIQUE(user_id, poll_id, analytics_type)
);

-- Index for quick weekly lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_analytics_usage_user_week 
ON advanced_analytics_usage(user_id, created_at DESC);

-- Index for poll lookups
CREATE INDEX IF NOT EXISTS idx_analytics_usage_poll 
ON advanced_analytics_usage(poll_id);

-- Index for analytics type queries
CREATE INDEX IF NOT EXISTS idx_analytics_usage_type 
ON advanced_analytics_usage(analytics_type);

-- Index for cleanup queries (old entries)
CREATE INDEX IF NOT EXISTS idx_analytics_usage_created_at 
ON advanced_analytics_usage(created_at);

-- Enable Row Level Security
ALTER TABLE advanced_analytics_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage records
CREATE POLICY "Users can view their own analytics usage"
ON advanced_analytics_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can insert (for API endpoints)
CREATE POLICY "Service role can insert analytics usage"
ON advanced_analytics_usage
FOR INSERT
WITH CHECK (true); -- API endpoints use service role, so this is safe

-- Add comment for documentation
COMMENT ON TABLE advanced_analytics_usage IS 'Tracks advanced analytics usage for rate limiting. Users limited to 3 per week, admins unlimited.';
COMMENT ON COLUMN advanced_analytics_usage.analytics_type IS 'Type of analytics requested: demographics, geographic, trust_tier, temporal, or funnel';

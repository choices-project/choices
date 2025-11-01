-- Migration: Create user_followed_representatives table
-- Created: January 26, 2025
-- Purpose: Enable users to follow/unfollow representatives
-- 
-- This table tracks which representatives a user is following,
-- allowing for personalized dashboards and notifications.

-- Create the user_followed_representatives table
CREATE TABLE IF NOT EXISTS user_followed_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  representative_id INTEGER NOT NULL REFERENCES representatives_core(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notify_on_votes BOOLEAN DEFAULT true,
  notify_on_committee_activity BOOLEAN DEFAULT false,
  notify_on_public_statements BOOLEAN DEFAULT false,
  notify_on_events BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT, -- User's personal notes about this representative
  tags TEXT[], -- User-defined tags for organizing representatives
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only follow a representative once
  UNIQUE(user_id, representative_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_followed_representatives_user_id 
  ON user_followed_representatives(user_id);

CREATE INDEX IF NOT EXISTS idx_user_followed_representatives_representative_id 
  ON user_followed_representatives(representative_id);

CREATE INDEX IF NOT EXISTS idx_user_followed_representatives_created_at 
  ON user_followed_representatives(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_followed_representatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_followed_representatives_updated_at
  BEFORE UPDATE ON user_followed_representatives
  FOR EACH ROW
  EXECUTE FUNCTION update_user_followed_representatives_updated_at();

-- Enable Row Level Security
ALTER TABLE user_followed_representatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own followed representatives
CREATE POLICY "Users can view their own followed representatives"
  ON user_followed_representatives
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own followed representatives
CREATE POLICY "Users can follow representatives"
  ON user_followed_representatives
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own followed representatives
CREATE POLICY "Users can update their followed representatives"
  ON user_followed_representatives
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete (unfollow) their own followed representatives
CREATE POLICY "Users can unfollow representatives"
  ON user_followed_representatives
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_followed_representatives TO authenticated;
GRANT USAGE ON SEQUENCE user_followed_representatives_id_seq TO authenticated;

-- Add comment
COMMENT ON TABLE user_followed_representatives IS 'Tracks which representatives each user is following, with notification preferences';
COMMENT ON COLUMN user_followed_representatives.notify_on_votes IS 'Send notifications when representative votes on bills';
COMMENT ON COLUMN user_followed_representatives.notify_on_committee_activity IS 'Send notifications for committee meetings and activity';
COMMENT ON COLUMN user_followed_representatives.notify_on_public_statements IS 'Send notifications for public statements and press releases';
COMMENT ON COLUMN user_followed_representatives.notify_on_events IS 'Send notifications for town halls and public events';


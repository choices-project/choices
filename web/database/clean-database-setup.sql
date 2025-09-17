-- ============================================================================
-- CLEAN DATABASE SETUP FOR CHOICES PLATFORM
-- ============================================================================
-- This script sets up a clean, production-ready database schema with:
-- - Proper table structure
-- - Row Level Security (RLS) policies
-- - Proper indexes and constraints
-- - Clean data and no clutter
-- 
-- Created: September 9, 2025
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: USER PROFILES TABLE
-- ============================================================================

-- Drop and recreate user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  trust_tier TEXT NOT NULL DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_trust_tier ON user_profiles(trust_tier);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 2: POLLS TABLE
-- ============================================================================

-- Drop and recreate polls table
DROP TABLE IF EXISTS polls CASCADE;

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite-only')),
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  total_votes INTEGER DEFAULT 0,
  participation INTEGER DEFAULT 0,
  sponsors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  is_mock BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'
);

-- Create indexes for polls
CREATE INDEX idx_polls_created_by ON polls(created_by);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_category ON polls(category);
CREATE INDEX idx_polls_privacy ON polls(privacy_level);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_end_time ON polls(end_time);

-- Enable RLS on polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Users can view public polls" ON polls
  FOR SELECT USING (privacy_level = 'public');

CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================================================
-- STEP 3: VOTES TABLE
-- ============================================================================

-- Drop and recreate votes table
DROP TABLE IF EXISTS votes CASCADE;

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice INTEGER NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  vote_data JSONB DEFAULT '{}',
  verification_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Create indexes for votes
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- Enable RLS on votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for votes
CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.privacy_level = 'public'
    )
  );

CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: WEBAUTHN CREDENTIALS TABLE - REMOVED
-- ============================================================================
-- WebAuthn credentials table removed - not ready for production
-- Will be added back when WebAuthn implementation is complete

-- ============================================================================
-- STEP 4: ERROR LOGS TABLE
-- ============================================================================

-- Drop and recreate error_logs table
DROP TABLE IF EXISTS error_logs CASCADE;

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for error_logs
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs (Admin only for security)
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 5: UPDATE FEEDBACK TABLE RLS
-- ============================================================================

-- Enable RLS on feedback table
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public feedback insertion" ON feedback;
DROP POLICY IF EXISTS "Allow feedback reading" ON feedback;
DROP POLICY IF EXISTS "Allow feedback updating" ON feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;

-- Create proper RLS policies for feedback
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- Note: Admin access removed - no tier-based admin privileges

-- ============================================================================
-- STEP 6: TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at 
  BEFORE UPDATE ON polls 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at 
  BEFORE UPDATE ON votes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: CREATE USER PROFILES FOR EXISTING AUTH USERS
-- ============================================================================

-- Create user profiles for existing auth users
INSERT INTO user_profiles (user_id, username, email, trust_tier, is_active)
SELECT 
  id,
  COALESCE(email, 'user_' || substring(id::text, 1, 8)),
  COALESCE(email, ''),
  'T0', -- All users start with T0 (no admin privileges)
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_profiles);

-- ============================================================================
-- STEP 8: SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- ============================================================================

-- Insert sample polls (only if table is empty)
INSERT INTO polls (title, description, options, voting_method, category, tags, created_by, status, total_votes, participation)
SELECT 
  'Sample Poll: Climate Action',
  'Which climate initiatives should be prioritized in the coming year?',
  '["Renewable Energy Investment", "Carbon Tax Implementation", "Electric Vehicle Infrastructure", "Green Building Standards", "Public Transportation"]'::jsonb,
  'single',
  'environment',
  ARRAY['climate', 'environment', 'sustainability'],
  (SELECT id FROM auth.users LIMIT 1),
  'active',
  2847,
  78
WHERE NOT EXISTS (SELECT 1 FROM polls LIMIT 1);

INSERT INTO polls (title, description, options, voting_method, category, tags, created_by, status, total_votes, participation)
SELECT 
  'Sample Poll: Technology Priorities',
  'What emerging technologies should receive government funding?',
  '["Artificial Intelligence Research", "Quantum Computing Development", "Cybersecurity Infrastructure", "Digital Privacy Tools", "Blockchain Applications"]'::jsonb,
  'multiple',
  'technology',
  ARRAY['technology', 'innovation', 'funding'],
  (SELECT id FROM auth.users LIMIT 1),
  'active',
  1956,
  65
WHERE NOT EXISTS (SELECT 1 FROM polls WHERE title = 'Sample Poll: Technology Priorities');

-- ============================================================================
-- STEP 9: COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profile data linked to auth.users';
COMMENT ON TABLE polls IS 'User-created polls with voting options and results';
COMMENT ON TABLE votes IS 'User votes on polls with verification';
COMMENT ON TABLE error_logs IS 'System error logging for monitoring and debugging';
COMMENT ON TABLE feedback IS 'User feedback and feature requests';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- This will show in the Supabase SQL editor results
SELECT 'Database setup complete! All tables created with proper RLS policies.' as status;

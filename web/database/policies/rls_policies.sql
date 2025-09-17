-- ============================================================================
-- CHOICES PLATFORM - ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Phase 1: Database & Schema Implementation
-- Agent A - Database Specialist
-- 
-- This file contains all Row Level Security (RLS) policies for the platform.
-- These policies enforce poll lifecycle rules and vote management security.
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- ============================================================================
-- POLL LIFECYCLE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public polls" ON polls;
DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;

-- Users can view public polls
CREATE POLICY "Users can view public polls" ON polls
  FOR SELECT USING (privacy_level = 'public');

-- Users can view their own polls
CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create polls
CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own polls (with lifecycle restrictions)
CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (
    auth.uid() = created_by 
    AND locked_at IS NULL -- Cannot update locked polls
  );

-- Users can delete their own polls
CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================================================
-- VOTE MANAGEMENT RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view votes on public polls" ON votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

-- Users can view votes on public polls
CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.privacy_level = 'public'
    )
  );

-- Users can view their own votes
CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create votes (with poll lifecycle restrictions)
CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.status = 'active'
      AND (polls.end_time IS NULL OR polls.end_time > NOW())
      AND polls.locked_at IS NULL
    )
  );

-- Users can update their own votes (with poll lifecycle restrictions)
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.status = 'active'
      AND (polls.allow_post_close = true OR polls.end_time IS NULL OR polls.end_time > NOW())
      AND polls.locked_at IS NULL
    )
  );

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- WEBAUTHN CREDENTIALS RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can create their own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can delete their own credentials" ON webauthn_credentials;

-- Users can view their own credentials
CREATE POLICY "Users can view their own credentials" ON webauthn_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own credentials
CREATE POLICY "Users can create their own credentials" ON webauthn_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update their own credentials" ON webauthn_credentials
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own credentials" ON webauthn_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER PROFILES RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ERROR LOGS RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own error logs" ON error_logs;
DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;

-- Users can view their own error logs
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert error logs
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FEEDBACK RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- ADMIN-ONLY POLICIES (for future admin functionality)
-- ============================================================================

-- Note: These policies are prepared for future admin functionality
-- They are currently restrictive to maintain security

-- Admin can view all polls (restrictive for now)
CREATE POLICY "Admin can view all polls" ON polls
  FOR SELECT USING (false); -- Disabled until admin system is implemented

-- Admin can view all votes (restrictive for now)
CREATE POLICY "Admin can view all votes" ON votes
  FOR SELECT USING (false); -- Disabled until admin system is implemented

-- Admin can view all user profiles (restrictive for now)
CREATE POLICY "Admin can view all user profiles" ON user_profiles
  FOR SELECT USING (false); -- Disabled until admin system is implemented

-- ============================================================================
-- POLICY VERIFICATION QUERIES
-- ============================================================================

-- Verify all policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('polls', 'votes', 'webauthn_credentials', 'user_profiles', 'error_logs', 'feedback')
ORDER BY tablename, policyname;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- This completes the RLS policies setup.
-- All tables now have proper security policies enforcing poll lifecycle rules.

-- ============================================================================
-- CHOICES PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Phase 1: Database & Schema Implementation
-- Agent A - Database Specialist
-- 
-- This file contains the complete database schema for the Choices platform
-- including all core tables, constraints, indexes, and RLS policies.
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ============================================================================
-- POLLS TABLE
-- ============================================================================
-- Stores user-created polls with voting options and lifecycle controls

CREATE TABLE IF NOT EXISTS polls (
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
  settings JSONB DEFAULT '{}',
  
  -- Phase 1: Lifecycle Control Columns
  baseline_at TIMESTAMPTZ, -- When baseline results were captured
  allow_post_close BOOLEAN DEFAULT false, -- Allow voting after poll closes
  locked_at TIMESTAMPTZ -- When poll was locked (no more changes)
);

-- ============================================================================
-- VOTES TABLE
-- ============================================================================
-- Stores user votes with verification and voting method support

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice INTEGER NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  vote_data JSONB DEFAULT '{}', -- Flexible data for different voting methods
  verification_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vote per user per poll
  UNIQUE(poll_id, user_id)
);

-- ============================================================================
-- WEBAUTHN CREDENTIALS TABLE
-- ============================================================================
-- Stores WebAuthn passkey credentials for passwordless authentication

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id BYTEA NOT NULL UNIQUE, -- Binary credential ID
  public_key BYTEA NOT NULL, -- Binary public key
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] DEFAULT '{}', -- Supported transports (usb, nfc, ble, internal)
  name TEXT, -- User-friendly name for the credential
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
-- Extended user profile information

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  trust_tier TEXT NOT NULL DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ERROR LOGS TABLE
-- ============================================================================
-- System error logging for monitoring and debugging

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FEEDBACK TABLE
-- ============================================================================
-- User feedback and feature requests

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  screenshot TEXT, -- Base64 encoded image or URL
  user_journey JSONB, -- Store user journey data
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Polls indexes
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_category ON polls(category);
CREATE INDEX IF NOT EXISTS idx_polls_privacy ON polls(privacy_level);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);
CREATE INDEX IF NOT EXISTS idx_polls_baseline_at ON polls(baseline_at);
CREATE INDEX IF NOT EXISTS idx_polls_locked_at ON polls(locked_at);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_verification ON votes(is_verified);

-- WebAuthn credentials indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_active ON webauthn_credentials(is_active);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLLS RLS POLICIES
-- ============================================================================

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
-- VOTES RLS POLICIES
-- ============================================================================

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

-- Users can view their own error logs
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert error logs
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FEEDBACK RLS POLICIES
-- ============================================================================

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
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
CREATE TRIGGER update_polls_updated_at 
  BEFORE UPDATE ON polls 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at 
  BEFORE UPDATE ON votes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at 
  BEFORE UPDATE ON feedback 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE polls IS 'User-created polls with voting options, lifecycle controls, and results';
COMMENT ON TABLE votes IS 'User votes on polls with verification and flexible voting method support';
COMMENT ON TABLE webauthn_credentials IS 'WebAuthn passkey credentials for passwordless authentication';
COMMENT ON TABLE user_profiles IS 'Extended user profile data linked to auth.users';
COMMENT ON TABLE error_logs IS 'System error logging for monitoring and debugging';
COMMENT ON TABLE feedback IS 'User feedback and feature requests';

-- Column comments for polls table
COMMENT ON COLUMN polls.baseline_at IS 'Timestamp when baseline results were captured for comparison';
COMMENT ON COLUMN polls.allow_post_close IS 'Whether voting is allowed after poll closes';
COMMENT ON COLUMN polls.locked_at IS 'Timestamp when poll was locked (no more changes allowed)';

-- Column comments for votes table
COMMENT ON COLUMN votes.vote_data IS 'Flexible JSON data supporting different voting methods (ranked, approval, etc.)';
COMMENT ON COLUMN votes.verification_token IS 'Token for vote verification and integrity';

-- Column comments for webauthn_credentials table
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Binary WebAuthn credential identifier';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Binary public key for credential verification';
COMMENT ON COLUMN webauthn_credentials.counter IS 'Signature counter for replay attack prevention';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- This completes the core database schema setup.
-- Next: Run the results views and additional migration scripts.

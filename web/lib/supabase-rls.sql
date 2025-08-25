-- Supabase Row Level Security (RLS) Implementation
-- This file contains all RLS policies for the Choices platform

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS policies

-- Check if user is admin (T3 trust tier)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = is_admin.user_id 
    AND trust_tier = 'T3'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific trust tier
CREATE OR REPLACE FUNCTION has_trust_tier(user_id UUID, required_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = has_trust_tier.user_id 
    AND trust_tier >= required_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if poll is public
CREATE OR REPLACE FUNCTION is_public_poll(poll_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM polls 
    WHERE polls.id = is_public_poll.poll_id 
    AND privacy_level = 'public'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns the resource
CREATE OR REPLACE FUNCTION is_owner(user_id UUID, resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_id = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if poll is active
CREATE OR REPLACE FUNCTION is_active_poll(poll_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM polls 
    WHERE polls.id = is_active_poll.poll_id 
    AND status = 'active'
    AND NOW() BETWEEN start_time AND end_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Profiles RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (is_admin(auth.uid()));

-- Polls RLS Policies

-- Anyone can read public polls
CREATE POLICY "Anyone can read public polls" ON polls
  FOR SELECT USING (privacy_level = 'public');

-- Users can read private polls they created
CREATE POLICY "Users can read own private polls" ON polls
  FOR SELECT USING (
    privacy_level = 'private' AND created_by = auth.uid()
  );

-- Users with T2+ can read high-privacy polls
CREATE POLICY "T2+ users can read high-privacy polls" ON polls
  FOR SELECT USING (
    privacy_level = 'high-privacy' AND has_trust_tier(auth.uid(), 'T2')
  );

-- Users can create polls
CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update polls they created
CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete polls they created
CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (created_by = auth.uid());

-- Admins can read all polls
CREATE POLICY "Admins can read all polls" ON polls
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all polls
CREATE POLICY "Admins can update all polls" ON polls
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete all polls
CREATE POLICY "Admins can delete all polls" ON polls
  FOR DELETE USING (is_admin(auth.uid()));

-- Votes RLS Policies

-- Users can read their own votes
CREATE POLICY "Users can read own votes" ON votes
  FOR SELECT USING (user_id = auth.uid());

-- Users can read votes on public polls
CREATE POLICY "Users can read votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND privacy_level = 'public'
    )
  );

-- Users can read votes on polls they created
CREATE POLICY "Users can read votes on own polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND created_by = auth.uid()
    )
  );

-- Users can create votes on active polls
CREATE POLICY "Users can create votes on active polls" ON votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND is_active_poll(poll_id)
  );

-- Users can update their own votes (within time limit)
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    created_at > NOW() - INTERVAL '5 minutes'
  );

-- Users cannot delete votes (audit trail)
CREATE POLICY "No vote deletion allowed" ON votes
  FOR DELETE USING (false);

-- Admins can read all votes
CREATE POLICY "Admins can read all votes" ON votes
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all votes
CREATE POLICY "Admins can update all votes" ON votes
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete votes
CREATE POLICY "Admins can delete votes" ON votes
  FOR DELETE USING (is_admin(auth.uid()));

-- WebAuthn Credentials RLS Policies

-- Users can read their own credentials
CREATE POLICY "Users can read own credentials" ON webauthn_credentials
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own credentials
CREATE POLICY "Users can create own credentials" ON webauthn_credentials
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own credentials
CREATE POLICY "Users can update own credentials" ON webauthn_credentials
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials" ON webauthn_credentials
  FOR DELETE USING (user_id = auth.uid());

-- Admins can read all credentials
CREATE POLICY "Admins can read all credentials" ON webauthn_credentials
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all credentials
CREATE POLICY "Admins can update all credentials" ON webauthn_credentials
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete all credentials
CREATE POLICY "Admins can delete all credentials" ON webauthn_credentials
  FOR DELETE USING (is_admin(auth.uid()));

-- Error Logs RLS Policies

-- Users can read their own error logs
CREATE POLICY "Users can read own error logs" ON error_logs
  FOR SELECT USING (user_id = auth.uid());

-- Users can create error logs
CREATE POLICY "Users can create error logs" ON error_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users cannot update error logs (audit trail)
CREATE POLICY "No error log updates allowed" ON error_logs
  FOR UPDATE USING (false);

-- Users cannot delete error logs (audit trail)
CREATE POLICY "No error log deletion allowed" ON error_logs
  FOR DELETE USING (false);

-- Admins can read all error logs
CREATE POLICY "Admins can read all error logs" ON error_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update error logs
CREATE POLICY "Admins can update error logs" ON error_logs
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can delete error logs
CREATE POLICY "Admins can delete error logs" ON error_logs
  FOR DELETE USING (is_admin(auth.uid()));

-- Performance Indexes for RLS

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Indexes for polls
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_privacy_level ON polls(privacy_level);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_start_time ON polls(start_time);
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);

-- Indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_voting_method ON votes(voting_method);

-- Indexes for webauthn_credentials
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_is_active ON webauthn_credentials(is_active);

-- Indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_polls_status_privacy ON polls(status, privacy_level);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON votes(poll_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_active ON user_profiles(trust_tier, is_active);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_polls_title_description ON polls USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles USING gin(to_tsvector('english', username));

-- Audit triggers for data integrity

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webauthn_credentials_updated_at
  BEFORE UPDATE ON webauthn_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO error_logs (
    user_id,
    error_type,
    error_message,
    context,
    severity
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'AUDIT',
    TG_OP || ' on ' || TG_TABLE_NAME,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    ),
    'low'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit triggers for sensitive operations
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_polls
  AFTER INSERT OR UPDATE OR DELETE ON polls
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_votes
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_webauthn_credentials
  AFTER INSERT OR UPDATE OR DELETE ON webauthn_credentials
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

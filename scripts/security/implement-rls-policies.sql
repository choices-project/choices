-- Row Level Security (RLS) Implementation Script
-- This script enables RLS on all tables and creates appropriate policies
-- Run this script in your Supabase SQL editor

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

DROP POLICY IF EXISTS "Public polls are viewable" ON polls;
DROP POLICY IF EXISTS "Users can view own polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;
DROP POLICY IF EXISTS "Admins can manage all polls" ON polls;

DROP POLICY IF EXISTS "Users can view votes on public polls" ON votes;
DROP POLICY IF EXISTS "Users can view own votes" ON votes;
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
DROP POLICY IF EXISTS "Admins can view all votes" ON votes;

DROP POLICY IF EXISTS "Users can manage own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Admins can view all credentials" ON webauthn_credentials;

DROP POLICY IF EXISTS "Admins can view error logs" ON error_logs;
DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier = 'T3'
    )
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier = 'T3'
    )
  );

-- Polls Policies
CREATE POLICY "Public polls are viewable" ON polls
  FOR SELECT USING (privacy_level = 'public');

CREATE POLICY "Users can view own polls" ON polls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared polls" ON polls
  FOR SELECT USING (
    privacy_level = 'shared' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier IN ('T2', 'T3')
    )
  );

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own polls" ON polls
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all polls" ON polls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier = 'T3'
    )
  );

-- Votes Policies
CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id AND polls.privacy_level = 'public'
    )
  );

CREATE POLICY "Users can view own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view votes on own polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id AND polls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id AND 
      (polls.privacy_level = 'public' OR 
       polls.user_id = auth.uid() OR
       (polls.privacy_level = 'shared' AND 
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND trust_tier IN ('T2', 'T3')
        )
       )
      )
    )
  );

CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all votes" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier = 'T3'
    )
  );

-- WebAuthn Credentials Policies
CREATE POLICY "Users can manage own credentials" ON webauthn_credentials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credentials" ON webauthn_credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier = 'T3'
    )
  );

-- Error Logs Policies
CREATE POLICY "Admins can view error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND trust_tier = 'T3'
    )
  );

CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true); -- Allow system to insert logs

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_privacy_level ON polls(privacy_level);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid AND trust_tier = 'T3'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has trust tier
CREATE OR REPLACE FUNCTION has_trust_tier(user_uuid UUID DEFAULT auth.uid(), required_tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid AND trust_tier = required_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO error_logs (error_type, message, user_id)
    VALUES ('AUDIT', 'INSERT on ' || TG_TABLE_NAME || ' by user ' || auth.uid(), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO error_logs (error_type, message, user_id)
    VALUES ('AUDIT', 'UPDATE on ' || TG_TABLE_NAME || ' by user ' || auth.uid(), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO error_logs (error_type, message, user_id)
    VALUES ('AUDIT', 'DELETE on ' || TG_TABLE_NAME || ' by user ' || auth.uid(), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_user_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_polls_trigger
  AFTER INSERT OR UPDATE OR DELETE ON polls
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'polls', 'votes', 'webauthn_credentials', 'error_logs')
ORDER BY tablename;

-- Migration 001: Identity Unification
-- Phase 1.4 Week 1: Create canonical users view and add user_id to child tables
-- Created: 2025-08-25
-- Status: Ready for deployment

-- Step 1: Create canonical users view
CREATE OR REPLACE VIEW users AS
SELECT id, email, created_at FROM auth.users;

-- Step 2: Add user_id UUID to child tables
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE biometric_credentials ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE device_flows ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS created_by UUID;

-- Step 3: Backfill user relationships from existing stable_id mappings
-- This assumes we have a mapping table or can derive from existing data
UPDATE user_profiles 
SET user_id = auth.users.id 
FROM auth.users 
WHERE user_profiles.stable_id = auth.users.email 
  AND user_profiles.user_id IS NULL;

UPDATE biometric_credentials 
SET user_id = auth.users.id 
FROM auth.users 
WHERE biometric_credentials.user_stable_id = auth.users.email 
  AND biometric_credentials.user_id IS NULL;

UPDATE device_flows 
SET user_id = auth.users.id 
FROM auth.users 
WHERE device_flows.user_stable_id = auth.users.email 
  AND device_flows.user_id IS NULL;

UPDATE votes 
SET user_id = auth.users.id 
FROM auth.users 
WHERE votes.user_stable_id = auth.users.email 
  AND votes.user_id IS NULL;

UPDATE polls 
SET created_by = auth.users.id 
FROM auth.users 
WHERE polls.created_by_stable_id = auth.users.email 
  AND polls.created_by IS NULL;

-- Step 4: Add NOT NULL constraints after backfill
ALTER TABLE user_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE biometric_credentials ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE device_flows ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE polls ALTER COLUMN created_by SET NOT NULL;

-- Step 5: Add foreign key constraints
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE biometric_credentials 
ADD CONSTRAINT fk_biometric_credentials_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE device_flows 
ADD CONSTRAINT fk_device_flows_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE votes 
ADD CONSTRAINT fk_votes_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE polls 
ADD CONSTRAINT fk_polls_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON biometric_credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_device_flows_user_id ON device_flows (user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes (user_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls (created_by);

-- Step 7: Update RLS policies to use auth.uid()
DROP POLICY IF EXISTS user_profiles_read_own ON user_profiles;
CREATE POLICY user_profiles_read_own ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_profiles_write_own ON user_profiles;
CREATE POLICY user_profiles_write_own ON user_profiles
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS biometric_credentials_read_own ON biometric_credentials;
CREATE POLICY biometric_credentials_read_own ON biometric_credentials
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS biometric_credentials_write_own ON biometric_credentials;
CREATE POLICY biometric_credentials_write_own ON biometric_credentials
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS device_flows_read_own ON device_flows;
CREATE POLICY device_flows_read_own ON device_flows
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS device_flows_write_own ON device_flows;
CREATE POLICY device_flows_write_own ON device_flows
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS votes_read_own ON votes;
CREATE POLICY votes_read_own ON votes
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS votes_write_own ON votes;
CREATE POLICY votes_write_own ON votes
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS polls_read_own ON polls;
CREATE POLICY polls_read_own ON polls
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS polls_write_own ON polls;
CREATE POLICY polls_write_own ON polls
  FOR ALL USING (created_by = auth.uid());

-- Step 8: Add public aggregation policies for polls and votes
DROP POLICY IF EXISTS votes_read_aggregate ON votes;
CREATE POLICY votes_read_aggregate ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = votes.poll_id
        AND (p.status = 'closed' OR p.privacy_level = 'public')
    )
  ) WITH CHECK (false);

DROP POLICY IF EXISTS polls_read_public ON polls;
CREATE POLICY polls_read_public ON polls
  FOR SELECT USING (
    status = 'active' OR status = 'closed' OR privacy_level = 'public'
  ) WITH CHECK (false);

-- Log migration completion
INSERT INTO migration_log (migration_name, applied_at, status, details)
VALUES (
  '001-identity-unification',
  NOW(),
  'completed',
  'Successfully unified identity model with canonical users view and user_id foreign keys'
);


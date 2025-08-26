-- Migration 004: Device Flow Hardening
-- Phase 1.4 Week 3: Enhance device flow security with hashing and telemetry
-- Created: 2025-08-25
-- Status: Ready for deployment

-- Step 1: Add hashing and telemetry columns to device_flows table
ALTER TABLE device_flows
  ADD COLUMN IF NOT EXISTS device_code_hash BYTEA,
  ADD COLUMN IF NOT EXISTS user_code_hash BYTEA,
  ADD COLUMN IF NOT EXISTS interval_seconds INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS poll_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS user_agent_hash TEXT,
  ADD COLUMN IF NOT EXISTS success_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failure_reason TEXT;

-- Step 2: Create backup of existing codes before hashing
ALTER TABLE device_flows ADD COLUMN IF NOT EXISTS device_code_backup TEXT;
ALTER TABLE device_flows ADD COLUMN IF NOT EXISTS user_code_backup TEXT;

UPDATE device_flows 
SET 
  device_code_backup = device_code,
  user_code_backup = user_code
WHERE device_code_backup IS NULL;

-- Step 3: Create hashing function for device codes
CREATE OR REPLACE FUNCTION hash_device_code(code_value TEXT) RETURNS BYTEA AS $$
BEGIN
  -- Use SHA-256 for device code hashing
  RETURN sha256(code_value::bytea);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Hash existing device and user codes
UPDATE device_flows 
SET 
  device_code_hash = hash_device_code(device_code),
  user_code_hash = hash_device_code(user_code)
WHERE device_code_hash IS NULL;

-- Step 5: Add indexes for performance and TTL
CREATE INDEX IF NOT EXISTS idx_device_flows_expires ON device_flows (expires_at);
CREATE INDEX IF NOT EXISTS idx_device_flows_user_code_hash ON device_flows (user_code_hash);
CREATE INDEX IF NOT EXISTS idx_device_flows_retention ON device_flows (retention_expires_at);
CREATE INDEX IF NOT EXISTS idx_device_flows_status ON device_flows (status);
CREATE INDEX IF NOT EXISTS idx_device_flows_user_id ON device_flows (user_id);
CREATE INDEX IF NOT EXISTS idx_device_flows_provider ON device_flows (provider);

-- Step 6: Create function to create secure device flow
CREATE OR REPLACE FUNCTION create_secure_device_flow(
  p_provider TEXT,
  p_user_id UUID,
  p_redirect_to TEXT DEFAULT '/dashboard',
  p_scopes TEXT[] DEFAULT '{}',
  p_client_ip TEXT,
  p_user_agent TEXT
) RETURNS TABLE(
  device_code TEXT,
  user_code TEXT,
  verification_uri TEXT,
  expires_in INTEGER,
  interval INTEGER
) AS $$
DECLARE
  v_device_code TEXT;
  v_user_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_retention_expires_at TIMESTAMPTZ;
  v_verification_uri TEXT;
BEGIN
  -- Generate secure codes
  v_device_code := encode(gen_random_bytes(8), 'hex');
  v_user_code := encode(gen_random_bytes(8), 'hex');
  v_expires_at := NOW() + INTERVAL '10 minutes';
  v_retention_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Get verification URI for provider
  v_verification_uri := CASE p_provider
    WHEN 'google' THEN 'https://accounts.google.com/o/oauth2/device'
    WHEN 'github' THEN 'https://github.com/login/device'
    WHEN 'facebook' THEN 'https://www.facebook.com/device'
    WHEN 'twitter' THEN 'https://api.twitter.com/oauth/authenticate'
    WHEN 'linkedin' THEN 'https://www.linkedin.com/oauth/v2/authorization'
    WHEN 'discord' THEN 'https://discord.com/api/oauth2/authorize'
    ELSE 'https://accounts.google.com/o/oauth2/device'
  END;
  
  -- Store device flow with hashed codes
  INSERT INTO device_flows (
    device_code,
    user_code,
    device_code_hash,
    user_code_hash,
    provider,
    user_id,
    status,
    expires_at,
    retention_expires_at,
    redirect_to,
    scopes,
    client_ip_hash,
    user_agent_hash,
    created_at
  ) VALUES (
    v_device_code,
    v_user_code,
    hash_device_code(v_device_code),
    hash_device_code(v_user_code),
    p_provider,
    p_user_id,
    'pending',
    v_expires_at,
    v_retention_expires_at,
    p_redirect_to,
    p_scopes,
    hash_device_code(p_client_ip),
    hash_device_code(p_user_agent),
    NOW()
  );
  
  RETURN QUERY SELECT 
    v_device_code,
    v_user_code,
    v_verification_uri,
    600, -- 10 minutes in seconds
    5;   -- 5 seconds polling interval
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to verify device flow by user code
CREATE OR REPLACE FUNCTION verify_device_flow_by_user_code(
  p_user_code TEXT
) RETURNS TABLE(
  device_code TEXT,
  provider TEXT,
  user_id UUID,
  status TEXT,
  expires_at TIMESTAMPTZ,
  redirect_to TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.device_code,
    df.provider,
    df.user_id,
    df.status,
    df.expires_at,
    df.redirect_to
  FROM device_flows df
  WHERE df.user_code_hash = hash_device_code(p_user_code)
    AND df.status = 'pending'
    AND df.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to complete device flow
CREATE OR REPLACE FUNCTION complete_device_flow(
  p_user_code TEXT,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_device_flow_id UUID;
BEGIN
  -- Find and update device flow
  UPDATE device_flows
  SET 
    status = 'completed',
    user_id = p_user_id,
    completed_at = NOW(),
    success_count = success_count + 1
  WHERE user_code_hash = hash_device_code(p_user_code)
    AND status = 'pending'
    AND expires_at > NOW()
  RETURNING id INTO v_device_flow_id;
  
  RETURN v_device_flow_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to track polling telemetry
CREATE OR REPLACE FUNCTION track_device_flow_polling(
  p_device_code TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE device_flows
  SET 
    last_polled_at = NOW(),
    poll_count = poll_count + 1
  WHERE device_code_hash = hash_device_code(p_device_code)
    AND status = 'pending'
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to check device flow status
CREATE OR REPLACE FUNCTION check_device_flow_status(
  p_device_code TEXT
) RETURNS TABLE(
  status TEXT,
  user_id UUID,
  provider TEXT,
  expires_at TIMESTAMPTZ,
  poll_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.status,
    df.user_id,
    df.provider,
    df.expires_at,
    df.poll_count
  FROM device_flows df
  WHERE df.device_code_hash = hash_device_code(p_device_code)
    AND df.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create function to cleanup expired device flows
CREATE OR REPLACE FUNCTION cleanup_expired_device_flows() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired device flows
  DELETE FROM device_flows 
  WHERE expires_at < NOW() - INTERVAL '1 hour'
    AND status IN ('pending', 'expired');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Delete old completed flows
  DELETE FROM device_flows 
  WHERE retention_expires_at < NOW()
    AND status = 'completed';
  
  GET DIAGNOSTICS v_deleted_count = v_deleted_count + ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create function to get device flow analytics
CREATE OR REPLACE FUNCTION get_device_flow_analytics(
  p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE(
  provider TEXT,
  total_flows INTEGER,
  completed_flows INTEGER,
  expired_flows INTEGER,
  avg_poll_count NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.provider,
    COUNT(*)::INTEGER as total_flows,
    COUNT(CASE WHEN df.status = 'completed' THEN 1 END)::INTEGER as completed_flows,
    COUNT(CASE WHEN df.status = 'expired' THEN 1 END)::INTEGER as expired_flows,
    ROUND(AVG(df.poll_count), 2) as avg_poll_count,
    ROUND(
      COUNT(CASE WHEN df.status = 'completed' THEN 1 END)::NUMERIC / 
      COUNT(*)::NUMERIC * 100, 2
    ) as success_rate
  FROM device_flows df
  WHERE df.created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
  GROUP BY df.provider
  ORDER BY total_flows DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Add constraints for data integrity
ALTER TABLE device_flows 
  ADD CONSTRAINT chk_device_flows_interval_positive 
  CHECK (interval_seconds > 0);

ALTER TABLE device_flows 
  ADD CONSTRAINT chk_device_flows_poll_count_positive 
  CHECK (poll_count >= 0);

ALTER TABLE device_flows 
  ADD CONSTRAINT chk_device_flows_expires_future 
  CHECK (expires_at > created_at);

ALTER TABLE device_flows 
  ADD CONSTRAINT chk_device_flows_retention_after_expires 
  CHECK (retention_expires_at > expires_at);

-- Step 14: Create scheduled cleanup job
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-device-flows', '*/5 * * * *', 'SELECT cleanup_expired_device_flows();');

-- Step 15: Update RLS policies for enhanced security
DROP POLICY IF EXISTS device_flows_read_own ON device_flows;
CREATE POLICY device_flows_read_own ON device_flows
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS device_flows_write_own ON device_flows;
CREATE POLICY device_flows_write_own ON device_flows
  FOR ALL USING (user_id = auth.uid());

-- Step 16: Add comments for documentation
COMMENT ON TABLE device_flows IS 'Enhanced device flow authentication with hashed codes and telemetry';
COMMENT ON COLUMN device_flows.device_code_hash IS 'SHA-256 hash of device code for security';
COMMENT ON COLUMN device_flows.user_code_hash IS 'SHA-256 hash of user code for security';
COMMENT ON COLUMN device_flows.interval_seconds IS 'Polling interval in seconds';
COMMENT ON COLUMN device_flows.poll_count IS 'Number of polling attempts';
COMMENT ON COLUMN device_flows.retention_expires_at IS 'When to permanently delete this flow';

-- Step 17: Create cleanup function for old backup data
CREATE OR REPLACE FUNCTION cleanup_device_flow_backup_data() RETURNS void AS $$
BEGIN
  -- Remove backup columns after migration is verified
  -- ALTER TABLE device_flows DROP COLUMN device_code_backup;
  -- ALTER TABLE device_flows DROP COLUMN user_code_backup;
  
  -- This will be uncommented after migration verification
  RAISE NOTICE 'Backup cleanup ready for manual execution after verification';
END;
$$ LANGUAGE plpgsql;

-- Log migration completion
INSERT INTO migration_log (migration_name, applied_at, status, details)
VALUES (
  '004-device-flow-hardening',
  NOW(),
  'completed',
  'Successfully hardened device flow with hashed codes, telemetry, and enhanced security'
);

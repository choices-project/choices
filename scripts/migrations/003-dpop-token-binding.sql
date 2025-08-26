-- Migration 003: DPoP Token Binding and Session Safety
-- Phase 1.4 Week 4: Implement secure token storage with DPoP binding
-- Created: 2025-08-25
-- Status: Ready for deployment

-- Step 1: Add DPoP binding columns to ia_tokens table
ALTER TABLE ia_tokens
  ADD COLUMN IF NOT EXISTS dpop_jkt TEXT,
  ADD COLUMN IF NOT EXISTS rotated_from UUID,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS jti TEXT,
  ADD COLUMN IF NOT EXISTS nonce TEXT;

-- Step 2: Add DPoP binding columns to user_sessions table
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS dpop_jkt TEXT,
  ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS ua_hash TEXT,
  ADD COLUMN IF NOT EXISTS session_hash TEXT;

-- Step 3: Create DPoP replay guard table
CREATE TABLE IF NOT EXISTS dpop_replay_guard (
  jti TEXT PRIMARY KEY,
  jkt TEXT NOT NULL,
  htm TEXT NOT NULL,
  htu TEXT NOT NULL,
  iat TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Add indexes for DPoP performance
CREATE INDEX IF NOT EXISTS idx_tokens_user_expires ON ia_tokens (user_stable_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_jkt ON ia_tokens (dpop_jkt);
CREATE INDEX IF NOT EXISTS idx_tokens_revoked ON ia_tokens (revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tokens_jti ON ia_tokens (jti);
CREATE INDEX IF NOT EXISTS idx_tokens_rotated_from ON ia_tokens (rotated_from);

CREATE INDEX IF NOT EXISTS idx_user_sessions_dpop_jkt ON user_sessions (dpop_jkt);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_rotated ON user_sessions (last_rotated_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_hash ON user_sessions (ip_hash);

CREATE INDEX IF NOT EXISTS idx_dpop_replay_guard_expires ON dpop_replay_guard (expires_at);
CREATE INDEX IF NOT EXISTS idx_dpop_replay_guard_jkt ON dpop_replay_guard (jkt);

-- Step 5: Create DPoP binding functions
CREATE OR REPLACE FUNCTION add_dpop_binding(
  p_session_id TEXT,
  p_dpop_jkt TEXT,
  p_dpop_nonce TEXT,
  p_dpop_challenge TEXT,
  p_dpop_signature TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Add DPoP binding to session
  UPDATE user_sessions
  SET 
    dpop_jkt = p_dpop_jkt,
    updated_at = NOW()
  WHERE session_token = p_session_id;
  
  -- Store DPoP challenge for validation
  INSERT INTO dpop_challenges (
    session_id,
    dpop_jkt,
    dpop_nonce,
    dpop_challenge,
    dpop_signature,
    expires_at
  ) VALUES (
    p_session_id,
    p_dpop_jkt,
    p_dpop_nonce,
    p_dpop_challenge,
    p_dpop_signature,
    NOW() + INTERVAL '5 minutes'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create DPoP validation function
CREATE OR REPLACE FUNCTION validate_dpop_binding(
  p_session_id TEXT,
  p_dpop_jkt TEXT,
  p_dpop_nonce TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_session_exists BOOLEAN;
  v_challenge_exists BOOLEAN;
BEGIN
  -- Check if session exists and has matching DPoP binding
  SELECT EXISTS(
    SELECT 1 FROM user_sessions 
    WHERE session_token = p_session_id 
      AND dpop_jkt = p_dpop_jkt
      AND expires_at > NOW()
  ) INTO v_session_exists;
  
  -- Check if DPoP challenge exists and is valid
  SELECT EXISTS(
    SELECT 1 FROM dpop_challenges
    WHERE session_id = p_session_id
      AND dpop_jkt = p_dpop_jkt
      AND dpop_nonce = p_dpop_nonce
      AND expires_at > NOW()
      AND used_at IS NULL
  ) INTO v_challenge_exists;
  
  -- Mark challenge as used if valid
  IF v_challenge_exists THEN
    UPDATE dpop_challenges
    SET used_at = NOW()
    WHERE session_id = p_session_id
      AND dpop_jkt = p_dpop_jkt
      AND dpop_nonce = p_dpop_nonce;
  END IF;
  
  RETURN v_session_exists AND v_challenge_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create token hashing function
CREATE OR REPLACE FUNCTION hash_token(token_value TEXT) RETURNS TEXT AS $$
BEGIN
  -- Use SHA-256 for token hashing
  RETURN encode(sha256(token_value::bytea), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create secure token creation function
CREATE OR REPLACE FUNCTION create_secure_token(
  p_user_id UUID,
  p_dpop_jkt TEXT,
  p_rotated_from UUID DEFAULT NULL,
  p_expires_in_hours INTEGER DEFAULT 1
) RETURNS TABLE(
  token_id UUID,
  token_hash TEXT,
  jti TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_token_id UUID;
  v_token_value TEXT;
  v_jti TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate token ID and value
  v_token_id := gen_random_uuid();
  v_token_value := encode(gen_random_bytes(32), 'hex');
  v_jti := encode(gen_random_bytes(16), 'hex');
  v_expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
  
  -- Store hashed token
  INSERT INTO ia_tokens (
    id,
    user_stable_id,
    dpop_jkt,
    rotated_from,
    token_hash,
    jti,
    expires_at,
    created_at
  ) VALUES (
    v_token_id,
    p_user_id::TEXT,
    p_dpop_jkt,
    p_rotated_from,
    hash_token(v_token_value),
    v_jti,
    v_expires_at,
    NOW()
  );
  
  RETURN QUERY SELECT v_token_id, hash_token(v_token_value), v_jti, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create token rotation function
CREATE OR REPLACE FUNCTION rotate_token(
  p_old_token_id UUID,
  p_user_id UUID,
  p_dpop_jkt TEXT
) RETURNS TABLE(
  new_token_id UUID,
  new_token_hash TEXT,
  new_jti TEXT,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Revoke old token
  UPDATE ia_tokens
  SET revoked_at = NOW()
  WHERE id = p_old_token_id;
  
  -- Create new token
  RETURN QUERY
  SELECT * FROM create_secure_token(p_user_id, p_dpop_jkt, p_old_token_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create DPoP replay guard functions
CREATE OR REPLACE FUNCTION add_dpop_replay_guard(
  p_jti TEXT,
  p_jkt TEXT,
  p_htm TEXT,
  p_htu TEXT,
  p_iat TIMESTAMPTZ,
  p_expires_at TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO dpop_replay_guard (
    jti, jkt, htm, htu, iat, expires_at
  ) VALUES (
    p_jti, p_jkt, p_htm, p_htu, p_iat, p_expires_at
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- JTI already exists (replay attack)
    RETURN FALSE;
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create cleanup function for expired DPoP data
CREATE OR REPLACE FUNCTION cleanup_expired_dpop_data() RETURNS void AS $$
BEGIN
  -- Clean up expired DPoP replay guards
  DELETE FROM dpop_replay_guard WHERE expires_at < NOW();
  
  -- Clean up expired DPoP challenges
  DELETE FROM dpop_challenges WHERE expires_at < NOW();
  
  -- Clean up revoked tokens older than 24 hours
  DELETE FROM ia_tokens WHERE revoked_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create session privacy protection function
CREATE OR REPLACE FUNCTION hash_sensitive_data(data_value TEXT) RETURNS TEXT AS $$
BEGIN
  -- Use SHA-256 for sensitive data hashing
  RETURN encode(sha256(data_value::bytea), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create secure session creation function
CREATE OR REPLACE FUNCTION create_secure_session(
  p_user_id UUID,
  p_dpop_jkt TEXT,
  p_ip_address INET,
  p_user_agent TEXT
) RETURNS TABLE(
  session_id UUID,
  session_hash TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_session_id UUID;
  v_session_value TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate session ID and value
  v_session_id := gen_random_uuid();
  v_session_value := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Store hashed session with privacy protection
  INSERT INTO user_sessions (
    id,
    user_id,
    dpop_jkt,
    session_hash,
    ip_hash,
    ua_hash,
    expires_at,
    created_at
  ) VALUES (
    v_session_id,
    p_user_id,
    p_dpop_jkt,
    hash_sensitive_data(v_session_value),
    hash_sensitive_data(p_ip_address::TEXT),
    hash_sensitive_data(p_user_agent),
    v_expires_at,
    NOW()
  );
  
  RETURN QUERY SELECT v_session_id, hash_sensitive_data(v_session_value), v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Add constraints for data integrity
ALTER TABLE ia_tokens 
  ADD CONSTRAINT chk_tokens_expires_future 
  CHECK (expires_at > created_at);

ALTER TABLE ia_tokens 
  ADD CONSTRAINT chk_tokens_revoked_after_created 
  CHECK (revoked_at IS NULL OR revoked_at >= created_at);

ALTER TABLE dpop_replay_guard 
  ADD CONSTRAINT chk_dpop_replay_guard_expires_future 
  CHECK (expires_at > iat);

-- Step 15: Create scheduled cleanup job
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-dpop-data', '*/15 * * * *', 'SELECT cleanup_expired_dpop_data();');

-- Step 16: Add comments for documentation
COMMENT ON TABLE dpop_replay_guard IS 'DPoP replay protection table to prevent token reuse attacks';
COMMENT ON COLUMN ia_tokens.dpop_jkt IS 'DPoP JWK thumbprint for token binding';
COMMENT ON COLUMN ia_tokens.token_hash IS 'SHA-256 hash of the actual token value';
COMMENT ON COLUMN ia_tokens.jti IS 'JWT ID for unique token identification';
COMMENT ON COLUMN user_sessions.session_hash IS 'SHA-256 hash of the actual session value';
COMMENT ON COLUMN user_sessions.ip_hash IS 'SHA-256 hash of client IP address for privacy';

-- Log migration completion
INSERT INTO migration_log (migration_name, applied_at, status, details)
VALUES (
  '003-dpop-token-binding',
  NOW(),
  'completed',
  'Successfully implemented DPoP token binding, secure token storage, and session privacy protection'
);

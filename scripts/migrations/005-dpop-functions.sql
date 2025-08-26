-- DPoP Database Functions
-- Implements RFC 9449 compliant DPoP token binding functions

-- Create secure token with DPoP binding
CREATE OR REPLACE FUNCTION create_secure_token(
  p_user_id UUID,
  p_dpop_jkt TEXT,
  p_expires_in_hours INTEGER DEFAULT 24
) RETURNS TABLE(
  token_id UUID,
  token_hash TEXT,
  jti TEXT,
  expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token_id UUID;
  v_token TEXT;
  v_jti TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate secure token
  v_token_id := gen_random_uuid();
  v_token := encode(gen_random_bytes(32), 'base64url');
  v_jti := encode(gen_random_bytes(16), 'base64url');
  v_expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
  
  -- Insert token with hash
  INSERT INTO ia_tokens (
    id,
    user_stable_id,
    dpop_jkt,
    token_hash,
    jti,
    expires_at,
    created_at
  ) VALUES (
    v_token_id,
    p_user_id,
    p_dpop_jkt,
    encode(digest(v_token, 'sha256'), 'hex'),
    v_jti,
    v_expires_at,
    NOW()
  );
  
  RETURN QUERY SELECT v_token_id, v_token, v_jti, v_expires_at;
END;
$$;

-- Rotate token with DPoP binding
CREATE OR REPLACE FUNCTION rotate_token(
  p_old_token_id UUID,
  p_user_id UUID,
  p_dpop_jkt TEXT
) RETURNS TABLE(
  token_id UUID,
  token_hash TEXT,
  jti TEXT,
  expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_token_id UUID;
  v_new_token TEXT;
  v_new_jti TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate new token
  v_new_token_id := gen_random_uuid();
  v_new_token := encode(gen_random_bytes(32), 'base64url');
  v_new_jti := encode(gen_random_bytes(16), 'base64url');
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Revoke old token
  UPDATE ia_tokens 
  SET revoked_at = NOW() 
  WHERE id = p_old_token_id;
  
  -- Insert new token
  INSERT INTO ia_tokens (
    id,
    user_stable_id,
    dpop_jkt,
    token_hash,
    jti,
    expires_at,
    rotated_from,
    created_at
  ) VALUES (
    v_new_token_id,
    p_user_id,
    p_dpop_jkt,
    encode(digest(v_new_token, 'sha256'), 'hex'),
    v_new_jti,
    v_expires_at,
    p_old_token_id,
    NOW()
  );
  
  RETURN QUERY SELECT v_new_token_id, v_new_token, v_new_jti, v_expires_at;
END;
$$;

-- Create secure session with DPoP binding
CREATE OR REPLACE FUNCTION create_secure_session(
  p_user_id UUID,
  p_dpop_jkt TEXT,
  p_ip_address INET,
  p_user_agent TEXT
) RETURNS TABLE(
  session_id UUID,
  session_hash TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
  v_session_data TEXT;
BEGIN
  v_session_id := gen_random_uuid();
  v_session_data := p_user_id::TEXT || p_dpop_jkt || p_ip_address::TEXT || p_user_agent;
  
  INSERT INTO user_sessions (
    id,
    user_id,
    dpop_jkt,
    ip_hash,
    ua_hash,
    session_hash,
    created_at
  ) VALUES (
    v_session_id,
    p_user_id,
    p_dpop_jkt,
    encode(digest(p_ip_address::TEXT, 'sha256'), 'hex'),
    encode(digest(p_user_agent, 'sha256'), 'hex'),
    encode(digest(v_session_data, 'sha256'), 'hex'),
    NOW()
  );
  
  RETURN QUERY SELECT v_session_id, encode(digest(v_session_data, 'sha256'), 'hex');
END;
$$;

-- Validate DPoP binding
CREATE OR REPLACE FUNCTION validate_dpop_binding(
  p_session_id UUID,
  p_dpop_jkt TEXT,
  p_dpop_nonce TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_exists BOOLEAN;
  v_replay_exists BOOLEAN;
BEGIN
  -- Check if session exists and JKT matches
  SELECT EXISTS(
    SELECT 1 FROM user_sessions 
    WHERE id = p_session_id 
    AND dpop_jkt = p_dpop_jkt
    AND last_rotated_at IS NULL
  ) INTO v_session_exists;
  
  IF NOT v_session_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Check for replay attack
  SELECT EXISTS(
    SELECT 1 FROM dpop_replay_guard 
    WHERE jti = p_dpop_nonce
    AND expires_at > NOW()
  ) INTO v_replay_exists;
  
  IF v_replay_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Add replay guard
  INSERT INTO dpop_replay_guard (
    jti,
    jkt,
    htm,
    htu,
    iat,
    expires_at
  ) VALUES (
    p_dpop_nonce,
    p_dpop_jkt,
    'POST',
    '/api/auth/validate',
    EXTRACT(EPOCH FROM NOW()),
    NOW() + INTERVAL '5 minutes'
  );
  
  RETURN TRUE;
END;
$$;

-- Add DPoP replay guard
CREATE OR REPLACE FUNCTION add_dpop_replay_guard(
  p_jti TEXT,
  p_jkt TEXT,
  p_htm TEXT,
  p_htu TEXT,
  p_iat TIMESTAMPTZ,
  p_expires_at TIMESTAMPTZ
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO dpop_replay_guard (
    jti,
    jkt,
    htm,
    htu,
    iat,
    expires_at
  ) VALUES (
    p_jti,
    p_jkt,
    p_htm,
    p_htu,
    p_iat,
    p_expires_at
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$;

-- Cleanup expired DPoP data
CREATE OR REPLACE FUNCTION cleanup_expired_dpop_data()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired replay guards
  DELETE FROM dpop_replay_guard 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Delete expired tokens
  DELETE FROM ia_tokens 
  WHERE expires_at < NOW() 
  AND revoked_at IS NULL;
  
  RETURN v_deleted_count;
END;
$$;

-- Detect sign count regression for WebAuthn
CREATE OR REPLACE FUNCTION detect_sign_count_regression(
  p_user_id UUID,
  p_credential_id BYTEA,
  p_new_sign_count BIGINT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_sign_count BIGINT;
BEGIN
  -- Get current sign count
  SELECT sign_count INTO v_current_sign_count
  FROM webauthn_credentials
  WHERE user_id = p_user_id 
  AND credential_id = p_credential_id
  AND is_active = TRUE;
  
  -- Check for regression
  IF p_new_sign_count < v_current_sign_count THEN
    -- Mark as potential clone
    UPDATE webauthn_credentials
    SET clone_detected = TRUE,
        last_used_at = NOW()
    WHERE user_id = p_user_id 
    AND credential_id = p_credential_id;
    
    RETURN TRUE;
  END IF;
  
  -- Update sign count
  UPDATE webauthn_credentials
  SET sign_count = p_new_sign_count,
      last_used_at = NOW()
  WHERE user_id = p_user_id 
  AND credential_id = p_credential_id;
  
  RETURN FALSE;
END;
$$;

-- Update WebAuthn credential usage
CREATE OR REPLACE FUNCTION update_webauthn_credential_usage(
  p_user_id UUID,
  p_credential_id BYTEA,
  p_new_sign_count BIGINT,
  p_uv_result BOOLEAN
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE webauthn_credentials
  SET sign_count = p_new_sign_count,
      last_used_at = NOW(),
      last_uv_result = p_uv_result
  WHERE user_id = p_user_id 
  AND credential_id = p_credential_id
  AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$;

-- Get user WebAuthn credentials
CREATE OR REPLACE FUNCTION get_user_webauthn_credentials(
  p_user_id UUID
) RETURNS TABLE(
  id UUID,
  credential_id BYTEA,
  public_key BYTEA,
  sign_count BIGINT,
  aaguid TEXT,
  transports TEXT[],
  backup_eligible BOOLEAN,
  backup_state BOOLEAN,
  clone_detected BOOLEAN,
  last_used_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.credential_id,
    wc.public_key,
    wc.sign_count,
    wc.aaguid,
    wc.transports,
    wc.backup_eligible,
    wc.backup_state,
    wc.clone_detected,
    wc.last_used_at
  FROM webauthn_credentials wc
  WHERE wc.user_id = p_user_id
  AND wc.is_active = TRUE
  AND wc.clone_detected = FALSE
  ORDER BY wc.last_used_at DESC NULLS LAST;
END;
$$;

-- Create secure device flow
CREATE OR REPLACE FUNCTION create_secure_device_flow(
  p_provider TEXT,
  p_user_id UUID DEFAULT NULL,
  p_redirect_to TEXT DEFAULT '/dashboard',
  p_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],
  p_client_ip INET,
  p_user_agent TEXT
) RETURNS TABLE(
  device_code TEXT,
  user_code TEXT,
  verification_uri TEXT,
  expires_in INTEGER,
  interval INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_device_code TEXT;
  v_user_code TEXT;
  v_device_code_hash TEXT;
  v_user_code_hash TEXT;
  v_expires_at TIMESTAMPTZ;
  v_retention_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate secure codes
  v_device_code := encode(gen_random_bytes(4), 'base64url');
  v_user_code := encode(gen_random_bytes(4), 'base64url');
  
  -- Calculate hashes
  v_device_code_hash := encode(digest(v_device_code, 'sha256'), 'hex');
  v_user_code_hash := encode(digest(v_user_code, 'sha256'), 'hex');
  
  -- Set expiration times
  v_expires_at := NOW() + INTERVAL '10 minutes';
  v_retention_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Insert device flow
  INSERT INTO device_flows (
    device_code,
    user_code,
    device_code_hash,
    user_code_hash,
    provider,
    user_id,
    redirect_to,
    scopes,
    client_ip_hash,
    user_agent_hash,
    status,
    expires_at,
    retention_expires_at,
    created_at
  ) VALUES (
    v_device_code,
    v_user_code,
    v_device_code_hash,
    v_user_code_hash,
    p_provider,
    p_user_id,
    p_redirect_to,
    p_scopes,
    encode(digest(p_client_ip::TEXT, 'sha256'), 'hex'),
    encode(digest(p_user_agent, 'sha256'), 'hex'),
    'pending',
    v_expires_at,
    v_retention_expires_at,
    NOW()
  );
  
  RETURN QUERY SELECT 
    v_device_code,
    v_user_code,
    'https://accounts.google.com/o/oauth2/device', -- Default URI
    600, -- 10 minutes
    5;   -- 5 seconds
END;
$$;

-- Verify device flow by user code
CREATE OR REPLACE FUNCTION verify_device_flow_by_user_code(
  p_user_code TEXT
) RETURNS TABLE(
  device_code TEXT,
  provider TEXT,
  status TEXT,
  poll_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.device_code,
    df.provider,
    df.status,
    df.poll_count
  FROM device_flows df
  WHERE df.user_code = p_user_code
  AND df.status = 'pending'
  AND df.expires_at > NOW();
END;
$$;

-- Complete device flow
CREATE OR REPLACE FUNCTION complete_device_flow(
  p_user_code TEXT,
  p_user_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE device_flows
  SET status = 'completed',
      user_id = p_user_id,
      completed_at = NOW(),
      success_count = COALESCE(success_count, 0) + 1
  WHERE user_code = p_user_code
  AND status = 'pending'
  AND expires_at > NOW();
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$;

-- Track device flow polling
CREATE OR REPLACE FUNCTION track_device_flow_polling(
  p_device_code TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE device_flows
  SET poll_count = COALESCE(poll_count, 0) + 1,
      last_polled_at = NOW()
  WHERE device_code = p_device_code
  AND status = 'pending'
  AND expires_at > NOW();
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$;

-- Check device flow status
CREATE OR REPLACE FUNCTION check_device_flow_status(
  p_device_code TEXT
) RETURNS TABLE(
  status TEXT,
  provider TEXT,
  poll_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.status,
    df.provider,
    df.poll_count
  FROM device_flows df
  WHERE df.device_code = p_device_code
  AND df.expires_at > NOW();
END;
$$;

-- Get device flow analytics
CREATE OR REPLACE FUNCTION get_device_flow_analytics(
  p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE(
  provider TEXT,
  total_flows BIGINT,
  completed_flows BIGINT,
  expired_flows BIGINT,
  success_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    df.provider,
    COUNT(*) as total_flows,
    COUNT(CASE WHEN df.status = 'completed' THEN 1 END) as completed_flows,
    COUNT(CASE WHEN df.status = 'expired' THEN 1 END) as expired_flows,
    ROUND(
      (COUNT(CASE WHEN df.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)) * 100, 
      2
    ) as success_rate
  FROM device_flows df
  WHERE df.created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
  GROUP BY df.provider
  ORDER BY total_flows DESC;
END;
$$;

-- Cleanup expired device flows
CREATE OR REPLACE FUNCTION cleanup_expired_device_flows()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM device_flows
  WHERE (expires_at < NOW() AND status = 'expired')
  OR (retention_expires_at < NOW());
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_secure_token(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_token(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_secure_session(UUID, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_dpop_binding(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_dpop_replay_guard(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_dpop_data() TO authenticated;
GRANT EXECUTE ON FUNCTION detect_sign_count_regression(UUID, BYTEA, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_webauthn_credential_usage(UUID, BYTEA, BIGINT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_webauthn_credentials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_secure_device_flow(TEXT, UUID, TEXT, TEXT[], INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_device_flow_by_user_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_device_flow(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_device_flow_polling(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_device_flow_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_device_flow_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_device_flows() TO authenticated;

-- Log migration
INSERT INTO migration_log (
  migration_name,
  applied_at,
  description
) VALUES (
  '005-dpop-functions',
  NOW(),
  'Successfully implemented DPoP database functions for secure token binding, WebAuthn enhancement, and device flow hardening'
);

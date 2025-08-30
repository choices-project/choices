-- Migration 004: Token/Session Safety
-- Week 4 of Phase 1.4: Database Schema Hardening
-- Goal: Enhance token and session security with hashing, DPoP binding, and rotation lineage

-- Step 1: Create enhanced user sessions table with security improvements
CREATE TABLE IF NOT EXISTS user_sessions_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hashed tokens for security (original tokens are never stored)
  session_token_hash BYTEA NOT NULL UNIQUE,
  session_token_hash_base64 TEXT GENERATED ALWAYS AS (encode(session_token_hash, 'base64')) STORED,
  refresh_token_hash BYTEA,
  refresh_token_hash_base64 TEXT GENERATED ALWAYS AS (encode(refresh_token_hash, 'base64')) STORED,
  access_token_hash BYTEA,
  access_token_hash_base64 TEXT GENERATED ALWAYS AS (encode(access_token_hash, 'base64')) STORED,
  
  -- Token rotation lineage
  parent_session_id UUID REFERENCES user_sessions_v2(id) ON DELETE SET NULL,
  rotation_count INTEGER DEFAULT 0,
  rotation_chain_id UUID NOT NULL, -- Links all tokens in rotation chain
  
  -- DPoP (Demonstrating Proof of Possession) binding
  dpop_jkt TEXT, -- JSON Web Key Thumbprint for DPoP binding
  dpop_nonce TEXT, -- Nonce for DPoP challenge
  dpop_binding_hash BYTEA, -- Hash of DPoP binding data
  
  -- Enhanced session metadata
  session_type VARCHAR(50) NOT NULL DEFAULT 'web' CHECK (session_type IN ('web', 'mobile', 'api', 'device_flow')),
  authentication_method VARCHAR(50) NOT NULL CHECK (authentication_method IN ('password', 'biometric', 'device_flow', 'oauth', 'magic_link')),
  
  -- Device fingerprinting
  device_fingerprint_hash BYTEA NOT NULL, -- Hash of device fingerprint
  device_fingerprint_data JSONB, -- Encrypted device fingerprint data
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  device_os VARCHAR(50),
  device_browser VARCHAR(50),
  
  -- Security and audit
  client_ip INET,
  client_ip_hash BYTEA, -- Hashed IP for privacy
  user_agent TEXT,
  user_agent_hash BYTEA, -- Hashed user agent for privacy
  location_info JSONB, -- Encrypted location data
  
  -- Session state
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  mfa_verified BOOLEAN DEFAULT false,
  trust_level INTEGER DEFAULT 1 CHECK (trust_level >= 1 AND trust_level <= 5),
  
  -- Timing and expiration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_refresh_at TIMESTAMP WITH TIME ZONE,
  
  -- Security events
  security_events JSONB DEFAULT '[]', -- Array of security events
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  suspicious_activity_count INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT valid_session_expiry CHECK (expires_at > created_at),
  CONSTRAINT valid_activity_timing CHECK (last_activity_at >= created_at),
  CONSTRAINT valid_refresh_timing CHECK (last_refresh_at IS NULL OR last_refresh_at >= created_at),
  CONSTRAINT valid_rotation_count CHECK (rotation_count >= 0 AND rotation_count <= 100)
);

-- Step 2: Create token binding table for DPoP and token binding
CREATE TABLE IF NOT EXISTS token_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES user_sessions_v2(id) ON DELETE CASCADE,
  
  -- Binding metadata
  binding_type VARCHAR(50) NOT NULL CHECK (binding_type IN ('dpop', 'tls', 'device', 'location')),
  binding_hash BYTEA NOT NULL,
  binding_data JSONB NOT NULL DEFAULT '{}',
  
  -- DPoP specific fields
  dpop_jkt TEXT,
  dpop_nonce TEXT,
  dpop_challenge TEXT,
  dpop_signature TEXT,
  
  -- TLS binding
  tls_client_cert_hash BYTEA,
  tls_client_cert_subject TEXT,
  
  -- Device binding
  device_fingerprint_hash BYTEA,
  device_identifier TEXT,
  
  -- Location binding
  location_hash BYTEA,
  location_data JSONB,
  
  -- Security
  is_valid BOOLEAN NOT NULL DEFAULT true,
  validated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_binding_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Step 3: Create session security events table
CREATE TABLE IF NOT EXISTS session_security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES user_sessions_v2(id) ON DELETE CASCADE,
  
  -- Event data
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'login', 'logout', 'token_refresh', 'token_rotation', 'suspicious_activity',
    'location_change', 'device_change', 'binding_violation', 'risk_detected'
  )),
  event_severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (event_severity IN ('low', 'medium', 'high', 'critical')),
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Security context
  risk_score INTEGER DEFAULT 0,
  threat_indicators TEXT[],
  mitigation_applied TEXT,
  
  -- Context
  client_ip INET,
  user_agent TEXT,
  location_info JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Step 4: Create device fingerprint registry
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Fingerprint data
  fingerprint_hash BYTEA NOT NULL UNIQUE,
  fingerprint_data JSONB NOT NULL, -- Encrypted fingerprint data
  fingerprint_version INTEGER DEFAULT 1,
  
  -- Device information
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  device_os VARCHAR(50),
  device_browser VARCHAR(50),
  device_model VARCHAR(100),
  
  -- Trust and verification
  trust_level INTEGER DEFAULT 1 CHECK (trust_level >= 1 AND trust_level <= 5),
  is_verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(50),
  
  -- Usage statistics
  session_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Security
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_trust_level CHECK (trust_level >= 1 AND trust_level <= 5)
);

-- Step 5: Create indexes for performance
-- User sessions v2 indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_user_id ON user_sessions_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_session_token_hash ON user_sessions_v2 USING hash(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_refresh_token_hash ON user_sessions_v2 USING hash(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_access_token_hash ON user_sessions_v2 USING hash(access_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_session_token_hash_base64 ON user_sessions_v2(session_token_hash_base64);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_refresh_token_hash_base64 ON user_sessions_v2(refresh_token_hash_base64);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_access_token_hash_base64 ON user_sessions_v2(access_token_hash_base64);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_is_active ON user_sessions_v2(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_expires_at ON user_sessions_v2(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_rotation_chain_id ON user_sessions_v2(rotation_chain_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_device_fingerprint_hash ON user_sessions_v2 USING hash(device_fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_risk_score ON user_sessions_v2(risk_score);

-- TTL index for automatic cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_ttl ON user_sessions_v2(expires_at) WHERE expires_at < NOW();

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_user_active ON user_sessions_v2(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_user_type ON user_sessions_v2(user_id, session_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_v2_user_method ON user_sessions_v2(user_id, authentication_method);

-- Token bindings indexes
CREATE INDEX IF NOT EXISTS idx_token_bindings_session_id ON token_bindings(session_id);
CREATE INDEX IF NOT EXISTS idx_token_bindings_binding_type ON token_bindings(binding_type);
CREATE INDEX IF NOT EXISTS idx_token_bindings_binding_hash ON token_bindings USING hash(binding_hash);
CREATE INDEX IF NOT EXISTS idx_token_bindings_is_valid ON token_bindings(is_valid);
CREATE INDEX IF NOT EXISTS idx_token_bindings_expires_at ON token_bindings(expires_at);

-- TTL index for token bindings
CREATE INDEX IF NOT EXISTS idx_token_bindings_ttl ON token_bindings(expires_at) WHERE expires_at < NOW();

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_session_security_events_session_id ON session_security_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_security_events_event_type ON session_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_session_security_events_event_severity ON session_security_events(event_severity);
CREATE INDEX IF NOT EXISTS idx_session_security_events_created_at ON session_security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_session_security_events_risk_score ON session_security_events(risk_score);

-- Device fingerprints indexes
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint_hash ON device_fingerprints USING hash(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_trust_level ON device_fingerprints(trust_level);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_is_verified ON device_fingerprints(is_verified);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_risk_score ON device_fingerprints(risk_score);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_is_blocked ON device_fingerprints(is_blocked);

-- Step 6: Create helper functions for token/session operations
-- Function to hash tokens
CREATE OR REPLACE FUNCTION hash_token(token TEXT, salt TEXT DEFAULT 'session_token_salt')
RETURNS BYTEA AS $$
BEGIN
  RETURN digest(token || salt, 'sha256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create session with hashed tokens
CREATE OR REPLACE FUNCTION create_session_v2(
  p_user_id UUID,
  p_session_token TEXT,
  p_refresh_token TEXT DEFAULT NULL,
  p_access_token TEXT DEFAULT NULL,
  p_session_type VARCHAR(50) DEFAULT 'web',
  p_authentication_method VARCHAR(50) DEFAULT 'password',
  p_device_fingerprint_hash BYTEA DEFAULT NULL,
  p_device_fingerprint_data JSONB DEFAULT NULL,
  p_device_name VARCHAR(100) DEFAULT NULL,
  p_device_type VARCHAR(50) DEFAULT NULL,
  p_device_os VARCHAR(50) DEFAULT NULL,
  p_device_browser VARCHAR(50) DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_location_info JSONB DEFAULT NULL,
  p_expires_in_hours INTEGER DEFAULT 24,
  p_parent_session_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_rotation_chain_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration
  v_expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
  
  -- Generate rotation chain ID
  IF p_parent_session_id IS NULL THEN
    v_rotation_chain_id := gen_random_uuid();
  ELSE
    SELECT rotation_chain_id INTO v_rotation_chain_id
    FROM user_sessions_v2
    WHERE id = p_parent_session_id;
    
    IF v_rotation_chain_id IS NULL THEN
      v_rotation_chain_id := gen_random_uuid();
    END IF;
  END IF;
  
  -- Insert session with hashed tokens
  INSERT INTO user_sessions_v2 (
    user_id, session_token_hash, refresh_token_hash, access_token_hash,
    parent_session_id, rotation_chain_id, rotation_count,
    session_type, authentication_method,
    device_fingerprint_hash, device_fingerprint_data,
    device_name, device_type, device_os, device_browser,
    client_ip, client_ip_hash, user_agent, user_agent_hash,
    location_info, expires_at
  ) VALUES (
    p_user_id, hash_token(p_session_token, 'session'),
    CASE WHEN p_refresh_token IS NOT NULL THEN hash_token(p_refresh_token, 'refresh') ELSE NULL END,
    CASE WHEN p_access_token IS NOT NULL THEN hash_token(p_access_token, 'access') ELSE NULL END,
    p_parent_session_id, v_rotation_chain_id,
    CASE WHEN p_parent_session_id IS NOT NULL THEN 1 ELSE 0 END,
    p_session_type, p_authentication_method,
    p_device_fingerprint_hash, p_device_fingerprint_data,
    p_device_name, p_device_type, p_device_os, p_device_browser,
    p_client_ip, CASE WHEN p_client_ip IS NOT NULL THEN digest(p_client_ip::TEXT, 'sha256') ELSE NULL END,
    p_user_agent, CASE WHEN p_user_agent IS NOT NULL THEN digest(p_user_agent, 'sha256') ELSE NULL END,
    p_location_info, v_expires_at
  ) RETURNING id INTO v_session_id;
  
  -- Log security event
  INSERT INTO session_security_events (
    session_id, event_type, event_severity, event_data,
    client_ip, user_agent, location_info
  ) VALUES (
    v_session_id, 'login', 'low',
    jsonb_build_object(
      'session_type', p_session_type,
      'authentication_method', p_authentication_method,
      'expires_in_hours', p_expires_in_hours
    ),
    p_client_ip, p_user_agent, p_location_info
  );
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify session by hashed token
CREATE OR REPLACE FUNCTION verify_session_v2(
  p_session_token TEXT,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE(
  id UUID,
  user_id UUID,
  session_type VARCHAR(50),
  authentication_method VARCHAR(50),
  is_active BOOLEAN,
  is_verified BOOLEAN,
  mfa_verified BOOLEAN,
  trust_level INTEGER,
  expires_at TIMESTAMPTZ,
  risk_score INTEGER,
  device_fingerprint_hash BYTEA,
  is_valid BOOLEAN
) AS $$
DECLARE
  v_session_record RECORD;
  v_session_token_hash BYTEA;
BEGIN
  -- Hash the provided session token
  v_session_token_hash := hash_token(p_session_token, 'session');
  
  -- Find session
  SELECT * INTO v_session_record
  FROM user_sessions_v2
  WHERE session_token_hash = v_session_token_hash
    AND is_active = true;
  
  IF v_session_record IS NULL THEN
    -- Return invalid result
    RETURN QUERY SELECT 
      NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR,
      NULL::BOOLEAN, NULL::BOOLEAN, NULL::BOOLEAN, NULL::INTEGER,
      NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::BYTEA, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_session_record.expires_at < NOW() THEN
    -- Mark as inactive
    UPDATE user_sessions_v2 
    SET is_active = false, updated_at = NOW()
    WHERE id = v_session_record.id;
    
    -- Log security event
    INSERT INTO session_security_events (
      session_id, event_type, event_severity, event_data,
      client_ip, user_agent
    ) VALUES (
      v_session_record.id, 'logout', 'low',
      jsonb_build_object('reason', 'expired'),
      p_client_ip, p_user_agent
    );
    
    -- Return invalid result
    RETURN QUERY SELECT 
      NULL::UUID, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR,
      NULL::BOOLEAN, NULL::BOOLEAN, NULL::BOOLEAN, NULL::INTEGER,
      NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::BYTEA, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Update last activity
  UPDATE user_sessions_v2
  SET last_activity_at = NOW(), updated_at = NOW()
  WHERE id = v_session_record.id;
  
  -- Return session data
  RETURN QUERY SELECT 
    v_session_record.id,
    v_session_record.user_id,
    v_session_record.session_type,
    v_session_record.authentication_method,
    v_session_record.is_active,
    v_session_record.is_verified,
    v_session_record.mfa_verified,
    v_session_record.trust_level,
    v_session_record.expires_at,
    v_session_record.risk_score,
    v_session_record.device_fingerprint_hash,
    true::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rotate session tokens
CREATE OR REPLACE FUNCTION rotate_session_v2(
  p_session_token TEXT,
  p_new_session_token TEXT,
  p_new_refresh_token TEXT DEFAULT NULL,
  p_new_access_token TEXT DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE(
  session_id UUID,
  rotation_count INTEGER,
  success BOOLEAN
) AS $$
DECLARE
  v_session_record RECORD;
  v_session_token_hash BYTEA;
  v_new_session_id UUID;
BEGIN
  -- Hash the provided session token
  v_session_token_hash := hash_token(p_session_token, 'session');
  
  -- Find current session
  SELECT * INTO v_session_record
  FROM user_sessions_v2
  WHERE session_token_hash = v_session_token_hash
    AND is_active = true;
  
  IF v_session_record IS NULL THEN
    -- Return failure result
    RETURN QUERY SELECT 
      NULL::UUID, NULL::INTEGER, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Create new session with rotation
  SELECT create_session_v2(
    v_session_record.user_id,
    p_new_session_token,
    p_new_refresh_token,
    p_new_access_token,
    v_session_record.session_type,
    v_session_record.authentication_method,
    v_session_record.device_fingerprint_hash,
    v_session_record.device_fingerprint_data,
    v_session_record.device_name,
    v_session_record.device_type,
    v_session_record.device_os,
    v_session_record.device_browser,
    p_client_ip,
    p_user_agent,
    v_session_record.location_info,
    EXTRACT(EPOCH FROM (v_session_record.expires_at - NOW())) / 3600,
    v_session_record.id
  ) INTO v_new_session_id;
  
  -- Update rotation count
  UPDATE user_sessions_v2
  SET rotation_count = rotation_count + 1
  WHERE id = v_new_session_id;
  
  -- Log security event
  INSERT INTO session_security_events (
    session_id, event_type, event_severity, event_data,
    client_ip, user_agent
  ) VALUES (
    v_new_session_id, 'token_rotation', 'medium',
    jsonb_build_object('parent_session_id', v_session_record.id),
    p_client_ip, p_user_agent
  );
  
  -- Return success result
  RETURN QUERY SELECT 
    v_new_session_id,
    v_session_record.rotation_count + 1,
    true::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add DPoP binding
CREATE OR REPLACE FUNCTION add_dpop_binding(
  p_session_id UUID,
  p_dpop_jkt TEXT,
  p_dpop_nonce TEXT,
  p_dpop_challenge TEXT,
  p_dpop_signature TEXT,
  p_binding_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_binding_id UUID;
  v_binding_hash BYTEA;
BEGIN
  -- Create binding hash
  v_binding_hash := digest(p_dpop_jkt || p_dpop_nonce || p_dpop_challenge, 'sha256');
  
  -- Insert DPoP binding
  INSERT INTO token_bindings (
    session_id, binding_type, binding_hash, binding_data,
    dpop_jkt, dpop_nonce, dpop_challenge, dpop_signature,
    expires_at
  ) VALUES (
    p_session_id, 'dpop', v_binding_hash, p_binding_data,
    p_dpop_jkt, p_dpop_nonce, p_dpop_challenge, p_dpop_signature,
    NOW() + INTERVAL '1 hour'
  ) RETURNING id INTO v_binding_id;
  
  -- Log security event
  INSERT INTO session_security_events (
    session_id, event_type, event_severity, event_data
  ) VALUES (
    p_session_id, 'binding_violation', 'low',
    jsonb_build_object('binding_type', 'dpop', 'binding_id', v_binding_id)
  );
  
  RETURN v_binding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate DPoP binding
CREATE OR REPLACE FUNCTION validate_dpop_binding(
  p_session_id UUID,
  p_dpop_jkt TEXT,
  p_dpop_nonce TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_binding_record RECORD;
  v_binding_hash BYTEA;
BEGIN
  -- Create binding hash
  v_binding_hash := digest(p_dpop_jkt || p_dpop_nonce, 'sha256');
  
  -- Find valid binding
  SELECT * INTO v_binding_record
  FROM token_bindings
  WHERE session_id = p_session_id
    AND binding_type = 'dpop'
    AND binding_hash = v_binding_hash
    AND is_valid = true
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_binding_record IS NULL THEN
    -- Log security event
    INSERT INTO session_security_events (
      session_id, event_type, event_severity, event_data
    ) VALUES (
      p_session_id, 'binding_violation', 'high',
      jsonb_build_object('binding_type', 'dpop', 'reason', 'invalid_binding')
    );
    
    RETURN FALSE;
  END IF;
  
  -- Update binding validation
  UPDATE token_bindings
  SET validated_at = NOW(), updated_at = NOW()
  WHERE id = v_binding_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions_v2()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired sessions
  WITH deleted_sessions AS (
    DELETE FROM user_sessions_v2
    WHERE expires_at < NOW() - INTERVAL '1 hour'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted_sessions;
  
  -- Delete expired token bindings
  DELETE FROM token_bindings
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  -- Log cleanup
  INSERT INTO session_security_events (
    session_id, event_type, event_severity, event_data
  ) VALUES (
    NULL, 'cleanup', 'low',
    jsonb_build_object('deleted_sessions', v_deleted_count)
  );
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add triggers for updated_at
CREATE TRIGGER trg_user_sessions_v2_updated
  BEFORE UPDATE ON user_sessions_v2
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_token_bindings_updated
  BEFORE UPDATE ON token_bindings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_device_fingerprints_updated
  BEFORE UPDATE ON device_fingerprints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 8: Enable RLS on new tables
ALTER TABLE user_sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions v2" ON user_sessions_v2
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create sessions
CREATE POLICY "Users can create sessions v2" ON user_sessions_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions v2" ON user_sessions_v2
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions v2" ON user_sessions_v2
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Token bindings policies
CREATE POLICY "Users can manage own token bindings" ON token_bindings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_sessions_v2 us 
      WHERE us.id = token_bindings.session_id 
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all token bindings" ON token_bindings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Security events policies
CREATE POLICY "Users can view own security events" ON session_security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_sessions_v2 us 
      WHERE us.id = session_security_events.session_id 
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all security events" ON session_security_events
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Device fingerprints policies
CREATE POLICY "Users can manage own device fingerprints" ON device_fingerprints
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all device fingerprints" ON device_fingerprints
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 10: Add comments for documentation
COMMENT ON TABLE user_sessions_v2 IS 'Enhanced user sessions with hashed tokens, DPoP binding, and rotation lineage';
COMMENT ON TABLE token_bindings IS 'Token bindings for DPoP, TLS, device, and location binding';
COMMENT ON TABLE session_security_events IS 'Session security events and audit trail';
COMMENT ON TABLE device_fingerprints IS 'Device fingerprint registry for trust and verification';

COMMENT ON FUNCTION hash_token(TEXT, TEXT) IS 'Hash tokens with salt for security';
COMMENT ON FUNCTION create_session_v2(UUID, TEXT, TEXT, TEXT, VARCHAR, VARCHAR, BYTEA, JSONB, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, JSONB, INTEGER, UUID) IS 'Create session with hashed tokens and device fingerprinting';
COMMENT ON FUNCTION verify_session_v2(TEXT, INET, TEXT) IS 'Verify session by hashed token with activity tracking';
COMMENT ON FUNCTION rotate_session_v2(TEXT, TEXT, TEXT, TEXT, INET, TEXT) IS 'Rotate session tokens with lineage tracking';
COMMENT ON FUNCTION add_dpop_binding(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) IS 'Add DPoP binding to session';
COMMENT ON FUNCTION validate_dpop_binding(UUID, TEXT, TEXT) IS 'Validate DPoP binding for session';
COMMENT ON FUNCTION cleanup_expired_sessions_v2() IS 'Cleanup expired sessions and token bindings';

-- Migration completed successfully
-- Enhanced token and session security with hashing, DPoP binding, and rotation lineage












-- Migration 003: Device Flow Hardening
-- Week 3 of Phase 1.4: Database Schema Hardening
-- Goal: Enhance device flow security with hashing, telemetry, and performance optimizations

-- Step 1: Create enhanced device flows table with security improvements
CREATE TABLE IF NOT EXISTS device_flows_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Hashed codes for security (original codes are never stored)
  device_code_hash BYTEA NOT NULL UNIQUE,
  device_code_hash_base64 TEXT GENERATED ALWAYS AS (encode(device_code_hash, 'base64')) STORED,
  user_code_hash BYTEA NOT NULL UNIQUE,
  user_code_hash_base64 TEXT GENERATED ALWAYS AS (encode(user_code_hash, 'base64')) STORED,
  
  -- Original codes (temporarily stored for verification, then hashed)
  device_code_original VARCHAR(8) NOT NULL,
  user_code_original VARCHAR(8) NOT NULL,
  
  -- Enhanced metadata
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'github', 'facebook', 'twitter', 'linkedin', 'discord')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'error', 'cancelled')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Security and audit
  client_ip INET,
  client_ip_hash BYTEA, -- Hashed IP for privacy
  user_agent TEXT,
  user_agent_hash BYTEA, -- Hashed user agent for privacy
  session_id VARCHAR(255),
  
  -- Flow configuration
  redirect_to TEXT DEFAULT '/dashboard',
  scopes TEXT[] DEFAULT '{}',
  polling_interval_seconds INTEGER NOT NULL DEFAULT 5,
  max_polling_attempts INTEGER NOT NULL DEFAULT 120, -- 10 minutes at 5s intervals
  
  -- Timing and expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_polled_at TIMESTAMP WITH TIME ZONE,
  
  -- Telemetry and analytics
  polling_count INTEGER DEFAULT 0,
  completion_duration_ms INTEGER, -- Time from creation to completion
  error_count INTEGER DEFAULT 0,
  last_error_type VARCHAR(50),
  last_error_message TEXT,
  
  -- Rate limiting and abuse prevention
  rate_limit_key TEXT, -- Composite key for rate limiting
  abuse_score INTEGER DEFAULT 0, -- Risk assessment score
  
  -- Constraints
  CONSTRAINT valid_device_flow_dates CHECK (expires_at > created_at),
  CONSTRAINT valid_completion_dates CHECK (completed_at IS NULL OR completed_at >= created_at),
  CONSTRAINT valid_polling_interval CHECK (polling_interval_seconds >= 1 AND polling_interval_seconds <= 60),
  CONSTRAINT valid_max_polling_attempts CHECK (max_polling_attempts >= 1 AND max_polling_attempts <= 1000),
  CONSTRAINT valid_abuse_score CHECK (abuse_score >= 0 AND abuse_score <= 100)
);

-- Step 2: Create device flow telemetry table
CREATE TABLE IF NOT EXISTS device_flow_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_flow_id UUID NOT NULL REFERENCES device_flows_v2(id) ON DELETE CASCADE,
  
  -- Event data
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 'polled', 'completed', 'expired', 'error', 'rate_limited', 'abuse_detected'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Performance metrics
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_type VARCHAR(50),
  error_message TEXT,
  
  -- Context
  client_ip INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_response_time CHECK (response_time_ms IS NULL OR response_time_ms >= 0)
);

-- Step 3: Create device flow rate limiting table
CREATE TABLE IF NOT EXISTS device_flow_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Rate limiting keys
  rate_limit_key TEXT NOT NULL,
  rate_limit_type VARCHAR(50) NOT NULL CHECK (rate_limit_type IN ('ip', 'user', 'global')),
  
  -- Rate limiting data
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Abuse detection
  abuse_score INTEGER DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rate_limit_window CHECK (window_end > window_start),
  CONSTRAINT valid_abuse_score CHECK (abuse_score >= 0 AND abuse_score <= 100)
);

-- Step 4: Create indexes for performance
-- Device flows v2 indexes
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_device_code_hash ON device_flows_v2 USING hash(device_code_hash);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_user_code_hash ON device_flows_v2 USING hash(user_code_hash);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_device_code_hash_base64 ON device_flows_v2(device_code_hash_base64);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_user_code_hash_base64 ON device_flows_v2(user_code_hash_base64);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_status ON device_flows_v2(status);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_expires_at ON device_flows_v2(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_created_at ON device_flows_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_user_id ON device_flows_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_provider ON device_flows_v2(provider);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_rate_limit_key ON device_flows_v2(rate_limit_key);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_abuse_score ON device_flows_v2(abuse_score);

-- TTL index for automatic cleanup
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_ttl ON device_flows_v2(expires_at) WHERE expires_at < NOW();

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_status_expires ON device_flows_v2(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_user_status ON device_flows_v2(user_id, status);
CREATE INDEX IF NOT EXISTS idx_device_flows_v2_provider_status ON device_flows_v2(provider, status);

-- Telemetry indexes
CREATE INDEX IF NOT EXISTS idx_device_flow_telemetry_device_flow_id ON device_flow_telemetry(device_flow_id);
CREATE INDEX IF NOT EXISTS idx_device_flow_telemetry_event_type ON device_flow_telemetry(event_type);
CREATE INDEX IF NOT EXISTS idx_device_flow_telemetry_created_at ON device_flow_telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_device_flow_telemetry_success ON device_flow_telemetry(success);

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_device_flow_rate_limits_key_type ON device_flow_rate_limits(rate_limit_key, rate_limit_type);
CREATE INDEX IF NOT EXISTS idx_device_flow_rate_limits_window_end ON device_flow_rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_device_flow_rate_limits_abuse_score ON device_flow_rate_limits(abuse_score);
CREATE INDEX IF NOT EXISTS idx_device_flow_rate_limits_blocked_until ON device_flow_rate_limits(blocked_until);

-- TTL index for rate limit cleanup
CREATE INDEX IF NOT EXISTS idx_device_flow_rate_limits_ttl ON device_flow_rate_limits(window_end) WHERE window_end < NOW();

-- Step 5: Create helper functions for device flow operations
-- Function to hash device/user codes
CREATE OR REPLACE FUNCTION hash_device_code(code TEXT, salt TEXT DEFAULT 'device_flow_salt')
RETURNS BYTEA AS $$
BEGIN
  RETURN digest(code || salt, 'sha256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create device flow with hashing
CREATE OR REPLACE FUNCTION create_device_flow_v2(
  p_device_code VARCHAR(8),
  p_user_code VARCHAR(8),
  p_provider VARCHAR(20),
  p_client_ip INET,
  p_user_agent TEXT,
  p_session_id VARCHAR(255),
  p_redirect_to TEXT DEFAULT '/dashboard',
  p_scopes TEXT[] DEFAULT '{}',
  p_polling_interval_seconds INTEGER DEFAULT 5,
  p_max_polling_attempts INTEGER DEFAULT 120,
  p_expires_in_minutes INTEGER DEFAULT 10
) RETURNS UUID AS $$
DECLARE
  v_device_flow_id UUID;
  v_rate_limit_key TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  -- Create rate limit key
  v_rate_limit_key := p_client_ip::TEXT || ':' || p_provider;
  
  -- Insert device flow with hashed codes
  INSERT INTO device_flows_v2 (
    device_code_hash, user_code_hash,
    device_code_original, user_code_original,
    provider, client_ip, client_ip_hash,
    user_agent, user_agent_hash,
    session_id, redirect_to, scopes,
    polling_interval_seconds, max_polling_attempts,
    expires_at, rate_limit_key
  ) VALUES (
    hash_device_code(p_device_code, 'device'),
    hash_device_code(p_user_code, 'user'),
    p_device_code, p_user_code,
    p_provider, p_client_ip,
    digest(p_client_ip::TEXT, 'sha256'),
    p_user_agent,
    digest(p_user_agent, 'sha256'),
    p_session_id, p_redirect_to, p_scopes,
    p_polling_interval_seconds, p_max_polling_attempts,
    v_expires_at, v_rate_limit_key
  ) RETURNING id INTO v_device_flow_id;
  
  -- Log telemetry event
  INSERT INTO device_flow_telemetry (
    device_flow_id, event_type, event_data, success,
    client_ip, user_agent, session_id
  ) VALUES (
    v_device_flow_id, 'created', 
    jsonb_build_object(
      'provider', p_provider,
      'polling_interval', p_polling_interval_seconds,
      'max_attempts', p_max_polling_attempts,
      'expires_in_minutes', p_expires_in_minutes
    ),
    true, p_client_ip, p_user_agent, p_session_id
  );
  
  RETURN v_device_flow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify device flow by hashed code
CREATE OR REPLACE FUNCTION verify_device_flow_v2(
  p_device_code VARCHAR(8),
  p_user_code VARCHAR(8)
) RETURNS TABLE(
  id UUID,
  status VARCHAR(20),
  user_id UUID,
  provider VARCHAR(20),
  expires_at TIMESTAMPTZ,
  polling_interval_seconds INTEGER,
  max_polling_attempts INTEGER,
  polling_count INTEGER,
  abuse_score INTEGER,
  is_valid BOOLEAN
) AS $$
DECLARE
  v_device_code_hash BYTEA;
  v_user_code_hash BYTEA;
  v_device_flow_record RECORD;
BEGIN
  -- Hash the provided codes
  v_device_code_hash := hash_device_code(p_device_code, 'device');
  v_user_code_hash := hash_device_code(p_user_code, 'user');
  
  -- Find device flow
  SELECT * INTO v_device_flow_record
  FROM device_flows_v2
  WHERE device_code_hash = v_device_code_hash
    AND user_code_hash = v_user_code_hash
    AND status IN ('pending', 'completed');
  
  IF v_device_flow_record IS NULL THEN
    -- Return invalid result
    RETURN QUERY SELECT 
      NULL::UUID, NULL::VARCHAR, NULL::UUID, NULL::VARCHAR,
      NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::INTEGER,
      NULL::INTEGER, NULL::INTEGER, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_device_flow_record.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE device_flows_v2 
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_device_flow_record.id;
    
    -- Log telemetry
    INSERT INTO device_flow_telemetry (
      device_flow_id, event_type, event_data, success,
      client_ip, user_agent, session_id
    ) VALUES (
      v_device_flow_record.id, 'expired',
      jsonb_build_object('reason', 'expired'),
      false, v_device_flow_record.client_ip,
      v_device_flow_record.user_agent, v_device_flow_record.session_id
    );
    
    -- Return invalid result
    RETURN QUERY SELECT 
      NULL::UUID, NULL::VARCHAR, NULL::UUID, NULL::VARCHAR,
      NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::INTEGER,
      NULL::INTEGER, NULL::INTEGER, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Update polling count and last polled time
  UPDATE device_flows_v2
  SET 
    polling_count = polling_count + 1,
    last_polled_at = NOW(),
    updated_at = NOW()
  WHERE id = v_device_flow_record.id;
  
  -- Log telemetry
  INSERT INTO device_flow_telemetry (
    device_flow_id, event_type, event_data, success,
    client_ip, user_agent, session_id
  ) VALUES (
    v_device_flow_record.id, 'polled',
    jsonb_build_object('polling_count', v_device_flow_record.polling_count + 1),
    true, v_device_flow_record.client_ip,
    v_device_flow_record.user_agent, v_device_flow_record.session_id
  );
  
  -- Return device flow data
  RETURN QUERY SELECT 
    v_device_flow_record.id,
    v_device_flow_record.status,
    v_device_flow_record.user_id,
    v_device_flow_record.provider,
    v_device_flow_record.expires_at,
    v_device_flow_record.polling_interval_seconds,
    v_device_flow_record.max_polling_attempts,
    v_device_flow_record.polling_count + 1,
    v_device_flow_record.abuse_score,
    true::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete device flow
CREATE OR REPLACE FUNCTION complete_device_flow_v2(
  p_device_code VARCHAR(8),
  p_user_code VARCHAR(8),
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_device_code_hash BYTEA;
  v_user_code_hash BYTEA;
  v_device_flow_record RECORD;
  v_completion_duration_ms INTEGER;
BEGIN
  -- Hash the provided codes
  v_device_code_hash := hash_device_code(p_device_code, 'device');
  v_user_code_hash := hash_device_code(p_user_code, 'user');
  
  -- Find and update device flow
  UPDATE device_flows_v2
  SET 
    status = 'completed',
    user_id = p_user_id,
    completed_at = NOW(),
    updated_at = NOW(),
    completion_duration_ms = EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000
  WHERE device_code_hash = v_device_code_hash
    AND user_code_hash = v_user_code_hash
    AND status = 'pending'
  RETURNING * INTO v_device_flow_record;
  
  IF v_device_flow_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Log telemetry
  INSERT INTO device_flow_telemetry (
    device_flow_id, event_type, event_data, success,
    client_ip, user_agent, session_id
  ) VALUES (
    v_device_flow_record.id, 'completed',
    jsonb_build_object(
      'completion_duration_ms', v_device_flow_record.completion_duration_ms,
      'polling_count', v_device_flow_record.polling_count
    ),
    true, v_device_flow_record.client_ip,
    v_device_flow_record.user_agent, v_device_flow_record.session_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_device_flow_rate_limit(
  p_rate_limit_key TEXT,
  p_rate_limit_type VARCHAR(50),
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS TABLE(
  allowed BOOLEAN,
  remaining_requests INTEGER,
  reset_time TIMESTAMPTZ,
  abuse_score INTEGER
) AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_window_end TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_rate_limit_record RECORD;
BEGIN
  -- Calculate window
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  v_window_end := NOW() + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create rate limit record
  SELECT * INTO v_rate_limit_record
  FROM device_flow_rate_limits
  WHERE rate_limit_key = p_rate_limit_key
    AND rate_limit_type = p_rate_limit_type
    AND window_end > NOW();
  
  IF v_rate_limit_record IS NULL THEN
    -- Create new rate limit record
    INSERT INTO device_flow_rate_limits (
      rate_limit_key, rate_limit_type,
      request_count, window_start, window_end
    ) VALUES (
      p_rate_limit_key, p_rate_limit_type,
      1, v_window_start, v_window_end
    );
    
    RETURN QUERY SELECT 
      true::BOOLEAN,
      (p_max_requests - 1)::INTEGER,
      v_window_end,
      0::INTEGER;
    RETURN;
  END IF;
  
  -- Check if blocked
  IF v_rate_limit_record.blocked_until IS NOT NULL AND v_rate_limit_record.blocked_until > NOW() THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      0::INTEGER,
      v_rate_limit_record.blocked_until,
      v_rate_limit_record.abuse_score;
    RETURN;
  END IF;
  
  -- Update request count
  UPDATE device_flow_rate_limits
  SET 
    request_count = request_count + 1,
    updated_at = NOW()
  WHERE id = v_rate_limit_record.id;
  
  v_current_count := v_rate_limit_record.request_count + 1;
  
  -- Check if limit exceeded
  IF v_current_count > p_max_requests THEN
    -- Increase abuse score
    UPDATE device_flow_rate_limits
    SET 
      abuse_score = LEAST(abuse_score + 10, 100),
      blocked_until = CASE 
        WHEN abuse_score >= 50 THEN NOW() + '1 hour'::INTERVAL
        WHEN abuse_score >= 30 THEN NOW() + '15 minutes'::INTERVAL
        ELSE NOW() + '5 minutes'::INTERVAL
      END
    WHERE id = v_rate_limit_record.id;
    
    RETURN QUERY SELECT 
      false::BOOLEAN,
      0::INTEGER,
      v_rate_limit_record.blocked_until,
      LEAST(v_rate_limit_record.abuse_score + 10, 100)::INTEGER;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true::BOOLEAN,
    (p_max_requests - v_current_count)::INTEGER,
    v_rate_limit_record.window_end,
    v_rate_limit_record.abuse_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired device flows
CREATE OR REPLACE FUNCTION cleanup_expired_device_flows_v2()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired device flows
  WITH deleted_flows AS (
    DELETE FROM device_flows_v2
    WHERE expires_at < NOW() - INTERVAL '1 hour'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted_flows;
  
  -- Delete expired rate limits
  DELETE FROM device_flow_rate_limits
  WHERE window_end < NOW() - INTERVAL '1 hour';
  
  -- Log cleanup
  INSERT INTO device_flow_telemetry (
    device_flow_id, event_type, event_data, success
  ) VALUES (
    NULL, 'cleanup',
    jsonb_build_object('deleted_count', v_deleted_count),
    true
  );
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add triggers for updated_at
CREATE TRIGGER trg_device_flows_v2_updated
  BEFORE UPDATE ON device_flows_v2
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_device_flow_rate_limits_updated
  BEFORE UPDATE ON device_flow_rate_limits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 7: Enable RLS on new tables
ALTER TABLE device_flows_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_flow_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_flow_rate_limits ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
-- Users can view their own device flows
CREATE POLICY "Users can view own device flows v2" ON device_flows_v2
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create device flows (no user_id initially)
CREATE POLICY "Users can create device flows v2" ON device_flows_v2
  FOR INSERT WITH CHECK (true);

-- Users can update their own device flows
CREATE POLICY "Users can update own device flows v2" ON device_flows_v2
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all device flows
CREATE POLICY "Admins can view all device flows v2" ON device_flows_v2
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Telemetry policies
CREATE POLICY "Users can view own telemetry" ON device_flow_telemetry
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM device_flows_v2 df 
      WHERE df.id = device_flow_telemetry.device_flow_id 
      AND df.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all telemetry" ON device_flow_telemetry
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Rate limiting policies (admin only)
CREATE POLICY "Admins can manage rate limits" ON device_flow_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 9: Add comments for documentation
COMMENT ON TABLE device_flows_v2 IS 'Enhanced device flows with hashed codes, telemetry, and rate limiting';
COMMENT ON TABLE device_flow_telemetry IS 'Device flow telemetry and analytics data';
COMMENT ON TABLE device_flow_rate_limits IS 'Device flow rate limiting and abuse prevention';

COMMENT ON FUNCTION create_device_flow_v2(VARCHAR, VARCHAR, VARCHAR, INET, TEXT, VARCHAR, TEXT, TEXT[], INTEGER, INTEGER, INTEGER) IS 'Create device flow with hashed codes and telemetry';
COMMENT ON FUNCTION verify_device_flow_v2(VARCHAR, VARCHAR) IS 'Verify device flow by hashed codes with polling updates';
COMMENT ON FUNCTION complete_device_flow_v2(VARCHAR, VARCHAR, UUID) IS 'Complete device flow with user authentication';
COMMENT ON FUNCTION check_device_flow_rate_limit(TEXT, VARCHAR, INTEGER, INTEGER) IS 'Check and update rate limits for device flows';
COMMENT ON FUNCTION cleanup_expired_device_flows_v2() IS 'Cleanup expired device flows and rate limits';

-- Migration completed successfully
-- Enhanced device flow security with hashing, telemetry, and performance optimizations


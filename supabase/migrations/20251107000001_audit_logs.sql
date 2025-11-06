-- ============================================================================
-- Audit Logs System
-- ============================================================================
-- Creates comprehensive audit logging infrastructure for security and compliance
-- 
-- Tables:
--   - audit_logs: Main audit log table with RLS
--   - audit_log_categories: Categorizes different types of audit events
--
-- Features:
--   - Automatic timestamping
--   - JSON metadata storage for flexible event data
--   - IP address and user agent tracking
--   - RLS policies for admin-only access
--   - Indexes for performance
--   - Retention policy helpers
--
-- Created: November 7, 2025
-- Status: Production-ready
-- ============================================================================

-- Create enum for audit event types
CREATE TYPE audit_event_type AS ENUM (
  'authentication',
  'authorization',
  'data_access',
  'data_modification',
  'analytics_access',
  'admin_action',
  'security_event',
  'system_event',
  'user_action'
);

-- Create enum for severity levels
CREATE TYPE audit_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

-- ============================================================================
-- Main Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_type audit_event_type NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  severity audit_severity DEFAULT 'info',
  
  -- User and session info
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method VARCHAR(10),
  
  -- Event details
  resource VARCHAR(500),
  action VARCHAR(100),
  status VARCHAR(50),
  granted BOOLEAN,
  
  -- Additional metadata (flexible JSON for any extra data)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Error information (if applicable)
  error_message TEXT,
  error_stack TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Retention (for automatic cleanup)
  expires_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity, created_at DESC) WHERE severity IN ('error', 'critical');

-- Security queries
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs(ip_address, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource, created_at DESC);

-- JSON metadata queries (GIN index for flexible querying)
CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING gin(metadata);

-- Retention cleanup
CREATE INDEX idx_audit_logs_expires_at ON public.audit_logs(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can see all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- System can insert audit logs (service role)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- Helper Functions
-- ============================================================================

/**
 * Function to create an audit log entry
 * Can be called from triggers or application code
 */
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_event_type audit_event_type,
  p_event_name VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_resource VARCHAR DEFAULT NULL,
  p_action VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_granted BOOLEAN DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_severity audit_severity DEFAULT 'info',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_retention_days INTEGER DEFAULT 90
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    event_type,
    event_name,
    user_id,
    resource,
    action,
    status,
    granted,
    metadata,
    severity,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_event_type,
    p_event_name,
    COALESCE(p_user_id, auth.uid()),
    p_resource,
    p_action,
    p_status,
    p_granted,
    p_metadata,
    p_severity,
    p_ip_address,
    p_user_agent,
    CASE 
      WHEN p_retention_days > 0 THEN NOW() + (p_retention_days || ' days')::INTERVAL
      ELSE NULL
    END
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function to clean up expired audit logs
 * Should be called by a scheduled job (e.g., pg_cron)
 */
CREATE OR REPLACE FUNCTION public.cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Function to get audit log summary statistics
 */
CREATE OR REPLACE FUNCTION public.get_audit_log_stats(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  event_type audit_event_type,
  severity audit_severity,
  count BIGINT,
  unique_users BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.event_type,
    al.severity,
    COUNT(*) as count,
    COUNT(DISTINCT al.user_id) as unique_users,
    ROUND(
      (COUNT(*) FILTER (WHERE al.status = 'success')::NUMERIC / 
       NULLIF(COUNT(*), 0) * 100),
      2
    ) as success_rate
  FROM public.audit_logs al
  WHERE al.created_at >= p_start_date
    AND al.created_at <= p_end_date
  GROUP BY al.event_type, al.severity
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_audit_log_stats TO authenticated;

-- Service role needs full access for logging
GRANT ALL ON public.audit_logs TO service_role;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit log for security, compliance, and monitoring. Tracks all significant system events with metadata.';
COMMENT ON FUNCTION public.create_audit_log IS 'Helper function to create audit log entries with automatic timestamp and expiration';
COMMENT ON FUNCTION public.cleanup_expired_audit_logs IS 'Removes audit logs past their retention period. Run via cron job.';
COMMENT ON FUNCTION public.get_audit_log_stats IS 'Returns summary statistics for audit logs over a time period';

-- ============================================================================
-- Example Usage
-- ============================================================================

-- Example 1: Log analytics access
-- SELECT public.create_audit_log(
--   'analytics_access',
--   'Dashboard Viewed',
--   auth.uid(),
--   '/api/analytics/dashboard',
--   'view',
--   'success',
--   true,
--   '{"dashboard_id": "main", "widgets": 5}'::jsonb,
--   'info'
-- );

-- Example 2: Log security event
-- SELECT public.create_audit_log(
--   'security_event',
--   'Failed Login Attempt',
--   NULL,
--   '/api/auth/login',
--   'login',
--   'failure',
--   false,
--   '{"reason": "invalid_password", "attempts": 3}'::jsonb,
--   'warning',
--   '192.168.1.1'::inet,
--   'Mozilla/5.0...'
-- );

-- Example 3: Get statistics
-- SELECT * FROM public.get_audit_log_stats(
--   NOW() - INTERVAL '30 days',
--   NOW()
-- );

-- Example 4: Clean up old logs
-- SELECT public.cleanup_expired_audit_logs();


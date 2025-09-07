-- Rollback Migration 005: RLS Correctness
-- This script reverts the RLS correctness changes

-- Step 1: Drop all RLS policies created in this migration
-- Core tables
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

DROP POLICY IF EXISTS "Anyone can read public polls" ON polls;
DROP POLICY IF EXISTS "Users can read own private polls" ON polls;
DROP POLICY IF EXISTS "T2+ users can read high-privacy polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;
DROP POLICY IF EXISTS "Users can update own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete own polls" ON polls;
DROP POLICY IF EXISTS "Admins can read all polls" ON polls;
DROP POLICY IF EXISTS "Admins can update all polls" ON polls;
DROP POLICY IF EXISTS "Admins can delete all polls" ON polls;

DROP POLICY IF EXISTS "Users can read own votes" ON votes;
DROP POLICY IF EXISTS "Users can read votes on accessible polls" ON votes;
DROP POLICY IF EXISTS "Users can create votes on active polls" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "No vote deletion allowed" ON votes;
DROP POLICY IF EXISTS "Admins can read all votes" ON votes;
DROP POLICY IF EXISTS "Admins can update all votes" ON votes;
DROP POLICY IF EXISTS "Admins can delete votes" ON votes;

DROP POLICY IF EXISTS "Users can read own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can create own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Admins can read all credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Admins can update all credentials" ON webauthn_credentials;
DROP POLICY IF EXISTS "Admins can delete all credentials" ON webauthn_credentials;

DROP POLICY IF EXISTS "Users can read own error logs" ON error_logs;
DROP POLICY IF EXISTS "Users can create error logs" ON error_logs;
DROP POLICY IF EXISTS "No error log updates allowed" ON error_logs;
DROP POLICY IF EXISTS "No error log deletion allowed" ON error_logs;
DROP POLICY IF EXISTS "Admins can read all error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can update error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can delete error logs" ON error_logs;

-- Newer tables
DROP POLICY IF EXISTS "Users can read own sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Users can create sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Users can update own sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Admins can read all sessions v2" ON user_sessions_v2;

DROP POLICY IF EXISTS "Users can manage own token bindings" ON token_bindings;
DROP POLICY IF EXISTS "Admins can manage all token bindings" ON token_bindings;

DROP POLICY IF EXISTS "Users can read own security events" ON session_security_events;
DROP POLICY IF EXISTS "Admins can read all security events" ON session_security_events;

DROP POLICY IF EXISTS "Users can manage own device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Admins can manage all device fingerprints" ON device_fingerprints;

DROP POLICY IF EXISTS "Users can read own credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Users can create own credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Users can update own credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Users can delete own credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Admins can read all credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Admins can update all credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Admins can delete all credentials v2" ON webauthn_credentials_v2;

DROP POLICY IF EXISTS "Users can manage own challenges" ON webauthn_challenges;
DROP POLICY IF EXISTS "Admins can view all challenges" ON webauthn_challenges;

DROP POLICY IF EXISTS "Users can view own attestations" ON webauthn_attestations;
DROP POLICY IF EXISTS "Admins can view all attestations" ON webauthn_attestations;

DROP POLICY IF EXISTS "Users can view own analytics" ON webauthn_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON webauthn_analytics;

DROP POLICY IF EXISTS "Users can read own device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Users can create device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Users can update own device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Admins can read all device flows v2" ON device_flows_v2;

DROP POLICY IF EXISTS "Users can view own telemetry" ON device_flow_telemetry;
DROP POLICY IF EXISTS "Admins can view all telemetry" ON device_flow_telemetry;

DROP POLICY IF EXISTS "Admins can manage rate limits" ON device_flow_rate_limits;

-- Remaining tables
DROP POLICY IF EXISTS "System can manage cache" ON cache;

DROP POLICY IF EXISTS "Users can read own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can create analytics" ON analytics;
DROP POLICY IF EXISTS "No analytics updates allowed" ON analytics;
DROP POLICY IF EXISTS "No analytics deletion allowed" ON analytics;
DROP POLICY IF EXISTS "Admins can read all analytics" ON analytics;
DROP POLICY IF EXISTS "Admins can update analytics" ON analytics;
DROP POLICY IF EXISTS "Admins can delete analytics" ON analytics;

DROP POLICY IF EXISTS "Admins can manage rate limits" ON rate_limits;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can read all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete all notifications" ON notifications;

DROP POLICY IF EXISTS "Users can read own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can read all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can update all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can delete all sessions" ON user_sessions;

DROP POLICY IF EXISTS "Users can read own device flows" ON device_flows;
DROP POLICY IF EXISTS "Users can create device flows" ON device_flows;
DROP POLICY IF EXISTS "Users can update own device flows" ON device_flows;
DROP POLICY IF EXISTS "Admins can read all device flows" ON device_flows;
DROP POLICY IF EXISTS "Admins can update all device flows" ON device_flows;
DROP POLICY IF EXISTS "Admins can delete all device flows" ON device_flows;

-- Step 2: Drop helper functions created in this migration
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS has_trust_tier(TEXT);
DROP FUNCTION IF EXISTS is_owner(UUID);
DROP FUNCTION IF EXISTS is_public_poll(UUID);
DROP FUNCTION IF EXISTS is_active_poll(UUID);
DROP FUNCTION IF EXISTS can_access_poll(UUID);
DROP FUNCTION IF EXISTS validate_rls_policies();
DROP FUNCTION IF EXISTS test_rls_enforcement();
DROP FUNCTION IF EXISTS log_rls_violation(TEXT, TEXT, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_rls_statistics();

-- Step 3: Restore original RLS policies (if they existed)
-- Note: This would require the original RLS policies to be recreated
-- For now, we'll leave tables with RLS enabled but no policies
-- This effectively blocks all access until policies are recreated

-- Step 4: Remove comments (they will be dropped with the functions)

-- Rollback completed
-- All RLS policies have been removed
-- Tables remain with RLS enabled but no policies (blocking all access)
-- Original RLS policies would need to be manually recreated













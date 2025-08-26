-- Rollback Migration 004: Token/Session Safety
-- This script reverts the token/session safety changes

-- Step 1: Drop RLS policies
DROP POLICY IF EXISTS "Users can view own sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Users can create sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Users can update own sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Admins can view all sessions v2" ON user_sessions_v2;
DROP POLICY IF EXISTS "Users can manage own token bindings" ON token_bindings;
DROP POLICY IF EXISTS "Admins can manage all token bindings" ON token_bindings;
DROP POLICY IF EXISTS "Users can view own security events" ON session_security_events;
DROP POLICY IF EXISTS "Admins can view all security events" ON session_security_events;
DROP POLICY IF EXISTS "Users can manage own device fingerprints" ON device_fingerprints;
DROP POLICY IF EXISTS "Admins can manage all device fingerprints" ON device_fingerprints;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS trg_user_sessions_v2_updated ON user_sessions_v2;
DROP TRIGGER IF EXISTS trg_token_bindings_updated ON token_bindings;
DROP TRIGGER IF EXISTS trg_device_fingerprints_updated ON device_fingerprints;

-- Step 3: Drop helper functions
DROP FUNCTION IF EXISTS hash_token(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_session_v2(UUID, TEXT, TEXT, TEXT, VARCHAR, VARCHAR, BYTEA, JSONB, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, JSONB, INTEGER, UUID);
DROP FUNCTION IF EXISTS verify_session_v2(TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS rotate_session_v2(TEXT, TEXT, TEXT, TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS add_dpop_binding(UUID, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS validate_dpop_binding(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS cleanup_expired_sessions_v2();

-- Step 4: Drop indexes for user_sessions_v2
DROP INDEX IF EXISTS idx_user_sessions_v2_user_id;
DROP INDEX IF EXISTS idx_user_sessions_v2_session_token_hash;
DROP INDEX IF EXISTS idx_user_sessions_v2_refresh_token_hash;
DROP INDEX IF EXISTS idx_user_sessions_v2_access_token_hash;
DROP INDEX IF EXISTS idx_user_sessions_v2_session_token_hash_base64;
DROP INDEX IF EXISTS idx_user_sessions_v2_refresh_token_hash_base64;
DROP INDEX IF EXISTS idx_user_sessions_v2_access_token_hash_base64;
DROP INDEX IF EXISTS idx_user_sessions_v2_is_active;
DROP INDEX IF EXISTS idx_user_sessions_v2_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_v2_rotation_chain_id;
DROP INDEX IF EXISTS idx_user_sessions_v2_device_fingerprint_hash;
DROP INDEX IF EXISTS idx_user_sessions_v2_risk_score;
DROP INDEX IF EXISTS idx_user_sessions_v2_ttl;
DROP INDEX IF EXISTS idx_user_sessions_v2_user_active;
DROP INDEX IF EXISTS idx_user_sessions_v2_user_type;
DROP INDEX IF EXISTS idx_user_sessions_v2_user_method;

-- Step 5: Drop indexes for token_bindings
DROP INDEX IF EXISTS idx_token_bindings_session_id;
DROP INDEX IF EXISTS idx_token_bindings_binding_type;
DROP INDEX IF EXISTS idx_token_bindings_binding_hash;
DROP INDEX IF EXISTS idx_token_bindings_is_valid;
DROP INDEX IF EXISTS idx_token_bindings_expires_at;
DROP INDEX IF EXISTS idx_token_bindings_ttl;

-- Step 6: Drop indexes for session_security_events
DROP INDEX IF EXISTS idx_session_security_events_session_id;
DROP INDEX IF EXISTS idx_session_security_events_event_type;
DROP INDEX IF EXISTS idx_session_security_events_event_severity;
DROP INDEX IF EXISTS idx_session_security_events_created_at;
DROP INDEX IF EXISTS idx_session_security_events_risk_score;

-- Step 7: Drop indexes for device_fingerprints
DROP INDEX IF EXISTS idx_device_fingerprints_user_id;
DROP INDEX IF EXISTS idx_device_fingerprints_fingerprint_hash;
DROP INDEX IF EXISTS idx_device_fingerprints_trust_level;
DROP INDEX IF EXISTS idx_device_fingerprints_is_verified;
DROP INDEX IF EXISTS idx_device_fingerprints_risk_score;
DROP INDEX IF EXISTS idx_device_fingerprints_is_blocked;

-- Step 8: Drop tables (in dependency order)
DROP TABLE IF EXISTS session_security_events;
DROP TABLE IF EXISTS token_bindings;
DROP TABLE IF EXISTS device_fingerprints;
DROP TABLE IF EXISTS user_sessions_v2;

-- Step 9: Remove comments (they will be dropped with the tables)

-- Rollback completed
-- All token/session safety tables and functions have been removed
-- The original user_sessions table remains unchanged



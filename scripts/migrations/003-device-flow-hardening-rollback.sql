-- Rollback Migration 003: Device Flow Hardening
-- This script reverts the device flow hardening changes

-- Step 1: Drop RLS policies
DROP POLICY IF EXISTS "Users can view own device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Users can create device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Users can update own device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Admins can view all device flows v2" ON device_flows_v2;
DROP POLICY IF EXISTS "Users can view own telemetry" ON device_flow_telemetry;
DROP POLICY IF EXISTS "Admins can view all telemetry" ON device_flow_telemetry;
DROP POLICY IF EXISTS "Admins can manage rate limits" ON device_flow_rate_limits;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS trg_device_flows_v2_updated ON device_flows_v2;
DROP TRIGGER IF EXISTS trg_device_flow_rate_limits_updated ON device_flow_rate_limits;

-- Step 3: Drop helper functions
DROP FUNCTION IF EXISTS hash_device_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_device_flow_v2(VARCHAR, VARCHAR, VARCHAR, INET, TEXT, VARCHAR, TEXT, TEXT[], INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS verify_device_flow_v2(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS complete_device_flow_v2(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS check_device_flow_rate_limit(TEXT, VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS cleanup_expired_device_flows_v2();

-- Step 4: Drop indexes for device_flows_v2
DROP INDEX IF EXISTS idx_device_flows_v2_device_code_hash;
DROP INDEX IF EXISTS idx_device_flows_v2_user_code_hash;
DROP INDEX IF EXISTS idx_device_flows_v2_device_code_hash_base64;
DROP INDEX IF EXISTS idx_device_flows_v2_user_code_hash_base64;
DROP INDEX IF EXISTS idx_device_flows_v2_status;
DROP INDEX IF EXISTS idx_device_flows_v2_expires_at;
DROP INDEX IF EXISTS idx_device_flows_v2_created_at;
DROP INDEX IF EXISTS idx_device_flows_v2_user_id;
DROP INDEX IF EXISTS idx_device_flows_v2_provider;
DROP INDEX IF EXISTS idx_device_flows_v2_rate_limit_key;
DROP INDEX IF EXISTS idx_device_flows_v2_abuse_score;
DROP INDEX IF EXISTS idx_device_flows_v2_ttl;
DROP INDEX IF EXISTS idx_device_flows_v2_status_expires;
DROP INDEX IF EXISTS idx_device_flows_v2_user_status;
DROP INDEX IF EXISTS idx_device_flows_v2_provider_status;

-- Step 5: Drop indexes for device_flow_telemetry
DROP INDEX IF EXISTS idx_device_flow_telemetry_device_flow_id;
DROP INDEX IF EXISTS idx_device_flow_telemetry_event_type;
DROP INDEX IF EXISTS idx_device_flow_telemetry_created_at;
DROP INDEX IF EXISTS idx_device_flow_telemetry_success;

-- Step 6: Drop indexes for device_flow_rate_limits
DROP INDEX IF EXISTS idx_device_flow_rate_limits_key_type;
DROP INDEX IF EXISTS idx_device_flow_rate_limits_window_end;
DROP INDEX IF EXISTS idx_device_flow_rate_limits_abuse_score;
DROP INDEX IF EXISTS idx_device_flow_rate_limits_blocked_until;
DROP INDEX IF EXISTS idx_device_flow_rate_limits_ttl;

-- Step 7: Drop tables (in dependency order)
DROP TABLE IF EXISTS device_flow_telemetry;
DROP TABLE IF EXISTS device_flow_rate_limits;
DROP TABLE IF EXISTS device_flows_v2;

-- Step 8: Remove comments (they will be dropped with the tables)

-- Rollback completed
-- All device flow hardening tables and functions have been removed
-- The original device_flows table remains unchanged



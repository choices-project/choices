-- Rollback Migration 002: WebAuthn Storage Enhancement
-- This script reverts the WebAuthn enhancement changes

-- Step 1: Drop RLS policies
DROP POLICY IF EXISTS "Users can manage own credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Users can manage own challenges" ON webauthn_challenges;
DROP POLICY IF EXISTS "Users can view own attestations" ON webauthn_attestations;
DROP POLICY IF EXISTS "Users can view own analytics" ON webauthn_analytics;
DROP POLICY IF EXISTS "Admins can view all credentials v2" ON webauthn_credentials_v2;
DROP POLICY IF EXISTS "Admins can view all challenges" ON webauthn_challenges;
DROP POLICY IF EXISTS "Admins can view all attestations" ON webauthn_attestations;
DROP POLICY IF EXISTS "Admins can view all analytics" ON webauthn_analytics;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS trg_webauthn_credentials_v2_updated ON webauthn_credentials_v2;
DROP TRIGGER IF EXISTS trg_webauthn_attestations_updated ON webauthn_attestations;

-- Step 3: Drop helper functions
DROP FUNCTION IF EXISTS webauthn_generate_challenge(UUID, VARCHAR, VARCHAR, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS webauthn_validate_challenge(TEXT, UUID, VARCHAR);
DROP FUNCTION IF EXISTS webauthn_store_credential(UUID, TEXT, TEXT, BIGINT, UUID, TEXT[], VARCHAR, VARCHAR, VARCHAR, VARCHAR, BOOLEAN, BOOLEAN, TEXT, VARCHAR, TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS webauthn_get_user_credentials(UUID);
DROP FUNCTION IF EXISTS webauthn_update_credential_usage(TEXT, BIGINT, BOOLEAN, INET, TEXT);

-- Step 4: Drop indexes for webauthn_credentials_v2
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_user_id;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_credential_id;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_credential_id_base64;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_is_active;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_aaguid;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_last_used_at;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_created_at;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_user_active;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_user_type;
DROP INDEX IF EXISTS idx_webauthn_credentials_v2_user_transports;

-- Step 5: Drop indexes for webauthn_challenges
DROP INDEX IF EXISTS idx_webauthn_challenges_user_id;
DROP INDEX IF EXISTS idx_webauthn_challenges_challenge;
DROP INDEX IF EXISTS idx_webauthn_challenges_expires_at;
DROP INDEX IF EXISTS idx_webauthn_challenges_is_valid;
DROP INDEX IF EXISTS idx_webauthn_challenges_type;

-- Step 6: Drop indexes for webauthn_attestations
DROP INDEX IF EXISTS idx_webauthn_attestations_credential_id;
DROP INDEX IF EXISTS idx_webauthn_attestations_format;
DROP INDEX IF EXISTS idx_webauthn_attestations_verification_result;

-- Step 7: Drop indexes for webauthn_analytics
DROP INDEX IF EXISTS idx_webauthn_analytics_user_id;
DROP INDEX IF EXISTS idx_webauthn_analytics_credential_id;
DROP INDEX IF EXISTS idx_webauthn_analytics_event_type;
DROP INDEX IF EXISTS idx_webauthn_analytics_created_at;
DROP INDEX IF EXISTS idx_webauthn_analytics_success;

-- Step 8: Drop tables (in dependency order)
DROP TABLE IF EXISTS webauthn_analytics;
DROP TABLE IF EXISTS webauthn_attestations;
DROP TABLE IF EXISTS webauthn_challenges;
DROP TABLE IF EXISTS webauthn_credentials_v2;

-- Step 9: Remove comments (they will be dropped with the tables)

-- Rollback completed
-- All WebAuthn enhancement tables and functions have been removed
-- The original webauthn_credentials table remains unchanged













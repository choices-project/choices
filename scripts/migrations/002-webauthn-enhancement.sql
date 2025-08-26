-- Migration 002: WebAuthn Storage Enhancement
-- Phase 1.4 Week 2: Enhance WebAuthn credential storage with binary IDs and metadata
-- Created: 2025-08-25
-- Status: Ready for deployment

-- Step 1: Rename biometric_credentials to webauthn_credentials
ALTER TABLE biometric_credentials RENAME TO webauthn_credentials;

-- Step 2: Add new columns for enhanced WebAuthn metadata
ALTER TABLE webauthn_credentials
  ADD COLUMN IF NOT EXISTS aaguid UUID,
  ADD COLUMN IF NOT EXISTS cose_public_key BYTEA,
  ADD COLUMN IF NOT EXISTS transports TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS backup_eligible BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS backup_state BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_uv_result BOOLEAN,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clone_detected BOOLEAN DEFAULT FALSE;

-- Step 3: Convert credential_id to binary storage (BYTEA)
-- First, create a backup of the current credential_id
ALTER TABLE webauthn_credentials ADD COLUMN credential_id_backup TEXT;
UPDATE webauthn_credentials SET credential_id_backup = credential_id;

-- Convert to binary storage
ALTER TABLE webauthn_credentials 
  ALTER COLUMN credential_id TYPE BYTEA USING decode(credential_id, 'hex');

-- Step 4: Convert sign_count to BIGINT for larger range
ALTER TABLE webauthn_credentials 
  ALTER COLUMN sign_count TYPE BIGINT USING sign_count::BIGINT;

-- Step 5: Add unique constraint for user and credential combination
DROP INDEX IF EXISTS uq_webauthn_user_cred;
CREATE UNIQUE INDEX uq_webauthn_user_cred ON webauthn_credentials (user_id, credential_id);

-- Step 6: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_aaguid ON webauthn_credentials (aaguid);
CREATE INDEX IF NOT EXISTS idx_webauthn_user_active ON webauthn_credentials (user_id) 
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webauthn_last_used ON webauthn_credentials (last_used_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_backup_state ON webauthn_credentials (backup_state);

-- Step 7: Add constraints for data integrity
ALTER TABLE webauthn_credentials 
  ADD CONSTRAINT chk_webauthn_sign_count_positive 
  CHECK (sign_count >= 0);

ALTER TABLE webauthn_credentials 
  ADD CONSTRAINT chk_webauthn_transports_valid 
  CHECK (array_length(transports, 1) > 0);

-- Step 8: Create function to detect sign count regressions
CREATE OR REPLACE FUNCTION detect_sign_count_regression(
  p_user_id UUID,
  p_credential_id BYTEA,
  p_new_sign_count BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
  current_sign_count BIGINT;
BEGIN
  SELECT sign_count INTO current_sign_count
  FROM webauthn_credentials
  WHERE user_id = p_user_id AND credential_id = p_credential_id;
  
  IF current_sign_count IS NULL THEN
    RETURN FALSE; -- New credential
  END IF;
  
  -- Detect regression (new count is less than stored count)
  IF p_new_sign_count < current_sign_count THEN
    -- Mark as potential clone
    UPDATE webauthn_credentials
    SET clone_detected = TRUE,
        updated_at = NOW()
    WHERE user_id = p_user_id AND credential_id = p_credential_id;
  
  RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to update credential usage
CREATE OR REPLACE FUNCTION update_webauthn_credential_usage(
  p_user_id UUID,
  p_credential_id BYTEA,
  p_new_sign_count BIGINT,
  p_uv_result BOOLEAN DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE webauthn_credentials
  SET 
    sign_count = p_new_sign_count,
    last_used_at = NOW(),
    last_uv_result = COALESCE(p_uv_result, last_uv_result),
    updated_at = NOW()
  WHERE user_id = p_user_id AND credential_id = p_credential_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create function to get user's active credentials
CREATE OR REPLACE FUNCTION get_user_webauthn_credentials(p_user_id UUID)
RETURNS TABLE(
  credential_id BYTEA,
  aaguid UUID,
  transports TEXT[],
  backup_eligible BOOLEAN,
  backup_state BOOLEAN,
  sign_count BIGINT,
  last_used_at TIMESTAMPTZ,
  clone_detected BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.credential_id,
    wc.aaguid,
    wc.transports,
    wc.backup_eligible,
    wc.backup_state,
    wc.sign_count,
    wc.last_used_at,
    wc.clone_detected
  FROM webauthn_credentials wc
  WHERE wc.user_id = p_user_id 
    AND wc.revoked_at IS NULL
    AND wc.clone_detected = FALSE
  ORDER BY wc.last_used_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Update RLS policies for the renamed table
DROP POLICY IF EXISTS biometric_credentials_read_own ON webauthn_credentials;
CREATE POLICY webauthn_credentials_read_own ON webauthn_credentials
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS biometric_credentials_write_own ON webauthn_credentials;
CREATE POLICY webauthn_credentials_write_own ON webauthn_credentials
  FOR ALL USING (user_id = auth.uid());

-- Step 12: Add comments for documentation
COMMENT ON TABLE webauthn_credentials IS 'Enhanced WebAuthn credentials with binary storage and metadata';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Binary credential ID (BYTEA) for enhanced security';
COMMENT ON COLUMN webauthn_credentials.aaguid IS 'Authenticator Attestation GUID for device identification';
COMMENT ON COLUMN webauthn_credentials.cose_public_key IS 'COSE format public key for cryptographic operations';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Array of supported transport protocols';
COMMENT ON COLUMN webauthn_credentials.backup_eligible IS 'Whether credential is eligible for backup';
COMMENT ON COLUMN webauthn_credentials.backup_state IS 'Current backup state of the credential';
COMMENT ON COLUMN webauthn_credentials.clone_detected IS 'Flag indicating potential credential cloning';

-- Step 13: Create cleanup function for old backup data
CREATE OR REPLACE FUNCTION cleanup_webauthn_backup_data() RETURNS void AS $$
BEGIN
  -- Remove backup column after migration is verified
  -- ALTER TABLE webauthn_credentials DROP COLUMN credential_id_backup;
  
  -- This will be uncommented after migration verification
  RAISE NOTICE 'Backup cleanup ready for manual execution after verification';
END;
$$ LANGUAGE plpgsql;

-- Log migration completion
INSERT INTO migration_log (migration_name, applied_at, status, details)
VALUES (
  '002-webauthn-enhancement',
  NOW(),
  'completed',
  'Successfully enhanced WebAuthn storage with binary IDs, metadata, and clone detection'
);


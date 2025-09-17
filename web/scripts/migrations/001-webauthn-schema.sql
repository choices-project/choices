-- WebAuthn Database Schema Migration
-- Privacy-first passkey implementation

-- WebAuthn challenges table for registration and authentication
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WebAuthn credentials table for storing public keys
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  sign_count BIGINT DEFAULT 0,
  aaguid UUID,
  transports TEXT[],
  backup_eligible BOOLEAN,
  backup_state BOOLEAN,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_type ON webauthn_challenges(type);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_last_used ON webauthn_credentials(last_used_at);

-- RLS Policies for security
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only access their own challenges
CREATE POLICY "Users can access their own challenges" ON webauthn_challenges
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own credentials
CREATE POLICY "Users can access their own credentials" ON webauthn_credentials
  FOR ALL USING (auth.uid() = user_id);

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM webauthn_challenges 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user's WebAuthn credentials
CREATE OR REPLACE FUNCTION get_user_webauthn_credentials(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  credential_id TEXT,
  sign_count BIGINT,
  aaguid UUID,
  transports TEXT[],
  backup_eligible BOOLEAN,
  backup_state BOOLEAN,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.credential_id,
    wc.sign_count,
    wc.aaguid,
    wc.transports,
    wc.backup_eligible,
    wc.backup_state,
    wc.last_used_at,
    wc.created_at
  FROM webauthn_credentials wc
  WHERE wc.user_id = user_uuid
  ORDER BY wc.last_used_at DESC NULLS LAST, wc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has WebAuthn credentials
CREATE OR REPLACE FUNCTION user_has_webauthn_credentials(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM webauthn_credentials 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a WebAuthn credential
CREATE OR REPLACE FUNCTION delete_webauthn_credential(
  user_uuid UUID,
  credential_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webauthn_credentials 
  WHERE user_id = user_uuid 
    AND credential_id = credential_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_webauthn_credentials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_webauthn_credentials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_webauthn_credential(UUID, TEXT) TO authenticated;

-- Create a scheduled job to clean up expired challenges (if using pg_cron)
-- SELECT cron.schedule('cleanup-webauthn-challenges', '*/5 * * * *', 'SELECT cleanup_expired_webauthn_challenges();');

-- Add comments for documentation
COMMENT ON TABLE webauthn_challenges IS 'Stores temporary WebAuthn challenges for registration and authentication';
COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn public key credentials for users';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Base64URL encoded credential ID';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Raw COSE public key';
COMMENT ON COLUMN webauthn_credentials.sign_count IS 'Signature counter for replay protection';
COMMENT ON COLUMN webauthn_credentials.aaguid IS 'Authenticator Attestation Globally Unique Identifier';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Array of supported transports (usb, nfc, ble, internal)';
COMMENT ON COLUMN webauthn_credentials.backup_eligible IS 'Whether the credential is eligible for backup';
COMMENT ON COLUMN webauthn_credentials.backup_state IS 'Whether the credential is currently backed up';







-- WebAuthn Database Schema Migration
-- Privacy-first passkey implementation with production-ready security

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- WebAuthn credentials table for storing public keys
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rp_id             TEXT NOT NULL,
  credential_id     BYTEA NOT NULL UNIQUE,     -- raw ID (binary)
  public_key        BYTEA NOT NULL,            -- COSE key (binary)
  cose_alg          SMALLINT,
  counter           BIGINT NOT NULL DEFAULT 0,
  transports        TEXT[] DEFAULT '{}',
  aaguid            UUID,
  backed_up         BOOLEAN,
  backup_eligible   BOOLEAN,
  device_label      TEXT,
  device_info       JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at      TIMESTAMPTZ
);

-- WebAuthn challenges table for registration and authentication
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rp_id        TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('registration','authentication')),
  challenge    BYTEA NOT NULL, -- raw challenge bytes
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  origin       TEXT, -- optional: server-validated origin
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Narrow indexes for performance
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_rp ON public.webauthn_credentials(rp_id);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_lookup ON public.webauthn_challenges(user_id, kind) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_exp ON public.webauthn_challenges(expires_at);

-- One active challenge per user/kind (without NOW() in predicate)
CREATE UNIQUE INDEX IF NOT EXISTS uq_webauthn_challenge_active ON public.webauthn_challenges(user_id, kind) WHERE used_at IS NULL;

-- -----------------------------
-- RLS: credentials (owner-only)
-- -----------------------------
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creds_owner_select" ON public.webauthn_credentials;
CREATE POLICY "creds_owner_select" ON public.webauthn_credentials
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "creds_owner_insert" ON public.webauthn_credentials;
CREATE POLICY "creds_owner_insert" ON public.webauthn_credentials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creds_owner_update" ON public.webauthn_credentials;
CREATE POLICY "creds_owner_update" ON public.webauthn_credentials
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creds_owner_delete" ON public.webauthn_credentials;
CREATE POLICY "creds_owner_delete" ON public.webauthn_credentials
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- -----------------------------
-- RLS: challenges (owner-only)
-- -----------------------------
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chals_owner_all" ON public.webauthn_challenges;
CREATE POLICY "chals_owner_all" ON public.webauthn_challenges
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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
  credential_id BYTEA,
  counter BIGINT,
  aaguid UUID,
  transports TEXT[],
  backup_eligible BOOLEAN,
  backed_up BOOLEAN,
  device_label TEXT,
  device_info JSONB,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.credential_id,
    wc.counter,
    wc.aaguid,
    wc.transports,
    wc.backup_eligible,
    wc.backed_up,
    wc.device_label,
    wc.device_info,
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

-- Garbage collection (pg_cron) - only if cron extension is available
-- Uncomment the lines below if you have pg_cron extension enabled:
-- SELECT cron.schedule('webauthn_gc', '15 * * * *',
-- $$
-- DELETE FROM public.webauthn_challenges
--  WHERE used_at IS NOT NULL OR expires_at < NOW();
-- $$);

-- Alternative: Manual cleanup function (call periodically)
CREATE OR REPLACE FUNCTION cleanup_webauthn_challenges()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.webauthn_challenges
  WHERE used_at IS NOT NULL OR expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE webauthn_challenges IS 'Stores temporary WebAuthn challenges for registration and authentication';
COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn public key credentials for users';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Base64URL encoded credential ID';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Raw COSE public key';
COMMENT ON COLUMN webauthn_credentials.counter IS 'Signature counter for replay protection';
COMMENT ON COLUMN webauthn_credentials.aaguid IS 'Authenticator Attestation Globally Unique Identifier';
COMMENT ON COLUMN webauthn_credentials.transports IS 'Array of supported transports (usb, nfc, ble, internal)';
COMMENT ON COLUMN webauthn_credentials.backup_eligible IS 'Whether the credential is eligible for backup';
COMMENT ON COLUMN webauthn_credentials.backed_up IS 'Whether the credential is currently backed up';







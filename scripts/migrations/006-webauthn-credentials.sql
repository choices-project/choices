-- Migration 006: WebAuthn Credentials Table
-- Goal: Add support for biometric authentication using WebAuthn

-- Create WebAuthn credentials table
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- WebAuthn specific fields
  credential_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  
  -- Metadata
  rp_id TEXT NOT NULL DEFAULT 'localhost',
  transports TEXT[] DEFAULT '{}',
  backup_eligible BOOLEAN DEFAULT false,
  backup_state BOOLEAN DEFAULT false,
  
  -- Usage tracking
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT webauthn_credentials_user_id_idx UNIQUE (user_id, credential_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_rp_id ON webauthn_credentials(rp_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);

-- Add RLS policies
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own credentials
CREATE POLICY "Users can view own webauthn credentials" ON webauthn_credentials
  FOR SELECT USING (
    auth.uid()::text = user_id::text
  );

-- Policy: Users can insert their own credentials
CREATE POLICY "Users can insert own webauthn credentials" ON webauthn_credentials
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own webauthn credentials" ON webauthn_credentials
  FOR UPDATE USING (
    auth.uid()::text = user_id::text
  );

-- Policy: Users can delete their own credentials
CREATE POLICY "Users can delete own webauthn credentials" ON webauthn_credentials
  FOR DELETE USING (
    auth.uid()::text = user_id::text
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_webauthn_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_webauthn_credentials_updated_at
  BEFORE UPDATE ON webauthn_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_webauthn_credentials_updated_at();

-- Function to get credentials for a user
CREATE OR REPLACE FUNCTION get_user_webauthn_credentials(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  credential_id TEXT,
  counter BIGINT,
  transports TEXT[],
  backup_eligible BOOLEAN,
  backup_state BOOLEAN,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.credential_id,
    wc.counter,
    wc.transports,
    wc.backup_eligible,
    wc.backup_state,
    wc.last_used,
    wc.created_at
  FROM webauthn_credentials wc
  WHERE wc.user_id = p_user_id
  ORDER BY wc.created_at DESC;
END;
$$;

-- Function to verify credential exists
CREATE OR REPLACE FUNCTION verify_webauthn_credential(p_credential_id TEXT)
RETURNS TABLE(
  user_id UUID,
  public_key BYTEA,
  counter BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.user_id,
    wc.public_key,
    wc.counter
  FROM webauthn_credentials wc
  WHERE wc.credential_id = p_credential_id;
END;
$$;

-- Function to update credential counter
CREATE OR REPLACE FUNCTION update_webauthn_credential_counter(
  p_credential_id TEXT,
  p_new_counter BIGINT
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE webauthn_credentials
  SET 
    counter = p_new_counter,
    last_used = NOW(),
    updated_at = NOW()
  WHERE credential_id = p_credential_id
  AND counter < p_new_counter; -- Prevent replay attacks
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$;

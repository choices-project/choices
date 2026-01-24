-- Grant table-level access for webauthn_credentials
-- RLS policies already restrict access; grants are required for API (server client = authenticated).
-- Fixes "Failed to store credential" 500 when register/verify inserts via authenticated JWT.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webauthn_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webauthn_credentials TO service_role;

COMMENT ON TABLE public.webauthn_credentials IS 'WebAuthn passkey credentials; RLS owner-based. Table grants required for authenticated insert.';

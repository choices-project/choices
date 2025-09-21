-- Migration: Create idempotency_keys table
-- Purpose: Support idempotency for server actions to prevent double-submission attacks
-- Created: 2025-01-20

-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    result_data JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups by key
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);

-- Create index for efficient cleanup of expired keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);

-- Create index for efficient lookups by key and expiration
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key_expires ON public.idempotency_keys(key, expires_at);

-- Add RLS (Row Level Security) policies if needed
-- For now, we'll allow all operations since this is a system table
-- In production, you might want to restrict access to service accounts only

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.idempotency_keys TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.idempotency_keys TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.idempotency_keys IS 'Stores idempotency keys for server actions to prevent double-submission attacks';
COMMENT ON COLUMN public.idempotency_keys.key IS 'Unique idempotency key (namespace:key format)';
COMMENT ON COLUMN public.idempotency_keys.result_data IS 'Cached result data from previous execution';
COMMENT ON COLUMN public.idempotency_keys.expires_at IS 'When this key expires and can be cleaned up';
COMMENT ON COLUMN public.idempotency_keys.created_at IS 'When this key was created';

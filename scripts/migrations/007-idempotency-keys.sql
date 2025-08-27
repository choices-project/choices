-- Migration: 007-idempotency-keys.sql
-- Purpose: Add idempotency keys table for preventing double-submission attacks
-- Created: 2025-08-27
-- Status: Ready for deployment

-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    result_data JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON public.idempotency_keys(created_at);

-- Create partial index for active keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_active ON public.idempotency_keys(key) 
WHERE expires_at > NOW();

-- Add constraints
ALTER TABLE public.idempotency_keys 
ADD CONSTRAINT idempotency_keys_key_not_empty CHECK (key != '');

ALTER TABLE public.idempotency_keys 
ADD CONSTRAINT idempotency_keys_expires_at_future CHECK (expires_at > created_at);

-- Enable RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only system/service role can access idempotency keys
CREATE POLICY idempotency_keys_service_only ON public.idempotency_keys
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_idempotency_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_idempotency_keys_updated_at
    BEFORE UPDATE ON public.idempotency_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_idempotency_keys_updated_at();

-- Create function to cleanup expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.idempotency_keys 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idempotency_keys TO service_role;
GRANT USAGE ON SEQUENCE public.idempotency_keys_id_seq TO service_role;

-- Create view for monitoring
CREATE OR REPLACE VIEW public.idempotency_keys_stats AS
SELECT 
    COUNT(*) as total_keys,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_keys,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_keys,
    MIN(created_at) as oldest_key,
    MAX(created_at) as newest_key
FROM public.idempotency_keys;

-- Grant access to the view
GRANT SELECT ON public.idempotency_keys_stats TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.idempotency_keys IS 'Stores idempotency keys to prevent double-submission attacks';
COMMENT ON COLUMN public.idempotency_keys.key IS 'Unique idempotency key (namespace:uuid format)';
COMMENT ON COLUMN public.idempotency_keys.result_data IS 'Cached result data for duplicate requests';
COMMENT ON COLUMN public.idempotency_keys.expires_at IS 'When this key expires and can be cleaned up';
COMMENT ON COLUMN public.idempotency_keys.created_at IS 'When this key was created';
COMMENT ON COLUMN public.idempotency_keys.updated_at IS 'When this key was last updated';

COMMENT ON FUNCTION cleanup_expired_idempotency_keys() IS 'Removes expired idempotency keys and returns count of deleted records';
COMMENT ON VIEW public.idempotency_keys_stats IS 'Provides statistics about idempotency keys for monitoring';

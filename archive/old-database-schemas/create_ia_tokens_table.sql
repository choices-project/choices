-- Create ia_tokens table for IA/PO architecture
-- This table stores blinded tokens for the voting system

CREATE TABLE IF NOT EXISTS ia_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_stable_id TEXT NOT NULL, -- References auth.users.id
    poll_id UUID NOT NULL, -- References po_polls.id
    token_hash TEXT NOT NULL, -- Hashed blinded token
    token_signature TEXT NOT NULL, -- IA signature on the token
    scope TEXT NOT NULL, -- Token scope (e.g., 'poll:123')
    tier TEXT NOT NULL, -- User verification tier
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ia_tokens_user_stable_id ON ia_tokens(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_poll_id ON ia_tokens(poll_id);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_token_hash ON ia_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_scope ON ia_tokens(scope);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_expires_at ON ia_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_is_used ON ia_tokens(is_used);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ia_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ia_tokens_updated_at
    BEFORE UPDATE ON ia_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_ia_tokens_updated_at();

-- Add foreign key constraints
ALTER TABLE ia_tokens 
ADD CONSTRAINT fk_ia_tokens_user_stable_id 
FOREIGN KEY (user_stable_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ia_tokens 
ADD CONSTRAINT fk_ia_tokens_poll_id 
FOREIGN KEY (poll_id) REFERENCES po_polls(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE ia_tokens 
ADD CONSTRAINT chk_ia_tokens_tier 
CHECK (tier IN ('T0', 'T1', 'T2', 'T3'));

ALTER TABLE ia_tokens 
ADD CONSTRAINT chk_ia_tokens_expires_at 
CHECK (expires_at > issued_at);

-- Insert sample data for testing (optional)
INSERT INTO ia_tokens (user_stable_id, poll_id, token_hash, token_signature, scope, tier, expires_at) 
VALUES 
    ('test-user-id', (SELECT id FROM po_polls LIMIT 1), 'sample_hash_1', 'sample_signature_1', 'poll:test', 'T1', NOW() + INTERVAL '1 hour'),
    ('test-user-id', (SELECT id FROM po_polls LIMIT 1), 'sample_hash_2', 'sample_signature_2', 'poll:test', 'T1', NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Clean Supabase Schema for Choices Voting System
-- This schema handles existing type conflicts and creates tables step by step

-- Step 1: Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop existing types if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Drop types if they exist
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tier') THEN
        DROP TYPE verification_tier CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'poll_status') THEN
        DROP TYPE poll_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        DROP TYPE event_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_scope') THEN
        DROP TYPE token_scope CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demographic_key') THEN
        DROP TYPE demographic_key CASCADE;
    END IF;
END $$;

-- Step 3: Create custom types
CREATE TYPE verification_tier AS ENUM ('T0', 'T1', 'T2', 'T3');
CREATE TYPE poll_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE event_type AS ENUM ('vote', 'poll_created', 'user_registered');
CREATE TYPE token_scope AS ENUM ('read', 'write', 'admin');
CREATE TYPE demographic_key AS ENUM ('age_group', 'location', 'device_type');

-- Step 4: Create utility functions
CREATE OR REPLACE FUNCTION validate_stable_id(id TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN id ~ '^[a-zA-Z0-9_-]{3,50}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Drop existing tables if they exist
DROP TABLE IF EXISTS analytics_demographics CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS po_merkle_trees CASCADE;
DROP TABLE IF EXISTS po_votes CASCADE;
DROP TABLE IF EXISTS po_polls CASCADE;
DROP TABLE IF EXISTS ia_webauthn_credentials CASCADE;
DROP TABLE IF EXISTS ia_verification_sessions CASCADE;
DROP TABLE IF EXISTS ia_tokens CASCADE;
DROP TABLE IF EXISTS ia_users CASCADE;

-- Step 6: Create tables
CREATE TABLE ia_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    stable_id TEXT UNIQUE NOT NULL CHECK (validate_stable_id(stable_id)),
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_tier verification_tier DEFAULT 'T0',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE ia_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ia_users(id) ON DELETE CASCADE,
    poll_id TEXT NOT NULL,
    token_hash TEXT NOT NULL CHECK (length(token_hash) > 10),
    tag TEXT NOT NULL CHECK (length(tag) BETWEEN 1 AND 50),
    tier verification_tier NOT NULL,
    scope token_scope NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL CHECK (expires_at > issued_at),
    is_revoked BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE ia_verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ia_users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL CHECK (length(session_id) > 10),
    challenge TEXT NOT NULL CHECK (length(challenge) > 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL CHECK (expires_at > created_at),
    is_used BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE ia_webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES ia_users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL CHECK (length(credential_id) > 10),
    public_key TEXT NOT NULL,
    sign_count INTEGER DEFAULT 0 CHECK (sign_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, credential_id)
);

CREATE TABLE po_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id TEXT UNIQUE NOT NULL CHECK (length(poll_id) BETWEEN 3 AND 100),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
    description TEXT CHECK (length(description) <= 1000),
    options JSONB NOT NULL CHECK (jsonb_array_length(options) BETWEEN 2 AND 10),
    created_by UUID REFERENCES ia_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL CHECK (end_time > start_time),
    status poll_status DEFAULT 'draft',
    sponsors JSONB CHECK (sponsors IS NULL OR jsonb_array_length(sponsors) <= 5),
    ia_public_key TEXT NOT NULL CHECK (length(ia_public_key) > 10),
    total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
    participation_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (participation_rate BETWEEN 0 AND 100),
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE po_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id TEXT NOT NULL REFERENCES po_polls(poll_id) ON DELETE CASCADE,
    user_id UUID REFERENCES ia_users(id) ON DELETE SET NULL,
    token TEXT NOT NULL CHECK (length(token) > 10),
    tag TEXT NOT NULL,
    choice INTEGER NOT NULL CHECK (choice >= 0),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    merkle_leaf TEXT NOT NULL CHECK (length(merkle_leaf) > 10),
    merkle_proof JSONB CHECK (merkle_proof IS NULL OR jsonb_array_length(merkle_proof) <= 20),
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE po_merkle_trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id TEXT UNIQUE NOT NULL REFERENCES po_polls(poll_id) ON DELETE CASCADE,
    root TEXT NOT NULL CHECK (length(root) > 10),
    leaf_count INTEGER DEFAULT 0 CHECK (leaf_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type event_type NOT NULL,
    poll_id TEXT,
    user_id UUID REFERENCES ia_users(id) ON DELETE SET NULL,
    metadata JSONB CHECK (metadata IS NULL OR length(metadata::text) <= 10000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id TEXT NOT NULL REFERENCES po_polls(poll_id) ON DELETE CASCADE,
    demographic_key demographic_key NOT NULL,
    demographic_value TEXT NOT NULL CHECK (length(demographic_value) BETWEEN 1 AND 100),
    vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Create indexes
CREATE INDEX idx_ia_users_stable_id ON ia_users(stable_id);
CREATE INDEX idx_ia_users_email ON ia_users(email);
CREATE INDEX idx_ia_users_auth_user ON ia_users(auth_user_id);
CREATE INDEX idx_ia_tokens_user ON ia_tokens(user_id);
CREATE INDEX idx_ia_tokens_poll ON ia_tokens(user_id, poll_id);
CREATE INDEX idx_ia_tokens_hash ON ia_tokens(token_hash);
CREATE INDEX idx_ia_tokens_expires ON ia_tokens(expires_at);
CREATE INDEX idx_ia_verification_sessions_user ON ia_verification_sessions(user_id);
CREATE INDEX idx_ia_webauthn_credentials_user ON ia_webauthn_credentials(user_id);
CREATE INDEX idx_po_polls_status ON po_polls(status);
CREATE INDEX idx_po_polls_time ON po_polls(start_time, end_time);
CREATE INDEX idx_po_polls_created_by ON po_polls(created_by);
CREATE INDEX idx_po_votes_poll ON po_votes(poll_id);
CREATE INDEX idx_po_votes_user ON po_votes(user_id);
CREATE INDEX idx_po_votes_tag ON po_votes(tag);
CREATE INDEX idx_po_merkle_trees_poll ON po_merkle_trees(poll_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_demographics_poll ON analytics_demographics(poll_id, demographic_key);
CREATE INDEX idx_po_polls_options_gin ON po_polls USING GIN(options);
CREATE INDEX idx_analytics_events_metadata_gin ON analytics_events USING GIN(metadata);

-- Step 8: Enable RLS
ALTER TABLE ia_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_merkle_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_demographics ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
CREATE POLICY "Users manage own profile" ON ia_users
    FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "Public read access to active polls" ON po_polls
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create polls" ON po_polls
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own polls" ON po_polls
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can vote" ON po_votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM po_polls 
            WHERE poll_id = po_votes.poll_id AND status = 'active'
        )
    );

CREATE POLICY "Service role full access" ON ia_users
    FOR ALL USING (auth.role() = 'service_role');

-- Step 10: Create triggers
CREATE TRIGGER update_ia_users_updated_at 
    BEFORE UPDATE ON ia_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_merkle_trees_updated_at 
    BEFORE UPDATE ON po_merkle_trees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM ia_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ia_users TO anon, authenticated;
GRANT INSERT, UPDATE ON ia_users TO authenticated;
GRANT SELECT ON po_polls TO anon, authenticated;
GRANT INSERT ON po_votes TO authenticated;

-- Step 13: Insert sample data
INSERT INTO ia_users (auth_user_id, stable_id, email, verification_tier) 
SELECT 
    id, 
    'user-' || left(uuid_generate_v4()::text, 8), 
    email, 
    'T0'
FROM auth.users
ON CONFLICT (auth_user_id) DO NOTHING;

INSERT INTO po_polls (
    poll_id, 
    title, 
    description, 
    options, 
    created_by,
    start_time, 
    end_time, 
    status, 
    sponsors, 
    ia_public_key
) 
SELECT 
    'climate-action-2024', 
    'Climate Action Priorities 2024', 
    'Help us determine the most important climate action initiatives for the coming year.',
    '["Renewable Energy Investment", "Carbon Tax Implementation", "Electric Vehicle Infrastructure", "Green Building Standards", "Public Transportation Expansion"]',
    (SELECT id FROM ia_users LIMIT 1),
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP + INTERVAL '30 days', 
    'active',
    '["Environmental Coalition", "Green Future Initiative"]',
    'sample-ia-public-key'
WHERE NOT EXISTS (
    SELECT 1 FROM po_polls WHERE poll_id = 'climate-action-2024'
);

-- Success message
SELECT 'Schema created successfully!' as status;

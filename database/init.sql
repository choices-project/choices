-- Choices Database Initialization Script
-- This script sets up the PostgreSQL database for both IA and PO services

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- IA Service Tables

-- Users table for storing user information
CREATE TABLE IF NOT EXISTS ia_users (
    id SERIAL PRIMARY KEY,
    stable_id TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_tier TEXT DEFAULT 'T0',
    is_active BOOLEAN DEFAULT TRUE
);

-- Tokens table for storing issued tokens
CREATE TABLE IF NOT EXISTS ia_tokens (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT NOT NULL,
    poll_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    tag TEXT NOT NULL,
    tier TEXT NOT NULL,
    scope TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Verification sessions for WebAuthn
CREATE TABLE IF NOT EXISTS ia_verification_sessions (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    challenge TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- WebAuthn credentials
CREATE TABLE IF NOT EXISTS ia_webauthn_credentials (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- PO Service Tables

-- Polls table for storing poll information
CREATE TABLE IF NOT EXISTS po_polls (
    id SERIAL PRIMARY KEY,
    poll_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    options JSONB NOT NULL, -- JSON array of options
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'closed'
    sponsors JSONB, -- JSON array of sponsors
    ia_public_key TEXT NOT NULL,
    total_votes INTEGER DEFAULT 0,
    participation_rate DECIMAL(5,2) DEFAULT 0.00
);

-- Votes table for storing vote information
CREATE TABLE IF NOT EXISTS po_votes (
    id SERIAL PRIMARY KEY,
    poll_id TEXT NOT NULL,
    token TEXT NOT NULL,
    tag TEXT NOT NULL,
    choice INTEGER NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    merkle_leaf TEXT NOT NULL,
    merkle_proof JSONB, -- JSON array of proof elements
    FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id) ON DELETE CASCADE
);

-- Merkle trees table for storing Merkle tree state
CREATE TABLE IF NOT EXISTS po_merkle_trees (
    id SERIAL PRIMARY KEY,
    poll_id TEXT UNIQUE NOT NULL,
    root TEXT NOT NULL,
    leaf_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id) ON DELETE CASCADE
);

-- Analytics and Dashboard Tables

-- Real-time analytics data
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'vote', 'poll_created', 'user_registered'
    poll_id TEXT,
    user_stable_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Demographic data (anonymized)
CREATE TABLE IF NOT EXISTS analytics_demographics (
    id SERIAL PRIMARY KEY,
    poll_id TEXT NOT NULL,
    demographic_key TEXT NOT NULL, -- 'age_group', 'location', 'device_type'
    demographic_value TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES po_polls(poll_id) ON DELETE CASCADE
);

-- Create indexes for better performance

-- IA Service indexes
CREATE INDEX IF NOT EXISTS idx_ia_tokens_user_poll ON ia_tokens(user_stable_id, poll_id);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_hash ON ia_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_expires ON ia_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_ia_verification_sessions_user ON ia_verification_sessions(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_webauthn_credentials_user ON ia_webauthn_credentials(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_users_stable_id ON ia_users(stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_users_email ON ia_users(email);

-- PO Service indexes
CREATE INDEX IF NOT EXISTS idx_po_polls_status ON po_polls(status);
CREATE INDEX IF NOT EXISTS idx_po_polls_start_time ON po_polls(start_time);
CREATE INDEX IF NOT EXISTS idx_po_polls_end_time ON po_polls(end_time);
CREATE INDEX IF NOT EXISTS idx_po_polls_created_at ON po_polls(created_at);
CREATE INDEX IF NOT EXISTS idx_po_votes_poll_id ON po_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_po_votes_tag ON po_votes(tag);
CREATE INDEX IF NOT EXISTS idx_po_votes_token ON po_votes(token);
CREATE INDEX IF NOT EXISTS idx_po_votes_voted_at ON po_votes(voted_at);
CREATE INDEX IF NOT EXISTS idx_po_merkle_trees_poll_id ON po_merkle_trees(poll_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_poll_id ON analytics_events(poll_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_demographics_poll_key ON analytics_demographics(poll_id, demographic_key);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ia_users_updated_at BEFORE UPDATE ON ia_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_merkle_trees_updated_at BEFORE UPDATE ON po_merkle_trees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update poll vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE po_polls 
        SET total_votes = total_votes + 1,
            participation_rate = (total_votes + 1) * 100.0 / NULLIF((SELECT COUNT(*) FROM ia_users WHERE is_active = TRUE), 0)
        WHERE poll_id = NEW.poll_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE po_polls 
        SET total_votes = total_votes - 1,
            participation_rate = (total_votes - 1) * 100.0 / NULLIF((SELECT COUNT(*) FROM ia_users WHERE is_active = TRUE), 0)
        WHERE poll_id = OLD.poll_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for automatic vote count updates
CREATE TRIGGER update_poll_vote_count_trigger
    AFTER INSERT OR DELETE ON po_votes
    FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();

-- Insert sample data for development
INSERT INTO ia_users (stable_id, email, verification_tier) VALUES
    ('user_001', 'alice@example.com', 'T2'),
    ('user_002', 'bob@example.com', 'T1'),
    ('user_003', 'charlie@example.com', 'T2'),
    ('user_004', 'diana@example.com', 'T3'),
    ('user_005', 'eve@example.com', 'T1')
ON CONFLICT (stable_id) DO NOTHING;

-- Insert sample polls
INSERT INTO po_polls (poll_id, title, description, options, start_time, end_time, status, sponsors, ia_public_key) VALUES
    ('poll_001', 'Favorite Programming Language 2024', 'What is your preferred programming language for new projects?', 
     '["JavaScript/TypeScript", "Python", "Go", "Rust", "Java", "C++", "Other"]'::jsonb,
     NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', 'active',
     '["Tech Community", "Developer Survey"]'::jsonb,
     '6f0c2a37090a7bc2f7e670c07afa333edc06fe62759b1add546912c2f294787d'),
    
    ('poll_002', 'Best Pizza Topping', 'What is the ultimate pizza topping combination?',
     '["Pepperoni", "Margherita", "Hawaiian", "Supreme", "BBQ Chicken", "Veggie"]'::jsonb,
     NOW() - INTERVAL '2 hours', NOW() + INTERVAL '5 days', 'active',
     '["Food Network", "Pizza Lovers"]'::jsonb,
     '6f0c2a37090a7bc2f7e670c07afa333edc06fe62759b1add546912c2f294787d'),
    
    ('poll_003', 'Climate Change Priority', 'What should be the top priority in addressing climate change?',
     '["Renewable Energy", "Carbon Pricing", "Electric Vehicles", "Forest Conservation", "Industrial Reform", "Individual Action"]'::jsonb,
     NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '3 days', 'active',
     '["Environmental Coalition", "Green Future Initiative"]'::jsonb,
     '6f0c2a37090a7bc2f7e670c07afa333edc06fe62759b1add546912c2f294787d')
ON CONFLICT (poll_id) DO NOTHING;

-- Insert sample votes
INSERT INTO po_votes (poll_id, token, tag, choice, merkle_leaf) VALUES
    ('poll_001', 'token_001', 'tag_001', 0, 'leaf_001'),
    ('poll_001', 'token_002', 'tag_002', 1, 'leaf_002'),
    ('poll_001', 'token_003', 'tag_003', 0, 'leaf_003'),
    ('poll_002', 'token_004', 'tag_004', 2, 'leaf_004'),
    ('poll_002', 'token_005', 'tag_005', 0, 'leaf_005'),
    ('poll_003', 'token_006', 'tag_006', 3, 'leaf_006')
ON CONFLICT DO NOTHING;

-- Insert sample analytics events
INSERT INTO analytics_events (event_type, poll_id, user_stable_id, metadata) VALUES
    ('vote', 'poll_001', 'user_001', '{"choice": 0, "response_time_ms": 1200}'::jsonb),
    ('vote', 'poll_001', 'user_002', '{"choice": 1, "response_time_ms": 800}'::jsonb),
    ('vote', 'poll_002', 'user_003', '{"choice": 2, "response_time_ms": 1500}'::jsonb),
    ('poll_created', 'poll_001', NULL, '{"sponsors": ["Tech Community"]}'::jsonb),
    ('user_registered', NULL, 'user_004', '{"verification_tier": "T3"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO choices_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO choices_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO choices_user;

-- Create a view for dashboard analytics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM po_polls WHERE status = 'active') as active_polls,
    (SELECT COUNT(*) FROM po_votes WHERE voted_at >= NOW() - INTERVAL '24 hours') as votes_today,
    (SELECT COUNT(*) FROM ia_users WHERE is_active = TRUE) as total_users,
    (SELECT COUNT(*) FROM po_polls) as total_polls,
    (SELECT COUNT(*) FROM po_votes) as total_votes,
    (SELECT AVG(participation_rate) FROM po_polls WHERE status = 'active') as avg_participation;

-- Grant access to the view
GRANT SELECT ON dashboard_stats TO choices_user;

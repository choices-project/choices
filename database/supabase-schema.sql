-- Choices Voting System - Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all necessary tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE INDEX IF NOT EXISTS idx_ia_tokens_user_poll ON ia_tokens(user_stable_id, poll_id);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_hash ON ia_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_ia_tokens_expires ON ia_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_ia_verification_sessions_user ON ia_verification_sessions(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_webauthn_credentials_user ON ia_webauthn_credentials(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_users_stable_id ON ia_users(stable_id);
CREATE INDEX IF NOT EXISTS idx_ia_users_email ON ia_users(email);

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

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE ia_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_merkle_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_demographics ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to polls
CREATE POLICY "Public read access to polls" ON po_polls
    FOR SELECT USING (true);

-- Create policies for authenticated users to create votes
CREATE POLICY "Authenticated users can create votes" ON po_votes
    FOR INSERT WITH CHECK (true);

-- Create policies for public read access to vote counts (anonymized)
CREATE POLICY "Public read access to vote counts" ON po_votes
    FOR SELECT USING (true);

-- Create policies for service role access to all tables
CREATE POLICY "Service role access to ia_users" ON ia_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to ia_tokens" ON ia_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to ia_verification_sessions" ON ia_verification_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to ia_webauthn_credentials" ON ia_webauthn_credentials
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to po_polls" ON po_polls
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to po_votes" ON po_votes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to po_merkle_trees" ON po_merkle_trees
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to analytics_events" ON analytics_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access to analytics_demographics" ON analytics_demographics
    FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data for testing
INSERT INTO ia_users (stable_id, email, verification_tier) VALUES
('test-user-1', 'test1@example.com', 'T1'),
('test-user-2', 'test2@example.com', 'T0'),
('test-user-3', 'test3@example.com', 'T2')
ON CONFLICT (stable_id) DO NOTHING;

INSERT INTO po_polls (poll_id, title, description, options, start_time, end_time, status, sponsors, ia_public_key) VALUES
('climate-action-2024', 'Climate Action Priorities 2024', 'Help us determine the most important climate action initiatives for the coming year.', 
 '["Renewable Energy Investment", "Carbon Tax Implementation", "Electric Vehicle Infrastructure", "Green Building Standards", "Public Transportation Expansion"]',
 NOW(), NOW() + INTERVAL '30 days', 'active',
 '["Environmental Coalition", "Green Future Initiative"]',
 'sample-ia-public-key')
ON CONFLICT (poll_id) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_ia_users_updated_at BEFORE UPDATE ON ia_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_merkle_trees_updated_at BEFORE UPDATE ON po_merkle_trees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

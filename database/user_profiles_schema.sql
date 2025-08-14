-- Privacy-First User Profile System
-- Designed for maximum anonymity with bot resistance

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trust Tiers Enum
CREATE TYPE trust_tier AS ENUM ('T0', 'T1', 'T2', 'T3');
CREATE TYPE profile_visibility AS ENUM ('anonymous', 'pseudonymous', 'public');
CREATE TYPE data_sharing_level AS ENUM ('minimal', 'demographic', 'full');

-- Enhanced Users Table (Privacy-First)
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS pseudonym_hash TEXT UNIQUE;
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS trust_tier trust_tier DEFAULT 'T0';
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0;
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;

-- Optional Encrypted Email (only if user explicitly opts in)
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS email_encrypted TEXT;
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE ia_users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;

-- User Profiles Table (Optional, User-Controlled)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    
    -- Privacy Settings
    profile_visibility profile_visibility DEFAULT 'anonymous',
    data_sharing_level data_sharing_level DEFAULT 'minimal',
    
    -- Optional Demographics (User Controls)
    age_range TEXT CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+')),
    education_level TEXT CHECK (education_level IN ('high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'other')),
    income_bracket TEXT CHECK (income_bracket IN ('low', 'lower_middle', 'middle', 'upper_middle', 'high')),
    region_code TEXT, -- Broad region only (e.g., 'US-NE', 'EU-W')
    
    -- Interests (Encrypted, Optional)
    interests_encrypted TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bot Resistance & Verification Tables

-- Device Fingerprinting
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    device_type TEXT,
    browser_info TEXT,
    ip_hash TEXT, -- Hashed IP for rate limiting
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_suspicious BOOLEAN DEFAULT FALSE
);

-- Verification Challenges
CREATE TABLE IF NOT EXISTS verification_challenges (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL, -- 'captcha', 'behavior', 'social'
    challenge_data JSONB NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- User Activity Logs (Anonymized)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'vote', 'profile_update', 'login'
    metadata JSONB, -- Anonymized data only
    ip_hash TEXT, -- For rate limiting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    identifier TEXT NOT NULL, -- ip_hash or user_stable_id
    action_type TEXT NOT NULL, -- 'vote', 'login', 'profile_update'
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE
);

-- Social Verification (Tier 2+)
CREATE TABLE IF NOT EXISTS social_verifications (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL, -- 'invite', 'endorsement', 'consistency'
    verifier_stable_id TEXT REFERENCES ia_users(stable_id),
    verification_data JSONB,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Reputation System
CREATE TABLE IF NOT EXISTS user_reputation (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    reputation_score INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    community_trust_score INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Deletion Requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_stable_id TEXT REFERENCES ia_users(stable_id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'partial', 'complete'
    data_types TEXT[], -- Array of data types to delete
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_stable_id ON user_profiles(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_stable_id ON device_fingerprints(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_verification_challenges_stable_id ON verification_challenges(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_stable_id ON user_activity_logs(user_stable_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_social_verifications_stable_id ON social_verifications(user_stable_id);

-- Functions for Privacy Operations

-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- Remove personal data
    UPDATE user_profiles 
    SET age_range = NULL,
        education_level = NULL,
        income_bracket = NULL,
        region_code = NULL,
        interests_encrypted = NULL,
        profile_visibility = 'anonymous',
        data_sharing_level = 'minimal'
    WHERE user_stable_id = user_id;
    
    -- Anonymize activity logs
    UPDATE user_activity_logs 
    SET metadata = '{"anonymized": true}'::jsonb
    WHERE user_stable_id = user_id;
    
    -- Remove device fingerprints
    DELETE FROM device_fingerprints WHERE user_stable_id = user_id;
    
    -- Remove verification data
    DELETE FROM verification_challenges WHERE user_stable_id = user_id;
    DELETE FROM social_verifications WHERE user_stable_id = user_id;
    
    -- Reset user to anonymous
    UPDATE ia_users 
    SET pseudonym_hash = NULL,
        email_encrypted = NULL,
        email_verified = FALSE,
        trust_tier = 'T0',
        verification_score = 0,
        is_suspicious = FALSE
    WHERE stable_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate verification score
CREATE OR REPLACE FUNCTION calculate_verification_score(user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    challenge_count INTEGER;
    social_count INTEGER;
    consistency_score INTEGER;
BEGIN
    -- Count completed challenges
    SELECT COUNT(*) INTO challenge_count 
    FROM verification_challenges 
    WHERE user_stable_id = user_id AND completed = TRUE;
    
    -- Count social verifications
    SELECT COUNT(*) INTO social_count 
    FROM social_verifications 
    WHERE user_stable_id = user_id AND verified = TRUE;
    
    -- Get consistency score
    SELECT COALESCE(consistency_score, 0) INTO consistency_score 
    FROM user_reputation 
    WHERE user_stable_id = user_id;
    
    -- Calculate total score
    score := (challenge_count * 10) + (social_count * 20) + consistency_score;
    
    -- Cap at 100
    IF score > 100 THEN
        score := 100;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(identifier TEXT, action_type TEXT, max_count INTEGER, window_minutes INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Clean old entries
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour' * window_minutes;
    
    -- Get current count
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM rate_limits 
    WHERE identifier = $1 
    AND action_type = $2 
    AND window_start > NOW() - INTERVAL '1 minute' * window_minutes;
    
    -- Check if blocked
    IF EXISTS (
        SELECT 1 FROM rate_limits 
        WHERE identifier = $1 
        AND action_type = $2 
        AND is_blocked = TRUE
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check limit
    IF current_count >= max_count THEN
        -- Block for 1 hour
        INSERT INTO rate_limits (identifier, action_type, is_blocked)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (identifier, action_type) 
        DO UPDATE SET is_blocked = TRUE;
        RETURN FALSE;
    END IF;
    
    -- Increment count
    INSERT INTO rate_limits (identifier, action_type, count)
    VALUES ($1, $2, 1)
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET count = rate_limits.count + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Supabase Database Schema for Choices Platform
-- This file contains the complete database schema with proper constraints and relationships

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  trust_tier VARCHAR(2) NOT NULL DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Additional profile fields
  display_name VARCHAR(100),
  location VARCHAR(100),
  website VARCHAR(255),
  social_links JSONB,
  preferences JSONB DEFAULT '{}',
  
  -- Verification fields
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  
  -- Privacy settings
  privacy_settings JSONB DEFAULT '{
    "profile_visibility": "public",
    "show_email": false,
    "show_location": false,
    "allow_analytics": true,
    "allow_marketing": false
  }'
);

-- Polls Table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  options TEXT[] NOT NULL CHECK (array_length(options, 1) >= 2),
  voting_method VARCHAR(20) NOT NULL CHECK (voting_method IN ('single', 'approval', 'ranked', 'quadratic', 'range')),
  created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  privacy_level VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'high-privacy')),
  total_votes INTEGER DEFAULT 0,
  category VARCHAR(100),
  tags TEXT[],
  
  -- Voting configuration
  voting_config JSONB DEFAULT '{
    "allow_multiple_votes": false,
    "require_verification": false,
    "min_trust_tier": "T0",
    "max_choices": null,
    "quadratic_credits": 100,
    "range_min": 0,
    "range_max": 10
  }',
  
  -- Results and analytics
  results JSONB,
  analytics JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_poll_dates CHECK (end_time > start_time),
  CONSTRAINT valid_voting_method_options CHECK (
    (voting_method = 'single' AND array_length(options, 1) >= 2) OR
    (voting_method = 'approval' AND array_length(options, 1) >= 2) OR
    (voting_method = 'ranked' AND array_length(options, 1) >= 3) OR
    (voting_method = 'quadratic' AND array_length(options, 1) >= 2) OR
    (voting_method = 'range' AND array_length(options, 1) >= 2)
  )
);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  choice INTEGER NOT NULL CHECK (choice >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_token VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  voting_method VARCHAR(20) NOT NULL CHECK (voting_method IN ('single', 'approval', 'ranked', 'quadratic', 'range')),
  vote_data JSONB,
  
  -- Verification and security
  ip_address INET,
  user_agent TEXT,
  verification_method VARCHAR(50),
  verification_metadata JSONB,
  
  -- Constraints
  CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id),
  CONSTRAINT valid_choice CHECK (choice >= 0)
);

-- WebAuthn Credentials Table
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  sign_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Additional credential metadata
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  backup_eligible BOOLEAN DEFAULT false,
  backup_state BOOLEAN DEFAULT false,
  transports TEXT[],
  
  -- Security metadata
  aaguid UUID,
  attestation_object TEXT,
  client_data_json TEXT
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Additional error metadata
  source VARCHAR(100),
  component VARCHAR(100),
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  
  -- Error categorization
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags TEXT[]
);

-- Cache Table for Performance Optimization
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cache metadata
  cache_type VARCHAR(50),
  size_bytes INTEGER,
  compression_ratio FLOAT,
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Analytics Table for Performance Monitoring
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Analytics metadata
  source VARCHAR(100),
  version VARCHAR(20),
  environment VARCHAR(20),
  
  -- Performance data
  duration_ms INTEGER,
  memory_usage_mb FLOAT,
  cpu_usage_percent FLOAT
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  requests INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Rate limit metadata
  limit_type VARCHAR(50),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  ip_address INET,
  
  -- Constraints
  CONSTRAINT valid_window CHECK (window_end > window_start)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  
  -- Notification metadata
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category VARCHAR(50),
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- User Sessions Table for Enhanced Security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Session metadata
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  
  -- Security metadata
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_method VARCHAR(50),
  mfa_verified BOOLEAN DEFAULT false,
  
  -- Constraints
  CONSTRAINT valid_session_expiry CHECK (expires_at > created_at)
);

-- Device Flows Table for OAuth 2.0 Device Authorization Grant
CREATE TABLE IF NOT EXISTS device_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_code VARCHAR(8) NOT NULL UNIQUE,
  user_code VARCHAR(8) NOT NULL UNIQUE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'github', 'facebook', 'twitter', 'linkedin', 'discord')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'error')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_ip INET,
  redirect_to TEXT DEFAULT '/dashboard',
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for performance
  CONSTRAINT valid_device_flow_dates CHECK (expires_at > created_at),
  CONSTRAINT valid_completion_dates CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Indexes for device flows
CREATE INDEX IF NOT EXISTS idx_device_flows_device_code ON device_flows(device_code);
CREATE INDEX IF NOT EXISTS idx_device_flows_user_code ON device_flows(user_code);
CREATE INDEX IF NOT EXISTS idx_device_flows_status ON device_flows(status);
CREATE INDEX IF NOT EXISTS idx_device_flows_expires_at ON device_flows(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_flows_client_ip ON device_flows(client_ip);
CREATE INDEX IF NOT EXISTS idx_device_flows_user_id ON device_flows(user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);

CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_privacy_level ON polls(privacy_level);
CREATE INDEX IF NOT EXISTS idx_polls_start_time ON polls(start_time);
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);
CREATE INDEX IF NOT EXISTS idx_polls_category ON polls(category);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_verification_token ON votes(verification_token);

CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_is_active ON webauthn_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_key_pattern ON cache USING gin(key gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_polls_title_description ON polls USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_search ON user_profiles USING gin(to_tsvector('english', username));
CREATE INDEX IF NOT EXISTS idx_error_logs_message_search ON error_logs USING gin(to_tsvector('english', error_message));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_polls_status_privacy ON polls(status, privacy_level);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON votes(poll_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_active ON user_profiles(trust_tier, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_votes_unverified ON votes(id) WHERE is_verified = false;
CREATE INDEX IF NOT EXISTS idx_cache_active ON cache(key) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(id) WHERE is_active = true AND expires_at > NOW();

-- Enable Row Level Security (RLS will be configured in separate file)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

# Choices Platform Database Schema for AI Problem Solving

**Platform:** Democratic voting and polling system with advanced authentication  
**Database:** PostgreSQL (Supabase) with Row Level Security (RLS)  
**Authentication:** Custom JWT + WebAuthn + OAuth providers  
**Last Updated:** 2025-08-25 20:53 UTC  

## Database Overview

The Choices platform uses a PostgreSQL database hosted on Supabase with comprehensive Row Level Security (RLS) policies. The system supports multiple authentication methods, democratic voting with various methods, and privacy-focused user management.

## Core Tables

### 1. `ia_users` - Main User Authentication Table
```sql
CREATE TABLE ia_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stable_id TEXT UNIQUE NOT NULL,                    -- Stable identifier for user
  email TEXT UNIQUE NOT NULL,                        -- User email address
  password_hash TEXT,                                -- bcrypt hashed password
  verification_tier TEXT DEFAULT 'T0' CHECK (verification_tier IN ('T0', 'T1', 'T2', 'T3')),
  is_active BOOLEAN DEFAULT TRUE,                    -- Account status
  two_factor_enabled BOOLEAN DEFAULT FALSE,          -- 2FA status
  two_factor_secret TEXT,                            -- TOTP secret
  last_login_at TIMESTAMP WITH TIME ZONE,            -- Last login timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Relationships:**
- Referenced by `user_profiles.user_id` (via `stable_id`)
- Referenced by `biometric_credentials.user_id` (via `stable_id`)
- Referenced by `po_polls.created_by` and `po_polls.user_id` (via `stable_id`)

### 2. `user_profiles` - Extended User Profile Data
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  display_name TEXT,                                 -- User display name
  avatar_url TEXT,                                   -- Profile picture URL
  bio TEXT,                                          -- User biography
  preferences JSONB DEFAULT '{}',                    -- User preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `biometric_credentials` - WebAuthn Biometric Authentication
```sql
CREATE TABLE biometric_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,                -- WebAuthn credential ID
  device_type TEXT,                                  -- Device type (phone, laptop, etc.)
  authenticator_type TEXT,                           -- Authenticator type
  sign_count INTEGER DEFAULT 0,                      -- Security counter
  last_used_at TIMESTAMP WITH TIME ZONE,             -- Last authentication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. `po_polls` - Democratic Polling System
```sql
CREATE TABLE po_polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT UNIQUE NOT NULL,                      -- Public poll identifier
  title TEXT NOT NULL,                               -- Poll title
  description TEXT,                                  -- Poll description
  options JSONB NOT NULL,                            -- Poll options array
  created_by TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_time TIMESTAMP WITH TIME ZONE,               -- Poll start time
  end_time TIMESTAMP WITH TIME ZONE,                 -- Poll end time
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'restricted')),
  voting_method TEXT DEFAULT 'single' CHECK (voting_method IN ('single', 'multiple', 'ranked')),
  category TEXT,                                     -- Poll category
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE
);
```

### 5. `po_votes` - Voting Records with Privacy Controls
```sql
CREATE TABLE po_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES po_polls(poll_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  vote_data JSONB NOT NULL,                          -- Vote data (varies by voting method)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)                           -- One vote per user per poll
);
```

## Authentication Tables

### 6. `ia_tokens` - JWT Token Management
```sql
CREATE TABLE ia_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_stable_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh', 'reset')),
  token_hash TEXT NOT NULL,                          -- Hashed token for security
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. `webauthn_challenges` - Authentication Challenges
```sql
CREATE TABLE webauthn_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,                           -- WebAuthn challenge
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. `ia_refresh_tokens` - Refresh Token Storage
```sql
CREATE TABLE ia_refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,                          -- Hashed refresh token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Extended Schema (Additional Tables)

### 9. `device_flows` - OAuth 2.0 Device Authorization Grant
```sql
CREATE TABLE device_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code VARCHAR(8) NOT NULL UNIQUE,            -- Device authorization code
  user_code VARCHAR(8) NOT NULL UNIQUE,              -- User verification code
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'github', 'facebook', 'twitter', 'linkedin', 'discord')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'error')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_ip INET,                                    -- Client IP address
  redirect_to TEXT DEFAULT '/dashboard',             -- Redirect URL after auth
  scopes TEXT[] DEFAULT '{}',                        -- Requested OAuth scopes
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### 10. `user_profiles` (Extended) - Enhanced User Profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,              -- Username for login
  email VARCHAR(255) NOT NULL UNIQUE,                -- Email address
  trust_tier VARCHAR(2) NOT NULL DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,                                   -- Profile picture URL
  bio TEXT,                                          -- User biography
  is_active BOOLEAN DEFAULT true,                    -- Account status
  
  -- Additional profile fields
  display_name VARCHAR(100),                         -- Display name
  location VARCHAR(100),                             -- User location
  website VARCHAR(255),                              -- Personal website
  social_links JSONB,                                -- Social media links
  
  -- Verification fields
  email_verified BOOLEAN DEFAULT false,              -- Email verification status
  phone_verified BOOLEAN DEFAULT false,              -- Phone verification status
  identity_verified BOOLEAN DEFAULT false,           -- Identity verification status
  
  -- Privacy settings
  privacy_settings JSONB DEFAULT '{
    "profile_visibility": "public",
    "show_email": false,
    "show_location": false,
    "allow_analytics": true,
    "allow_marketing": false
  }'
);
```

### 11. `polls` - Enhanced Polling System
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,                       -- Poll title
  description TEXT NOT NULL,                         -- Poll description
  options TEXT[] NOT NULL CHECK (array_length(options, 1) >= 2), -- Poll options
  voting_method VARCHAR(20) NOT NULL CHECK (voting_method IN ('single', 'approval', 'ranked', 'quadratic', 'range')),
  created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,      -- Poll start time
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,        -- Poll end time
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  privacy_level VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'high-privacy')),
  total_votes INTEGER DEFAULT 0,                     -- Vote count
  category VARCHAR(100),                             -- Poll category
  tags TEXT[],                                       -- Poll tags
  
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
  results JSONB,                                     -- Poll results
  analytics JSONB DEFAULT '{}'                       -- Analytics data
);
```

### 12. `votes` - Enhanced Voting Records
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  choice INTEGER NOT NULL CHECK (choice >= 0),       -- Selected option index
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_token VARCHAR(255),                   -- Vote verification token
  is_verified BOOLEAN DEFAULT false,                 -- Verification status
  voting_method VARCHAR(20) NOT NULL CHECK (voting_method IN ('single', 'approval', 'ranked', 'quadratic', 'range')),
  vote_data JSONB,                                   -- Detailed vote data
  
  -- Verification and security
  ip_address INET,                                   -- Voter IP address
  user_agent TEXT,                                   -- User agent string
  verification_method VARCHAR(50),                   -- Verification method used
  verification_metadata JSONB,                       -- Verification metadata
  
  CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id)
);
```

## Security and Performance Tables

### 13. `error_logs` - Error Tracking
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,                  -- Error type
  error_message TEXT NOT NULL,                       -- Error message
  stack_trace TEXT,                                  -- Stack trace
  context JSONB,                                     -- Error context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Additional error metadata
  source VARCHAR(100),                               -- Error source
  component VARCHAR(100),                            -- Component where error occurred
  session_id VARCHAR(255),                           -- Session ID
  request_id VARCHAR(255),                           -- Request ID
  user_agent TEXT,                                   -- User agent
  ip_address INET,                                   -- IP address
  
  -- Error categorization
  category VARCHAR(100),                             -- Error category
  subcategory VARCHAR(100),                          -- Error subcategory
  tags TEXT[]                                        -- Error tags
);
```

### 14. `cache` - Performance Optimization
```sql
CREATE TABLE cache (
  key TEXT PRIMARY KEY,                              -- Cache key
  value JSONB NOT NULL,                              -- Cached value
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,      -- Expiration time
  access_count INTEGER DEFAULT 0,                    -- Access counter
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cache metadata
  cache_type VARCHAR(50),                            -- Cache type
  size_bytes INTEGER,                                -- Size in bytes
  compression_ratio FLOAT                            -- Compression ratio
);
```

### 15. `analytics` - Performance Monitoring
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,                  -- Event type
  event_data JSONB NOT NULL,                         -- Event data
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  session_id VARCHAR(255),                           -- Session ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Analytics metadata
  source VARCHAR(100),                               -- Event source
  version VARCHAR(20),                               -- App version
  environment VARCHAR(20),                           -- Environment (dev/prod)
  
  -- Performance data
  duration_ms INTEGER,                               -- Event duration
  memory_usage_mb FLOAT,                             -- Memory usage
  cpu_usage_percent FLOAT                            -- CPU usage
);
```

### 16. `rate_limits` - API Rate Limiting
```sql
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,                              -- Rate limit key
  requests INTEGER DEFAULT 1,                        -- Request count
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,      -- Window end time
  
  -- Rate limit metadata
  limit_type VARCHAR(50),                            -- Limit type
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  ip_address INET                                    -- IP address
);
```

### 17. `notifications` - User Notification System
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,                         -- Notification type
  title VARCHAR(255) NOT NULL,                       -- Notification title
  message TEXT NOT NULL,                             -- Notification message
  data JSONB,                                        -- Notification data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,                  -- Read timestamp
  is_read BOOLEAN DEFAULT false,                     -- Read status
  
  -- Notification metadata
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category VARCHAR(50),                              -- Notification category
  action_url TEXT,                                   -- Action URL
  expires_at TIMESTAMP WITH TIME ZONE                -- Expiration time
);
```

### 18. `user_sessions` - Enhanced Security
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,        -- Session token
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,      -- Session expiration
  is_active BOOLEAN DEFAULT true,                    -- Session status
  
  -- Session metadata
  ip_address INET,                                   -- IP address
  user_agent TEXT,                                   -- User agent
  device_info JSONB,                                 -- Device information
  location_info JSONB,                               -- Location information
  
  -- Security metadata
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_method VARCHAR(50),                          -- Login method used
  mfa_verified BOOLEAN DEFAULT false                 -- MFA verification status
);
```

## Key Indexes for Performance

```sql
-- User-related indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_trust_tier ON user_profiles(trust_tier);

-- Poll-related indexes
CREATE INDEX idx_polls_created_by ON polls(created_by);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_privacy_level ON polls(privacy_level);
CREATE INDEX idx_polls_start_time ON polls(start_time);
CREATE INDEX idx_polls_end_time ON polls(end_time);
CREATE INDEX idx_polls_category ON polls(category);

-- Vote-related indexes
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);
CREATE INDEX idx_votes_verification_token ON votes(verification_token);

-- Authentication indexes
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_device_flows_device_code ON device_flows(device_code);
CREATE INDEX idx_device_flows_user_code ON device_flows(user_code);

-- Performance indexes
CREATE INDEX idx_cache_expires_at ON cache(expires_at);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Full-text search indexes
CREATE INDEX idx_polls_title_description ON polls USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_user_profiles_username_search ON user_profiles USING gin(to_tsvector('english', username));
```

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following security principles:

1. **User-Specific Access**: Users can only access their own data
2. **Service Role Access**: Admin operations use service role with full access
3. **Public Access**: Limited public access for democratic features
4. **Cascade Security**: Related data inherits security policies

### Example RLS Policies

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON ia_users
  FOR SELECT USING (auth.jwt() ->> 'userId' = id::text);

-- Anyone can view public polls
CREATE POLICY "Anyone can view public polls" ON po_polls
  FOR SELECT USING (privacy_level = 'public');

-- Users can only see their own votes
CREATE POLICY "Users can view own votes" ON po_votes
  FOR SELECT USING (auth.jwt() ->> 'userId' = user_id);

-- Service role can access all data
CREATE POLICY "Service role full access" ON ia_users
  FOR ALL USING (auth.role() = 'service_role');
```

## Data Relationships

### User Authentication Flow
```
ia_users (stable_id) 
  ↓
user_profiles (user_id)
  ↓
biometric_credentials (user_id)
webauthn_challenges (user_id)
ia_tokens (user_stable_id)
ia_refresh_tokens (user_id)
```

### Polling System Flow
```
ia_users (stable_id)
  ↓
po_polls (created_by, user_id)
  ↓
po_votes (poll_id, user_id)
```

### Enhanced System Flow
```
user_profiles (user_id)
  ↓
polls (created_by)
  ↓
votes (poll_id, user_id)
  ↓
notifications (user_id)
user_sessions (user_id)
```

## Common Query Patterns

### User Authentication
```sql
-- Get user by email
SELECT * FROM ia_users WHERE email = $1;

-- Get user profile with authentication data
SELECT u.*, up.* 
FROM ia_users u 
JOIN user_profiles up ON u.stable_id = up.user_id 
WHERE u.email = $1;
```

### Poll Management
```sql
-- Get active public polls
SELECT * FROM po_polls 
WHERE status = 'active' 
AND privacy_level = 'public' 
AND NOW() BETWEEN start_time AND end_time;

-- Get user's polls with vote counts
SELECT p.*, COUNT(v.id) as vote_count 
FROM po_polls p 
LEFT JOIN po_votes v ON p.poll_id = v.poll_id 
WHERE p.created_by = $1 
GROUP BY p.id;
```

### Voting Operations
```sql
-- Check if user has voted
SELECT EXISTS(
  SELECT 1 FROM po_votes 
  WHERE poll_id = $1 AND user_id = $2
);

-- Get poll results
SELECT p.title, v.vote_data, COUNT(*) as vote_count
FROM po_polls p
JOIN po_votes v ON p.poll_id = v.poll_id
WHERE p.poll_id = $1
GROUP BY p.title, v.vote_data;
```

### Analytics and Monitoring
```sql
-- Get user activity
SELECT event_type, COUNT(*) as count
FROM analytics
WHERE user_id = $1
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type;

-- Get error rates
SELECT error_type, COUNT(*) as count
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;
```

## Environment Variables

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Configuration
NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,github,facebook,twitter,linkedin,discord

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

## Common Issues and Solutions

### 1. Authentication Issues
- **Problem**: User can't authenticate with biometric
- **Solution**: Check `biometric_credentials` table for valid credentials and `webauthn_challenges` for active challenges

### 2. Voting Issues
- **Problem**: User can't vote on poll
- **Solution**: Verify poll status is 'active', check `po_votes` for existing vote, ensure user meets trust tier requirements

### 3. Performance Issues
- **Problem**: Slow poll queries
- **Solution**: Check indexes on `po_polls` and `po_votes`, use `cache` table for frequently accessed data

### 4. Security Issues
- **Problem**: Unauthorized access to private data
- **Solution**: Verify RLS policies are enabled, check JWT token validity, ensure proper service role usage

## Migration and Maintenance

### Adding New Tables
1. Create table with proper constraints
2. Enable RLS
3. Create appropriate indexes
4. Add RLS policies
5. Update TypeScript types

### Schema Changes
1. Use migrations for all changes
2. Test with RLS enabled
3. Update related queries
4. Verify data integrity
5. Update documentation

This schema supports a comprehensive democratic voting platform with advanced authentication, privacy controls, and performance optimization.

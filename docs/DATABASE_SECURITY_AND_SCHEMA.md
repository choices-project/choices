# Database Security and Schema Documentation

**Last Updated:** 2025-08-21  
**Version:** 1.0  
**Status:** Production Ready

## Overview

This document outlines the comprehensive database security setup, schema design, and Row Level Security (RLS) policies for the Choices platform. Our database uses Supabase PostgreSQL with custom authentication and strict security policies.

## Database Schema

### Core Tables

#### `ia_users` - Main User Table
```sql
CREATE TABLE ia_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stable_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  verification_tier TEXT DEFAULT 'T0' CHECK (verification_tier IN ('T0', 'T1', 'T2', 'T3')),
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Central user authentication and authorization table  
**Security:** RLS enabled with user-specific access policies

#### `user_profiles` - User Profile Data
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Extended user profile information  
**Security:** RLS enabled, users can only access their own profiles

#### `biometric_credentials` - WebAuthn Credentials
```sql
CREATE TABLE biometric_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  device_type TEXT,
  authenticator_type TEXT,
  sign_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Store WebAuthn biometric authentication credentials  
**Security:** RLS enabled, users can only manage their own credentials

#### `po_polls` - Polling System
```sql
CREATE TABLE po_polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  created_by TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'restricted')),
  voting_method TEXT DEFAULT 'single' CHECK (voting_method IN ('single', 'multiple', 'ranked')),
  category TEXT,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE
);
```

**Purpose:** Democratic polling system  
**Security:** RLS enabled with public viewing and user-specific creation/editing

#### `po_votes` - Voting Records
```sql
CREATE TABLE po_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES po_polls(poll_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  vote_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
```

**Purpose:** Store user votes with privacy controls  
**Security:** RLS enabled, users can only see their own votes

### Authentication Tables

#### `ia_tokens` - JWT Token Management
```sql
CREATE TABLE ia_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_stable_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh', 'reset')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** Secure token storage and management  
**Security:** RLS enabled, users can only access their own tokens

#### `webauthn_challenges` - Authentication Challenges
```sql
CREATE TABLE webauthn_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose:** WebAuthn challenge-response security  
**Security:** RLS enabled, users can only access their own challenges

## Row Level Security (RLS) Policies

### Security Principles

1. **Principle of Least Privilege:** Users can only access their own data
2. **Service Role Access:** Admin operations use service role with full access
3. **Public Access:** Limited public access for democratic features
4. **Cascade Security:** Related data inherits security policies

### Policy Categories

#### User-Specific Access
- Users can only view, update, and delete their own data
- JWT token validation ensures proper user identification
- Foreign key relationships maintain data integrity

#### Service Role Access
- Admin operations bypass RLS using service role
- Full access for system maintenance and user management
- Secure credential management

#### Public Access
- Public polls are viewable by anyone
- Democratic participation without authentication barriers
- Privacy controls for sensitive poll data

### Policy Examples

#### ia_users Table
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON ia_users
  FOR SELECT USING (auth.jwt() ->> 'userId' = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON ia_users
  FOR UPDATE USING (auth.jwt() ->> 'userId' = id::text);

-- Service role can access all data
CREATE POLICY "Service role full access" ON ia_users
  FOR ALL USING (auth.role() = 'service_role');
```

#### po_polls Table
```sql
-- Anyone can view public polls
CREATE POLICY "Anyone can view public polls" ON po_polls
  FOR SELECT USING (privacy_level = 'public');

-- Users can view their own polls
CREATE POLICY "Users can view own polls" ON po_polls
  FOR SELECT USING (auth.jwt() ->> 'userId' = user_id);

-- Users can create polls
CREATE POLICY "Users can create polls" ON po_polls
  FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = user_id);
```

## Security Features

### Authentication System
- **Custom JWT Tokens:** Secure token-based authentication
- **Password Hashing:** bcrypt with salt rounds
- **Two-Factor Authentication:** TOTP support
- **Biometric Authentication:** WebAuthn integration
- **Session Management:** Secure token storage and refresh

### Data Protection
- **Encryption at Rest:** Supabase handles database encryption
- **Encryption in Transit:** TLS/SSL for all connections
- **Token Security:** JWT tokens with expiration and refresh
- **Privacy Controls:** User-controlled data sharing

### Access Control
- **Row Level Security:** Database-level access control
- **Role-Based Access:** Service role and user roles
- **Verification Tiers:** T0-T3 access levels
- **Audit Trail:** Comprehensive logging of access

## Best Practices

### Database Operations
1. **Always use RLS:** Never disable RLS in production
2. **Service Role Only:** Use service role for admin operations
3. **Parameterized Queries:** Prevent SQL injection
4. **Connection Pooling:** Efficient resource management

### Security Maintenance
1. **Regular Audits:** Monthly security reviews
2. **Policy Updates:** Keep RLS policies current
3. **Token Rotation:** Regular JWT secret updates
4. **Access Monitoring:** Track unusual access patterns

### Development Guidelines
1. **Test with RLS:** Always test with RLS enabled
2. **Mock Authentication:** Use proper auth in tests
3. **Error Handling:** Secure error messages
4. **Documentation:** Keep security docs updated

## Monitoring and Alerts

### Security Monitoring
- **Failed Authentication:** Track login attempts
- **Policy Violations:** Monitor RLS policy failures
- **Unusual Access:** Alert on suspicious patterns
- **Token Abuse:** Monitor JWT token usage

### Performance Monitoring
- **Query Performance:** Monitor slow queries
- **Connection Usage:** Track database connections
- **Storage Growth:** Monitor table sizes
- **Index Usage:** Optimize query performance

## Compliance and Standards

### Data Protection
- **GDPR Compliance:** User data rights and deletion
- **Privacy by Design:** Built-in privacy controls
- **Data Minimization:** Only collect necessary data
- **Consent Management:** User consent tracking

### Security Standards
- **OWASP Guidelines:** Follow security best practices
- **NIST Framework:** Cybersecurity framework compliance
- **ISO 27001:** Information security management
- **SOC 2:** Service organization controls

## Emergency Procedures

### Security Incidents
1. **Immediate Response:** Isolate affected systems
2. **Investigation:** Analyze security logs
3. **Containment:** Prevent further damage
4. **Recovery:** Restore secure state
5. **Documentation:** Record incident details

### Data Breach Response
1. **Assessment:** Determine breach scope
2. **Notification:** Inform affected users
3. **Remediation:** Fix security vulnerabilities
4. **Monitoring:** Enhanced security monitoring
5. **Review:** Post-incident analysis

## Conclusion

The Choices platform database is designed with security as a primary concern. Through comprehensive RLS policies, secure authentication, and proper access controls, we ensure that user data is protected while maintaining the democratic nature of the platform.

**Key Security Achievements:**
- ✅ All tables have RLS enabled
- ✅ User-specific access policies implemented
- ✅ Service role access for admin operations
- ✅ Public access for democratic features
- ✅ Comprehensive audit trail
- ✅ GDPR and privacy compliance

For questions or security concerns, please contact the development team or create a security issue in the project repository.

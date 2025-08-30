# Database Security and Schema Documentation
**Created:** August 30, 2025  
**Last Updated:** August 30, 2025  
**Status:** 🔒 **SECURE AND COMPREHENSIVE**

## 🎯 **Overview**

This document provides comprehensive documentation of the Choices platform database schema, security implementation, and data protection measures. The platform uses Supabase (PostgreSQL) with Row Level Security (RLS) and comprehensive security enhancements.

## 🏗️ **Database Architecture**

### **Technology Stack**
- **Database**: PostgreSQL (via Supabase)
- **Security**: Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

### **Security Model**
- **Multi-tenant**: Secure data isolation
- **Role-based**: Granular access control
- **Audit trails**: Complete operation logging
- **Encryption**: Data at rest and in transit

## 📊 **Database Schema**

### **Core Tables**

#### **1. ia_users**
```sql
CREATE TABLE ia_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trust_tier INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

#### **2. user_profiles**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES ia_users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. polls**
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES ia_users(id) ON DELETE CASCADE,
  poll_type VARCHAR(50) DEFAULT 'single_choice',
  options JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **4. votes**
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES ia_users(id) ON DELETE CASCADE,
  selected_options JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, voter_id)
);
```

#### **5. feedback**
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ia_users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  sentiment VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Security Tables**

#### **6. security_audit_log**
```sql
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ia_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **7. rate_limits**
```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ia_users(id) ON DELETE CASCADE,
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start)
);
```

## 🔒 **Security Implementation**

### **Row Level Security (RLS)**

#### **ia_users RLS Policies**
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON ia_users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON ia_users
  FOR UPDATE USING (auth.uid() = id);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON ia_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ia_users 
      WHERE id = auth.uid() AND trust_tier >= 2
    )
  );
```

#### **polls RLS Policies**
```sql
-- Anyone can view public polls
CREATE POLICY "Anyone can view public polls" ON polls
  FOR SELECT USING (is_public = true);

-- Users can view their own polls
CREATE POLICY "Users can view own polls" ON polls
  FOR SELECT USING (creator_id = auth.uid());

-- Users can create polls
CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Users can update their own polls
CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (creator_id = auth.uid());

-- Only admins can delete polls
CREATE POLICY "Only admins can delete polls" ON polls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ia_users 
      WHERE id = auth.uid() AND trust_tier >= 2
    )
  );
```

#### **votes RLS Policies**
```sql
-- Users can view votes on public polls
CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE id = votes.poll_id AND is_public = true
    )
  );

-- Users can view their own votes
CREATE POLICY "Users can view own votes" ON votes
  FOR SELECT USING (voter_id = auth.uid());

-- Users can vote once per poll
CREATE POLICY "Users can vote once per poll" ON votes
  FOR INSERT WITH CHECK (voter_id = auth.uid());

-- Users cannot update or delete votes
CREATE POLICY "No vote updates or deletions" ON votes
  FOR ALL USING (false);
```

### **Security Constraints**

#### **Content Length Limits**
```sql
-- Feedback content limits
ALTER TABLE feedback ADD CONSTRAINT feedback_title_length_check 
  CHECK (char_length(title) <= 200);

ALTER TABLE feedback ADD CONSTRAINT feedback_description_length_check 
  CHECK (char_length(description) <= 1000);

-- Poll content limits
ALTER TABLE polls ADD CONSTRAINT polls_title_length_check 
  CHECK (char_length(title) <= 200);

ALTER TABLE polls ADD CONSTRAINT polls_description_length_check 
  CHECK (char_length(description) <= 2000);
```

#### **Daily Submission Limits**
```sql
-- Function to check daily feedback limits
CREATE OR REPLACE FUNCTION check_daily_feedback_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user's trust tier
  DECLARE
    user_tier INTEGER;
    daily_limit INTEGER;
    current_count INTEGER;
  BEGIN
    SELECT trust_tier INTO user_tier 
    FROM ia_users 
    WHERE id = NEW.user_id;
    
    -- Set daily limits based on trust tier
    CASE user_tier
      WHEN 0 THEN daily_limit := 2;  -- Anonymous
      WHEN 1 THEN daily_limit := 5;  -- Basic
      WHEN 2 THEN daily_limit := 10; -- Admin
      WHEN 3 THEN daily_limit := 20; -- Premium
      ELSE daily_limit := 2;
    END CASE;
    
    -- Count today's submissions
    SELECT COUNT(*) INTO current_count
    FROM feedback
    WHERE user_id = NEW.user_id
    AND created_at >= CURRENT_DATE;
    
    IF current_count >= daily_limit THEN
      RAISE EXCEPTION 'Daily feedback limit exceeded for user tier %', user_tier;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce daily limits
CREATE TRIGGER enforce_daily_feedback_limit
  BEFORE INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_feedback_limit();
```

## 🛡️ **Security Enhancements**

### **Rate Limiting**
The platform implements comprehensive rate limiting at multiple levels:

#### **API Rate Limits**
```typescript
const rateLimits = {
  feedback: { windowMs: 15 * 60 * 1000, max: 5 },    // 5 feedback per 15 minutes
  auth: { windowMs: 15 * 60 * 1000, max: 10 },       // 10 auth attempts per 15 minutes
  api: { windowMs: 15 * 60 * 1000, max: 100 },       // 100 API calls per 15 minutes
  admin: { windowMs: 15 * 60 * 1000, max: 50 }       // 50 admin requests per 15 minutes
}
```

#### **Content Filtering**
Automatic detection and blocking of suspicious content:
- **ALL CAPS Detection**: Blocks content with 5+ consecutive uppercase letters
- **Excessive Punctuation**: Blocks content with 3+ consecutive exclamation marks
- **Spam Words**: Blocks common spam phrases
- **URL Filtering**: Limits URLs in content
- **Length Limits**: Enforces maximum content lengths

### **Security Headers**
Comprehensive security headers for all routes:
```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
}
```

### **Request Validation**
- **Request Size Validation**: 1MB maximum request size
- **Content Validation**: Enhanced validation for all submissions
- **Security Metadata**: IP address and user agent tracking
- **Input Sanitization**: Automatic sanitization of user inputs

## 📊 **Performance Optimization**

### **Indexes**
```sql
-- Performance indexes for common queries
CREATE INDEX idx_polls_creator_id ON polls(creator_id);
CREATE INDEX idx_polls_is_public ON polls(is_public);
CREATE INDEX idx_polls_created_at ON polls(created_at);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at);
```

### **Connection Pooling**
- **Supabase Connection Pool**: Optimized for concurrent connections
- **Query Optimization**: Efficient queries with proper indexing
- **Caching Strategy**: Intelligent caching with TTL

## 🔍 **Monitoring and Auditing**

### **Audit Logging**
All security events are logged to `security_audit_log` table:
- User actions and authentication events
- Rate limit violations
- Content filtering events
- IP addresses and user agents
- Resource access patterns

### **Security Metrics**
- **Rate Limit Violations**: Tracked and analyzed
- **Content Filtering**: Logged security events
- **IP Blocking**: Automatic blocking events
- **Daily Limits**: User submission tracking

## 🚀 **Deployment Security**

### **Environment Security**
- **Environment Variables**: All secrets stored securely
- **Database Credentials**: Rotated regularly
- **API Keys**: Limited scope and permissions
- **SSL/TLS**: All connections encrypted

### **Production Security**
- **HTTPS Only**: All traffic encrypted
- **Security Headers**: Comprehensive protection
- **Rate Limiting**: Multi-layer protection
- **Monitoring**: Real-time security monitoring

## 📚 **Related Documentation**

- **[Authentication System](./AUTHENTICATION_SYSTEM.md)** - Auth implementation details
- **[API Documentation](./API.md)** - API endpoints and security
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Security deployment instructions
- **[System Architecture](./SYSTEM_ARCHITECTURE_OVERVIEW.md)** - Overall system design

---

**This database security and schema documentation reflects the current secure, production-ready state of the Choices platform.**

# 🗄️ Database Schema

**Complete Database Documentation for Choices Platform**

---

## 🎯 **Overview**

This document provides comprehensive documentation for the Choices platform database schema, functions, and security policies.

**Last Updated**: October 27, 2025  
**Database**: Supabase PostgreSQL  
**Status**: Production Ready

---

## 🏗️ **Core Tables**

### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  trust_tier TEXT DEFAULT 'new' CHECK (trust_tier IN ('anonymous', 'new', 'established', 'verified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_trust_tier ON users(trust_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### **Polls Table**
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'unlisted')),
  poll_type TEXT DEFAULT 'single_choice' CHECK (poll_type IN ('single_choice', 'multiple_choice', 'ranked_choice')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_by UUID REFERENCES users(id),
  total_votes INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_polls_created_by ON polls(created_by);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_privacy_level ON polls(privacy_level);
CREATE INDEX idx_polls_created_at ON polls(created_at);
CREATE INDEX idx_polls_expires_at ON polls(expires_at);
```

### **Votes Table**
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);
CREATE INDEX idx_votes_anonymous ON votes(anonymous);
```

### **Representatives Table**
```sql
CREATE TABLE representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  district TEXT,
  state TEXT,
  party TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  voting_records JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_source TEXT DEFAULT 'openstates'
);

-- Indexes
CREATE INDEX idx_representatives_state ON representatives(state);
CREATE INDEX idx_representatives_district ON representatives(district);
CREATE INDEX idx_representatives_party ON representatives(party);
CREATE INDEX idx_representatives_name ON representatives(name);
```

### **Analytics Events Table**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  poll_id UUID REFERENCES polls(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_poll_id ON analytics_events(poll_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

---

## 🛡️ **Trust Tier System**

### **Trust Tiers Table**
```sql
CREATE TABLE trust_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  level INTEGER UNIQUE NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default trust tiers
INSERT INTO trust_tiers (name, level, permissions, description) VALUES
('anonymous', 0, '{"can_vote": true, "can_view_public": true, "rate_limit": 100}', 'Anonymous users with limited access'),
('new', 1, '{"can_vote": true, "can_create_polls": true, "can_view_public": true, "rate_limit": 500}', 'New users with basic access'),
('established', 2, '{"can_vote": true, "can_create_polls": true, "can_view_public": true, "can_view_analytics": true, "rate_limit": 1000}', 'Established users with enhanced access'),
('verified', 3, '{"can_vote": true, "can_create_polls": true, "can_view_public": true, "can_view_analytics": true, "can_admin": true, "rate_limit": 5000}', 'Verified users with full access');
```

### **User Trust History Table**
```sql
CREATE TABLE user_trust_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_tier TEXT,
  new_tier TEXT NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_trust_history_user_id ON user_trust_history(user_id);
CREATE INDEX idx_user_trust_history_created_at ON user_trust_history(created_at);
```

---

## 🔐 **Row Level Security (RLS)**

### **Enable RLS on All Tables**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_history ENABLE ROW LEVEL SECURITY;
```

### **Users Table Policies**
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Public profiles are viewable by all
CREATE POLICY "Public profiles are viewable" ON users
  FOR SELECT USING (true);
```

### **Polls Table Policies**
```sql
-- Public polls are viewable by all
CREATE POLICY "Public polls are viewable" ON polls
  FOR SELECT USING (privacy_level = 'public' AND status = 'active');

-- Users can view their own polls
CREATE POLICY "Users can view own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create polls
CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own polls
CREATE POLICY "Users can update own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);
```

### **Votes Table Policies**
```sql
-- Users can view votes on public polls
CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.privacy_level = 'public'
    )
  );

-- Users can view their own votes
CREATE POLICY "Users can view own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create votes
CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🔧 **Database Functions**

### **Update Poll Vote Count**
```sql
CREATE OR REPLACE FUNCTION update_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE polls 
    SET total_votes = total_votes + 1 
    WHERE id = NEW.poll_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE polls 
    SET total_votes = total_votes - 1 
    WHERE id = OLD.poll_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_poll_vote_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();
```

### **Get Poll Results**
```sql
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE (
  option_id TEXT,
  option_text TEXT,
  vote_count BIGINT,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.option_id,
    (p.options->>v.option_id)::TEXT as option_text,
    COUNT(*) as vote_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
  FROM votes v
  JOIN polls p ON p.id = v.poll_id
  WHERE v.poll_id = poll_uuid
  GROUP BY v.option_id, p.options
  ORDER BY vote_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Get User Trust Tier**
```sql
CREATE OR REPLACE FUNCTION get_user_trust_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT trust_tier INTO tier
  FROM users
  WHERE id = user_uuid;
  
  RETURN COALESCE(tier, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Promote User Trust Tier**
```sql
CREATE OR REPLACE FUNCTION promote_user_trust_tier(
  user_uuid UUID,
  new_tier TEXT,
  reason TEXT DEFAULT NULL,
  promoted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  old_tier TEXT;
BEGIN
  -- Get current tier
  SELECT trust_tier INTO old_tier
  FROM users
  WHERE id = user_uuid;
  
  -- Update user tier
  UPDATE users
  SET trust_tier = new_tier, updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Log the change
  INSERT INTO user_trust_history (user_id, old_tier, new_tier, reason, changed_by)
  VALUES (user_uuid, old_tier, new_tier, reason, promoted_by);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 **Analytics Functions**

### **Get Poll Analytics**
```sql
CREATE OR REPLACE FUNCTION get_poll_analytics(poll_uuid UUID)
RETURNS TABLE (
  total_votes BIGINT,
  unique_voters BIGINT,
  anonymous_votes BIGINT,
  trust_tier_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_voters,
    COUNT(*) FILTER (WHERE anonymous = true) as anonymous_votes,
    jsonb_object_agg(
      COALESCE(u.trust_tier, 'anonymous'),
      tier_counts.count
    ) as trust_tier_breakdown
  FROM votes v
  LEFT JOIN users u ON u.id = v.user_id
  LEFT JOIN (
    SELECT 
      COALESCE(u2.trust_tier, 'anonymous') as tier,
      COUNT(*) as count
    FROM votes v2
    LEFT JOIN users u2 ON u2.id = v2.user_id
    WHERE v2.poll_id = poll_uuid
    GROUP BY COALESCE(u2.trust_tier, 'anonymous')
  ) tier_counts ON tier_counts.tier = COALESCE(u.trust_tier, 'anonymous')
  WHERE v.poll_id = poll_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Get User Analytics**
```sql
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID)
RETURNS TABLE (
  total_votes BIGINT,
  polls_created BIGINT,
  trust_tier TEXT,
  account_age_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(v.id) as total_votes,
    COUNT(p.id) as polls_created,
    u.trust_tier,
    EXTRACT(DAYS FROM NOW() - u.created_at)::INTEGER as account_age_days
  FROM users u
  LEFT JOIN votes v ON v.user_id = u.id
  LEFT JOIN polls p ON p.created_by = u.id
  WHERE u.id = user_uuid
  GROUP BY u.id, u.trust_tier, u.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔍 **Search Functions**

### **Search Polls**
```sql
CREATE OR REPLACE FUNCTION search_polls(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  total_votes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.total_votes,
    p.created_at,
    ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.description, '')),
      plainto_tsquery('english', search_query)
    ) as relevance_score
  FROM polls p
  WHERE 
    p.status = 'active' 
    AND p.privacy_level = 'public'
    AND (
      to_tsvector('english', p.title || ' ' || COALESCE(p.description, '')) 
      @@ plainto_tsquery('english', search_query)
    )
  ORDER BY relevance_score DESC, p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📈 **Performance Optimization**

### **Indexes for Performance**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_votes_poll_user ON votes(poll_id, user_id);
CREATE INDEX idx_polls_status_privacy ON polls(status, privacy_level);
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at);

-- Partial indexes for active data
CREATE INDEX idx_polls_active ON polls(created_at) WHERE status = 'active';
CREATE INDEX idx_votes_recent ON votes(created_at) WHERE created_at > NOW() - INTERVAL '30 days';
```

### **Query Optimization**
```sql
-- Optimized poll results query
CREATE OR REPLACE FUNCTION get_poll_results_optimized(poll_uuid UUID)
RETURNS TABLE (
  option_id TEXT,
  vote_count BIGINT,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT 
      option_id,
      COUNT(*) as vote_count
    FROM votes
    WHERE poll_id = poll_uuid
    GROUP BY option_id
  ),
  total_votes AS (
    SELECT SUM(vote_count) as total FROM vote_counts
  )
  SELECT 
    vc.option_id,
    vc.vote_count,
    ROUND(vc.vote_count * 100.0 / tv.total, 2) as percentage
  FROM vote_counts vc
  CROSS JOIN total_votes tv
  ORDER BY vc.vote_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔄 **Data Migration**

### **Migration Scripts**
```sql
-- Add new column to existing table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Update existing data
UPDATE users SET preferences = '{}'::jsonb WHERE preferences IS NULL;

-- Create new table with proper constraints
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

---

## 🎯 **Best Practices**

### **Database Design**
- **Normalization**: Proper table relationships
- **Indexing**: Strategic indexes for performance
- **Constraints**: Data integrity constraints
- **Security**: Row Level Security policies

### **Query Optimization**
- **Efficient Queries**: Use appropriate indexes
- **Batch Operations**: Minimize round trips
- **Caching**: Cache frequently accessed data
- **Monitoring**: Track query performance

### **Data Management**
- **Backups**: Regular database backups
- **Migrations**: Version-controlled schema changes
- **Monitoring**: Track database performance
- **Security**: Regular security audits

---

**Database Schema Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This database documentation provides complete coverage of the Choices platform database schema, functions, and security policies.*

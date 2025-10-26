# 🗄️ **DATABASE SCHEMA DOCUMENTATION**

*October 25, 2025 - Democratic Equalizer Platform*

**Repository:** [choices-project/choices](https://github.com/choices-project/choices)  
**Live Site:** [choices-platform.vercel.app](https://choices-platform.vercel.app)  
**License:** MIT

---

## 📋 **OVERVIEW**

This document provides comprehensive documentation for the database schema and functions implemented for the RLS (Row Level Security) and Trust Tier system. The system enables sophisticated analytics, bot detection, and trust-based filtering for the Democratic Equalizer platform.

---

## 🏗️ **CORE TABLES**

### **1. `vote_trust_tiers` Table**
**Purpose**: Tracks trust tier information for individual votes

```sql
CREATE TABLE vote_trust_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id UUID REFERENCES votes(id),
    trust_tier INTEGER NOT NULL,
    sentiment_score DECIMAL DEFAULT 0,
    confidence_score DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Primary key (UUID)
- `vote_id`: Foreign key to votes table
- `trust_tier`: Trust tier level (1-4)
- `sentiment_score`: Sentiment analysis score (-1 to 1)
- `confidence_score`: Confidence in analysis (0 to 1)
- `created_at`: Timestamp of creation

**Trust Tier Levels:**
- **Tier 1**: Anonymous users
- **Tier 2**: Basic verified users
- **Tier 3**: Biometric verified users (WebAuthn)
- **Tier 4**: Government verified users

### **2. `trust_tier_progression` Table**
**Purpose**: Tracks user trust tier progression over time

```sql
CREATE TABLE trust_tier_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    previous_tier INTEGER,
    new_tier INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Primary key (UUID)
- `user_id`: Foreign key to user_profiles table
- `previous_tier`: Previous trust tier level
- `new_tier`: New trust tier level
- `reason`: Reason for tier change
- `created_at`: Timestamp of progression

### **3. Enhanced `votes` Table**
**Purpose**: Extended votes table with trust tier and anonymous user support

```sql
-- Additional columns added to existing votes table
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_session VARCHAR(255);
ALTER TABLE votes ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS trust_tier INTEGER DEFAULT 1;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS ip_address INET;
```

**New Columns:**
- `voter_session`: Session ID for anonymous users
- `linked_at`: Timestamp when vote was linked to user account
- `trust_tier`: Trust tier at time of voting
- `ip_address`: IP address for bot detection

---

## 🔧 **DATABASE FUNCTIONS**

### **1. `analyze_poll_sentiment`**
**Purpose**: Analyzes sentiment across different trust tiers

```sql
CREATE OR REPLACE FUNCTION analyze_poll_sentiment(
    p_poll_id UUID,
    p_time_window INTERVAL DEFAULT '24 hours'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_poll_id`: UUID of the poll to analyze
- `p_time_window`: Time window for analysis (default: 24 hours)

**Returns:**
```json
{
  "overall_sentiment": 0.65,
  "tier_breakdown": {
    "tier_1": { "sentiment_score": 0.3, "key_themes": ["concern", "hope"] },
    "tier_2": { "sentiment_score": 0.7, "key_themes": ["optimism", "engagement"] },
    "tier_3": { "sentiment_score": 0.8, "key_themes": ["expertise", "confidence"] },
    "tier_4": { "sentiment_score": 0.9, "key_themes": ["authority", "trust"] }
  },
  "narrative_divergence": {
    "score": 0.3,
    "explanation": "Moderate sentiment divergence detected between trust tiers",
    "manipulation_indicators": ["coordinated_behavior"]
  }
}
```

### **2. `detect_bot_behavior`**
**Purpose**: Detects bot activity and manipulation patterns

```sql
CREATE OR REPLACE FUNCTION detect_bot_behavior(
    p_poll_id UUID,
    p_time_window INTERVAL DEFAULT '24 hours'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_poll_id`: UUID of the poll to analyze
- `p_time_window`: Time window for analysis (default: 24 hours)

**Returns:**
```json
{
  "suspicious_activity": 0.2,
  "coordinated_behavior": false,
  "rapid_voting_patterns": false,
  "ip_clustering": false,
  "overall_bot_probability": 0.2
}
```

### **3. `get_real_time_analytics`**
**Purpose**: Provides real-time analytics for polls

```sql
CREATE OR REPLACE FUNCTION get_real_time_analytics(
    p_poll_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_poll_id`: UUID of the poll to analyze

**Returns:**
```json
{
  "total_votes": 42,
  "trust_tier_breakdown": {
    "verified": 8,
    "established": 12,
    "new_users": 15,
    "anonymous": 7
  },
  "temporal_analysis": {
    "voting_patterns": {
      "peak_hours": [9, 12, 18, 21],
      "day_of_week_distribution": [0.1, 0.15, 0.2, 0.2, 0.2, 0.1, 0.05],
      "time_series_data": [...]
    },
    "viral_coefficient": 1.5,
    "engagement_velocity": 2.3
  }
}
```

### **4. `link_anonymous_votes_to_user`**
**Purpose**: Links anonymous votes to user accounts upon signup

```sql
CREATE OR REPLACE FUNCTION link_anonymous_votes_to_user(
    p_user_id UUID,
    p_voter_session VARCHAR(255)
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_user_id`: UUID of the user account
- `p_voter_session`: Session ID of anonymous votes to link

**Returns:**
- `INTEGER`: Number of votes successfully linked

**Functionality:**
1. Updates votes with `user_id` and `linked_at` timestamp
2. Creates trust tier progression record
3. Returns count of linked votes

### **5. `get_poll_results_by_trust_tier`**
**Purpose**: Filters poll results by trust tier

```sql
CREATE OR REPLACE FUNCTION get_poll_results_by_trust_tier(
    p_poll_id UUID,
    p_trust_tiers INTEGER[] DEFAULT ARRAY[1,2,3,4]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_poll_id`: UUID of the poll
- `p_trust_tiers`: Array of trust tiers to include (default: all tiers)

**Returns:**
```json
{
  "tier_1": {
    "tier": 1,
    "total_votes": 15,
    "option_results": [
      {
        "option_id": "uuid",
        "option_text": "Option A",
        "vote_count": 8,
        "percentage": 53.33
      }
    ]
  },
  "tier_2": { ... },
  "tier_3": { ... },
  "tier_4": { ... }
}
```

### **6. `get_user_voting_history`**
**Purpose**: Provides comprehensive user voting history

```sql
CREATE OR REPLACE FUNCTION get_user_voting_history(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:**
```json
{
  "user_id": "uuid",
  "total_votes": 25,
  "polls_participated": 12,
  "trust_tier_progression": [
    {
      "previous_tier": 1,
      "new_tier": 2,
      "reason": "User signed up and linked anonymous votes",
      "created_at": "2025-10-25T10:30:00Z"
    }
  ],
  "recent_votes": [
    {
      "poll_id": "uuid",
      "option_id": "uuid",
      "created_at": "2025-10-25T10:30:00Z",
      "trust_tier": 2
    }
  ]
}
```

### **7. `get_trust_tier_progression`**
**Purpose**: Shows user trust tier progression and requirements

```sql
CREATE OR REPLACE FUNCTION get_trust_tier_progression(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parameters:**
- `p_user_id`: UUID of the user

**Returns:**
```json
{
  "user_id": "uuid",
  "current_tier": 2,
  "progression_history": [
    {
      "previous_tier": 1,
      "new_tier": 2,
      "reason": "User signed up and linked anonymous votes",
      "created_at": "2025-10-25T10:30:00Z"
    }
  ],
  "next_tier_requirements": {
    "tier_2": "Complete profile verification",
    "tier_3": "Participate in 10+ polls",
    "tier_4": "Community verification and engagement"
  }
}
```

---

## 🔒 **SECURITY FEATURES**

### **Row Level Security (RLS)**
All functions use `SECURITY DEFINER` to ensure proper access control:

```sql
-- Example RLS policy for vote_trust_tiers
CREATE POLICY "Users can view their own vote trust tiers" ON vote_trust_tiers
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM votes WHERE id = vote_id));
```

### **Trust Tier Access Control**
- **Tier 1 (Anonymous)**: Can view and vote on shared content only
- **Tier 2 (Basic)**: Can create polls and basic features
- **Tier 3 (Biometric)**: Advanced features with WebAuthn
- **Tier 4 (Government)**: Full platform access

---

## 📊 **ANALYTICS CAPABILITIES**

### **Sentiment Analysis**
- **Cross-tier sentiment comparison**
- **Narrative divergence detection**
- **Manipulation indicator identification**
- **Key theme extraction**

### **Bot Detection**
- **Suspicious activity scoring**
- **Coordinated behavior detection**
- **Rapid voting pattern analysis**
- **IP clustering identification**

### **Real-Time Analytics**
- **Live voting patterns**
- **Engagement velocity tracking**
- **Viral coefficient calculation**
- **Temporal analysis**

---

## 🚀 **USAGE EXAMPLES**

### **Basic Function Calls**
```sql
-- Analyze poll sentiment
SELECT analyze_poll_sentiment('poll-uuid-here', '24 hours');

-- Detect bot behavior
SELECT detect_bot_behavior('poll-uuid-here', '12 hours');

-- Get real-time analytics
SELECT get_real_time_analytics('poll-uuid-here');

-- Link anonymous votes
SELECT link_anonymous_votes_to_user('user-uuid-here', 'session-id-here');

-- Get trust tier results
SELECT get_poll_results_by_trust_tier('poll-uuid-here', ARRAY[2,3,4]);

-- Get user voting history
SELECT get_user_voting_history('user-uuid-here');

-- Get trust tier progression
SELECT get_trust_tier_progression('user-uuid-here');
```

### **API Integration**
```typescript
// Example API endpoint usage
const { data, error } = await supabase.rpc('analyze_poll_sentiment', {
  p_poll_id: pollId,
  p_time_window: '24 hours'
});
```

---

## 🔧 **MAINTENANCE**

### **Function Updates**
To update a function, use `CREATE OR REPLACE FUNCTION`:

```sql
CREATE OR REPLACE FUNCTION function_name(...)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Updated function body
$$;
```

### **Schema Migrations**
Use Supabase migrations for schema changes:

```bash
# Create new migration
supabase migration new add_trust_tier_columns

# Apply migrations
supabase db push
```

---

## 📈 **PERFORMANCE CONSIDERATIONS**

### **Indexing Recommendations**
```sql
-- Indexes for optimal performance
CREATE INDEX idx_vote_trust_tiers_vote_id ON vote_trust_tiers(vote_id);
CREATE INDEX idx_vote_trust_tiers_trust_tier ON vote_trust_tiers(trust_tier);
CREATE INDEX idx_trust_tier_progression_user_id ON trust_tier_progression(user_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at);
```

### **Query Optimization**
- Functions use efficient CTEs (Common Table Expressions)
- Proper indexing on foreign keys and frequently queried columns
- Time-based filtering for analytics functions
- Batch processing for large datasets

---

## 🎯 **CONCLUSION**

This database schema and function system provides:

1. **Sophisticated Analytics**: Sentiment analysis, bot detection, real-time insights
2. **Trust-Based Filtering**: Results filtered by trust tier for accuracy
3. **Anonymous User Support**: Seamless progression from anonymous to authenticated
4. **Security**: Row-level security and trust tier access control
5. **Scalability**: Optimized for high-volume civic engagement

**The system is production-ready and provides the foundation for advanced democratic engagement tools.**

---

*Documentation created: October 25, 2025*  
*Status: ✅ **COMPLETE AND PRODUCTION-READY***

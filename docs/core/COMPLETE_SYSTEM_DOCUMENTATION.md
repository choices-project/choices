# 📚 Complete System Documentation: RLS & Trust Tier System

**Date**: January 27, 2025  
**Status**: ✅ **COMPREHENSIVE DOCUMENTATION**  
**Purpose**: Complete documentation of all database functions, API endpoints, and system components

---

## 🗄️ **DATABASE SCHEMA DOCUMENTATION**

### **Core Tables:**

#### **representatives_core**
```sql
CREATE TABLE representatives_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  office VARCHAR(100),
  level VARCHAR(50), -- 'federal', 'state', 'local'
  state VARCHAR(2),
  party VARCHAR(100),
  district VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **polls**
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  is_public BOOLEAN DEFAULT true,
  is_shareable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **poll_options**
```sql
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id),
  text VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **votes**
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id),
  option_id UUID REFERENCES poll_options(id),
  user_id UUID REFERENCES user_profiles(id),
  voter_session VARCHAR(100), -- For anonymous voting
  trust_tier INTEGER DEFAULT 0, -- 0=anonymous, 1=verified, 2=established, 3=new
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Trust Tier Analysis Tables:**

#### **trust_tier_analytics**
```sql
CREATE TABLE trust_tier_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  trust_tier INTEGER NOT NULL,
  analysis_type VARCHAR(50) NOT NULL, -- 'bot_detection', 'narrative_analysis', 'sentiment_analysis'
  content_id UUID, -- poll_id, representative_id, etc.
  content_type VARCHAR(50), -- 'poll', 'representative', 'hashtag'
  analysis_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **narrative_analysis_results**
```sql
CREATE TABLE narrative_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  analysis_period VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly'
  tier_1_sentiment DECIMAL(3,2), -- Verified users sentiment
  tier_2_sentiment DECIMAL(3,2), -- Established users sentiment
  tier_3_sentiment DECIMAL(3,2), -- New users sentiment
  anonymous_sentiment DECIMAL(3,2), -- Anonymous users sentiment
  bot_detection_score DECIMAL(3,2), -- 0.00 to 1.00
  narrative_divergence DECIMAL(3,2), -- How much tiers differ
  propaganda_indicators JSONB, -- Flags for potential propaganda
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **bot_detection_logs**
```sql
CREATE TABLE bot_detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  detection_type VARCHAR(50) NOT NULL, -- 'behavioral', 'temporal', 'network'
  detection_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  detection_reasons JSONB NOT NULL, -- Array of reasons
  is_confirmed_bot BOOLEAN DEFAULT FALSE,
  human_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔧 **DATABASE FUNCTIONS DOCUMENTATION**

### **Trust Tier Functions:**

#### **calculate_user_trust_tier(p_user_id UUID)**
```sql
CREATE OR REPLACE FUNCTION calculate_user_trust_tier(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  tier INTEGER;
BEGIN
  -- Calculate based on user activity, verification, etc.
  SELECT CASE
    WHEN is_verified = true THEN 1
    WHEN months_active >= 6 THEN 2
    WHEN months_active >= 1 THEN 3
    ELSE 0
  END INTO tier
  FROM user_profiles
  WHERE id = p_user_id;
  
  RETURN tier;
END;
$$ LANGUAGE plpgsql;
```
**Purpose**: Calculate user's trust tier based on verification and activity  
**Returns**: Integer (0=anonymous, 1=verified, 2=established, 3=new)  
**Usage**: `SELECT calculate_user_trust_tier('user-uuid');`

#### **get_poll_results_by_trust_tier(p_poll_id UUID, p_trust_tier INTEGER DEFAULT NULL)**
```sql
CREATE OR REPLACE FUNCTION get_poll_results_by_trust_tier(
  p_poll_id UUID,
  p_trust_tier INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Get results filtered by trust tier (equal weight)
  WITH filtered_results AS (
    SELECT 
      po.id as option_id,
      po.text as option_text,
      COUNT(v.id) as vote_count,
      AVG(v.trust_tier) as avg_trust_tier,
      COUNT(CASE WHEN v.trust_tier = 1 THEN 1 END) as verified_votes,
      COUNT(CASE WHEN v.trust_tier = 2 THEN 1 END) as established_votes,
      COUNT(CASE WHEN v.trust_tier = 3 THEN 1 END) as new_user_votes,
      COUNT(CASE WHEN v.trust_tier = 0 THEN 1 END) as anonymous_votes
    FROM poll_options po
    LEFT JOIN votes v ON po.id = v.option_id 
      AND (p_trust_tier IS NULL OR v.trust_tier = p_trust_tier)
    WHERE po.poll_id = p_poll_id
    GROUP BY po.id, po.text
    ORDER BY vote_count DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'option_id', option_id,
      'option_text', option_text,
      'vote_count', vote_count,
      'avg_trust_tier', avg_trust_tier,
      'trust_distribution', jsonb_build_object(
        'verified_votes', verified_votes,
        'established_votes', established_votes,
        'new_user_votes', new_user_votes,
        'anonymous_votes', anonymous_votes
      )
    )
  ) INTO result
  FROM filtered_results;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```
**Purpose**: Get poll results filtered by trust tier (equal weight)  
**Parameters**: 
- `p_poll_id`: UUID of the poll
- `p_trust_tier`: Optional trust tier filter (NULL for all tiers)  
**Returns**: JSONB array of results with trust distribution  
**Usage**: `SELECT get_poll_results_by_trust_tier('poll-uuid', 1);`

### **Analysis Functions:**

#### **analyze_narrative_divergence(p_content_id UUID, p_content_type VARCHAR(50), p_analysis_period VARCHAR(20))**
```sql
CREATE OR REPLACE FUNCTION analyze_narrative_divergence(
  p_content_id UUID,
  p_content_type VARCHAR(50),
  p_analysis_period VARCHAR(20) DEFAULT 'daily'
)
RETURNS JSONB AS $$
DECLARE
  tier_1_sentiment DECIMAL(3,2);
  tier_2_sentiment DECIMAL(3,2);
  tier_3_sentiment DECIMAL(3,2);
  anonymous_sentiment DECIMAL(3,2);
  narrative_divergence DECIMAL(3,2);
  bot_detection_score DECIMAL(3,2);
  propaganda_indicators JSONB;
BEGIN
  -- Calculate sentiment for each tier (equal weight)
  SELECT AVG(sentiment_score) INTO tier_1_sentiment
  FROM trust_tier_analytics
  WHERE content_id = p_content_id
    AND content_type = p_content_type
    AND trust_tier = 1
    AND analysis_type = 'sentiment_analysis'
    AND created_at >= NOW() - INTERVAL '1 ' || p_analysis_period;
  
  -- ... (similar for other tiers)
  
  -- Calculate narrative divergence (equal weight analysis)
  narrative_divergence := GREATEST(
    ABS(tier_1_sentiment - tier_2_sentiment),
    ABS(tier_1_sentiment - tier_3_sentiment),
    ABS(tier_1_sentiment - anonymous_sentiment),
    ABS(tier_2_sentiment - tier_3_sentiment),
    ABS(tier_2_sentiment - anonymous_sentiment),
    ABS(tier_3_sentiment - anonymous_sentiment)
  );
  
  -- Calculate bot detection score
  bot_detection_score := CASE
    WHEN narrative_divergence > 0.7 THEN 0.9
    WHEN narrative_divergence > 0.5 THEN 0.7
    WHEN narrative_divergence > 0.3 THEN 0.5
    ELSE 0.2
  END;
  
  RETURN jsonb_build_object(
    'tier_1_sentiment', tier_1_sentiment,
    'tier_2_sentiment', tier_2_sentiment,
    'tier_3_sentiment', tier_3_sentiment,
    'anonymous_sentiment', anonymous_sentiment,
    'narrative_divergence', narrative_divergence,
    'bot_detection_score', bot_detection_score,
    'propaganda_indicators', propaganda_indicators,
    'analysis_approach', 'equal_weight_filtering'
  );
END;
$$ LANGUAGE plpgsql;
```
**Purpose**: Analyze narrative divergence across trust tiers  
**Parameters**:
- `p_content_id`: UUID of content to analyze
- `p_content_type`: Type of content ('poll', 'representative', etc.)
- `p_analysis_period`: Time period for analysis ('hourly', 'daily', 'weekly')  
**Returns**: JSONB with sentiment analysis and bot detection scores  
**Usage**: `SELECT analyze_narrative_divergence('poll-uuid', 'poll', 'daily');`

#### **detect_bot_behavior(p_user_id UUID)**
```sql
CREATE OR REPLACE FUNCTION detect_bot_behavior(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  behavioral_score DECIMAL(3,2);
  temporal_score DECIMAL(3,2);
  network_score DECIMAL(3,2);
  overall_score DECIMAL(3,2);
  detection_reasons JSONB;
BEGIN
  -- Behavioral analysis
  SELECT 
    CASE 
      WHEN COUNT(*) > 100 THEN 0.8
      WHEN COUNT(*) > 50 THEN 0.6
      WHEN COUNT(*) > 20 THEN 0.4
      ELSE 0.2
    END INTO behavioral_score
  FROM votes
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  -- Temporal analysis (voting patterns)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 AND AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) < 5 THEN 0.9
      WHEN COUNT(*) > 0 AND AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) < 30 THEN 0.7
      ELSE 0.3
    END INTO temporal_score
  FROM votes
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  -- Calculate overall score
  overall_score := (behavioral_score + temporal_score + network_score) / 3;
  
  RETURN jsonb_build_object(
    'behavioral_score', behavioral_score,
    'temporal_score', temporal_score,
    'network_score', network_score,
    'overall_score', overall_score,
    'detection_reasons', detection_reasons
  );
END;
$$ LANGUAGE plpgsql;
```
**Purpose**: Detect potential bot behavior for a user  
**Parameters**: `p_user_id`: UUID of user to analyze  
**Returns**: JSONB with bot detection scores and reasons  
**Usage**: `SELECT detect_bot_behavior('user-uuid');`

---

## 🌐 **API ENDPOINTS DOCUMENTATION**

### **Shared Content APIs:**

#### **GET /api/shared/poll/[id]**
```typescript
// Get shared poll with options
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (*)
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}
```
**Purpose**: Get shared poll data for anonymous viewing  
**Authentication**: None required (public access)  
**Returns**: Poll data with options  
**Usage**: `GET /api/shared/poll/123e4567-e89b-12d3-a456-426614174000`

#### **POST /api/shared/vote**
```typescript
// Anonymous voting
export async function POST(request: NextRequest) {
  const { poll_id, option_id, voter_session } = await request.json();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('votes')
    .insert({
      poll_id,
      option_id,
      voter_session,
      trust_tier: 0, // Anonymous
      created_at: new Date().toISOString()
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```
**Purpose**: Allow anonymous users to vote on shared polls  
**Authentication**: None required (public access)  
**Body**: `{ poll_id: string, option_id: string, voter_session: string }`  
**Returns**: Vote confirmation data  
**Usage**: `POST /api/shared/vote`

### **Poll Results APIs:**

#### **GET /api/polls/[id]/results**
```typescript
// Get poll results (with optional trust tier filter)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const trustTier = searchParams.get('tier');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .rpc('get_poll_results_by_trust_tier', {
      p_poll_id: params.id,
      p_trust_tier: trustTier ? parseInt(trustTier) : null
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```
**Purpose**: Get poll results with optional trust tier filtering  
**Authentication**: None required (public access)  
**Query Parameters**: 
- `tier` (optional): Filter by trust tier (0=anonymous, 1=verified, 2=established, 3=new)  
**Returns**: Array of results with trust distribution  
**Usage**: 
- `GET /api/polls/123e4567-e89b-12d3-a456-426614174000/results` (all results)
- `GET /api/polls/123e4567-e89b-12d3-a456-426614174000/results?tier=1` (verified users only)

### **Analysis APIs:**

#### **GET /api/analysis/narrative/[content_id]**
```typescript
// Get narrative analysis for content
export async function GET(
  request: NextRequest,
  { params }: { params: { content_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .rpc('analyze_narrative_divergence', {
      p_content_id: params.content_id,
      p_content_type: 'poll',
      p_analysis_period: 'daily'
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```
**Purpose**: Get narrative analysis comparing sentiment across trust tiers  
**Authentication**: Service role required  
**Returns**: Narrative analysis with bot detection scores  
**Usage**: `GET /api/analysis/narrative/123e4567-e89b-12d3-a456-426614174000`

#### **GET /api/analysis/bot-detection/[user_id]**
```typescript
// Get bot detection analysis for user
export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .rpc('detect_bot_behavior', {
      p_user_id: params.user_id
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```
**Purpose**: Get bot detection analysis for a specific user  
**Authentication**: Service role required  
**Returns**: Bot detection scores and reasons  
**Usage**: `GET /api/analysis/bot-detection/123e4567-e89b-12d3-a456-426614174000`

---

## 🧩 **FRONTEND COMPONENTS DOCUMENTATION**

### **Shared Content Components:**

#### **SharedPollViewer**
```typescript
interface SharedPollViewerProps {
  pollId: string;
}

export function SharedPollViewer({ pollId }: SharedPollViewerProps) {
  // Component for anonymous poll viewing and voting
  // Features:
  // - Fetches poll data from API
  // - Displays poll question and options
  // - Handles anonymous voting
  // - Session tracking for duplicate vote prevention
}
```
**Purpose**: Allow anonymous users to view and vote on shared polls  
**Props**: `pollId: string`  
**Features**: 
- Anonymous poll viewing
- Anonymous voting
- Session tracking
- Error handling

#### **TrustTierFilter**
```typescript
interface TrustTierFilterProps {
  selectedTier: number | null;
  onTierChange: (tier: number | null) => void;
}

export function TrustTierFilter({ selectedTier, onTierChange }: TrustTierFilterProps) {
  // Component for filtering results by trust tier
  // Features:
  // - Filter buttons for each trust tier
  // - Visual indicators for selected tier
  // - Callback for tier changes
}
```
**Purpose**: Filter poll results by trust tier  
**Props**: 
- `selectedTier: number | null` - Currently selected tier
- `onTierChange: (tier: number | null) => void` - Callback for tier changes  
**Features**: 
- Visual tier selection
- Color-coded buttons
- Callback handling

### **Analytics Components:**

#### **NarrativeAnalysis**
```typescript
interface NarrativeAnalysisProps {
  contentId: string;
}

export function NarrativeAnalysis({ contentId }: NarrativeAnalysisProps) {
  // Component for displaying narrative analysis
  // Features:
  // - Fetches analysis data from API
  // - Displays sentiment by trust tier
  // - Shows bot detection scores
  // - Highlights propaganda indicators
}
```
**Purpose**: Display narrative analysis comparing sentiment across trust tiers  
**Props**: `contentId: string`  
**Features**: 
- Trust tier sentiment comparison
- Bot detection scores
- Propaganda indicators
- Real-time data fetching

#### **PollResults**
```typescript
interface PollResultsProps {
  pollId: string;
  trustTier?: number;
}

export function PollResults({ pollId, trustTier }: PollResultsProps) {
  // Component for displaying poll results
  // Features:
  // - Shows results for all tiers or filtered tier
  // - Displays trust distribution
  // - Equal weight voting (no hierarchy)
  // - Real-time updates
}
```
**Purpose**: Display poll results with trust tier filtering  
**Props**: 
- `pollId: string` - ID of the poll
- `trustTier?: number` - Optional trust tier filter  
**Features**: 
- Equal weight results
- Trust distribution display
- Optional tier filtering
- Real-time updates

---

## 🔒 **RLS POLICIES DOCUMENTATION**

### **Public Read Policies (Anonymous Access):**
```sql
-- Representatives (when shared)
CREATE POLICY "Anonymous can read specific representatives" ON representatives_core FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read representative contacts for specific reps" ON representative_contacts FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read representative photos for specific reps" ON representative_photos FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read representative activity for specific reps" ON representative_activity FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read representative social media for specific reps" ON representative_social_media FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read representative committees for specific reps" ON representative_committees FOR SELECT TO anon USING (true);

-- Polls (when shared)
CREATE POLICY "Anonymous can read specific polls" ON polls FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read poll options for specific polls" ON poll_options FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can vote on shared polls" ON votes FOR INSERT TO anon WITH CHECK (true);

-- Hashtags (for shared content)
CREATE POLICY "Anonymous can read hashtags" ON hashtags FOR SELECT TO anon USING (true);
CREATE POLICY "Anonymous can read hashtag usage" ON hashtag_usage FOR SELECT TO anon USING (true);
```

### **Service Role Policies:**
```sql
-- OpenStates Data
CREATE POLICY "Service role full access OpenStates people data" ON openstates_people_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ID crosswalk" ON id_crosswalk FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Analytics
CREATE POLICY "Service role full access analytics events" ON analytics_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access analytics event data" ON analytics_event_data FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 🚀 **IMPLEMENTATION SCRIPTS DOCUMENTATION**

### **Database Setup Scripts:**

#### **fix-rls-final.js**
```javascript
// Purpose: Create final RLS policies for all tables
// Features:
// - Drops existing policies
// - Creates new policies for each table type
// - Enables RLS on all tables
// - Creates service role and anonymous access policies
// Usage: node scripts/fix-rls-final.js
```

#### **trust-tier-analysis-system.js**
```javascript
// Purpose: Create trust tier analysis tables and functions
// Features:
// - Creates trust_tier_analytics table
// - Creates narrative_analysis_results table
// - Creates bot_detection_logs table
// - Creates analysis functions
// Usage: node scripts/trust-tier-analysis-system.js
```

#### **fix-trust-tier-approach.js**
```javascript
// Purpose: Update trust tier system to use filtering instead of weighting
// Features:
// - Updates functions to use equal weight
// - Creates filtering functions
// - Removes weighted voting logic
// Usage: node scripts/fix-trust-tier-approach.js
```

### **Quick Start Script:**

#### **start-implementation.sh**
```bash
#!/bin/bash
# Purpose: Quick start implementation of the RLS & Trust Tier System
# Features:
# - Verifies environment variables
# - Runs database setup scripts
# - Creates API route structure
# - Generates initial implementation files
# Usage: ./scripts/start-implementation.sh
```

---

## 📊 **SYSTEM ARCHITECTURE DOCUMENTATION**

### **Data Flow:**
1. **Service Role**: Populates database with representative data
2. **Authenticated Users**: Create polls, vote, engage with content
3. **Anonymous Users**: View and vote on shared content only
4. **Trust Tier Analysis**: Filters and analyzes data by trust level
5. **Bot Detection**: Identifies suspicious patterns across tiers

### **Security Model:**
- **RLS Enabled**: All tables have Row Level Security
- **Service Role Access**: Full access for data population
- **Authenticated Access**: Users can manage their own data
- **Anonymous Access**: Limited to shared content only
- **Trust Tier Filtering**: Equal weight analysis and filtering

### **API Architecture:**
- **Shared Content APIs**: Public access for viral sharing
- **Analysis APIs**: Service role access for bot detection
- **Poll Results APIs**: Public access with optional filtering
- **Trust Tier APIs**: Service role access for analysis

---

## 🎯 **USAGE EXAMPLES**

### **Creating a Shared Poll:**
```typescript
// 1. Create poll (authenticated user)
const poll = await supabase
  .from('polls')
  .insert({
    question: 'Hey gang what kind of food do we want?',
    created_by: userId,
    is_public: true,
    is_shareable: true
  });

// 2. Add poll options
const options = await supabase
  .from('poll_options')
  .insert([
    { poll_id: poll.id, text: 'Pizza' },
    { poll_id: poll.id, text: 'Chinese' },
    { poll_id: poll.id, text: 'Mexican' },
    { poll_id: poll.id, text: 'Italian' }
  ]);

// 3. Generate shareable URL
const shareUrl = `${window.location.origin}/shared/poll/${poll.id}`;
```

### **Anonymous Voting:**
```typescript
// Anonymous user votes on shared poll
const vote = await fetch('/api/shared/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    poll_id: 'poll-uuid',
    option_id: 'option-uuid',
    voter_session: generateSessionId()
  })
});
```

### **Getting Filtered Results:**
```typescript
// Get all results
const allResults = await fetch('/api/polls/poll-uuid/results');

// Get verified users only
const verifiedResults = await fetch('/api/polls/poll-uuid/results?tier=1');

// Get anonymous users only
const anonymousResults = await fetch('/api/polls/poll-uuid/results?tier=0');
```

### **Narrative Analysis:**
```typescript
// Analyze narrative divergence
const analysis = await fetch('/api/analysis/narrative/poll-uuid');
const data = await analysis.json();

// Check for propaganda indicators
if (data.propaganda_indicators.high_divergence) {
  console.log('High divergence detected - potential manipulation');
}
```

---

*This complete system documentation was generated on ${new Date().toISOString()}.*

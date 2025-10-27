# 🗳️ Polls System

**Complete Polls Documentation for Choices Platform**

---

## 🎯 **Overview**

The Choices platform features a comprehensive polling system that enables users to create, participate in, and analyze polls with advanced features including privacy protection, hashtag integration, and sophisticated analytics.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Features**: Advanced Polling with AI Analytics

---

## 🏗️ **Core Features**

### **Poll Creation**
- **Multi-Step Wizard**: Guided poll creation process
- **Poll Types**: Single choice, multiple choice, ranked choice
- **Privacy Levels**: Public, private, unlisted polls
- **Expiration**: Optional poll expiration dates
- **Templates**: Pre-built poll templates for common topics

### **Voting System**
- **Secure Voting**: Anonymous and authenticated voting options
- **Vote Validation**: Prevents duplicate voting
- **Real-Time Updates**: Live vote count updates
- **Vote History**: User voting history tracking
- **Trust Tier Integration**: Voting permissions by trust tier

### **Results & Analytics**
- **Real-Time Results**: Live poll results display
- **Analytics Dashboard**: Comprehensive poll analytics
- **Demographic Breakdown**: Results by user demographics
- **Trust Tier Analysis**: Voting patterns by trust tier
- **AI Insights**: AI-powered poll analysis

### **Sharing & Discovery**
- **Social Sharing**: Share polls on social media
- **QR Codes**: Generate QR codes for easy sharing
- **Embeddable Widgets**: Embed polls in external sites
- **Hashtag System**: Categorize and discover polls
- **Trending Polls**: Popular and trending poll discovery

---

## 🔧 **Implementation Details**

### **Poll Data Structure**
```typescript
interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  privacy_level: 'public' | 'private' | 'unlisted';
  poll_type: 'single_choice' | 'multiple_choice' | 'ranked_choice';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'closed' | 'archived';
  created_by: string;
  total_votes: number;
  hashtags?: string[];
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}
```

### **Poll Creation Flow**
```typescript
// Poll Creation API
const createPoll = async (pollData: CreatePollData) => {
  // Validate input
  const validatedData = createPollSchema.parse(pollData);
  
  // Create poll
  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      title: validatedData.title,
      description: validatedData.description,
      options: validatedData.options,
      privacy_level: validatedData.privacy_level,
      poll_type: validatedData.poll_type,
      expires_at: validatedData.expires_at,
      created_by: validatedData.user_id
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Add hashtags if provided
  if (validatedData.hashtags?.length > 0) {
    await addPollHashtags(poll.id, validatedData.hashtags);
  }
  
  return poll;
};

// Poll Creation Schema
const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  options: z.array(z.object({
    text: z.string().min(1).max(100)
  })).min(2).max(10),
  privacy_level: z.enum(['public', 'private', 'unlisted']),
  poll_type: z.enum(['single_choice', 'multiple_choice', 'ranked_choice']),
  expires_at: z.string().datetime().optional(),
  hashtags: z.array(z.string()).optional()
});
```

### **Voting System**
```typescript
// Vote on Poll
const voteOnPoll = async (pollId: string, optionId: string, userId?: string) => {
  // Check if poll exists and is active
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .eq('status', 'active')
    .single();
    
  if (pollError || !poll) {
    throw new Error('Poll not found or inactive');
  }
  
  // Check if user already voted (if authenticated)
  if (userId) {
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();
      
    if (existingVote) {
      throw new Error('User already voted on this poll');
    }
  }
  
  // Create vote
  const { data: vote, error: voteError } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      user_id: userId,
      option_id: optionId,
      anonymous: !userId
    })
    .select()
    .single();
    
  if (voteError) {
    throw new Error(voteError.message);
  }
  
  // Update poll vote count (triggered by database trigger)
  await supabase
    .from('polls')
    .update({ total_votes: poll.total_votes + 1 })
    .eq('id', pollId);
    
  return vote;
};
```

### **Results & Analytics**
```typescript
// Get Poll Results
const getPollResults = async (pollId: string) => {
  // Get poll data
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();
    
  if (pollError || !poll) {
    throw new Error('Poll not found');
  }
  
  // Get vote breakdown
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('option_id, user_id, anonymous, created_at')
    .eq('poll_id', pollId);
    
  if (votesError) {
    throw new Error(votesError.message);
  }
  
  // Calculate results
  const results = calculatePollResults(poll.options, votes);
  
  return {
    poll,
    results,
    total_votes: votes.length,
    breakdown: {
      by_trust_tier: calculateTrustTierBreakdown(votes),
      by_demographics: calculateDemographicBreakdown(votes),
      by_time: calculateTimeBreakdown(votes)
    }
  };
};

// Calculate Poll Results
const calculatePollResults = (options: PollOption[], votes: Vote[]) => {
  const optionVotes = new Map<string, number>();
  
  votes.forEach(vote => {
    const current = optionVotes.get(vote.option_id) || 0;
    optionVotes.set(vote.option_id, current + 1);
  });
  
  const totalVotes = votes.length;
  
  return options.map(option => ({
    ...option,
    votes: optionVotes.get(option.id) || 0,
    percentage: totalVotes > 0 ? 
      Math.round((optionVotes.get(option.id) || 0) / totalVotes * 100 * 100) / 100 : 0
  }));
};
```

---

## 🏷️ **Hashtag System**

### **Hashtag Integration**
```typescript
// Add Hashtags to Poll
const addPollHashtags = async (pollId: string, hashtags: string[]) => {
  const hashtagData = hashtags.map(tag => ({
    poll_id: pollId,
    hashtag: tag.toLowerCase().replace('#', ''),
    created_at: new Date().toISOString()
  }));
  
  const { error } = await supabase
    .from('poll_hashtags')
    .insert(hashtagData);
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Update hashtag trending scores
  await updateHashtagTrendingScores(hashtags);
};

// Get Trending Hashtags
const getTrendingHashtags = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('hashtags')
    .select('hashtag, trend_score, poll_count, vote_count')
    .order('trend_score', { ascending: false })
    .limit(limit);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// Update Hashtag Trending Scores
const updateHashtagTrendingScores = async (hashtags: string[]) => {
  for (const hashtag of hashtags) {
    // Calculate trending score based on recent activity
    const { data: recentActivity } = await supabase
      .from('poll_hashtags')
      .select('created_at')
      .eq('hashtag', hashtag)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
    const trendScore = recentActivity?.length || 0;
    
    // Update hashtag record
    await supabase
      .from('hashtags')
      .upsert({
        hashtag,
        trend_score: trendScore,
        updated_at: new Date().toISOString()
      });
  }
};
```

### **Poll Discovery**
```typescript
// Search Polls by Hashtag
const searchPollsByHashtag = async (hashtag: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('poll_hashtags')
    .select(`
      poll_id,
      polls (
        id,
        title,
        description,
        total_votes,
        created_at,
        status
      )
    `)
    .eq('hashtag', hashtag.toLowerCase())
    .eq('polls.status', 'active')
    .order('polls.created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data.map(item => item.polls);
};

// Get Polls by Category
const getPollsByCategory = async (category: string) => {
  const categoryHashtags = {
    politics: ['politics', 'election', 'government', 'policy'],
    technology: ['tech', 'ai', 'software', 'innovation'],
    society: ['social', 'community', 'culture', 'lifestyle'],
    environment: ['climate', 'environment', 'sustainability', 'green']
  };
  
  const hashtags = categoryHashtags[category] || [];
  
  if (hashtags.length === 0) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('poll_hashtags')
    .select(`
      poll_id,
      polls (
        id,
        title,
        description,
        total_votes,
        created_at
      )
    `)
    .in('hashtag', hashtags)
    .eq('polls.status', 'active')
    .order('polls.total_votes', { ascending: false })
    .limit(20);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data.map(item => item.polls);
};
```

---

## 📊 **Analytics & Insights**

### **Poll Analytics**
```typescript
// Get Poll Analytics
const getPollAnalytics = async (pollId: string) => {
  const { data: poll } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();
    
  const { data: votes } = await supabase
    .from('votes')
    .select('*, users(trust_tier)')
    .eq('poll_id', pollId);
    
  const analytics = {
    total_votes: votes.length,
    unique_voters: new Set(votes.map(v => v.user_id)).size,
    anonymous_votes: votes.filter(v => v.anonymous).length,
    trust_tier_breakdown: calculateTrustTierBreakdown(votes),
    time_series: calculateTimeSeries(votes),
    demographic_breakdown: calculateDemographicBreakdown(votes),
    engagement_metrics: calculateEngagementMetrics(poll, votes)
  };
  
  return analytics;
};

// AI-Powered Insights
const getAIPollInsights = async (pollId: string) => {
  const analytics = await getPollAnalytics(pollId);
  
  // Send to AI service for analysis
  const insights = await fetch('/api/analytics/unified/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      poll_id: pollId,
      analytics,
      method: 'poll_insights'
    })
  });
  
  return insights.json();
};
```

### **Trending System**
```typescript
// Calculate Poll Trending Score
const calculatePollTrendingScore = async (pollId: string) => {
  const { data: poll } = await supabase
    .from('polls')
    .select('total_votes, created_at')
    .eq('id', pollId)
    .single();
    
  const { data: recentVotes } = await supabase
    .from('votes')
    .select('created_at')
    .eq('poll_id', pollId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
  // Calculate trending score based on recent activity
  const recentVoteCount = recentVotes.length;
  const timeDecay = Math.exp(-0.1 * (Date.now() - new Date(poll.created_at).getTime()) / (24 * 60 * 60 * 1000));
  const trendingScore = recentVoteCount * timeDecay;
  
  // Update poll trending score
  await supabase
    .from('polls')
    .update({ trending_score: trendingScore })
    .eq('id', pollId);
    
  return trendingScore;
};

// Get Trending Polls
const getTrendingPolls = async (limit: number = 20) => {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('status', 'active')
    .eq('privacy_level', 'public')
    .order('trending_score', { ascending: false })
    .limit(limit);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};
```

---

## 🔐 **Privacy & Security**

### **Privacy Protection**
```typescript
// Differential Privacy for Results
const applyDifferentialPrivacy = (results: PollResult[], epsilon: number = 1.0) => {
  return results.map(result => ({
    ...result,
    votes: result.votes + Math.round(laplaceNoise(epsilon)),
    percentage: Math.max(0, Math.min(100, 
      (result.votes + Math.round(laplaceNoise(epsilon))) / 
      results.reduce((sum, r) => sum + r.votes, 0) * 100
    ))
  }));
};

// K-Anonymity Check
const checkKAnonymity = (votes: Vote[], k: number = 5) => {
  const optionCounts = new Map<string, number>();
  
  votes.forEach(vote => {
    const current = optionCounts.get(vote.option_id) || 0;
    optionCounts.set(vote.option_id, current + 1);
  });
  
  return Array.from(optionCounts.values()).every(count => count >= k);
};
```

### **Access Control**
```typescript
// Poll Access Control
const checkPollAccess = async (pollId: string, userId?: string) => {
  const { data: poll } = await supabase
    .from('polls')
    .select('privacy_level, created_by, status')
    .eq('id', pollId)
    .single();
    
  if (!poll) {
    return { access: false, reason: 'Poll not found' };
  }
  
  if (poll.status !== 'active') {
    return { access: false, reason: 'Poll is not active' };
  }
  
  // Public polls are accessible to all
  if (poll.privacy_level === 'public') {
    return { access: true };
  }
  
  // Private polls require authentication
  if (!userId) {
    return { access: false, reason: 'Authentication required' };
  }
  
  // Private polls are only accessible to creator
  if (poll.privacy_level === 'private' && poll.created_by !== userId) {
    return { access: false, reason: 'Access denied' };
  }
  
  return { access: true };
};
```

---

## 🛠️ **API Endpoints**

### **Poll Management**
```typescript
// POST /api/polls
const createPollEndpoint = {
  method: 'POST',
  path: '/api/polls',
  body: {
    title: string,
    description?: string,
    options: Array<{ text: string }>,
    privacy_level: 'public' | 'private' | 'unlisted',
    poll_type: 'single_choice' | 'multiple_choice' | 'ranked_choice',
    expires_at?: string,
    hashtags?: string[]
  },
  response: {
    poll: Poll
  }
};

// GET /api/polls/{id}
const getPollEndpoint = {
  method: 'GET',
  path: '/api/polls/{id}',
  response: {
    poll: Poll,
    results?: PollResults
  }
};

// POST /api/polls/{id}/vote
const voteEndpoint = {
  method: 'POST',
  path: '/api/polls/{id}/vote',
  body: {
    option_id: string,
    anonymous?: boolean
  },
  response: {
    success: boolean,
    vote_id: string
  }
};
```

### **Analytics Endpoints**
```typescript
// GET /api/polls/{id}/results
const getResultsEndpoint = {
  method: 'GET',
  path: '/api/polls/{id}/results',
  response: {
    poll_id: string,
    total_votes: number,
    results: Array<{
      option_id: string,
      text: string,
      votes: number,
      percentage: number
    }>,
    breakdown: {
      by_trust_tier: Record<string, any>,
      by_demographics: Record<string, any>
    }
  }
};

// GET /api/polls/{id}/analytics
const getAnalyticsEndpoint = {
  method: 'GET',
  path: '/api/polls/{id}/analytics',
  response: {
    analytics: PollAnalytics,
    insights?: AIInsights
  }
};
```

---

## 🔍 **Testing**

### **Poll Creation Tests**
```typescript
describe('Poll Creation', () => {
  it('should create a public poll', async () => {
    const pollData = {
      title: 'Test Poll',
      description: 'A test poll',
      options: [
        { text: 'Option A' },
        { text: 'Option B' }
      ],
      privacy_level: 'public',
      poll_type: 'single_choice'
    };
    
    const response = await request(app)
      .post('/api/polls')
      .send(pollData)
      .expect(201);
      
    expect(response.body.poll.title).toBe('Test Poll');
    expect(response.body.poll.options).toHaveLength(2);
  });
});
```

### **Voting Tests**
```typescript
describe('Voting System', () => {
  it('should allow anonymous voting', async () => {
    const poll = await createTestPoll();
    
    const response = await request(app)
      .post(`/api/polls/${poll.id}/vote`)
      .send({
        option_id: poll.options[0].id,
        anonymous: true
      })
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🎯 **Best Practices**

### **Poll Design**
- **Clear Questions**: Use clear, unambiguous questions
- **Balanced Options**: Provide balanced answer options
- **Appropriate Privacy**: Choose appropriate privacy levels
- **Relevant Hashtags**: Use relevant hashtags for discovery

### **Voting Experience**
- **Fast Loading**: Optimize poll loading performance
- **Clear Results**: Display results clearly and accurately
- **Privacy Respect**: Respect user privacy preferences
- **Mobile Friendly**: Ensure mobile-friendly voting experience

### **Analytics Usage**
- **Privacy First**: Protect user privacy in analytics
- **Actionable Insights**: Provide actionable insights
- **Transparent Methods**: Be transparent about analysis methods
- **User Control**: Give users control over their data

---

**Polls Documentation Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This polls documentation provides complete coverage of the Choices platform polling system.*
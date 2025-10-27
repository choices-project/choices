# 📊 Analytics System

**Complete Analytics Documentation for Choices Platform**

---

## 🎯 **Overview**

The Choices platform features a comprehensive analytics system powered by AI that provides insights into user behavior, poll performance, and platform trends. The system includes real-time analytics, AI-powered insights, and sophisticated data visualization.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**AI Integration**: Ollama + Hugging Face

---

## 🤖 **AI-Powered Analytics**

### **AI Providers**
- **Ollama (Local)**: Local AI for development and privacy-sensitive analysis
- **Hugging Face (Cloud)**: Cloud AI for advanced analytics and insights
- **Unified API**: Single endpoint supporting multiple AI providers

### **Analytics Methods**
- **Trend Analysis**: Identify patterns and trends in data
- **Demographic Analysis**: User behavior by demographics
- **Sentiment Analysis**: Analyze user sentiment and opinions
- **Predictive Analytics**: Forecast future trends and behaviors
- **Anomaly Detection**: Identify unusual patterns or behaviors

### **AI Integration Architecture**
```typescript
// Unified Analytics API
const unifiedAnalyticsAPI = {
  endpoint: '/api/analytics/unified/[id]',
  methods: ['trends', 'demographics', 'sentiment', 'predictions'],
  providers: ['ollama', 'huggingface'],
  features: ['real-time', 'batch', 'scheduled']
};

// AI Provider Configuration
const aiProviders = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    models: ['llama2', 'codellama', 'mistral'],
    capabilities: ['text-analysis', 'sentiment', 'trends']
  },
  huggingface: {
    baseUrl: 'https://api-inference.huggingface.co',
    models: ['distilbert', 'roberta', 'gpt2'],
    capabilities: ['advanced-nlp', 'sentiment', 'classification']
  }
};
```

---

## 📈 **Analytics Features**

### **Real-Time Analytics**
- **Live Data Processing**: Real-time data collection and processing
- **Live Dashboards**: Real-time analytics dashboards
- **Event Tracking**: Comprehensive event tracking system
- **Performance Monitoring**: System performance analytics

### **Poll Analytics**
- **Vote Patterns**: Analysis of voting patterns and trends
- **Demographic Breakdown**: Results by user demographics
- **Trust Tier Analysis**: Voting patterns by trust tier
- **Engagement Metrics**: Poll engagement and interaction metrics

### **User Analytics**
- **Behavior Tracking**: User behavior and interaction patterns
- **Journey Analysis**: User journey and conversion analysis
- **Retention Metrics**: User retention and engagement metrics
- **Trust Progression**: Trust tier progression analytics

### **Platform Analytics**
- **Usage Statistics**: Platform usage and adoption metrics
- **Performance Metrics**: System performance and reliability
- **Security Analytics**: Security events and threat analysis
- **Growth Metrics**: Platform growth and user acquisition

---

## 🔧 **Implementation Details**

### **Analytics Data Collection**
```typescript
// Analytics Event Tracking
interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id?: string;
  poll_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Event Tracking Service
class AnalyticsService {
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>) {
    const analyticsEvent: AnalyticsEvent = {
      id: generateId(),
      ...event,
      created_at: new Date().toISOString()
    };
    
    // Store in database
    await supabase
      .from('analytics_events')
      .insert(analyticsEvent);
    
    // Send to real-time analytics
    await this.sendToRealTimeAnalytics(analyticsEvent);
  }
  
  async sendToRealTimeAnalytics(event: AnalyticsEvent) {
    // Send to WebSocket for real-time updates
    this.websocket.send(JSON.stringify({
      type: 'analytics_event',
      data: event
    }));
  }
}

// Usage Examples
const analytics = new AnalyticsService();

// Track poll view
await analytics.trackEvent({
  event_type: 'poll_view',
  poll_id: 'poll_123',
  user_id: 'user_456',
  metadata: {
    source: 'dashboard',
    device: 'mobile'
  }
});

// Track vote
await analytics.trackEvent({
  event_type: 'vote',
  poll_id: 'poll_123',
  user_id: 'user_456',
  metadata: {
    option_id: 'opt_1',
    anonymous: false
  }
});
```

### **AI Analytics Processing**
```typescript
// AI Analytics Service
class AIAnalyticsService {
  async analyzePollTrends(pollId: string) {
    // Get poll data
    const pollData = await this.getPollData(pollId);
    
    // Analyze with AI
    const analysis = await this.callAIProvider('ollama', {
      method: 'trends',
      data: pollData,
      prompt: 'Analyze voting trends and patterns in this poll data'
    });
    
    return analysis;
  }
  
  async analyzeUserSentiment(userId: string) {
    // Get user activity data
    const userData = await this.getUserActivityData(userId);
    
    // Analyze sentiment with AI
    const sentiment = await this.callAIProvider('huggingface', {
      method: 'sentiment',
      data: userData,
      model: 'distilbert-base-uncased-finetuned-sst-2-english'
    });
    
    return sentiment;
  }
  
  async callAIProvider(provider: 'ollama' | 'huggingface', request: AIRequest) {
    const config = aiProviders[provider];
    
    const response = await fetch(`${config.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider === 'huggingface' && {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`
        })
      },
      body: JSON.stringify(request)
    });
    
    return response.json();
  }
}
```

### **Unified Analytics API**
```typescript
// Unified Analytics Endpoint
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const method = url.searchParams.get('method') || 'trends';
  const provider = url.searchParams.get('provider') || 'ollama';
  const timeframe = url.searchParams.get('timeframe') || '7d';
  
  try {
    const analyticsService = new AIAnalyticsService();
    
    let results;
    switch (method) {
      case 'trends':
        results = await analyticsService.analyzeTrends(params.id, timeframe);
        break;
      case 'demographics':
        results = await analyticsService.analyzeDemographics(params.id, timeframe);
        break;
      case 'sentiment':
        results = await analyticsService.analyzeSentiment(params.id, timeframe);
        break;
      case 'predictions':
        results = await analyticsService.generatePredictions(params.id, timeframe);
        break;
      default:
        throw new Error('Invalid analytics method');
    }
    
    return Response.json({
      id: params.id,
      method,
      provider,
      timeframe,
      results,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📊 **Analytics Dashboards**

### **Real-Time Dashboard**
```typescript
// Real-Time Analytics Dashboard
const RealTimeDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3000/analytics');
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'analytics_update') {
        setAnalytics(data.analytics);
      }
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div className="analytics-dashboard">
      <div className="connection-status">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      
      {analytics && (
        <div className="analytics-grid">
          <MetricCard
            title="Active Users"
            value={analytics.activeUsers}
            trend={analytics.activeUsersTrend}
          />
          <MetricCard
            title="Total Votes"
            value={analytics.totalVotes}
            trend={analytics.totalVotesTrend}
          />
          <MetricCard
            title="Polls Created"
            value={analytics.pollsCreated}
            trend={analytics.pollsCreatedTrend}
          />
        </div>
      )}
    </div>
  );
};
```

### **AI Insights Dashboard**
```typescript
// AI Insights Dashboard
const AIInsightsDashboard = () => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/unified/insights?method=trends&provider=ollama');
      const data = await response.json();
      setInsights(data.results);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="ai-insights-dashboard">
      <h2>AI-Powered Insights</h2>
      
      {loading && <div className="loading">Loading insights...</div>}
      
      {insights && (
        <div className="insights-grid">
          <InsightCard
            title="Trending Topics"
            insights={insights.trendingTopics}
            type="trends"
          />
          <InsightCard
            title="User Sentiment"
            insights={insights.userSentiment}
            type="sentiment"
          />
          <InsightCard
            title="Predictions"
            insights={insights.predictions}
            type="predictions"
          />
        </div>
      )}
    </div>
  );
};
```

---

## 🔍 **Analytics Types**

### **Poll Analytics**
```typescript
interface PollAnalytics {
  poll_id: string;
  total_votes: number;
  unique_voters: number;
  anonymous_votes: number;
  trust_tier_breakdown: Record<string, number>;
  time_series: Array<{
    timestamp: string;
    votes: number;
  }>;
  demographic_breakdown: {
    age_groups: Record<string, number>;
    geographic: Record<string, number>;
    device_types: Record<string, number>;
  };
  engagement_metrics: {
    view_count: number;
    share_count: number;
    comment_count: number;
    completion_rate: number;
  };
}
```

### **User Analytics**
```typescript
interface UserAnalytics {
  user_id: string;
  total_votes: number;
  polls_created: number;
  trust_tier: string;
  account_age_days: number;
  activity_score: number;
  engagement_metrics: {
    daily_active_minutes: number;
    weekly_active_days: number;
    monthly_active_days: number;
  };
  behavior_patterns: {
    preferred_poll_types: string[];
    voting_patterns: Record<string, number>;
    time_of_day_activity: Record<string, number>;
  };
}
```

### **Platform Analytics**
```typescript
interface PlatformAnalytics {
  total_users: number;
  total_polls: number;
  total_votes: number;
  active_users_7d: number;
  active_users_30d: number;
  growth_metrics: {
    user_growth_rate: number;
    poll_creation_rate: number;
    vote_participation_rate: number;
  };
  performance_metrics: {
    average_response_time: number;
    error_rate: number;
    uptime_percentage: number;
  };
  security_metrics: {
    failed_login_attempts: number;
    suspicious_activities: number;
    blocked_requests: number;
  };
}
```

---

## 🛠️ **API Endpoints**

### **Analytics Endpoints**
```typescript
// GET /api/analytics/unified/{id}
const unifiedAnalyticsEndpoint = {
  method: 'GET',
  path: '/api/analytics/unified/{id}',
  queryParams: {
    method: 'trends' | 'demographics' | 'sentiment' | 'predictions',
    provider: 'ollama' | 'huggingface',
    timeframe: '7d' | '30d' | '90d' | '1y'
  },
  response: {
    id: string,
    method: string,
    provider: string,
    timeframe: string,
    results: any,
    generated_at: string
  }
};

// POST /api/analytics/unified/events
const trackEventEndpoint = {
  method: 'POST',
  path: '/api/analytics/unified/events',
  body: {
    event_type: string,
    user_id?: string,
    poll_id?: string,
    metadata: Record<string, any>
  },
  response: {
    success: boolean,
    event_id: string
  }
};

// GET /api/analytics/dashboard
const dashboardEndpoint = {
  method: 'GET',
  path: '/api/analytics/dashboard',
  response: {
    platform_metrics: PlatformAnalytics,
    recent_activity: Array<AnalyticsEvent>,
    ai_insights: AIInsights
  }
};
```

---

## 🔐 **Privacy & Security**

### **Privacy Protection**
```typescript
// Differential Privacy for Analytics
const applyDifferentialPrivacy = (data: any[], epsilon: number = 1.0) => {
  return data.map(item => ({
    ...item,
    count: item.count + Math.round(laplaceNoise(epsilon))
  }));
};

// Data Anonymization
const anonymizeUserData = (userData: UserAnalytics) => {
  return {
    ...userData,
    user_id: hashUserId(userData.user_id),
    // Remove or hash personally identifiable information
    email: null,
    name: null
  };
};
```

### **Access Control**
```typescript
// Analytics Access Control
const checkAnalyticsAccess = async (userId: string, analyticsType: string) => {
  const user = await getUser(userId);
  
  if (!user) {
    return { access: false, reason: 'User not found' };
  }
  
  // Check trust tier permissions
  const permissions = trustTierPermissions[user.trust_tier];
  
  if (analyticsType === 'detailed' && !permissions.analyticsAccess) {
    return { access: false, reason: 'Insufficient trust tier' };
  }
  
  return { access: true };
};
```

---

## 🔍 **Testing**

### **Analytics Tests**
```typescript
describe('Analytics System', () => {
  it('should track events correctly', async () => {
    const event = {
      event_type: 'poll_view',
      poll_id: 'poll_123',
      user_id: 'user_456',
      metadata: { source: 'dashboard' }
    };
    
    const response = await request(app)
      .post('/api/analytics/unified/events')
      .send(event)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.event_id).toBeDefined();
  });
  
  it('should generate AI insights', async () => {
    const response = await request(app)
      .get('/api/analytics/unified/poll_123?method=trends&provider=ollama')
      .expect(200);
      
    expect(response.body.results).toBeDefined();
    expect(response.body.provider).toBe('ollama');
  });
});
```

---

## 🎯 **Best Practices**

### **Data Collection**
- **Privacy First**: Collect only necessary data
- **Transparent Collection**: Be clear about what data is collected
- **User Control**: Give users control over their data
- **Data Minimization**: Collect minimal data for maximum insight

### **AI Analytics**
- **Transparent AI**: Be transparent about AI methods
- **Auditable Results**: Ensure AI results are auditable
- **Bias Detection**: Monitor for AI bias
- **Human Oversight**: Maintain human oversight of AI decisions

### **Performance**
- **Efficient Processing**: Optimize analytics processing
- **Caching**: Cache frequently accessed analytics
- **Real-Time**: Provide real-time analytics where needed
- **Scalability**: Design for analytics scalability

---

**Analytics Documentation Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This analytics documentation provides complete coverage of the Choices platform analytics system.*
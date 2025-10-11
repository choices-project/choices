# Share API Documentation

**Created:** October 10, 2025  
**Updated:** October 10, 2025  
**Status:** ✅ Production Ready  
**Feature Flag:** `SOCIAL_SHARING` (enabled)

## 🎯 Overview

The Share API provides comprehensive social sharing event tracking and analytics for the Choices platform. It enables tracking of social media shares across multiple platforms and provides detailed analytics for content performance.

## 🏗️ Architecture

### **Core Components**
- **Share Event Tracking**: POST endpoint for tracking share events
- **Share Analytics**: GET endpoint for retrieving share analytics
- **Database Integration**: Uses existing `analytics_events` table
- **Feature Flag Integration**: Controlled by `SOCIAL_SHARING` feature flag

### **Data Flow**
```
User Action → Share API → Supabase → Analytics Dashboard
     ↓
Event Tracking → Database Storage → Analytics Queries
```

## 🔌 API Endpoints

### **POST /api/share**
Track social sharing events for analytics and optimization.

#### **Request Body:**
```typescript
{
  platform: 'x' | 'facebook' | 'linkedin' | 'reddit' | 'whatsapp' | 'telegram' | 'email' | 'sms';
  poll_id: string;
  placement?: string;
  content_type?: 'poll' | 'representative' | 'feed';
}
```

#### **Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### **Example Request:**
```bash
curl -X POST /api/share \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "x",
    "poll_id": "poll-123",
    "placement": "poll_results",
    "content_type": "poll"
  }'
```

### **GET /api/share**
Retrieve share analytics data with filtering options.

#### **Query Parameters:**
- `poll_id` (optional): Filter by specific poll
- `platform` (optional): Filter by platform
- `days` (optional): Number of days to analyze (default: 7)

#### **Response:**
```typescript
{
  total_shares: number;
  platform_breakdown: Record<string, number>;
  top_polls: Array<{
    poll_id: string;
    shares: number;
    title: string;
  }>;
  conversion_rate: number;
  period_days: number;
  generated_at: string;
}
```

#### **Example Request:**
```bash
curl "/api/share?poll_id=poll-123&days=30"
```

## 📊 Analytics Features

### **Platform Breakdown**
- Track shares across all supported platforms
- Real-time platform performance metrics
- Platform-specific conversion rates

### **Content Performance**
- Top performing polls by share count
- Share-to-vote conversion tracking
- Content engagement analytics

### **Time-based Analysis**
- Configurable time periods (24h, 7d, 30d, 90d, 1y)
- Historical trend analysis
- Peak sharing time identification

## 🔒 Security & Privacy

### **Data Protection**
- **Privacy-Safe Tracking**: No personal data collection
- **IP Anonymization**: IP addresses are hashed
- **User Agent Sanitization**: Cleaned user agent strings
- **Minimal Data**: Only essential metrics collected

### **Rate Limiting**
- **API Rate Limits**: 60 requests per minute per IP
- **Feature Flag Protection**: Disabled when feature flag is off
- **Error Handling**: Graceful degradation on failures

## 🚀 Usage Examples

### **Tracking a Share Event**
```typescript
// Frontend implementation
const trackShare = async (platform: string, pollId: string) => {
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        poll_id: pollId,
        placement: 'poll_card',
        content_type: 'poll'
      })
    });
    
    if (response.ok) {
      console.log('Share tracked successfully');
    }
  } catch (error) {
    console.error('Failed to track share:', error);
  }
};
```

### **Retrieving Analytics**
```typescript
// Analytics dashboard implementation
const getShareAnalytics = async (pollId?: string, days: number = 7) => {
  const params = new URLSearchParams();
  if (pollId) params.append('poll_id', pollId);
  params.append('days', days.toString());
  
  const response = await fetch(`/api/share?${params}`);
  const analytics = await response.json();
  
  return analytics;
};
```

## 🧪 Testing

### **Unit Tests**
- Share event tracking validation
- Analytics query accuracy
- Error handling verification
- Feature flag integration

### **Integration Tests**
- Database integration testing
- Feature flag behavior
- Rate limiting verification
- Analytics accuracy

## 📈 Performance

### **Optimization Features**
- **Efficient Queries**: Optimized database queries
- **Caching**: Analytics result caching
- **Batch Processing**: Bulk event processing
- **Indexing**: Database indexes for fast queries

### **Monitoring**
- **Response Times**: < 200ms for tracking
- **Analytics Generation**: < 500ms for comprehensive analytics
- **Error Rates**: < 1% error rate target
- **Throughput**: 1000+ events per minute

## 🔧 Configuration

### **Environment Variables**
```bash
# Required for Supabase integration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SECRET_KEY=your-service-role-key

# Feature flag (set in feature-flags.ts)
SOCIAL_SHARING=true
```

### **Database Schema**
Uses existing `analytics_events` table:
```sql
-- Event tracking
INSERT INTO analytics_events (
  event_type,
  event_category,
  event_data,
  page_url,
  user_agent,
  ip_address,
  session_id,
  timestamp
) VALUES (
  'social_share',
  'engagement',
  '{"platform": "x", "poll_id": "poll-123"}',
  '/polls/poll-123',
  'Mozilla/5.0...',
  '192.168.1.1',
  'session-123',
  NOW()
);
```

## 🎯 Future Enhancements

### **Planned Features**
1. **Open Graph Generation**: Dynamic social media previews
2. **Visual Content**: Instagram/TikTok optimized sharing
3. **Advanced Analytics**: Machine learning insights
4. **Real-time Updates**: WebSocket-based live analytics

### **Integration Opportunities**
1. **Social Media APIs**: Direct platform integration
2. **Content Optimization**: AI-powered share optimization
3. **Viral Tracking**: Content virality prediction
4. **Cross-Platform Analytics**: Unified social media insights

## 📚 Related Documentation

- [Feature Flags Documentation](../core/FEATURE_FLAGS_COMPREHENSIVE.md)
- [Analytics System Documentation](./ANALYTICS.md)
- [Polls Feature Documentation](./POLLS.md)
- [System Architecture Documentation](../core/SYSTEM_ARCHITECTURE_ACTUAL.md)

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Production Ready  
**Next Review:** Quarterly

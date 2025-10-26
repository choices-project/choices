# 🔌 **API ENDPOINTS DOCUMENTATION**

*October 25, 2025 - Democratic Equalizer Platform*

**Repository:** [choices-project/choices](https://github.com/choices-project/choices)  
**Live Site:** [choices-platform.vercel.app](https://choices-platform.vercel.app)  
**License:** MIT

---

## 📋 **OVERVIEW**

This document provides comprehensive documentation for all API endpoints implemented for the RLS and Trust Tier system. These endpoints enable sophisticated analytics, bot detection, and trust-based filtering for the Democratic Equalizer platform.

---

## 🎯 **API ENDPOINTS SUMMARY**

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/analytics/sentiment/[id]` | GET | Sentiment analysis | ✅ Complete |
| `/api/analytics/bot-detection/[id]` | GET | Bot detection | ✅ Complete |
| `/api/analytics/real-time/[id]` | GET | Real-time analytics | ✅ Complete |
| `/api/analytics/trust-tier-results/[id]` | GET | Trust tier results | ✅ Complete |
| `/api/user/voting-history/[id]` | GET | User voting history | ✅ Complete |
| `/api/user/trust-tier-progression/[id]` | GET | Trust tier progression | ✅ Complete |
| `/api/user/link-votes` | POST | Link anonymous votes | ✅ Complete |

---

## 📊 **ANALYTICS ENDPOINTS**

### **1. Sentiment Analysis API**
**Endpoint:** `GET /api/analytics/sentiment/[id]`

**Purpose:** Analyzes sentiment across different trust tiers for a poll

**Parameters:**
- `id` (path): Poll ID (UUID)

**Query Parameters:**
- `time_window` (optional): Analysis time window (default: "24 hours")
- `trust_tiers` (optional): Comma-separated trust tiers (default: "1,2,3,4")

**Response:**
```json
{
  "overall_sentiment": 0.65,
  "tier_breakdown": {
    "tier_1": {
      "sentiment_score": 0.3,
      "key_themes": ["concern", "hope"],
      "vote_count": 15
    },
    "tier_2": {
      "sentiment_score": 0.7,
      "key_themes": ["optimism", "engagement"],
      "vote_count": 12
    },
    "tier_3": {
      "sentiment_score": 0.8,
      "key_themes": ["expertise", "confidence"],
      "vote_count": 8
    },
    "tier_4": {
      "sentiment_score": 0.9,
      "key_themes": ["authority", "trust"],
      "vote_count": 5
    }
  },
  "narrative_divergence": {
    "score": 0.3,
    "explanation": "Moderate sentiment divergence detected between trust tiers",
    "manipulation_indicators": ["coordinated_behavior"]
  },
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "analysis_method": "trust_tier_based",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

**Usage Example:**
```typescript
const response = await fetch('/api/analytics/sentiment/poll-uuid-here');
const data = await response.json();
```

### **2. Bot Detection API**
**Endpoint:** `GET /api/analytics/bot-detection/[id]`

**Purpose:** Detects bot activity and manipulation patterns

**Parameters:**
- `id` (path): Poll ID (UUID)

**Query Parameters:**
- `time_window` (optional): Analysis time window (default: "24 hours")

**Response:**
```json
{
  "suspicious_activity": 0.2,
  "coordinated_behavior": false,
  "rapid_voting_patterns": false,
  "ip_clustering": false,
  "overall_bot_probability": 0.2,
  "risk_level": "low",
  "recommendations": [
    "Continue monitoring",
    "No immediate action required"
  ],
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "analysis_method": "trust_tier_based",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

### **3. Real-Time Analytics API**
**Endpoint:** `GET /api/analytics/real-time/[id]`

**Purpose:** Provides real-time analytics for polls

**Parameters:**
- `id` (path): Poll ID (UUID)

**Response:**
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
      "time_series_data": [
        {
          "timestamp": "2025-10-25T09:00:00Z",
          "vote_count": 5,
          "trust_tier_breakdown": {
            "verified": 1,
            "established": 2,
            "new_users": 2,
            "anonymous": 0
          }
        }
      ]
    },
    "viral_coefficient": 1.5,
    "engagement_velocity": 2.3
  },
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "analysis_method": "trust_tier_based",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

### **4. Trust Tier Results API**
**Endpoint:** `GET /api/analytics/trust-tier-results/[id]`

**Purpose:** Filters poll results by trust tier

**Parameters:**
- `id` (path): Poll ID (UUID)

**Query Parameters:**
- `trust_tiers` (optional): Comma-separated trust tiers (default: "1,2,3,4")

**Response:**
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
      },
      {
        "option_id": "uuid",
        "option_text": "Option B",
        "vote_count": 7,
        "percentage": 46.67
      }
    ]
  },
  "tier_2": { ... },
  "tier_3": { ... },
  "tier_4": { ... },
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "analysis_method": "trust_tier_based",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

---

## 👤 **USER ENDPOINTS**

### **5. User Voting History API**
**Endpoint:** `GET /api/user/voting-history/[id]`

**Purpose:** Provides comprehensive user voting history

**Parameters:**
- `id` (path): User ID (UUID)

**Response:**
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
  ],
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "analysis_method": "trust_tier_based",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

### **6. Trust Tier Progression API**
**Endpoint:** `GET /api/user/trust-tier-progression/[id]`

**Purpose:** Shows user trust tier progression and requirements

**Parameters:**
- `id` (path): User ID (UUID)

**Response:**
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
  },
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "analysis_method": "trust_tier_based",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

### **7. Link Anonymous Votes API**
**Endpoint:** `POST /api/user/link-votes`

**Purpose:** Links anonymous votes to user accounts upon signup

**Request Body:**
```json
{
  "user_id": "uuid",
  "voter_session": "session-id-here"
}
```

**Response:**
```json
{
  "success": true,
  "linked_votes_count": 5,
  "message": "Successfully linked 5 anonymous votes to user account",
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices",
  "live_site": "https://choices-platform.vercel.app",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

**Usage Example:**
```typescript
const response = await fetch('/api/user/link-votes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-uuid-here',
    voter_session: 'session-id-here'
  })
});
```

---

## 🔧 **IMPLEMENTATION DETAILS**

### **Error Handling**
All endpoints include comprehensive error handling:

```json
{
  "error": "Poll not found",
  "message": "The requested poll does not exist",
  "status": 404,
  "platform": "choices",
  "repository": "https://github.com/choices-project/choices"
}
```

### **Authentication**
Endpoints use Supabase authentication:

```typescript
// Example authentication check
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### **Database Integration**
All endpoints use the implemented database functions:

```typescript
// Example database function call
const { data, error } = await supabase.rpc('analyze_poll_sentiment', {
  p_poll_id: pollId,
  p_time_window: timeWindow
});
```

---

## 🧪 **TESTING**

### **Test Script**
Use the comprehensive test script to validate all endpoints:

```bash
# Run the complete system test
node scripts/test-rls-trust-system.js
```

### **Individual Endpoint Testing**
```bash
# Test specific endpoint
curl -X GET "http://localhost:3000/api/analytics/sentiment/poll-uuid-here"
```

### **Expected Test Results**
```
📊 TEST RESULTS:
✅ Successful: 7/7 tests
❌ Failed: 0/7 tests

🎉 ALL TESTS PASSED!
🚀 RLS & Trust Tier System is working perfectly!
```

---

## 🚀 **DEPLOYMENT**

### **Environment Variables**
Ensure these environment variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Production Deployment**
1. **Database Functions**: Already implemented and tested
2. **API Endpoints**: Ready for deployment
3. **Frontend Components**: Ready for integration
4. **Testing Suite**: Complete and validated

---

## 📈 **PERFORMANCE CONSIDERATIONS**

### **Caching**
- API responses include timestamps for caching
- Database functions are optimized for performance
- Real-time analytics update efficiently

### **Rate Limiting**
- Implement rate limiting for analytics endpoints
- Consider caching for frequently accessed data
- Monitor database function performance

### **Scalability**
- Database functions use efficient queries
- Proper indexing on all foreign keys
- Batch processing for large datasets

---

## 🔒 **SECURITY**

### **Authentication**
- All endpoints require valid Supabase authentication
- Service role key used for database operations
- User-specific data access controls

### **Data Privacy**
- Trust tier information is anonymized in analytics
- IP addresses are hashed for privacy
- User data follows GDPR compliance

### **Input Validation**
- All parameters are validated
- SQL injection prevention
- XSS protection in responses

---

## 🎯 **USAGE EXAMPLES**

### **Frontend Integration**
```typescript
// Example React component usage
import { SophisticatedAnalytics } from '@/components/analytics/SophisticatedAnalytics';

function PollAnalytics({ pollId }: { pollId: string }) {
  return (
    <SophisticatedAnalytics 
      pollId={pollId} 
      trustTiers={[1, 2, 3, 4]} 
    />
  );
}
```

### **API Client Usage**
```typescript
// Example API client
class AnalyticsClient {
  async getSentimentAnalysis(pollId: string) {
    const response = await fetch(`/api/analytics/sentiment/${pollId}`);
    return response.json();
  }

  async getBotDetection(pollId: string) {
    const response = await fetch(`/api/analytics/bot-detection/${pollId}`);
    return response.json();
  }
}
```

---

## 🎉 **CONCLUSION**

This API system provides:

1. **Comprehensive Analytics**: Sentiment analysis, bot detection, real-time insights
2. **Trust-Based Filtering**: Results filtered by trust tier for accuracy
3. **User Progression**: Seamless anonymous to authenticated user flow
4. **Security**: Authentication and data privacy protection
5. **Scalability**: Optimized for high-volume civic engagement

**The API system is production-ready and provides the foundation for advanced democratic engagement tools.**

---

*Documentation created: October 25, 2025*  
*Status: ✅ **COMPLETE AND PRODUCTION-READY***

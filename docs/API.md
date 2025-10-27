# 🔌 API Reference

**Complete API Documentation for Choices Platform**

---

## 🎯 **Overview**

This document provides comprehensive documentation for all API endpoints in the Choices platform.

**Last Updated**: October 27, 2025  
**Base URL**: `https://choices-platform.vercel.app/api`  
**Authentication**: Bearer token, WebAuthn, or Anonymous

---

## 🔐 **Authentication**

### **Authentication Methods**
1. **WebAuthn** - Passwordless authentication
2. **OAuth** - Social login (Google, GitHub)
3. **Email/Password** - Traditional authentication
4. **Anonymous** - Limited access for viral growth

### **Headers**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 🗳️ **Polls API**

### **Create Poll**
```http
POST /api/polls
```

**Request Body**:
```json
{
  "title": "What should we prioritize?",
  "description": "Help us decide our next focus",
  "options": ["Feature A", "Feature B", "Feature C"],
  "privacy_level": "public",
  "poll_type": "single_choice",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "id": "poll_123",
  "title": "What should we prioritize?",
  "description": "Help us decide our next focus",
  "options": [
    {"id": "opt_1", "text": "Feature A", "votes": 0},
    {"id": "opt_2", "text": "Feature B", "votes": 0},
    {"id": "opt_3", "text": "Feature C", "votes": 0}
  ],
  "privacy_level": "public",
  "poll_type": "single_choice",
  "expires_at": "2025-12-31T23:59:59Z",
  "created_at": "2025-10-27T12:00:00Z",
  "status": "active"
}
```

### **Get Poll**
```http
GET /api/polls/{id}
```

**Response**:
```json
{
  "id": "poll_123",
  "title": "What should we prioritize?",
  "description": "Help us decide our next focus",
  "options": [
    {"id": "opt_1", "text": "Feature A", "votes": 15},
    {"id": "opt_2", "text": "Feature B", "votes": 23},
    {"id": "opt_3", "text": "Feature C", "votes": 8}
  ],
  "privacy_level": "public",
  "poll_type": "single_choice",
  "expires_at": "2025-12-31T23:59:59Z",
  "created_at": "2025-10-27T12:00:00Z",
  "status": "active",
  "total_votes": 46
}
```

### **Vote on Poll**
```http
POST /api/polls/{id}/vote
```

**Request Body**:
```json
{
  "option_id": "opt_2",
  "anonymous": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "vote_id": "vote_456"
}
```

### **Get Poll Results**
```http
GET /api/polls/{id}/results
```

**Response**:
```json
{
  "poll_id": "poll_123",
  "total_votes": 46,
  "results": [
    {"option_id": "opt_2", "text": "Feature B", "votes": 23, "percentage": 50.0},
    {"option_id": "opt_1", "text": "Feature A", "votes": 15, "percentage": 32.6},
    {"option_id": "opt_3", "text": "Feature C", "votes": 8, "percentage": 17.4}
  ],
  "breakdown": {
    "by_trust_tier": {
      "verified": {"total": 20, "breakdown": {"opt_1": 8, "opt_2": 10, "opt_3": 2}},
      "established": {"total": 18, "breakdown": {"opt_1": 5, "opt_2": 9, "opt_3": 4}},
      "new": {"total": 8, "breakdown": {"opt_1": 2, "opt_2": 4, "opt_3": 2}}
    }
  }
}
```

---

## 🏛️ **Civics API**

### **Get Representatives by Address**
```http
GET /api/civics/by-address
```

**Query Parameters**:
- `address` (required): Street address
- `include_voting_records`: Include voting history

**Response**:
```json
{
  "address": "123 Main St, San Francisco, CA",
  "representatives": [
    {
      "id": "rep_123",
      "name": "John Smith",
      "title": "Congressman",
      "district": "CA-12",
      "party": "Democratic",
      "contact": {
        "email": "john.smith@house.gov",
        "phone": "(202) 555-0123",
        "website": "https://johnsmith.house.gov"
      },
      "voting_records": [
        {
          "bill": "H.R. 1234",
          "title": "Climate Action Bill",
          "vote": "Yea",
          "date": "2025-10-15"
        }
      ]
    }
  ]
}
```

### **Get Representatives by State**
```http
GET /api/civics/by-state/{state}
```

**Response**:
```json
{
  "state": "CA",
  "representatives": [
    {
      "id": "rep_123",
      "name": "John Smith",
      "title": "Congressman",
      "district": "CA-12",
      "party": "Democratic"
    }
  ],
  "senators": [
    {
      "id": "sen_456",
      "name": "Jane Doe",
      "title": "Senator",
      "party": "Democratic"
    }
  ]
}
```

---

## 📊 **Analytics API**

### **Unified Analytics Endpoint**
```http
GET /api/analytics/unified/{id}
```

**Query Parameters**:
- `method`: Analytics method (trends, demographics, sentiment)
- `timeframe`: Time range (7d, 30d, 90d, 1y)
- `ai_provider`: AI provider (ollama, huggingface)

**Response**:
```json
{
  "id": "poll_123",
  "method": "trends",
  "timeframe": "30d",
  "ai_provider": "ollama",
  "results": {
    "trends": {
      "direction": "increasing",
      "velocity": 0.15,
      "confidence": 0.87
    },
    "demographics": {
      "age_groups": {
        "18-24": 0.25,
        "25-34": 0.35,
        "35-44": 0.22,
        "45-54": 0.18
      },
      "geographic": {
        "urban": 0.68,
        "suburban": 0.24,
        "rural": 0.08
      }
    },
    "sentiment": {
      "positive": 0.65,
      "neutral": 0.28,
      "negative": 0.07
    }
  },
  "generated_at": "2025-10-27T12:00:00Z"
}
```

### **Analytics Events**
```http
POST /api/analytics/unified/events
```

**Request Body**:
```json
{
  "event_type": "poll_view",
  "poll_id": "poll_123",
  "user_id": "user_456",
  "metadata": {
    "source": "dashboard",
    "device": "mobile"
  }
}
```

---

## 👤 **User API**

### **Get User Profile**
```http
GET /api/user/profile
```

**Response**:
```json
{
  "id": "user_456",
  "email": "user@example.com",
  "name": "John Doe",
  "trust_tier": "verified",
  "created_at": "2025-10-01T00:00:00Z",
  "preferences": {
    "notifications": true,
    "privacy_level": "standard"
  }
}
```

### **Update User Profile**
```http
PUT /api/user/profile
```

**Request Body**:
```json
{
  "name": "John Smith",
  "preferences": {
    "notifications": false,
    "privacy_level": "enhanced"
  }
}
```

### **Get User Voting History**
```http
GET /api/user/voting-history/{user_id}
```

**Response**:
```json
{
  "user_id": "user_456",
  "total_votes": 42,
  "votes": [
    {
      "poll_id": "poll_123",
      "poll_title": "What should we prioritize?",
      "option_voted": "Feature B",
      "voted_at": "2025-10-27T10:30:00Z"
    }
  ]
}
```

---

## 🛡️ **Admin API**

### **Admin Dashboard Metrics**
```http
GET /api/admin/dashboard
```

**Response**:
```json
{
  "metrics": {
    "total_users": 1250,
    "total_polls": 89,
    "total_votes": 3420,
    "active_users_7d": 156
  },
  "recent_activity": [
    {
      "type": "poll_created",
      "user_id": "user_123",
      "poll_id": "poll_456",
      "timestamp": "2025-10-27T11:00:00Z"
    }
  ],
  "system_health": {
    "database": "healthy",
    "ai_services": "healthy",
    "uptime": "99.9%"
  }
}
```

### **User Management**
```http
GET /api/admin/users
```

**Query Parameters**:
- `page`: Page number
- `limit`: Results per page
- `trust_tier`: Filter by trust tier

**Response**:
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "trust_tier": "verified",
      "created_at": "2025-10-01T00:00:00Z",
      "last_active": "2025-10-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

### **Promote User**
```http
POST /api/admin/users/{user_id}/promote
```

**Request Body**:
```json
{
  "new_tier": "verified",
  "reason": "Completed verification process"
}
```

---

## 🔍 **Search API**

### **Search Polls**
```http
GET /api/search/polls
```

**Query Parameters**:
- `q`: Search query
- `category`: Poll category
- `status`: Poll status (active, closed)
- `limit`: Results limit

**Response**:
```json
{
  "polls": [
    {
      "id": "poll_123",
      "title": "What should we prioritize?",
      "description": "Help us decide our next focus",
      "votes": 46,
      "status": "active",
      "created_at": "2025-10-27T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

## 📱 **PWA API**

### **PWA Manifest**
```http
GET /api/pwa/manifest
```

**Response**:
```json
{
  "name": "Choices Platform",
  "short_name": "Choices",
  "description": "Democratic Equalizer Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### **Offline Sync**
```http
POST /api/pwa/offline/sync
```

**Request Body**:
```json
{
  "actions": [
    {
      "type": "vote",
      "poll_id": "poll_123",
      "option_id": "opt_2",
      "timestamp": "2025-10-27T10:00:00Z"
    }
  ]
}
```

---

## 🚨 **Error Responses**

### **Standard Error Format**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### **Common Error Codes**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 🔒 **Rate Limiting**

### **Rate Limits**
- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Admin**: 5000 requests/hour

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 📊 **API Status**

### **Health Check**
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:00:00Z",
  "services": {
    "database": "healthy",
    "ai_services": "healthy",
    "auth": "healthy"
  },
  "version": "1.0.0"
}
```

---

## 🎯 **Best Practices**

### **Request Guidelines**
- Use appropriate HTTP methods
- Include proper headers
- Validate request data
- Handle errors gracefully

### **Response Guidelines**
- Use consistent response format
- Include relevant metadata
- Provide clear error messages
- Use appropriate HTTP status codes

---

**API Reference Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This API reference provides complete documentation for all Choices platform endpoints.*

# API Reference

**Last Updated**: 2025-09-16

This document provides a comprehensive reference for the Choices platform API endpoints.

## 🔗 Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## 🔐 Authentication

All API endpoints require authentication unless otherwise specified. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📊 Poll Management

### Create Poll

```http
POST /api/polls
Content-Type: application/json

{
  "title": "What's your favorite programming language?",
  "description": "Help us understand developer preferences",
  "options": ["JavaScript", "Python", "TypeScript", "Rust"],
  "privacyLevel": "public",
  "votingMethod": "single-choice",
  "settings": {
    "allowAbstention": false,
    "showResults": true,
    "requireVerification": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "poll": {
    "id": "poll_123",
    "title": "What's your favorite programming language?",
    "description": "Help us understand developer preferences",
    "options": [
      {"id": "opt_1", "text": "JavaScript"},
      {"id": "opt_2", "text": "Python"},
      {"id": "opt_3", "text": "TypeScript"},
      {"id": "opt_4", "text": "Rust"}
    ],
    "privacyLevel": "public",
    "votingMethod": "single-choice",
    "createdAt": "2024-12-15T10:00:00Z",
    "createdBy": "user_123"
  }
}
```

### Get Poll

```http
GET /api/polls/{pollId}
```

**Response:**
```json
{
  "success": true,
  "poll": {
    "id": "poll_123",
    "title": "What's your favorite programming language?",
    "description": "Help us understand developer preferences",
    "options": [
      {
        "id": "opt_1",
        "text": "JavaScript",
        "votes": 45,
        "percentage": 35.2
      },
      {
        "id": "opt_2",
        "text": "Python",
        "votes": 38,
        "percentage": 29.7
      },
      {
        "id": "opt_3",
        "text": "TypeScript",
        "votes": 32,
        "percentage": 25.0
      },
      {
        "id": "opt_4",
        "text": "Rust",
        "votes": 13,
        "percentage": 10.1
      }
    ],
    "totalVotes": 128,
    "privacyLevel": "public",
    "votingMethod": "single-choice",
    "createdAt": "2024-12-15T10:00:00Z",
    "createdBy": "user_123",
    "isActive": true
  }
}
```

### Vote on Poll

```http
POST /api/polls/{pollId}/vote
Content-Type: application/json

{
  "optionId": "opt_1",
  "rankings": [1, 2, 3, 4] // For ranked-choice voting
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "vote": {
    "id": "vote_123",
    "pollId": "poll_123",
    "optionId": "opt_1",
    "userId": "user_123",
    "createdAt": "2024-12-15T10:30:00Z"
  }
}
```

### Get Trending Polls

```http
GET /api/polls/trending?limit=10&category=technology
```

**Response:**
```json
{
  "success": true,
  "polls": [
    {
      "id": "poll_123",
      "title": "What's your favorite programming language?",
      "description": "Help us understand developer preferences",
      "totalVotes": 128,
      "category": "technology",
      "createdAt": "2024-12-15T10:00:00Z",
      "trendingScore": 95.5
    }
  ]
}
```

## 👤 User Management

### Get User Profile

```http
GET /api/user/profile
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "trustTier": "T1",
    "createdAt": "2024-12-01T00:00:00Z",
    "isActive": true
  }
}
```

### Update User Profile

```http
PUT /api/user/profile
Content-Type: application/json

{
  "username": "newusername",
  "name": "New Name",
  "bio": "Updated bio"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "newusername",
    "name": "New Name",
    "bio": "Updated bio",
    "updatedAt": "2024-12-15T10:00:00Z"
  }
}
```

## 🔐 WebAuthn Authentication

### Begin Registration

```http
POST /api/webauthn/register/begin
Content-Type: application/json

{
  "userId": "user_123",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "rp": {
    "id": "your-domain.com",
    "name": "Choices"
  },
  "user": {
    "id": "dXNlcl8xMjM=",
    "name": "johndoe",
    "displayName": "John Doe"
  },
  "challenge": "random-challenge-string",
  "pubKeyCredParams": [
    {"type": "public-key", "alg": -7},
    {"type": "public-key", "alg": -257}
  ],
  "timeout": 60000,
  "attestation": "none",
  "authenticatorSelection": {
    "residentKey": "preferred",
    "userVerification": "required",
    "authenticatorAttachment": "platform"
  }
}
```

### Complete Registration

```http
POST /api/webauthn/register/complete
Content-Type: application/json

{
  "userId": "user_123",
  "response": {
    "rawId": "credential-id",
    "response": {
      "attestationObject": "attestation-object",
      "clientDataJSON": "client-data-json"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Passkey created successfully"
}
```

### Begin Authentication

```http
POST /api/webauthn/authenticate/begin
Content-Type: application/json

{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "challenge": "random-challenge-string",
  "timeout": 60000,
  "rpId": "your-domain.com",
  "userVerification": "required",
  "allowCredentials": [
    {
      "id": "credential-id",
      "type": "public-key",
      "transports": ["internal"]
    }
  ]
}
```

### Complete Authentication

```http
POST /api/webauthn/authenticate/complete
Content-Type: application/json

{
  "userId": "user_123",
  "response": {
    "rawId": "credential-id",
    "response": {
      "authenticatorData": "authenticator-data",
      "clientDataJSON": "client-data-json",
      "signature": "signature"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

## 👑 Admin Endpoints

### Get System Status

```http
GET /api/admin/system-status
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-12-15T10:00:00Z",
  "checks": [
    {
      "name": "Database Connection",
      "ok": true,
      "detail": "Connected to PostgreSQL",
      "durationMs": 15
    },
    {
      "name": "RLS Check",
      "ok": true,
      "detail": "Row Level Security active",
      "durationMs": 8
    },
    {
      "name": "Admin Check",
      "ok": true,
      "detail": "Admin privileges verified",
      "durationMs": 12
    }
  ]
}
```

### Get User Statistics

```http
GET /api/admin/stats/users
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "newUsersToday": 15,
    "newUsersThisWeek": 95,
    "trustTierDistribution": {
      "T0": 450,
      "T1": 520,
      "T2": 200,
      "T3": 80
    }
  }
}
```

### Get Poll Statistics

```http
GET /api/admin/stats/polls
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPolls": 340,
    "activePolls": 125,
    "completedPolls": 215,
    "totalVotes": 15420,
    "averageVotesPerPoll": 45.4,
    "categoryDistribution": {
      "technology": 120,
      "politics": 85,
      "entertainment": 70,
      "other": 65
    }
  }
}
```

## 📊 Analytics

### Get Poll Analytics

```http
GET /api/analytics/polls/{pollId}
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "pollId": "poll_123",
    "totalVotes": 128,
    "uniqueVoters": 95,
    "completionRate": 74.2,
    "averageTimeToVote": 45.5,
    "demographicBreakdown": {
      "ageGroups": {
        "18-24": 25,
        "25-34": 35,
        "35-44": 20,
        "45+": 15
      },
      "genderDistribution": {
        "male": 60,
        "female": 35,
        "other": 5
      }
    },
    "votingPatterns": {
      "peakHours": [14, 15, 16],
      "votingDays": ["Monday", "Tuesday", "Wednesday"]
    }
  }
}
```

## 🚨 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "title",
      "reason": "Title is required"
    }
  },
  "timestamp": "2024-12-15T10:00:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication required
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## 🔒 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **Admin endpoints**: 50 requests per 15 minutes

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📝 Webhooks

### Poll Created Webhook

```http
POST /api/webhooks/poll-created
Content-Type: application/json

{
  "event": "poll.created",
  "data": {
    "pollId": "poll_123",
    "title": "New Poll",
    "createdBy": "user_123",
    "createdAt": "2024-12-15T10:00:00Z"
  }
}
```

### Vote Cast Webhook

```http
POST /api/webhooks/vote-cast
Content-Type: application/json

{
  "event": "vote.cast",
  "data": {
    "voteId": "vote_123",
    "pollId": "poll_123",
    "userId": "user_123",
    "optionId": "opt_1",
    "createdAt": "2024-12-15T10:30:00Z"
  }
}
```

## 🧪 Testing

### Test Endpoints

```http
GET /api/test/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-15T10:00:00Z",
  "version": "1.0.0"
}
```

### Mock Data

```http
GET /api/test/mock-polls
```

**Response:**
```json
{
  "success": true,
  "polls": [
    {
      "id": "mock_poll_1",
      "title": "Mock Poll 1",
      "description": "This is a mock poll for testing",
      "options": [
        {"id": "opt_1", "text": "Option 1", "votes": 10},
        {"id": "opt_2", "text": "Option 2", "votes": 15}
      ],
      "totalVotes": 25
    }
  ]
}
```

---

**Last Updated:** 2025-09-16  
**Version:** 1.0.0




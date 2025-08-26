# 🔌 **API Documentation**

**Last Updated**: December 27, 2024  
**Version**: 1.0.0  
**Base URL**: `https://your-domain.com/api`

## 🎯 **Overview**

The Choices platform provides a comprehensive REST API for voting, user management, and administrative functions. All endpoints are secured with authentication and rate limiting.

## 🔐 **Authentication**

### **Authentication Methods**
- **JWT Tokens**: Bearer token authentication
- **Session Cookies**: Automatic session management
- **API Keys**: For service-to-service communication

### **Headers**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Key: <api_key> (for service endpoints)
```

### **Rate Limiting**
- **Standard Users**: 100 requests per minute
- **Admin Users**: 500 requests per minute
- **Service Accounts**: 1000 requests per minute

## 📊 **Response Format**

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-12-27T10:30:00Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid input data",
    "code": "INVALID_INPUT",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-12-27T10:30:00Z"
}
```

## 🔐 **Authentication Endpoints**

### **POST /api/auth/register**
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "username",
  "displayName": "Display Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "trust_tier": "T0",
      "created_at": "2024-12-27T10:30:00Z"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

### **POST /api/auth/login**
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "trust_tier": "T1"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

### **POST /api/auth/webauthn/register**
Register biometric credentials.

**Request Body:**
```json
{
  "credential": {
    "id": "credential_id",
    "publicKey": "public_key_data",
    "type": "public-key"
  },
  "challenge": "challenge_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credential_id": "credential_id",
    "registered": true
  }
}
```

### **POST /api/auth/webauthn/authenticate**
Authenticate using biometric credentials.

**Request Body:**
```json
{
  "credential": {
    "id": "credential_id",
    "response": {
      "authenticatorData": "data",
      "clientDataJSON": "data",
      "signature": "signature"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "session": {
      "access_token": "jwt_token"
    }
  }
}
```

## 🗳️ **Poll Management Endpoints**

### **GET /api/polls**
Get list of polls with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (draft, active, closed, archived)
- `privacy`: Filter by privacy level (public, private, high-privacy)
- `category`: Filter by category
- `search`: Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "polls": [
      {
        "id": "uuid",
        "title": "Poll Title",
        "description": "Poll description",
        "options": ["Option 1", "Option 2"],
        "voting_method": "single",
        "status": "active",
        "privacy_level": "public",
        "total_votes": 150,
        "created_at": "2024-12-27T10:30:00Z",
        "end_time": "2024-12-28T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### **GET /api/polls/{id}**
Get specific poll details.

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": "uuid",
      "title": "Poll Title",
      "description": "Poll description",
      "options": ["Option 1", "Option 2"],
      "voting_method": "single",
      "status": "active",
      "privacy_level": "public",
      "total_votes": 150,
      "created_by": "user_uuid",
      "created_at": "2024-12-27T10:30:00Z",
      "start_time": "2024-12-27T10:30:00Z",
      "end_time": "2024-12-28T10:30:00Z",
      "voting_config": {
        "allow_multiple_votes": false,
        "require_verification": false,
        "min_trust_tier": "T0"
      }
    },
    "user_vote": {
      "choice": 0,
      "created_at": "2024-12-27T11:00:00Z"
    }
  }
}
```

### **POST /api/polls**
Create a new poll.

**Request Body:**
```json
{
  "title": "Poll Title",
  "description": "Poll description",
  "options": ["Option 1", "Option 2", "Option 3"],
  "voting_method": "single",
  "privacy_level": "public",
  "start_time": "2024-12-27T10:30:00Z",
  "end_time": "2024-12-28T10:30:00Z",
  "category": "general",
  "tags": ["tag1", "tag2"],
  "voting_config": {
    "allow_multiple_votes": false,
    "require_verification": false,
    "min_trust_tier": "T0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": "uuid",
      "title": "Poll Title",
      "created_at": "2024-12-27T10:30:00Z"
    }
  }
}
```

### **PUT /api/polls/{id}**
Update an existing poll.

**Request Body:**
```json
{
  "title": "Updated Poll Title",
  "description": "Updated description",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": "uuid",
      "title": "Updated Poll Title",
      "updated_at": "2024-12-27T11:00:00Z"
    }
  }
}
```

### **DELETE /api/polls/{id}**
Delete a poll (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Poll deleted successfully"
}
```

## 🗳️ **Voting Endpoints**

### **POST /api/polls/{id}/vote**
Submit a vote for a poll.

**Request Body:**
```json
{
  "choice": 0,
  "vote_data": {
    // Additional data for complex voting methods
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vote": {
      "id": "uuid",
      "poll_id": "poll_uuid",
      "choice": 0,
      "created_at": "2024-12-27T11:00:00Z",
      "verification_token": "token"
    }
  }
}
```

### **GET /api/polls/{id}/results**
Get poll results (if user has permission).

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "total_votes": 150,
      "options": [
        {
          "index": 0,
          "text": "Option 1",
          "votes": 75,
          "percentage": 50.0
        },
        {
          "index": 1,
          "text": "Option 2",
          "votes": 75,
          "percentage": 50.0
        }
      ],
      "winner": 0
    }
  }
}
```

## 👤 **User Management Endpoints**

### **GET /api/profile**
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "user_id": "auth_uuid",
      "username": "username",
      "email": "user@example.com",
      "display_name": "Display Name",
      "trust_tier": "T1",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "User bio",
      "created_at": "2024-12-27T10:30:00Z",
      "privacy_settings": {
        "profile_visibility": "public",
        "show_email": false
      }
    }
  }
}
```

### **PUT /api/profile**
Update user profile.

**Request Body:**
```json
{
  "display_name": "New Display Name",
  "bio": "Updated bio",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "privacy_settings": {
    "profile_visibility": "private",
    "show_email": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "display_name": "New Display Name",
      "updated_at": "2024-12-27T11:00:00Z"
    }
  }
}
```

### **GET /api/user/votes**
Get user's voting history.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "votes": [
      {
        "id": "uuid",
        "poll_id": "poll_uuid",
        "poll_title": "Poll Title",
        "choice": 0,
        "created_at": "2024-12-27T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

## 📊 **Analytics Endpoints**

### **GET /api/analytics**
Get platform analytics (admin only).

**Query Parameters:**
- `period`: Time period (day, week, month, year)
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_users": 1250,
      "active_users": 890,
      "total_polls": 156,
      "active_polls": 23,
      "total_votes": 15420,
      "avg_votes_per_poll": 98.8
    },
    "trends": {
      "user_growth": [/* daily user growth data */],
      "poll_creation": [/* daily poll creation data */],
      "voting_activity": [/* daily voting activity data */]
    }
  }
}
```

### **GET /api/analytics/polls/{id}**
Get analytics for specific poll.

**Response:**
```json
{
  "success": true,
  "data": {
    "poll_analytics": {
      "total_votes": 150,
      "unique_voters": 145,
      "voting_method": "single",
      "participation_rate": 75.5,
      "demographics": {
        "age_groups": {/* age distribution */},
        "trust_tiers": {/* trust tier distribution */}
      },
      "timeline": [/* voting activity over time */]
    }
  }
}
```

## 🔧 **Admin Endpoints**

### **GET /api/admin/users**
Get all users (admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `trust_tier`: Filter by trust tier
- `status`: Filter by status (active, inactive)
- `search`: Search by username or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "username",
        "email": "user@example.com",
        "trust_tier": "T1",
        "status": "active",
        "created_at": "2024-12-27T10:30:00Z",
        "last_login": "2024-12-27T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "pages": 63
    }
  }
}
```

### **PUT /api/admin/users/{id}**
Update user (admin only).

**Request Body:**
```json
{
  "trust_tier": "T2",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "trust_tier": "T2",
      "updated_at": "2024-12-27T11:00:00Z"
    }
  }
}
```

### **GET /api/admin/system**
Get system health and metrics (admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "system_health": {
      "status": "healthy",
      "database": "connected",
      "cache": "operational",
      "uptime": "99.9%"
    },
    "performance": {
      "avg_response_time": 85,
      "requests_per_minute": 1200,
      "error_rate": 0.1,
      "active_connections": 8
    },
    "resources": {
      "cpu_usage": 45.2,
      "memory_usage": 67.8,
      "disk_usage": 23.4
    }
  }
}
```

## 🔒 **Security Endpoints**

### **GET /api/auth/verify**
Verify authentication status.

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "trust_tier": "T1"
    },
    "session": {
      "expires_at": "2024-12-27T12:00:00Z"
    }
  }
}
```

### **POST /api/auth/logout**
Logout and invalidate session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 📊 **Error Codes**

### **Authentication Errors**
- `AUTH_REQUIRED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid email or password
- `SESSION_EXPIRED`: Session has expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

### **Validation Errors**
- `INVALID_INPUT`: Invalid input data
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `INVALID_EMAIL_FORMAT`: Invalid email format
- `PASSWORD_TOO_WEAK`: Password does not meet requirements

### **Resource Errors**
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RESOURCE_ALREADY_EXISTS`: Resource already exists
- `RESOURCE_IN_USE`: Resource is currently in use

### **Rate Limiting**
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RATE_LIMIT_WINDOW`: Rate limit window information

### **System Errors**
- `INTERNAL_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External service unavailable

## 🔧 **Rate Limiting**

### **Rate Limits by Endpoint**
- **Authentication**: 10 requests per minute
- **Poll Creation**: 5 requests per minute
- **Voting**: 20 requests per minute
- **Profile Updates**: 10 requests per minute
- **Admin Operations**: 50 requests per minute

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640606400
```

## 📚 **SDK Examples**

### **JavaScript/TypeScript**
```typescript
import { ChoicesAPI } from '@choices-platform/sdk';

const api = new ChoicesAPI({
  baseURL: 'https://your-domain.com/api',
  token: 'your_jwt_token'
});

// Create a poll
const poll = await api.polls.create({
  title: 'My Poll',
  description: 'Poll description',
  options: ['Option 1', 'Option 2'],
  voting_method: 'single'
});

// Vote on a poll
await api.polls.vote(poll.id, { choice: 0 });
```

### **Python**
```python
from choices_platform import ChoicesAPI

api = ChoicesAPI(
    base_url='https://your-domain.com/api',
    token='your_jwt_token'
)

# Create a poll
poll = api.polls.create({
    'title': 'My Poll',
    'description': 'Poll description',
    'options': ['Option 1', 'Option 2'],
    'voting_method': 'single'
})

# Vote on a poll
api.polls.vote(poll['id'], {'choice': 0})
```

## 🔗 **Webhooks**

### **Webhook Events**
- `poll.created`: New poll created
- `poll.updated`: Poll updated
- `poll.closed`: Poll closed
- `vote.submitted`: New vote submitted
- `user.registered`: New user registered
- `user.updated`: User profile updated

### **Webhook Configuration**
```json
{
  "url": "https://your-webhook-url.com/webhook",
  "events": ["poll.created", "vote.submitted"],
  "secret": "webhook_secret"
}
```

---

**API Version**: 1.0.0  
**Last Updated**: December 27, 2024  
**Documentation**: [https://your-domain.com/docs/api](https://your-domain.com/docs/api)



# Civics API Documentation

**Last Updated:** January 29, 2025  
**Status:** ✅ Production-Ready  
**Base URL:** `/api/civics`

## Overview

The Civics API provides access to representative data, contact information, and civic action tracking. All endpoints query Supabase database only - no external API calls are made from the web application. Data ingestion is handled by the standalone backend service at `/services/civics-backend`.

## Authentication

- **Public Endpoints**: No authentication required (read-only data)
- **Authenticated Endpoints**: Require valid Supabase session token
- **Rate Limiting**: All endpoints implement rate limiting (see individual endpoint documentation)

## Rate Limiting

Rate limiting is implemented using Upstash Redis with the following defaults:
- **Public read endpoints**: 50 requests per 15 minutes per IP
- **Write endpoints**: 10 requests per 15 minutes per IP
- Rate limit headers included in all responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
  - `Retry-After`: Seconds to wait before retrying (429 responses only)

## Endpoints

### 1. Get Representatives by Address

**Endpoint:** `GET /api/civics/by-address`

**Description:** Looks up representatives for a given address by querying Supabase database. Returns normalized representative data.

**Authentication:** Public (no authentication required)

**Rate Limiting:** 50 requests per 15 minutes per IP

**Query Parameters:**
- `address` (required, string): Physical address to look up (e.g., "123 Main St, Springfield, IL 62701")

**Response:**
```json
{
  "success": true,
  "message": "Representatives found via database lookup",
  "address": "123 Main St, Springfield, IL 62701",
  "state": "IL",
  "data": {
    "address": "123 Main St, Springfield, IL 62701",
    "state": "IL",
    "representatives": [
      {
        "id": 1,
        "name": "John Doe",
        "party": "Democratic",
        "office": "US House",
        "level": "federal",
        "state": "IL",
        "district": "13",
        "data_quality_score": 95,
        "data_sources": ["openstates", "congress_gov"],
        // ... additional fields
      }
    ]
  },
  "metadata": {
    "source": "database",
    "updated_at": "2025-01-29T12:00:00Z",
    "data_quality_score": 95,
    "total_representatives": 3
  }
}
```

**Error Responses:**
- `400`: Missing address parameter
- `429`: Rate limit exceeded
- `500`: Database query failed

**Example:**
```bash
curl "https://api.example.com/api/civics/by-address?address=123%20Main%20St%2C%20Springfield%2C%20IL%2062701"
```

---

### 2. Get Representatives by State

**Endpoint:** `GET /api/civics/by-state`

**Description:** Retrieves representatives for a specific state with optional filtering by level (federal/state) and chamber (house/senate).

**Authentication:** Public (no authentication required)

**Rate Limiting:** 50 requests per 15 minutes per IP

**Query Parameters:**
- `state` (required, string): Two-letter state code (e.g., "CA", "NY")
- `level` (optional, string): Filter by level - "federal", "state", or "local"
- `chamber` (optional, string): Filter by chamber - "us_senate", "us_house", "state_upper", "state_lower"
- `limit` (optional, number): Maximum number of results (default: 200)

**Response:**
```json
{
  "success": true,
  "data": {
    "state": "CA",
    "level": "federal",
    "chamber": "all",
    "representatives": [
      {
        "id": 1,
        "name": "Jane Smith",
        "party": "Democratic",
        "office": "US Senate",
        "level": "federal",
        "state": "CA",
        // ... additional fields
      }
    ]
  },
  "metadata": {
    "source": "database",
    "updated_at": "2025-01-29T12:00:00Z",
    "data_quality_score": 95,
    "total_representatives": 53
  }
}
```

**Error Responses:**
- `400`: Missing or invalid state parameter
- `429`: Rate limit exceeded
- `500`: Database query failed

**Example:**
```bash
curl "https://api.example.com/api/civics/by-state?state=CA&level=federal&limit=10"
```

---

### 3. Get Representative Contact Information

**Endpoint:** `GET /api/civics/contact/[id]`

**Description:** Retrieves contact information for a specific representative including email, phone, website, office addresses, and social media.

**Authentication:** Public (no authentication required)

**Rate Limiting:** 50 requests per 15 minutes per IP

**Path Parameters:**
- `id` (required, number): Representative ID

**Response:**
```json
{
  "ok": true,
  "data": {
    "representative": {
      "id": 1,
      "name": "John Doe",
      "office": "US House",
      "level": "federal",
      "jurisdiction": "IL-13",
      "party": "Democratic"
    },
    "contact_methods": {
      "email": {
        "value": "john.doe@house.gov",
        "verified": true,
        "quality_score": 95
      },
      "phone": {
        "value": "(202) 225-0000",
        "verified": true,
        "quality_score": 90
      },
      "website": {
        "value": "https://doe.house.gov",
        "verified": true,
        "quality_score": 95
      }
    },
    "office_addresses": [],
    "social_media": [
      {
        "platform": "twitter",
        "handle": "@johndoe",
        "url": "https://twitter.com/johndoe",
        "followers_count": 50000,
        "engagement_rate": 2.5,
        "verified": true,
        "official_account": true
      }
    ],
    "communication_preferences": {
      "preferred_method": "email",
      "response_time_expectation": "within_week"
    },
    "data_quality": {
      "overall_score": 95,
      "last_verified": "2025-01-15T00:00:00Z",
      "data_source": "openstates",
      "verification_notes": null
    }
  },
  "quick_actions": [
    {
      "type": "email",
      "label": "Send Email",
      "action": "mailto:john.doe@house.gov",
      "icon": "📧"
    }
  ],
  "summary": {
    "total_contact_methods": 3,
    "total_social_platforms": 1,
    "total_quick_actions": 4,
    "data_quality_score": 95
  }
}
```

**Error Responses:**
- `400`: Invalid representative ID
- `404`: Representative not found
- `429`: Rate limit exceeded
- `500`: Database query failed

**Example:**
```bash
curl "https://api.example.com/api/civics/contact/1"
```

---

### 4. Log Communication Attempt

**Endpoint:** `POST /api/civics/contact/[id]`

**Description:** Logs a communication attempt with a representative. Requires authentication.

**Authentication:** Required (valid Supabase session)

**Rate Limiting:** 10 requests per 15 minutes per IP

**Path Parameters:**
- `id` (required, number): Representative ID

**Request Body:**
```json
{
  "communication_type": "email",
  "subject": "Support for Climate Bill",
  "message_preview": "I am writing to express my support..."
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": 123,
    "representative_id": 1,
    "user_id": "user-uuid",
    "communication_type": "email",
    "subject": "Support for Climate Bill",
    "message_preview": "I am writing to express my support...",
    "status": "sent",
    "created_at": "2025-01-29T12:00:00Z"
  },
  "message": "Communication logged successfully"
}
```

**Error Responses:**
- `400`: Invalid representative ID or missing required fields
- `401`: Authentication required
- `429`: Rate limit exceeded
- `500`: Failed to log communication

**Example:**
```bash
curl -X POST "https://api.example.com/api/civics/contact/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "communication_type": "email",
    "subject": "Support for Climate Bill",
    "message_preview": "I am writing to express my support..."
  }'
```

---

### 5. Get Civic Actions

**Endpoint:** `GET /api/civics/actions`

**Description:** Retrieves civic actions for the authenticated user. Supports filtering by status, type, and representative.

**Authentication:** Required (valid Supabase session)

**Rate Limiting:** Not implemented (protected by authentication)

**Query Parameters:**
- `status` (optional, string): Filter by status - "active", "completed", "cancelled", "postponed"
- `type` (optional, string): Filter by type - "contact", "petition", "event", "donation", "volunteer"
- `representativeId` (optional, number): Filter by target representative ID
- `limit` (optional, number): Maximum number of results (default: 50)
- `offset` (optional, number): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": 1,
        "type": "contact",
        "title": "Contact Representative About Climate",
        "description": "Send email to representative about climate bill",
        "status": "active",
        "priority": "high",
        "target_representative": {
          "id": 1,
          "name": "John Doe",
          "title": "Representative",
          "party": "Democratic",
          "state": "IL",
          "district": "13"
        },
        "created_at": "2025-01-29T12:00:00Z",
        "due_date": "2025-02-05T00:00:00Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

**Error Responses:**
- `401`: Authentication required
- `500`: Failed to fetch civic actions

**Example:**
```bash
curl "https://api.example.com/api/civics/actions?status=active&type=contact" \
  -H "Authorization: Bearer <token>"
```

---

### 6. Create Civic Action

**Endpoint:** `POST /api/civics/actions`

**Description:** Creates a new civic action for the authenticated user.

**Authentication:** Required (valid Supabase session)

**Rate Limiting:** Not implemented (protected by authentication)

**Request Body:**
```json
{
  "type": "contact",
  "title": "Contact Representative About Climate",
  "description": "Send email to representative about climate bill",
  "targetRepresentativeId": 1,
  "priority": "high",
  "dueDate": "2025-02-05T00:00:00Z",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "contact",
    "title": "Contact Representative About Climate",
    "status": "active",
    "created_at": "2025-01-29T12:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid request body
- `401`: Authentication required
- `500`: Failed to create civic action

---

### 7. Get Civic Action by ID

**Endpoint:** `GET /api/civics/actions/[id]`

**Description:** Retrieves a specific civic action. Users can only access their own actions.

**Authentication:** Required (valid Supabase session)

**Rate Limiting:** Not implemented (protected by authentication)

**Path Parameters:**
- `id` (required, number): Civic action ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "contact",
    "title": "Contact Representative About Climate",
    "description": "Send email to representative about climate bill",
    "status": "active",
    "priority": "high",
    "target_representative": {
      "id": 1,
      "name": "John Doe"
    },
    "created_at": "2025-01-29T12:00:00Z"
  }
}
```

**Error Responses:**
- `401`: Authentication required
- `403`: Not authorized to access this action
- `404`: Action not found
- `500`: Failed to fetch action

---

### 8. Update Civic Action

**Endpoint:** `PUT /api/civics/actions/[id]`

**Description:** Updates a civic action. Users can only update their own actions.

**Authentication:** Required (valid Supabase session)

**Rate Limiting:** Not implemented (protected by authentication)

**Path Parameters:**
- `id` (required, number): Civic action ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "completed",
  "completionNotes": "Action completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Title",
    "status": "completed",
    "updated_at": "2025-01-29T13:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid request body
- `401`: Authentication required
- `403`: Not authorized to update this action
- `404`: Action not found
- `500`: Failed to update action

---

### 9. Delete Civic Action

**Endpoint:** `DELETE /api/civics/actions/[id]`

**Description:** Deletes a civic action. Users can only delete their own actions.

**Authentication:** Required (valid Supabase session)

**Rate Limiting:** Not implemented (protected by authentication)

**Path Parameters:**
- `id` (required, number): Civic action ID

**Response:**
```json
{
  "success": true,
  "message": "Civic action deleted successfully"
}
```

**Error Responses:**
- `401`: Authentication required
- `403`: Not authorized to delete this action
- `404`: Action not found
- `500`: Failed to delete action

---

### 10. Get Representative by ID

**Endpoint:** `GET /api/civics/representative/[id]`

**Description:** Retrieves detailed information for a specific representative.

**Authentication:** Public (no authentication required)

**Rate Limiting:** Not implemented (should be added for consistency)

**Path Parameters:**
- `id` (required, number): Representative ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "party": "Democratic",
    "office": "US House",
    "level": "federal",
    "state": "IL",
    "district": "13",
    // ... additional fields
  }
}
```

**Error Responses:**
- `400`: Invalid representative ID
- `404`: Representative not found
- `500`: Database query failed

---

## Data Models

### Representative

```typescript
interface Representative {
  id: number;
  name: string;
  party: string | null;
  office: string;
  level: 'federal' | 'state' | 'local';
  state: string;
  district: string | null;
  bioguide_id: string | null;
  openstates_id: string | null;
  fec_id: string | null;
  data_quality_score: number;
  data_sources: string[];
  last_verified: string | null;
  // ... additional fields
}
```

### Contact Information

```typescript
interface ContactInformation {
  representative: {
    id: number;
    name: string;
    office: string;
    level: string;
    jurisdiction: string;
    party: string | null;
  };
  contact_methods: {
    email: ContactMethod | null;
    phone: ContactMethod | null;
    website: ContactMethod | null;
  };
  social_media: SocialMediaAccount[];
  communication_preferences: {
    preferred_method: string;
    response_time_expectation: string;
  };
  data_quality: {
    overall_score: number;
    last_verified: string | null;
    data_source: string;
  };
}
```

### Civic Action

```typescript
interface CivicAction {
  id: number;
  type: 'contact' | 'petition' | 'event' | 'donation' | 'volunteer';
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_representative_id: number | null;
  due_date: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "retryAfter": 900  // For 429 responses only
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```

Response headers:
- `Retry-After: 900`
- `X-RateLimit-Limit: 50`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1738166400`

## Security

### Authentication
- Public endpoints: No authentication required
- Authenticated endpoints: Require valid Supabase session token
- Session tokens are validated server-side

### Authorization
- Users can only access/modify their own civic actions
- Row-Level Security (RLS) policies enforce data access restrictions

### Rate Limiting
- All endpoints implement rate limiting via Upstash Redis
- Limits are per-IP address
- Limits prevent abuse and ensure fair usage

### Data Protection
- All queries use parameterized queries (SQL injection protection)
- Input validation on all parameters
- Error messages don't leak sensitive information

## Architecture Notes

### Data Source
- All data comes from Supabase database
- Data is ingested by standalone backend service at `/services/civics-backend`
- Web application only queries database, never calls external APIs directly

### Exception: Address Lookup
- `/api/v1/civics/address-lookup` is the sole exception that calls external APIs
- This endpoint calls Google Civic Information API for real-time address-to-district mapping
- Required because addresses change constantly and districts are redistricted

### Caching
- Some endpoints implement in-memory caching for frequently accessed data
- Cache TTL: 5 minutes
- Cache can be cleared via admin endpoints

## Support

For issues or questions:
- Check `/docs/SECURITY_AUDIT_CIVICS.md` for security information
- Check `/docs/ENVIRONMENT_VARIABLES.md` for configuration
- Check `/docs/CIVICS_ARCHITECTURE_AUDIT.md` for architecture details

## Changelog

### January 29, 2025
- Added rate limiting to `/api/civics/by-address`
- Added authentication to `/api/civics/contact/[id]` POST endpoint
- Added rate limiting to `/api/civics/contact/[id]`
- Migrated endpoints to use `getSupabaseServerClient()` for better RLS compliance
- Fixed user ID spoofing vulnerability in contact logging endpoint




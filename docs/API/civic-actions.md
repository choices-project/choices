# Civic Actions API Documentation

**Feature:** Civic Engagement V2  
**Base Path:** `/api/civic-actions`  
**Feature Flag:** `CIVIC_ENGAGEMENT_V2`

---

## Overview

The Civic Actions API provides endpoints for creating, managing, and interacting with civic engagement actions including petitions, campaigns, surveys, events, protests, and meetings.

---

## Authentication

Most endpoints require authentication. Unauthenticated users can only view public actions.

---

## Endpoints

### List Civic Actions

**GET** `/api/civic-actions`

Returns a paginated list of civic actions with optional filtering.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | Filter by status (draft, active, paused, completed, cancelled) | - |
| `action_type` | string | Filter by action type | - |
| `category` | string | Filter by category | - |
| `urgency_level` | string | Filter by urgency (low, medium, high, critical) | - |
| `is_public` | boolean | Filter by public/private | - |
| `target_representative_id` | number | Filter by target representative | - |
| `limit` | number | Number of results per page (1-100) | 20 |
| `offset` | number | Pagination offset | 0 |
| `sort` | string | Sort field (created_at, current_signatures, urgency_level) | created_at |
| `order` | string | Sort order (asc, desc) | desc |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Support Climate Action",
      "description": "Urgent petition for climate legislation",
      "action_type": "petition",
      "category": "environment",
      "urgency_level": "high",
      "status": "active",
      "is_public": true,
      "current_signatures": 150,
      "required_signatures": 1000,
      "target_representatives": [1, 2, 3],
      "target_state": "CA",
      "target_district": "12",
      "created_by": "user-uuid",
      "created_at": "2025-01-22T00:00:00Z",
      "updated_at": "2025-01-22T00:00:00Z",
      "end_date": "2025-12-31T23:59:59Z",
      "metadata": {}
    }
  ],
  "metadata": {
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Example

```bash
curl -X GET "https://api.example.com/api/civic-actions?status=active&limit=10"
```

---

### Create Civic Action

**POST** `/api/civic-actions`

Creates a new civic action.

#### Request Body

```json
{
  "title": "Support Climate Action",
  "description": "Urgent petition for climate legislation",
  "action_type": "petition",
  "category": "environment",
  "urgency_level": "high",
  "target_representatives": [1, 2, 3],
  "target_state": "CA",
  "target_district": "12",
  "required_signatures": 1000,
  "end_date": "2025-12-31T23:59:59Z",
  "is_public": true,
  "status": "draft",
  "metadata": {}
}
```

#### Required Fields

- `title` (string, 1-200 chars)
- `action_type` (enum: petition, campaign, survey, event, protest, meeting)

#### Optional Fields

- `description` (string, max 5000 chars)
- `category` (string, max 100 chars)
- `urgency_level` (enum: low, medium, high, critical) - Default: medium
- `target_representatives` (array of numbers)
- `target_state` (string, 2 chars)
- `target_district` (string, max 50 chars)
- `target_office` (string, max 100 chars)
- `required_signatures` (number, 1-1000000)
- `end_date` (ISO 8601 datetime)
- `is_public` (boolean) - Default: true
- `status` (enum: draft, active, paused, completed, cancelled) - Default: draft
- `metadata` (object)

#### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Support Climate Action",
    ...
  },
  "metadata": {
    "created": true
  }
}
```

**Status Code:** 201 Created

#### Example

```bash
curl -X POST "https://api.example.com/api/civic-actions" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Support Climate Action",
    "action_type": "petition",
    "urgency_level": "high",
    "required_signatures": 1000,
    "is_public": true
  }'
```

---

### Get Single Civic Action

**GET** `/api/civic-actions/[id]`

Returns a single civic action by ID.

#### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Support Climate Action",
    ...
  }
}
```

**Status Code:** 200 OK

**Error Codes:**
- 404: Action not found
- 403: Feature disabled

#### Example

```bash
curl -X GET "https://api.example.com/api/civic-actions/123e4567-e89b-12d3-a456-426614174000"
```

---

### Update Civic Action

**PATCH** `/api/civic-actions/[id]`

Updates an existing civic action. Only the creator or an admin can update.

#### Request Body

All fields are optional:

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "urgency_level": "critical",
  "status": "active",
  "is_public": false
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  },
  "metadata": {
    "updated": true
  }
}
```

**Status Code:** 200 OK

**Error Codes:**
- 404: Action not found
- 403: Permission denied
- 401: Authentication required

#### Example

```bash
curl -X PATCH "https://api.example.com/api/civic-actions/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

---

### Delete Civic Action

**DELETE** `/api/civic-actions/[id]`

Deletes a civic action. Only the creator or an admin can delete.

#### Response

```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "metadata": {
    "deleted": true
  }
}
```

**Status Code:** 200 OK

**Error Codes:**
- 404: Action not found
- 403: Permission denied
- 401: Authentication required

#### Example

```bash
curl -X DELETE "https://api.example.com/api/civic-actions/123e4567-e89b-12d3-a456-426614174000"
```

---

### Sign Civic Action

**POST** `/api/civic-actions/[id]/sign`

Signs/endorses a civic action (typically a petition). Increments the signature count.

#### Response

```json
{
  "success": true,
  "data": {
    "signed": true,
    "signature_count": 151,
    "action": {
      "id": "uuid",
      "current_signatures": 151,
      ...
    }
  },
  "metadata": {
    "signed": true
  }
}
```

**Status Code:** 200 OK

**Error Codes:**
- 404: Action not found
- 400: Action not active, already signed, or expired
- 401: Authentication required

#### Example

```bash
curl -X POST "https://api.example.com/api/civic-actions/123e4567-e89b-12d3-a456-426614174000/sign"
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `FEATURE_DISABLED` - Feature flag is disabled
- `AUTHENTICATION_REQUIRED` - User must be authenticated
- `PERMISSION_DENIED` - User doesn't have permission
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limiting

All endpoints are rate limited:

- **List/Create:** 10 requests per 15 minutes per IP
- **Update/Delete:** 20 requests per 15 minutes per IP
- **Sign:** 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time

---

## Analytics Events

The following analytics events are automatically tracked:

- `civic_action_created` - When an action is created
- `civic_action_updated` - When an action is updated
- `civic_action_deleted` - When an action is deleted
- `civic_action_signed` - When an action is signed

Events are stored in the `analytics_events` table and are non-blocking (failures don't break the request).

---

## Data Models

### CivicAction

```typescript
type CivicAction = {
  id: string;
  title: string;
  description: string | null;
  action_type: 'petition' | 'campaign' | 'survey' | 'event' | 'protest' | 'meeting';
  category: string | null;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  current_signatures: number | null;
  required_signatures: number | null;
  is_public: boolean;
  target_representatives: number[] | null;
  target_state: string | null;
  target_district: string | null;
  target_office: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
};
```

---

## Best Practices

1. **Always check feature flag** before using endpoints
2. **Handle rate limiting** with exponential backoff
3. **Validate input** on client side before sending
4. **Handle errors gracefully** with user-friendly messages
5. **Track analytics** for user interactions
6. **Respect privacy** - only show public actions to unauthenticated users

---

## Examples

### Create and Sign a Petition

```typescript
// Create petition
const createResponse = await fetch('/api/civic-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Support Climate Action',
    action_type: 'petition',
    urgency_level: 'high',
    required_signatures: 1000,
    is_public: true,
  }),
});

const { data: action } = await createResponse.json();

// Sign the petition
await fetch(`/api/civic-actions/${action.id}/sign`, {
  method: 'POST',
});
```

### List Active Petitions

```typescript
const response = await fetch(
  '/api/civic-actions?status=active&action_type=petition&limit=20'
);
const { data: actions } = await response.json();
```

---

**Last Updated:** January 2025

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD


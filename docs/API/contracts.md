# API Contracts & Envelope Standards

_Last updated: 2025-11-16_

## Overview

This document defines the API contract standards for the Choices platform, including response envelope formats, error codes, and metadata conventions.

## Response Envelope Format

All API endpoints return standardized response envelopes:

```typescript
{
  success: boolean;
  data?: any;
  metadata?: {
    timestamp: string;
    cached?: boolean;
    // ... other metadata fields
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Health Check Endpoints

### GET /api/health

Consolidated health check endpoint supporting multiple check types.

**Query Parameters:**
- `type`: `basic` | `database` | `supabase` | `civics` | `all` (default: `basic`)

**Response Codes:**
- `200`: Health check passed (or warnings in CI/test environments)
- `500`: Health check failed (production only; CI/test returns 200 with status in payload)
- `503`: Service degraded

**Recent Changes (2025-11-16):**
- Updated civics health check to return HTTP 200 in CI/test environments while still reporting actual status in payload
- Added graceful handling for missing Supabase credentials in CI/test
- Database connection failures in CI/test are reported as warnings, not errors

### GET /api/site-messages

Retrieves active site messages for display.

**Recent Changes (2025-11-16):**
- Added graceful fallback for missing Supabase credentials in CI/test environments
- Returns empty messages array when Supabase is not configured (CI/test only)

## Admin API Endpoints

### GET /api/admin/site-messages

Retrieves site messages for admin management.

**Authentication:** Requires admin authentication via `requireAdminOr401()`

**Query Parameters:**
- `status`: `all` | `active` | `inactive` | `scheduled` (default: `all`)
- `priority`: `all` | `low` | `medium` | `high` | `critical` (default: `all`)
- `limit`: Number (default: 50, max: 200)

**Response:**
```typescript
{
  success: true,
  data: {
    messages: SiteMessage[],
    filters: {
      status: string,
      priority: string,
      limit: number
    },
    total: number,
    adminUser: {
      id: string,
      email: string
    }
  }
}
```

### POST /api/admin/site-messages

Creates a new site message.

**Authentication:** Requires admin authentication

**Request Body:**
```typescript
{
  title: string; // Required
  message: string; // Required
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'inactive' | 'scheduled';
  target_audience?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}
```

**Response:** Returns created site message with 201 status code

### PATCH /api/admin/site-messages/[id]

Updates an existing site message.

**Authentication:** Requires admin authentication

**Request Body:** Partial update of site message fields (all optional except those being updated)

**Response:** Returns updated site message

### DELETE /api/admin/site-messages/[id]

Deletes a site message.

**Authentication:** Requires admin authentication

**Response:** Returns deleted site message

**Recent Changes (2025-11-16):**
- Implemented full CRUD operations for site messages admin interface
- Replaced mock data with real API calls in SiteMessagesAdmin component
- Added edit form functionality for updating messages

## Error Codes

Standard error codes used across API endpoints:

- `VALIDATION_ERROR`: Request validation failed
- `AUTH_ERROR`: Authentication/authorization failure
- `RATE_LIMIT`: Rate limit exceeded
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Metadata Fields

Common metadata fields in API responses:

- `timestamp`: ISO 8601 timestamp of the response
- `cached`: Boolean indicating if response was served from cache
- `ttl`: Cache time-to-live in seconds
- `version`: API version identifier

## Contract Testing

All API contracts are verified via Jest contract tests in `web/tests/contracts/`. See `docs/archive/reference/testing/TESTING/api-contract-plan.md` for detailed coverage.

## Governance

When modifying API handlers:
1. Update this file to document contract changes
2. Update contract tests in `web/tests/contracts/`
3. Update either `docs/archive/reference/testing/TESTING/api-contract-plan.md` or `docs/archive/release-notes/CHANGELOG.md`


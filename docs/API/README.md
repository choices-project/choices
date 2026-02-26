# API Documentation

_Last updated: January 2026_

This directory contains API documentation for the Choices platform.

## Overview

The Choices API is a RESTful API built on Next.js API routes. All endpoints return standardized response envelopes and follow consistent error handling patterns.

## Quick Links

- **[API Response Guide](response-guide.md)** - successResponse, error handling, client patterns
- **[API Contracts](contracts.md)** - Response formats, error codes, and standards
- **[Civic Actions API](civic-actions.md)** - Civic engagement endpoints

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication. The platform supports:

- **Session-based auth** (Supabase Auth)
- **WebAuthn** (passwordless biometric)
- **Device Flow** (OAuth 2.0 device authorization)

**Authentication headers:**
- Cookies: Session cookies are automatically sent with requests
- Authorization: `Bearer <token>` (for API clients)

**Unauthenticated requests** return `401 Unauthorized` with error code `AUTH_ERROR`.

## Response Format

All API endpoints return standardized response envelopes:

```typescript
{
  success: boolean;
  data?: any;
  metadata?: {
    timestamp: string;
    cached?: boolean;
    // ... other metadata
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

See [API Contracts](contracts.md) for detailed response formats.

## Error Codes

Standard error codes:

- `VALIDATION_ERROR` - Request validation failed
- `AUTH_ERROR` - Authentication/authorization failure
- `RATE_LIMIT` - Rate limit exceeded
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are rate-limited using Upstash Redis. Rate limits vary by endpoint:

- **Public endpoints**: 100 requests/minute
- **Authenticated endpoints**: 1000 requests/minute
- **Admin endpoints**: 5000 requests/minute

Rate limit headers:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

Exceeding rate limits returns `429 Too Many Requests` with error code `RATE_LIMIT`.

## API Endpoints

### Core Endpoints

- `GET /api/health` - Health check
- `GET /api/dashboard` - User dashboard data
- `GET /api/feature-flags` - Feature flag status

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info
- `POST /api/auth/device-flow` - Device flow initiation
- `POST /api/auth/device-flow/verify` - Device flow verification

### Polls

- `GET /api/polls` - List polls
- `POST /api/polls` - Create poll
- `GET /api/polls/[id]` - Get poll
- `POST /api/polls/[id]/vote` - Vote on poll
- `GET /api/polls/[id]/results` - Get poll results
- `GET /api/polls/trending` - Trending polls

### Analytics

- `GET /api/analytics` - Analytics summary
- `GET /api/analytics/funnels` - Funnel analytics
- `GET /api/analytics/kpi` - KPI metrics
- `GET /api/analytics/poll/[id]` - Poll analytics
- `GET /api/analytics/user/[id]` - User analytics

### Admin

- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - User management
- `GET /api/admin/audit/candidates` - Candidate audit logs
- `GET /api/admin/audit/representatives` - Representative audit logs
- `POST /api/admin/audit/revert` - Revert audit changes

### PWA

- `POST /api/pwa/notifications/subscribe` - Subscribe to push notifications
- `POST /api/pwa/notifications/send` - Send notification
- `GET /api/pwa/status` - PWA status

### Civics

- `GET /api/v1/civics/address-lookup` - Address lookup
- `GET /api/v1/civics/representative` - Representative lookup
- `GET /api/v1/civics/elections` - Election data
- `POST /api/civic-actions` - Create civic action
- `GET /api/civic-actions/[id]` - Get civic action

For endpoint conventions and examples, see [API Contracts](contracts.md).

## Versioning

The API uses URL-based versioning:

- `/api/v1/` - Version 1 endpoints
- `/api/` - Current version (may change)

**Breaking changes** will increment the version number and maintain backward compatibility for at least one major version.

## Testing

API endpoints are tested via:

- **Contract tests**: `tests/contracts/` - Verify response formats
- **Integration tests**: `tests/integration/api/` - Test with Supabase mocks
- **E2E tests**: `tests/e2e/specs/` - Full end-to-end flows

See [`docs/TESTING.md`](../TESTING.md) for testing guidelines.

## Support

- **Documentation**: See [`docs/README.md`](../README.md)
- **Issues**: Create an issue on GitHub
- **Security**: See [`docs/SECURITY.md`](../SECURITY.md) for vulnerability reporting

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD


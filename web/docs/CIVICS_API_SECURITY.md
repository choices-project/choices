# Civics API Security Architecture

## Overview

The Civics API provides public access to representative data while maintaining robust security through a defense-in-depth approach. All civics data is publicly accessible, but multiple layers protect against abuse, spam, and DDoS attacks.

## Security Layers

### 1. Database Layer: Row Level Security (RLS)

**Policy**: `allow_anonymous_read_access` on `civics_representatives` table

```sql
CREATE POLICY allow_anonymous_read_access ON public.civics_representatives
  FOR SELECT
  USING (true);
```

**What it does**:
- Allows anonymous users to read all representative data
- Still protects writes, updates, and deletes (requires authentication)
- Enables public API access without service role key

**Migration**: `supabase/migrations/2025-12-04_001_add_civics_representatives_public_read.sql`

### 2. API Layer: Rate Limiting

All civics API routes use `apiRateLimiter` (Upstash Redis-backed) to prevent abuse.

**Rate Limits by Endpoint**:

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/api/v1/civics/by-state` | 200 requests | 15 minutes | High-traffic list endpoint |
| `/api/v1/civics/representative/[id]` | 100 requests | 15 minutes | Individual lookups |
| `/api/v1/civics/elections` | 100 requests | 15 minutes | Public election data |
| `/api/v1/civics/coverage-dashboard` | 30 requests | 5 minutes | Admin-like analytics |
| `/api/v1/civics/voter-registration` | 30 requests | 5 minutes | Admin-like resources |

**Implementation**:
- Uses Upstash Redis for distributed rate limiting
- Tracks requests per IP address
- Returns `429 Too Many Requests` with `Retry-After` header when limit exceeded
- Logs violations for security monitoring

### 3. Caching Layer: Redis

High-traffic routes use Redis caching to reduce database load.

**Cached Endpoints**:
- `/api/v1/civics/by-state` - 5 minute TTL
- `/api/v1/civics/representative/[id]` - 5 minute TTL

**Cache Key Format**:
- `civics:by-state:${state}:${level}:${limit}:${include.join(',')}`
- `civics:representative:${id}:${include.join(',')}`

**Benefits**:
- Reduces database queries by ~80-90% for popular requests
- Improves response times (cache hits return in <10ms)
- Handles traffic spikes gracefully
- Cache misses still work normally

### 4. HTTP Cache Headers

All endpoints include HTTP cache headers for browser/CDN caching:

```
Cache-Control: public, max-age=300, stale-while-revalidate=86400
ETag: "unique-identifier"
```

**What it does**:
- Browsers cache responses for 5 minutes
- CDNs can serve stale content for up to 24 hours while revalidating
- Reduces server load for repeated requests

### 5. Infrastructure Layer: Vercel Edge Protection

Vercel provides automatic DDoS protection at the edge:
- Geographic rate limiting
- Bot detection and mitigation
- Automatic scaling under load
- Edge caching

## Authentication

**All civics routes use anonymous access**:
- No authentication required
- Uses Supabase anon key (not service role)
- RLS policy allows anonymous reads

**Why anon key instead of service role?**
- Follows principle of least privilege
- RLS policies provide database-level security
- Service role bypasses all security checks (only needed for admin operations)

## API Endpoints

### GET /api/v1/civics/by-state

**Rate Limit**: 200 requests per 15 minutes per IP

**Caching**: ✅ Redis (5 min TTL)

**Query Parameters**:
- `state` (required): Two-letter state code or "US"
- `level` (optional): "federal", "state", "local", or "all"
- `limit` (optional): Number of results (default: 50)
- `include` (optional): Comma-separated list (fec, votes, contact, divisions)
- `fields` (optional): Comma-separated list of fields to return

**Example**:
```
GET /api/v1/civics/by-state?state=CA&level=federal&include=fec,votes
```

### GET /api/v1/civics/representative/[id]

**Rate Limit**: 100 requests per 15 minutes per IP

**Caching**: ✅ Redis (5 min TTL)

**Query Parameters**:
- `include` (optional): Comma-separated list (fec, votes, contact, divisions)
- `fields` (optional): Comma-separated list of fields to return

**Example**:
```
GET /api/v1/civics/representative/123?include=fec,votes
```

### GET /api/v1/civics/elections

**Rate Limit**: 100 requests per 15 minutes per IP

**Caching**: ❌ No Redis caching (less frequently accessed)

**Query Parameters**:
- `divisions` (optional): Comma-separated list of division IDs

### GET /api/v1/civics/coverage-dashboard

**Rate Limit**: 30 requests per 5 minutes per IP

**Caching**: ❌ No Redis caching (admin-like endpoint)

**Purpose**: Analytics endpoint showing data coverage by source and level

### GET /api/v1/civics/voter-registration

**Rate Limit**: 30 requests per 5 minutes per IP

**Caching**: ❌ No Redis caching (admin-like endpoint)

**Query Parameters**:
- `state` (required): Two-letter state code
- `division` (optional): Division ID (can extract state from division)

## Security Monitoring

**Rate Limit Violations**:
- Logged with IP address, endpoint, and timestamp
- Stored in Upstash for analysis
- Can be queried via `apiRateLimiter.getViolationsForIP(ip)`

**Cache Performance**:
- Cache hit/miss tracked via `X-Cache` header
- Logged for monitoring cache effectiveness

## Best Practices

1. **Always use anon key** for public read endpoints (not service role)
2. **Configure RLS policies** to allow anonymous reads when data should be public
3. **Set appropriate rate limits** based on endpoint usage patterns
4. **Cache expensive queries** to reduce database load
5. **Monitor rate limit violations** for security threats
6. **Use HTTP cache headers** for browser/CDN caching

## Migration History

- **2025-12-04**: Added RLS policy for anonymous reads
- **2025-12-04**: Switched from service role to anon key
- **2025-12-04**: Added rate limiting to all routes
- **2025-12-04**: Added Redis caching to high-traffic routes

## Related Documentation

- `SERVICE_ROLE_KEY_USAGE.md` - Service role key usage audit
- `supabase/migrations/2025-12-04_001_add_civics_representatives_public_read.sql` - RLS policy migration


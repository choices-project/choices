# Upstash Rate Limiting

**Last Updated:** January 29, 2025  
**Status:** ✅ Active and Production-Ready

This system uses a facade (`lib/rate-limiting/api-rate-limiter.ts`) backed by Upstash Redis (`lib/rate-limiting/upstash-rate-limiter.ts`). Routes should import only the facade.

## Environment Variables
- `UPSTASH_REDIS_REST_URL` (required)
- `UPSTASH_REDIS_REST_TOKEN` (required)
- `ADMIN_MONITORING_KEY` (optional, protects monitoring endpoints)
- `NEXT_PUBLIC_BASE_URL` (optional, used by Admin Monitoring SSR/server actions)

## Usage in Routes
```ts
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter'

const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1'
const userAgent = request.headers.get('user-agent') ?? undefined
const result = await apiRateLimiter.checkLimit(ip, '/api/my-endpoint', { maxRequests: 50, windowMs: 15 * 60 * 1000, userAgent })
if (!result.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
```

## Usage in Auth Middleware

The authentication middleware (`lib/core/auth/middleware.ts`) includes built-in rate limiting with different configurations for different auth operations:

```ts
import { createAuthMiddleware } from '@/lib/core/auth/middleware'

// Rate limit options:
// - 'auth': 10 requests per 15 minutes
// - 'registration': 5 requests per hour
// - 'deviceFlow': 3 requests per hour
// - 'biometric': 20 requests per 15 minutes

const middleware = createAuthMiddleware({
  rateLimit: 'auth', // or 'registration', 'deviceFlow', 'biometric'
  // ... other options
})
```

## Monitoring
- GET `/api/security/monitoring` → totals, last-hour, last-24h, top IPs, violations by endpoint, recent violations.
- POST `/api/security/monitoring/clear` `{ ip, endpoint }` → clears a specific key (requires header `x-admin-key: ADMIN_MONITORING_KEY`).
- Admin UI: `/admin/monitoring` displays metrics, trends, filters, and a clear action.

## Local/Failure Behavior
If Redis is unavailable, the limiter logs a warning and allows requests to prevent blocking development.

## Deprecation
`lib/core/security/rate-limit.ts` is deprecated and kept only for reference/tests. Migrate new code to the facade.
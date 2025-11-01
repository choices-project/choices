# Monitoring & Observability Setup Guide

**Created:** January 26, 2025  
**Status:** ✅ Production Ready

---

## Overview

The Choices platform now includes comprehensive monitoring and observability features:

1. **Sentry Error Tracking** - Real-time error monitoring and alerting
2. **Extended Health Checks** - Comprehensive system health monitoring
3. **Performance Monitoring** - API response times and system metrics
4. **Rate Limiting Monitoring** - Security violation tracking
5. **Admin Dashboard** - Unified monitoring interface

---

## Setup Instructions

### 1. Sentry Integration (Optional but Recommended)

#### Prerequisites
- Sentry account (sign up at https://sentry.io)
- Sentry project created

#### Environment Variables
Add to your `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

#### Installation
```bash
cd web
npm install @sentry/nextjs
```

#### Configuration Files Created
- `web/sentry.client.config.ts` - Browser/client-side configuration
- `web/sentry.server.config.ts` - Server-side configuration  
- `web/sentry.edge.config.ts` - Edge runtime configuration (middleware)

#### Features
- ✅ Automatic error tracking
- ✅ Performance monitoring (traces)
- ✅ Session replay (development)
- ✅ User context tracking
- ✅ Breadcrumb tracking

#### Usage in Code
```typescript
import { captureException, captureMessage, setUser } from '@/lib/monitoring/sentry';

// Capture an exception
try {
  // ... code ...
} catch (error) {
  captureException(error as Error, {
    tags: { component: 'api' },
    extra: { userId: user.id }
  });
}

// Capture a message
captureMessage('User performed action', 'info', {
  tags: { action: 'follow_representative' }
});

// Set user context
setUser({ id: user.id, email: user.email });
```

---

### 2. Extended Health Checks

#### Endpoint
`GET /api/health/extended`

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-26T...",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "rateLimiting": {
      "status": "healthy",
      "metrics": { ... }
    },
    "supabase": {
      "status": "healthy",
      "auth": { ... },
      "database": { ... }
    }
  },
  "system": {
    "nodeVersion": "v22.19.0",
    "platform": "linux",
    "memory": {
      "used": 128,
      "total": 512
    }
  }
}
```

#### Status Codes
- `200` - Healthy or Degraded (system operational but some checks failed)
- `503` - Unhealthy (critical checks failed)

---

### 3. Admin Monitoring Dashboard

#### Access
Navigate to `/admin/monitoring` (admin access required)

#### Features
- **Security Metrics** - Rate limit violations, top IPs
- **System Health** - Database, Supabase, memory usage
- **Violations Trend** - Time-based charts
- **Performance Metrics** - Response times, uptime
- **Recent Violations** - Detailed violation log

#### Filters
- Time range: 1h, 24h, 7d
- Endpoint filter: Filter by specific API endpoint

---

### 4. Logger Integration

The existing logger now automatically sends errors to Sentry (if configured):

```typescript
import { logger } from '@/lib/utils/logger';

// This will log to console AND Sentry (if configured)
logger.error('Something went wrong', error);
```

---

## Monitoring Best Practices

### 1. Error Tracking
- Always include context with errors
- Set user context for authenticated requests
- Use tags for filtering and grouping

### 2. Health Checks
- Monitor health endpoint regularly
- Set up alerts for unhealthy status
- Track response times over time

### 3. Performance Monitoring
- Monitor API response times
- Track database query performance
- Watch memory usage trends

### 4. Rate Limiting
- Review violation patterns regularly
- Identify and block abusive IPs
- Adjust rate limits based on patterns

---

## Alerting Recommendations

### Critical Alerts
- System unhealthy (503 from health check)
- Database connection failures
- High error rate (> 5% of requests)

### Warning Alerts
- System degraded (200 but some checks failed)
- High memory usage (> 80%)
- Elevated error rate (> 2% of requests)

### Info Alerts
- Rate limit violations (for pattern analysis)
- Performance degradation (> 1s response time)

---

## Integration with Existing Systems

### Rate Limiting Monitoring
The monitoring dashboard integrates with existing rate limiting:
- Uses `upstashRateLimiter.getMetrics()`
- Shows violations from `/api/security/monitoring`
- Allows clearing rate limits from dashboard

### Health Checks
The extended health check integrates with:
- Existing `/api/health` endpoint
- Database optimizer
- Supabase client

---

## Next Steps

1. **Set up Sentry** (if not already configured)
   - Create Sentry account
   - Add DSN to environment variables
   - Test error tracking

2. **Configure Alerts**
   - Set up health check monitoring
   - Configure Sentry alerts
   - Set up uptime monitoring

3. **Performance Baseline**
   - Monitor baseline performance
   - Set performance budgets
   - Track improvements

---

**Last Updated:** January 26, 2025


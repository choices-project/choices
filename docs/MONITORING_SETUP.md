# Production Monitoring Setup

**Last Updated:** January 29, 2025  
**Status:** ✅ Configured - Ready for Production

## Overview

The Choices application includes comprehensive monitoring for errors, performance, and system health. Monitoring is optional but highly recommended for production deployments.

## Components

### 1. Sentry Error Tracking

**Status:** ✅ Configured  
**Location:** `web/lib/monitoring/sentry.ts`  
**Purpose:** Error tracking, performance monitoring, and session replay

#### Setup

1. **Install Sentry (if not already installed):**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure Environment Variable:**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   ```

3. **Initialize Sentry:**
   - Client-side: `web/sentry.client.config.ts` (auto-initialized)
   - Server-side: `web/sentry.server.config.ts` (auto-initialized)
   - Instrumentation: `web/instrumentation.ts` (auto-initialized)

#### Features

- **Error Tracking**: Captures JavaScript errors, unhandled promise rejections
- **Performance Monitoring**: Tracks page load times, API response times
- **Session Replay**: Records user sessions for debugging (development only)
- **Source Maps**: Upload source maps for better error debugging
- **Release Tracking**: Tracks errors by application version

#### Configuration

- **Traces Sample Rate**: 10% in production, 100% in development
- **Session Replay**: Disabled in production, enabled in development
- **Error Filtering**: Filters out browser extension errors, network errors

#### Usage in Code

```typescript
import { captureException, captureMessage } from '@/lib/monitoring/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    tags: { feature: 'civics' },
    extra: { context: 'additional info' }
  });
}

// Log messages
captureMessage('Important event', 'info');
```

### 2. Health Check Endpoints

**Status:** ✅ Implemented  
**Purpose:** Monitor system health and component status

#### Endpoints

**Basic Health Check:**
- **Endpoint:** `GET /api/health`
- **Purpose:** Quick health status check
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-01-29T12:00:00Z",
    "environment": "production"
  }
  ```

**Extended Health Check:**
- **Endpoint:** `GET /api/health/extended`
- **Purpose:** Comprehensive health metrics
- **Response includes:**
  - Database connection status
  - Rate limiting system status
  - Supabase connection status
  - System metrics (memory, CPU)
  - Cache status

**Civics Health Check:**
- **Endpoint:** `GET /api/health/civics`
- **Purpose:** Civics module specific health check
- **Checks:**
  - Representative data availability
  - Data quality scores
  - Recent data updates

#### Usage

```bash
# Basic health check
curl https://api.example.com/api/health

# Extended health check
curl https://api.example.com/api/health/extended

# Civics health check
curl https://api.example.com/api/health/civics
```

### 3. Rate Limiting Monitoring

**Status:** ✅ Implemented  
**Location:** `web/app/api/security/monitoring`  
**Purpose:** Monitor rate limiting violations and usage patterns

#### Endpoints

**Get Rate Limit Statistics:**
- **Endpoint:** `GET /api/security/monitoring`
- **Response includes:**
  - Total requests tracked
  - Requests in last hour
  - Requests in last 24 hours
  - Top IPs by request count
  - Violations by endpoint
  - Recent violations

**Clear Rate Limit Key:**
- **Endpoint:** `POST /api/security/monitoring/clear`
- **Authentication:** Requires `x-admin-key` header
- **Purpose:** Clear rate limit for specific IP/endpoint combination

#### Admin UI

- **Location:** `/admin/monitoring`
- **Features:**
  - Real-time rate limit metrics
  - Violation trends
  - IP filtering
  - Key clearing functionality

### 4. Logging

**Status:** ✅ Implemented  
**Location:** `web/lib/utils/logger.ts`, `web/lib/utils/api-logger.ts`  
**Purpose:** Structured logging for debugging and monitoring

#### Features

- **Structured Logging**: JSON-formatted logs
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Context Tracking**: Request IDs, user IDs, feature tags
- **API Logging**: Specialized logger for API routes

#### Usage

```typescript
import { logger } from '@/lib/utils/logger';
import { createApiLogger } from '@/lib/utils/api-logger';

// General logging
logger.info('User action', { userId: '123', action: 'vote' });
logger.error('Error occurred', error);

// API logging
const apiLogger = createApiLogger('/api/civics/by-address', 'GET');
apiLogger.info('Request received', { address: '123 Main St' });
apiLogger.error('Database error', error);
```

## Production Configuration

### Required Environment Variables

```bash
# Sentry (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/project-id

# Application
NEXT_PUBLIC_APP_VERSION=1.0.0

# Admin Monitoring (Optional)
ADMIN_MONITORING_KEY=your-secure-key-here
```

### Recommended Setup

1. **Sentry Account Setup:**
   - Create Sentry account at https://sentry.io
   - Create new project
   - Copy DSN to environment variables
   - Configure alert rules for critical errors

2. **Health Check Monitoring:**
   - Set up external monitoring (UptimeRobot, Pingdom, etc.)
   - Monitor `/api/health` endpoint every 1-5 minutes
   - Alert on non-200 responses

3. **Rate Limit Monitoring:**
   - Monitor `/api/security/monitoring` endpoint
   - Set up alerts for unusual traffic patterns
   - Review violations regularly

4. **Log Aggregation:**
   - Set up log aggregation service (Datadog, LogRocket, etc.)
   - Forward application logs to aggregation service
   - Create dashboards for error rates, response times

## Monitoring Best Practices

### 1. Error Tracking
- ✅ Set up Sentry alerts for critical errors
- ✅ Configure error grouping and deduplication
- ✅ Set up release tracking
- ✅ Monitor error rate trends

### 2. Performance Monitoring
- ✅ Track API response times
- ✅ Monitor page load times
- ✅ Set up performance budgets
- ✅ Alert on performance degradation

### 3. System Health
- ✅ Monitor health check endpoints
- ✅ Track database connection pool usage
- ✅ Monitor rate limiting metrics
- ✅ Alert on system resource usage (memory, CPU)

### 4. Security Monitoring
- ✅ Monitor rate limit violations
- ✅ Track authentication failures
- ✅ Review suspicious IP activity
- ✅ Monitor for potential attacks

## Alerting Recommendations

### Critical Alerts (Immediate Response)
- Application down (health check fails)
- Database connection failures
- Error rate spike (>10 errors/minute)
- Memory usage >90%

### Warning Alerts (Investigate Soon)
- Error rate increase (>5 errors/minute)
- Response time degradation (>2x normal)
- Rate limit violations spike
- CPU usage >80%

### Info Alerts (Review Periodically)
- High traffic periods
- Successful deployments
- Performance improvements
- Configuration changes

## Dashboards

### Recommended Dashboards

1. **Error Dashboard:**
   - Error rate over time
   - Errors by type
   - Errors by endpoint
   - Top error messages

2. **Performance Dashboard:**
   - API response times
   - Page load times
   - Database query times
   - Cache hit rates

3. **System Health Dashboard:**
   - Health check status
   - System resource usage
   - Rate limiting metrics
   - Database connection pool

4. **Security Dashboard:**
   - Rate limit violations
   - Authentication failures
   - Suspicious IP activity
   - Failed requests

## Testing Monitoring

### Test Error Tracking

```typescript
// Test Sentry integration
import { captureException } from '@/lib/monitoring/sentry';

// Trigger test error
captureException(new Error('Test error'), {
  tags: { test: true }
});
```

### Test Health Checks

```bash
# Test basic health
curl http://localhost:3000/api/health

# Test extended health
curl http://localhost:3000/api/health/extended

# Test civics health
curl http://localhost:3000/api/health/civics
```

### Test Rate Limiting Monitoring

```bash
# Get rate limit stats
curl http://localhost:3000/api/security/monitoring

# Clear rate limit (requires admin key)
curl -X POST http://localhost:3000/api/security/monitoring/clear \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"ip": "127.0.0.1", "endpoint": "/api/civics/by-address"}'
```

## Troubleshooting

### Sentry Not Working

1. Check if Sentry is installed: `npm list @sentry/nextjs`
2. Verify DSN is set: `echo $NEXT_PUBLIC_SENTRY_DSN`
3. Check Sentry initialization in browser console
4. Verify source maps are uploaded (for production)

### Health Checks Failing

1. Check database connection
2. Verify Supabase credentials
3. Check rate limiting Redis connection
4. Review error logs for specific failures

### Rate Limiting Not Working

1. Verify Upstash Redis credentials
2. Check Redis connection in health check
3. Review rate limiter logs
4. Test with known IP address

## Support

For monitoring issues:
- Check `/docs/ENVIRONMENT_VARIABLES.md` for configuration
- Review Sentry documentation: https://docs.sentry.io
- Check health check endpoints for detailed status




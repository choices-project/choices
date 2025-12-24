# Rate Limit Production Verification Guide

**Last Updated:** December 2025  
**Status:** Production Ready  
**Purpose:** Verify rate limiting is working correctly in production environment

## Overview

The Choices platform uses Upstash Redis for production rate limiting with in-memory fallback. This guide provides a comprehensive checklist for verifying rate limits are functioning correctly in production.

## Architecture

### Rate Limiting Components

1. **Upstash Redis Backend** (`web/lib/rate-limiting/upstash-rate-limiter.ts`)
   - Production rate limiting storage
   - Distributed rate limiting across instances
   - Persistent rate limit tracking

2. **API Rate Limiter Facade** (`web/lib/rate-limiting/api-rate-limiter.ts`)
   - Unified interface for rate limiting
   - Automatic fallback to allow requests if Redis fails
   - Violation tracking and metrics

3. **Endpoint-Specific Limits** (`web/lib/core/auth/middleware.ts`)
   - Auth endpoints: 10 requests per 15 minutes
   - Registration: 5 requests per hour
   - Device flow: 3 requests per hour
   - Biometric: 20 requests per 15 minutes

4. **Middleware Rate Limiting** (`web/middleware.ts`)
   - Global rate limiting for all routes
   - IP-based tracking
   - Configurable per-endpoint limits

## Prerequisites

- Access to production environment
- Upstash Redis dashboard access
- Production API endpoints accessible
- Admin monitoring key (`ADMIN_MONITORING_KEY`)
- Tools: `curl`, `jq` (optional), or Postman

## Verification Checklist

### 1. Environment Configuration

- [ ] **Upstash Redis configured**
  - Verify `UPSTASH_REDIS_REST_URL` is set in production
  - Verify `UPSTASH_REDIS_REST_TOKEN` is set in production
  - Check Upstash dashboard shows active connection

- [ ] **Rate limit environment variables**
  ```bash
  # Check these are set (if custom limits are needed):
  # RATE_LIMIT_REQUESTS_PER_MINUTE=60
  # RATE_LIMIT_BURST_SIZE=10
  ```

- [ ] **Upstash Redis connectivity**
  - Test connection from production environment
  - Verify Redis commands execute successfully
  - Check for connection errors in logs

### 2. Basic Rate Limit Functionality

#### Test Auth Endpoint Rate Limiting

```bash
# Test authentication endpoint (10 requests per 15 minutes)
BASE_URL="https://www.choices-app.com"
ENDPOINT="/api/auth/login"

# Make 11 rapid requests (should allow 10, block 11th)
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST "$BASE_URL$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | head -5
  sleep 0.5
done
```

**Expected Results:**
- First 10 requests: Should return 401 (auth failed) or 200 (if valid)
- 11th request: Should return **429 Too Many Requests**
- Response should include `retryAfter` field

#### Test Registration Endpoint Rate Limiting

```bash
# Test registration endpoint (5 requests per hour)
ENDPOINT="/api/auth/register"

# Make 6 rapid requests
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST "$BASE_URL$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | head -5
  sleep 0.5
done
```

**Expected Results:**
- First 5 requests: Should process (may fail validation, but not rate limited)
- 6th request: Should return **429 Too Many Requests**

### 3. Rate Limit Response Headers

Verify rate limit headers are present:

```bash
curl -I -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

**Expected Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (if rate limited)

### 4. Upstash Redis Verification

#### Check Rate Limit Data in Redis

1. **Access Upstash Dashboard**
   - Go to [Upstash Console](https://console.upstash.com)
   - Select your Redis database
   - Open Redis CLI or use REST API

2. **Query Rate Limit Keys**
   ```bash
   # Rate limit keys follow pattern: ratelimit:{ip}:{endpoint}
   # Example: ratelimit:192.168.1.1:/api/auth/login
   
   # List all rate limit keys
   KEYS ratelimit:*
   
   # Get specific rate limit data
   GET ratelimit:192.168.1.1:/api/auth/login
   ```

3. **Verify Data Structure**
   - Keys should contain: count, resetTime, totalHits
   - Reset times should be in the future
   - Counts should increment with requests

#### Check Violation Tracking

```bash
# Rate limit violations are tracked separately
KEYS violation:*

# Get violation details
GET violation:192.168.1.1:/api/auth/login
```

### 5. Rate Limit Metrics

#### Access Rate Limit Metrics Endpoint

```bash
# Get rate limit metrics (requires admin key)
ADMIN_KEY="your-admin-monitoring-key"
curl -X GET "$BASE_URL/api/admin/rate-limits/metrics" \
  -H "x-admin-key: $ADMIN_KEY"
```

**Expected Response:**
```json
{
  "totalRequests": 1234,
  "rateLimitedRequests": 56,
  "violationsByEndpoint": {
    "/api/auth/login": 45,
    "/api/auth/register": 11
  },
  "topViolatingIPs": [
    {"ip": "192.168.1.1", "count": 10}
  ]
}
```

### 6. Edge Cases and Error Handling

#### Test Redis Failure Fallback

1. **Temporarily break Redis connection** (in test environment only!)
2. **Make requests to rate-limited endpoints**
3. **Verify:**
   - Requests are still allowed (fail-open behavior)
   - Error is logged: "Rate limiting check failed"
   - System continues to function

#### Test IP Address Handling

```bash
# Test with different IP addresses
# Rate limits should be per-IP

# Request 1: From IP A (should count toward IP A's limit)
curl -X POST "$BASE_URL/api/auth/login" \
  -H "X-Forwarded-For: 192.168.1.1" \
  -d '{"email":"test@example.com","password":"test"}'

# Request 2: From IP B (should have separate limit)
curl -X POST "$BASE_URL/api/auth/login" \
  -H "X-Forwarded-For: 192.168.1.2" \
  -d '{"email":"test@example.com","password":"test"}'
```

**Expected:**
- Each IP has independent rate limit counter
- Rate limiting one IP doesn't affect others

### 7. Monitoring and Alerting

#### Set Up Alerts

- [ ] **High violation rate alert**
  - Alert if >10% of requests are rate limited
  - Check every 5 minutes
  - Send to ops team

- [ ] **Redis connection failures**
  - Alert if Redis connection fails >3 times in 5 minutes
  - Critical priority
  - Immediate notification

- [ ] **Unusual violation patterns**
  - Alert if single IP has >50 violations in 1 hour
  - May indicate attack or misconfiguration

#### Dashboard Metrics

Monitor these metrics in your observability tool:

1. **Rate Limit Metrics:**
   - Total requests
   - Rate limited requests
   - Violations by endpoint
   - Top violating IPs
   - Average requests per IP

2. **Redis Metrics:**
   - Connection status
   - Command latency
   - Error rate
   - Memory usage

### 8. Production Load Testing

#### Load Test Rate Limits

```bash
# Use a tool like Apache Bench or wrk
# Test that rate limits hold under load

# Example with Apache Bench:
ab -n 1000 -c 10 -p login.json -T application/json \
  https://www.choices-app.com/api/auth/login

# Check results:
# - Should see 429 responses after rate limit exceeded
# - Should not see 500 errors (indicates Redis failure)
# - Response times should remain reasonable
```

### 9. Endpoint-Specific Verification

#### Critical Endpoints to Test

1. **Authentication** (`/api/auth/login`)
   - Limit: 10 requests per 15 minutes
   - Priority: High (security-critical)

2. **Registration** (`/api/auth/register`)
   - Limit: 5 requests per hour
   - Priority: High (prevents abuse)

3. **Password Reset** (`/api/auth/reset-password`)
   - Limit: 3 requests per hour
   - Priority: High (prevents enumeration)

4. **Candidate Verification** (`/api/candidates/verify/request`)
   - Limit: 5 requests per 15 minutes
   - Priority: Medium

5. **Admin Endpoints** (`/api/admin/*`)
   - Limit: 10 requests per minute
   - Priority: High (sensitive operations)

### 10. Log Verification

#### Check Application Logs

```bash
# Look for rate limit related logs
grep -i "rate limit" /var/log/app.log

# Expected log entries:
# - "Rate limit check: {ip, endpoint, allowed, remaining}"
# - "Rate limiting check failed: {error}" (if Redis fails)
# - "Rate limit violation: {ip, endpoint, count}"
```

#### Check Upstash Logs

- Review Upstash dashboard for:
  - Command execution logs
  - Error logs
  - Connection issues
  - Unusual patterns

## Troubleshooting

### Rate Limits Not Working

1. **Check Redis Connection**
   ```bash
   # Test Redis connection
   curl "$UPSTASH_REDIS_REST_URL/ping" \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```

2. **Check Environment Variables**
   - Verify `UPSTASH_REDIS_REST_URL` is set
   - Verify `UPSTASH_REDIS_REST_TOKEN` is set
   - Check for typos or missing values

3. **Check Application Logs**
   - Look for "Rate limiting check failed" errors
   - Check for Redis connection errors

### Too Many False Positives

1. **Review Rate Limit Thresholds**
   - May need to increase limits for legitimate traffic
   - Check if limits are too strict for normal usage

2. **Check IP Address Extraction**
   - Verify `X-Forwarded-For` header is correct
   - Check if proxy is affecting IP detection

3. **Review Violation Patterns**
   - Check if specific IPs are consistently violating
   - May indicate legitimate high-volume users

### Rate Limits Too Permissive

1. **Review Configuration**
   - Check if limits are appropriate for endpoint sensitivity
   - Consider reducing limits for sensitive endpoints

2. **Monitor Violation Rates**
   - If violation rate is very low, limits may be too high
   - Adjust based on actual usage patterns

## Production Verification Script

Create a simple script to automate verification:

```bash
#!/bin/bash
# verify-rate-limits.sh

BASE_URL="${BASE_URL:-https://www.choices-app.com}"
ENDPOINT="/api/auth/login"

echo "Testing rate limits on $BASE_URL$ENDPOINT"
echo "Making 11 requests (limit is 10 per 15 minutes)..."
echo ""

for i in {1..11}; do
  STATUS=$(curl -X POST "$BASE_URL$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -w "%{http_code}" \
    -o /dev/null \
    -s)
  
  if [ "$STATUS" = "429" ]; then
    echo "✓ Request $i: Rate limited (429) - Rate limiting is working!"
    break
  elif [ "$i" -eq 11 ]; then
    echo "✗ Request $i: Not rate limited - Rate limiting may not be working"
  else
    echo "  Request $i: Status $STATUS"
  fi
  
  sleep 0.5
done
```

## Success Criteria

Rate limiting is verified when:

- ✅ All rate-limited endpoints return 429 after threshold
- ✅ Rate limit headers are present in responses
- ✅ Upstash Redis contains rate limit data
- ✅ Violations are tracked and logged
- ✅ Redis failure fallback works (allows requests)
- ✅ Different IPs have independent limits
- ✅ Monitoring and alerting are configured
- ✅ No false positives for legitimate traffic
- ✅ Logs show rate limit activity

## Next Steps

After verification:

1. **Document actual limits** in production runbook
2. **Set up monitoring dashboards** for rate limit metrics
3. **Configure alerts** for violations and Redis failures
4. **Review and adjust limits** based on production traffic patterns
5. **Schedule regular verification** (monthly recommended)

## References

- Rate Limiting Implementation: `web/lib/rate-limiting/`
- Upstash Documentation: https://docs.upstash.com/redis
- Rate Limit Tests: `web/tests/unit/lib/core/security/rate-limit.test.ts`


# Rate Limiting Audit - Sensitive Endpoints

**Date:** November 30, 2025  
**Status:** In Progress

## Overview

This document audits rate limiting coverage across all sensitive API endpoints to ensure production security.

## Rate Limiting Implementation

The codebase uses two rate limiting systems:

1. **`apiRateLimiter`** (`web/lib/rate-limiting/api-rate-limiter.ts`) - Upstash-backed, used for most endpoints
2. **`createRateLimiter`** (`web/lib/core/security/rate-limit.ts`) - Enhanced rate limiter with reputation tracking
3. **Middleware rate limiting** (`web/middleware.ts`) - Global rate limiting for sensitive paths

## Endpoint Coverage

### ✅ Endpoints WITH Rate Limiting

| Endpoint | Method | Rate Limit | Implementation | Notes |
|----------|--------|------------|----------------|-------|
| `/api/auth/login` | POST | 10/15min | `apiRateLimiter.checkLimit` | ✅ Properly configured |
| `/api/candidates/verify/request` | POST | 5/15min | `createRateLimiter` | ✅ Properly configured |
| `/api/contact/messages` | POST | 10/min | `apiRateLimiter.checkLimit` | ✅ Properly configured |
| `/api/auth/*` (via middleware) | All | 10/15min | Middleware | ✅ Global auth rate limit |
| `/api/admin/*` (via middleware) | All | 20/15min | Middleware | ✅ Global admin rate limit |

### ⚠️ Endpoints MISSING Rate Limiting

| Endpoint | Method | Risk Level | Recommendation |
|----------|--------|------------|----------------|
| `/api/candidates/verify/confirm` | POST | **HIGH** | ✅ **COMPLETE** - Added rate limiting (10 attempts per 15 minutes) |
| `/api/admin/audit/revert` | POST | **CRITICAL** | ✅ **COMPLETE** - Added strict rate limiting (10 per minute) |
| `/api/admin/users` | PUT | **HIGH** | Add rate limiting (20 per 15 minutes) |
| `/api/admin/candidates/stats` | GET | **MEDIUM** | ✅ **COMPLETE** - Added rate limiting (30 per 5 minutes) |
| `/api/admin/audit/candidates` | GET | **MEDIUM** | ✅ **COMPLETE** - Added rate limiting (30 per 5 minutes) |
| `/api/admin/audit/representatives` | GET | **MEDIUM** | ✅ **COMPLETE** - Added rate limiting (30 per 5 minutes) |
| `/api/candidate/verify-fec` | POST | **HIGH** | Add rate limiting (5 per hour) |
| `/api/feedback` | POST | **MEDIUM** | ✅ **COMPLETE** - Added rate limiting (10 per 15 minutes) |
| `/api/v1/civics/address-lookup` | GET | **MEDIUM** | Verify rate limiting exists |

### 🔍 Endpoints Requiring Verification

| Endpoint | Method | Status | Action Needed |
|----------|--------|--------|---------------|
| `/api/auth/register` | POST | Unknown | Verify rate limiting |
| `/api/auth/device-flow` | POST | Unknown | Verify rate limiting |
| `/api/auth/device-flow/poll` | POST | Unknown | Verify rate limiting |
| `/api/auth/device-flow/verify` | POST | Unknown | Verify rate limiting |
| `/api/representatives/self/overrides` | POST/PATCH | Unknown | Verify rate limiting |

## Recommended Rate Limits

### Critical Operations (10 per minute)
- Admin audit revert
- Candidate verification confirm
- FEC verification

### High-Security Operations (10 per 15 minutes)
- Login attempts
- Registration attempts
- Candidate verification request
- Contact message creation

### Medium-Security Operations (30 per 5 minutes)
- Admin stats queries
- Admin audit list queries
- Feedback submission

### Low-Security Operations (100 per 15 minutes)
- Public data queries
- Health checks
- Non-sensitive GET requests

## Implementation Checklist

- [x] Add rate limiting to `/api/candidates/verify/confirm` ✅ **COMPLETE (November 2025)**
- [x] Add strict rate limiting to `/api/admin/audit/revert` ✅ **COMPLETE (November 2025)**
- [x] Add rate limiting to `/api/admin/candidates/stats` ✅ **COMPLETE (November 2025)**
- [x] Add rate limiting to `/api/feedback` ✅ **COMPLETE (November 2025)**
- [x] Add rate limiting to `/api/admin/audit/candidates` ✅ **COMPLETE (November 2025)**
- [x] Add rate limiting to `/api/admin/audit/representatives` ✅ **COMPLETE (November 2025)**
- [ ] Add rate limiting to `/api/admin/users` (PUT)
- [ ] Verify rate limiting on auth/register
- [ ] Verify rate limiting on device-flow endpoints
- [ ] Verify rate limiting on representative overrides
- [ ] Document rate limit policies in API documentation
- [ ] Add rate limit headers to responses (X-RateLimit-*)
- [ ] Test rate limiting under load

## Rate Limit Response Headers

When implementing rate limiting, include these headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

## Testing

Rate limiting should be tested:
1. ✅ Unit tests for rate limiter logic
2. ✅ Integration tests for endpoint rate limiting
3. ✅ Load tests to verify rate limits work under pressure
4. ✅ E2E tests to verify rate limit error messages

## Related Documentation

- `web/lib/rate-limiting/api-rate-limiter.ts` - Main rate limiter implementation
- `web/lib/core/security/rate-limit.ts` - Enhanced rate limiter
- `web/middleware.ts` - Global rate limiting middleware
- `web/lib/core/security/config.ts` - Security configuration


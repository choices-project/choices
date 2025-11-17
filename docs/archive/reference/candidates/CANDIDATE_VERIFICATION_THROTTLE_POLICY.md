# Candidate Verification Throttle Policy

> **Archived (Jan 2026):** See the canonical implementation in `web/app/api/candidates/verify/{request,confirm}/route.ts` and the `docs/FEATURE_STATUS.md#contact_information_system` entry for current limits/owners. This file is retained for historical reference only.

**Last Updated:** January 2025  
**Status:** Active  
**Related:** Section C.3 Candidate Verification Edge Cases [P0]

---

## Overview

The candidate verification system implements rate limiting and throttling to prevent abuse and ensure security. This document outlines the throttle policies for both code request and code confirmation endpoints.

---

## Code Request Endpoint (`POST /api/candidates/verify/request`)

### Throttle Policy

- **Interval:** 15 minutes
- **Max Requests:** 5 requests per interval
- **Max Burst:** 3 rapid requests allowed
- **Reset:** After 15 minutes from first request in interval

### Implementation

```typescript
const limiter = createRateLimiter({
  interval: 15 * 60 * 1000,      // 15 minutes
  uniqueTokenPerInterval: 5,      // 5 requests per 15 minutes
  maxBurst: 3                     // Allow 3 rapid requests
});
```

### Behavior

1. **Normal Usage:** Users can request up to 5 verification codes per 15-minute window
2. **Burst Protection:** Up to 3 rapid requests are allowed without throttling
3. **Rate Limit Exceeded:** After 5 requests, users must wait until the 15-minute window resets
4. **Per-IP Tracking:** Rate limits are tracked per IP address

### Error Response

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Too many requests. Please try later.",
  "fieldErrors": {
    "rate": "Too many requests. Please try later."
  }
}
```

---

## Code Confirmation Endpoint (`POST /api/candidates/verify/confirm`)

### Throttle Policy

- **Interval:** 15 minutes
- **Max Attempts:** 10 attempts per interval
- **Max Burst:** 5 rapid attempts allowed
- **Reset:** After 15 minutes from first attempt in interval

### Implementation

```typescript
const limiter = createRateLimiter({
  interval: 15 * 60 * 1000,      // 15 minutes
  uniqueTokenPerInterval: 10,     // 10 attempts per 15 minutes
  maxBurst: 5                     // Allow 5 rapid attempts
});
```

### Per-Code Attempt Limits

- **Max Failed Attempts per Code:** 5 attempts
- **After 5 Failed Attempts:** Code is locked, user must request a new code
- **Attempts Counter:** Tracks failed attempts per verification code

### Behavior

1. **Normal Usage:** Users can attempt up to 10 code verifications per 15-minute window
2. **Burst Protection:** Up to 5 rapid attempts are allowed without throttling
3. **Per-Code Locking:** After 5 failed attempts on a single code, that code is locked
4. **Rate Limit Exceeded:** After 10 total attempts, users must wait until the 15-minute window resets

### Error Responses

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Too many verification attempts. Please wait 15 minutes before trying again.",
  "fieldErrors": {
    "code": "Too many verification attempts. Please wait 15 minutes before trying again."
  }
}
```

**Code Locked (5 failed attempts):**
```json
{
  "success": false,
  "error": "Too many failed attempts. This code has been locked. Please request a new code.",
  "fieldErrors": {
    "code": "Too many failed attempts. This code has been locked. Please request a new code."
  },
  "locked": true,
  "attemptsRemaining": 0
}
```

**Invalid Code (with attempts remaining):**
```json
{
  "success": false,
  "error": "The code you entered is incorrect. Please check your email and try again. 3 attempts remaining before this code is locked.",
  "fieldErrors": {
    "code": "The code you entered is incorrect. Please check your email and try again. 3 attempts remaining before this code is locked."
  },
  "invalid": true,
  "attemptsRemaining": 3,
  "maxAttempts": 5,
  "failedAttempts": 2
}
```

---

## Code Expiration

### Expiration Policy

- **Code Validity:** 15 minutes from generation
- **Expiration Check:** Performed on every confirmation attempt
- **Expired Code Response:** Clear error message with expiration details

### Expiration Error Response

```json
{
  "success": false,
  "error": "This verification code expired 5 minutes ago. Verification codes expire after 15 minutes for security. Please request a new code.",
  "fieldErrors": {
    "code": "This verification code expired 5 minutes ago. Verification codes expire after 15 minutes for security. Please request a new code."
  },
  "expired": true,
  "expiresAt": "2025-01-21T10:00:00Z",
  "expiredMinutesAgo": 5,
  "canRequestNew": true
}
```

---

## Security Considerations

### Why These Limits?

1. **Prevent Brute Force:** Limits prevent automated code guessing attacks
2. **Prevent Abuse:** Limits prevent spam/abuse of verification system
3. **Resource Protection:** Limits protect email sending infrastructure
4. **User Experience:** Reasonable limits that don't impede legitimate use

### Best Practices

1. **Clear Error Messages:** Users receive clear guidance on what went wrong
2. **Retry Guidance:** Error messages indicate when users can retry
3. **Per-IP Tracking:** Prevents single user from bypassing limits
4. **Per-Code Locking:** Prevents brute force on individual codes

---

## Testing

### Test Coverage

Tests are located in:
- `web/tests/unit/api/candidates/verify-request.test.ts` - Rate limiting tests for request endpoint
- `web/tests/unit/api/candidates/verify-confirm.test.ts` - Expired code, wrong code, and edge case tests for confirm endpoint

**Test Status (January 2025):**
- ✅ Tests converted from Vitest to Jest
- ✅ Mock setup improved with shared query chain pattern for Supabase
- ✅ Response structure corrected (validation errors use `details` field)
- ✅ Error message assertions updated to use `data.details.rate` for rate limit errors

### Test Scenarios

1. ✅ Allow request when rate limit not exceeded
2. ✅ Reject request when rate limit exceeded
3. ✅ Enforce 5 requests per 15 minutes limit
4. ✅ Allow burst of 3 rapid requests
5. ✅ Provide rate limit information in error response
6. ✅ Track rate limit per IP address

---

## Monitoring

### Metrics to Track

- Rate limit violations per endpoint
- Average attempts per verification
- Code expiration rate
- Code lock rate (5 failed attempts)
- Time to verification completion

### Alerts

Consider setting up alerts for:
- Unusual spike in rate limit violations
- High code lock rate (may indicate UX issue)
- High expiration rate (may indicate email delivery issues)

---

## Future Enhancements

### Potential Improvements

1. **Adaptive Rate Limiting:** Adjust limits based on user behavior
2. **Progressive Delays:** Add delays after failed attempts
3. **IP Reputation:** Track and adjust limits based on IP reputation
4. **User Reputation:** Adjust limits for verified/trusted users

---

## Related Documentation

- `docs/ROADMAP.md` - Section C.3 Candidate Verification Edge Cases
- `web/app/api/candidates/verify/request/route.ts` - Request endpoint implementation
- `web/app/api/candidates/verify/confirm/route.ts` - Confirmation endpoint implementation

---

**Last Review:** January 2025  
**Next Review:** After production deployment or when limits need adjustment


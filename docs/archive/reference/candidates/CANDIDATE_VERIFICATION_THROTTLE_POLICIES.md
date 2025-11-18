# Candidate Verification Throttle Policies

> **Archived (Jan 2026):** The throttling rules below applied to the original verification MVP. Current behaviour is defined in `web/app/api/candidates/verify/{request,confirm}/route.ts` and documented at a high level in `docs/FEATURE_STATUS.md#contact_information_system`.

This document describes the rate limiting and throttling policies for the candidate verification system.

## Overview

The candidate verification system uses rate limiting to prevent abuse and ensure system stability. This document outlines the specific policies for each endpoint.

## Endpoints

### POST `/api/candidates/verify/request`

**Purpose:** Request a new verification code to be sent to the candidate's official email.

**Rate Limit Configuration:**
- **Interval:** 15 minutes (900,000 milliseconds)
- **Max Requests per Interval:** 5 requests
- **Max Burst:** 3 requests
- **Window:** Sliding window

**Behavior:**
- Users can request up to 5 verification codes within a 15-minute window
- The rate limiter uses a token bucket algorithm with burst allowance
- When the limit is exceeded, the endpoint returns a 400 status with error message: "Too many requests. Please try later."

**Rationale:**
- Prevents email spam and abuse
- Protects against brute-force enumeration attacks
- Ensures email service quotas are not exceeded
- Allows legitimate users to request new codes if needed (e.g., if code expires)

**Error Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "rate": "Too many requests. Please try later."
  }
}
```

### POST `/api/candidates/verify/confirm`

**Purpose:** Confirm a verification code to complete the verification process.

**Rate Limit Configuration:**
- **Interval:** 15 minutes (900,000 milliseconds)
- **Max Requests per Interval:** 10 attempts
- **Max Burst:** 5 rapid attempts
- **Per-Code Attempt Limit:** 5 attempts per verification code (separate from rate limit)
- **Lockout:** After 5 failed attempts, the code is locked and cannot be used

**Behavior:**
- Users can make up to 10 verification attempts within a 15-minute window (rate limit)
- This is in addition to the per-code attempt limit (5 attempts per code)
- Rate limiting prevents brute-force attacks across multiple codes
- Per-code limit prevents abuse of a single code
- Each verification code allows up to 5 incorrect attempts
- Failed attempts are tracked in the `failed_attempts` column
- After 5 failed attempts, the code is permanently locked
- Users must request a new code if they exceed the attempt limit

**Error Responses:**

1. **Expired Code:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "code": "This verification code expired X minutes ago. Please request a new code.",
    "expired": true,
    "expiresAt": "2025-01-20T12:00:00Z"
  }
}
```

2. **Already Used:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "code": "This verification code has already been used. Please request a new code.",
    "alreadyUsed": true
  }
}
```

3. **Code Locked (Max Attempts):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "code": "Too many failed attempts. This code has been locked. Please request a new code.",
    "locked": true,
    "attemptsRemaining": 0
  }
}
```

4. **Invalid Code (with attempts remaining):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "code": "Invalid code. 2 attempts remaining.",
    "invalid": true,
    "attemptsRemaining": 2
  }
}
```

5. **Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "code": "Too many verification attempts. Please wait 15 minutes before trying again."
  }
}
```

## Code Expiration

- **Expiration Time:** 15 minutes from creation
- **Expiration Check:** Performed before code validation
- **Expired Code Behavior:** Code cannot be used; user must request a new code

## Security Considerations

1. **Rate Limiting:** Prevents abuse and protects email service quotas
2. **Attempt Limits:** Prevents brute-force attacks on verification codes
3. **Code Expiration:** Limits the window of opportunity for code interception
4. **One-Time Use:** Codes are marked as used after successful verification
5. **User Isolation:** Rate limits are per-user (based on authenticated user ID)

## Implementation Details

### Rate Limiter

Both endpoints use the `createRateLimiter` function from `@/lib/core/security/rate-limit`:

**Request Endpoint:**
```typescript
const limiter = createRateLimiter({
  interval: 15 * 60 * 1000,  // 15 minutes
  uniqueTokenPerInterval: 5,  // 5 requests per interval
  maxBurst: 3                 // 3 burst requests
});
```

**Confirm Endpoint:**
```typescript
const limiter = createRateLimiter({
  interval: 15 * 60 * 1000,  // 15 minutes
  uniqueTokenPerInterval: 10, // 10 attempts per interval
  maxBurst: 5                 // 5 rapid attempts
});
```

### Failed Attempts Tracking

The confirm endpoint tracks failed attempts in the database:

- Column: `failed_attempts` (integer, default 0)
- Incremented on each incorrect code submission
- Maximum: 5 attempts per code
- Reset: Only when a new code is requested

## Testing

Comprehensive tests are available in:
- `web/tests/unit/api/candidates/verify/request.test.ts` - Rate limiting tests
- `web/tests/unit/api/candidates/verify/confirm.test.ts` - Edge case tests

## Monitoring

Consider monitoring:
- Rate limit violations (429/400 responses)
- Failed verification attempts
- Code expiration rates
- Average attempts per successful verification

## Future Improvements

Potential enhancements:
1. Adaptive rate limiting based on user reputation
2. IP-based rate limiting in addition to user-based
3. Exponential backoff for repeated failures
4. Admin override for legitimate cases
5. Analytics dashboard for verification metrics


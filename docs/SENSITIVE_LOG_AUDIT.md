# Sensitive Log Audit - PII Leakage Prevention

**Date:** November 30, 2025  
**Status:** In Progress

## Overview

This document audits logging statements across the codebase to ensure sensitive data (passwords, tokens, PII) is never logged.

## Security Policy

**NEVER log:**
- Passwords (plaintext or hashed)
- Authentication tokens (JWT, session tokens, API keys)
- Full email addresses (use partial: `user@***`)
- Credit card numbers
- Social Security Numbers
- Full IP addresses (anonymize: `192.168.1.0`)
- User agents (unless explicitly needed for security)
- Form data containing sensitive fields

**SAFE to log:**
- User IDs (UUIDs)
- Timestamps
- Error types (not full error messages with sensitive data)
- Operation types
- Anonymized identifiers

## Audit Results

### ⚠️ Potential Issues Found

| File | Line | Issue | Risk | Recommendation |
|------|------|-------|------|----------------|
| `web/app/actions/login.ts` | 22 | ✅ **FIXED** - FormData now sanitized before logging | ✅ **RESOLVED** | Password field now masked in logs |
| `web/lib/database/query-optimizer.ts` | 572-573 | Query sanitization exists but may miss edge cases | **LOW** | Verify sanitization is comprehensive |

### ✅ Good Practices Found

| File | Practice | Status |
|------|----------|--------|
| `web/lib/database/query-optimizer.ts` | `sanitizeQuery()` method removes passwords/tokens | ✅ Good |
| `web/features/auth/lib/webauthn/error-handling.ts` | Credential IDs truncated in logs | ✅ Good |
| `web/lib/core/security/config.ts` | `anonymizeIP()` function exists | ✅ Good |
| `scripts/precommit.sh` | Pre-commit hooks detect secrets | ✅ Good |

## Critical Fixes Needed

### 1. Login Action - FormData Logging

**File:** `web/app/actions/login.ts`

**Issue:** Line 22 logs all FormData entries, which may include password field.

**Fix:**
```typescript
// BEFORE (INSECURE):
logger.debug('FormData entries', Object.fromEntries(formData.entries()));

// AFTER (SECURE):
const formEntries = Object.fromEntries(formData.entries());
const sanitized = { ...formEntries };
if ('password' in sanitized) {
  sanitized.password = '***';
}
logger.debug('FormData entries (sanitized)', sanitized);
```

## Log Sanitization Utilities

### Existing Utilities

1. **`anonymizeIP()`** - `web/lib/core/security/config.ts`
   - Anonymizes IP addresses for privacy

2. **`sanitizeQuery()`** - `web/lib/database/query-optimizer.ts`
   - Removes passwords and tokens from SQL queries

### Implemented Utilities ✅

Created `web/lib/utils/log-sanitizer.ts` with the following functions:

- ✅ `sanitizeForLogging()` - Sanitizes objects, arrays, and nested structures
- ✅ `sanitizeFormData()` - Sanitizes FormData entries
- ✅ `sanitizeQueryParams()` - Sanitizes URL query parameters
- ✅ `isSensitiveKey()` - Checks if a key indicates sensitive data
- ✅ `maskSensitive()` - Masks any value
- ✅ `maskEmail()` - Partially masks email addresses

**Files:**
- `web/lib/utils/log-sanitizer.ts` - Utility module
- `web/app/actions/login.ts` - Updated to use sanitization
- `web/app/actions/register.ts` - Updated to use sanitization
- `web/app/actions/complete-onboarding.ts` - Updated to use sanitization

## Implementation Checklist

- [x] Fix FormData logging in `web/app/actions/login.ts` ✅ **COMPLETE (November 2025)**
- [x] Create `log-sanitizer.ts` utility module ✅ **COMPLETE (November 2025)**
- [x] Update login action to use sanitization utility ✅ **COMPLETE (November 2025)**
- [x] Update register action to use sanitization utility ✅ **COMPLETE (November 2025)**
- [x] Update complete-onboarding action to use sanitization utility ✅ **COMPLETE (November 2025)**
- [ ] Audit all `logger.debug()` calls for sensitive data
- [ ] Audit all `logger.info()` calls for sensitive data
- [ ] Audit all `console.log()` calls (should use logger instead)
- [ ] Add ESLint rule to prevent logging sensitive patterns
- [ ] Add pre-commit hook to detect sensitive data in logs
- [ ] Document logging best practices
- [ ] Add unit tests for log sanitization

## ESLint Rule

Add to `eslint.config.js`:

```javascript
{
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-secrets-in-logs': ['error', {
      patterns: [
        /password\s*[:=]/i,
        /token\s*[:=]/i,
        /secret\s*[:=]/i,
        /api[_-]?key\s*[:=]/i,
      ],
    }],
  },
}
```

## Testing

Test log sanitization:
1. Unit tests for sanitization functions
2. Integration tests to verify sensitive data not logged
3. Manual review of log outputs
4. Security scanning of log files

## Related Documentation

- `web/lib/utils/logger.ts` - Logger implementation
- `web/lib/core/security/config.ts` - Security configuration including `anonymizeIP()`
- `scripts/precommit.sh` - Pre-commit secret detection


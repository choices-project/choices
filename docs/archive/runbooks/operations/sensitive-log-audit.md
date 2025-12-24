# Sensitive Log Audit Guide

**Last Updated:** December 2025  
**Status:** P0 Production Readiness  
**Purpose:** Audit logging for sensitive data exposure and implement redaction

## Overview

This guide provides a systematic approach to auditing all logging statements for sensitive data exposure, identifying risks, and implementing proper redaction.

## Sensitive Data Types

### Critical (Must Never Log)

- **Passwords** - Even hashed passwords should not be logged
- **API Keys** - All API keys and tokens
- **Auth Tokens** - JWT tokens, session tokens, refresh tokens
- **Secrets** - Any secret values (database passwords, encryption keys)
- **Credit Card Numbers** - Full or partial card numbers
- **Social Security Numbers** - SSN or similar identifiers
- **Bank Account Numbers** - Account or routing numbers

### High Risk (Should Not Log)

- **Email Addresses** - In some contexts (user enumeration)
- **IP Addresses** - In some contexts (privacy concerns)
- **Full Request/Response Bodies** - May contain sensitive data
- **Stack Traces** - May contain sensitive data in variables
- **Database Connection Strings** - May contain credentials
- **File Paths** - May reveal system structure

### Medium Risk (Log with Caution)

- **User IDs** - Generally safe, but consider context
- **Timestamps** - Generally safe
- **Error Messages** - May contain sensitive data
- **Request Headers** - May contain tokens

## Audit Methodology

### 1. Find All Logging Statements

```bash
# Find all logger usage
grep -r "logger\." web/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Find console.log usage (should be minimal)
grep -r "console\." web/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Find error logging
grep -r "logger\.error\|logger\.warn" web/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

### 2. Review Each Logging Statement

For each logging statement, check:

- [ ] Does it log sensitive data?
- [ ] Is sensitive data redacted?
- [ ] Are error messages safe?
- [ ] Are stack traces sanitized?

## Common Patterns to Check

### ❌ BAD - Exposes Sensitive Data

```typescript
// ❌ BAD - Logs password
logger.error('Login failed', { email, password });

// ❌ BAD - Logs token
logger.debug('Request', { headers: request.headers });

// ❌ BAD - Logs full request body
logger.info('API call', { body: request.body });

// ❌ BAD - Logs API key
logger.error('API error', { apiKey: process.env.API_KEY });

// ❌ BAD - Logs email in error context
logger.error('User not found', { email: userEmail });
```

### ✅ GOOD - Redacts Sensitive Data

```typescript
// ✅ GOOD - Redacts password
logger.error('Login failed', { email, password: '[REDACTED]' });

// ✅ GOOD - Redacts authorization header
logger.debug('Request', { 
  headers: { 
    ...request.headers, 
    authorization: '[REDACTED]' 
  } 
});

// ✅ GOOD - Logs only safe fields
logger.info('API call', { 
  method: request.method,
  url: request.url,
  // body: '[REDACTED]' // Don't log body
});

// ✅ GOOD - Never logs secrets
logger.error('API error', { 
  // apiKey: '[REDACTED]' // Don't log at all
  error: error.message 
});

// ✅ GOOD - Logs user ID instead of email
logger.error('User not found', { userId: user.id });
```

## Redaction Utilities

### Create Redaction Helper

```typescript
// web/lib/utils/log-redaction.ts

export function redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data };
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'secret',
    'ssn',
    'creditCard',
    'credit_card',
    'cardNumber',
    'card_number',
  ];
  
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = '[REDACTED]';
    }
  }
  
  return redacted;
}

export function redactHeaders(headers: Headers): Record<string, string> {
  const redacted: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  for (const [key, value] of headers.entries()) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}
```

### Usage

```typescript
import { redactSensitive, redactHeaders } from '@/lib/utils/log-redaction';

// Redact sensitive fields
logger.error('Login failed', redactSensitive({ email, password }));

// Redact headers
logger.debug('Request', { 
  headers: redactHeaders(request.headers) 
});
```

## Error Message Safety

### ❌ BAD - Exposes Sensitive Data in Errors

```typescript
// ❌ BAD - Error message contains sensitive data
throw new Error(`Database connection failed: ${connectionString}`);

// ❌ BAD - Stack trace may contain sensitive data
logger.error('Error', error); // May log full stack with variables
```

### ✅ GOOD - Safe Error Messages

```typescript
// ✅ GOOD - Generic error message
throw new Error('Database connection failed');

// ✅ GOOD - Redact stack trace
logger.error('Error', { 
  message: error.message,
  // stack: '[REDACTED]' // Don't log full stack in production
});
```

## Stack Trace Handling

### Safe Stack Trace Logging

```typescript
// Only log stack traces in development
if (process.env.NODE_ENV === 'development') {
  logger.error('Error', { error, stack: error.stack });
} else {
  logger.error('Error', { 
    message: error.message,
    // Don't log stack in production
  });
}
```

## Third-Party Logging Services

### Sentry Configuration

If using Sentry, configure data scrubbing:

```typescript
// web/lib/utils/sentry-config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  beforeSend(event) {
    // Remove sensitive data from event
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      if (event.request.data) {
        // Redact sensitive fields
        event.request.data = redactSensitive(event.request.data);
      }
    }
    return event;
  },
});
```

## Audit Checklist

### Authentication Logs
- [ ] No passwords logged
- [ ] No tokens logged
- [ ] No API keys logged
- [ ] Email addresses handled appropriately

### Request/Response Logs
- [ ] Authorization headers redacted
- [ ] Cookie headers redacted
- [ ] Request bodies not logged (or redacted)
- [ ] Response bodies not logged (or redacted)

### Error Logs
- [ ] Error messages don't expose sensitive data
- [ ] Stack traces sanitized in production
- [ ] Database connection strings not logged
- [ ] File paths don't reveal system structure

### Debug Logs
- [ ] Debug logs disabled in production
- [ ] No sensitive data in debug logs
- [ ] Debug logs use appropriate log levels

## Implementation Steps

1. **Audit Phase**
   - [ ] Find all logging statements
   - [ ] Review each for sensitive data
   - [ ] Document findings

2. **Redaction Phase**
   - [ ] Create redaction utilities
   - [ ] Update logging statements
   - [ ] Add redaction to error handlers

3. **Testing Phase**
   - [ ] Test redaction works correctly
   - [ ] Verify no sensitive data in logs
   - [ ] Test error handling

4. **Documentation Phase**
   - [ ] Document logging standards
   - [ ] Create logging guidelines
   - [ ] Add linting rules

## Logging Standards

### Do Log
- ✅ User actions (without sensitive data)
- ✅ System events
- ✅ Performance metrics
- ✅ Error messages (sanitized)
- ✅ Request metadata (redacted)

### Don't Log
- ❌ Passwords
- ❌ Tokens/API keys
- ❌ Full request/response bodies
- ❌ Stack traces in production
- ❌ Database connection strings
- ❌ Secrets

## Linting Rules

### ESLint Rule to Prevent Sensitive Logging

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-console': 'warn',
    'no-sensitive-data-logging': ['error', {
      sensitivePatterns: [
        /password/i,
        /token/i,
        /api[_-]?key/i,
        /authorization/i,
        /secret/i,
      ],
    }],
  },
};
```

## Success Criteria

Sensitive log audit is complete when:

- ✅ All logging statements audited
- ✅ Sensitive data redacted
- ✅ Error messages safe
- ✅ Stack traces sanitized
- ✅ Logging standards documented
- ✅ Linting rules in place
- ✅ No sensitive data in production logs

## References

- Logger Utility: `web/lib/utils/logger.ts`
- Error Handling: `web/lib/api/response-utils.ts`


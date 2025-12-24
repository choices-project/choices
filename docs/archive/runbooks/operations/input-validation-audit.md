# Input Validation Audit Guide

**Last Updated:** December 2025  
**Status:** P0 Production Readiness  
**Purpose:** Comprehensive audit of all API endpoints for input validation coverage

## Overview

This guide provides a systematic approach to auditing all API endpoints for proper input validation, identifying gaps, and ensuring security best practices.

## Audit Methodology

### 1. Create API Endpoint Inventory

List all API routes in the application:

```bash
# Find all API route files
find web/app/api -name "route.ts" -o -name "route.tsx" | sort
```

### 2. For Each Endpoint, Verify:

#### Required Field Validation
- [ ] All required fields are checked
- [ ] Missing fields return clear error messages
- [ ] Error messages don't expose sensitive information

#### Type Validation
- [ ] String fields validated as strings
- [ ] Number fields validated as numbers
- [ ] Boolean fields validated as booleans
- [ ] Array fields validated as arrays
- [ ] Object fields validated as objects
- [ ] Null/undefined handling

#### Format Validation
- [ ] Email addresses validated
- [ ] URLs validated
- [ ] UUIDs validated
- [ ] Dates validated
- [ ] Phone numbers validated (if applicable)

#### Length Validation
- [ ] Minimum length enforced
- [ ] Maximum length enforced
- [ ] Prevents buffer overflow attacks

#### Enum Validation
- [ ] Enum values validated against allowed list
- [ ] Invalid enum values rejected

#### Security Validation
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (for state-changing operations)
- [ ] Path traversal prevention
- [ ] Command injection prevention

## Priority Endpoints

### Critical (P0) - Audit First

#### Authentication Endpoints
- [ ] `/api/auth/login` - Email, password validation
- [ ] `/api/auth/register` - Email, password, username validation
- [ ] `/api/auth/reset-password` - Email validation, token validation
- [ ] `/api/auth/verify-email` - Token validation

#### User Input Endpoints
- [ ] `/api/feedback` - Type, title, description, sentiment validation
- [ ] `/api/contact/messages` - Representative ID, subject, content validation
- [ ] `/api/contact/threads` - Representative ID, subject validation
- [ ] `/api/profile` - Profile data validation

#### Admin Endpoints
- [ ] `/api/admin/users` - User ID, updates validation
- [ ] `/api/admin/audit/candidates` - Query parameters validation
- [ ] `/api/admin/audit/representatives` - Query parameters validation
- [ ] `/api/admin/feedback/*` - Status, ID validation

### High Priority (P1)

#### Civics Endpoints
- [ ] `/api/v1/civics/address-lookup` - Address validation
- [ ] `/api/v1/civics/by-state` - State code validation
- [ ] `/api/v1/civics/by-district` - District validation

#### Poll Endpoints
- [ ] `/api/polls` - Poll data validation
- [ ] `/api/polls/[id]` - ID validation
- [ ] `/api/polls/[id]/vote` - Vote data validation

#### Candidate Endpoints
- [ ] `/api/candidates/verify/request` - Email validation
- [ ] `/api/candidates/verify/confirm` - Code validation

## Validation Patterns

### Good Validation Examples

```typescript
// ✅ GOOD - Comprehensive validation
export const POST = withErrorHandling(async (request: NextRequest) => {
  const parsedBody = await parseBody<RequestBody>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }
  
  const { email, password, username } = parsedBody.data;
  
  // Required field validation
  const missingFields: Record<string, string> = {};
  if (!email) missingFields.email = 'Email is required';
  if (!password) missingFields.password = 'Password is required';
  if (!username) missingFields.username = 'Username is required';
  if (Object.keys(missingFields).length > 0) {
    return validationError(missingFields);
  }
  
  // Format validation
  if (!isValidEmail(email)) {
    return validationError({ email: 'Invalid email format' });
  }
  
  // Length validation
  if (password.length < 8) {
    return validationError({ password: 'Password must be at least 8 characters' });
  }
  if (username.length > 50) {
    return validationError({ username: 'Username must be less than 50 characters' });
  }
  
  // Type validation (handled by parseBody and TypeScript)
  // ...
});
```

### Bad Validation Examples

```typescript
// ❌ BAD - No validation
export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { email, password } = body;
  // No validation - dangerous!
  // ...
};

// ❌ BAD - Incomplete validation
export const POST = async (request: NextRequest) => {
  const body = await request.json();
  if (!body.email) {
    return new Response('Email required', { status: 400 });
  }
  // Missing password validation, format validation, etc.
  // ...
};
```

## Common Validation Libraries

### Using Zod (Recommended)

```typescript
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(50),
});

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const result = requestSchema.safeParse(body);
  
  if (!result.success) {
    return validationError(
      result.error.flatten().fieldErrors,
      'Validation failed'
    );
  }
  
  const { email, password, username } = result.data;
  // ...
};
```

### Using Custom Validators

The codebase has custom validators in `web/lib/validation/`:
- `validateRepresentativeId()`
- `sanitizeSubject()`
- `sanitizeMessageContent()`
- `validatePriority()`
- `validateMessageType()`

## SQL Injection Prevention

### ✅ GOOD - Parameterized Queries

```typescript
// Using Supabase (automatically parameterized)
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId); // Safe - parameterized

// Using raw SQL (if needed)
const { data } = await supabase.rpc('get_user', { user_id: userId });
```

### ❌ BAD - String Concatenation

```typescript
// NEVER do this!
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

## XSS Prevention

### ✅ GOOD - Sanitization

```typescript
import { sanitizeMessageContent } from '@/lib/validation';

const validation = sanitizeMessageContent(content);
if (!validation.isValid) {
  return validationError({ content: validation.error });
}
const sanitizedContent = validation.sanitized;
```

## CSRF Protection

### ✅ GOOD - CSRF Validation

```typescript
import { validateCsrfProtection, createCsrfErrorResponse } from '../_shared';

export const POST = async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }
  // ...
};
```

## Audit Checklist Template

For each endpoint, create a checklist:

```markdown
## `/api/example/route.ts`

### Required Fields
- [ ] Field 1 validated
- [ ] Field 2 validated

### Type Validation
- [ ] String fields
- [ ] Number fields
- [ ] Boolean fields

### Format Validation
- [ ] Email format
- [ ] URL format
- [ ] Date format

### Length Validation
- [ ] Min length
- [ ] Max length

### Security
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection (if state-changing)

### Status
- [ ] Validation complete
- [ ] Tests added
- [ ] Documentation updated
```

## Testing Validation

### Unit Tests

```typescript
describe('POST /api/example', () => {
  it('rejects missing required fields', async () => {
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    }));
    expect(response.status).toBe(400);
  });
  
  it('rejects invalid email format', async () => {
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
    }));
    expect(response.status).toBe(400);
  });
  
  // Add more test cases...
});
```

## Reporting

### Audit Report Template

```markdown
# Input Validation Audit Report

**Date:** YYYY-MM-DD
**Auditor:** [Name]

## Summary
- Total endpoints audited: X
- Endpoints with complete validation: Y
- Endpoints needing validation: Z

## Findings

### Critical Issues
1. [Endpoint] - Missing [validation type]
2. [Endpoint] - Missing [validation type]

### High Priority Issues
1. [Endpoint] - Missing [validation type]

### Medium Priority Issues
1. [Endpoint] - Missing [validation type]

## Recommendations
1. Add validation to [endpoint]
2. Create shared validation utilities
3. Add validation tests

## Next Steps
1. Fix critical issues
2. Fix high priority issues
3. Schedule follow-up audit
```

## Success Criteria

Input validation audit is complete when:

- ✅ All API endpoints audited
- ✅ All critical endpoints have complete validation
- ✅ Validation tests added
- ✅ Documentation updated
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ CSRF protection in place for state-changing operations

## References

- Validation Utilities: `web/lib/validation/`
- API Response Helpers: `web/lib/api/response-utils.ts`
- Parse Body Helper: `web/lib/api/parse-body.ts`


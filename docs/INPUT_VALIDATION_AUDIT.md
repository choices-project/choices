# Input Validation Audit - API Routes

**Date:** November 30, 2025  
**Status:** In Progress

## Overview

This document audits input validation coverage across all API routes to ensure proper security and data integrity.

## Validation Patterns

The codebase uses multiple validation approaches:

1. **Zod Schemas** - Preferred for type-safe validation
2. **`parseBody` helper** - Wraps Zod validation with error handling
3. **`validateFormData` helper** - For form data validation
4. **Manual validation** - Custom validation functions (should migrate to Zod)

## Validation Coverage

### ✅ Routes WITH Proper Validation

| Route | Method | Validation Method | Status |
|-------|--------|-------------------|--------|
| `/api/profile` | PUT | Zod schema (`profileSchema`) | ✅ Good |
| `/api/notifications` | POST | Zod schema (`NotificationSchema`) | ✅ Good |
| `/api/contact/messages` | POST | Custom validators + sanitization | ✅ Good |
| `/api/contact/threads` | POST | Custom validators + sanitization | ✅ Good |
| `/api/feedback` | POST | `parseBody` + custom validation | ✅ Good |
| `/api/auth/login` | POST | `parseBody` + manual validation | ✅ Good |
| `/api/auth/register` | POST | `parseBody` + manual validation | ✅ Good |

### ⚠️ Routes WITH Partial Validation

| Route | Method | Current Validation | Issues | Recommendation |
|-------|--------|-------------------|--------|----------------|
| `/api/admin/users` | PUT | ✅ **COMPLETE** - Zod schema added | ✅ Type-safe validation | ✅ Complete |
| `/api/candidate/verify-fec` | POST | ✅ **COMPLETE** - Zod schema added | ✅ Type-safe validation | ✅ Complete |
| `/api/candidates/verify/confirm` | POST | ✅ **COMPLETE** - Zod schema added | ✅ Type-safe validation | ✅ Complete |
| `/api/admin/audit/revert` | POST | ✅ **COMPLETE** - Zod schema added | ✅ Type-safe validation | ✅ Complete |
| `/api/candidates/onboard` | POST | Unknown | Needs verification | Verify and add Zod if missing |

### ❌ Routes MISSING Validation (High Priority)

| Route | Method | Risk | Action Needed |
|-------|--------|------|---------------|
| `/api/candidates/[slug]` | GET | Low | Verify query params validation |
| `/api/representatives/self/overrides` | POST/PATCH | **HIGH** | Add Zod schema for override fields |
| `/api/polls/[id]/vote` | POST | **HIGH** | Verify vote data validation |
| `/api/polls/[id]/post-close` | POST | **HIGH** | Verify validation exists |
| `/api/pwa/notifications/subscribe` | POST | **MEDIUM** | Verify subscription data validation |
| `/api/pwa/notifications/send` | POST | **CRITICAL** | Verify admin-only + validation |
| `/api/share` | POST | **MEDIUM** | Verify share data validation |
| `/api/v1/civics/address-lookup` | GET | **MEDIUM** | Verify query params validation |

## Recommended Validation Patterns

### 1. Use Zod Schemas (Preferred)

```typescript
import { z } from 'zod';
import { parseBody } from '@/lib/api';

const schema = z.object({
  field1: z.string().min(1),
  field2: z.number().int().positive(),
  field3: z.string().email().optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const parsed = await parseBody<z.infer<typeof schema>>(request, schema);
  if (!parsed.success) {
    return parsed.error;
  }
  const { field1, field2, field3 } = parsed.data;
  // Use validated data...
});
```

### 2. Use Custom Validators (When Needed)

For complex validation logic, use custom validators from `@/lib/security/input-sanitization`:
- `validateRepresentativeId()`
- `sanitizeMessageContent()`
- `sanitizeSubject()`
- `validatePriority()`
- `validateMessageType()`

### 3. Validate Query Parameters

```typescript
import { z } from 'zod';

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = querySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
  // Use validated query params...
};
```

## Security Considerations

### Required Validations

1. **Type Validation** - Ensure data types match expected types
2. **Length Validation** - Prevent DoS via oversized payloads
3. **Format Validation** - Email, URL, UUID formats
4. **Range Validation** - Numbers within acceptable ranges
5. **Enum Validation** - String values from allowed sets
6. **Sanitization** - Remove/escape dangerous characters
7. **SQL Injection Prevention** - Use parameterized queries (Supabase handles this)

### High-Risk Endpoints

These endpoints require extra validation:

- **Admin operations** - Verify admin permissions + validate all inputs
- **Authentication** - Validate credentials, prevent enumeration
- **Voting** - Validate vote data, prevent duplicate votes
- **User data updates** - Validate all fields, prevent privilege escalation
- **File uploads** - Validate file types, sizes, content

## Implementation Checklist

- [x] Add Zod schema to `/api/admin/users` (PUT) ✅ **COMPLETE (November 2025)**
- [x] Add Zod schema to `/api/candidate/verify-fec` (POST) ✅ **COMPLETE (November 2025)**
- [x] Add Zod schema to `/api/candidates/verify/confirm` (POST) ✅ **COMPLETE (November 2025)**
- [x] Add Zod schema to `/api/admin/audit/revert` (POST) ✅ **COMPLETE (November 2025)**
- [ ] Add Zod schema to `/api/representatives/self/overrides` (POST/PATCH)
- [ ] Verify validation on `/api/polls/[id]/vote` (POST)
- [ ] Verify validation on `/api/polls/[id]/post-close` (POST)
- [ ] Verify validation on `/api/pwa/notifications/send` (POST)
- [ ] Add query param validation to GET endpoints
- [ ] Create shared validation schemas for common patterns
- [ ] Add validation tests for all endpoints
- [ ] Document validation requirements in API docs

## Testing

Validation should be tested:

1. **Unit tests** - Test validation schemas independently
2. **Integration tests** - Test validation in API route context
3. **Edge cases** - Test boundary conditions, malformed data
4. **Security tests** - Test injection attempts, oversized payloads

## Related Documentation

- `web/lib/api/response-utils.ts` - Response helpers including `parseBody`
- `web/lib/security/input-sanitization.ts` - Custom validators
- `web/lib/validation/schemas.ts` - Shared validation schemas


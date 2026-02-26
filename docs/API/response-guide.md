# API Response Guide

_Last updated: February 2026_

Standard patterns for API responses in the Choices platform. All routes should use helpers from `@/lib/api/response-utils`.

## Success Response Pattern

Use `successResponse` for successful responses:

```typescript
import { successResponse } from '@/lib/api/response-utils';

// Basic success
return successResponse({ user: userData });

// With metadata
return successResponse(
  { polls: [] },
  { timestamp: new Date().toISOString(), cached: true }
);

// Custom status (e.g. 201 Created)
return successResponse({ id: newId }, undefined, 201);
```

**Response shape:**
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-02-25T12:00:00.000Z"
  }
}
```

## Paginated Response

Use `paginatedResponse` for list endpoints:

```typescript
import { paginatedResponse } from '@/lib/api/response-utils';

return paginatedResponse(items, { total: 100, limit: 20, offset: 0 });
```

**Response shape:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "timestamp": "...",
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true,
      "page": 1,
      "totalPages": 5
    }
  }
}
```

## Error Handling

Use `errorResponse`, `validationError`, or `notFound`:

```typescript
import { errorResponse, validationError, notFound } from '@/lib/api/response-utils';

// Generic error
return errorResponse('User not found', 404);

// Validation errors (field-level)
return validationError({ email: 'Invalid email format', password: 'Too short' });

// Not found
return notFound('Poll');
```

**Error shape:**
```json
{
  "success": false,
  "error": "User not found",
  "code": "NOT_FOUND",
  "details": { ... }
}
```

## Client-Side Handling

Always check `success` before using `data`:

```typescript
const result = await response.json();
if (result?.success && result?.data) {
  return result.data;
}
// Handle error: result.error, result.code, result.details
throw new Error(result?.error ?? 'Request failed');
```

## Standard Error Codes

| Code | HTTP | Use |
|------|------|-----|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `AUTH_ERROR` | 401 | Unauthenticated |
| `FORBIDDEN` | 403 | Unauthorized |
| `NOT_FOUND` | 404 | Resource missing |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

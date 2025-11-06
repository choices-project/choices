# Lint Fix Roadmap

**Generated:** November 6, 2025  
**Updated:** November 6, 2025  
**Starting Errors:** 771 errors  
**Current Errors:** 289 errors  
**Fixed:** 482 errors (62.5% reduction)  
**Status:** Configuration Fixed - Code Changes In Progress

## Overview

This document provides a comprehensive roadmap for fixing all remaining ESLint errors in the codebase. Errors are organized into logical sections that can be assigned to different agents for parallel processing.

## Error Categories Summary

| Category | Count | Priority | Complexity |
|----------|-------|----------|------------|
| Nullish Coalescing (`||` → `??`) | ~101 | High | Low |
| Unused Variables/Imports | ~169 | Medium | Low |
| Import Order | ~16 | Low | Low |
| Case Block Declarations | ~4 | Medium | Medium |
| Optional Chaining | ~4 | Low | Low |
| Console Statements | ~367 | Low | Low |
| Other Issues | ~50 | Varies | Varies |

---

## Section 1: Nullish Coalescing Operator (`prefer-nullish-coalescing`)

**Priority:** HIGH  
**Count:** ~101 errors  
**Complexity:** LOW  
**Estimated Time:** 2-3 hours

### Description
Replace logical OR (`||`) operators with nullish coalescing (`??`) operators where appropriate. The `??` operator only checks for `null` or `undefined`, making it safer than `||` which also treats falsy values (`0`, `''`, `false`) as nullish.

### Pattern to Fix
```typescript
// ❌ Before
const value = someValue || defaultValue;
const count = getCount() || 0;

// ✅ After
const value = someValue ?? defaultValue;
const count = getCount() ?? 0;
```

### Key Files Affected
- `lib/integrations/google-civic/error-handling.ts` (multiple instances)
- `lib/integrations/open-states/error-handling.ts` (multiple instances)
- `lib/utils/error-handler.ts` (multiple instances)
- `lib/webauthn/error-handling.ts` (multiple instances)
- `app/api/analytics/temporal/route.ts` (line 89)
- `app/api/profile/route.ts` (lines 217, 218, 238, 239)
- `app/api/candidate/journey/send-email/route.ts` (multiple instances)
- `app/api/cron/candidate-reminders/route.ts` (multiple instances)
- `features/analytics/lib/privacyFilters.ts` (multiple instances)
- Many other files across the codebase

### Fix Strategy
1. Identify all `||` operators used for default values
2. Replace with `??` when the intent is to handle `null`/`undefined`
3. Keep `||` when falsy values (`0`, `''`, `false`) should trigger fallback
4. **Important:** For boolean OR logic (combining multiple conditions), keep `||` - only use `??` for default value assignment
5. Test affected code paths

### Example Fix
```typescript
// File: lib/integrations/google-civic/error-handling.ts
// Line 89
const errorData = error.body ?? error.data ?? {};

// File: app/api/profile/route.ts
// Line 217-218
const displayName = userProfile.display_name ?? 'Anonymous';
const bio = userProfile.bio ?? '';

// File: app/api/admin/feedback/route.ts
// Note: For boolean OR logic (combining conditions), keep ||
const titleMatch = item.title?.toLowerCase().includes(searchLower) ?? false;
const descMatch = item.description?.toLowerCase().includes(searchLower) ?? false;
return titleMatch || descMatch || tagsMatch; // Boolean OR, not nullish coalescing
```

---

## Section 2: Unused Variables and Imports (`no-unused-vars`)

**Priority:** MEDIUM  
**Count:** ~169 errors  
**Complexity:** LOW  
**Estimated Time:** 3-4 hours

### Description
Remove unused variables, function parameters, and imports. For unused function parameters, prefix with `_` to indicate intentional non-use.

### Patterns to Fix

#### Unused Function Parameters
```typescript
// ❌ Before
export async function GET(request: NextRequest) {
  // request not used
}

// ✅ After
export async function GET(_request: NextRequest) {
  // Prefix with _ to indicate intentional non-use
}
```

#### Unused Variables
```typescript
// ❌ Before
const allowedOrigins = ['https://example.com'];
// Variable never used

// ✅ After
// Remove if truly unused, or prefix with _ if needed for type safety
const _allowedOrigins = ['https://example.com'];
```

#### Unused Imports
```typescript
// ❌ Before
import { unusedFunction, usedFunction } from './module';

// ✅ After
import { usedFunction } from './module';
```

### Key Files Affected
- `app/api/analytics/trust-tiers/route.ts` (line 27: unused `request`)
- `app/api/analytics/temporal/route.ts` (line 27: unused `request`)
- `app/api/feedback/suggestions/route.ts` (line 32: unused `request`)
- `app/api/profile/data/route.ts` (line 38: unused `request`)
- `app/api/profile/delete/route.ts` (line 38: unused `request`)
- `app/api/profile/export/route.ts` (line 32: unused `request`)
- `lib/integrations/google-civic/error-handling.ts` (line 27: unused `allowedOrigins`)
- `lib/integrations/open-states/error-handling.ts` (line 27: unused `allowedOrigins`)
- Many other files

### Fix Strategy
1. Scan for unused variables/parameters
2. Remove truly unused code
3. Prefix intentionally unused parameters with `_`
4. Remove unused imports
5. Verify no breaking changes

### Example Fix
```typescript
// File: app/api/analytics/trust-tiers/route.ts
// Line 27
export async function GET(_request: NextRequest) {
  // Changed request to _request
}

// File: lib/integrations/google-civic/error-handling.ts
// Line 27
const _allowedOrigins = ['https://example.com'];
// Or remove if completely unnecessary
```

---

## Section 3: Import Order (`import/order`)

**Priority:** LOW  
**Count:** ~16 errors  
**Complexity:** LOW  
**Estimated Time:** 30 minutes

### Description
Reorganize imports according to the project's import order rules. Generally: external packages → internal type imports → internal value imports.

### Pattern to Fix
```typescript
// ❌ Before
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// ✅ After
import type { Database } from '@/types/supabase';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';
```

### Key Files Affected
- `lib/integrations/google-civic/error-handling.ts` (lines 7, 9, 11)
- `lib/integrations/open-states/error-handling.ts` (similar pattern)
- `lib/utils/error-handler.ts` (similar pattern)
- `lib/webauthn/error-handling.ts` (similar pattern)
- Other files with import order issues

### Fix Strategy
1. Group imports: external → types → internal
2. Sort alphabetically within groups
3. Use ESLint auto-fix where possible: `npm run lint -- --fix`

### Example Fix
```typescript
// File: lib/integrations/google-civic/error-handling.ts
// Reorder imports:
// 1. External packages
// 2. Type imports (@/types/*)
// 3. Internal imports (@/lib/*, @/utils/*)
```

---

## Section 4: Case Block Declarations (`no-case-declarations`)

**Priority:** MEDIUM  
**Count:** ~4 errors  
**Complexity:** MEDIUM  
**Estimated Time:** 30 minutes

### Description
Wrap lexical declarations (`const`, `let`) in case blocks with braces to create a proper block scope.

### Pattern to Fix
```typescript
// ❌ Before
switch (status) {
  case 400:
    const errorData = error.body;
    return new Error(errorData);
  case 403:
    const errorData2 = error.body;
    return new Error(errorData2);
}

// ✅ After
switch (status) {
  case 400: {
    const errorData = error.body;
    return new Error(errorData);
  }
  case 403: {
    const errorData = error.body; // Can reuse name now
    return new Error(errorData);
  }
}
```

### Key Files Affected
- `lib/integrations/google-civic/error-handling.ts` (lines 102, 118, 134)
- Similar pattern in `lib/integrations/open-states/error-handling.ts`

### Fix Strategy
1. Identify case blocks with `const`/`let` declarations
2. Wrap case block content in braces `{}`
3. Verify no variable name conflicts

### Example Fix
```typescript
// File: lib/integrations/google-civic/error-handling.ts
// Line 102
case 400: {
  return new GoogleCivicApiError(
    'Bad request: Invalid parameters provided to Google Civic API',
    400,
    { 
      details: errorData,
      context,
      userMessage: 'The address or parameters provided are invalid. Please check your input and try again.'
    }
  );
}
```

---

## Section 5: Optional Chaining (`prefer-optional-chain`)

**Priority:** LOW  
**Count:** ~4 errors  
**Complexity:** LOW  
**Estimated Time:** 15 minutes

### Description
Replace verbose null checks with optional chaining (`?.`).

### Pattern to Fix
```typescript
// ❌ Before
const value = obj && obj.property && obj.property.nested;

// ✅ After
const value = obj?.property?.nested;
```

### Key Files Affected
- `app/api/analytics/poll-heatmap/route.ts` (line 126)
- A few other files

### Fix Strategy
1. Identify verbose null checks
2. Replace with optional chaining
3. Verify behavior is equivalent

### Example Fix
```typescript
// File: app/api/analytics/poll-heatmap/route.ts
// Line 126
category: poll.hashtags?.[0] ?? 'general',
// Already fixed in recent changes
```

---

## Section 6: Console Statements (`no-console`)

**Priority:** LOW  
**Count:** ~367 warnings  
**Complexity:** LOW-MEDIUM  
**Estimated Time:** 4-6 hours

### Description
Replace `console.log`, `console.error`, etc. with proper logging utilities. The project uses `@/lib/utils/logger` for logging.

### Pattern to Fix
```typescript
// ❌ Before
console.log('Debug message');
console.error('Error occurred', error);

// ✅ After
import { logger } from '@/lib/utils/logger';
logger.debug('Debug message');
logger.error('Error occurred', error);
```

### Key Files Affected
- Test files (can keep console statements)
- Development/debugging code
- Error handling files
- Many component files

### Fix Strategy
1. Identify console statements
2. Replace with appropriate logger method:
   - `console.log` → `logger.debug()` or `logger.info()`
   - `console.error` → `logger.error()`
   - `console.warn` → `logger.warn()`
3. Add logger import if missing
4. Keep console in test files (add eslint-disable comment)

### Example Fix
```typescript
// File: lib/contact/real-time-messaging.ts
// Replace
console.error('Error polling for messages:', error);
// With
import { logger } from '@/lib/utils/logger';
logger.error('Error polling for messages:', error);
```

---

## Section 7: Type Safety Improvements (`@typescript-eslint/no-explicit-any`)

**Priority:** MEDIUM  
**Count:** ~2000+ warnings  
**Complexity:** MEDIUM-HIGH  
**Estimated Time:** 10-15 hours

### Description
Replace `any` types with proper TypeScript types. This improves type safety and catches errors at compile time.

### Pattern to Fix
```typescript
// ❌ Before
function processData(data: any) {
  return data.value;
}

// ✅ After
function processData(data: { value: string }) {
  return data.value;
}
```

### Key Files Affected
- `app/api/admin/dashboard/route.ts` (many instances)
- `app/(app)/admin/analytics/page.tsx`
- `app/(app)/polls/page.tsx`
- Many API routes and components

### Fix Strategy
1. Identify `any` types
2. Determine proper types from context
3. Use database types from `@/types/supabase`
4. Create interfaces/types where needed
5. Use `unknown` for truly dynamic data with type guards

### Example Fix
```typescript
// File: app/api/admin/dashboard/route.ts
// Line 178
// ❌ Before
const metrics = (queryOptimizer as any).getMetrics();

// ✅ After
interface QueryOptimizer {
  getMetrics(): Promise<Metrics>;
}
const metrics = await (queryOptimizer as QueryOptimizer).getMetrics();
```

---

## Section 8: Other Issues

### 8.1 Undefined Variables (`no-undef`)
**Count:** ~143 errors  
**Fix:** Add proper type definitions or imports

### 8.2 Unescaped Entities (`no-unescaped-entities`)
**Count:** ~17 errors  
**Fix:** Escape HTML entities in JSX (`&` → `&amp;`, `"` → `&quot;`)

### 8.3 Extraneous Dependencies (`import/no-extraneous-dependencies`)
**Count:** ~7 errors  
**Fix:** Move dependencies to correct package.json (dependencies vs devDependencies)

### 8.4 Unknown Properties (`no-unknown-property`)
**Count:** ~3 errors  
**Fix:** Fix incorrect JSX prop names

### 8.5 Unresolved Imports (`import/no-unresolved`)
**Count:** ~3 errors  
**Fix:** Fix import paths or add missing dependencies

---

## Execution Plan

### Phase 1: Quick Wins (High Priority, Low Complexity)
1. ✅ Nullish Coalescing (`prefer-nullish-coalescing`) - 101 errors
2. ✅ Unused Variables (`no-unused-vars`) - 169 errors
3. ✅ Import Order (`import/order`) - 16 errors
4. ✅ Case Block Declarations (`no-case-declarations`) - 4 errors
5. ✅ Optional Chaining (`prefer-optional-chain`) - 4 errors

**Estimated Time:** 6-8 hours  
**Can be done in parallel by 2-3 agents**

### Phase 2: Code Quality (Medium Priority)
1. Console Statements (`no-console`) - 367 warnings
2. Type Safety (`no-explicit-any`) - Start with critical files

**Estimated Time:** 10-15 hours  
**Can be done incrementally**

### Phase 3: Cleanup (Low Priority)
1. Remaining type safety improvements
2. Other miscellaneous issues

**Estimated Time:** 5-10 hours

---

## File Lists by Category

### Nullish Coalescing Files (Top Priority)
```
lib/integrations/google-civic/error-handling.ts
lib/integrations/open-states/error-handling.ts
lib/utils/error-handler.ts
lib/webauthn/error-handling.ts
app/api/analytics/temporal/route.ts
app/api/profile/route.ts
app/api/candidate/journey/send-email/route.ts
app/api/cron/candidate-reminders/route.ts
features/analytics/lib/privacyFilters.ts
```

### Unused Variables Files
```
app/api/analytics/trust-tiers/route.ts
app/api/analytics/temporal/route.ts
app/api/feedback/suggestions/route.ts
app/api/profile/data/route.ts
app/api/profile/delete/route.ts
app/api/profile/export/route.ts
lib/integrations/google-civic/error-handling.ts
lib/integrations/open-states/error-handling.ts
```

### Import Order Files
```
lib/integrations/google-civic/error-handling.ts
lib/integrations/open-states/error-handling.ts
lib/utils/error-handler.ts
lib/webauthn/error-handling.ts
```

### Case Block Declaration Files
```
lib/integrations/google-civic/error-handling.ts
lib/integrations/open-states/error-handling.ts
```

---

## Testing Strategy

After each section:
1. Run `npm run lint` to verify fixes
2. Run `npm run types:strict` to ensure no type errors introduced
3. Run relevant tests for affected files
4. Check that functionality still works

---

## Notes

- Many errors can be auto-fixed: `npm run lint -- --fix`
- Some `any` types may be intentional for dynamic data - use `unknown` with type guards instead
- Console statements in test files can be ignored with eslint-disable comments
- Import order can often be auto-fixed by ESLint

---

## Progress Tracking

- [x] **Configuration Issues Fixed (143 no-undef errors eliminated)**
- [x] **Test File Configuration (126 errors fixed)**  
- [x] **K6 Load Testing Scripts (3 errors fixed)**
- [x] **Catch Block Error Handling (configured)**
- [ ] Section 1: Nullish Coalescing (101 → 28 errors remaining)
- [ ] Section 2: Unused Variables (169 → 94 errors remaining)
- [x] Section 3: Import Order (16 → 1 error remaining)
- [x] Section 4: Case Block Declarations (4 → 0 errors)
- [x] Section 5: Optional Chaining (4 → 1 error remaining)
- [ ] Section 6: Console Statements (366 → 128 errors remaining)
- [ ] Section 7: Type Safety (~2000+ warnings - unchanged)
- [ ] Section 8: Other Issues (200+ → ~30 errors remaining)

---

**Last Updated:** November 6, 2025  
**Next Review:** After Phase 1 completion


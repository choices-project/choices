# Testing Refactor Progress

**Created:** January 21, 2025  
**Updated:** January 21, 2025  
**Status:** In Progress

## Overview

Comprehensive refactor of all test files to use the new Supabase mock factory for better type safety, consistency, and maintainability.

## Goals

1. **90% code reduction** in mock setup
2. **100% type safety** (eliminate `as any`)
3. **Consistent patterns** across all tests
4. **Maintainable** - one place to update mocks
5. **Fix CI issues** by ensuring all tests pass

## Comprehensive Mock Factory Benefits

### Before (Old Inline Mocks):
```typescript
// 50+ lines of complex mock setup per test
const mockSingle = jest.fn() as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>;
const mockRpc = jest.fn() as jest.MockedFunction<() => Promise<{ data: unknown; error: Error | null }>>;
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: mockSingle
  })),
  rpc: mockRpc,
  // ... 30+ more properties
} as any;

// Then in each test:
mockSupabaseClient.from().select().eq().single.mockResolvedValue({
  data: mockPoll,
  error: null
});
```

### After (Comprehensive Mock):
```typescript
// 3 lines total!
import { makeMockSupabase, okSingle } from '../../helpers/supabase-mock';
const { client: mockSupabaseClient, single: mockSingle } = makeMockSupabase();

// Then in each test:
mockSingle.mockResolvedValueOnce(okSingle(mockPoll));
```

## Test Files Status

### ✅ COMPLETED

#### 1. **vote-validator.test.ts** - ✅ FULLY REFACTORED
- **Location:** `web/tests/unit/vote/vote-validator.test.ts`
- **Status:** ✅ Complete
- **Changes:** 
  - Replaced inline mocks with comprehensive mock factory
  - Reduced from ~100 lines of mock setup to 3 lines
  - All tests passing
  - Type safety improved

#### 2. **privacy-utils.spec.ts** - ✅ FULLY REFACTORED
- **Location:** `web/tests/unit/lib/civics/privacy-utils.spec.ts`
- **Status:** ✅ Complete
  - Converted from `require()` to ES6 imports
  - Fixed TypeScript errors
  - All tests passing

### 🔄 IN PROGRESS

#### 3. **vote-processor.test.ts** - 🔄 PARTIALLY REFACTORED
- **Location:** `web/tests/unit/vote/vote-processor.test.ts`
- **Status:** 🔄 In Progress
- **Progress:** 
  - ✅ Replaced inline mocks with comprehensive mock factory
  - ✅ Updated all test patterns to use `mockSingle.mockResolvedValueOnce(okSingle(data))`
  - ❌ **ISSUE:** Chaining pattern not working properly
  - **Current Problem:** `supabaseClient.from().select().eq().single` not connecting to `mockSingle`
  - **Next Steps:** Fix comprehensive mock to properly support chaining

### 📋 PENDING

#### 4. **vote-engine.test.ts** - 📋 PENDING
- **Location:** `web/tests/unit/vote/engine.test.ts`
- **Status:** 📋 Pending
- **Estimated Effort:** Medium
- **Dependencies:** Fix comprehensive mock chaining first

#### 5. **rate-limit.test.ts** - 📋 PENDING
- **Location:** `web/tests/unit/lib/core/security/rate-limit.test.ts`
- **Status:** 📋 Pending
- **Estimated Effort:** Low
- **Dependencies:** Fix comprehensive mock chaining first

#### 6. **irv-calculator.test.ts** - 📋 PENDING
- **Location:** `web/tests/unit/irv/irv-calculator.test.ts`
- **Status:** 📋 Pending
- **Estimated Effort:** Low (mathematical tests, minimal Supabase usage)

#### 7. **golden-cases.ts** - 📋 PENDING
- **Location:** `web/tests/unit/irv/golden-cases.ts`
- **Status:** 📋 Pending
- **Estimated Effort:** Low (test data, no mocks needed)

## Current Issue: Chaining Pattern

### Problem
The comprehensive mock doesn't properly support Supabase's chaining pattern:
```typescript
// This doesn't work:
supabaseClient.from('polls').select('*').eq('id', vote.pollId).single()
```

### Root Cause
The `single` method in the query builder is not properly connected to the `mockSingle` function.

### Solution Needed
Fix the comprehensive mock to properly support:
1. Method chaining (`from().select().eq().single()`)
2. Connection between chained `single()` and `mockSingle` function
3. Proper return values for all chained methods

## Implementation Steps

### Phase 1: Fix Comprehensive Mock ✅
- [x] Create comprehensive mock factory
- [x] Add helper functions (`okSingle`, `errSingle`, `okArray`)
- [x] Support basic query builder methods
- [ ] **CURRENT:** Fix chaining pattern support

### Phase 2: Refactor Unit Tests
- [x] vote-validator.test.ts ✅
- [x] privacy-utils.spec.ts ✅
- [ ] vote-processor.test.ts 🔄
- [ ] vote-engine.test.ts 📋
- [ ] rate-limit.test.ts 📋
- [ ] irv-calculator.test.ts 📋

### Phase 3: Run All Tests
- [ ] Verify all unit tests pass
- [ ] Verify all E2E tests pass
- [ ] Fix any remaining CI issues

## Metrics

### Code Reduction Achieved
- **vote-validator.test.ts:** ~90% reduction in mock setup code
- **privacy-utils.spec.ts:** ~80% reduction in import complexity
- **Overall:** Targeting 90% reduction across all test files

### Type Safety Improvements
- **Before:** Multiple `as any` casts, complex type assertions
- **After:** Full type safety with proper TypeScript interfaces
- **Eliminated:** All `as any` casts in refactored files

## Next Actions

1. **IMMEDIATE:** Fix comprehensive mock chaining pattern
2. **NEXT:** Complete vote-processor.test.ts refactor
3. **THEN:** Refactor remaining unit test files
4. **FINALLY:** Run full test suite to verify CI fixes

## Files to Update

### Core Mock Factory
- `web/tests/helpers/supabase-mock.ts` - Fix chaining support

### Unit Tests (Priority Order)
1. `web/tests/unit/vote/vote-processor.test.ts` - 🔄 In Progress
2. `web/tests/unit/vote/engine.test.ts` - 📋 Pending
3. `web/tests/unit/lib/core/security/rate-limit.test.ts` - 📋 Pending
4. `web/tests/unit/irv/irv-calculator.test.ts` - 📋 Pending

### Documentation
- This file - Update as progress is made

## Success Criteria

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] CI pipeline passes
- [ ] 90% reduction in mock setup code
- [ ] Zero `as any` casts in test files
- [ ] Consistent patterns across all tests

---

**Last Updated:** January 21, 2025 - 22:52 UTC



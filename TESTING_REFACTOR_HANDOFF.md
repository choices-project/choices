# Testing Refactor Handoff - Supabase Mock Factory Implementation

**Created:** January 21, 2025  
**Status:** In Progress - Need Help with Chaining Pattern

## Context

We're refactoring our entire testing suite to use a comprehensive Supabase mock factory instead of inline mocks. This is achieving **90% code reduction** and **100% type safety**, but we're stuck on the chaining pattern.

## What We've Accomplished

### ✅ Successfully Refactored
1. **vote-validator.test.ts** - Complete success, 90% code reduction
2. **privacy-utils.spec.ts** - Complete success, fixed TypeScript issues

### 🔄 Currently Stuck On
**vote-processor.test.ts** - The chaining pattern isn't working

## The Problem

### What We Want (Real Supabase API):
```typescript
const { data, error } = await supabaseClient
  .from('polls')
  .select('*')
  .eq('id', vote.pollId)
  .single();
```

### What We Have (Our Mock):
```typescript
// This works:
mockSingle.mockResolvedValueOnce(okSingle(mockPoll));

// But this doesn't work:
supabaseClient.from('polls').select('*').eq('id', vote.pollId).single()
// Error: "supabaseClient.from(...).select(...).eq(...).single is not a function"
```

## Current Mock Implementation

### File: `web/tests/helpers/supabase-mock.ts`

```typescript
export function makeMockSupabase(): {
  client: jest.Mocked<SupabaseClient>;
  single: jest.Mock;
  rpc: jest.Mock;
  // ... other methods
} {
  // Mock query builder methods
  const single = jest.fn();
  const select = jest.fn().mockReturnThis();
  const insert = jest.fn().mockReturnThis();
  const update = jest.fn().mockReturnThis();
  const eq = jest.fn().mockReturnThis();
  // ... other methods

  // Mock query builder object
  const queryBuilder = {
    select,
    insert,
    update,
    eq,
    single,
    // ... other methods
  };

  // Connect the single method to the mockSingle function
  single.mockImplementation(() => mockSingle());

  // Mock from method to return query builder
  const from = jest.fn(() => queryBuilder);

  // Create the mock client
  const client = {
    from,
    // ... other properties
  };

  return { client, single: mockSingle, rpc: mockRpc };
}
```

## The Issue

The problem is that `single.mockImplementation(() => mockSingle())` is calling `mockSingle()` immediately instead of returning the mock function. We need the chained `single()` method to return the same promise that `mockSingle` would return.

## What We Need

1. **Fix the chaining pattern** so `supabaseClient.from().select().eq().single()` works
2. **Connect the chained `single()` to `mockSingle`** so tests can mock responses
3. **Maintain type safety** throughout the chain
4. **Support all Supabase query methods** (select, insert, update, delete, eq, etc.)

## Test Files to Refactor

### Priority Order:
1. **vote-processor.test.ts** - 🔄 Currently stuck here
2. **vote-engine.test.ts** - 📋 Pending
3. **rate-limit.test.ts** - 📋 Pending
4. **irv-calculator.test.ts** - 📋 Pending

## Expected Benefits

- **90% code reduction** in mock setup
- **100% type safety** (no more `as any`)
- **Consistent patterns** across all tests
- **Maintainable** - one place to update mocks
- **Fix CI issues** by ensuring all tests pass

## Files Included in Tar Ball

- `web/tests/` - Entire testing suite
- `web/tests/helpers/supabase-mock.ts` - Current mock implementation
- `web/lib/vote/` - Vote processing code being tested
- `docs/implementation/TESTING_REFACTOR_PROGRESS.md` - Detailed progress tracking

## Questions for AI

1. **How do we fix the chaining pattern?** The `single()` method needs to return the same promise as `mockSingle` would return.

2. **Should we use a different approach?** Maybe we need to restructure how the mock works entirely.

3. **Are there any Supabase-specific patterns we're missing?** The real Supabase client has specific behaviors we might not be replicating.

4. **How do we maintain type safety?** We want to avoid `as any` casts while supporting the chaining.

## Success Criteria

- [ ] `supabaseClient.from().select().eq().single()` works without errors
- [ ] Tests can mock responses using `mockSingle.mockResolvedValueOnce(okSingle(data))`
- [ ] All existing tests pass
- [ ] Type safety maintained throughout
- [ ] 90% code reduction achieved

## Current Test Failure

```
TypeError: supabaseClient.from(...).select(...).eq(...).single is not a function
```

This suggests the `single` method is not properly attached to the query builder object or is not a function.

---

**Please help us solve the chaining pattern issue so we can complete this refactor and achieve the massive code reduction and type safety improvements we're targeting!**



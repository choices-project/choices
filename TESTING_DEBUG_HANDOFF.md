# Testing Debug Handoff - V2 Mock Factory Issue

**Created:** January 21, 2025  
**Status:** Complex debugging issue requiring AI assistance  
**Priority:** Critical - Blocking test suite upgrade

## Problem Summary

The V2 mock factory is not working properly in the VoteProcessor tests. The mock is being called (confirmed by metrics and debug output), but it's not returning the expected data, causing all VoteProcessor tests to fail with "Poll not found" errors.

## Key Findings

### ✅ What's Working
- V2 mock factory is being called (metrics show 1 call to `single` on `polls` table)
- Mock calls are being tracked (debug shows 2 mock calls)
- Query state is correct (matches expected: `table: "polls", op: "select", selects: "*", filters: [{ type: "eq", column: "id", value: "test-poll-123" }]`)
- VoteValidator tests pass (same mock factory, different usage pattern)

### ❌ What's Broken
- Mock is not returning expected data (returns "Poll not found" instead of mockPoll data)
- Jest is not available when mock factory is created (`Jest available: false`)
- V2 mock factory falls back to custom implementation instead of Jest's mock system
- Mock calls tracking works, but mock data return doesn't

## Technical Details

### Mock Factory Issue
```javascript
// In supabase-mock.ts - Jest is not available
const viLike = (globalThis as any).vi?.fn?.bind((globalThis as any).vi);
const jestLike = (globalThis as any).jest?.fn?.bind((globalThis as any).jest);
// Both return false, so falls back to custom implementation
```

### Test Setup
```javascript
// VoteProcessor test setup
const { client: mockSupabaseClient, handles, getMetrics } = getMS();
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));

// Mock arrangement
arrangeFindById(handles, 'polls', 'test-poll-123', mockPoll);
```

### Debug Output
```
Mock calls before test: 0
Result: { success: false, error: 'Poll not found' }
Metrics: { counts: { single: 1, maybeSingle: 0, list: 0, mutate: 0, rpc: 0 }, byTable: { polls: { single: 1 } } }
Mock calls after test: 2
Last mock call state: {
  "filters": [{"type": "eq", "column": "id", "value": "test-poll-123"}],
  "table": "polls",
  "op": "select",
  "selects": "*"
}
```

## Files Included in Tar Ball

### Core Test Files
- `web/tests/unit/vote/vote-processor.test.ts` - Failing test
- `web/tests/unit/vote/vote-validator.test.ts` - Working test (for comparison)
- `web/tests/helpers/supabase-mock.ts` - V2 mock factory implementation
- `web/tests/helpers/supabase-when.ts` - When() DSL implementation
- `web/tests/helpers/arrange-helpers.ts` - Test helpers
- `web/tests/setup.ts` - Test setup with lazy mock factory creation

### Configuration Files
- `web/jest.config.js` - Jest configuration
- `web/jest.setup.js` - Jest setup file
- `web/jest.env.setup.js` - Environment setup (created during debugging)

### Implementation Files
- `web/lib/vote/processor.ts` - VoteProcessor implementation
- `web/lib/vote/validator.ts` - VoteValidator implementation (working)
- `web/lib/vote/types.ts` - Type definitions
- `web/types/supabase.ts` - Supabase types
- `web/types/voting.ts` - Voting types

### Documentation
- `TESTING_UPGRADE_ROADMAP.md` - Original upgrade plan

## Attempted Fixes

### 1. Environment Variable Setup
- Added `PRIVACY_PEPPER_CURRENT` to jest.setup.js
- Created jest.env.setup.js for early environment setup
- **Result:** Environment crashes resolved, but mock factory still broken

### 2. Mock Factory Timing
- Changed from immediate creation to lazy creation in tests/setup.ts
- **Result:** Still falls back to custom implementation

### 3. Mock Implementation Fixes
- Fixed mock call tracking in fallback implementation
- Added proper call tracking to `mockResolvedValueOnce`
- **Result:** Mock calls now tracked, but data still not returned

### 4. Jest Mock Setup
- Fixed `@/utils/supabase/server` mock to return mock client
- **Result:** No change in behavior

## Root Cause Analysis

The core issue appears to be that Jest is not available when the V2 mock factory is created, even with lazy initialization. This causes the mock factory to fall back to its custom implementation, which doesn't properly handle the `when()` DSL assertions.

## Key Questions for Next AI

1. **Why is Jest not available?** The mock factory is created after Jest setup, but `globalThis.jest` is still false.

2. **Why does VoteValidator work but VoteProcessor doesn't?** Both use the same mock factory, but VoteValidator tests pass.

3. **How to fix the when() DSL?** The assertion passes but the mock doesn't return data.

4. **Alternative approaches?** Should we use Jest's native mocking instead of the V2 mock factory?

## Test Commands

```bash
# Run failing test
cd /Users/alaughingkitsune/src/Choices/web
npx jest tests/unit/vote/vote-processor.test.ts -t "should process valid vote successfully" --verbose

# Run working test for comparison
npx jest tests/unit/vote/vote-validator.test.ts --verbose

# Run all unit tests
npm run test:unit
```

## Expected Behavior

The VoteProcessor test should:
1. Set up mock for poll lookup: `arrangeFindById(handles, 'polls', 'test-poll-123', mockPoll)`
2. Call `processor.processVote(mockVoteData)`
3. Mock should return `mockPoll` data
4. Test should pass with `result.success === true`

## Current Behavior

The VoteProcessor test:
1. Sets up mock correctly
2. Makes the call
3. Mock is called (confirmed by metrics)
4. Mock returns error/null data instead of `mockPoll`
5. Test fails with "Poll not found"

## Next Steps

1. **Investigate Jest availability** - Why isn't Jest available when mock factory is created?
2. **Compare working vs failing tests** - What's different between VoteValidator and VoteProcessor?
3. **Fix when() DSL** - Why do assertions pass but mocks don't return data?
4. **Consider alternative approaches** - Maybe use Jest's native mocking instead

## Files to Focus On

1. `web/tests/helpers/supabase-mock.ts` - Core mock factory implementation
2. `web/tests/unit/vote/vote-processor.test.ts` - Failing test
3. `web/tests/unit/vote/vote-validator.test.ts` - Working test (for comparison)
4. `web/tests/setup.ts` - Test setup and mock factory creation

## Debugging Tips

- Use `console.log` to check Jest availability: `!!(globalThis as any).jest`
- Check mock calls: `handles.single.mock.calls.length`
- Check query state: `handles.single.mock.calls[0][0]`
- Compare with working VoteValidator test

---

**Note:** This is a complex issue involving Jest, custom mock factories, and test setup timing. The V2 mock factory is sophisticated but appears to have a fundamental issue with Jest integration that needs expert debugging.

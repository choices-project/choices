# TypeScript Errors Analysis

**Created:** 2025-01-17  
**Updated:** 2025-01-17

## Summary

This document contains all remaining TypeScript errors that need to be fixed in the codebase. The errors are primarily related to Jest mock typing issues in test files.

## Error Count
- **Total Errors:** 30
- **Files Affected:** 2
  - `tests/unit/finalize-manager.test.ts`: 28 errors
  - `tests/unit/vote-engine.test.ts`: 2 errors

## Error Categories

### 1. Jest Mock Type Issues (28 errors in finalize-manager.test.ts)

**Problem:** Jest mock functions are not properly typed, causing TypeScript to infer `never` types for mock return values.

**Root Cause:** The mock structure needs proper type assertions or better typing to work with TypeScript's strict mode.

### 2. Mock Strategy Type Issues (2 errors in vote-engine.test.ts)

**Problem:** Mock strategy objects with `mockRejectedValue` calls are not properly typed.

## Detailed Error Analysis

### File: `tests/unit/finalize-manager.test.ts`

#### Mock Supabase Client Structure (Lines 24-42)
```typescript
// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }), // ERROR: Line 33
    then: jest.fn().mockResolvedValue({ data: [], error: null })      // ERROR: Line 34
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
    send: jest.fn().mockResolvedValue(undefined)                      // ERROR: Line 40
  }))
};
```

**Errors:**
- Line 33: `Argument of type '{ data: null; error: null; }' is not assignable to parameter of type 'never'`
- Line 34: `Argument of type '{ data: never[]; error: null; }' is not assignable to parameter of type 'never'`
- Line 40: `Argument of type 'undefined' is not assignable to parameter of type 'never'`

#### Mock IRVCalculator Structure (Lines 48-71)
```typescript
// Mock IRVCalculator
jest.mock('@/lib/vote/irv-calculator', () => ({
  IRVCalculator: jest.fn().mockImplementation(() => ({
    calculateResults: jest.fn().mockResolvedValue({                   // ERROR: Line 51
      winner: 'candidate-1',
      rounds: [
        {
          round: 1,
          eliminated: 'candidate-3',
          votes: { 'candidate-1': 2, 'candidate-2': 1, 'candidate-3': 0 },
          percentages: { 'candidate-1': 66.67, 'candidate-2': 33.33, 'candidate-3': 0 }
        }
      ],
      totalVotes: 3,
      participationRate: 0.75,
      breakdown: { 'candidate-1': 2, 'candidate-2': 1, 'candidate-3': 0 },
      metadata: {
        algorithm: 'IRV',
        tieBreakingMethod: 'poll-seeded-hash',
        calculationTime: 15
      }
    })
  }))
}));
```

**Error:**
- Line 51: `Argument of type '{ winner: string; rounds: ... }' is not assignable to parameter of type 'never'`

#### FinalizePollManager Constructor (Line 104)
```typescript
finalizeManager = new FinalizePollManager(mockSupabaseClient);        // ERROR: Line 104
```

**Error:**
- Line 104: `Argument of type '{ from: Mock<...>; channel: Mock<...>; }' is not assignable to parameter of type 'SupabaseClient'`

#### Mock Method Calls Throughout Test File
Multiple lines with similar patterns:
```typescript
(mockSupabaseClient.from().select().eq().single as any).mockResolvedValue({  // ERROR: Lines 160, 203, 225, 247, 285, 496, 528, 568
  // ... mock data
});

(mockSupabaseClient.from().select().eq().then as any).mockResolvedValue({    // ERROR: Lines 166, 253, 291, 339, 361, 378, 502, 534, 574
  // ... mock data
});

(mockSupabaseClient.from().update().eq as any).mockResolvedValue({           // ERROR: Lines 178, 265, 546, 586
  // ... mock data
});

(mockSupabaseClient.from().insert as any).mockResolvedValue({                // ERROR: Lines 172, 259, 313, 326, 508, 540, 580
  // ... mock data
});
```

**Errors:**
- All these lines: `Object is of type 'unknown'`

#### IRV Calculator Error Mock (Line 410)
```typescript
calculateResults: jest.fn().mockRejectedValue(new Error('IRV calculation error'))  // ERROR: Line 410
```

**Error:**
- Line 410: `Argument of type 'Error' is not assignable to parameter of type 'never'`

#### Database Connection Error Mock (Line 479)
```typescript
.mockResolvedValue(null);  // ERROR: Line 479
```

**Error:**
- Line 479: `Argument of type 'null' is not assignable to parameter of type 'never'`

### File: `tests/unit/vote-engine.test.ts`

#### Mock Strategy with Error (Line 259)
```typescript
const mockStrategy = {
  getVotingMethod: () => 'single' as VotingMethod,
  validateVote: jest.fn().mockRejectedValue(new Error('Strategy error')),  // ERROR: Line 259
  processVote: jest.fn(),
  calculateResults: jest.fn(),
  getConfiguration: jest.fn()
} as any;
```

**Error:**
- Line 259: `Argument of type 'Error' is not assignable to parameter of type 'never'`

#### Mock Strategy with Calculation Error (Line 338)
```typescript
const mockStrategy = {
  getVotingMethod: () => 'single' as VotingMethod,
  validateVote: jest.fn(),
  processVote: jest.fn(),
  calculateResults: jest.fn().mockRejectedValue(new Error('Calculation error')),  // ERROR: Line 338
  getConfiguration: jest.fn()
};
```

**Error:**
- Line 338: `Argument of type 'Error' is not assignable to parameter of type 'never'`

## Recommended Solutions

### 1. Fix Mock Type Assertions

The primary issue is that Jest mocks need proper type assertions. Here are the recommended approaches:

#### Option A: Comprehensive Type Assertion
```typescript
const mockSupabaseClient = {
  // ... mock structure
} as any;
```

#### Option B: Individual Mock Type Assertions
```typescript
single: jest.fn().mockResolvedValue({ data: null, error: null }) as any,
then: jest.fn().mockResolvedValue({ data: [], error: null }) as any,
send: jest.fn().mockResolvedValue(undefined) as any,
```

#### Option C: Proper Jest Mock Typing
```typescript
import { jest } from '@jest/globals';

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null })
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
    send: jest.fn().mockResolvedValue(undefined)
  }))
} as any;
```

### 2. Fix Mock Strategy Types

For the vote-engine.test.ts file:

```typescript
const mockStrategy = {
  getVotingMethod: () => 'single' as VotingMethod,
  validateVote: jest.fn().mockRejectedValue(new Error('Strategy error')) as any,
  processVote: jest.fn(),
  calculateResults: jest.fn(),
  getConfiguration: jest.fn()
} as any;
```

### 3. Alternative: Disable TypeScript for Test Files

If the above solutions don't work, consider adding `// @ts-nocheck` at the top of the test files or configuring TypeScript to be less strict for test files.

## Files to Modify

1. `/Users/alaughingkitsune/src/Choices/web/tests/unit/finalize-manager.test.ts`
2. `/Users/alaughingkitsune/src/Choices/web/tests/unit/vote-engine.test.ts`

## Testing the Fix

After implementing the fixes, run:
```bash
cd /Users/alaughingkitsune/src/Choices/web
npm run type-check
```

The command should exit with code 0 and no errors.

## Context

These errors are preventing the build from passing in CI/CD. The codebase uses TypeScript in strict mode, which requires proper typing for all Jest mocks. The errors are not functional issues but rather TypeScript type safety issues that need to be resolved for the build to pass.

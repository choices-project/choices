# COMPREHENSIVE FIX PLAN

## The Problem
75 TypeScript errors from incomplete try-catch removal in 95 endpoints

## The Pattern
```typescript
// WRONG (what I did):
export const GET = withErrorHandling(async (request: NextRequest) => {
  // ... code ...
  return successResponse(data);

  } catch (error) {  // ← Left this by mistake!
    return NextResponse.json(...)
  }
})

// CORRECT (what it should be):
export const GET = withErrorHandling(async (request: NextRequest) => {
  // ... code ...
  return successResponse(data);
});  // ← Just close it cleanly
```

## The Solution
Remove ALL leftover try-catch blocks from withErrorHandling wrapped functions.
withErrorHandling already handles errors, so internal try-catch is redundant.

## Files to Fix
~25 files with leftover try-catch blocks

## Verification
After fixing: npx tsc --noEmit should show 0 errors

Starting fixes now...

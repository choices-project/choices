# Testing Improvements Plan

**Date:** November 30, 2025  
**Status:** Planning Phase

## Overview

This document outlines the plan to stabilize Playwright harnesses, reduce flakiness, and expand test coverage.

## Current State

### Playwright Configuration

**Current Settings:**
- Retries: 1 in CI, 0 locally
- Workers: 1 in CI, 2 locally
- Timeout: 30 seconds
- Expect timeout: 5 seconds
- Fully parallel: false (for stability)

**Issues Identified:**
- Some tests are flaky in CI
- Timeout issues on slower operations
- Race conditions in async flows
- Missing error context in failures

### Test Coverage

**Unit Tests:** ✅ Good coverage (20 store test files)
**RTL Integration:** ⚠️ Only 1 integration test (`notification.integration.test.tsx`)
**Playwright Harnesses:** ✅ Most stores have harnesses
**E2E Specs:** ✅ Good coverage for key flows

## Improvement Plan

### 1. Stabilize Playwright Harnesses

#### A. Increase Timeouts for Slow Operations

**Current:**
```typescript
timeout: 30_000,
expect: { timeout: 5_000 },
actionTimeout: 10_000,
navigationTimeout: 15_000,
```

**Recommended:**
```typescript
timeout: 60_000, // Increase for complex flows
expect: { timeout: 10_000 }, // Increase for async operations
actionTimeout: 15_000, // Increase for slow actions
navigationTimeout: 30_000, // Increase for slow navigation
```

#### B. Improve Wait Strategies

**Replace fixed delays with proper waits:**
```typescript
// ❌ Bad: Fixed delay
await page.waitForTimeout(2000);

// ✅ Good: Wait for specific condition
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
await expect(page.locator('[data-testid="element"]')).toBeVisible();
```

#### C. Add Better Error Messages

**Current:**
```typescript
expect(element).toBeVisible();
```

**Improved:**
```typescript
expect(element, 'Element should be visible after action').toBeVisible();
```

#### D. Isolate Tests

**Issues:**
- Tests interfering with each other
- Shared state causing flakiness

**Solutions:**
1. Use `test.beforeEach` to reset state
2. Use unique test data per test
3. Clean up after each test
4. Use `test.describe.parallel` carefully

### 2. Expand RTL Integration Tests

#### Priority Stores

1. **adminStore.ts** - Admin operations, user management
2. **analyticsStore.ts** - Analytics tracking, consent
3. **appStore.ts** - Theme, sidebar, preferences
4. **pollsStore.ts** - Poll creation, voting
5. **profileStore.ts** - Profile editing, onboarding

#### Test Patterns

**State Changes:**
```tsx
it('should update state when action is called', () => {
  const { result } = renderHook(() => useStore());
  act(() => {
    result.current.someAction();
  });
  expect(result.current.state).toBe(expected);
});
```

**UI Updates:**
```tsx
it('should update UI when store state changes', () => {
  render(<TestComponent />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByTestId('result')).toHaveTextContent('expected');
});
```

### 3. Reduce Flakiness

#### Common Flakiness Causes

1. **Timing Issues**
   - Solution: Use proper wait strategies
   - Add retries for known flaky operations

2. **Race Conditions**
   - Solution: Use `waitFor` instead of assertions
   - Add proper async/await handling

3. **Shared State**
   - Solution: Reset state in `beforeEach`
   - Use unique identifiers per test

4. **Network Issues**
   - Solution: Mock network requests where possible
   - Add retries for network operations

#### Flaky Test Detection

**Add to CI:**
```yaml
- name: Detect flaky tests
  run: |
    npm run test:e2e -- --repeat-each=3
```

### 4. Expand Coverage

#### Missing Coverage Areas

1. **Error States**
   - Test error handling in stores
   - Test error UI states
   - Test error recovery

2. **Edge Cases**
   - Test boundary conditions
   - Test invalid inputs
   - Test empty states

3. **Async Operations**
   - Test loading states
   - Test async error handling
   - Test race conditions

4. **Accessibility**
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test ARIA attributes

## Implementation Steps

### Phase 1: Quick Wins (1-2 weeks)

1. **Increase timeouts** in Playwright config
2. **Replace fixed delays** with proper waits in existing tests
3. **Add error messages** to assertions
4. **Add RTL integration test** for `appStore.ts` (theme/sidebar)

### Phase 2: Stabilization (2-3 weeks)

1. **Fix flaky tests** identified in CI
2. **Add RTL integration tests** for priority stores
3. **Improve test isolation** in Playwright suites
4. **Add retry logic** for known flaky operations

### Phase 3: Expansion (3-4 weeks)

1. **Add RTL integration tests** for remaining stores
2. **Expand error state coverage**
3. **Add edge case tests**
4. **Add accessibility tests** to harnesses

## Metrics

### Current Metrics
- Unit test coverage: ~80% (estimated)
- RTL integration coverage: ~5% (1/20 stores)
- Playwright harness coverage: ~75% (15/20 stores)
- Flaky test rate: ~5-10% (estimated)

### Target Metrics
- Unit test coverage: 85%+
- RTL integration coverage: 50%+ (10/20 stores)
- Playwright harness coverage: 90%+ (18/20 stores)
- Flaky test rate: <2%

## Related Documentation

- `docs/TESTING.md` - Testing guide
- `docs/STORE_MODERNIZATION_STATUS.md` - Store test status
- `docs/ROADMAP_SINGLE_SOURCE.md` - Main roadmap
- `web/playwright.config.ts` - Playwright configuration
- `web/tests/unit/stores/notification.integration.test.tsx` - Example RTL test

## Notes

- Focus on stability first, then expansion
- Use `notificationStore` as reference implementation
- Prioritize stores with high user impact
- Document patterns as they're established


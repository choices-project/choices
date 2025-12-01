# Store Modernization Status

**Date:** November 30, 2025  
**Status:** In Progress

## Overview

This document tracks the modernization status of Zustand stores, including RTL integration tests, Playwright harnesses, and alignment with 2025 store standards.

## Store Standards Checklist

Each store should have:
- ✅ Unit tests (`tests/unit/stores/<store>.test.ts`)
- ⚠️ RTL integration tests (`tests/unit/stores/<store>.integration.test.tsx`)
- ⚠️ Playwright harness (`app/(app)/e2e/<store>/page.tsx` + `tests/e2e/specs/<store>.spec.ts`)
- ✅ Typed creator pattern
- ✅ Selector hooks
- ✅ Action hooks
- ✅ Base store actions (`createBaseStoreActions`)
- ✅ Safe storage (`createSafeStorage`)

## Store Status

### ✅ Complete Stores

| Store | Unit Tests | RTL Integration | Playwright Harness | Status |
|-------|-----------|-----------------|-------------------|--------|
| `notificationStore.ts` | ✅ | ✅ | ✅ | **Complete** |
| `appStore.ts` | ✅ | ✅ | ✅ | **Complete** |
| `adminStore.ts` | ✅ | ✅ | ✅ | **Complete** |
| `pollsStore.ts` | ✅ | ✅ | ✅ | **Complete** |
| `userStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `analyticsStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `profileStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `pollsStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `votingStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `deviceStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `pwaStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `onboardingStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `feedsStore.ts` | ✅ | ❌ | ✅ | Mostly complete |
| `contactStore.ts` | ✅ | ❌ | ❌ | Needs harness |
| `electionStore.ts` | ✅ | ❌ | ❌ | Needs harness |
| `voterRegistrationStore.ts` | ✅ | ❌ | ❌ | Needs harness |
| `performanceStore.ts` | ✅ | ❌ | ❌ | Needs harness |
| `widgetStore.ts` | ✅ (keyboard) | ❌ | ❌ | Needs harness |

### ⚠️ Stores Needing Work

| Store | Missing Items | Priority | Notes |
|-------|--------------|----------|-------|
| `analyticsStore.ts` | RTL integration, async service helpers | **P1** | Extract async service helpers; consent guard tests |
| `deviceStore.ts` | RTL integration | **P1** | Migrate PWA/device consumers; unit/RTL coverage |
| `feedsStore.ts` | RTL integration, harness stability | **P1** | Resolve harness flake; expand RTL |
| `hashtagStore.ts` | RTL integration, typing | **P1** | Tighten typing; async error coverage |
| `hashtagModerationStore.ts` | RTL integration, dashboard tests | **P1** | Dashboard tests; selector adoption |
| `notificationStore.ts` | Admin/dashboard toasts | **P1** | Migrate toasts to action bundle |
| `pollWizardStore.ts` | RTL integration, progressive saving | **P1** | Progressive saving tests |
| `profileStore.ts` | RTL integration, Playwright coverage | **P1** | Add remaining unit + Playwright coverage |
| `pwaStore.ts` | RTL integration, offline sync | **P1** | Align ServiceWorker/provider; offline sync tests |
| `representativeStore.ts` | E2E checks | **P1** | Add E2E checks |
| `votingStore.ts` | RTL integration, undo flows | **P1** | Confirmation wiring; undo flows; Playwright coverage |
| `userStore.ts` | RTL integration | **P1** | Add RTL integration test |

## RTL Integration Test Pattern

Based on `notification.integration.test.tsx`, RTL integration tests should:

1. **Render harness component** that uses the store
2. **Test state changes** through hooks/actions
3. **Verify UI updates** reflect store state
4. **Test edge cases** and error states
5. **Use fake timers** where needed for time-based logic

Example structure:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { useNotificationStore } from '@/lib/stores';

function TestHarness() {
  const notifications = useNotificationStore(state => state.notifications);
  const addNotification = useNotificationStore(state => state.addNotification);
  
  return (
    <div>
      <button onClick={() => addNotification({ ... })}>Add</button>
      <div data-testid="count">{notifications.length}</div>
    </div>
  );
}

describe('NotificationStore Integration', () => {
  it('should update UI when notification is added', async () => {
    render(<TestHarness />);
    // Test implementation
  });
});
```

## Playwright Harness Pattern

Harness pages should:

1. **Expose `window.__<store>Harness`** for programmatic access
2. **Render store state** in UI
3. **Provide controls** for testing actions
4. **Show loading/error states**
5. **Support deterministic testing**

Example structure:
```tsx
// app/(app)/e2e/<store>/page.tsx
'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/stores';

export default function StoreHarnessPage() {
  const state = useStore();
  
  useEffect(() => {
    (window as any).__storeHarness = {
      getState: () => useStore.getState(),
      reset: () => useStore.getState().reset(),
      // ... other methods
    };
  }, []);
  
  return (
    <div>
      {/* Render store state */}
    </div>
  );
}
```

## Testing Improvements Needed

### Playwright Harness Stability

**Current Issues:**
- Some harnesses have flaky tests
- Timeout issues in CI
- Race conditions in async operations

**Improvements:**
1. **Increase timeouts** for slow operations
2. **Add retries** for flaky tests (already configured)
3. **Use `waitFor`** instead of fixed delays
4. **Isolate tests** to prevent interference
5. **Add better error messages** for debugging

### Test Coverage Gaps

**Missing Coverage:**
- RTL integration tests for most stores
- Playwright harnesses for some stores
- Edge case coverage
- Error state coverage
- Async operation coverage

## Implementation Priority

### Phase 1: High Priority (P1) - IN PROGRESS
1. ✅ Add RTL integration tests for:
   - ✅ `appStore.ts` - **COMPLETE**
   - ✅ `adminStore.ts` - **COMPLETE**
   - ✅ `pollsStore.ts` - **COMPLETE**
   - ⚠️ `analyticsStore.ts` - Pending
   - ⚠️ `profileStore.ts` - Pending

2. ✅ Stabilize Playwright harnesses:
   - ✅ Playwright configuration improved (timeouts, wait strategies) - **COMPLETE**
   - ⚠️ `feedsStore.ts` (resolve flake) - Pending
   - ⚠️ Add missing harnesses for stores that need them - Pending

### Phase 2: Medium Priority
1. Add RTL integration tests for remaining stores
2. Add Playwright harnesses for stores missing them
3. Expand test coverage for edge cases

### Phase 3: Low Priority
1. Performance optimization tests
2. Accessibility tests in harnesses
3. Cross-browser compatibility tests

## Related Documentation

- `docs/STATE_MANAGEMENT.md` - Store patterns and standards
- `docs/TESTING.md` - Testing guide and patterns
- `docs/ROADMAP_SINGLE_SOURCE.md` - Main roadmap (Section C)
- `web/tests/unit/stores/notification.integration.test.tsx` - Example RTL integration test
- `web/app/(app)/e2e/notification-store/page.tsx` - Example Playwright harness

## Notes

- Most stores have unit tests ✅
- Only `notificationStore` has RTL integration test ⚠️
- Most stores have Playwright harnesses ✅
- Focus should be on adding RTL integration tests and stabilizing harnesses
- Use `notificationStore` as the reference implementation


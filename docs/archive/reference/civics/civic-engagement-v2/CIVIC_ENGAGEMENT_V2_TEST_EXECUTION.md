# Civic Engagement V2 - Test Execution Guide

> **Archived (Jan 2026):** Use this only for historical context around the Civic Engagement V2 prototype. Current civic-action testing instructions are covered in `docs/TESTING.md` and tracked via `docs/FEATURE_STATUS.md#civic_engagement_v2`.

**Feature:** Civic Engagement V2  
**Date:** January 2025

---

## Overview

This guide provides instructions for running the test suite for Civic Engagement V2 features.

---

## Test Files

### Integration Tests
- `web/tests/integration/api/civic-actions.test.ts` - API endpoint tests

### Unit Tests
- `web/tests/unit/components/civic-actions/CivicActionCard.test.tsx` - Card component tests
- `web/tests/unit/components/civic-actions/CivicActionList.test.tsx` - List component tests
- `web/tests/unit/components/civic-actions/CreateCivicActionForm.test.tsx` - Form component tests
- `web/tests/unit/utils/sophisticated-civic-engagement.test.ts` - Utility function tests

### E2E Tests
- `web/tests/e2e/civic-actions.spec.ts` - End-to-end user flow tests

---

## Running Tests

### Run All Tests

```bash
cd web
npm test
```

### Run Integration Tests Only

```bash
npm test -- tests/integration/api/civic-actions.test.ts
```

### Run Unit Tests Only

```bash
# All unit tests
npm test -- tests/unit

# Component tests only
npm test -- tests/unit/components/civic-actions

# Utility tests only
npm test -- tests/unit/utils/sophisticated-civic-engagement.test.ts
```

### Run E2E Tests

```bash
npm run test:e2e -- tests/e2e/civic-actions.spec.ts
```

### Run with Coverage

```bash
npm test -- --coverage --collectCoverageFrom='web/app/api/civic-actions/**/*.ts' --collectCoverageFrom='web/features/civics/components/civic-actions/**/*.tsx' --collectCoverageFrom='web/lib/utils/sophisticated-civic-engagement.ts'
```

---

## Test Prerequisites

### 1. Feature Flag

Ensure the feature flag is enabled for tests:

```typescript
// In test setup or mocks
jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));
```

### 2. Database

Integration tests require:
- Mock Supabase client (already configured in tests)
- Or test database with migrations applied

### 3. Environment Variables

Tests should work with mocks, but if running against real database:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## Test Coverage

### Expected Coverage

- **API Routes:** 90%+
- **Components:** 80%+
- **Utilities:** 85%+

### View Coverage Report

```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## Test Scenarios

### Integration Tests

1. ✅ List actions with filters
2. ✅ Create action with validation
3. ✅ Get single action
4. ✅ Update action (ownership check)
5. ✅ Delete action (ownership check)
6. ✅ Sign action (duplicate prevention)
7. ✅ Feature flag gating
8. ✅ Authentication checks
9. ✅ Rate limiting

### Unit Tests - Components

1. ✅ CivicActionCard rendering
2. ✅ Progress bar display
3. ✅ Sign functionality
4. ✅ Status badges
5. ✅ CivicActionList loading/error states
6. ✅ Pagination
7. ✅ Filtering
8. ✅ CreateCivicActionForm validation
9. ✅ Form submission
10. ✅ Character counts

### Unit Tests - Utilities

1. ✅ createSophisticatedCivicAction
2. ✅ getRepresentativesByLocation
3. ✅ trackRepresentativeContact
4. ✅ getTrendingCivicActions
5. ✅ calculateCivicScore
6. ✅ calculateCommunityImpact
7. ✅ calculateTrustTier
8. ✅ getCivicEngagementRecommendations

### E2E Tests

1. ✅ Feature flag check
2. ✅ Create action flow
3. ✅ List and view actions
4. ✅ Sign petition flow
5. ✅ Filter actions
6. ✅ Analytics tracking
7. ⏳ Update/delete (pending UI)
8. ⏳ Representative integration (pending UI)
9. ⏳ Feed integration (pending UI)

---

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should create a new civic action"
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/integration/api/civic-actions.test.ts
```

### Verbose Output

```bash
npm test -- --verbose
```

---

## Common Issues

### Tests Failing Due to Feature Flag

**Issue:** Tests fail with "feature disabled" errors

**Solution:** Ensure feature flag mock is set up:
```typescript
jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));
```

### Mock Supabase Client Issues

**Issue:** Tests fail with "Cannot read property 'from' of undefined"

**Solution:** Ensure mock client is properly chained:
```typescript
mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
// ... chain all methods
```

### Async Test Timeouts

**Issue:** Tests timeout waiting for async operations

**Solution:** Increase timeout or ensure mocks resolve:
```typescript
jest.setTimeout(10000); // 10 seconds
```

---

## Continuous Integration

### CI Configuration

Tests should run automatically in CI. Ensure:

1. Feature flag is enabled in test environment
2. Mock Supabase client is used (no real DB needed)
3. All dependencies are installed
4. Test timeout is sufficient

### Example CI Step

```yaml
- name: Run Civic Engagement V2 Tests
  run: |
    cd web
    npm test -- tests/integration/api/civic-actions.test.ts
    npm test -- tests/unit/components/civic-actions
    npm test -- tests/unit/utils/sophisticated-civic-engagement.test.ts
```

---

## Test Maintenance

### Adding New Tests

1. Follow existing test patterns
2. Mock all external dependencies
3. Test both success and error cases
4. Include edge cases
5. Update test plan document

### Updating Tests

When API or component changes:
1. Update test mocks
2. Update test expectations
3. Verify all tests pass
4. Update coverage if needed

---

## Next Steps

1. ✅ Run integration tests
2. ✅ Run unit tests
3. ✅ Run E2E tests
4. ✅ Check coverage
5. ✅ Fix any failing tests
6. ✅ Update documentation

---

**Last Updated:** January 2025


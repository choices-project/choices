# Test Fixes In Progress

**Created**: January 29, 2025  
**Status**: ⏳ Working on API test fixes

## Current Issues

### API Tests (`tests/api/civics/contact.test.ts`)
**Status**: 5 failed, 5 passed

#### Failing Tests:
1. **GET: should return 404 when representative not found**
   - Issue: Mock returning success instead of error
   - Fix needed: Update mock to return proper error response

2. **POST: should log communication attempt for authenticated user**
   - Issue: Mock setup not matching actual endpoint table usage (`contact_threads`, `contact_messages`)
   - Fix needed: Update mocks to handle thread creation flow

3. **POST: should return 401 when user is not authenticated**
   - Issue: `jest.clearAllMocks()` clearing module mocks, then tests fail
   - Fix needed: Re-establish mocks properly after clearing

4. **POST: should return 400 when communication_type is missing**
   - Issue: Same as #3 - mock clearing issue
   - Fix needed: Re-establish mocks properly

5. **POST: should use authenticated user ID, not from request body**
   - Issue: Mock `from()` not being called correctly for `contact_messages` table
   - Fix needed: Fix mock setup for thread and message insertion flow

### E2E Tests
**Status**: Multiple failures due to UI element expectations

#### Issues:
- Tests expecting `[data-testid="address-input"]` but elements may not exist
- Tests timing out waiting for elements
- Tests failing due to 502 errors from endpoints (suggesting endpoint issues)

## Root Causes

1. **Mock Management**: `jest.clearAllMocks()` is too aggressive and breaks module mocks
2. **Table Schema Mismatch**: Tests using old table names (`civics_communication_log`) vs actual (`contact_messages`, `contact_threads`)
3. **Mock Complexity**: The POST endpoint has complex flow (find thread → create thread → insert message) that needs careful mocking

## Fix Strategy

1. ✅ Fix mock setup in `beforeEach` to handle `contact_threads` and `contact_messages`
2. ⏳ Remove `jest.clearAllMocks()` or re-establish mocks properly after clearing
3. ⏳ Update GET test mock to return proper 404 response
4. ⏳ Fix mock flow for POST tests to match actual endpoint behavior
5. ⏳ Fix E2E tests to handle missing UI elements gracefully

## Next Steps

1. Fix GET 404 test - update mock to return error
2. Fix POST tests - update mock setup to match endpoint flow
3. Remove or fix `jest.clearAllMocks()` usage
4. Run tests to verify fixes
5. Address E2E test issues after API tests are fixed



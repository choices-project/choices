# E2E Tests V2 Upgrade Guide

**Created:** January 21, 2025  
**Status:** In Progress - V2 Mock Factory Integration for E2E Tests  
**Priority:** Critical - Complete User Journey Validation

## 🎯 **E2E V2 Upgrade Overview**

E2E tests are fundamentally different from unit tests. They test complete user journeys in real browsers, but they can still benefit from the V2 mock factory for:

1. **Test Data Setup** - Using V2 mock factory for database seeding
2. **External API Mocking** - Improved API route mocking patterns
3. **Test Data Management** - Better test data preparation and cleanup
4. **Performance Optimization** - Faster test execution with proper setup
5. **Reliability Improvements** - More robust test patterns

## 🏗️ **E2E V2 Architecture**

### **Core Components**
```
tests/e2e/helpers/
├── e2e-setup.ts              # V2 mock factory integration for E2E
├── E2E_V2_UPGRADE_GUIDE.md   # This guide
└── [future helpers]          # Additional E2E-specific helpers

tests/e2e/
├── enhanced-voting-v2.spec.ts    # Example V2 E2E test
├── user-journeys-v2.spec.ts      # Example V2 E2E test
└── [other V2 upgraded tests]     # All E2E tests upgraded to V2
```

### **Key Differences from Unit Tests**
- **No direct database mocking** - E2E tests use real database interactions
- **V2 mock factory for setup** - Used for test data preparation, not runtime mocking
- **Browser automation** - Full Playwright browser testing
- **Real user journeys** - Complete workflows from start to finish
- **External API mocking** - Using Playwright's `page.route()` for external APIs

## 📋 **V2 E2E Test Pattern**

### **Standard V2 E2E Test Setup**
```typescript
import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Your E2E Test - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser(),
      poll: createTestPoll({
        title: 'V2 Test Poll',
        description: 'Testing with V2 mock factory setup',
        options: ['Option 1', 'Option 2', 'Option 3']
      })
    };

    // Set up test data using V2 mock factory
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should complete user journey with V2 setup', async ({ page }) => {
    // Your E2E test logic here
    // The V2 mock factory has prepared the test data
    // The browser will interact with real components
  });
});
```

### **V2 E2E Test Data Setup**
```typescript
// Create test data using V2 helpers
const testData = {
  user: createTestUser({
    email: 'custom@example.com',
    username: 'customuser'
  }),
  poll: createTestPoll({
    title: 'Custom Test Poll',
    votingMethod: 'approval'
  })
};

// Set up test data using V2 mock factory
await setupE2ETestData({
  user: testData.user,
  poll: testData.poll,
  votes: [
    { pollId: 'poll-1', optionId: 'option-1', userId: 'user-1' }
  ]
});
```

### **V2 External API Mocking**
```typescript
// Set up external API mocks
await setupExternalAPIMocks(page);

// Or set up custom mocks
await page.route('**/api/custom/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true })
  });
});
```

## 🔧 **E2E V2 Helper Functions**

### **Test Data Creation**
```typescript
// Create realistic test user
const user = createTestUser({
  email: 'test@example.com',
  username: 'testuser',
  password: 'TestPassword123!'
});

// Create realistic test poll
const poll = createTestPoll({
  title: 'Test Poll',
  description: 'Test description',
  options: ['Option 1', 'Option 2'],
  category: 'politics',
  privacy: 'public',
  votingMethod: 'single'
});
```

### **Test Data Setup**
```typescript
// Set up complete test data
await setupE2ETestData({
  user: testData.user,
  poll: testData.poll,
  votes: [
    { pollId: 'poll-1', optionId: 'option-1', userId: 'user-1' }
  ]
});
```

### **Page Ready Wait**
```typescript
// Wait for page to be ready for E2E testing
await waitForPageReady(page);
// This ensures:
// - Network is idle
// - Loading spinners are gone
// - Main content is visible
// - Everything is settled
```

### **External API Mocking**
```typescript
// Set up common external API mocks
await setupExternalAPIMocks(page);
// This mocks:
// - Google Civic Information API
// - Analytics API
// - Notification API
```

## 📝 **E2E V2 Upgrade Checklist**

### **For Each E2E Test File:**

#### **1. Import V2 Helpers**
- [ ] Import `setupE2ETestData`, `cleanupE2ETestData`
- [ ] Import `createTestUser`, `createTestPoll`
- [ ] Import `waitForPageReady`, `setupExternalAPIMocks`
- [ ] Import `E2E_CONFIG`

#### **2. Update Test Structure**
- [ ] Add `testData` variable for test data management
- [ ] Add `beforeEach` with V2 test data setup
- [ ] Add `afterEach` with V2 test data cleanup
- [ ] Use `waitForPageReady(page)` instead of manual waits

#### **3. Improve Test Data**
- [ ] Use `createTestUser()` for realistic user data
- [ ] Use `createTestPoll()` for realistic poll data
- [ ] Use `setupE2ETestData()` for complete test setup
- [ ] Use `cleanupE2ETestData()` for proper cleanup

#### **4. Enhance API Mocking**
- [ ] Use `setupExternalAPIMocks(page)` for common APIs
- [ ] Add custom API mocks as needed
- [ ] Use consistent mocking patterns

#### **5. Optimize Performance**
- [ ] Use `E2E_CONFIG.TIMEOUTS` for consistent timeouts
- [ ] Use `E2E_CONFIG.BROWSER.VIEWPORT` for viewport settings
- [ ] Minimize unnecessary waits and timeouts

#### **6. Improve Reliability**
- [ ] Use `waitForPageReady(page)` for consistent page loading
- [ ] Use proper error handling and assertions
- [ ] Use realistic test data that matches production

## 🚀 **E2E V2 Upgrade Process**

### **Phase 1: Core Infrastructure** ✅ **COMPLETE**
- [x] Create `e2e-setup.ts` with V2 mock factory integration
- [x] Create example V2 E2E tests
- [x] Create E2E V2 upgrade guide

### **Phase 2: Upgrade Critical E2E Tests** 🔄 **IN PROGRESS**
- [ ] Upgrade `user-journeys.spec.ts` to V2
- [ ] Upgrade `authentication-flow.spec.ts` to V2
- [ ] Upgrade `poll-management.spec.ts` to V2
- [ ] Upgrade `civics-fullflow.spec.ts` to V2

### **Phase 3: Upgrade All E2E Tests** ❌ **PENDING**
- [ ] Upgrade all 29 E2E test files to V2
- [ ] Verify all E2E tests pass with V2 setup
- [ ] Optimize E2E test performance
- [ ] Update E2E test documentation

### **Phase 4: Final Verification** ❌ **PENDING**
- [ ] Run full E2E test suite
- [ ] Verify V2 compliance across all E2E tests
- [ ] Performance testing and optimization
- [ ] Documentation updates

## 🎯 **E2E V2 Benefits**

### **Improved Test Data Management**
- **Realistic test data** - Using V2 helpers for consistent, realistic data
- **Proper setup/cleanup** - V2 mock factory handles test data lifecycle
- **Data isolation** - Each test gets clean, isolated test data

### **Enhanced Reliability**
- **Consistent page loading** - `waitForPageReady()` ensures pages are ready
- **Better API mocking** - Improved external API mocking patterns
- **Proper error handling** - V2 patterns include better error handling

### **Performance Optimization**
- **Faster test execution** - Optimized test data setup and cleanup
- **Reduced flakiness** - More reliable test patterns
- **Better resource management** - Proper cleanup prevents resource leaks

### **Maintainability**
- **Consistent patterns** - All E2E tests follow V2 patterns
- **Reusable helpers** - V2 helpers can be used across all E2E tests
- **Better documentation** - Clear upgrade guide and examples

## 🚨 **Critical Notes for E2E V2 Upgrade**

### **DO NOT:**
- Use V2 mock factory for runtime database mocking in E2E tests
- Skip proper test data cleanup
- Use unrealistic test data
- Ignore external API mocking

### **ALWAYS:**
- Use V2 helpers for test data creation and setup
- Use `waitForPageReady(page)` for page loading
- Use `setupExternalAPIMocks(page)` for external APIs
- Use proper test data cleanup in `afterEach`

### **Key Differences from Unit Tests:**
- **E2E tests use real database interactions** - V2 mock factory is for setup only
- **Browser automation is the focus** - Full user journey testing
- **External API mocking is important** - Use Playwright's `page.route()`
- **Test data setup is critical** - V2 mock factory provides this

---

**Last Updated:** January 21, 2025  
**Next Review:** After Phase 2 completion  
**Contact:** Continue with systematic E2E test upgrades

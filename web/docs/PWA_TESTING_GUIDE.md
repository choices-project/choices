# PWA Testing Guide

**Created:** 2024-12-19  
**Last Updated:** 2024-12-19

## 📋 Overview

This guide provides comprehensive testing strategies for the Progressive Web App (PWA) functionality in the Choices platform. It covers E2E testing, integration testing, and performance testing for all PWA features.

## 🧪 Test Structure

### Test Files

- **`pwa-installation.spec.ts`** - Tests PWA installation functionality
- **`pwa-offline.spec.ts`** - Tests offline capabilities and data sync
- **`pwa-service-worker.spec.ts`** - Tests service worker functionality
- **`pwa-notifications.spec.ts`** - Tests push notification system
- **`pwa-api.spec.ts`** - Tests PWA API endpoints
- **`pwa-integration.spec.ts`** - Tests complete PWA integration

### Test Helpers

- **`pwa-helpers.ts`** - Utility functions for PWA testing

## 🚀 Running PWA Tests

### Prerequisites

1. **Development Server**: Ensure the development server is running on port 3000
2. **PWA Features**: Ensure PWA features are enabled in feature flags
3. **Service Worker**: Ensure service worker is properly registered

### Running Tests

```bash
# Run all PWA tests
npm run test:e2e -- --project=pwa-tests

# Run PWA tests on mobile
npm run test:e2e -- --project=pwa-mobile-tests

# Run specific PWA test file
npm run test:e2e -- --project=pwa-tests pwa-installation.spec.ts

# Run PWA tests with debugging
npm run test:e2e -- --project=pwa-tests --debug

# Run PWA tests with UI mode
npm run test:e2e -- --project=pwa-tests --ui
```

### Test Configuration

The PWA tests are configured with specific settings:

```typescript
// Desktop PWA tests
{
  name: 'pwa-tests',
  testMatch: /.*pwa.*\.spec\.ts/,
  use: { 
    ...devices['Desktop Chrome'],
    permissions: ['notifications'],
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  },
}

// Mobile PWA tests
{
  name: 'pwa-mobile-tests',
  testMatch: /.*pwa.*\.spec\.ts/,
  use: { 
    ...devices['Pixel 5'],
    permissions: ['notifications'],
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
  },
}
```

## 📱 Test Scenarios

### 1. PWA Installation Tests

**File:** `pwa-installation.spec.ts`

**Test Cases:**
- ✅ PWA installation criteria detection
- ✅ Installation prompt display
- ✅ Installation acceptance flow
- ✅ Installation dismissal handling
- ✅ App installation detection
- ✅ Installation benefits display
- ✅ Installation error handling
- ✅ User preference respect

**Key Assertions:**
```typescript
// Check PWA support
expect(pwaSupported).toBe(true);

// Verify service worker registration
expect(swRegistered).toBe(true);

// Check installation prompt
await expect(installPrompt).toBeVisible();

// Verify installation success
await expect(successMessage).toBeVisible();
```

### 2. Offline Functionality Tests

**File:** `pwa-offline.spec.ts`

**Test Cases:**
- ✅ Offline status detection
- ✅ Online status detection
- ✅ Offline page display
- ✅ Offline vote storage
- ✅ Offline vote sync
- ✅ Sync error handling
- ✅ Offline data status display
- ✅ Manual sync functionality
- ✅ Resource caching
- ✅ Offline navigation

**Key Assertions:**
```typescript
// Check offline indicator
await expect(offlineIndicator).toBeVisible();

// Verify offline vote storage
await expect(offlineVotesIndicator).toBeVisible();

// Check sync success
await expect(syncMessage).toBeVisible();
```

### 3. Service Worker Tests

**File:** `pwa-service-worker.spec.ts`

**Test Cases:**
- ✅ Service worker registration
- ✅ Static asset caching
- ✅ Update management
- ✅ Cache strategies
- ✅ Background sync
- ✅ Push notifications
- ✅ Notification clicks
- ✅ Cache cleanup
- ✅ Error handling
- ✅ Version information

**Key Assertions:**
```typescript
// Check service worker registration
expect(swRegistered).toBe(true);

// Verify caching
expect(cachedResources.length).toBeGreaterThan(0);

// Check update notification
await expect(updateNotification).toBeVisible();
```

### 4. Notification Tests

**File:** `pwa-notifications.spec.ts`

**Test Cases:**
- ✅ Permission requests
- ✅ Permission denial handling
- ✅ Push subscription
- ✅ Unsubscription
- ✅ Notification display
- ✅ Notification interactions
- ✅ Preference management
- ✅ Error handling
- ✅ History tracking
- ✅ Rate limiting
- ✅ Preference respect

**Key Assertions:**
```typescript
// Check permission granted
expect(permissionGranted).toBe(true);

// Verify subscription
expect(subscribed).toBe(true);

// Check notification display
expect(notificationDisplayed).toBe(true);
```

### 5. API Endpoint Tests

**File:** `pwa-api.spec.ts`

**Test Cases:**
- ✅ PWA status endpoint
- ✅ Manifest endpoint
- ✅ Offline sync endpoint
- ✅ Notification subscription endpoints
- ✅ Notification send endpoint
- ✅ Error handling
- ✅ Data validation
- ✅ Rate limiting
- ✅ CORS headers
- ✅ Response format consistency

**Key Assertions:**
```typescript
// Check API response
expect(response.status()).toBe(200);

// Verify response structure
expect(data).toHaveProperty('success', true);

// Check error handling
expect(response.status()).toBe(400);
```

### 6. Integration Tests

**File:** `pwa-integration.spec.ts`

**Test Cases:**
- ✅ Complete installation workflow
- ✅ Complete offline workflow
- ✅ Complete notification workflow
- ✅ Dashboard integration
- ✅ Error recovery
- ✅ State persistence
- ✅ Performance metrics
- ✅ Accessibility
- ✅ Cross-browser compatibility
- ✅ User experience flow

**Key Assertions:**
```typescript
// Check complete workflow
expect(pwaSupported).toBe(true);
expect(swRegistered).toBe(true);
await expect(installPrompt).toBeVisible();

// Verify performance
expect(performanceMetrics.loadTime).toBeLessThan(3000);
```

## 🛠️ Test Helpers

### PWAHelpers Class

The `PWAHelpers` class provides utility functions for PWA testing:

```typescript
import { PWAHelpers } from './helpers/pwa-helpers';

const pwaHelpers = new PWAHelpers(page);

// Check PWA support
const support = await pwaHelpers.checkPWASupport();

// Mock service worker
await pwaHelpers.mockServiceWorkerRegistration(true);

// Mock notifications
await pwaHelpers.mockNotificationPermission('granted');

// Create offline vote
await pwaHelpers.createOfflineVote({
  id: 'test-vote',
  pollId: 'test-poll',
  optionIds: ['option-1']
});

// Mock push notification
await pwaHelpers.mockPushNotification({
  title: 'Test Notification',
  body: 'Test message'
});
```

### Common Helper Methods

- **`checkPWASupport()`** - Check browser PWA support
- **`waitForServiceWorker()`** - Wait for SW registration
- **`mockServiceWorkerRegistration()`** - Mock SW registration
- **`mockNotificationPermission()`** - Mock notification permission
- **`mockPushSubscription()`** - Mock push subscription
- **`mockInstallPrompt()`** - Mock installation prompt
- **`createOfflineVote()`** - Create offline vote data
- **`mockOfflineVoteSync()`** - Mock offline vote sync
- **`mockPushNotification()`** - Mock push notification
- **`setPWAPreferences()`** - Set PWA user preferences
- **`getPWAState()`** - Get current PWA state
- **`clearAllPWAData()`** - Clear all PWA data

## 📊 Test Data

### Mock Data

The tests use various mock data for different scenarios:

```typescript
// Offline vote data
const offlineVote = {
  id: 'test-vote-1',
  pollId: 'test-poll',
  optionIds: ['option-1'],
  timestamp: new Date().toISOString(),
  status: 'pending'
};

// Notification data
const notificationData = {
  title: 'Test Notification',
  body: 'Test message',
  tag: 'test-notification',
  data: { url: '/dashboard' }
};

// Push subscription data
const subscriptionData = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key'
  }
};
```

### Test Scenarios

1. **Happy Path**: All features work correctly
2. **Error Scenarios**: Network failures, permission denials
3. **Edge Cases**: Rapid interactions, state changes
4. **Performance**: Load times, resource usage
5. **Accessibility**: Screen readers, keyboard navigation

## 🔍 Debugging PWA Tests

### Common Issues

1. **Service Worker Not Registering**
   - Check if PWA features are enabled
   - Verify service worker file exists
   - Check browser console for errors

2. **Notifications Not Working**
   - Verify notification permission is granted
   - Check if push subscription is valid
   - Ensure VAPID keys are configured

3. **Offline Functionality Issues**
   - Check if service worker is caching resources
   - Verify offline vote storage is working
   - Check sync functionality

4. **Installation Prompt Not Showing**
   - Verify PWA criteria are met
   - Check if user has dismissed before
   - Ensure manifest is valid

### Debug Commands

```bash
# Run tests with debugging
npm run test:e2e -- --project=pwa-tests --debug

# Run specific test with debugging
npm run test:e2e -- --project=pwa-tests pwa-installation.spec.ts --debug

# Run tests with UI mode
npm run test:e2e -- --project=pwa-tests --ui

# Run tests with trace
npm run test:e2e -- --project=pwa-tests --trace on
```

### Debug Helpers

```typescript
// Take screenshot
await pwaHelpers.takePWAScreenshot('debug-state');

// Measure performance
const metrics = await pwaHelpers.measurePWAPerformance();

// Get PWA state
const state = await pwaHelpers.getPWAState();

// Clear all data
await pwaHelpers.clearAllPWAData();
```

## 📈 Performance Testing

### Metrics to Monitor

1. **Load Time**: < 3 seconds
2. **First Paint**: < 1.5 seconds
3. **First Contentful Paint**: < 2 seconds
4. **Service Worker Registration**: < 1 second
5. **Cache Performance**: < 500ms for cached resources

### Performance Test Example

```typescript
test('should meet performance requirements', async ({ page }) => {
  const metrics = await pwaHelpers.measurePWAPerformance();
  
  expect(metrics.loadTime).toBeLessThan(3000);
  expect(metrics.firstPaint).toBeLessThan(1500);
  expect(metrics.firstContentfulPaint).toBeLessThan(2000);
});
```

## 🌐 Cross-Browser Testing

### Supported Browsers

- **Chrome**: Full PWA support
- **Firefox**: Basic PWA support
- **Safari**: Limited PWA support
- **Edge**: Full PWA support

### Browser-Specific Tests

```typescript
// Chrome-specific features
test('should work in Chrome', async ({ page, browserName }) => {
  if (browserName === 'chromium') {
    // Test Chrome-specific PWA features
  }
});

// Safari-specific limitations
test('should handle Safari limitations', async ({ page, browserName }) => {
  if (browserName === 'webkit') {
    // Test Safari-specific behavior
  }
});
```

## 📱 Mobile Testing

### Mobile-Specific Considerations

1. **Touch Interactions**: Tap, swipe, pinch
2. **Viewport**: Different screen sizes
3. **Performance**: Slower devices
4. **Network**: Mobile data limitations
5. **Battery**: Power consumption

### Mobile Test Example

```typescript
test('should work on mobile devices', async ({ page }) => {
  // Test mobile-specific PWA features
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Test touch interactions
  await page.tap('[data-testid="pwa-install-button"]');
  
  // Test mobile performance
  const metrics = await pwaHelpers.measurePWAPerformance();
  expect(metrics.loadTime).toBeLessThan(5000); // More lenient for mobile
});
```

## 🚨 Error Handling

### Common Error Scenarios

1. **Network Failures**: Offline sync errors
2. **Permission Denials**: Notification permission denied
3. **Service Worker Errors**: Registration failures
4. **API Errors**: Backend service failures
5. **Browser Limitations**: Unsupported features

### Error Test Examples

```typescript
test('should handle network failures gracefully', async ({ page }) => {
  // Mock network failure
  await page.route('**/api/pwa/**', route => route.abort());
  
  // Test error handling
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});

test('should handle permission denials', async ({ page }) => {
  // Mock permission denial
  await pwaHelpers.mockNotificationPermission('denied');
  
  // Test graceful handling
  await expect(page.locator('[data-testid="permission-denied"]')).toBeVisible();
});
```

## 📋 Test Checklist

### Pre-Test Setup

- [ ] Development server running
- [ ] PWA features enabled
- [ ] Service worker registered
- [ ] Test data prepared
- [ ] Browser permissions set

### Test Execution

- [ ] Installation tests pass
- [ ] Offline functionality tests pass
- [ ] Service worker tests pass
- [ ] Notification tests pass
- [ ] API endpoint tests pass
- [ ] Integration tests pass

### Post-Test Cleanup

- [ ] Test data cleared
- [ ] Service worker unregistered
- [ ] Caches cleared
- [ ] Screenshots saved
- [ ] Performance metrics recorded

## 🔄 Continuous Integration

### CI Configuration

```yaml
# .github/workflows/pwa-tests.yml
name: PWA Tests
on: [push, pull_request]
jobs:
  pwa-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e -- --project=pwa-tests
```

### Test Reports

- **HTML Report**: Detailed test results
- **Screenshots**: Failed test screenshots
- **Videos**: Test execution videos
- **Traces**: Performance traces
- **Coverage**: Test coverage reports

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [PWA Testing Best Practices](https://web.dev/pwa-testing/)
- [Service Worker Testing](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Push Notification Testing](https://developers.google.com/web/fundamentals/push-notifications)

## 🎯 Conclusion

This comprehensive PWA testing guide ensures that all PWA features are thoroughly tested across different browsers, devices, and scenarios. The tests cover installation, offline functionality, notifications, service workers, and complete integration workflows.

Regular execution of these tests helps maintain PWA quality and ensures a consistent user experience across all platforms.

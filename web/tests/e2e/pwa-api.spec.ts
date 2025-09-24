/**
 * PWA API Endpoints E2E Tests - V2 Upgrade
 * 
 * Tests PWA API endpoints including:
 * - PWA status endpoint with V2 mock factory setup
 * - Offline sync endpoint
 * - Notification subscription endpoints
 * - Manifest endpoint
 * - Error handling and comprehensive testing
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect, type Page } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('PWA API Endpoints - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'pwa-api-test@example.com',
        username: 'pwaapitestuser',
        password: 'PwaApiTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 PWA API Test Poll',
        description: 'Testing PWA API with V2 setup',
        options: ['PWA Option 1', 'PWA Option 2', 'PWA Option 3'],
        category: 'general'
      })
    };

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

  test('should serve PWA status endpoint with V2 setup', async ({ page }) => {
    // Set up test data for PWA status testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.get('/api/pwa/status');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('features');
    expect(data).toHaveProperty('system');
    expect(data).toHaveProperty('timestamp');
    
    // Check PWA features
    expect(data.features).toHaveProperty('pwa', true);
    expect(data.features).toHaveProperty('offlineVoting', true);
    expect(data.features).toHaveProperty('pushNotifications', true);
    expect(data.features).toHaveProperty('backgroundSync', true);
  });

  test('should serve PWA status with user data with V2 setup', async ({ page }) => {
    // Set up test data for PWA status with user data testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.get('/api/pwa/status?userId=test-user&includeUserData=true');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('userId', 'test-user');
    expect(data.user).toHaveProperty('preferences');
    expect(data.user).toHaveProperty('stats');
  });

  test('should serve PWA manifest endpoint with V2 setup', async ({ page }) => {
    // Set up test data for PWA manifest testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.get('/manifest.json');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('short_name');
    expect(data).toHaveProperty('start_url');
    expect(data).toHaveProperty('display');
    expect(data).toHaveProperty('background_color');
    expect(data).toHaveProperty('theme_color');
    expect(data).toHaveProperty('icons');
  });

  test('should serve service worker endpoint with V2 setup', async ({ page }) => {
    // Set up test data for service worker testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.get('/sw.js');
    
    expect(response.status()).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('serviceWorker');
    expect(content).toContain('cache');
  });

  test('should handle PWA offline sync endpoint with V2 setup', async ({ page }) => {
    // Set up test data for offline sync testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Test offline sync endpoint
    const syncResponse = await page.request.post('/api/pwa/offline/sync', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        votes: [],
        deviceId: 'test-device',
        timestamp: new Date().toISOString()
      }
    });
    
    expect(syncResponse.status()).toBe(200);
    
    const syncData = await syncResponse.json();
    expect(syncData).toHaveProperty('success', true);
    expect(syncData).toHaveProperty('synced');
  });

  test('should handle PWA notification subscription with V2 setup', async ({ page }) => {
    // Set up test data for notification subscription testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Test notification subscription endpoint
    const subscriptionResponse = await page.request.post('/api/pwa/notifications/subscribe', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        },
        userId: testData.user.email
      }
    });
    
    expect(subscriptionResponse.status()).toBe(200);
    
    const subscriptionData = await subscriptionResponse.json();
    expect(subscriptionData).toHaveProperty('success', true);
    expect(subscriptionData).toHaveProperty('subscriptionId');
  });

  test('should handle PWA notification unsubscription with V2 setup', async ({ page }) => {
    // Set up test data for notification unsubscription testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Test notification unsubscription endpoint
    const unsubscriptionResponse = await page.request.delete('/api/pwa/notifications/subscribe?subscriptionId=test-subscription-id', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(unsubscriptionResponse.status()).toBe(200);
    
    const unsubscriptionData = await unsubscriptionResponse.json();
    expect(unsubscriptionData).toHaveProperty('success', true);
  });

  test('should handle PWA cache management with V2 setup', async ({ page }) => {
    // Set up test data for cache management testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Test offline sync status endpoint (replacing non-existent cache clear)
    const cacheResponse = await page.request.get('/api/pwa/offline/sync?deviceId=test-device', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(cacheResponse.status()).toBe(200);
    
    const cacheData = await cacheResponse.json();
    expect(cacheData).toHaveProperty('success', true);
    expect(cacheData).toHaveProperty('deviceId', 'test-device');
    expect(cacheData).toHaveProperty('syncStatus');
  });

  test('should handle PWA API error handling with V2 setup', async ({ page }) => {
    // Set up test data for error handling testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test invalid endpoint
    const invalidResponse = await page.request.get('/api/pwa/invalid');
    expect(invalidResponse.status()).toBe(404);

    // Test unauthorized access (should return 400 for missing required fields)
    const unauthorizedResponse = await page.request.post('/api/pwa/offline/sync', {
      data: {
        // Missing required fields: votes, deviceId, timestamp
      }
    });
    expect(unauthorizedResponse.status()).toBe(400);
  });

  test('should handle PWA API with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-pwa-api@example.com',
      username: 'regularpwaapi'
    });

    const adminUser = createTestUser({
      email: 'admin-pwa-api@example.com',
      username: 'adminpwaapi'
    });

    // Test regular user PWA API access
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    const regularLoginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: regularUser.email,
        password: regularUser.password
      }
    });
    
    const regularLoginData = await regularLoginResponse.json();
    const regularToken = regularLoginData.token;

    // Test regular user PWA endpoints
    const regularPwaResponse = await page.request.get('/api/pwa/status', {
      headers: {
        'Authorization': `Bearer ${regularToken}`
      }
    });
    
    expect(regularPwaResponse.status()).toBe(200);

    // Test admin user PWA API access
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    const adminLoginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: adminUser.email,
        password: adminUser.password
      }
    });
    
    const adminLoginData = await adminLoginResponse.json();
    const adminToken = adminLoginData.token;

    // Test admin user PWA endpoints
    const adminPwaResponse = await page.request.get('/api/pwa/status', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    expect(adminPwaResponse.status()).toBe(200);
  });

  test('should handle PWA API with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile PWA API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test mobile PWA endpoints
    const mobilePwaResponse = await page.request.get('/api/pwa/status');
    expect(mobilePwaResponse.status()).toBe(200);

    const mobileManifestResponse = await page.request.get('/manifest.json');
    expect(mobileManifestResponse.status()).toBe(200);
  });

  test('should handle PWA API with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;

    // Create a poll
    const createPollResponse = await page.request.post('/api/polls', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        title: testData.poll.title,
        description: testData.poll.description,
        options: testData.poll.options,
        category: testData.poll.category
      }
    });
    
    const _pollData = await createPollResponse.json();

    // Test PWA sync with poll data
    const syncResponse = await page.request.post('/api/pwa/offline/sync', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        votes: [],
        deviceId: 'test-device',
        timestamp: new Date().toISOString()
      }
    });
    
    expect(syncResponse.status()).toBe(200);
    
    const syncData = await syncResponse.json();
    expect(syncData).toHaveProperty('success', true);
  });

  test('should handle PWA API with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test civics PWA integration
    const civicsResponse = await page.request.post('/api/v1/civics/address-lookup', {
      data: {
        address: '123 Any St, Springfield, IL 62704'
      }
    });
    
    expect(civicsResponse.status()).toBe(200);
    
    const civicsData = await civicsResponse.json();
    expect(civicsData).toHaveProperty('district');
    expect(civicsData).toHaveProperty('state');

    // Test PWA status with civics context
    const pwaStatusResponse = await page.request.get('/api/pwa/status?civics=true');
    expect(pwaStatusResponse.status()).toBe(200);
    
    const pwaStatusData = await pwaStatusResponse.json();
    expect(pwaStatusData).toHaveProperty('civics');
  });

  test('should handle PWA API performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure PWA API performance
    const startTime = Date.now();

    // Test multiple PWA endpoints
    const responses = await Promise.all([
      page.request.get('/api/pwa/status'),
      page.request.get('/manifest.json'),
      page.request.get('/sw.js')
    ]);

    const endTime = Date.now();
    const pwaApiTime = endTime - startTime;

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });

    // Performance should be acceptable
    expect(pwaApiTime).toBeLessThan(3000);
  });

  test('should handle PWA API with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline PWA API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Test PWA API endpoints while offline
    const offlineResponse = await page.request.get('/api/pwa/status');
    expect(offlineResponse.status()).toBe(0); // Network error

    // Go back online
    await page.context().setOffline(false);

    // Test PWA API endpoints while online
    const onlineResponse = await page.request.get('/api/pwa/status');
    expect(onlineResponse.status()).toBe(200);
  });

  test('should handle PWA API with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn PWA API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test WebAuthn PWA integration
    const webauthnResponse = await page.request.post('/api/v1/auth/webauthn/register/options', {
      data: {}
    });
    
    expect(webauthnResponse.status()).toBe(200);
    
    const webauthnData = await webauthnResponse.json();
    expect(webauthnData).toHaveProperty('challenge');

    // Test PWA status with WebAuthn context
    const pwaStatusResponse = await page.request.get('/api/pwa/status?webauthn=true');
    expect(pwaStatusResponse.status()).toBe(200);
    
    const pwaStatusData = await pwaStatusResponse.json();
    expect(pwaStatusData).toHaveProperty('webauthn');
  });
});

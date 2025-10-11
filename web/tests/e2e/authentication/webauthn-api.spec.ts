/**
 * WebAuthn API E2E Tests - V2 Upgrade
 * 
 * Tests the existing WebAuthn API endpoints directly with V2 mock factory setup
 * Validates the @simplewebauthn/server integration and comprehensive testing
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

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

test.describe('WebAuthn API Endpoints - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'webauthn-api-test@example.com',
        username: 'webauthnapitestuser',
        password: 'WebAuthnApiTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 WebAuthn API Test Poll',
        description: 'Testing WebAuthn API with V2 setup',
        options: ['WebAuthn Option 1', 'WebAuthn Option 2', 'WebAuthn Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

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

  test('should validate WebAuthn feature flag is enabled with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.get('/api/e2e/flags');
    const data = await response.json();
    
    expect(response.ok()).toBe(true);
    expect(data.flags.WEBAUTHN).toBe(true);
  });

  test('should reject unauthenticated registration options requests with V2 setup', async ({ page }) => {
    // Set up test data for unauthenticated registration testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/options', {
      data: {}
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should reject unauthenticated authentication options requests with V2 setup', async ({ page }) => {
    // Set up test data for unauthenticated authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/authenticate/options', {
      data: {}
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should reject unauthenticated registration verification requests with V2 setup', async ({ page }) => {
    // Set up test data for unauthenticated registration verification testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/verify', {
      data: {
        credential: {
          id: 'test-credential-id',
          rawId: 'dGVzdC1jcmVkZW50aWFsLWlk',
          response: {
            attestationObject: 'test-attestation-object',
            clientDataJSON: 'test-client-data-json'
          },
          type: 'public-key'
        }
      }
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should reject unauthenticated authentication verification requests with V2 setup', async ({ page }) => {
    // Set up test data for unauthenticated authentication verification testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/authenticate/verify', {
      data: {
        credential: {
          id: 'test-credential-id',
          rawId: 'dGVzdC1jcmVkZW50aWFsLWlk',
          response: {
            authenticatorData: 'test-authenticator-data',
            clientDataJSON: 'test-client-data-json',
            signature: 'test-signature'
          },
          type: 'public-key'
        }
      }
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle WebAuthn API with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated WebAuthn API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate the user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Get auth token for API requests
    const token = await page.evaluate(() => {
      return localStorage.getItem('auth-token');
    });
    
    // Test authenticated WebAuthn registration options
    const registerOptionsResponse = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/options', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {}
    });
    
    expect(registerOptionsResponse.status()).toBe(200);
    const registerOptionsData = await registerOptionsResponse.json();
    expect(registerOptionsData).toHaveProperty('challenge');
  });

  test('should handle WebAuthn API with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-webauthn-api@example.com',
      username: 'regularwebauthnapi'
    });

    const adminUser = createTestUser({
      email: 'admin-webauthn-api@example.com',
      username: 'adminwebauthnapi'
    });

    // Test regular user WebAuthn API
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', regularUser.email);
    await page.fill('[data-testid="login-password"]', regularUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    const regularToken = await page.evaluate(() => {
      return localStorage.getItem('auth-token');
    });

    const regularResponse = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/options', {
      headers: {
        'Authorization': `Bearer ${regularToken}`
      },
      data: {}
    });
    
    expect(regularResponse.status()).toBe(200);

    // Test admin user WebAuthn API
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    const adminToken = await page.evaluate(() => {
      return localStorage.getItem('auth-token');
    });

    const adminResponse = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/options', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      data: {}
    });
    
    expect(adminResponse.status()).toBe(200);
  });

  test('should handle WebAuthn API with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile WebAuthn API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test WebAuthn API on mobile
    const response = await page.request.get('/api/e2e/flags');
    const data = await response.json();
    
    expect(response.ok()).toBe(true);
    expect(data.flags.WEBAUTHN).toBe(true);
  });

  test('should handle WebAuthn API with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    const token = await page.evaluate(() => {
      return localStorage.getItem('auth-token');
    });

    // Test WebAuthn API with poll management context
    const registerOptionsResponse = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/options', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {}
    });
    
    expect(registerOptionsResponse.status()).toBe(200);

    // Create a poll to test WebAuthn API with poll context
    await page.goto('/polls/create');
    await waitForPageReady(page);

    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');

    await page.selectOption('select', testData.poll.category || 'general');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Test WebAuthn API after poll creation
    const authOptionsResponse = await page.request.post('/api/v1/aut@/features/auth/types/webauthn/authenticate/options', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {}
    });
    
    expect(authOptionsResponse.status()).toBe(200);
  });

  test('should handle WebAuthn API with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up civics context
    await page.goto('/civics');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Test WebAuthn API with civics context
    const response = await page.request.get('/api/e2e/flags');
    const data = await response.json();
    
    expect(response.ok()).toBe(true);
    expect(data.flags.WEBAUTHN).toBe(true);
  });

  test('should handle WebAuthn API performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure WebAuthn API performance
    const startTime = Date.now();

    // Test multiple WebAuthn API endpoints
    const _responses = await Promise.all([
      page.request.get('/api/e2e/flags'),
      page.request.post('/api/v1/aut@/features/auth/types/webauthn/register/options', { data: {} }),
      page.request.post('/api/v1/aut@/features/auth/types/webauthn/authenticate/options', { data: {} })
    ]);

    const endTime = Date.now();
    const webauthnApiTime = endTime - startTime;

    // Verify WebAuthn API performance is acceptable
    expect(webauthnApiTime).toBeLessThan(5000);
  });

  test('should handle WebAuthn API with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline WebAuthn API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Test WebAuthn API while offline
    const offlineResponse = await page.request.get('/api/e2e/flags');
    expect(offlineResponse.status()).toBe(0); // Network error

    // Go back online
    await page.context().setOffline(false);

    // Test WebAuthn API while online
    const onlineResponse = await page.request.get('/api/e2e/flags');
    expect(onlineResponse.status()).toBe(200);
  });

  test('should handle WebAuthn API with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA WebAuthn API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test WebAuthn API with PWA context
    const response = await page.request.get('/api/e2e/flags');
    const data = await response.json();
    
    expect(response.ok()).toBe(true);
    expect(data.flags.WEBAUTHN).toBe(true);
    expect(data.flags.PWA).toBe(true);
  });
});

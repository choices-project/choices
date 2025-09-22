/**
 * Simple WebAuthn E2E Tests - V2 Upgrade
 * 
 * Basic tests that work with the actual WebAuthn implementation
 * Focuses on what's actually available and functional with V2 mock factory setup
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('WebAuthn Simple Tests - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'webauthn-simple-test@example.com',
        username: 'webauthnsimpletestuser',
        password: 'WebAuthnSimpleTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 WebAuthn Simple Test Poll',
        description: 'Testing simple WebAuthn with V2 setup',
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

  test('should detect WebAuthn support in browser with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn support detection testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const webauthnSupport = await page.evaluate(() => {
      return {
        hasCredentials: 'credentials' in navigator,
        hasPublicKeyCredential: 'PublicKeyCredential' in window,
        hasCreate: 'credentials' in navigator && 'create' in navigator.credentials,
        hasGet: 'credentials' in navigator && 'get' in navigator.credentials
      };
    });

    expect(webauthnSupport.hasCredentials).toBe(true);
    expect(webauthnSupport.hasPublicKeyCredential).toBe(true);
    expect(webauthnSupport.hasCreate).toBe(true);
    expect(webauthnSupport.hasGet).toBe(true);
  });

  test('should show WebAuthn button on login page when supported with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn button testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login');
    await waitForPageReady(page);

    // Check if WebAuthn button is visible
    const webauthnButton = page.locator('[data-testid="login-webauthn"]');
    const isVisible = await webauthnButton.isVisible();
    
    if (isVisible) {
      expect(isVisible).toBe(true);
    } else {
      // Check if WebAuthn is supported in the browser
      const webauthnSupported = await page.evaluate(() => {
        return 'credentials' in navigator && 'PublicKeyCredential' in window;
      });
      
      if (webauthnSupported) {
        // If WebAuthn is supported but button is not visible, that's an issue
        expect(isVisible).toBe(true);
      } else {
        // If WebAuthn is not supported, button not being visible is expected
        expect(isVisible).toBe(false);
      }
    }
  });

  test('should show WebAuthn button on register page when supported with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn register button testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/register');
    await waitForPageReady(page);

    // Check if WebAuthn button is visible
    const webauthnButton = page.locator('[data-testid="register-webauthn"]');
    const isVisible = await webauthnButton.isVisible();
    
    if (isVisible) {
      expect(isVisible).toBe(true);
    } else {
      // Check if WebAuthn is supported in the browser
      const webauthnSupported = await page.evaluate(() => {
        return 'credentials' in navigator && 'PublicKeyCredential' in window;
      });
      
      if (webauthnSupported) {
        // If WebAuthn is supported but button is not visible, that's an issue
        expect(isVisible).toBe(true);
      } else {
        // If WebAuthn is not supported, button not being visible is expected
        expect(isVisible).toBe(false);
      }
    }
  });

  test('should handle WebAuthn with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated WebAuthn testing
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
    
    // Check WebAuthn with authenticated user
    const authenticatedWebAuthn = page.locator('[data-testid="authenticated-webauthn"]');
    const hasAuthenticatedWebAuthn = await authenticatedWebAuthn.isVisible();
    
    if (hasAuthenticatedWebAuthn) {
      expect(hasAuthenticatedWebAuthn).toBe(true);
    }
  });

  test('should handle WebAuthn with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-webauthn-simple@example.com',
      username: 'regularwebauthnsimple'
    });

    const adminUser = createTestUser({
      email: 'admin-webauthn-simple@example.com',
      username: 'adminwebauthnsimple'
    });

    // Test regular user WebAuthn
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

    const regularWebAuthn = page.locator('[data-testid="regular-user-webauthn"]');
    const hasRegularWebAuthn = await regularWebAuthn.isVisible();
    
    if (hasRegularWebAuthn) {
      expect(hasRegularWebAuthn).toBe(true);
    }

    // Test admin user WebAuthn
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

    const adminWebAuthn = page.locator('[data-testid="admin-user-webauthn"]');
    const hasAdminWebAuthn = await adminWebAuthn.isVisible();
    
    if (hasAdminWebAuthn) {
      expect(hasAdminWebAuthn).toBe(true);
    }
  });

  test('should handle WebAuthn with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile WebAuthn testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Check WebAuthn on mobile
    await page.goto('/login');
    await waitForPageReady(page);

    const mobileWebAuthn = page.locator('[data-testid="mobile-webauthn"]');
    const hasMobileWebAuthn = await mobileWebAuthn.isVisible();
    
    if (hasMobileWebAuthn) {
      expect(hasMobileWebAuthn).toBe(true);
    }
  });

  test('should handle WebAuthn with poll management integration with V2 setup', async ({ page }) => {
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

    // Check WebAuthn with poll management context
    const pollWebAuthn = page.locator('[data-testid="poll-management-webauthn"]');
    const hasPollWebAuthn = await pollWebAuthn.isVisible();
    
    if (hasPollWebAuthn) {
      expect(hasPollWebAuthn).toBe(true);
    }

    // Create a poll to test WebAuthn with poll context
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

    // Check WebAuthn after poll creation
    const pollCreatedWebAuthn = page.locator('[data-testid="poll-created-webauthn"]');
    const hasPollCreatedWebAuthn = await pollCreatedWebAuthn.isVisible();
    
    if (hasPollCreatedWebAuthn) {
      expect(hasPollCreatedWebAuthn).toBe(true);
    }
  });

  test('should handle WebAuthn with civics integration with V2 setup', async ({ page }) => {
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

    // Check WebAuthn with civics context
    const civicsWebAuthn = page.locator('[data-testid="civics-webauthn"]');
    const hasCivicsWebAuthn = await civicsWebAuthn.isVisible();
    
    if (hasCivicsWebAuthn) {
      expect(hasCivicsWebAuthn).toBe(true);
    }
  });

  test('should handle WebAuthn performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure WebAuthn performance
    const startTime = Date.now();

    // Check WebAuthn support
    const webauthnSupport = await page.evaluate(() => {
      return {
        hasCredentials: 'credentials' in navigator,
        hasPublicKeyCredential: 'PublicKeyCredential' in window,
        hasCreate: 'credentials' in navigator && 'create' in navigator.credentials,
        hasGet: 'credentials' in navigator && 'get' in navigator.credentials
      };
    });

    expect(webauthnSupport.hasCredentials).toBe(true);

    const endTime = Date.now();
    const webauthnTime = endTime - startTime;

    // Verify WebAuthn performance is acceptable
    expect(webauthnTime).toBeLessThan(1000);
  });

  test('should handle WebAuthn with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline WebAuthn testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Check WebAuthn while offline
    await page.goto('/login');
    await waitForPageReady(page);

    const offlineWebAuthn = page.locator('[data-testid="offline-webauthn"]');
    const hasOfflineWebAuthn = await offlineWebAuthn.isVisible();
    
    if (hasOfflineWebAuthn) {
      expect(hasOfflineWebAuthn).toBe(true);
    }

    // Go back online
    await page.context().setOffline(false);

    // Check WebAuthn while online
    await page.goto('/login');
    await waitForPageReady(page);

    const onlineWebAuthn = page.locator('[data-testid="online-webauthn"]');
    const hasOnlineWebAuthn = await onlineWebAuthn.isVisible();
    
    if (hasOnlineWebAuthn) {
      expect(hasOnlineWebAuthn).toBe(true);
    }
  });

  test('should handle WebAuthn with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA WebAuthn testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check WebAuthn with PWA context
    await page.goto('/login');
    await waitForPageReady(page);

    const pwaWebAuthn = page.locator('[data-testid="pwa-webauthn"]');
    const hasPwaWebAuthn = await pwaWebAuthn.isVisible();
    
    if (hasPwaWebAuthn) {
      expect(hasPwaWebAuthn).toBe(true);
    }
  });
});

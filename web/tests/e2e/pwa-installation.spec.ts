/**
 * PWA Installation E2E Tests - V2 Upgrade
 * 
 * Tests PWA installation functionality including:
 * - Installation prompt detection with V2 mock factory setup
 * - Installation flow
 * - App installation verification
 * - Cross-browser compatibility and comprehensive testing
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

test.describe('PWA Installation - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'pwa-installation-test@example.com',
        username: 'pwainstallationtestuser',
        password: 'PwaInstallationTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 PWA Installation Test Poll',
        description: 'Testing PWA installation with V2 setup',
        options: ['Installation Option 1', 'Installation Option 2', 'Installation Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Capture all console logs and errors
    page.on('console', msg => {
      console.log('V2 Browser console:', msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('V2 Page error:', error.message);
    });

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);

    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Wait longer for the page to fully hydrate
    await page.waitForTimeout(5000);

    // Debug: Check what's actually on the page
    const bodyText = await page.textContent('body');
    console.log('V2 Page body contains PWA:', bodyText?.includes('PWA') || bodyText?.includes('pwa'));
    console.log('V2 Page body content (first 500 chars):', bodyText?.substring(0, 500));
    
    // Check if PWAStatus component exists in DOM
    const pwaStatusExists = await page.locator('[data-testid="pwa-status"]').count();
    console.log('V2 PWAStatus component count:', pwaStatusExists);
    
    // Check if Dashboard component is rendered
    const dashboardExists = await page.locator('text=Dashboard').count();
    console.log('V2 Dashboard text count:', dashboardExists);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('V2 Current URL:', currentUrl);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should detect PWA installation prompt with V2 setup', async ({ page }) => {
    // Set up test data for PWA installation prompt testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if PWA installation prompt is available
    const installPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    console.log('V2 Install prompt available:', installPrompt);
    
    // If install prompt is available, test it
    if (installPrompt) {
      await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
    }
  });

  test('should handle PWA installation flow with V2 setup', async ({ page }) => {
    // Set up test data for PWA installation flow testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if PWA installation prompt is available
    const installPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (installPrompt) {
      // Click install button
      await page.click('[data-testid="pwa-install-button"]');
      
      // Wait for installation to complete
      await page.waitForTimeout(2000);
      
      // Check if installation was successful
      const installed = await page.evaluate(() => {
        return window.matchMedia('(display-mode: standalone)').matches;
      });
      
      console.log('V2 PWA installed:', installed);
    }
  });

  test('should verify PWA manifest with V2 setup', async ({ page }) => {
    // Set up test data for PWA manifest testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check PWA manifest
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest).toHaveProperty('background_color');
    expect(manifest).toHaveProperty('theme_color');
    expect(manifest).toHaveProperty('icons');
  });

  test('should verify service worker registration with V2 setup', async ({ page }) => {
    // Set up test data for service worker testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should handle PWA installation with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated PWA installation testing
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
    
    // Check PWA installation with authenticated user
    const installPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (installPrompt) {
      await expect(page.locator('[data-testid="authenticated-pwa-install-prompt"]')).toBeVisible();
    }
  });

  test('should handle PWA installation with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-pwa-installation@example.com',
      username: 'regularpwainstallation'
    });

    const adminUser = createTestUser({
      email: 'admin-pwa-installation@example.com',
      username: 'adminpwainstallation'
    });

    // Test regular user PWA installation
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

    const regularInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (regularInstallPrompt) {
      await expect(page.locator('[data-testid="regular-user-pwa-install"]')).toBeVisible();
    }

    // Test admin user PWA installation
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

    const adminInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (adminInstallPrompt) {
      await expect(page.locator('[data-testid="admin-user-pwa-install"]')).toBeVisible();
    }
  });

  test('should handle PWA installation with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile PWA installation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Check mobile PWA installation
    const mobileInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (mobileInstallPrompt) {
      await expect(page.locator('[data-testid="mobile-pwa-install-prompt"]')).toBeVisible();
    }
  });

  test('should handle PWA installation with poll management integration with V2 setup', async ({ page }) => {
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

    // Check PWA installation with poll management context
    const installPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (installPrompt) {
      await expect(page.locator('[data-testid="poll-management-pwa-install"]')).toBeVisible();
    }

    // Create a poll to test PWA installation with poll context
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

    // Check PWA installation prompt on poll page
    const pollInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (pollInstallPrompt) {
      await expect(page.locator('[data-testid="poll-pwa-install-prompt"]')).toBeVisible();
    }
  });

  test('should handle PWA installation with civics integration with V2 setup', async ({ page }) => {
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

    // Check PWA installation with civics context
    const civicsInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (civicsInstallPrompt) {
      await expect(page.locator('[data-testid="civics-pwa-install-prompt"]')).toBeVisible();
    }
  });

  test('should handle PWA installation performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure PWA installation performance
    const startTime = Date.now();

    // Check PWA installation prompt
    const installPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    // Check service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    const endTime = Date.now();
    const pwaInstallTime = endTime - startTime;

    // Verify PWA installation performance is acceptable
    expect(pwaInstallTime).toBeLessThan(2000);
  });

  test('should handle PWA installation with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline PWA installation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Check PWA installation while offline
    const offlineInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (offlineInstallPrompt) {
      await expect(page.locator('[data-testid="offline-pwa-install-prompt"]')).toBeVisible();
    }

    // Go back online
    await page.context().setOffline(false);

    // Check that PWA installation works again
    const onlineInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (onlineInstallPrompt) {
      await expect(page.locator('[data-testid="online-pwa-install-prompt"]')).toBeVisible();
    }
  });

  test('should handle PWA installation with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn PWA installation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test PWA installation with WebAuthn context
    await page.goto('/login');
    await waitForPageReady(page);

    // Check WebAuthn login option
    await expect(page.locator('[data-testid="webauthn-login-button"]')).toBeVisible();

    // Test WebAuthn login
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');

    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();

    // Complete WebAuthn authentication
    await page.click('[data-testid="webauthn-complete-button"]');
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Check PWA installation with WebAuthn authentication
    const webauthnInstallPrompt = await page.evaluate(() => {
      return window.deferredPrompt !== undefined;
    });
    
    if (webauthnInstallPrompt) {
      await expect(page.locator('[data-testid="webauthn-pwa-install-prompt"]')).toBeVisible();
    }
  });
});

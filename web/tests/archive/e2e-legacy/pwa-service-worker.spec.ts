/**
 * PWA Service Worker E2E Tests - V2 Upgrade
 * 
 * Tests service worker functionality including:
 * - Service worker registration with V2 mock factory setup
 * - Caching strategies and update management
 * - Background sync and push notifications
 * - Comprehensive service worker testing
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

test.describe('PWA Service Worker - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'pwa-service-worker-test@example.com',
        username: 'pwaserviceworkertestuser',
        password: 'PwaServiceWorkerTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 PWA Service Worker Test Poll',
        description: 'Testing PWA service worker with V2 setup',
        options: ['Service Worker Option 1', 'Service Worker Option 2', 'Service Worker Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should register service worker with V2 setup', async ({ page }) => {
    // Set up test data for service worker registration testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    // Check service worker status
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return {
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting
          };
        }
      }
      return null;
    });
    
    expect(swStatus).not.toBeNull();
    expect(swStatus?.active).toBe(true);
  });

  test('should handle service worker caching with V2 setup', async ({ page }) => {
    // Set up test data for service worker caching testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    // Check cache storage
    const cacheAvailable = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        return cacheNames.length > 0;
      }
      return false;
    });
    
    expect(cacheAvailable).toBe(true);
  });

  test('should handle service worker updates with V2 setup', async ({ page }) => {
    // Set up test data for service worker update testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    // Check for service worker updates
    const updateAvailable = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return !!registration.waiting;
        }
      }
      return false;
    });
    
    // Update may or may not be available depending on deployment
    console.log('V2 Service worker update available:', updateAvailable);
  });

  test('should handle background sync with V2 setup', async ({ page }) => {
    // Set up test data for background sync testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if service worker supports background sync
    const backgroundSyncSupported = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return registration.sync !== undefined;
        }
      }
      return false;
    });
    
    expect(backgroundSyncSupported).toBe(true);
  });

  test('should handle push notifications with V2 setup', async ({ page }) => {
    // Set up test data for push notifications testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check if service worker supports push notifications
    const pushSupported = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return registration.pushManager !== undefined;
        }
      }
      return false;
    });
    
    expect(pushSupported).toBe(true);
  });

  test('should handle service worker with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated service worker testing
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
    
    // Check service worker with authenticated user
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should handle service worker with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-service-worker@example.com',
      username: 'regularserviceworker'
    });

    const adminUser = createTestUser({
      email: 'admin-service-worker@example.com',
      username: 'adminserviceworker'
    });

    // Test regular user service worker
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

    const regularSwRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(regularSwRegistered).toBe(true);

    // Test admin user service worker
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

    const adminSwRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(adminSwRegistered).toBe(true);
  });

  test('should handle service worker with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile service worker testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Check service worker on mobile
    const mobileSwRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(mobileSwRegistered).toBe(true);
  });

  test('should handle service worker with poll management integration with V2 setup', async ({ page }) => {
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

    // Check service worker with poll management context
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    // Create a poll to test service worker with poll context
    await page.goto('/polls/create');
    await waitForPageReady(page);

    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');

    await page.selectOption('select', testData.poll.category ?? 'general');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Check service worker is still active after poll creation
    const swStillActive = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration?.active;
      }
      return false;
    });
    
    expect(swStillActive).toBe(true);
  });

  test('should handle service worker with civics integration with V2 setup', async ({ page }) => {
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
    await page.waitForResponse((response) => 
      response.url().includes('/api/v1/civics/address-lookup') || 
      response.url().includes('/api/v1/civics/address-lookup')
    );

    // Check service worker with civics context
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should handle service worker performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure service worker performance
    const startTime = Date.now();

    // Check service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    const endTime = Date.now();
    const swTime = endTime - startTime;

    // Verify service worker performance is acceptable
    expect(swTime).toBeLessThan(2000);
  });

  test('should handle service worker with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline service worker testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    // Go offline
    await page.context().setOffline(true);

    // Check service worker still works offline
    const swStillActive = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration?.active;
      }
      return false;
    });
    
    expect(swStillActive).toBe(true);

    // Go back online
    await page.context().setOffline(false);

    // Check service worker still works online
    const swStillActiveOnline = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration?.active;
      }
      return false;
    });
    
    expect(swStillActiveOnline).toBe(true);
  });

  test('should handle service worker with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn service worker testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test WebAuthn authentication
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

    // Check service worker with WebAuthn authentication
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });
});

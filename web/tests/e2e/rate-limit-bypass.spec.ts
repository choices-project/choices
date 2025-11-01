/**
 * Test rate limiting bypass for E2E tests - V2 Upgrade
 * 
 * This test verifies that our E2E bypass header works correctly
 * with V2 mock factory setup and improved test patterns.
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

test.describe('Rate Limiting Bypass - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'rate-limit-bypass-test@example.com',
        username: 'ratelimitbypasstestuser',
        password: 'RateLimitBypassTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Rate Limit Bypass Test Poll',
        description: 'Testing rate limit bypass with V2 setup',
        options: ['Bypass Option 1', 'Bypass Option 2', 'Bypass Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should bypass rate limiting with E2E header with V2 setup', async ({ page }) => {
    // Set up test data for rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to login page multiple times to test rate limiting
    for (let i = 0; i < 5; i++) {
      await page.goto('/login?e2e=1');
      await waitForPageReady(page);
      
      // Should be able to access login page without rate limiting
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(100);
    }
  });

  test('should show login form elements with V2 setup', async ({ page }) => {
    // Set up test data for login form testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    // Verify login form elements exist
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('should bypass rate limiting with E2E query parameter with V2 setup', async ({ page }) => {
    // Set up test data for query parameter bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to different pages with E2E query parameter
    const pages = ['/login', '/register', '/polls', '/dashboard', '/civics'];
    
    for (const pagePath of pages) {
      for (let i = 0; i < 3; i++) {
        await page.goto(`${pagePath}?e2e=1`);
        await waitForPageReady(page);
        
        // Should be able to access page without rate limiting
        expect(page.url()).toContain(pagePath);
        
        // Small delay
        await page.waitForTimeout(100);
      }
    }
  });

  test('should bypass rate limiting with E2E cookie with V2 setup', async ({ page }) => {
    // Set up test data for cookie bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set E2E cookie
    await page.context().addCookies([{
      name: 'E2E',
      value: '1',
      domain: 'localhost',
      path: '/'
    }]);

    // Navigate to different pages
    const pages = ['/login', '/register', '/polls', '/dashboard', '/civics'];
    
    for (const pagePath of pages) {
      for (let i = 0; i < 3; i++) {
        await page.goto(pagePath);
        await waitForPageReady(page);
        
        // Should be able to access page without rate limiting
        expect(page.url()).toContain(pagePath);
        
        // Small delay
        await page.waitForTimeout(100);
      }
    }
  });

  test('should bypass rate limiting with API requests with V2 setup', async ({ page }) => {
    // Set up test data for API rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test API endpoints with E2E bypass
    const endpoints = [
      '/api/pwa/status',
      '/api/polls',
      '/manifest.json',
      '/sw.js'
    ];

    for (const endpoint of endpoints) {
      for (let i = 0; i < 5; i++) {
        const response = await page.request.get(`${endpoint}?e2e=1`);
        
        // Should get successful response, not rate limited
        expect(response.status()).toBeLessThan(400);
        
        // Small delay
        await page.waitForTimeout(100);
      }
    }
  });

  test('should bypass rate limiting with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate the user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Test authenticated endpoints with E2E bypass
    const authenticatedPages = ['/dashboard', '/profile', '/polls/create'];
    
    for (const pagePath of authenticatedPages) {
      for (let i = 0; i < 3; i++) {
        await page.goto(`${pagePath}?e2e=1`);
        await waitForPageReady(page);
        
        // Should be able to access authenticated page without rate limiting
        expect(page.url()).toContain(pagePath);
        
        // Small delay
        await page.waitForTimeout(100);
      }
    }
  });

  test('should bypass rate limiting with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-bypass@example.com',
      username: 'regularbypass'
    });

    const adminUser = createTestUser({
      email: 'admin-bypass@example.com',
      username: 'adminbypass'
    });

    // Test regular user rate limiting bypass
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    for (let i = 0; i < 3; i++) {
      await page.goto('/login?e2e=1');
      await waitForPageReady(page);
      
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
      await page.waitForTimeout(100);
    }

    // Test admin user rate limiting bypass
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    for (let i = 0; i < 3; i++) {
      await page.goto('/login?e2e=1');
      await waitForPageReady(page);
      
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
      await page.waitForTimeout(100);
    }
  });

  test('should bypass rate limiting with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test rate limiting bypass on mobile
    for (let i = 0; i < 5; i++) {
      await page.goto('/login?e2e=1');
      await waitForPageReady(page);
      
      // Should be able to access login page without rate limiting on mobile
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
      
      // Small delay
      await page.waitForTimeout(100);
    }
  });

  test('should bypass rate limiting with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Test poll management with rate limiting bypass
    const pollPages = ['/polls', '/polls/create'];
    
    for (const pagePath of pollPages) {
      for (let i = 0; i < 3; i++) {
        await page.goto(`${pagePath}?e2e=1`);
        await waitForPageReady(page);
        
        // Should be able to access poll management page without rate limiting
        expect(page.url()).toContain(pagePath);
        
        // Small delay
        await page.waitForTimeout(100);
      }
    }
  });

  test('should bypass rate limiting with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test civics page with rate limiting bypass
    for (let i = 0; i < 5; i++) {
      await page.goto('/civics?e2e=1');
      await waitForPageReady(page);
      
      // Should be able to access civics page without rate limiting
      expect(page.url()).toContain('/civics');
      
      // Small delay
      await page.waitForTimeout(100);
    }
  });

  test('should bypass rate limiting performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure rate limiting bypass performance
    const startTime = Date.now();

    // Test multiple rapid requests
    for (let i = 0; i < 5; i++) {
      await page.goto('/login?e2e=1');
      await waitForPageReady(page);
      
      await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
      await page.waitForTimeout(50);
    }

    const endTime = Date.now();
    const bypassTime = endTime - startTime;

    // Verify rate limiting bypass performance is acceptable
    expect(bypassTime).toBeLessThan(10000);
  });

  test('should bypass rate limiting with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Test rate limiting bypass while offline
    const offlineResponse = await page.goto('/login?e2e=1', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    
    // Should get network error, not rate limiting
    expect(offlineResponse?.status()).toBe(0);

    // Go back online
    await page.context().setOffline(false);

    // Test rate limiting bypass while online
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
  });
});

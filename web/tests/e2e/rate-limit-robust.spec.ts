/**
 * Robust Rate Limiting Bypass E2E Tests - V2 Upgrade
 * 
 * Tests the E2E bypass functionality using multiple methods with V2 mock factory setup:
 * - Header-based bypass
 * - Query parameter bypass
 * - Cookie-based bypass
 * - Comprehensive rate limiting testing
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

test.describe('Robust Rate Limiting Bypass - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'ratelimit-test@example.com',
        username: 'ratelimittestuser',
        password: 'RateLimitTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Rate Limit Test Poll',
        description: 'Testing rate limiting with V2 setup',
        options: ['Rate Limit Option 1', 'Rate Limit Option 2', 'Rate Limit Option 3'],
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

  test('bypass works via header with V2 setup', async ({ request, baseURL }) => {
    // Set up test data for header bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await request.get(`${baseURL}/api/debug/echo`, {
      headers: { 'x-e2e-bypass': '1' }
    });
    
    expect(response.status()).toBeLessThan(400);
    const body = await response.json();
    expect(body.e2eHeader).toBe('1');
  });

  test('bypass works via query parameter with V2 setup', async ({ request, baseURL }) => {
    // Set up test data for query parameter bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await request.get(`${baseURL}/api/debug/echo?e2e=1`);
    
    expect(response.status()).toBeLessThan(400);
    const body = await response.json();
    expect(body.e2eQuery).toBe('1');
  });

  test('bypass works via cookie with V2 setup', async ({ request, baseURL }) => {
    // Set up test data for cookie bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const response = await request.get(`${baseURL}/api/debug/echo`, {
      headers: { 'Cookie': 'E2E=1' }
    });
    
    expect(response.status()).toBeLessThan(400);
    const body = await response.json();
    expect(body.e2eCookie).toBe('1');
  });

  test('login page accessible with E2E bypass with V2 setup', async ({ page }) => {
    // Set up test data for login page bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    // Should be able to access login page without rate limiting
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
  });

  test('register page accessible with E2E bypass with V2 setup', async ({ page }) => {
    // Set up test data for register page bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    // Should be able to access register page without rate limiting
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible({ timeout: 10000 });
  });

  test('polls page accessible with E2E bypass with V2 setup', async ({ page }) => {
    // Set up test data for polls page bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/polls?e2e=1');
    await waitForPageReady(page);
    
    // Should be able to access polls page without rate limiting
    await expect(page.locator('[data-testid="polls-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard accessible with E2E bypass with V2 setup', async ({ page }) => {
    // Set up test data for dashboard bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/dashboard?e2e=1');
    await waitForPageReady(page);
    
    // Should be able to access dashboard without rate limiting
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('civics page accessible with E2E bypass with V2 setup', async ({ page }) => {
    // Set up test data for civics page bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics?e2e=1');
    await waitForPageReady(page);
    
    // Should be able to access civics page without rate limiting
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('rate limiting works without bypass with V2 setup', async ({ request, baseURL }) => {
    // Set up test data for rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Make multiple requests without bypass to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(request.get(`${baseURL}/api/debug/echo`));
    }

    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('rate limiting bypass works with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated rate limiting bypass
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

    // Test authenticated endpoints with bypass
    await page.goto('/polls?e2e=1');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="polls-page"]')).toBeVisible();
  });

  test('rate limiting bypass works with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-ratelimit@example.com',
      username: 'regularratelimit'
    });

    const adminUser = createTestUser({
      email: 'admin-ratelimit@example.com',
      username: 'adminratelimit'
    });

    // Test regular user rate limiting bypass
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', regularUser.email);
    await page.fill('[data-testid="login-password"]', regularUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();

    // Test admin user rate limiting bypass
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('rate limiting bypass works with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    // Check mobile login page with bypass
    await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
  });

  test('rate limiting bypass works with poll management with V2 setup', async ({ page }) => {
    // Set up test data for poll management rate limiting bypass
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

    // Test poll creation with bypass
    await page.goto('/polls/create?e2e=1');
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

    // Verify poll was created successfully
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText(testData.poll.title);
  });

  test('rate limiting bypass works with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics rate limiting bypass
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test civics page with bypass
    await page.goto('/civics?e2e=1');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();

    // Test address lookup with bypass
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
  });

  test('rate limiting bypass works with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA rate limiting bypass
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test PWA features with bypass
    await page.goto('/dashboard?e2e=1');
    await waitForPageReady(page);

    // Check PWA features are accessible
    await expect(page.locator('[data-testid="pwa-features"]')).toBeVisible();

    // Test offline functionality with bypass
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('rate limiting bypass works with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn rate limiting bypass
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test WebAuthn features with bypass
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    // Check WebAuthn features are accessible
    await expect(page.locator('[data-testid="webauthn-features"]')).toBeVisible();

    // Test WebAuthn login with bypass
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');

    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
  });

  test('rate limiting bypass performance with V2 setup', async ({ request, baseURL }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure bypass performance
    const startTime = Date.now();

    // Make multiple requests with bypass
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(request.get(`${baseURL}/api/debug/echo?e2e=1`));
    }

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBeLessThan(400);
    });

    // Performance should be acceptable
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000);
  });
});

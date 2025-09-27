/**
 * Feature Flags E2E Tests - V2 Upgrade
 * 
 * Tests that disabled features are properly gated and enabled features work correctly
 * using V2 mock factory for test data setup and improved test patterns.
 * This is critical for ensuring only MVP features are accessible.
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

test.describe('Feature Flags - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'feature-flags-test@example.com',
        username: 'featureflagstestuser',
        password: 'FeatureFlagsTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Feature Flags Test Poll',
        description: 'Testing feature flags with V2 setup',
        options: ['Feature Option 1', 'Feature Option 2', 'Feature Option 3'],
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

  test('should verify disabled social sharing features are not accessible with V2 setup', async ({ page }) => {
    // Set up test data for social sharing testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to a poll page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check that social sharing buttons are not present
    const socialShareButtons = await page.locator('[data-testid*="social-share"]').count();
    expect(socialShareButtons).toBe(0);

    // Check that social sharing components are not rendered
    const socialComponents = await page.locator('[class*="social"]').count();
    expect(socialComponents).toBe(0);

    // Verify no social sharing API calls are made
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('social') || request.url().includes('share')) {
        requests.push(request.url());
      }
    });

    // Wait a bit to catch any potential requests
    await page.waitForTimeout(2000);
    expect(requests).toHaveLength(0);
  });

  test('should verify analytics are disabled with V2 setup', async ({ page }) => {
    // Set up test data for analytics testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that no analytics scripts are loaded
    const analyticsScripts = await page.locator('script[src*="analytics"], script[src*="gtag"], script[src*="ga"]').count();
    expect(analyticsScripts).toBe(0);

    // Check that no analytics API calls are made
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('analytics') || request.url().includes('gtag') || request.url().includes('ga')) {
        requests.push(request.url());
      }
    });

    // Wait a bit to catch any potential requests
    await page.waitForTimeout(2000);
    expect(requests).toHaveLength(0);
  });

  test('should verify WebAuthn feature flag is enabled with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that WebAuthn features are enabled
    const webauthnElements = await page.locator('[data-testid*="webauthn"]').count();
    expect(webauthnElements).toBeGreaterThan(0);

    // Check that WebAuthn API is available
    const webauthnSupport = await page.evaluate(() => {
      return 'credentials' in navigator && 'create' in navigator.credentials;
    });
    expect(webauthnSupport).toBe(true);
  });

  test('should verify PWA feature flag is enabled with V2 setup', async ({ page }) => {
    // Set up test data for PWA feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that PWA features are enabled
    const pwaElements = await page.locator('[data-testid*="pwa"]').count();
    expect(pwaElements).toBeGreaterThan(0);

    // Check that service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    expect(swRegistered).toBe(true);
  });

  test('should verify civics feature flag is enabled with V2 setup', async ({ page }) => {
    // Set up test data for civics feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that civics features are enabled
    const civicsElements = await page.locator('[data-testid*="civics"]').count();
    expect(civicsElements).toBeGreaterThan(0);

    // Navigate to civics page
    await page.goto('/civics');
    await waitForPageReady(page);

    // Check that civics page is accessible
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();
  });

  test('should verify enhanced voting feature flag is enabled with V2 setup', async ({ page }) => {
    // Set up test data for enhanced voting feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that enhanced voting features are enabled
    const votingElements = await page.locator('[data-testid*="voting"]').count();
    expect(votingElements).toBeGreaterThan(0);

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check that polls page is accessible
    await expect(page.locator('[data-testid="polls-page"]')).toBeVisible();
  });

  test('should verify enhanced dashboard feature flag is enabled with V2 setup', async ({ page }) => {
    // Set up test data for enhanced dashboard feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that enhanced dashboard features are enabled
    const dashboardElements = await page.locator('[data-testid*="dashboard"]').count();
    expect(dashboardElements).toBeGreaterThan(0);

    // Navigate to dashboard page
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check that dashboard page is accessible
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
  });

  test('should verify feature flags with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated feature flag testing
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
    
    // Check that authenticated features are enabled
    await expect(page.locator('[data-testid="authenticated-features"]')).toBeVisible();
  });

  test('should verify feature flags with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-feature-flags@example.com',
      username: 'regularfeatureflags'
    });

    const adminUser = createTestUser({
      email: 'admin-feature-flags@example.com',
      username: 'adminfeatureflags'
    });

    // Test regular user feature flags
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

    await expect(page.locator('[data-testid="regular-user-features"]')).toBeVisible();

    // Test admin user feature flags
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

    await expect(page.locator('[data-testid="admin-user-features"]')).toBeVisible();
  });

  test('should verify feature flags with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Check that mobile features are enabled
    const mobileElements = await page.locator('[data-testid*="mobile"]').count();
    expect(mobileElements).toBeGreaterThan(0);

    // Navigate to different pages to check mobile features
    await page.goto('/polls');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="mobile-polls"]')).toBeVisible();
  });

  test('should verify feature flags with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management feature flag testing
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

    // Check that poll management features are enabled
    await expect(page.locator('[data-testid="poll-management-features"]')).toBeVisible();

    // Create a poll to test poll management features
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

    // Check that poll was created successfully
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText(testData.poll.title);
  });

  test('should verify feature flags with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics feature flag testing
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

    // Check that civics features are enabled
    await expect(page.locator('[data-testid="civics-features"]')).toBeVisible();
    await expect(page.locator('text=State IL')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should verify feature flags performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure feature flag performance
    const startTime = Date.now();

    // Navigate to different pages to check feature flag performance
    await page.goto('/polls');
    await waitForPageReady(page);

    await page.goto('/civics');
    await waitForPageReady(page);

    await page.goto('/dashboard');
    await waitForPageReady(page);

    const endTime = Date.now();
    const featureFlagTime = endTime - startTime;

    // Verify feature flag performance is acceptable
    expect(featureFlagTime).toBeLessThan(5000);
  });

  test('should verify feature flags with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Check that offline features are enabled
    await expect(page.locator('[data-testid="offline-features"]')).toBeVisible();

    // Navigate to different pages while offline
    await page.goto('/polls');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="offline-polls"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that online features work again
    await expect(page.locator('[data-testid="offline-features"]')).not.toBeVisible();
  });

  test('should verify feature flags with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that PWA features are enabled
    await expect(page.locator('[data-testid="pwa-features"]')).toBeVisible();

    // Test PWA installation
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });

    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
  });

  test('should verify feature flags with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn feature flag testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check that WebAuthn features are enabled
    await expect(page.locator('[data-testid="webauthn-features"]')).toBeVisible();

    // Test WebAuthn functionality
    await page.goto('/login');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="webauthn-login-button"]')).toBeVisible();

    // Test WebAuthn login
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');

    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
  });
});

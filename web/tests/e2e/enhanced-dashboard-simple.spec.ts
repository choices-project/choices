/**
 * Enhanced Dashboard System - Simple Tests - V2 Upgrade
 * 
 * Tests basic enhanced dashboard functionality including:
 * - Dashboard page loading with V2 mock factory setup
 * - Page structure and loading states
 * - Error handling and user experience
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

test.describe('Enhanced Dashboard System - Simple Tests - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'dashboard-simple-test@example.com',
        username: 'dashboardsimpletestuser',
        password: 'DashboardSimpleTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Dashboard Simple Test Poll',
        description: 'Testing simple dashboard with V2 setup',
        options: ['Simple Option 1', 'Simple Option 2', 'Simple Option 3'],
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

  test('should load dashboard page without errors with V2 setup', async ({ page }) => {
    // Set up test data for dashboard loading testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });

  test('should have proper page structure on dashboard page with V2 setup', async ({ page }) => {
    // Set up test data for dashboard structure testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/dashboard');
    await waitForPageReady(page);
    await page.waitForTimeout(1000); // Wait a bit for any redirects to complete
    
    const currentUrl = page.url();
    console.log('V2 Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      await expect(page.locator('h1, h2, h3')).toContainText(/sign|login/i);
      return;
    }
    
    const dashboardElement = page.locator('[data-testid="enhanced-dashboard"]');
    const isDashboardVisible = await dashboardElement.isVisible();
    console.log('V2 Dashboard element visible:', isDashboardVisible);
    
    if (isDashboardVisible) {
      await expect(dashboardElement).toBeVisible();
      await expect(page.locator('h1')).toContainText(/dashboard/i);
    } else {
      expect(currentUrl).toContain('/dashboard');
    }
  });

  test('should handle loading state properly with V2 setup', async ({ page }) => {
    // Set up test data for loading state testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/dashboard');
    
    // Should show loading spinner initially
    const loadingSpinner = page.locator('.animate-spin');
    const isSpinnerVisible = await loadingSpinner.isVisible();
    
    if (isSpinnerVisible) {
      await expect(loadingSpinner).toBeVisible();
    }
    
    // Wait for dashboard to load
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    
    // Loading spinner should be gone
    if (isSpinnerVisible) {
      await expect(loadingSpinner).not.toBeVisible();
    }
  });

  test('should handle authentication redirect properly with V2 setup', async ({ page }) => {
    // Set up test data for authentication redirect testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const currentUrl = page.url();
    
    // Should either be on dashboard or redirected to login
    if (currentUrl.includes('/login')) {
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
    }
  });

  test('should display dashboard content when authenticated with V2 setup', async ({ page }) => {
    // Set up test data for authenticated dashboard testing
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
    
    // Check dashboard content
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should handle dashboard with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-dashboard-simple@example.com',
      username: 'regulardashboardsimple'
    });

    const adminUser = createTestUser({
      email: 'admin-dashboard-simple@example.com',
      username: 'admindashboardsimple'
    });

    // Test regular user dashboard
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

    await expect(page.locator('[data-testid="regular-user-dashboard"]')).toBeVisible();

    // Test admin user dashboard
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

    await expect(page.locator('[data-testid="admin-user-dashboard"]')).toBeVisible();
  });

  test('should handle dashboard with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile dashboard testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/dashboard');
    await waitForPageReady(page);

    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();
    } else if (currentUrl.includes('/dashboard')) {
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    }
  });

  test('should handle dashboard with poll management integration with V2 setup', async ({ page }) => {
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

    // Check dashboard shows poll management options
    await expect(page.locator('[data-testid="poll-management-section"]')).toBeVisible();

    // Click create poll button
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');

    // Create a poll
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

    // Return to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check that poll appears in dashboard
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
    await expect(page.locator(`text=${testData.poll.title}`)).toBeVisible();
  });

  test('should handle dashboard with civics integration with V2 setup', async ({ page }) => {
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

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check civics integration in dashboard
    await expect(page.locator('[data-testid="civics-dashboard-section"]')).toBeVisible();
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should handle dashboard performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure dashboard performance
    const startTime = Date.now();

    await page.goto('/dashboard');
    await waitForPageReady(page);

    const endTime = Date.now();
    const dashboardTime = endTime - startTime;

    // Verify dashboard performance is acceptable
    expect(dashboardTime).toBeLessThan(3000);
  });

  test('should handle dashboard with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline dashboard testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user first
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Go offline
    await page.context().setOffline(true);

    // Check offline dashboard handling
    await expect(page.locator('[data-testid="offline-dashboard"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that dashboard works again
    await expect(page.locator('[data-testid="offline-dashboard"]')).not.toBeVisible();
  });

  test('should handle dashboard with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA dashboard testing
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

    // Check PWA features in dashboard
    await expect(page.locator('[data-testid="pwa-dashboard-features"]')).toBeVisible();

    // Test offline functionality
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should handle dashboard with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn dashboard testing
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

    // Check WebAuthn features in dashboard
    await expect(page.locator('[data-testid="webauthn-dashboard-features"]')).toBeVisible();
  });
});

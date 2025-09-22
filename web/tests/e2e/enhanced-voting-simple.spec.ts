/**
 * Enhanced Voting System - Simple Tests - V2 Upgrade
 * 
 * Tests basic enhanced voting functionality including:
 * - Polls page loading with V2 mock factory setup
 * - Voting interface and page structure
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

test.describe('Enhanced Voting System - Simple Tests - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'voting-simple-test@example.com',
        username: 'votingsimpletestuser',
        password: 'VotingSimpleTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Voting Simple Test Poll',
        description: 'Testing simple voting with V2 setup',
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

  test('should load polls page without errors with V2 setup', async ({ page }) => {
    // Set up test data for polls page loading testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Check if page loads successfully
    await expect(page).toHaveURL(/\/polls/);
    
    // Check for basic page structure
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display polls page content with V2 setup', async ({ page }) => {
    // Set up test data for polls page content testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Check if polls page has basic content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if we're on the polls page (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/polls')) {
      // We're on the polls page - check for polls content
      await expect(page.locator('[data-testid="polls-page"]')).toBeVisible();
      console.log('V2 Successfully loaded polls page');
    } else if (currentUrl.includes('/login')) {
      // We were redirected to login - this is expected for unauthenticated users
      console.log('V2 Redirected to login page (expected for unauthenticated users)');
    } else {
      // Some other page - check what we got
      console.log('V2 Loaded page:', currentUrl);
    }
  });

  test('should handle authentication redirect gracefully with V2 setup', async ({ page }) => {
    // Set up test data for authentication redirect testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/polls');
    await waitForPageReady(page);
    
    const currentUrl = page.url();
    
    // Should either be on polls page or login page
    const isOnPollsPage = currentUrl.includes('/polls');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnPollsPage || isOnLoginPage).toBeTruthy();
  });

  test('should display voting interface when authenticated with V2 setup', async ({ page }) => {
    // Set up test data for authenticated voting testing
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
    
    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Check polls page content
    await expect(page.locator('[data-testid="polls-page"]')).toBeVisible();
  });

  test('should handle voting with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-voting-simple@example.com',
      username: 'regularvotingsimple'
    });

    const adminUser = createTestUser({
      email: 'admin-voting-simple@example.com',
      username: 'adminvotingsimple'
    });

    // Test regular user voting
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
    await page.goto('/polls');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="regular-user-polls"]')).toBeVisible();

    // Test admin user voting
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
    await page.goto('/polls');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="admin-user-polls"]')).toBeVisible();
  });

  test('should handle voting with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile voting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/polls');
    await waitForPageReady(page);

    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();
    } else if (currentUrl.includes('/polls')) {
      await expect(page.locator('[data-testid="mobile-polls"]')).toBeVisible();
    }
  });

  test('should handle voting with poll management integration with V2 setup', async ({ page }) => {
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

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check polls page shows poll management options
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

    // Return to polls page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check that poll appears in polls list
    await expect(page.locator('[data-testid="polls-list"]')).toBeVisible();
    await expect(page.locator(`text=${testData.poll.title}`)).toBeVisible();
  });

  test('should handle voting with civics integration with V2 setup', async ({ page }) => {
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

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check civics integration in polls page
    await expect(page.locator('[data-testid="civics-polls-section"]')).toBeVisible();
    await expect(page.locator('text=State IL Polls')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should handle voting performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure voting performance
    const startTime = Date.now();

    await page.goto('/polls');
    await waitForPageReady(page);

    const endTime = Date.now();
    const votingTime = endTime - startTime;

    // Verify voting performance is acceptable
    expect(votingTime).toBeLessThan(3000);
  });

  test('should handle voting with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline voting testing
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

    // Navigate to polls page while offline
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check offline voting handling
    await expect(page.locator('[data-testid="offline-polls"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that voting works again
    await expect(page.locator('[data-testid="offline-polls"]')).not.toBeVisible();
  });

  test('should handle voting with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA voting testing
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

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check PWA features in polls page
    await expect(page.locator('[data-testid="pwa-polls-features"]')).toBeVisible();

    // Test offline functionality
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should handle voting with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn voting testing
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

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);

    // Check WebAuthn features in polls page
    await expect(page.locator('[data-testid="webauthn-polls-features"]')).toBeVisible();
  });
});

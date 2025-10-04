/**
 * PWA Offline Functionality E2E Tests - V2 Upgrade
 * 
 * Tests PWA offline capabilities including:
 * - Offline detection with V2 mock factory setup
 * - Offline voting and data synchronization
 * - Offline indicators and background sync
 * - Comprehensive offline testing
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
import { test as webauthnTest } from '../fixtures/webauthn';

// Helper function to wait for button to be enabled
async function waitForEnabledButton(page: Page, buttonText: string, timeout = 10000) {
  await page.waitForTimeout(1000);
  await page.waitForFunction((text) => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes(text) && !button.disabled) {
        return true;
      }
    }
    return false;
  }, buttonText, { timeout });
}

test.describe('PWA Offline Functionality - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'pwa-offline-test@example.com',
        username: 'pwaofflinetestuser',
        password: 'PwaOfflineTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 PWA Offline Test Poll',
        description: 'Testing PWA offline functionality with V2 setup',
        options: ['Offline Option 1', 'Offline Option 2', 'Offline Option 3'],
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

  test('should detect offline status with V2 setup', async ({ page }) => {
    // Set up test data for offline detection testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);
    
    // Wait for offline indicator to appear
    await page.waitForSelector('[data-testid="offline-indicator"]', { timeout: 5000 });
    
    // Check if offline indicator is visible
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible();
    
    // Check offline message
    await expect(offlineIndicator).toContainText('You\'re offline');
  });

  test('should detect online status with V2 setup', async ({ page }) => {
    // Set up test data for online detection testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline first
    await page.context().setOffline(true);
    await page.waitForSelector('[data-testid="offline-indicator"]');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for offline indicator to disappear
    await page.waitForSelector('[data-testid="offline-indicator"]', { state: 'hidden', timeout: 5000 });
    
    // Check if offline indicator is hidden
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).not.toBeVisible();
  });

  test('should handle offline voting with V2 setup', async ({ page }) => {
    // Set up test data for offline voting testing
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
    
    // Go offline
    await page.context().setOffline(true);
    
    // Check offline voting functionality
    await expect(page.locator('[data-testid="offline-voting"]')).toBeVisible();
    
    // Try to vote while offline
    const voteButton = page.locator('[data-testid="vote-button"]');
    if (await voteButton.count() > 0) {
      await voteButton.first().click();
      
      // Check if vote was queued for sync
      await expect(page.locator('[data-testid="vote-queued"]')).toBeVisible();
    }
  });

  test('should handle offline data synchronization with V2 setup', async ({ page }) => {
    // Set up test data for offline data sync testing
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
    
    // Go offline
    await page.context().setOffline(true);
    
    // Perform some actions while offline
    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Check offline data sync
    await expect(page.locator('[data-testid="offline-sync"]')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Check if data was synchronized
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
  });

  test('should handle offline indicators with V2 setup', async ({ page }) => {
    // Set up test data for offline indicators testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);
    
    // Check offline indicators on different pages
    const pages = ['/dashboard', '/polls', '/civics', '/profile'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      // Check if offline indicator is visible
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    }
  });

  test('should handle background sync with V2 setup', async ({ page }) => {
    // Set up test data for background sync testing
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
    
    // Go offline
    await page.context().setOffline(true);
    
    // Perform actions that should trigger background sync
    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Check background sync registration
    const backgroundSyncRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.sync !== undefined;
      }
      return false;
    });
    
    expect(backgroundSyncRegistered).toBe(true);
  });

  test('should handle offline functionality with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated offline testing
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
    
    // Go offline
    await page.context().setOffline(true);
    
    // Check authenticated offline functionality
    await expect(page.locator('[data-testid="authenticated-offline"]')).toBeVisible();
    
    // Navigate to different authenticated pages while offline
    await page.goto('/profile');
    await waitForPageReady(page);
    
    await expect(page.locator('[data-testid="offline-profile"]')).toBeVisible();
  });

  test('should handle offline functionality with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-offline@example.com',
      username: 'regularoffline'
    });

    const adminUser = createTestUser({
      email: 'admin-offline@example.com',
      username: 'adminoffline'
    });

    // Test regular user offline functionality
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

    // Go offline
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="regular-user-offline"]')).toBeVisible();

    // Test admin user offline functionality
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    await page.context().setOffline(false);
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Go offline
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="admin-user-offline"]')).toBeVisible();
  });

  test('should handle offline functionality with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile offline testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Go offline
    await page.context().setOffline(true);

    // Check mobile offline functionality
    await expect(page.locator('[data-testid="mobile-offline-indicator"]')).toBeVisible();

    // Navigate to different pages on mobile while offline
    const pages = ['/dashboard', '/polls', '/civics'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      // Check if mobile offline indicator is visible
      await expect(page.locator('[data-testid="mobile-offline-indicator"]')).toBeVisible();
    }
  });

  test('should handle offline functionality with poll management integration with V2 setup', async ({ page }) => {
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

    // Go offline
    await page.context().setOffline(true);

    // Test offline poll management
    await page.goto('/polls');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="offline-poll-management"]')).toBeVisible();

    // Try to create a poll while offline
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');

    await page.fill('input[id="title"]', 'Offline Test Poll');
    await page.fill('textarea[id="description"]', 'Testing offline poll creation');
    
    // Wait for form validation to complete
    await page.waitForTimeout(500);
    
    // Wait for button to be enabled
    await waitForEnabledButton(page, 'Next');
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', 'Offline Option 1');
    await page.fill('input[placeholder*="Option 2"]', 'Offline Option 2');
    
    // Wait for button to be enabled
    await waitForEnabledButton(page, 'Next');
    await page.click('button:has-text("Next")');

    // Select category by clicking on the category button (not a select dropdown)
    // Use Business category instead of General to avoid tag requirement
    await page.click('button:has-text("Business")');
    
    // Wait for button to be enabled
    await waitForEnabledButton(page, 'Next');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');

    // Check if poll was queued for sync
    await expect(page.locator('[data-testid="poll-queued-for-sync"]')).toBeVisible();
  });

  test('should handle offline functionality with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up civics context first
    await page.goto('/civics');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Go offline
    await page.context().setOffline(true);

    // Check offline civics functionality
    await expect(page.locator('[data-testid="offline-civics"]')).toBeVisible();

    // Try to perform civics actions while offline
    await page.fill('[data-testid="address-input"]', '456 Another St, Chicago, IL 60601');
    await page.click('[data-testid="address-submit"]');

    // Check if action was queued for sync
    await expect(page.locator('[data-testid="civics-action-queued"]')).toBeVisible();
  });

  test('should handle offline functionality performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure offline functionality performance
    const startTime = Date.now();

    // Go offline
    await page.context().setOffline(true);

    // Wait for offline indicator
    await page.waitForSelector('[data-testid="offline-indicator"]');

    // Go back online
    await page.context().setOffline(false);

    // Wait for offline indicator to disappear
    await page.waitForSelector('[data-testid="offline-indicator"]', { state: 'hidden' });

    const endTime = Date.now();
    const offlineTime = endTime - startTime;

    // Verify offline functionality performance is acceptable
    expect(offlineTime).toBeLessThan(5000);
  });

  webauthnTest('should handle offline functionality with WebAuthn integration with V2 setup', async ({ page, webauthnMode: _webauthnMode }) => {
    // Set up test data for WebAuthn offline testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test WebAuthn authentication
    await page.goto('/login');
    await waitForPageReady(page);

    // Check WebAuthn login option
    await expect(page.locator('[data-testid="webauthn-login"]')).toBeVisible();

    // Test WebAuthn login
    await page.click('[data-testid="webauthn-login"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');

    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();

    // Complete WebAuthn authentication using biometric button
    await page.click('[data-testid="webauthn-biometric-button"]');
    
    // Wait for authentication to complete (check for success message or redirect)
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to dashboard or if there's a success message
    const currentUrl = page.url();
    console.log('Current URL after WebAuthn:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('Successfully redirected to dashboard');
    } else {
      console.log('Not redirected to dashboard, checking for success message');
      // Check for success message or other indicators
      const successMessage = await page.locator('text=Authentication successful').isVisible().catch(() => false);
      if (successMessage) {
        console.log('Found success message, waiting for redirect');
        await page.waitForURL('/dashboard', { timeout: 10000 });
      } else {
        console.log('No success message found, proceeding anyway');
      }
    }
    await waitForPageReady(page);

    // Go offline
    await page.context().setOffline(true);

    // Check WebAuthn offline functionality
    await expect(page.locator('[data-testid="webauthn-offline"]')).toBeVisible();
  });
});

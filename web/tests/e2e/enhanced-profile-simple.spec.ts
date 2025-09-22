/**
 * Enhanced Profile System - Simple Tests - V2 Upgrade
 * 
 * Tests basic enhanced profile functionality including:
 * - Profile page loading with V2 mock factory setup
 * - Profile edit functionality and page structure
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

test.describe('Enhanced Profile System - Simple Tests - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'profile-simple-test@example.com',
        username: 'profilesimpletestuser',
        password: 'ProfileSimpleTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Profile Simple Test Poll',
        description: 'Testing simple profile with V2 setup',
        options: ['Profile Option 1', 'Profile Option 2', 'Profile Option 3'],
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

  test('should load profile page without errors with V2 setup', async ({ page }) => {
    // Set up test data for profile page loading testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate directly to profile page (will redirect to login if not authenticated)
    await page.goto('/profile');
    await waitForPageReady(page);
    
    // Should either show profile page or redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(profile|login)/);
  });

  test('should load profile edit page without errors with V2 setup', async ({ page }) => {
    // Set up test data for profile edit page testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate directly to profile edit page (will redirect to login if not authenticated)
    await page.goto('/profile/edit');
    await waitForPageReady(page);
    
    // Should either show edit page or redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(profile\/edit|login)/);
  });

  test('should have proper page structure on profile page with V2 setup', async ({ page }) => {
    // Set up test data for profile structure testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/profile');
    await waitForPageReady(page);
    
    // Wait a bit for any redirects to complete
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log('V2 Current URL:', currentUrl);
    
    // Check if we're redirected to login (expected if not authenticated)
    if (currentUrl.includes('/login')) {
      // Verify login page has proper structure
      await expect(page.locator('h1, h2, h3')).toContainText(/sign|login/i);
      return;
    }
    
    // If we're on profile page, check structure
    // First, let's see what's actually on the page
    const pageContent = await page.textContent('body');
    console.log('V2 Page content:', pageContent?.substring(0, 500));
    
    // Check if we have the profile page element
    const profilePageElement = page.locator('[data-testid="profile-page"]');
    const isProfilePageVisible = await profilePageElement.isVisible();
    console.log('V2 Profile page element visible:', isProfilePageVisible);
    
    if (isProfilePageVisible) {
      await expect(profilePageElement).toBeVisible();
      await expect(page.locator('h1')).toContainText(/profile/i);
    } else {
      expect(currentUrl).toContain('/profile');
    }
  });

  test('should handle authentication redirect properly with V2 setup', async ({ page }) => {
    // Set up test data for authentication redirect testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/profile');
    await waitForPageReady(page);
    
    const currentUrl = page.url();
    
    // Should either be on profile or redirected to login
    if (currentUrl.includes('/login')) {
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    } else if (currentUrl.includes('/profile')) {
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    }
  });

  test('should display profile content when authenticated with V2 setup', async ({ page }) => {
    // Set up test data for authenticated profile testing
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
    
    // Navigate to profile
    await page.goto('/profile');
    await waitForPageReady(page);
    
    // Check profile content
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/profile/i);
  });

  test('should handle profile edit functionality with V2 setup', async ({ page }) => {
    // Set up test data for profile edit testing
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
    
    // Navigate to profile edit
    await page.goto('/profile/edit');
    await waitForPageReady(page);
    
    // Check profile edit form
    await expect(page.locator('[data-testid="profile-edit-form"]')).toBeVisible();
    
    // Test editing profile
    await page.fill('[data-testid="display-name"]', 'Updated Display Name');
    await page.fill('[data-testid="bio"]', 'Updated bio');
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]');
    
    // Check if changes were saved
    await expect(page.locator('[data-testid="profile-saved-message"]')).toBeVisible();
  });

  test('should handle profile with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-profile-simple@example.com',
      username: 'regularprofilesimple'
    });

    const adminUser = createTestUser({
      email: 'admin-profile-simple@example.com',
      username: 'adminprofilesimple'
    });

    // Test regular user profile
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
    await page.goto('/profile');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="regular-user-profile"]')).toBeVisible();

    // Test admin user profile
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
    await page.goto('/profile');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="admin-user-profile"]')).toBeVisible();
  });

  test('should handle profile with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile profile testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/profile');
    await waitForPageReady(page);

    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();
    } else if (currentUrl.includes('/profile')) {
      await expect(page.locator('[data-testid="mobile-profile"]')).toBeVisible();
    }
  });

  test('should handle profile with poll management integration with V2 setup', async ({ page }) => {
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

    // Navigate to profile
    await page.goto('/profile');
    await waitForPageReady(page);

    // Check profile shows poll management options
    await expect(page.locator('[data-testid="profile-poll-management"]')).toBeVisible();

    // Create a poll from profile
    await page.click('[data-testid="create-poll-from-profile-button"]');
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

    // Return to profile
    await page.goto('/profile');
    await waitForPageReady(page);

    // Check that poll appears in profile
    await expect(page.locator('[data-testid="user-polls-section"]')).toBeVisible();
    await expect(page.locator(`text=${testData.poll.title}`)).toBeVisible();
  });

  test('should handle profile with civics integration with V2 setup', async ({ page }) => {
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

    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Navigate to profile
    await page.goto('/profile');
    await waitForPageReady(page);

    // Check civics integration in profile
    await expect(page.locator('[data-testid="civics-profile-section"]')).toBeVisible();
    await expect(page.locator('text=State IL Profile')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('should handle profile performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure profile performance
    const startTime = Date.now();

    await page.goto('/profile');
    await waitForPageReady(page);

    const endTime = Date.now();
    const profileTime = endTime - startTime;

    // Verify profile performance is acceptable
    expect(profileTime).toBeLessThan(3000);
  });

  test('should handle profile with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline profile testing
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

    // Navigate to profile while offline
    await page.goto('/profile');
    await waitForPageReady(page);

    // Check offline profile handling
    await expect(page.locator('[data-testid="offline-profile"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that profile works again
    await expect(page.locator('[data-testid="offline-profile"]')).not.toBeVisible();
  });

  test('should handle profile with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA profile testing
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

    // Navigate to profile
    await page.goto('/profile');
    await waitForPageReady(page);

    // Check PWA features in profile
    await expect(page.locator('[data-testid="pwa-profile-features"]')).toBeVisible();

    // Test offline functionality
    await page.context().setOffline(true);

    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should handle profile with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn profile testing
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

    // Navigate to profile
    await page.goto('/profile');
    await waitForPageReady(page);

    // Check WebAuthn features in profile
    await expect(page.locator('[data-testid="webauthn-profile-features"]')).toBeVisible();
  });
});

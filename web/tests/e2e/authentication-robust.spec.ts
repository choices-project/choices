/**
 * Robust Authentication Flow E2E Tests - V2 Upgrade
 * 
 * Uses the new hydration utilities and E2E bypass patterns with V2 mock factory setup
 * to provide reliable authentication testing across all browsers.
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

test.describe('Robust Authentication Flow - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'auth-robust-test@example.com',
        username: 'authrobusttestuser',
        password: 'AuthRobustTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Auth Robust Test Poll',
        description: 'Testing robust authentication with V2 setup',
        options: ['Auth Option 1', 'Auth Option 2', 'Auth Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to the landing page
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

  test('login page renders & form elements visible with V2 setup', async ({ page }) => {
    // Set up test data for login page testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Wait for form to be ready (login page doesn't have hydration sentinel)
    await page.waitForSelector('[data-testid="login-submit"]', { timeout: 10000 });

    // Verify form elements are visible
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    
    // Submit button should be enabled (server action pattern)
    await expect(page.getByTestId('login-submit')).toBeEnabled();
    
    // Fill email field with V2 test data
    await page.fill('[data-testid="login-email"]', testData.user.email);
    
    // Wait for the email field to have the value
    await expect(page.getByTestId('login-email')).toHaveValue(testData.user.email);
    
    // Button should still be enabled (server action handles validation)
    await expect(page.getByTestId('login-submit')).toBeEnabled();
  });

  test('register page renders & form elements visible with V2 setup', async ({ page }) => {
    // Set up test data for register page testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/register?e2e=1', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');

    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    await page.waitForTimeout(500); // Wait for form to render

    // Verify form elements are visible
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByTestId('username')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('confirm-password')).toBeVisible();
    
    // Submit button should be enabled
    await expect(page.getByTestId('register-button')).toBeEnabled();
    
    // Fill form fields with V2 test data
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Verify values are set
    await expect(page.getByTestId('email')).toHaveValue(testData.user.email);
    await expect(page.getByTestId('username')).toHaveValue(testData.user.username);
    await expect(page.getByTestId('password')).toHaveValue(testData.user.password);
    await expect(page.getByTestId('confirm-password')).toHaveValue(testData.user.password);
  });

  test('authentication flow works end-to-end with V2 setup', async ({ page }) => {
    // Set up test data for end-to-end authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test registration flow
    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    // Wait for form hydration and select password method
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    await page.click('button:has-text("Password Account")');
    await page.waitForTimeout(500);
    
    // Fill registration form with V2 test data
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Wait for registration to complete
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to dashboard or login
    const currentUrl = await page.url();
    if (currentUrl.includes('/dashboard')) {
      // Registration was successful and we're logged in
      await expect(page.locator('h1, h2')).toBeVisible();
    } else if (currentUrl.includes('/login')) {
      // Registration was successful but we need to sign in
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Sign in with the V2 test credentials
      await page.fill('[data-testid="login-email"]', testData.user.email);
      await page.fill('[data-testid="login-password"]', testData.user.password);
      await page.click('[data-testid="login-submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('authentication error handling works with V2 setup', async ({ page }) => {
    // Set up test data for error handling testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test login with invalid credentials
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    
    // Wait for error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('authentication works with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-auth@example.com',
      username: 'regularauth'
    });

    const adminUser = createTestUser({
      email: 'admin-auth@example.com',
      username: 'adminauth'
    });

    // Test regular user authentication
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

    await expect(page.locator('[data-testid="regular-user-dashboard"]')).toBeVisible();

    // Test admin user authentication
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

    await expect(page.locator('[data-testid="admin-user-dashboard"]')).toBeVisible();
  });

  test('authentication works with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test mobile login
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
  });

  test('authentication works with WebAuthn integration with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    // Check WebAuthn login option
    await expect(page.locator('[data-testid="webauthn-login-button"]')).toBeVisible();

    // Test WebAuthn login
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');

    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
  });

  test('authentication works with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    // Check PWA features are available
    await expect(page.locator('[data-testid="pwa-features"]')).toBeVisible();

    // Test authentication with PWA context
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="pwa-dashboard"]')).toBeVisible();
  });

  test('authentication works with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up civics context first
    await page.goto('/civics?e2e=1');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Now test authentication with civics context
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="civics-dashboard"]')).toBeVisible();
  });

  test('authentication performance with V2 setup', async ({ page }) => {
    // Set up test data for authentication performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure authentication performance
    const startTime = Date.now();

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    const endTime = Date.now();
    const authTime = endTime - startTime;

    // Verify authentication performance is acceptable
    expect(authTime).toBeLessThan(5000);
  });

  test('authentication works with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline authentication testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);

    // Check offline authentication handling
    await expect(page.locator('[data-testid="offline-login"]')).toBeVisible();

    // Try to login while offline
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    // Check if offline message is shown
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that authentication works again
    await expect(page.locator('[data-testid="offline-login"]')).not.toBeVisible();

    // Try login again
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });
});

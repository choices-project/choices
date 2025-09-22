/**
 * Robust WebAuthn E2E Tests - V2 Upgrade
 * 
 * Uses the new WebAuthn fixture to provide browser-specific testing with V2 mock factory setup:
 * - Chromium: Full CDP virtual authenticator support
 * - Firefox/WebKit: Mocked WebAuthn API for component testing
 * - Comprehensive WebAuthn testing across all browsers
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect } from '../fixtures/webauthn';
import { waitForHydrationAndForm } from '../utils/hydration';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Robust WebAuthn Tests - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'webauthn-robust-test@example.com',
        username: 'webauthnrobusttestuser',
        password: 'WebAuthnRobustTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 WebAuthn Robust Test Poll',
        description: 'Testing robust WebAuthn with V2 setup',
        options: ['WebAuthn Option 1', 'WebAuthn Option 2', 'WebAuthn Option 3'],
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

  test('WebAuthn support detection works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn support detection
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    // Check WebAuthn support
    const webauthnSupport = await page.evaluate(() => {
      return {
        hasCredentials: 'credentials' in navigator,
        hasCreate: 'credentials' in navigator && 'create' in navigator.credentials,
        hasGet: 'credentials' in navigator && 'get' in navigator.credentials
      };
    });

    expect(webauthnSupport.hasCredentials).toBe(true);
    expect(webauthnSupport.hasCreate).toBe(true);
    expect(webauthnSupport.hasGet).toBe(true);
    
    console.log(`V2 WebAuthn support detected on ${webauthnMode} mode`);
  });

  test('WebAuthn components render on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn component rendering
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    // Wait for form to be ready
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    // Check if WebAuthn components are present (they should be mocked on non-Chromium)
    const hasWebAuthnComponents = await page.evaluate(() => {
      // Look for WebAuthn-related elements
      const passkeyElements = document.querySelectorAll('[data-testid*="webauthn"], [data-testid*="passkey"]');
      return passkeyElements.length > 0;
    });
    
    // On Chromium, we expect real WebAuthn components
    // On other browsers, we expect mocked components
    if (webauthnMode === 'chromium') {
      expect(hasWebAuthnComponents).toBe(true);
    } else {
      expect(hasWebAuthnComponents).toBe(true); // Mocked components should still be present
    }
    
    console.log(`V2 WebAuthn components rendered on ${webauthnMode} mode`);
  });

  test('WebAuthn registration works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn registration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    // Wait for form to be ready
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    // Fill basic registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="webauthn-register-prompt"]', { timeout: 10000 });
    
    // Click WebAuthn register button
    await page.click('[data-testid="webauthn-register-button"]');
    
    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Complete WebAuthn registration
    await page.click('[data-testid="webauthn-complete-button"]');
    
    // Verify registration success
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    console.log(`V2 WebAuthn registration completed on ${webauthnMode} mode`);
  });

  test('WebAuthn authentication works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn authentication
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, register a user with WebAuthn
    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="webauthn-register-prompt"]');
    await page.click('[data-testid="webauthn-register-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    await page.click('[data-testid="webauthn-complete-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // Now test login
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    // Click WebAuthn login button
    await page.click('[data-testid="webauthn-login-button"]');
    
    // Wait for WebAuthn authentication prompt
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Complete WebAuthn authentication
    await page.click('[data-testid="webauthn-complete-button"]');
    
    // Verify authentication success
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();
    
    console.log(`V2 WebAuthn authentication completed on ${webauthnMode} mode`);
  });

  test('WebAuthn error handling works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn error handling
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="webauthn-register-prompt"]');
    await page.click('[data-testid="webauthn-register-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Cancel WebAuthn operation
    await page.click('[data-testid="webauthn-cancel-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="webauthn-error"]')).toBeVisible();
    await expect(page.locator('text=WebAuthn operation cancelled')).toBeVisible();
    
    console.log(`V2 WebAuthn error handling tested on ${webauthnMode} mode`);
  });

  test('WebAuthn cross-device authentication works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for cross-device WebAuthn authentication
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    // Click WebAuthn login button
    await page.click('[data-testid="webauthn-login-button"]');
    
    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Choose cross-device authentication
    await page.click('[data-testid="webauthn-cross-device-button"]');
    
    // Verify QR code is shown
    await expect(page.locator('[data-testid="webauthn-qr-code"]')).toBeVisible();
    
    console.log(`V2 WebAuthn cross-device authentication tested on ${webauthnMode} mode`);
  });

  test('WebAuthn credential management works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn credential management
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Navigate to profile/settings
    await page.goto('/profile?e2e=1');
    await waitForPageReady(page);
    
    // Check WebAuthn credential management
    await expect(page.locator('[data-testid="webauthn-credential-management"]')).toBeVisible();
    
    // Click view credentials
    await page.click('[data-testid="view-credentials-button"]');
    
    // Verify credentials list
    await expect(page.locator('[data-testid="credentials-list"]')).toBeVisible();
    
    console.log(`V2 WebAuthn credential management tested on ${webauthnMode} mode`);
  });

  test('WebAuthn multiple credential support works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for multiple WebAuthn credentials
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Navigate to profile
    await page.goto('/profile?e2e=1');
    await waitForPageReady(page);
    
    // Register additional WebAuthn credential
    await page.click('[data-testid="register-additional-credential-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    await page.click('[data-testid="webauthn-complete-button"]');
    
    // Verify additional credential was registered
    await expect(page.locator('[data-testid="additional-credential-success"]')).toBeVisible();
    
    console.log(`V2 WebAuthn multiple credential support tested on ${webauthnMode} mode`);
  });

  test('WebAuthn performance works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure WebAuthn performance
    const startTime = Date.now();

    await page.goto('/register?e2e=1');
    await waitForPageReady(page);
    
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="webauthn-register-prompt"]');
    await page.click('[data-testid="webauthn-register-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    await page.click('[data-testid="webauthn-complete-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

    const endTime = Date.now();
    const webauthnTime = endTime - startTime;

    // Verify WebAuthn performance is acceptable
    expect(webauthnTime).toBeLessThan(10000);
    
    console.log(`V2 WebAuthn performance: ${webauthnTime}ms on ${webauthnMode} mode`);
  });

  test('WebAuthn integration with poll management works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn poll management integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate user with WebAuthn
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    await page.click('[data-testid="webauthn-complete-button"]');
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();
    
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Test poll creation with WebAuthn authentication
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
    
    console.log(`V2 WebAuthn poll management integration tested on ${webauthnMode} mode`);
  });

  test('WebAuthn integration with civics works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn civics integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate user with WebAuthn
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    await page.click('[data-testid="webauthn-complete-button"]');
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();
    
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Test civics integration with WebAuthn authentication
    await page.goto('/civics?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    await expect(page.locator('[data-testid="address-results"]')).toBeVisible();
    
    console.log(`V2 WebAuthn civics integration tested on ${webauthnMode} mode`);
  });

  test('WebAuthn integration with PWA works on all browsers with V2 setup', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn PWA integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate user with WebAuthn
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.click('[data-testid="webauthn-login-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    await page.click('[data-testid="webauthn-complete-button"]');
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();
    
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Test PWA features with WebAuthn authentication
    await expect(page.locator('[data-testid="pwa-features"]')).toBeVisible();
    
    // Test offline functionality
    await page.context().setOffline(true);
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    
    console.log(`V2 WebAuthn PWA integration tested on ${webauthnMode} mode`);
  });
});

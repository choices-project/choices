/**
 * WebAuthn E2E Tests - V2 Upgrade
 * 
 * Comprehensive end-to-end tests for WebAuthn passkey functionality
 * using V2 mock factory for test data setup and improved test patterns.
 * Tests the existing WebAuthn implementation with virtual authenticators
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { T } from '@/lib/testing/testIds';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('WebAuthn Passkey Flow - V2', () => {
  let context: BrowserContext;
  let page: Page;
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeAll(async () => {
    // Launch browser with WebAuthn support
    context = await chromium.launchPersistentContext('', {
      headless: false, // Need to see the browser for WebAuthn
      args: [
        '--enable-features=WebAuthenticationAPI',
        '--disable-web-security', // For testing
        '--allow-running-insecure-content',
      ],
    });

    // Enable CDP for virtual authenticators
    const [firstPage] = context.pages();
    const cdpSession = await context.newCDPSession(firstPage);
    await cdpSession.send('WebAuthn.enable');
  });

  test.beforeEach(async () => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'webauthn-test@example.com',
        username: 'webauthntestuser',
        password: 'WebAuthnTest123!'
      })
    };

    page = await context.newPage();
    
    // Set up external API mocks
    await setupExternalAPIMocks(page);
    
    // Set up virtual authenticator
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    });

    // Mock WebAuthn API for testing
    await page.evaluateOnNewDocument(() => {
      // Mock successful credential creation
      const mockCredential = {
        id: 'mock-credential-id-' + Math.random(),
        rawId: new ArrayBuffer(16),
        response: {
          clientDataJSON: new ArrayBuffer(32),
          attestationObject: new ArrayBuffer(64),
        },
        type: 'public-key',
      };

      const mockAuthCredential = {
        id: 'mock-credential-id-' + Math.random(),
        rawId: new ArrayBuffer(16),
        response: {
          clientDataJSON: new ArrayBuffer(32),
          authenticatorData: new ArrayBuffer(32),
          signature: new ArrayBuffer(64),
          userHandle: new ArrayBuffer(16),
        },
        type: 'public-key',
      };

      if (window.navigator.credentials) {
        const _originalCreate = window.navigator.credentials.create;
        const _originalGet = window.navigator.credentials.get;

        window.navigator.credentials.create = async (options: any) => {
          console.log('V2 Mock WebAuthn create called with:', options);
          return mockCredential;
        };

        window.navigator.credentials.get = async (options: any) => {
          console.log('V2 Mock WebAuthn get called with:', options);
          return mockAuthCredential;
        };
      }
    });

    await page.goto('/');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user
    });
    
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should complete passkey registration flow with V2 setup', async () => {
    // Set up test data for passkey registration
    await setupE2ETestData({
      user: testData.user
    });

    // Navigate to registration page
    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    // Fill basic registration form with V2 test data
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);

    // Submit registration
    await page.click('[data-testid="register-submit"]');

    // Wait for registration success and passkey prompt
    await page.waitForSelector('[data-testid="passkey-register-prompt"]', { timeout: 10000 });

    // Click register passkey button
    await page.click('[data-testid="' + T.webauthn.register + '"]');

    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Choose biometric authentication
    await page.click('[data-testid="' + T.webauthn.biometricButton + '"]');

    // Complete registration
    await page.click('[data-testid="complete-registration-button"]');

    // Verify success
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
  });

  test('should complete passkey authentication flow with V2 setup', async () => {
    // Set up test data for passkey authentication
    await setupE2ETestData({
      user: testData.user
    });

    // First, register a user with passkey (setup)
    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');
    await page.click('[data-testid="' + T.webauthn.biometricButton + '"]');
    await page.click('[data-testid="complete-registration-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

    // Now test login
    await page.goto('/login');
    await page.waitForSelector('[data-testid="login-form"]');

    // Click passkey login button
    await page.click('[data-testid="' + T.webauthn.login + '"]');

    // Wait for WebAuthn authentication prompt
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Choose biometric authentication
    await page.click('[data-testid="' + T.webauthn.biometricButton + '"]');

    // Complete authentication
    await page.click('[data-testid="complete-authentication-button"]');

    // Verify successful login
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();
  });

  test('should handle passkey registration cancellation with V2 setup', async () => {
    // Set up test data for cancellation testing
    await setupE2ETestData({
      user: testData.user
    });

    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Cancel the operation
    await page.click('[data-testid="cancel-webauthn-button"]');

    // Verify cancellation message
    await expect(page.locator('[data-testid="operation-cancelled"]')).toBeVisible();
  });

  test('should handle network errors gracefully with V2 setup', async () => {
    // Set up test data for network error testing
    await setupE2ETestData({
      user: testData.user
    });

    // Mock network failure
    await page.route('**/api/v1/auth/webauthn/**', route => {
      route.abort('failed');
    });

    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');

    // Verify network error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  });

  test('should show passkey management interface with V2 setup', async () => {
    // Set up test data for passkey management
    await setupE2ETestData({
      user: testData.user
    });

    // Login first with traditional auth
    await page.goto('/login');
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    // Navigate to profile/settings
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="passkey-management"]');

    // Click view credentials
    await page.click('[data-testid="view-credentials-button"]');

    // Verify credentials list
    await expect(page.locator('[data-testid="credentials-list"]')).toBeVisible();
  });

  test('should handle multiple passkey registration with V2 setup', async () => {
    // Set up test data for multiple passkey testing
    await setupE2ETestData({
      user: testData.user
    });

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    // Navigate to profile
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="passkey-management"]');

    // Register additional passkey
    await page.click('[data-testid="register-additional-passkey-button"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');
    await page.click('[data-testid="' + T.webauthn.biometricButton + '"]');
    await page.click('[data-testid="complete-registration-button"]');

    // Verify success
    await expect(page.locator('[data-testid="additional-passkey-success"]')).toBeVisible();
  });

  test('should handle cross-device authentication with V2 setup', async () => {
    // Set up test data for cross-device testing
    await setupE2ETestData({
      user: testData.user
    });

    await page.goto('/login');
    await page.waitForSelector('[data-testid="login-form"]');

    await page.click('[data-testid="' + T.webauthn.login + '"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Choose cross-device authentication
    await page.click('[data-testid="' + T.webauthn.crossDeviceButton + '"]');

    // Verify QR code is shown
    await expect(page.locator('[data-testid="' + T.webauthn.qr + '"]')).toBeVisible();
  });

  test('should validate WebAuthn support detection with V2 setup', async () => {
    // Set up test data for WebAuthn support testing
    await setupE2ETestData({
      user: testData.user
    });

    // Test with WebAuthn support
    await page.goto('/login');
    await expect(page.locator('[data-testid="' + T.webauthn.login + '"]')).toBeVisible();

    // Test without WebAuthn support (mock unsupported browser)
    await page.evaluateOnNewDocument(() => {
      delete (window.navigator as any).credentials;
    });

    await page.reload();
    await expect(page.locator('[data-testid="' + T.webauthn.login + '"]')).not.toBeVisible();
  });

  test('should test WebAuthn API endpoints directly with V2 setup', async () => {
    // Set up test data for API endpoint testing
    await setupE2ETestData({
      user: testData.user
    });

    // Test registration options endpoint
    const registerOptionsResponse = await page.request.post('/api/v1/auth/webauthn/register/options', {
      data: {}
    });
    
    // Should return 401 without authentication
    expect(registerOptionsResponse.status()).toBe(401);

    // Test authentication options endpoint
    const authOptionsResponse = await page.request.post('/api/v1/auth/webauthn/authenticate/options', {
      data: {}
    });
    
    // Should return 401 without authentication
    expect(authOptionsResponse.status()).toBe(401);
  });

  test('should test WebAuthn feature flag integration with V2 setup', async () => {
    // Set up test data for feature flag testing
    await setupE2ETestData({
      user: testData.user
    });

    // Check that WebAuthn feature flag is enabled
    const flagsResponse = await page.request.get('/api/e2e/flags');
    const flags = await flagsResponse.json();
    
    expect(flags.flags.WEBAUTHN).toBe(true);
  });

  test('should handle WebAuthn with different user types with V2 setup', async () => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-webauthn@example.com',
      username: 'regularwebauthn'
    });

    const adminUser = createTestUser({
      email: 'admin-webauthn@example.com',
      username: 'adminwebauthn'
    });

    // Test regular user WebAuthn
    await setupE2ETestData({
      user: regularUser
    });

    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    await page.fill('[data-testid="email"]', regularUser.email);
    await page.fill('[data-testid="username"]', regularUser.username);
    await page.fill('[data-testid="password"]', regularUser.password);
    await page.fill('[data-testid="confirm-password"]', regularUser.password);

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');

    // Should work for regular users
    await expect(page.locator('[data-testid="' + T.webauthn.prompt + '"]')).toBeVisible();

    // Test admin user WebAuthn
    await setupE2ETestData({
      user: adminUser
    });

    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    await page.fill('[data-testid="email"]', adminUser.email);
    await page.fill('[data-testid="username"]', adminUser.username);
    await page.fill('[data-testid="password"]', adminUser.password);
    await page.fill('[data-testid="confirm-password"]', adminUser.password);

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');

    // Should work for admin users too
    await expect(page.locator('[data-testid="' + T.webauthn.prompt + '"]')).toBeVisible();
  });

  test('should handle WebAuthn with mobile viewport with V2 setup', async () => {
    // Set up test data for mobile WebAuthn testing
    await setupE2ETestData({
      user: testData.user
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    await page.goto('/login');
    await waitForPageReady(page);

    // Test mobile WebAuthn flow
    await page.click('[data-testid="' + T.webauthn.login + '"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Should work on mobile
    await expect(page.locator('[data-testid="' + T.webauthn.prompt + '"]')).toBeVisible();
  });
});

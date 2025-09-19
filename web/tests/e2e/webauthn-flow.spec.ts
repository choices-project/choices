/**
 * WebAuthn E2E Tests
 * 
 * Comprehensive end-to-end tests for WebAuthn passkey functionality
 * Tests the existing WebAuthn implementation with virtual authenticators
 * 
 * Created: January 18, 2025
 * Updated: January 18, 2025
 */

import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn Passkey Flow', () => {
  let context: BrowserContext;
  let page: Page;

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
    page = await context.newPage();
    
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
        const originalCreate = window.navigator.credentials.create;
        const originalGet = window.navigator.credentials.get;

        window.navigator.credentials.create = async (options: any) => {
          console.log('Mock WebAuthn create called with:', options);
          return mockCredential;
        };

        window.navigator.credentials.get = async (options: any) => {
          console.log('Mock WebAuthn get called with:', options);
          return mockAuthCredential;
        };
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should complete passkey registration flow', async () => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    // Fill basic registration form
    const testEmail = `webauthn-test-${Date.now()}@example.com`;
    const testUsername = `webauthnuser${Date.now()}`;

    await page.fill('[data-testid="email"]', testEmail);
    await page.fill('[data-testid="username"]', testUsername);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

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

  test('should complete passkey authentication flow', async () => {
    // First, register a user with passkey (setup)
    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    const testEmail = `webauthn-login-${Date.now()}@example.com`;
    const testUsername = `webauthnlogin${Date.now()}`;

    await page.fill('[data-testid="email"]', testEmail);
    await page.fill('[data-testid="username"]', testUsername);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

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

  test('should handle passkey registration cancellation', async () => {
    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    const testEmail = `cancel-test-${Date.now()}@example.com`;
    const testUsername = `canceltest${Date.now()}`;

    await page.fill('[data-testid="email"]', testEmail);
    await page.fill('[data-testid="username"]', testUsername);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Cancel the operation
    await page.click('[data-testid="cancel-webauthn-button"]');

    // Verify cancellation message
    await expect(page.locator('[data-testid="operation-cancelled"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async () => {
    // Mock network failure
    await page.route('**/api/v1/auth/webauthn/**', route => {
      route.abort('failed');
    });

    await page.goto('/register');
    await page.waitForSelector('[data-testid="register-form"]');

    const testEmail = `network-test-${Date.now()}@example.com`;
    const testUsername = `networktest${Date.now()}`;

    await page.fill('[data-testid="email"]', testEmail);
    await page.fill('[data-testid="username"]', testUsername);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

    await page.click('[data-testid="register-submit"]');
    await page.waitForSelector('[data-testid="passkey-register-prompt"]');
    await page.click('[data-testid="' + T.webauthn.register + '"]');

    // Verify network error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  });

  test('should show passkey management interface', async () => {
    // Login first with traditional auth
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-submit"]');

    // Navigate to profile/settings
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="passkey-management"]');

    // Click view credentials
    await page.click('[data-testid="view-credentials-button"]');

    // Verify credentials list
    await expect(page.locator('[data-testid="credentials-list"]')).toBeVisible();
  });

  test('should handle multiple passkey registration', async () => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
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

  test('should handle cross-device authentication', async () => {
    await page.goto('/login');
    await page.waitForSelector('[data-testid="login-form"]');

    await page.click('[data-testid="' + T.webauthn.login + '"]');
    await page.waitForSelector('[data-testid="' + T.webauthn.prompt + '"]');

    // Choose cross-device authentication
    await page.click('[data-testid="' + T.webauthn.crossDeviceButton + '"]');

    // Verify QR code is shown
    await expect(page.locator('[data-testid="' + T.webauthn.qr + '"]')).toBeVisible();
  });

  test('should validate WebAuthn support detection', async () => {
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

  test('should test WebAuthn API endpoints directly', async () => {
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

  test('should test WebAuthn feature flag integration', async () => {
    // Check that WebAuthn feature flag is enabled
    const flagsResponse = await page.request.get('/api/e2e/flags');
    const flags = await flagsResponse.json();
    
    expect(flags.flags.WEBAUTHN).toBe(true);
  });
});

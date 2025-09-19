/**
 * WebAuthn E2E Tests with CDP Virtual Authenticators
 * 
 * End-to-end tests for WebAuthn functionality using Chrome DevTools Protocol
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { test, expect, chromium } from '@playwright/test';

test.describe('WebAuthn with CDP Virtual Authenticators @passkeys', () => {
  let browser: any;
  let context: any;
  let page: any;

  test.beforeAll(async () => {
    // Launch browser with CDP support
    browser = await chromium.launch({
      headless: false, // Need visible browser for CDP
      args: ['--enable-features=WebAuthentication']
    });
    
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    // Set up virtual authenticator before each test
    const cdpSession = await context.newCDPSession(page);
    
    // Enable WebAuthn domain
    await cdpSession.send('WebAuthn.enable');
    
    // Create virtual authenticator
    const authenticatorId = await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'usb',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true
      }
    });
    
    // Store authenticator ID for cleanup
    await page.evaluate((id: string) => {
      (window as any).__authenticatorId = id;
    }, authenticatorId.authenticatorId);
  });

  test.afterEach(async () => {
    // Clean up virtual authenticator
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    if (authenticatorId) {
      await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
        authenticatorId
      });
    }
  });

  test('should register passkey successfully', async () => {
    await page.goto('/auth');
    
    // Click on passkey registration button
    await page.click('[data-testid="register-passkey-button"]');
    
    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Simulate user interaction with virtual authenticator
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    // Create credential
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'test-credential-id',
        privateKey: 'test-private-key',
        signCount: 0
      }
    });
    
    // Complete registration
    await page.click('[data-testid="complete-registration-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
  });

  test('should authenticate with passkey successfully', async () => {
    // First register a passkey
    await page.goto('/auth');
    await page.click('[data-testid="register-passkey-button"]');
    
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'test-credential-id',
        privateKey: 'test-private-key',
        signCount: 0
      }
    });
    
    await page.click('[data-testid="complete-registration-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // Now test authentication
    await page.click('[data-testid="login-passkey-button"]');
    
    // Wait for authentication prompt
    await page.waitForSelector('[data-testid="webauthn-auth-prompt"]');
    
    // Simulate authentication
    await cdpSession.send('WebAuthn.simulateUserGesture', {
      authenticatorId
    });
    
    await page.click('[data-testid="complete-authentication-button"]');
    
    // Verify successful login
    await expect(page.locator('[data-testid="login-success"]')).toBeVisible();
  });

  test('should handle authentication failure gracefully', async () => {
    await page.goto('/auth');
    await page.click('[data-testid="login-passkey-button"]');
    
    // Wait for authentication prompt
    await page.waitForSelector('[data-testid="webauthn-auth-prompt"]');
    
    // Simulate authentication failure
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    // Remove all credentials to simulate failure
    await cdpSession.send('WebAuthn.removeAllCredentials', {
      authenticatorId
    });
    
    await page.click('[data-testid="complete-authentication-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="authentication-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="authentication-error"]')).toContainText('No credentials found');
  });

  test('should handle user cancellation', async () => {
    await page.goto('/auth');
    await page.click('[data-testid="register-passkey-button"]');
    
    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Cancel the operation
    await page.click('[data-testid="cancel-webauthn-button"]');
    
    // Verify cancellation message
    await expect(page.locator('[data-testid="operation-cancelled"]')).toBeVisible();
  });

  test('should handle timeout scenarios', async () => {
    await page.goto('/auth');
    await page.click('[data-testid="register-passkey-button"]');
    
    // Wait for WebAuthn prompt
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    // Simulate timeout by not responding
    await page.waitForTimeout(65000); // Wait longer than timeout
    
    // Verify timeout message
    await expect(page.locator('[data-testid="operation-timeout"]')).toBeVisible();
  });

  test('should support multiple credentials', async () => {
    await page.goto('/auth');
    
    // Register first credential
    await page.click('[data-testid="register-passkey-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'credential-1',
        privateKey: 'private-key-1',
        signCount: 0
      }
    });
    
    await page.click('[data-testid="complete-registration-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // Register second credential
    await page.click('[data-testid="register-additional-passkey-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'credential-2',
        privateKey: 'private-key-2',
        signCount: 0
      }
    });
    
    await page.click('[data-testid="complete-registration-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // Verify both credentials are listed
    await page.click('[data-testid="view-credentials-button"]');
    await expect(page.locator('[data-testid="credential-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="credential-item"]')).toHaveCount(2);
  });

  test('should handle credential removal', async () => {
    await page.goto('/auth');
    
    // Register a credential first
    await page.click('[data-testid="register-passkey-button"]');
    await page.waitForSelector('[data-testid="webauthn-prompt"]');
    
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'credential-to-remove',
        privateKey: 'private-key-to-remove',
        signCount: 0
      }
    });
    
    await page.click('[data-testid="complete-registration-button"]');
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // View credentials and remove one
    await page.click('[data-testid="view-credentials-button"]');
    await expect(page.locator('[data-testid="credential-list"]')).toBeVisible();
    
    await page.click('[data-testid="remove-credential-button"]');
    await page.click('[data-testid="confirm-removal-button"]');
    
    // Verify credential is removed
    await expect(page.locator('[data-testid="credential-removed-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="credential-item"]')).toHaveCount(0);
  });

  test('should handle cross-device authentication', async () => {
    await page.goto('/auth');
    
    // Start cross-device authentication
    await page.click('[data-testid="cross-device-auth-button"]');
    
    // Verify QR code is displayed
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // Simulate scanning QR code with another device
    await page.click('[data-testid="simulate-qr-scan-button"]');
    
    // Verify cross-device authentication prompt
    await expect(page.locator('[data-testid="cross-device-prompt"]')).toBeVisible();
    
    // Complete cross-device authentication
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'cross-device-credential',
        privateKey: 'cross-device-private-key',
        signCount: 0
      }
    });
    
    await page.click('[data-testid="complete-cross-device-auth-button"]');
    
    // Verify successful cross-device authentication
    await expect(page.locator('[data-testid="cross-device-success"]')).toBeVisible();
  });

  test('should handle biometric authentication simulation', async () => {
    await page.goto('/auth');
    
    // Start biometric authentication
    await page.click('[data-testid="biometric-auth-button"]');
    
    // Wait for biometric prompt
    await page.waitForSelector('[data-testid="biometric-prompt"]');
    
    // Simulate biometric authentication
    const cdpSession = await context.newCDPSession(page);
    const authenticatorId = await page.evaluate(() => (window as any).__authenticatorId);
    
    // Set user verification to true to simulate successful biometric
    await cdpSession.send('WebAuthn.setUserVerified', {
      authenticatorId,
      isUserVerified: true
    });
    
    await cdpSession.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: 'biometric-credential',
        privateKey: 'biometric-private-key',
        signCount: 0
      }
    });
    
    await page.click('[data-testid="complete-biometric-auth-button"]');
    
    // Verify successful biometric authentication
    await expect(page.locator('[data-testid="biometric-success"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async () => {
    await page.goto('/auth');
    
    // Simulate network error
    await page.route('**/api/auth/webauthn/**', (route: any) => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="register-passkey-button"]');
    
    // Verify network error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');
  });

  test('should handle server errors gracefully', async () => {
    await page.goto('/auth');
    
    // Simulate server error
    await page.route('**/api/auth/webauthn/**', (route: any) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.click('[data-testid="register-passkey-button"]');
    
    // Verify server error handling
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-error"]')).toContainText('Server error');
  });
});

/**
 * WebAuthn E2E Tests - V2 Upgrade (Fixed)
 * 
 * Comprehensive end-to-end tests for WebAuthn passkey functionality
 * using proper WebAuthn fixture with real virtual authenticators.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '../fixtures/webauthn';
import { T } from '@/lib/testing/testIds';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('WebAuthn Passkey Flow - V2 (Fixed)', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'webauthn-test@example.com',
        username: 'webauthntestuser',
        password: 'WebAuthnTest123!'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
    
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user
    });
  });

  test('should complete WebAuthn registration flow with real virtual authenticator', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn registration
    await setupE2ETestData({
      user: testData.user
    });

    // Navigate to registration page
    await page.goto('/register');
    await waitForPageReady(page);
    
    // Wait for registration form to be ready
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill in basic registration info
    await page.fill('[data-testid="register-email"]', testData.user.email);
    await page.fill('[data-testid="register-password"]', testData.user.password);
    await page.fill('[data-testid="register-username"]', testData.user.username);
    
    // Click on WebAuthn registration button
    await page.click('[data-testid="webauthn-register"]');
    
    // Wait for WebAuthn prompt (real or mocked depending on browser)
    if (webauthnMode === 'chromium') {
      // Real WebAuthn flow with virtual authenticator
      await page.waitForSelector('[data-testid="webauthn-prompt"]', { timeout: 10000 });
      
      // The virtual authenticator should automatically handle the WebAuthn flow
      // Wait for successful registration
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    } else {
      // Mocked WebAuthn flow for non-Chromium browsers
      await page.waitForSelector('[data-testid="webauthn-prompt"]', { timeout: 5000 });
      
      // Simulate successful WebAuthn registration
      await page.click('[data-testid="webauthn-confirm"]');
      
      // Wait for successful registration
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    }
    
    console.log(`WebAuthn registration completed on ${webauthnMode} mode`);
  });

  test('should complete WebAuthn authentication flow with real virtual authenticator', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn authentication
    await setupE2ETestData({
      user: testData.user
    });

    // Navigate to login page
    await page.goto('/login');
    await waitForPageReady(page);
    
    // Wait for login form to be ready
    await page.waitForSelector('[data-testid="login-form"]', { state: 'visible' });
    
    // Click on WebAuthn login button
    await page.click('[data-testid="webauthn-login"]');
    
    // Wait for WebAuthn prompt (real or mocked depending on browser)
    if (webauthnMode === 'chromium') {
      // Real WebAuthn flow with virtual authenticator
      await page.waitForSelector('[data-testid="webauthn-prompt"]', { timeout: 10000 });
      
      // The virtual authenticator should automatically handle the WebAuthn flow
      // Wait for successful authentication
      await page.waitForURL('/dashboard', { timeout: 15000 });
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    } else {
      // Mocked WebAuthn flow for non-Chromium browsers
      await page.waitForSelector('[data-testid="webauthn-prompt"]', { timeout: 5000 });
      
      // Simulate successful WebAuthn authentication
      await page.click('[data-testid="webauthn-confirm"]');
      
      // Wait for successful authentication
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    }
    
    console.log(`WebAuthn authentication completed on ${webauthnMode} mode`);
  });

  test('should handle WebAuthn errors gracefully', async ({ page, webauthnMode }) => {
    // Set up test data for WebAuthn error testing
    await setupE2ETestData({
      user: testData.user
    });

    // Navigate to registration page
    await page.goto('/register');
    await waitForPageReady(page);
    
    // Wait for registration form to be ready
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill in basic registration info
    await page.fill('[data-testid="register-email"]', testData.user.email);
    await page.fill('[data-testid="register-password"]', testData.user.password);
    await page.fill('[data-testid="register-username"]', testData.user.username);
    
    // Click on WebAuthn registration button
    await page.click('[data-testid="webauthn-register"]');
    
    // Simulate WebAuthn error by clicking cancel
    await page.click('[data-testid="webauthn-cancel"]');
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="webauthn-error"]')).toBeVisible();
    
    // Verify user is not logged in
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    
    console.log(`WebAuthn error handling tested on ${webauthnMode} mode`);
  });
});

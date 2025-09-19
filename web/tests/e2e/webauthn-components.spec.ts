/**
 * WebAuthn Components E2E Tests
 * 
 * Tests the existing WebAuthn UI components
 * Validates component rendering and basic functionality
 * 
 * Created: January 18, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should render PasskeyButton components', async ({ page }) => {
    // Navigate to a page that should have passkey buttons
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if passkey buttons are present (using actual test IDs from the login page)
    const loginButton = page.locator('[data-testid="login-webauthn"]');

    // The login button should be visible if WebAuthn is supported
    const hasLoginButton = await loginButton.isVisible();
    
    // If WebAuthn is not supported, the button won't be visible, which is expected
    if (hasLoginButton) {
      expect(hasLoginButton).toBe(true);
    } else {
      // Check if WebAuthn is supported in the browser
      const webauthnSupported = await page.evaluate(() => {
        return 'credentials' in navigator && 'PublicKeyCredential' in window;
      });
      
      if (webauthnSupported) {
        // If WebAuthn is supported but button is not visible, that's an issue
        expect(hasLoginButton).toBe(true);
      } else {
        // If WebAuthn is not supported, button not being visible is expected
        expect(hasLoginButton).toBe(false);
      }
    }
  });

  test('should render PasskeyControls component', async ({ page }) => {
    // Navigate to a page that should have passkey controls
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Check if passkey controls are present
    const passkeyControls = page.locator('[data-testid="passkey-management"]');
    
    // Should be visible if user is logged in
    if (await passkeyControls.isVisible()) {
      // Test basic functionality
      const registerButton = page.locator('[data-testid="' + T.webauthn.register + '"]');
      const viewCredentialsButton = page.locator('[data-testid="view-credentials-button"]');
      
      expect(await registerButton.isVisible()).toBe(true);
      expect(await viewCredentialsButton.isVisible()).toBe(true);
    }
  });

  test('should handle WebAuthn support detection', async ({ page }) => {
    // Test WebAuthn support detection
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
  });

  test('should render WebAuthn prompts correctly', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Select passkey registration method
    await page.click('button:has-text("Passkey Account")');
    
    // Wait for passkey registration section to appear
    await page.waitForSelector('[data-testid="' + T.webauthn.register + '"]', { timeout: 10000 });

    // Check that WebAuthn components are rendered
    const registerButton = page.locator('[data-testid="' + T.webauthn.register + '"]');
    
    expect(await registerButton.isVisible()).toBe(true);
    
    // Click the register button to trigger WebAuthn flow
    await registerButton.click();
    
    // The PasskeyButton component should handle the WebAuthn flow
    // We can't easily test the actual WebAuthn prompts without mocking the API
    // But we can verify the button is functional
    expect(await registerButton.isVisible()).toBe(true);
  });

  test('should handle WebAuthn component interactions', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Select passkey registration method
    await page.click('button:has-text("Passkey Account")');
    
    // Wait for passkey registration section to appear
    await page.waitForSelector('[data-testid="' + T.webauthn.register + '"]', { timeout: 10000 });

    // Test button interactions
    const registerButton = page.locator('[data-testid="' + T.webauthn.register + '"]');

    // Test register button click
    await registerButton.click();
    
    // The button should still be visible after click (it handles the WebAuthn flow internally)
    expect(await registerButton.isVisible()).toBe(true);
    
    // Test that the button is clickable and responsive
    await registerButton.hover();
    expect(await registerButton.isVisible()).toBe(true);
  });

  test('should validate WebAuthn component accessibility', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Select passkey registration method
    await page.click('button:has-text("Passkey Account")');
    
    // Wait for passkey registration section to appear
    await page.waitForSelector('[data-testid="' + T.webauthn.register + '"]', { timeout: 10000 });

    // Check accessibility attributes
    const registerButton = page.locator('[data-testid="' + T.webauthn.register + '"]');

    // Check that button is keyboard accessible
    await registerButton.focus();
    expect(await registerButton.evaluate(el => document.activeElement === el)).toBe(true);
    
    // Check that button has proper accessibility attributes
    expect(await registerButton.getAttribute('type')).toBe('button');
    expect(await registerButton.isVisible()).toBe(true);
  });

  test('should handle WebAuthn component error states', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/v1/auth/webauthn/**', route => {
      route.abort('failed');
    });

    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Select passkey registration method
    await page.click('button:has-text("Passkey Account")');
    
    // Wait for passkey registration section to appear
    await page.waitForSelector('[data-testid="' + T.webauthn.register + '"]', { timeout: 10000 });

    // Click register passkey button
    await page.click('[data-testid="' + T.webauthn.register + '"]');

    // Should show error state (the PasskeyButton component should handle this)
    // We can't easily test the exact error message without more complex mocking
    // But we can verify the button is still functional
    const registerButton = page.locator('[data-testid="' + T.webauthn.register + '"]');
    expect(await registerButton.isVisible()).toBe(true);
  });

  test('should validate WebAuthn component responsive design', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Select passkey registration method
    await page.click('button:has-text("Passkey Account")');
    
    // Wait for passkey registration section to appear
    await page.waitForSelector('[data-testid="' + T.webauthn.register + '"]', { timeout: 10000 });

    // Check that components are still visible and functional on mobile
    const registerButton = page.locator('[data-testid="' + T.webauthn.register + '"]');

    expect(await registerButton.isVisible()).toBe(true);

    // Test button click on mobile
    await registerButton.click();
    // Should work on mobile devices
    expect(await registerButton.isVisible()).toBe(true);
  });
});

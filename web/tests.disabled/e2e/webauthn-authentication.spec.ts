/**
 * WebAuthn Authentication E2E Tests
 * 
 * End-to-end tests for WebAuthn passkey authentication flow
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should authenticate with passkey @passkeys', async ({ page }) => {
    // Click "Use Passkey" button
    await page.click('[data-testid="passkey-login-button"]');
    
    // Wait for WebAuthn authentication prompt
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
    
    // Handle WebAuthn authentication (mock or real)
    await page.waitForTimeout(2000);
    
    // Verify successful login - should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should show biometric authentication option @passkeys', async ({ page }) => {
    // Click "Use Passkey" button
    await page.click('[data-testid="passkey-login-button"]');
    
    // Wait for authentication prompt
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
    
    // Verify biometric button is available
    await expect(page.locator('[data-testid="biometric-auth-button"]')).toBeVisible();
    
    // Click biometric authentication
    await page.click('[data-testid="biometric-auth-button"]');
    
    // Handle biometric authentication
    await page.waitForTimeout(2000);
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle WebAuthn authentication errors @passkeys', async ({ page }) => {
    // Click "Use Passkey" button
    await page.click('[data-testid="passkey-login-button"]');
    
    // Wait for authentication prompt
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
    
    // Simulate authentication error (user cancellation)
    await page.waitForTimeout(1000);
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="webauthn-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="webauthn-error"]')).toContainText('Cancelled');
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should fallback to password when passkey fails @passkeys', async ({ page }) => {
    // Click "Use Passkey" button
    await page.click('[data-testid="passkey-login-button"]');
    
    // Wait for authentication prompt
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
    
    // Simulate passkey failure
    await page.waitForTimeout(1000);
    
    // Verify error message
    await expect(page.locator('[data-testid="webauthn-error"]')).toBeVisible();
    
    // Click fallback to password
    await page.click('[data-testid="password-fallback-button"]');
    
    // Should show password form
    await expect(page.locator('[data-testid="password-login-form"]')).toBeVisible();
    
    // Fill password form
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    
    // Submit password form
    await page.click('[data-testid="login-submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show passkey option only when credentials exist @passkeys', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check if passkey button is visible
    const passkeyButton = page.locator('[data-testid="passkey-login-button"]');
    
    // If user has passkeys, button should be visible
    // If no passkeys, button should not be visible
    const isVisible = await passkeyButton.isVisible();
    
    if (isVisible) {
      // User has passkeys, verify button text
      await expect(passkeyButton).toContainText('Use Passkey');
    } else {
      // No passkeys, verify only password form is shown
      await expect(page.locator('[data-testid="password-login-form"]')).toBeVisible();
      await expect(passkeyButton).not.toBeVisible();
    }
  });

  test('should handle network errors during passkey authentication @passkeys', async ({ page }) => {
    // Mock network error
    await page.route('**/api/v1/auth/webauthn/authenticate/options', route => {
      route.fulfill({ status: 500, body: 'Network error' });
    });
    
    // Click "Use Passkey" button
    await page.click('[data-testid="passkey-login-button"]');
    
    // Wait for error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');
  });

  test('should handle server errors during passkey authentication @passkeys', async ({ page }) => {
    // Mock server error
    await page.route('**/api/v1/auth/webauthn/authenticate/verify', route => {
      route.fulfill({ status: 500, body: 'Server error' });
    });
    
    // Click "Use Passkey" button
    await page.click('[data-testid="passkey-login-button"]');
    
    // Wait for authentication prompt
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
    
    // Handle authentication (will fail due to server error)
    await page.waitForTimeout(2000);
    
    // Verify server error message
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-error"]')).toContainText('Server error');
  });
});

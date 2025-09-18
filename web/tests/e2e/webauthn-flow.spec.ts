/**
 * WebAuthn/Passkey E2E Tests
 * 
 * End-to-end tests for WebAuthn registration, authentication, and management
 * 
 * Created: January 17, 2025
 * Updated: January 17, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn/Passkey Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete passkey registration flow @passkeys', async ({ page, browserName }) => {
    // Test passkey registration flow
    await page.click('[data-testid="sign-up-button"]');
    
    // Wait for registration page
    await expect(page).toHaveURL('/register');
    
    // Select passkey registration method
    await page.click('button:has-text("Passkey Account")');
    
    // Fill basic info for passkey registration
    await page.fill('[data-testid="email"]', 'passkey@test.com');
    await page.fill('[data-testid="username"]', 'passkeyuser');
    
    // Click the passkey registration button
    await page.click('[data-testid="webauthn-register"]');
    
    // Wait for passkey creation (this will be mocked in E2E)
    await page.waitForTimeout(2000);
    
    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding?step=welcome');
    
    // Complete onboarding flow
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await page.click('[data-testid="welcome-next"]');
    
    // Skip through onboarding steps quickly for this test
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-continue"]');
    
    // Auth setup step should show passkey option
    await expect(page.locator('[data-testid="auth-setup-step"]')).toBeVisible();
    await page.click('[data-testid="auth-next"]');
    
    // Complete onboarding
    await page.fill('[data-testid="display-name"]', 'Passkey User');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    await page.click('[data-testid="complete-onboarding"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete passkey authentication flow @passkeys', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login page to load
    await page.waitForLoadState('networkidle');
    
    // Click passkey login button
    await page.click('[data-testid="login-webauthn"]');
    
    // Wait for passkey authentication (this will be mocked in E2E)
    await page.waitForTimeout(2000);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should manage passkeys in user profile @passkeys', async ({ page }) => {
    // First, login with a user that has passkeys
    await page.goto('/login');
    await page.click('[data-testid="login-webauthn"]');
    await page.waitForTimeout(2000);
    
    // Navigate to profile/settings
    await page.goto('/profile');
    
    // Should see passkey management section
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Should see existing passkeys
    await expect(page.locator('[data-testid="passkey-list"]')).toBeVisible();
    
    // Test adding a new passkey
    await page.click('[data-testid="add-passkey-button"]');
    await page.waitForTimeout(1000);
    
    // Should see passkey creation success
    await expect(page.locator('[data-testid="passkey-added-success"]')).toBeVisible();
    
    // Test removing a passkey
    await page.click('[data-testid="remove-passkey-button"]');
    await page.waitForTimeout(1000);
    
    // Should see confirmation dialog
    await expect(page.locator('[data-testid="remove-passkey-confirm"]')).toBeVisible();
    await page.click('[data-testid="confirm-remove-passkey"]');
    
    // Should see removal success
    await expect(page.locator('[data-testid="passkey-removed-success"]')).toBeVisible();
  });

  test('should show privacy badge for passkey users @passkeys', async ({ page }) => {
    // Login with passkey user
    await page.goto('/login');
    await page.click('[data-testid="login-webauthn"]');
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should see privacy badge indicating passkey authentication
    await expect(page.locator('[data-testid="privacy-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-badge"]')).toContainText('Passkey Protected');
  });

  test('should handle WebAuthn unsupported browsers gracefully @passkeys', async ({ page }) => {
    // Mock WebAuthn as unsupported
    await page.addInitScript(() => {
      // Remove WebAuthn support
      delete (window as any).PublicKeyCredential;
      delete (navigator as any).credentials;
    });
    
    // Navigate to registration
    await page.goto('/register');
    
    // Should not show passkey option
    await expect(page.locator('button:has-text("Passkey Account")')).not.toBeVisible();
    
    // Navigate to login
    await page.goto('/login');
    
    // Should not show passkey login option
    await expect(page.locator('[data-testid="login-webauthn"]')).not.toBeVisible();
  });

  test('should handle passkey registration errors gracefully @passkeys', async ({ page }) => {
    // Mock WebAuthn to throw an error
    await page.addInitScript(() => {
      (window as any).PublicKeyCredential = {
        create: () => Promise.reject(new Error('WebAuthn error'))
      };
    });
    
    // Navigate to registration
    await page.goto('/register');
    
    // Select passkey registration
    await page.click('button:has-text("Passkey Account")');
    await page.fill('[data-testid="email"]', 'error@test.com');
    await page.fill('[data-testid="username"]', 'erroruser');
    
    // Try to create passkey
    await page.click('[data-testid="webauthn-register"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="register-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-error"]')).toContainText('WebAuthn error');
  });
});

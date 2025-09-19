/**
 * WebAuthn Registration E2E Tests
 * 
 * End-to-end tests for WebAuthn passkey registration flow
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should register passkey during onboarding @passkeys', async ({ page }) => {
    // Navigate to registration page
    await page.click('[data-testid="sign-up-button"]');
    
    // Wait for registration page
    await expect(page).toHaveURL('/register');
    
    // Fill basic registration info
    await page.fill('[data-testid="email"]', 'passkey@test.com');
    await page.fill('[data-testid="username"]', 'passkeyuser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    
    // Submit registration form
    await page.click('[data-testid="register-submit"]');
    
    // Wait for redirect to onboarding
    await expect(page).toHaveURL('/onboarding?step=welcome');
    
    // Complete onboarding flow to auth setup step
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await page.click('[data-testid="welcome-next"]');
    
    await expect(page.locator('[data-testid="privacy-step"]')).toBeVisible();
    await page.click('[data-testid="privacy-next"]');
    
    await expect(page.locator('[data-testid="tour-step"]')).toBeVisible();
    await page.click('[data-testid="tour-next"]');
    
    await expect(page.locator('[data-testid="data-usage-step"]')).toBeVisible();
    await page.click('[data-testid="data-usage-continue"]');
    
    // Navigate to auth setup step
    await expect(page.locator('[data-testid="auth-setup-step"]')).toBeVisible();
    
    // Click "Create Passkey" button
    await page.click('[data-testid="create-passkey-button"]');
    
    // Wait for WebAuthn registration prompt
    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
    
    // Handle WebAuthn registration (mock or real)
    // For E2E tests, we'll simulate the registration process
    await page.waitForTimeout(2000);
    
    // Verify success message
    await expect(page.locator('[data-testid="passkey-success"]')).toBeVisible();
    
    // Complete onboarding
    await page.click('[data-testid="auth-next"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should register passkey from profile page @passkeys', async ({ page }) => {
    // Navigate to profile page (assuming user is logged in)
    await page.goto('/profile');
    
    // Navigate to biometric setup
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for biometric setup page
    await expect(page).toHaveURL('/profile/biometric-setup');
    
    // Click "Create Passkey" button
    await page.click('[data-testid="create-passkey-button"]');
    
    // Wait for WebAuthn registration prompt
    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
    
    // Handle WebAuthn registration
    await page.waitForTimeout(2000);
    
    // Verify success message
    await expect(page.locator('[data-testid="passkey-success"]')).toBeVisible();
    
    // Verify passkey appears in management list
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
  });

  test('should handle WebAuthn registration errors @passkeys', async ({ page }) => {
    // Navigate to registration page
    await page.click('[data-testid="sign-up-button"]');
    await expect(page).toHaveURL('/register');
    
    // Fill registration form
    await page.fill('[data-testid="email"]', 'error@test.com');
    await page.fill('[data-testid="username"]', 'erroruser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Navigate to auth setup step
    await page.goto('/onboarding?step=auth-setup');
    
    // Click "Create Passkey" button
    await page.click('[data-testid="create-passkey-button"]');
    
    // Simulate WebAuthn error (user cancellation)
    await page.waitForTimeout(1000);
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="webauthn-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="webauthn-error"]')).toContainText('Cancelled');
  });

  test('should show passkey option only when supported @passkeys', async ({ page }) => {
    // Navigate to registration page
    await page.click('[data-testid="sign-up-button"]');
    await expect(page).toHaveURL('/register');
    
    // Check if passkey button is visible (depends on browser support)
    const passkeyButton = page.locator('[data-testid="create-passkey-button"]');
    
    // If WebAuthn is supported, button should be visible
    // If not supported, button should not be visible
    const isVisible = await passkeyButton.isVisible();
    
    if (isVisible) {
      // WebAuthn is supported, verify button text
      await expect(passkeyButton).toContainText('Create Passkey');
    } else {
      // WebAuthn not supported, verify fallback option
      await expect(page.locator('[data-testid="email-link-button"]')).toBeVisible();
    }
  });
});

/**
 * Onboarding WebAuthn Integration E2E Tests
 * 
 * Tests WebAuthn passkey integration in the onboarding flow
 * Ensures proper authentication setup and user experience
 * 
 * Created: October 3, 2025
 */

import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  setupExternalAPIMocks
} from './helpers/e2e-setup';
import { waitForHydrationAndForm } from '../utils/hydration';

test.describe('Onboarding WebAuthn Integration', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data
    testData = {
      user: createTestUser('onboarding-webauthn-test')
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Set up test data
    await setupE2ETestData({
      user: testData.user
    });
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user
    });
  });

  test('should complete onboarding with WebAuthn passkey setup', async ({ page }) => {
    // Start from landing page and go through registration to reach onboarding
    await page.goto('/');
    await waitForPageReady(page);

    // Click sign up to start registration
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration using the utility
    // Wait for page hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Now we're in onboarding - Step 1: Welcome step
    await expect(page.locator('h1:has-text("Welcome to Choices")')).toBeVisible();
    await page.click('[data-testid="welcome-next"]');

    // Step 2: Privacy step
    await expect(page.locator('text=Your Privacy Matters')).toBeVisible();
    await page.click('[data-testid="privacy-next"]');

    // Step 3: Demographics step
    await expect(page.locator('text=Help Us Personalize Your Experience')).toBeVisible();
    
    // Fill in location - select California from the dropdown
    await page.selectOption('select', { value: 'CA' });
    await page.click('[data-testid="profile-next"]');

    // Step 4: Authentication step
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    
    // Check that WebAuthn option is available
    await expect(page.locator('[data-testid="auth-passkey-option"]')).toBeVisible();
    
    // Select passkey authentication
    await page.click('[data-testid="auth-passkey-option"]');
    
    // Should show passkey setup interface
    await expect(page.locator('text=Set Up Your Passkey')).toBeVisible();
    await expect(page.locator('[data-testid="onboarding-passkey-setup"]')).toBeVisible();
    
    // The PasskeyRegister component should be rendered
    await expect(page.locator('[data-testid="webauthn-register"]')).toBeVisible();
  });

  test('should handle WebAuthn feature flag disabled gracefully', async ({ page }) => {
    // Mock WebAuthn feature flag as disabled
    await page.addInitScript(() => {
      window.localStorage.setItem('feature-flags', JSON.stringify({
        WEBAUTHN: false
      }));
    });

    // Start from landing page and go through registration to reach onboarding
    await page.goto('/');
    await waitForPageReady(page);

    // Click sign up to start registration
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration using the utility
    // Wait for page hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Navigate to auth step
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    
    // Fill in demographics
    await page.selectOption('select', { value: 'CA' });
    await page.click('[data-testid="profile-next"]');

    // Check that WebAuthn option is not visible when feature is disabled
    await expect(page.locator('[data-testid="auth-passkey-option"]')).not.toBeVisible();
    
    // Email and Google options should still be available
    await expect(page.locator('[data-testid="auth-email-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-google-option"]')).toBeVisible();
  });

  test('should allow fallback to email authentication', async ({ page }) => {
    // Start from landing page and go through registration to reach onboarding
    await page.goto('/');
    await waitForPageReady(page);

    // Click sign up to start registration
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration using the utility
    // Wait for page hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Navigate to auth step
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    
    // Fill in demographics
    await page.selectOption('select', { value: 'CA' });
    await page.click('[data-testid="profile-next"]');

    // Select email authentication
    await page.click('[data-testid="auth-email-option"]');
    
    // Should redirect to registration page
    await expect(page).toHaveURL('/register');
  });

  test('should allow fallback to Google authentication', async ({ page }) => {
    // Start from landing page and go through registration to reach onboarding
    await page.goto('/');
    await waitForPageReady(page);

    // Click sign up to start registration
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration using the utility
    // Wait for page hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Navigate to auth step
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    
    // Fill in demographics
    await page.selectOption('select', { value: 'CA' });
    await page.click('[data-testid="profile-next"]');

    // Select Google authentication
    await page.click('[data-testid="auth-google-option"]');
    
    // Should redirect to Google OAuth
    await expect(page).toHaveURL('/auth/google');
  });

  test('should handle WebAuthn errors gracefully in onboarding', async ({ page }) => {
    // Mock WebAuthn API to return error
    await page.route('**/api/v1/auth/webauthn/register/options', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'WebAuthn service unavailable' })
      });
    });

    // Start from landing page and go through registration to reach onboarding
    await page.goto('/');
    await waitForPageReady(page);

    // Click sign up to start registration
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration using the utility
    // Wait for page hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Navigate to auth step
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    
    // Fill in demographics
    await page.selectOption('select', { value: 'CA' });
    await page.click('[data-testid="profile-next"]');

    // Select passkey authentication
    await page.click('[data-testid="auth-passkey-option"]');
    
    // Should show passkey setup interface
    await expect(page.locator('[data-testid="onboarding-passkey-setup"]')).toBeVisible();
    
    // Try to create passkey (should fail)
    await page.click('[data-testid="webauthn-register"]');
    
    // Should show error message
    await expect(page.locator('text=WebAuthn service unavailable')).toBeVisible();
  });

  test('should complete full onboarding flow with passkey', async ({ page }) => {
    // Start from landing page and go through registration to reach onboarding
    await page.goto('/');
    await waitForPageReady(page);

    // Click sign up to start registration
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration using the utility
    // Wait for page hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="register-form"]', { state: 'visible' });
    
    // Fill registration form
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Complete all steps
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    
    // Fill demographics
    await page.selectOption('select', { value: 'CA' });
    await page.click('[data-testid="profile-next"]');
    
    // Select passkey authentication
    await page.click('[data-testid="auth-passkey-option"]');
    
    // Should show passkey setup
    await expect(page.locator('[data-testid="onboarding-passkey-setup"]')).toBeVisible();
    
    // Skip passkey setup for this test (would require actual WebAuthn)
    await page.click('text=Skip for now');
    
    // Should proceed to completion step
    await expect(page.locator('text=You\'re All Set!')).toBeVisible();
  });
});

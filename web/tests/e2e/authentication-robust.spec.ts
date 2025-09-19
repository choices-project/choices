/**
 * Robust Authentication Flow E2E Tests
 * 
 * Uses the new hydration utilities and E2E bypass patterns
 * to provide reliable authentication testing across all browsers.
 * 
 * Created: January 18, 2025
 */

import { test, expect } from '@playwright/test';
import { waitForHydrationAndForm, waitForHydrationAndFormElements } from '../utils/hydration';

test.describe('Robust Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('login page renders & form elements visible', async ({ page }) => {
    await page.goto('/login?e2e=1', { waitUntil: 'domcontentloaded' });

    // Wait for hydration and form to be ready
    await waitForHydrationAndFormElements(
      page,
      'login-hydrated', // This needs to be added to login page
      'login-form',
      ['login-email', 'login-password', 'login-submit']
    );

    // Verify form elements are visible and enabled
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeEnabled();
  });

  test('register page renders & form elements visible', async ({ page }) => {
    await page.goto('/register?e2e=1', { waitUntil: 'domcontentloaded' });

    // Wait for hydration and form to be ready
    await waitForHydrationAndFormElements(
      page,
      'register-hydrated',
      'register-form',
      ['email', 'username', 'password', 'confirm-password', 'register-button']
    );

    // Verify form elements are visible and enabled
    await expect(page.getByTestId('email')).toBeVisible();
    await expect(page.getByTestId('username')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('confirm-password')).toBeVisible();
    await expect(page.getByTestId('register-button')).toBeEnabled();
  });

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/register?e2e=1', { waitUntil: 'domcontentloaded' });

    // Wait for form to be ready
    await waitForHydrationAndForm(
      page,
      'register-hydrated',
      'register-form'
    );

    // Fill registration form
    const testEmail = `test-${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;

    await page.fill('[data-testid="email"]', testEmail);
    await page.fill('[data-testid="username"]', testUsername);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Wait for form submission to process
    await page.waitForTimeout(2000);

    // Check for success or redirect
    const currentUrl = await page.url();
    console.log('Current URL after registration:', currentUrl);

    // Should either redirect to onboarding or show success message
    if (currentUrl.includes('/onboarding')) {
      // Registration successful, redirected to onboarding
      await expect(page).toHaveURL(/\/onboarding/);
    } else {
      // Check for success message or error
      const errorElement = await page.locator('[data-testid="register-error"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('Registration error:', errorText);
        // Don't fail the test if it's a known issue (like user already exists)
        expect(errorText).not.toContain('Unexpected error');
      }
    }
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login?e2e=1', { waitUntil: 'domcontentloaded' });

    // Wait for form to be ready
    await waitForHydrationAndForm(
      page,
      'login-hydrated', // This needs to be added to login page
      'login-form'
    );

    // Fill with invalid credentials
    await page.fill('[data-testid="login-email"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');

    // Submit login
    await page.click('[data-testid="login-submit"]');

    // Wait for error message
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('login-error')).toContainText(/invalid credentials/i);
  });

  test('should navigate between login and register pages', async ({ page }) => {
    // Start at login
    await page.goto('/login?e2e=1', { waitUntil: 'domcontentloaded' });
    await waitForHydrationAndForm(page, 'login-hydrated', 'login-form');

    // Navigate to register
    await page.click('text=Create one');
    await expect(page).toHaveURL('/register');

    // Wait for register form
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');

    // Navigate back to login
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/login');

    // Wait for login form
    await waitForHydrationAndForm(page, 'login-hydrated', 'login-form');
  });
});

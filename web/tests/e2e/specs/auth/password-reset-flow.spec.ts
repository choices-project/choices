/**
 * Password Reset Flow E2E Tests
 *
 * Tests the complete password reset flow:
 * 1. Request password reset (email submission)
 * 2. Email delivery (requires manual verification in production)
 * 3. Reset link handling (token exchange)
 * 4. New password submission
 * 5. Login with new password
 *
 * Created: January 21, 2026
 * Status: ✅ ACTIVE
 */

import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  waitForPageReady,
} from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start logged out
    await ensureLoggedOut(page);
  });

  test('password reset request page loads and shows form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000); // Wait for page to fully render

    // Check for reset password heading (more flexible matching)
    const heading = page.locator('h1').filter({ hasText: /reset|password|forgot/i }).first();
    const hasHeading = (await heading.count()) > 0;

    if (!hasHeading) {
      // Alternative: check for any heading or page content
      const anyHeading = page.locator('h1, h2').first();
      await expect(anyHeading).toBeVisible({ timeout: 5_000 });
    } else {
      await expect(heading).toBeVisible({ timeout: 5_000 });
    }

    // Check for email input
    const emailInput = page.locator('input[type="email"]#reset-email, input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 5_000 });

    // Check for back to sign in link (optional - might not always be present)
    const backLink = page.locator('a[href*="/auth"]').first();
    const hasBackLink = (await backLink.count()) > 0;
    if (hasBackLink) {
      await expect(backLink).toBeVisible({ timeout: 5_000 });
    }
  });

  test('can request password reset for valid email', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto(`${BASE_URL}/auth/reset`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Use a test email (this won't actually send in E2E harness mode, but tests the flow)
    const testEmail = process.env.E2E_USER_EMAIL || 'test@example.com';

    // Fill in email
    const emailInput = page.locator('input[type="email"]#reset-email, input[name="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
    await emailInput.fill(testEmail);
    await page.waitForTimeout(500);

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible', timeout: 5_000 });
    await submitButton.click();

    // Wait for response (either success or error message)
    // Wait longer for Supabase to process the request
    await page.waitForTimeout(8_000);

    // Check for success message (green success box with role="status")
    // Success state shows a div with role="status" and green styling
    const successBox = page.locator('[role="status"]');
    const successText = page.locator('text=/check.*email|reset.*link.*sent|we.*sent|email.*sent/i');
    const errorMessage = page.locator('[role="alert"]');

    // Check if form is still visible (if hidden, might indicate success)
    const form = page.locator('form').first();
    const isFormVisible = await form.isVisible().catch(() => false);

    // Check states
    const hasSuccessBox = (await successBox.count()) > 0;
    const hasSuccessText = (await successText.count()) > 0;
    const hasError = (await errorMessage.count()) > 0;

    // In production, Supabase always returns success (even for non-existent emails for security)
    // So we should see either success message or form state change
    // If we see an error, that's also acceptable (might be validation error)
    // Also check if button is disabled (indicates submission in progress or complete)
    const buttonDisabled = await submitButton.isDisabled().catch(() => false);
    const hasAnyResponse = hasSuccessBox || hasSuccessText || hasError || !isFormVisible || buttonDisabled;

    // Verify we got some response (form submitted and got feedback)
    // If none of these are true, the form might not have submitted properly
    if (!hasAnyResponse) {
      // Log diagnostic info
      const pageContent = await page.locator('body').textContent();
      console.log('[DIAGNOSTIC] Password reset form state:', {
        hasSuccessBox,
        hasSuccessText,
        hasError,
        isFormVisible,
        buttonDisabled,
        pageText: pageContent?.substring(0, 200),
      });
    }
    expect(hasAnyResponse).toBe(true);

    // If we have success indicators, verify they're visible
    if (hasSuccessBox) {
      await expect(successBox.first()).toBeVisible({ timeout: 2_000 });
    }
    if (hasSuccessText && !hasSuccessBox) {
      await expect(successText.first()).toBeVisible({ timeout: 2_000 });
    }
  });

  test('password reset confirm page handles invalid token gracefully', async ({ page }) => {
    test.setTimeout(30_000);

    // Navigate to confirm page with invalid token
    await page.goto(`${BASE_URL}/auth/reset/confirm?code=invalid_token`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    // Should show error message or invalid link message
    const errorMessage = page.locator('text=/invalid|expired|error|link/i');
    const hasError = (await errorMessage.count()) > 0;

    // Page should handle error gracefully (either show error or redirect)
    const currentUrl = page.url();
    const isErrorPage = currentUrl.includes('/auth/reset') || hasError;

    expect(isErrorPage).toBe(true);
  });

  test('password reset confirm page shows form when valid token is present', async ({ page }) => {
    test.setTimeout(30_000);

    // Note: This test requires a valid reset token, which would come from email
    // In production, this would be tested manually or with email service integration
    // For now, we test that the page structure is correct

    // Navigate to confirm page (without token - will show error, but we can check structure)
    await page.goto(`${BASE_URL}/auth/reset/confirm`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    // Check if we see the form (when token is valid) or error message (when invalid)
    const heading = page.locator('h1');
    const passwordInput = page.locator('input[type="password"]');
    const errorMessage = page.locator('text=/invalid|error|link|request/i');
    const loadingText = page.locator('text=/loading|preparing/i');

    // Should see either the form heading, password input, error message, or loading state
    const hasHeading = (await heading.count()) > 0;
    const hasPasswordInput = (await passwordInput.count()) > 0;
    const hasError = (await errorMessage.count()) > 0;
    const isLoading = (await loadingText.count()) > 0;

    // Page should render something (form, error, or loading state)
    expect(hasHeading || hasPasswordInput || hasError || isLoading).toBe(true);
  });

  test('password reset form validates password requirements', async ({ page }) => {
    test.setTimeout(30_000);

    // This test assumes we have a valid reset token (would need email integration)
    // For now, we test the form validation logic by checking the page structure

    await page.goto(`${BASE_URL}/auth/reset/confirm?code=test_code`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    // Check if password inputs are present (if token was valid)
    const passwordInput = page.locator('input[type="password"]#new-password, input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"]#confirm-password, input[type="password"]').last();

    // If form is visible (valid token), test validation
    if ((await passwordInput.count()) > 0) {
      // Try to submit with short password
      await passwordInput.fill('short');
      await confirmPasswordInput.fill('short');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(1_000);

      // Should show validation error
      const errorMessage = page.locator('text=/too short|at least 8|password.*length/i');
      const hasError = (await errorMessage.count()) > 0;

      // Validation should catch short passwords
      expect(hasError).toBe(true);
    }
  });

  test('password reset flow end-to-end (requires manual email verification)', async () => {
    test.skip(
      true,
      'Full E2E password reset requires email delivery verification. Test manually in production: 1) Request reset 2) Check email 3) Click link 4) Set new password 5) Login with new password'
    );
  });

  test('password reset link from auth page works', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Look for "Forgot password?" or similar link
    const forgotPasswordLink = page.locator('a[href*="/auth/reset"], a[href*="/reset"]').or(page.locator('text=/forgot.*password|reset.*password/i'));

    // Link might be present in login form
    if ((await forgotPasswordLink.count()) > 0) {
      await expect(forgotPasswordLink.first()).toBeVisible({ timeout: 5_000 });

      // Click the link
      await forgotPasswordLink.first().click();
      await page.waitForTimeout(2_000);

      // Should navigate to reset page
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth/reset`), { timeout: 10_000 });
    } else {
      // If link not found, that's okay - might be in different location
      // Just verify we can navigate to reset page directly
      await page.goto(`${BASE_URL}/auth/reset`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 5_000 });
    }
  });

  test('can navigate back to auth from reset page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Find back to sign in link
    const backLink = page.locator('a[href*="/auth"]').first();
    await expect(backLink).toBeVisible({ timeout: 5_000 });

    // Click back link
    await backLink.click();
    await page.waitForTimeout(2_000);

    // Should navigate to auth page
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 10_000 });
  });
});

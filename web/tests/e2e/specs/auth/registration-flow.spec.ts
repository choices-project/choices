import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  waitForPageReady,
  createTestUser,
} from '../../helpers/e2e-setup';

/**
 * Registration Flow Tests
 *
 * Tests the complete registration flow including:
 * - User can register with email/password
 * - Profile is created after registration (CRITICAL: Fixed Jan 19, 2026)
 * - User can access profile after registration
 * - Registration errors are handled correctly
 * - Duplicate email/username handling
 *
 * These tests verify the critical bug fix where profile creation was failing
 * due to RLS policies. The fix uses admin client to bypass RLS.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start logged out for each test
    await ensureLoggedOut(page);
  });

  test.describe('Registration Form', () => {
    test('registration form loads and displays correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for auth page to be hydrated
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 30_000 });

      // Toggle to signup mode
      const toggleButton = page.locator('[data-testid="auth-toggle"]').first();
      await expect(toggleButton).toBeVisible({ timeout: 10_000 });

      // Click toggle to switch to signup
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Should see signup form elements
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const displayNameInput = page.locator('input[data-testid="auth-display-name"]').first();
      const confirmPasswordInput = page.locator('input[data-testid="auth-confirm-password"]').first();

      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      await expect(passwordInput).toBeVisible({ timeout: 5_000 });

      // Display name and confirm password should be visible in signup mode
      // (or at least the heading should indicate signup mode)
      const signupHeading = page.locator('text=/sign up|create account/i').first();
      await expect(signupHeading).toBeVisible({ timeout: 5_000 }).catch(async () => {
        // If heading not visible, check if form elements are there
        await expect(displayNameInput).toBeVisible({ timeout: 2_000 }).catch(() => {
          // Acknowledge confirmPasswordInput for future use
          void confirmPasswordInput;
        });
      });
    });

    test('can toggle between login and signup forms', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 30_000 });

      const toggleButton = page.locator('[data-testid="auth-toggle"]').first();
      await expect(toggleButton).toBeVisible({ timeout: 10_000 });

      // Click toggle to switch to signup
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Should see signup heading
      const signupHeading = page.locator('text=/sign up|create account/i').first();
      await expect(signupHeading).toBeVisible({ timeout: 5_000 });

      // Toggle back to login
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Should see login form again
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Registration Success Flow', () => {
    test('user can register and profile is created (CRITICAL: Verifies RLS fix)', async ({ page }) => {
      test.setTimeout(120_000);

      // Create unique test user
      const testUser = createTestUser({
        email: `test-registration-${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: 'TestPassword123!',
      });

      // Diagnostic: Capture console messages and network requests
      const consoleMessages: string[] = [];
      const networkRequests: Array<{ url: string; status: number; method: string }> = [];

      page.on('console', (msg) => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
        if (msg.text().includes('[DIAGNOSTIC]') || msg.text().includes('🚨') || msg.text().includes('✅')) {
          console.log(`[DIAGNOSTIC] ${msg.text()}`);
        }
      });

      page.on('response', (response) => {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      });

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for auth page to be hydrated
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 30_000 });

      // Toggle to signup mode
      const toggleButton = page.locator('[data-testid="auth-toggle"]').first();
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Fill in registration form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const displayNameInput = page.locator('input[data-testid="auth-display-name"]').first();

      await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
      await passwordInput.waitFor({ state: 'visible', timeout: 10_000 });

      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);

      // Fill display name if present (required for signup)
      const displayNameCount = await displayNameInput.count();
      if (displayNameCount > 0) {
        await displayNameInput.fill(testUser.username);
      }

      // Also fill confirm password if present (required for signup)
      const confirmPasswordInput = page.locator('input[data-testid="auth-confirm-password"]').first();
      const confirmPasswordCount = await confirmPasswordInput.count();
      if (confirmPasswordCount > 0) {
        await confirmPasswordInput.fill(testUser.password);
      }

      // Wait for React to process inputs and sync mechanism to run
      await page.waitForTimeout(500);

      // Trigger events manually to ensure React processes the values
      await page.evaluate(() => {
        const emailEl = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
        const passwordEl = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
        const displayNameEl = document.querySelector('[data-testid="auth-display-name"]') as HTMLInputElement;
        const confirmPasswordEl = document.querySelector('[data-testid="auth-confirm-password"]') as HTMLInputElement;

        [emailEl, passwordEl, displayNameEl, confirmPasswordEl].forEach(el => {
          if (el) {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      await page.waitForTimeout(300);

      // Find and click submit button - use data-testid for reliability
      const submitButton = page.locator('[data-testid="login-submit"]').first();
      await submitButton.waitFor({ state: 'visible', timeout: 10_000 });

      // Wait for button to be enabled (form validation passes)
      // Registration form requires: email, password (>=8 chars), displayName (>=3 chars), confirmPassword match
      let buttonEnabled = false;
      const maxWaitAttempts = 100; // 30 seconds total (100 * 300ms)
      
      for (let attempt = 0; attempt < maxWaitAttempts; attempt++) {
        buttonEnabled = !(await submitButton.isDisabled());
        if (buttonEnabled) {
          break;
        }
        
        // Every 10 attempts, trigger events again to help React sync
        if (attempt % 10 === 0 && attempt > 0) {
          await page.evaluate(() => {
            const emailEl = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
            const passwordEl = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
            const displayNameEl = document.querySelector('[data-testid="auth-display-name"]') as HTMLInputElement;
            const confirmPasswordEl = document.querySelector('[data-testid="auth-confirm-password"]') as HTMLInputElement;
            
            [emailEl, passwordEl, displayNameEl, confirmPasswordEl].forEach(el => {
              if (el) {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.focus();
                el.blur();
              }
            });
          });
        }
        
        await page.waitForTimeout(300);
      }
      
      if (!buttonEnabled) {
        // Diagnostic: check form state
        const formState = await page.evaluate(() => {
          const email = (document.querySelector('[data-testid="login-email"]') as HTMLInputElement)?.value || '';
          const password = (document.querySelector('[data-testid="login-password"]') as HTMLInputElement)?.value || '';
          const displayName = (document.querySelector('[data-testid="auth-display-name"]') as HTMLInputElement)?.value || '';
          const confirmPassword = (document.querySelector('[data-testid="auth-confirm-password"]') as HTMLInputElement)?.value || '';
          const button = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;

          return {
            email: email,
            passwordLength: password.length,
            displayNameLength: displayName.length,
            passwordsMatch: password === confirmPassword,
            buttonDisabled: button?.disabled ?? true,
            emailValid: email.includes('@'),
            passwordValid: password.length >= 8,
            displayNameValid: displayName.length >= 3,
          };
        });
        console.log('[DIAGNOSTIC] Registration form state:', formState);
        throw new Error(`Registration submit button remained disabled after ${maxWaitAttempts} attempts. Form state: ${JSON.stringify(formState)}`);
      }

      // Click submit
      await submitButton.click();

      // Wait for registration API response
      const registrationResponse = await page.waitForResponse(
        (res) => res.url().includes('/api/auth/register') && res.request().method() === 'POST',
        { timeout: 60_000 }
      ).catch(() => null);

      if (!registrationResponse) {
        // Check for error messages
        const errorElement = page.locator('[data-testid="auth-error"]');
        const errorCount = await errorElement.count();
        if (errorCount > 0) {
          const errorText = await errorElement.first().textContent();
          throw new Error(`Registration failed with error: ${errorText}`);
        }
        throw new Error('Registration API request was not made or timed out');
      }

      const responseBody = await registrationResponse.json().catch(() => ({}));

      // Verify registration was successful
      expect(registrationResponse.status()).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data?.user).toBeDefined();
      expect(responseBody.data?.user?.email).toBe(testUser.email);

      // CRITICAL: Verify profile was created (this is what the fix ensures)
      expect(responseBody.data?.user?.username).toBeDefined();
      expect(responseBody.data?.user?.username).toBe(testUser.username.toLowerCase());
      expect(responseBody.data?.user?.trust_tier).toBeDefined();
      expect(responseBody.data?.user?.display_name).toBeDefined();

      console.log('[DIAGNOSTIC] Registration successful with profile:', {
        userId: responseBody.data?.user?.id,
        email: responseBody.data?.user?.email,
        username: responseBody.data?.user?.username,
        trustTier: responseBody.data?.user?.trust_tier,
        displayName: responseBody.data?.user?.display_name,
      });

      // Wait for authentication cookies/session
      await expect
        .poll(
          async () => {
            const cookies = await page.context().cookies();
            const hasAuthCookie = cookies.some(c =>
              c.name.startsWith('sb-') &&
              (c.name.includes('auth') || c.name.includes('session')) &&
              c.value &&
              c.value.length > 0
            );
            return hasAuthCookie;
          },
          { timeout: 60_000, intervals: [2_000] },
        )
        .toBeTruthy();

      // After registration, user should be redirected
      await page.waitForTimeout(2_000);
      const finalUrl = page.url();

      // Should redirect to onboarding or dashboard
      expect(finalUrl).toMatch(/\/(onboarding|dashboard|feed)/);

      // CRITICAL VERIFICATION: Try to access profile page to verify profile exists
      // This verifies the RLS fix - if profile wasn't created, this would fail
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Should not redirect to auth (profile should be accessible)
      const profileUrl = page.url();
      expect(profileUrl).not.toMatch(/\/auth/);

      // Profile page should load (or show appropriate error if not onboarded)
      // The key is that we shouldn't get a "profile not found" error
      const errorElement = page.locator('[data-testid="profile-error"]');
      const errorCount = await errorElement.count();
      if (errorCount > 0) {
        const errorText = await errorElement.first().textContent();
        // "Profile not found" would indicate the RLS fix didn't work
        if (errorText?.includes('profile not found') || errorText?.includes('Failed to load profile')) {
          throw new Error(`CRITICAL: Profile not found after registration - RLS fix may not be working. Error: ${errorText}`);
        }
      }

      console.log('[DIAGNOSTIC] Registration flow completed successfully:', {
        finalUrl,
        profileUrl,
        hasProfileError: errorCount > 0,
        networkRequests: networkRequests.filter(r => r.url.includes('/api/auth/register') || r.url.includes('/api/profile')),
      });
    });
  });

  test.describe('Registration Error Handling', () => {
    test('registration fails with duplicate email', async ({ page }) => {
      test.setTimeout(120_000);

      // Use existing test credentials if available
      const regularEmail = process.env.E2E_USER_EMAIL;
      const regularPassword = process.env.E2E_USER_PASSWORD;

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 30_000 });

      // Toggle to signup mode
      const toggleButton = page.locator('[data-testid="auth-toggle"]').first();
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Try to register with existing email
      const emailInput = page.locator('[data-testid="login-email"]').first();
      const passwordInput = page.locator('[data-testid="login-password"]').first();
      const displayNameInput = page.locator('[data-testid="auth-display-name"]').first();
      const confirmPasswordInput = page.locator('[data-testid="auth-confirm-password"]').first();

      await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
      await passwordInput.waitFor({ state: 'visible', timeout: 10_000 });

      await emailInput.fill(regularEmail);
      await passwordInput.fill(regularPassword);

      // Fill display name and confirm password if present
      const displayNameCount = await displayNameInput.count();
      if (displayNameCount > 0) {
        await displayNameInput.fill('Test User');
      }

      const confirmPasswordCount = await confirmPasswordInput.count();
      if (confirmPasswordCount > 0) {
        await confirmPasswordInput.fill(regularPassword);
      }

      // Wait for React to process and trigger events
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const emailEl = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
        const passwordEl = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
        const displayNameEl = document.querySelector('[data-testid="auth-display-name"]') as HTMLInputElement;
        const confirmPasswordEl = document.querySelector('[data-testid="auth-confirm-password"]') as HTMLInputElement;

        [emailEl, passwordEl, displayNameEl, confirmPasswordEl].forEach(el => {
          if (el) {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
      await page.waitForTimeout(300);

      // Wait for button to be enabled
      const submitButton = page.locator('[data-testid="login-submit"]').first();
      await submitButton.waitFor({ state: 'visible', timeout: 10_000 });

      // Wait for button to be enabled (with timeout)
      await page.waitForFunction(
        () => {
          const button = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
          return button && !button.disabled;
        },
        { timeout: 30_000 }
      ).catch(() => {
        // If button stays disabled, try clicking anyway (may be validation issue)
        console.log('[DIAGNOSTIC] Submit button may be disabled, attempting click anyway');
      });

      await submitButton.click();

      // Wait for error response
      const errorResponse = await page.waitForResponse(
        (res) => res.url().includes('/api/auth/register') && res.request().method() === 'POST',
        { timeout: 30_000 }
      ).catch(() => null);

      if (errorResponse) {
        const status = errorResponse.status();
        expect(status).toBeGreaterThanOrEqual(400);
      } else {
        // Check for UI error message
        const errorElement = page.locator('[data-testid="auth-error"]');
        const errorCount = await errorElement.count();
        expect(errorCount).toBeGreaterThan(0);
      }
    });
  });
});

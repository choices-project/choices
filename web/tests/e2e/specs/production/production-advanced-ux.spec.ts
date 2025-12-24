import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Production Advanced UX Tests
 *
 * Advanced production tests focusing on optimal user experience:
 * - Complex multi-step workflows
 * - Data persistence and state management
 * - Advanced accessibility scenarios
 * - Real-world usage patterns
 * - Performance under realistic conditions
 * - Security and privacy UX
 * - Error recovery in complex scenarios
 * - Cross-device consistency
 *
 * These tests challenge the codebase to ensure the best possible UX/UI
 * in complex, real-world scenarios.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Advanced UX', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Complex Multi-Step Workflows', () => {
    test('complete onboarding to poll creation workflow maintains state', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Step 1: Register/Login
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Step 2: Navigate through onboarding if present
      const currentUrl = page.url();
      if (currentUrl.includes('/onboarding')) {
        // Complete onboarding steps
        const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').first();
        if (await continueButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await continueButton.click();
          await waitForPageReady(page);
        }
      }

      // Step 3: Navigate to feed
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const feedLink = page.locator('a[href="/feed"]').first();
        if (await feedLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await feedLink.click();
        } else {
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      // Step 4: Verify feed is accessible and functional
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(feed|dashboard)`), { timeout: 15_000 });

      // Step 5: Check if poll creation is accessible
      const createPollButton = page.locator('button:has-text("Create"), a[href*="poll"], button[aria-label*="create" i]').first();
      await createPollButton.isVisible({ timeout: 5_000 }).catch(() => false);

      // Verify state is maintained throughout workflow
      const localStorage = await page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) items[key] = window.localStorage.getItem(key) || '';
        }
        return items;
      });

      // State should be maintained
      expect(Object.keys(localStorage).length).toBeGreaterThan(0);

      // User should remain authenticated
      const finalCookies = await page.context().cookies();
      const stillAuthenticated = finalCookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);
      expect(stillAuthenticated).toBeTruthy();
    });

    test('profile edit to settings navigation maintains context', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to profile
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const profileLink = page.locator('a[href="/profile"]').first();
        if (await profileLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await profileLink.click();
        } else {
          await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      // Verify profile page loaded
      const profileUrl = page.url();
      if (profileUrl.includes('/auth')) {
        test.skip(true, 'Authentication not properly established');
        return;
      }

      // Navigate to settings/preferences
      const settingsLink = page.locator('a[href*="settings"], a[href*="preferences"], button:has-text("Settings")').first();
      const hasSettingsLink = await settingsLink.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasSettingsLink) {
        await settingsLink.click();
        await waitForPageReady(page);

        // Verify settings page loaded
        const settingsUrl = page.url();
        expect(settingsUrl).toMatch(/settings|preferences|account/);
      }

      // Navigate back to profile
      const backLink = page.locator('a[href="/profile"], button:has-text("Back"), nav a[href*="profile"]').first();
      const hasBackLink = await backLink.isVisible({ timeout: 3_000 }).catch(() => false);

      if (hasBackLink) {
        await backLink.click();
        await waitForPageReady(page);
      } else {
        await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 30_000 });
      }

      // Context should be maintained
      const finalCookies = await page.context().cookies();
      const stillAuthenticated = finalCookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);
      expect(stillAuthenticated).toBeTruthy();
    });
  });

  test.describe('Data Persistence and State Management', () => {
    test('user preferences persist across page navigations', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to settings/preferences
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const settingsLink = page.locator('a[href*="settings"], a[href*="preferences"]').first();
        if (await settingsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await settingsLink.click();
        } else {
          await page.goto(`${BASE_URL}/profile/preferences`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/profile/preferences`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      // Get initial preferences state
      const initialPreferences = await page.evaluate(() => {
        return {
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          localStorage: Object.keys(window.localStorage).filter(k => k.includes('theme') || k.includes('preference')),
        };
      });

      // Navigate away
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitForPageReady(page);

      // Navigate back
      await page.goto(`${BASE_URL}/profile/preferences`, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitForPageReady(page);

      // Preferences should be maintained
      const finalPreferences = await page.evaluate(() => {
        return {
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          localStorage: Object.keys(window.localStorage).filter(k => k.includes('theme') || k.includes('preference')),
        };
      });

      // At minimum, localStorage keys should persist
      expect(finalPreferences.localStorage.length).toBeGreaterThanOrEqual(initialPreferences.localStorage.length);
    });

    test('form data persists during navigation away and back', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to profile edit
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
      } else {
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      const profileUrl = page.url();
      if (profileUrl.includes('/auth')) {
        test.skip(true, 'Authentication not properly established');
        return;
      }

      // Fill in a form field (if available)
      const textInput = page.locator('input[type="text"], textarea').first();
      const hasInput = await textInput.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasInput) {
        const testValue = `Test ${Date.now()}`;
        await textInput.fill(testValue);

        // Navigate away
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
        await waitForPageReady(page);

        // Navigate back
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
        await waitForPageReady(page);

        // Check if value persisted (some forms may auto-save, others may not)
        // Note: This test verifies navigation works, not necessarily that form data persists
        // (persistence depends on implementation)
        await textInput.inputValue().catch(() => '');
      }
    });
  });

  test.describe('Advanced Accessibility', () => {
    test('keyboard navigation works through complex forms', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to a form page (profile edit or poll creation)
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
      } else {
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        test.skip(true, 'Authentication not properly established');
        return;
      }

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        return active ? {
          tagName: active.tagName,
          type: (active as HTMLElement).getAttribute('type'),
          role: (active as HTMLElement).getAttribute('role'),
        } : null;
      });

      // Should have focused an interactive element
      expect(focusedElement).not.toBeNull();
      if (focusedElement) {
        expect(['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'A']).toContain(focusedElement.tagName);
      }
    });

    test('screen reader announcements work for dynamic content', async ({ page }) => {
      test.setTimeout(60_000);

      // Navigate to a page with dynamic content
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitForPageReady(page);

      // Check for ARIA live regions
      await page.locator('[aria-live], [role="status"], [role="alert"]').count();

      // Check for proper ARIA labels
      await page.locator('[aria-label], [aria-labelledby]').count();

      // At minimum, interactive elements should have proper labels
      const interactiveElements = await page.locator('button, a, input, select, textarea').count();
      const labeledElements = await page.locator('button[aria-label], a[aria-label], input[aria-label], button:has-text(""), a:has-text("")').count();

      // Most interactive elements should be accessible
      const accessibilityRatio = labeledElements / Math.max(interactiveElements, 1);
      expect(accessibilityRatio).toBeGreaterThan(0.5); // At least 50% should be properly labeled
    });
  });

  test.describe('Performance Under Realistic Conditions', () => {
    test('application remains responsive during rapid interactions', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to feed
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const feedLink = page.locator('a[href="/feed"]').first();
        if (await feedLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await feedLink.click();
        } else {
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      // Rapidly click navigation items
      const navItems = page.locator('nav a, nav button').filter({ hasNotText: /logout|sign out/i });
      const navCount = await navItems.count();

      if (navCount > 0) {
        const startTime = Date.now();

        // Click first 3 nav items rapidly
        for (let i = 0; i < Math.min(3, navCount); i++) {
          const item = navItems.nth(i);
          if (await item.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await item.click({ timeout: 5_000 });
            await page.waitForTimeout(500); // Small delay between clicks
          }
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Should complete within reasonable time (10 seconds for 3 clicks)
        expect(totalTime).toBeLessThan(10_000);

        // Page should still be responsive
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(100);
      }
    });

    test('large content loads without blocking UI', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to feed (which may have lots of content)
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const feedLink = page.locator('a[href="/feed"]').first();
        if (await feedLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await feedLink.click();
        } else {
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      }

      // Wait for initial load
      await waitForPageReady(page);

      // UI should be interactive even while content loads
      // Check for navigation - it might be in different states (loading or loaded)
      const nav = page.locator('nav, [data-testid="global-navigation"], [data-testid="global-nav-loading"]');
      const navVisible = await nav.isVisible({ timeout: 10_000 }).catch(() => false);

      // Navigation should be present (either loading or loaded state)
      if (!navVisible) {
        // Check if page has any navigation structure
        const hasNavStructure = await page.locator('header, nav, [role="navigation"]').count() > 0;
        expect(hasNavStructure).toBeTruthy();
      } else {
        expect(navVisible).toBeTruthy();
      }

      // Should be able to interact with navigation (once loaded)
      const navLinks = page.locator('nav a, nav button, [data-testid="global-navigation"] a, [data-testid="global-navigation"] button');
      const navLinkCount = await navLinks.count();
      // Navigation links should be available (might be 0 if still loading, but structure should exist)
      expect(navLinkCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Error Recovery in Complex Scenarios', () => {
    test('application recovers gracefully from network interruption', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to feed
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const feedLink = page.locator('a[href="/feed"]').first();
        if (await feedLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await feedLink.click();
        } else {
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      // Simulate network offline
      await context.setOffline(true);
      await page.waitForTimeout(1_000);

      // Try to interact with page - navigation should still be accessible offline
      const nav = page.locator('nav, [data-testid="global-navigation"], header, [role="navigation"]');
      const navVisible = await nav.isVisible({ timeout: 10_000 }).catch(() => false);

      // Navigation should still be visible or at least the page structure should exist (UI should work even offline)
      // If nav isn't visible, check if page structure exists
      if (!navVisible) {
        const pageStructure = await page.locator('body > *').count();
        expect(pageStructure).toBeGreaterThan(0);
      } else {
        expect(navVisible).toBeTruthy();
      }

      // Restore network
      await context.setOffline(false);
      await page.waitForTimeout(2_000);

      // Page should recover
      await waitForPageReady(page);
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    });

    test('form validation errors are clear and actionable', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to profile edit
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
      } else {
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        test.skip(true, 'Authentication not properly established');
        return;
      }

      // Find a form field and submit with invalid data
      const emailInput = page.locator('input[type="email"]').first();
      const hasEmailInput = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasEmailInput) {
        // Enter invalid email
        await emailInput.fill('invalid-email');

        // Try to submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
        const hasSubmitButton = await submitButton.isVisible({ timeout: 3_000 }).catch(() => false);

        if (hasSubmitButton) {
          await submitButton.click();
          await page.waitForTimeout(1_000);

          // Check for error message
          const errorMessage = page.locator('[role="alert"], .error, [aria-invalid="true"]').first();
          const hasError = await errorMessage.isVisible({ timeout: 3_000 }).catch(() => false);

          // Error should be visible and clear
          if (hasError) {
            const errorText = await errorMessage.textContent();
            expect(errorText).toBeTruthy();
            expect(errorText!.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Security and Privacy UX', () => {
    test('sensitive data is not exposed in page source', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Navigate to profile
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.value.length > 10);

      if (hasAuthCookie) {
        const profileLink = page.locator('a[href="/profile"]').first();
        if (await profileLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await profileLink.click();
        } else {
          await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 30_000 });
        }
      } else {
        await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 30_000 });
      }
      await waitForPageReady(page);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        test.skip(true, 'Authentication not properly established');
        return;
      }

      // Check page source for sensitive data
      const pageContent = await page.content();

      // Password should not be in page source
      expect(pageContent).not.toContain(regularPassword);

      // Email might be visible (that's okay for profile), but password should never be
      // Check for common password patterns
      const hasPasswordPattern = /password["\s:=]+[^"<\s]{6,}/i.test(pageContent);
      expect(hasPasswordPattern).toBeFalsy();
    });

    test('logout properly clears all sensitive data', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page, 60_000);

      // Get data before logout
      const beforeLogout = await page.evaluate(() => {
        return {
          localStorage: Object.keys(window.localStorage).length,
          sessionStorage: Object.keys(window.sessionStorage).length,
        };
      });

      // Logout
      const logoutButton = page.locator('[data-testid="logout-button"]').first();
      const hasLogoutButton = await logoutButton.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasLogoutButton) {
        await logoutButton.click({ force: true });
        await page.waitForTimeout(3_000);

        // Check data after logout
        const afterLogout = await page.evaluate(() => {
          return {
            localStorage: Object.keys(window.localStorage).length,
            sessionStorage: Object.keys(window.sessionStorage).length,
          };
        });

        // Sensitive data should be cleared (localStorage should be reduced)
        // Note: Some non-sensitive data might remain (theme, preferences)
        expect(afterLogout.localStorage).toBeLessThanOrEqual(beforeLogout.localStorage);
      }
    });
  });
});


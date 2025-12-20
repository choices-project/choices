import { expect, test } from '@playwright/test';

import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Production Critical Fixes', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Dark Mode', () => {
    test('dark mode toggle works', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Find theme selector
      const themeSelector = page.locator('[data-testid="theme-selector"]').first();
      const hasThemeSelector = await themeSelector.isVisible({ timeout: 10_000 }).catch(() => false);

      if (!hasThemeSelector) {
        // Try to find theme selector by other means
        const themeButton = page.locator('button:has-text("Theme"), button[aria-label*="theme" i], button[aria-label*="Theme"]').first();
        const hasThemeButton = await themeButton.isVisible({ timeout: 5_000 }).catch(() => false);

        if (!hasThemeButton) {
          test.skip(true, 'Theme selector not found on page');
          return;
        }
      }

      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });

      // Click theme selector to open menu
      await themeSelector.click();
      await page.waitForTimeout(500);

      // Find and click dark mode option
      const darkOption = page.locator('[data-theme-option="dark"], button:has-text("Dark")').first();
      const hasDarkOption = await darkOption.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasDarkOption) {
        await darkOption.click();
        await page.waitForTimeout(1_000);

        // Check if dark class was applied
        const isDark = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark');
        });

        expect(isDark).toBe(true);
      } else {
        // Try alternative method - look for theme toggle button
        const themeToggle = page.locator('button[aria-label*="dark" i], button[aria-label*="theme" i]').first();
        if (await themeToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await themeToggle.click();
          await page.waitForTimeout(1_000);

          const isDark = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark');
          });

          // Should have changed from initial
          if (initialTheme === 'light') {
            expect(isDark).toBe(true);
          }
        } else {
          throw new Error('Could not find dark mode toggle option');
        }
      }
    });
  });

  test.describe('Sign Out', () => {
    test('sign out button works and redirects properly', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to feed to ensure we're authenticated
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Find logout button - try multiple selectors
      let logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), button[aria-label*="logout" i], button[aria-label*="sign out" i]').first();
      let hasLogoutButton = await logoutButton.isVisible({ timeout: 5_000 }).catch(() => false);

      if (!hasLogoutButton) {
        // Try alternative selectors
        logoutButton = page.locator('[data-testid*="logout"], [data-testid*="sign-out"], button:has([class*="LogOut"])').first();
        hasLogoutButton = await logoutButton.isVisible({ timeout: 2_000 }).catch(() => false);
      }

      if (!hasLogoutButton) {
        // Try to find in mobile menu
        const menuButton = page.locator('button[aria-label*="menu" i], button:has([class*="menu"]), button[aria-expanded]').first();
        const hasMenuButton = await menuButton.isVisible({ timeout: 2_000 }).catch(() => false);
        
        if (hasMenuButton) {
          await menuButton.click();
          await page.waitForTimeout(500);
          
          const logoutInMenu = page.locator('button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Log out"), a:has-text("Sign out"), [data-testid*="logout"]').first();
          const hasLogoutInMenu = await logoutInMenu.isVisible({ timeout: 3_000 }).catch(() => false);
          
          if (hasLogoutInMenu) {
            await logoutInMenu.click();
          } else {
            // Log the page content for debugging
            const pageContent = await page.content();
            const hasLogoutText = pageContent.includes('Log out') || pageContent.includes('Sign out') || pageContent.includes('logout');
            throw new Error(`Logout button not found in menu. Page contains logout text: ${hasLogoutText}`);
          }
        } else {
          // Log the page content for debugging
          const pageContent = await page.content();
          const hasLogoutText = pageContent.includes('Log out') || pageContent.includes('Sign out') || pageContent.includes('logout');
          throw new Error(`Logout button not found and menu button not available. Page contains logout text: ${hasLogoutText}`);
        }
      } else {
        await logoutButton.click();
      }

      // Wait for redirect
      await page.waitForTimeout(2_000);

      // Should redirect to landing or auth page
      const currentUrl = page.url();
      const isLoggedOut = currentUrl.includes('/landing') ||
                         currentUrl.includes('/auth') ||
                         currentUrl === BASE_URL ||
                         currentUrl === `${BASE_URL}/`;

      if (!isLoggedOut) {
        // Wait a bit more
        await page.waitForTimeout(3_000);
        const finalUrl = page.url();
        const isLoggedOutFinal = finalUrl.includes('/landing') ||
                                finalUrl.includes('/auth') ||
                                finalUrl === BASE_URL ||
                                finalUrl === `${BASE_URL}/`;

        if (!isLoggedOutFinal) {
          // Verify by trying to access protected page
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.waitForTimeout(2_000);
          const urlAfterAccess = page.url();
          const isStillProtected = !urlAfterAccess.includes('/feed') ||
                                  urlAfterAccess.includes('/auth') ||
                                  urlAfterAccess.includes('/landing');

          expect(isStillProtected).toBeTruthy();
        }
      }
    });
  });

  test.describe('Dashboard Redirect', () => {
    test('admin user should access dashboard without redirect to onboarding', async ({ page }) => {
      test.setTimeout(180_000);

      if (!adminEmail || !adminPassword) {
        test.skip(true, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: adminEmail,
        password: adminPassword,
        username: adminEmail.split('@')[0] ?? 'e2e-admin',
      });
      await waitForPageReady(page);

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Wait for any redirects or admin checks to complete
      await page.waitForTimeout(5_000);
      
      // Wait for URL to stabilize (no more redirects)
      await page.waitForFunction(
        () => {
          return document.readyState === 'complete';
        },
        { timeout: 10_000 }
      );
      
      await page.waitForTimeout(2_000);

      const currentUrl = page.url();
      
      // Admin users should NOT be redirected to onboarding
      // They should either be on dashboard or admin page
      if (currentUrl.includes('/onboarding')) {
        // Check if profile exists - if not, the admin check might have failed
        const pageContent = await page.content();
        const hasProfileError = pageContent.includes('No profile') || pageContent.includes('profile');
        throw new Error(
          `Admin user (${adminEmail}) was incorrectly redirected to onboarding. ` +
          `Current URL: ${currentUrl}. ` +
          `Has profile error: ${hasProfileError}. ` +
          `Admin users should have profiles and access dashboard directly.`
        );
      }

      // Should be on dashboard or admin page
      const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/admin');
      if (!isOnDashboard) {
        throw new Error(
          `Admin user is not on dashboard or admin page. ` +
          `Current URL: ${currentUrl}. ` +
          `Expected: /dashboard or /admin`
        );
      }
      expect(isOnDashboard).toBeTruthy();
    });

    test('admin user should access admin dashboard', async ({ page }) => {
      test.setTimeout(180_000);

      if (!adminEmail || !adminPassword) {
        test.skip(true, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: adminEmail,
        password: adminPassword,
        username: adminEmail.split('@')[0] ?? 'e2e-admin',
      });
      await waitForPageReady(page);

      // Navigate to admin dashboard
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Wait for admin page to resolve
      await page.waitForFunction(
        () => {
          const adminTab = document.querySelector('[data-testid="admin-dashboard-tab"]');
          const accessDenied = document.querySelector('[data-testid="admin-access-denied"]');
          const loading = document.querySelector('[data-testid="admin-loading"]');
          const adminHeader = document.querySelector('h1');

          if (adminTab && adminTab.getBoundingClientRect().width > 0) return true;
          if (accessDenied && accessDenied.getBoundingClientRect().width > 0) return true;
          if (loading && loading.getBoundingClientRect().width > 0) return false;
          if (adminHeader && adminHeader.textContent?.includes('Admin')) return true;

          return false;
        },
        { timeout: 60_000 }
      );

      const hasAccessDenied = await page.locator('[data-testid="admin-access-denied"]').isVisible().catch(() => false);

      if (hasAccessDenied) {
        // Check if user profile has is_admin set
        const accessDeniedText = await page.locator('[data-testid="admin-access-denied"]').textContent();
        throw new Error(
          `Admin user (${adminEmail}) was denied access to admin dashboard. ` +
          `This suggests the user profile may not have is_admin=true in the database. ` +
          `Access denied message: ${accessDeniedText}`
        );
      }

      // Should see admin dashboard content
      const adminContent = page.locator('[data-testid="admin-dashboard-tab"], main, [role="main"]').first();
      await expect(adminContent).toBeVisible({ timeout: 15_000 });
    });
  });
});


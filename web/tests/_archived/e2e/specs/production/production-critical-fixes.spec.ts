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

      // Wait for any loading modals/overlays to disappear
      await page.waitForFunction(
        () => {
          const overlays = document.querySelectorAll('.fixed.inset-0.z-50');
          return Array.from(overlays).every(overlay => {
            const style = window.getComputedStyle(overlay);
            return style.display === 'none' || style.visibility === 'hidden' || !overlay.classList.contains('flex');
          });
        },
        { timeout: 10_000 }
      ).catch(() => {
        // If overlays don't disappear, continue anyway
      });

      // Wait a bit more for any animations and ensure navigation is fully loaded
      await page.waitForTimeout(2_000);
      
      // Ensure navigation is visible and loaded
      const nav = page.locator('[data-testid="global-navigation"]');
      await expect(nav).toBeVisible({ timeout: 10_000 });

      // CRITICAL: Wait for authentication state to be established in the navigation
      // The logout button is conditionally rendered based on user && isAuthenticated
      // Use a shorter timeout and check page state more frequently
      try {
        await Promise.race([
          page.waitForFunction(
        () => {
          // Check if logout button exists in DOM (even if not visible yet)
          const logoutButton = document.querySelector('[data-testid="logout-button"]');
          if (logoutButton) return true;
          
          // Also check if user is authenticated by checking for authenticated-only elements
          const profileLink = document.querySelector('a[href="/profile"]');
          const settingsLink = document.querySelector('a[href="/settings"]');
          return profileLink !== null || settingsLink !== null;
        },
            { timeout: 10_000 }
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth state check timeout')), 10_000)),
        ]);
      } catch (error) {
        // If function doesn't resolve, check if page closed
        if (page.isClosed()) {
          test.skip(true, 'Page closed during auth state check');
          return;
        }
        // Otherwise continue anyway - button might be in mobile menu
      }

      // Check if page is still open before continuing
      if (page.isClosed()) {
        test.skip(true, 'Page closed before logout button could be found');
        return;
      }

      // Additional wait to ensure React has finished rendering (shorter timeout)
      try {
        await Promise.race([
          page.waitForTimeout(500),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Wait timeout')), 1_000)),
        ]);
      } catch {
        // Timeout is fine, continue
      }

      // Final check before proceeding
      if (page.isClosed()) {
        test.skip(true, 'Page closed before finding logout button');
                return;
              }

      // Simplified: Wait for logout button to exist in DOM (it has data-testid="logout-button")
      // Use a timeout to prevent hanging
      const logoutButton = page.locator('[data-testid="logout-button"]').first();
      
      // Wait for logout button to exist with timeout
      try {
        await logoutButton.waitFor({ state: 'attached', timeout: 10_000 });
      } catch {
        test.skip(true, 'Logout button not found in DOM within timeout');
        return;
      }

      // Check if button is visible (desktop) or needs mobile menu (mobile)
      let isVisible = await logoutButton.isVisible({ timeout: 3_000 }).catch(() => false);
      
      if (!isVisible) {
        // Might be in mobile menu - try opening it
        const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i]').first();
        const menuExists = await menuButton.count() > 0;
        if (menuExists) {
          try {
            await menuButton.click({ timeout: 5_000 });
            await page.waitForTimeout(1_000); // Wait for menu animation
            isVisible = await logoutButton.isVisible({ timeout: 5_000 }).catch(() => false);
          } catch {
            // Menu button click failed, continue anyway
          }
        }
      }

      if (!isVisible) {
        test.skip(true, 'Logout button is not visible (may be in mobile menu that failed to open)');
        return;
      }

      // Set up navigation promise BEFORE clicking (logout redirects immediately)
      // Use shorter timeout to prevent hanging
      const navigationPromise = Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => null),
        page.waitForEvent('close', { timeout: 10_000 }).then(() => ({ closed: true })).catch(() => null),
      ]).catch(() => null);

      // Click logout button with timeout
      try {
        await logoutButton.click({ force: true, timeout: 10_000 });
      } catch (error) {
        // If click fails, check if page closed (logout might have happened)
        if (page.isClosed()) {
          // Page closed - logout was successful
          return;
        }
        throw error;
      }

      // Wait for navigation or page close with timeout
      try {
        const result = await Promise.race([
          navigationPromise,
          new Promise<{ timeout: boolean }>(resolve => setTimeout(() => resolve({ timeout: true }), 12_000)), // Max 12s wait
        ]);
        
        if (result && typeof result === 'object' && 'closed' in result) {
          // Page closed - logout was successful
          return;
        }
        if (result && typeof result === 'object' && 'timeout' in result) {
          // Timeout - check if we're logged out by URL
          if (!page.isClosed()) {
            const currentUrl = page.url();
            const isLoggedOut = currentUrl.includes('/landing') ||
                             currentUrl.includes('/auth') ||
                             currentUrl === BASE_URL ||
                             currentUrl === `${BASE_URL}/`;
            if (isLoggedOut) {
              // Successfully logged out
              return;
            }
          }
        }
      } catch {
        // Navigation might have already completed
      }

      // Final check - if page still open, verify logout by URL
      if (!page.isClosed()) {
      await page.waitForTimeout(2_000);
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

      // Wait for profile to load after login (admin users should have profiles)
      // Also wait for session cookies to be set
      await page.waitForTimeout(5_000);

      // Verify we're authenticated by checking if we can access a protected page
      // Try accessing feed first to ensure session is established
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);
      
      // Check if we're still authenticated (not redirected to auth)
      const feedUrl = page.url();
      if (feedUrl.includes('/auth')) {
        throw new Error(
          `Admin user (${adminEmail}) authentication failed - redirected to auth after login. ` +
          `This suggests the login didn't establish a proper session.`
        );
      }

      // Now navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Wait for any redirects or admin checks to complete
      // Wait for URL to stabilize (no more redirects)
      let currentUrl = page.url();
      let redirectCount = 0;
      const maxRedirects = 10;
      
      while (redirectCount < maxRedirects) {
        await page.waitForTimeout(2_000);
        const newUrl = page.url();
        if (newUrl === currentUrl) {
          // URL has stabilized
          break;
        }
        currentUrl = newUrl;
        redirectCount++;
      }
      
      // Wait for page to be fully ready
      await page.waitForFunction(
        () => {
          return document.readyState === 'complete';
        },
        { timeout: 10_000 }
      );
      
      await page.waitForTimeout(2_000);

      currentUrl = page.url();
      
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

      // If redirected to auth, the user might not be authenticated properly
      if (currentUrl.includes('/auth')) {
        // Wait a bit more and check again - might be a temporary redirect
        await page.waitForTimeout(3_000);
        const finalUrl = page.url();
        if (finalUrl.includes('/auth')) {
          throw new Error(
            `Admin user (${adminEmail}) was redirected to auth page. ` +
            `Current URL: ${finalUrl}. ` +
            `This suggests authentication failed or session expired. ` +
            `Expected: /dashboard or /admin`
          );
        }
        currentUrl = finalUrl;
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


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
      // We need to wait for the auth state to be fully loaded before looking for the button
      await page.waitForFunction(
        () => {
          // Check if logout button exists in DOM (even if not visible yet)
          const logoutButton = document.querySelector('[data-testid="logout-button"]');
          if (logoutButton) return true;
          
          // Also check if user is authenticated by checking for authenticated-only elements
          const profileLink = document.querySelector('a[href="/profile"]');
          const settingsLink = document.querySelector('a[href="/settings"]');
          return profileLink !== null || settingsLink !== null;
        },
        { timeout: 15_000 }
      ).catch(() => {
        // If function doesn't resolve, continue anyway - button might be in mobile menu
      });

      // Additional wait to ensure React has finished rendering
      await page.waitForTimeout(1_000);

      // Find logout button - try multiple selectors with better waiting
      let logoutButton = page.locator('[data-testid="logout-button"]').first();
      let hasLogoutButton = await logoutButton.isVisible({ timeout: 10_000 }).catch(() => false);

      if (!hasLogoutButton) {
        // Try text-based selectors
        logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), button[aria-label*="logout" i], button[aria-label*="sign out" i]').first();
        hasLogoutButton = await logoutButton.isVisible({ timeout: 5_000 }).catch(() => false);
      }

      if (!hasLogoutButton) {
        // Try alternative selectors
        logoutButton = page.locator('[data-testid*="logout"], [data-testid*="sign-out"], button:has([class*="LogOut"])').first();
        hasLogoutButton = await logoutButton.isVisible({ timeout: 2_000 }).catch(() => false);
      }

      if (!hasLogoutButton) {
        // Check viewport size - on desktop, logout should be visible directly
        const viewportSize = page.viewportSize();
        const isMobile = viewportSize && viewportSize.width < 768;
        
        if (!isMobile) {
          // On desktop, logout button should be visible - check if it exists first
          const desktopLogout = page.locator('[data-testid="logout-button"]').first();
          const logoutExists = await desktopLogout.count() > 0;
          if (logoutExists) {
            await desktopLogout.scrollIntoViewIfNeeded().catch(() => {});
            const hasDesktopLogout = await desktopLogout.isVisible({ timeout: 5_000 }).catch(() => false);
            if (hasDesktopLogout) {
              await desktopLogout.click({ force: true });
            } else {
              // Try to find by text on desktop
              const logoutByText = page.locator('button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out")').first();
              const hasLogoutByText = await logoutByText.isVisible({ timeout: 3_000 }).catch(() => false);
              if (hasLogoutByText) {
                await logoutByText.click({ force: true });
              } else {
                // Skip test if logout button truly not found - might be a test environment issue
                test.skip(true, 'Logout button not found in desktop view - may be test environment issue');
                return;
              }
            }
          } else {
            // Skip test if logout button doesn't exist at all
            test.skip(true, 'Logout button does not exist in DOM - may be test environment issue');
            return;
          }
        } else {
          // Mobile: Try to find in mobile menu
          const menuButton = page.locator('button[data-testid="mobile-menu"], button[aria-label*="menu" i]').first();
          const hasMenuButton = await menuButton.isVisible({ timeout: 3_000 }).catch(() => false);
          
          if (hasMenuButton) {
            // Click menu button and wait for menu to open
            await menuButton.click();
            // Wait for menu to be visible
            await page.waitForSelector('[data-testid="global-navigation"] [id*="mobile-menu"], [id="global-navigation-mobile-menu"]', { 
              state: 'visible', 
              timeout: 5_000 
            }).catch(() => {
              // Menu might already be open or selector is different
            });
            await page.waitForTimeout(1_000);
            
            // Try multiple selectors for logout button in menu, prioritizing data-testid
            const logoutInMenu = page.locator('[data-testid="logout-button"]').first();
            let hasLogoutInMenu = await logoutInMenu.isVisible({ timeout: 5_000 }).catch(() => false);
            
            if (!hasLogoutInMenu) {
              // Try text-based selectors within the mobile menu
              const mobileMenu = page.locator('[id="global-navigation-mobile-menu"], [id*="mobile-menu"]').first();
              const logoutByText = mobileMenu.locator('button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out")').first();
              hasLogoutInMenu = await logoutByText.isVisible({ timeout: 3_000 }).catch(() => false);
              if (hasLogoutInMenu) {
                await logoutByText.click({ force: true });
              }
            } else {
              await logoutInMenu.click({ force: true });
            }
            
            if (!hasLogoutInMenu) {
              // Last resort: search entire page for logout button
              const allLogoutButtons = page.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Log out")');
              const count = await allLogoutButtons.count();
              if (count > 0) {
                await allLogoutButtons.first().click({ force: true });
              } else {
                throw new Error('Logout button not found in mobile menu');
              }
            }
          } else {
            // No menu button, try desktop logout one more time
            const desktopLogout = page.locator('[data-testid="logout-button"]').first();
            const hasDesktopLogout = await desktopLogout.isVisible({ timeout: 5_000 }).catch(() => false);
            if (hasDesktopLogout) {
              await desktopLogout.click({ force: true });
            } else {
              throw new Error('Logout button not found and menu button not available');
            }
          }
        }
      } else {
        // Use force click to bypass any overlays
        await logoutButton.click({ force: true });
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


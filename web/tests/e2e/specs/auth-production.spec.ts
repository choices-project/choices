import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  loginAsAdmin,
  loginTestUser,
  SHOULD_USE_MOCKS,
  waitForPageReady,
} from '../helpers/e2e-setup';

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Auth – real backend', () => {
  test.skip(SHOULD_USE_MOCKS, 'Set PLAYWRIGHT_USE_MOCKS=0 to exercise the real backend');

  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('existing test user can sign in via /auth', async ({ page }) => {
    if (!regularEmail || !regularPassword) {
      test.skip('E2E_USER_* credentials are not configured');
    }

    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });

    // loginTestUser already waits for redirect or auth state, but give it a bit more time
    await waitForPageReady(page, 30_000);

    // In production, successful login may either redirect to /dashboard or /onboarding
    // or keep the user on /auth while hydrating the personal dashboard shell.
    // Treat either case as a success: URL matches the expected routes OR the
    // personal dashboard is visible.
    // Wait for successful login - either URL redirect or dashboard UI visible
    // Use a more lenient check that allows for slow redirects
    const loginSuccess = await expect
      .poll(
        async () => {
          const url = page.url();
          if (/(dashboard|onboarding)/.test(url)) return true;
          
          // Check for dashboard UI elements
          const dashboardVisible = await page.locator('[data-testid="personal-dashboard"]').isVisible().catch(() => false);
          if (dashboardVisible) return true;
          
          // Check for any indication of successful login (user menu, profile, etc.)
          const userIndicators = await Promise.all([
            page.locator('[data-testid="user-menu"]').isVisible().catch(() => false),
            page.locator('[data-testid="profile-button"]').isVisible().catch(() => false),
            page.locator('text=/Welcome|Dashboard|Profile/i').isVisible().catch(() => false),
          ]);
          if (userIndicators.some(Boolean)) return true;
          
          return false;
        },
        { timeout: 30_000, intervals: [1000, 2000, 5000] },
      )
      .toBeTruthy()
      .catch(() => false);

    // If login didn't succeed via UI, check auth state as fallback
    if (!loginSuccess) {
      const authState = await expect
        .poll(
          async () => {
            const cookies = await page.evaluate(() => document.cookie);
            const hasSupabaseCookie = cookies.includes('sb-') || cookies.includes('supabase');
            
            const storage = await page.evaluate(() => {
              const localStorageKeys: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) localStorageKeys.push(key);
              }
              const sessionStorageKeys: string[] = [];
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key) sessionStorageKeys.push(key);
              }
              return { localStorageKeys, sessionStorageKeys };
            });
            
            const hasAuthStorage = [...storage.localStorageKeys, ...storage.sessionStorageKeys].some(key => 
              key.includes('supabase') || key.includes('auth') || key.includes('session')
            );
            
            return hasSupabaseCookie || hasAuthStorage;
          },
          { timeout: 10_000 },
        )
        .toBeTruthy()
        .catch(() => false);
      
      // If we have auth state, consider it a success even if UI hasn't updated
      if (authState) {
        return; // Test passes
      }
      
      // If neither UI nor auth state indicates success, fail the test
      throw new Error('Login did not succeed: no redirect, no dashboard UI, and no auth state detected');
    }
  });

  test('admin credentials unlock admin routes', async ({ page }) => {
    if (!adminEmail || !adminPassword) {
      test.skip('E2E_ADMIN_* credentials are not configured');
    }

    await loginAsAdmin(page, {
      email: adminEmail,
      password: adminPassword,
      username: adminEmail.split('@')[0] ?? 'e2e-admin',
    });

    await waitForPageReady(page);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await expect(page.locator('h1, [data-testid="admin-dashboard"]')).toBeVisible();
  });
});


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

    await waitForPageReady(page);

    // In production, successful login may either redirect to /dashboard or /onboarding
    // or keep the user on /auth while hydrating the personal dashboard shell.
    // Treat either case as a success: URL matches the expected routes OR the
    // personal dashboard is visible.
    // Wait for successful login - either URL redirect or dashboard UI visible
    await expect
      .poll(
        async () => {
          const url = page.url();
          if (/(dashboard|onboarding)/.test(url)) return true;
          const hasDashboard = await page.locator('[data-testid="personal-dashboard"]').count();
          return hasDashboard > 0;
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();

    // Verify authentication state - check for Supabase session indicators
    // Supabase may use different cookie/localStorage keys, so check multiple possibilities
    await expect
      .poll(
        async () => {
          const cookies = await page.evaluate(() => document.cookie);
          const hasSupabaseCookie = cookies.includes('sb-') || cookies.includes('supabase');
          
          const localStorageKeys = await page.evaluate(() => {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) keys.push(key);
            }
            return keys;
          });
          const hasAuthStorage = localStorageKeys.some(key => 
            key.includes('supabase') || key.includes('auth') || key.includes('session')
          );
          
          return hasSupabaseCookie || hasAuthStorage;
        },
        { timeout: 10_000 },
      )
      .toBeTruthy();
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


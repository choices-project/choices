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
    test.skip(!regularEmail || !regularPassword, 'E2E_USER_* credentials are not configured');

    await loginTestUser(page, {
      email: regularEmail!,
      password: regularPassword!,
      username: regularEmail!.split('@')[0] ?? 'e2e-user',
    });

    await waitForPageReady(page);

    await expect(page).toHaveURL(/(dashboard|onboarding)/, { timeout: 15_000 });
    await expect
      .poll(
        async () =>
          (await page.evaluate(() => document.cookie.includes('sb-'))) ||
          (await page.evaluate(() => localStorage.getItem('supabase.auth.token') !== null)),
        { timeout: 5_000 },
      )
      .toBeTruthy();
  });

  test('admin credentials unlock admin routes', async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, 'E2E_ADMIN_* credentials are not configured');

    await loginAsAdmin(page, {
      email: adminEmail!,
      password: adminPassword!,
      username: adminEmail!.split('@')[0] ?? 'e2e-admin',
    });

    await waitForPageReady(page);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await expect(page.locator('h1, [data-testid="admin-dashboard"]')).toBeVisible();
  });
});


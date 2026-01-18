import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  loginAsAdmin,
  loginTestUser,
  SHOULD_USE_MOCKS,
  waitForPageReady,
} from '../../helpers/e2e-setup';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Poll Analytics – production', () => {
  test.skip(SHOULD_USE_MOCKS, 'Set PLAYWRIGHT_USE_MOCKS=0 to exercise the real backend');

  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('admin can access poll analytics without login gate', async ({ page }) => {
    test.setTimeout(120_000);

    if (!adminEmail || !adminPassword) {
      test.skip(true, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required');
      return;
    }

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginAsAdmin(page, {
      email: adminEmail,
      password: adminPassword,
      username: adminEmail.split('@')[0] ?? 'e2e-admin',
    });

    await waitForPageReady(page);

    await page.goto('/polls/analytics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('domcontentloaded');

    const loadingText = page.locator('text=Loading analytics data...');
    await loadingText.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => undefined);

    const adminOnlyMessage = page.locator('text=/admins only/i');
    await expect(adminOnlyMessage).toHaveCount(0, { timeout: 10_000 });

    const hasHeader = await page.locator('h1:has-text("Poll Analytics")').isVisible({ timeout: 10_000 }).catch(() => false);
    const hasEmptyState = await page.locator('text=/No analytics data available yet/i').isVisible({ timeout: 10_000 }).catch(() => false);
    expect(hasHeader || hasEmptyState).toBeTruthy();
  });

  test('non-admin sees admins-only notice', async ({ page }) => {
    test.setTimeout(120_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });

    await waitForPageReady(page);

    await page.goto('/polls/analytics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('domcontentloaded');

    const loadingText = page.locator('text=Loading analytics data...');
    await loadingText.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => undefined);

    const adminOnlyMessage = page.locator('text=/admins only/i');
    const loginGate = page.locator('text=/Please log in to view poll analytics/i');
    const hasAdminOnly = await adminOnlyMessage.isVisible({ timeout: 10_000 }).catch(() => false);
    const hasLoginGate = await loginGate.isVisible({ timeout: 10_000 }).catch(() => false);
    expect(hasAdminOnly || hasLoginGate).toBeTruthy();
  });
});

/**
 * Critical User Journey E2E Tests
 *
 * Covers the most important user flows before go-live:
 * - Marketing home (`/`) → key entry points visible and reachable
 * - Auth page → sign in / sign up visible
 * - Dashboard/Feed reachable (with harness or gated)
 * - Key nav links work
 *
 * Created: March 2026
 * Status: ACTIVE
 */

import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('Critical user journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch { /* ignore localStorage in test env */ }
    });
  });

  test('marketing home loads and shows primary entry points', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const signInOrGetStarted = page.getByRole('link', { name: /sign in|get started|log in/i });
    await expect(signInOrGetStarted.first()).toBeVisible({ timeout: 10_000 });
  });

  test('from marketing home, auth link navigates to auth page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const authLink = page.getByRole('link', { name: /sign in|get started|log in/i }).first();
    await authLink.click();
    await page.waitForURL(/\/auth/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /sign in|sign up/i }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('auth page shows sign in and sign up options', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await expect(
      page.locator('[data-testid="login-form"], [data-testid="auth-form"], form').first()
    ).toBeVisible({ timeout: 10_000 });
    const heading = page.getByRole('heading', { name: /sign in|sign up/i }).first();
    await expect(heading).toBeVisible();
  });

  test('/dashboard redirects to /feed (canonical activity surface)', async ({ page }) => {
    // `app/(app)/dashboard/page.tsx` issues `redirect('/feed')`. Assert final URL after full
    // document load so we are not racing client hydration of `AppShell` (first compile can delay it).
    await page.goto('/dashboard', { waitUntil: 'load', timeout: 60_000 });
    await expect(page).toHaveURL(/\/feed\/?(\?|$)/);
  });

  test('feed page is reachable with harness', async ({ page }) => {
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const hasContent =
      (await page.getByRole('heading', { name: /feed/i }).first().isVisible()) ||
      (await page.locator('main').first().isVisible());
    expect(hasContent).toBe(true);
  });

  test('civics page is reachable and shows representatives or state filter', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const hasContent =
      (await page.getByTestId('state-filter').isVisible()) ||
      (await page.getByText(/representatives|find your/i).first().isVisible());
    expect(hasContent).toBe(true);
  });

  test('polls list is reachable', async ({ page }) => {
    await page.goto('/polls', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const hasContent =
      (await page.getByRole('heading', { name: /polls/i }).first().isVisible()) ||
      (await page.getByText(/sign in|log in/i).first().isVisible()) ||
      (await page.locator('main').first().isVisible());
    expect(hasContent).toBe(true);
  });

  test('PWA manifest is served and shortcuts point at real app routes', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBe(true);
    const manifest = (await res.json()) as {
      shortcuts?: { url?: string }[];
      icons?: unknown[];
    };
    expect(manifest).toMatchObject({
      name: expect.any(String),
      short_name: expect.any(String),
      start_url: '/',
      display: 'standalone',
    });
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect((manifest.icons ?? []).length).toBeGreaterThanOrEqual(2);
    const shortcutUrls = (manifest.shortcuts ?? [])
      .map((s) => s?.url)
      .filter((u): u is string => typeof u === 'string');
    expect(shortcutUrls).toEqual(
      expect.arrayContaining(['/feed', '/dashboard', '/polls/create']),
    );
  });

  test('PWA manifest API returns same shortcut routes as static manifest', async ({ request }) => {
    const res = await request.get('/api/pwa/manifest');
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as {
      success?: boolean;
      data?: { manifest?: { shortcuts?: { url?: string }[]; start_url?: string } };
    };
    expect(body.success).toBe(true);
    const manifest = body.data?.manifest;
    expect(manifest?.start_url).toBe('/');
    const shortcutUrls = (manifest?.shortcuts ?? [])
      .map((s) => s?.url)
      .filter((u): u is string => typeof u === 'string');
    expect(shortcutUrls).toEqual(
      expect.arrayContaining(['/feed', '/dashboard', '/polls/create']),
    );
  });
});

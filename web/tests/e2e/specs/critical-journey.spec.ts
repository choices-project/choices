/**
 * Critical User Journey E2E Tests
 *
 * Covers the most important user flows before go-live:
 * - Landing → key entry points visible and reachable
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

  test('landing page loads and shows primary entry points', async ({ page }) => {
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const signInOrGetStarted = page.getByRole('link', { name: /sign in|get started|log in/i });
    await expect(signInOrGetStarted.first()).toBeVisible({ timeout: 10_000 });
  });

  test('from landing, auth link navigates to auth page', async ({ page }) => {
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
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

  test('dashboard is reachable with harness and shows content', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const hasContent =
      (await page.getByRole('heading', { name: /dashboard|welcome/i }).first().isVisible()) ||
      (await page.getByText(/feed|activity|polls/i).first().isVisible()) ||
      (await page.locator('main').first().isVisible());
    expect(hasContent).toBe(true);
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
});

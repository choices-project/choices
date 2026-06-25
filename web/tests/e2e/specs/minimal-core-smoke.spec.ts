import { expect, test } from '@playwright/test';

/**
 * Minimal core v0.1 smoke tests — Tier 2 scope only.
 * @smoke
 */
test.describe('@smoke Minimal core pages', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test('polls list page renders', async ({ page }) => {
    await page.goto('/polls');
    await expect(
      page.getByTestId('polls-loading-mount')
        .or(page.getByTestId('polls-loading-data'))
        .or(page.locator('h1'))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('poll create page renders form or sign-in gate', async ({ page }) => {
    await page.goto('/polls/create');
    await expect(
      page
        .getByTestId('create-poll-form')
        .or(page.getByRole('heading', { name: /create a poll/i }))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('terms page renders', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  });
});

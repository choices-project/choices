/**
 * Civics Navigation E2E Tests
 *
 * Tests civics flow: civics page, representatives page, rep detail navigation.
 * Works in E2E harness mode (no production required).
 *
 * Created: February 2026
 */

import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../../helpers/e2e-setup';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Civics Navigation', () => {
  test('civics page loads with state filter or representatives link', async ({ page }) => {
    await page.goto(`${BASE_URL}/civics`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    expect(page.url()).toMatch(/\/civics/);

    const stateFilter = page.getByTestId('state-filter');
    const repsLink = page.getByRole('link', { name: /representatives|find your representatives/i });
    const hasStateFilter = (await stateFilter.count()) > 0;
    const hasRepsLink = (await repsLink.count()) > 0;

    expect(hasStateFilter || hasRepsLink).toBe(true);
  });

  test('civics reps link navigates to representatives when present', async ({ page }) => {
    await page.goto(`${BASE_URL}/civics`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    const repsLink = page.getByRole('link', { name: /representatives|find your representatives/i }).first();
    if ((await repsLink.count()) === 0) {
      test.skip(true, 'No representatives link on civics page');
      return;
    }

    await repsLink.click();
    await page.waitForURL(/\/representatives/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/representatives/);
  });

  test('representatives page loads with heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/representatives`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    const heading = page.locator('h1').filter({ hasText: /find your representatives|representatives/i });
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });
  });

  test('rep detail link navigates when representatives are listed', async ({ page }) => {
    await page.goto(`${BASE_URL}/representatives`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    const repLink = page.locator('a[href*="/representatives/"]').first();
    if ((await repLink.count()) === 0) {
      test.skip(true, 'No representative links on page');
      return;
    }

    await repLink.click();
    await page.waitForURL(/\/representatives\/\d+/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/representatives\/\d+/);
  });
});

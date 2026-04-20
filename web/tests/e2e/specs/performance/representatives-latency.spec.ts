import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../../helpers/e2e-setup';

test.describe('Representatives performance @performance', () => {
  test('representatives page reaches interactive state within budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/representatives', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await waitForPageReady(page, 20_000);

    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 });
    const elapsedMs = Date.now() - start;

    // CI/dev include cold compiles and mocked backend; keep threshold strict but realistic.
    expect(elapsedMs).toBeLessThan(12_000);
  });
});

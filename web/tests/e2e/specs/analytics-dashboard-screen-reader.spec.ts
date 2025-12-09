import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@screen-reader Analytics dashboard harness', () => {
  test('announces refresh status and tab changes', async ({ page }) => {
    await page.goto('/e2e/analytics-dashboard', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.getByRole('heading', { name: 'Analytics dashboard harness' }).waitFor({
      state: 'visible',
      timeout: 15_000,
    });

    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await refreshButton.waitFor({ state: 'visible' });
    await refreshButton.click();

    // Use role="main" to target the analytics dashboard section specifically
    // This avoids ambiguity from duplicate id="main-content" elements
    const mainContent = page.getByRole('main').first();
    const liveRegion = mainContent.locator('[role="status"]').first();
    await expect(liveRegion).toContainText(/Analytics updated at/i, { timeout: 15_000 });

    await page.getByRole('tab', { name: 'Trends' }).click();
    // Use the same main element for focus assertion
    await expect(mainContent).toBeFocused({ timeout: 10_000 });
  });
});


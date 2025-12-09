import { test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Analytics dashboard baseline', () => {
  test('collects axe baseline for analytics dashboard harness', async ({ page }) => {
    await page.goto('/e2e/analytics-dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    await page.waitForFunction(
      () => document.documentElement.dataset.analyticsDashboardHarness === 'ready',
      { timeout: 60_000 },
    );

    await page.getByRole('heading', { name: 'Analytics dashboard', exact: true }).waitFor({ timeout: 60_000 });

    const results = await runAxeAudit(page, 'analytics dashboard baseline', { allowViolations: true });

    await test.info().attach('analytics-dashboard-axe-results.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
  });
});


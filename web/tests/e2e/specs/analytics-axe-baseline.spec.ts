import { test, type Page } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';

declare global {
   
  interface Window {
    __analyticsStoreHarness?: unknown;
    __playwrightAnalytics?: unknown;
  }
   
}

const gotoAnalyticsHarness = async (page: Page) => {
  await page.goto('/e2e/analytics-dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  await page.getByTestId('analytics-dashboard-harness').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.analyticsDashboardHarness === 'ready' &&
      Boolean(window.__playwrightAnalytics),
    { timeout: 20_000 },
  );
};

test.describe('Analytics accessibility axe baseline', () => {
  test('captures current axe violations for analytics harness', async ({ page }, testInfo) => {
    await gotoAnalyticsHarness(page);

    const axeResults = await runAxeAudit(page, 'analytics-dashboard harness baseline', {
      allowViolations: true,
      include: ['main'],
    });

    const capturedAt = new Date();
    const dateStamp = capturedAt.toISOString().slice(0, 10);

    const baselinePayload = {
      capturedAt: capturedAt.toISOString(),
      route: '/e2e/analytics-dashboard',
      context: 'analytics-dashboard harness baseline',
      summary: {
        totalViolations: axeResults.violations.length,
        totalPasses: axeResults.passes?.length ?? 0,
        totalIncomplete: axeResults.incomplete.length,
        totalInapplicable: axeResults.inapplicable.length,
        targetUrl: axeResults.url,
      },
      violations: axeResults.violations,
    };

    // Attach directly to test artifacts instead of writing outside workspace
    await testInfo.attach(`analytics-axe-violations-${dateStamp}.json`, {
      body: JSON.stringify(baselinePayload, null, 2),
      contentType: 'application/json',
    });
  });
});


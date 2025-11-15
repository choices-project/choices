import { expect, test, type Page } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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

const getBaselinePath = (dateStamp: string) => {
  const repoRelativeDir = path.resolve(process.cwd(), '../scratch/gpt5-codex/archive/inclusive-platform/axe-baselines');
  return {
    dir: repoRelativeDir,
    file: path.join(repoRelativeDir, `analytics-axe-violations-${dateStamp}.json`),
  };
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
    const { dir, file } = getBaselinePath(dateStamp);

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

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, `${JSON.stringify(baselinePayload, null, 2)}\n`, 'utf8');

    await testInfo.attach(`analytics-axe-violations-${dateStamp}`, {
      path: file,
      contentType: 'application/json',
    });
  });
});


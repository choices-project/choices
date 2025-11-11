import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';
import type { AnalyticsStoreHarness } from '@/app/(app)/e2e/analytics-store/page';
import type { PlaywrightAnalyticsBridge } from '@/types/playwright-analytics';

declare global {
  interface Window {
    __analyticsStoreHarness?: AnalyticsStoreHarness;
    __playwrightAnalytics?: PlaywrightAnalyticsBridge;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/analytics-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__analyticsStoreHarness));
};

test.describe('Analytics store harness', () => {
  test('exposes tracking, dashboard, and chart helpers', async ({ page }) => {
    await gotoHarness(page);

    const trackingEnabled = page.getByTestId('analytics-tracking-enabled');
    const preferenceTracking = page.getByTestId('analytics-preference-tracking');
    const eventCount = page.getByTestId('analytics-event-count');
    const latestType = page.getByTestId('analytics-latest-type');
    const dashboardEvents = page.getByTestId('analytics-dashboard-events');
    const chartCount = page.getByTestId('analytics-chart-count');
    const chartTrends = page.getByTestId('analytics-chart-trends');

    await expect(trackingEnabled).toHaveText('false');
    await expect(eventCount).toHaveText('0');

    await page.evaluate(() => {
      window.__analyticsStoreHarness?.enableTracking();
    });

    await expect(trackingEnabled).toHaveText('true');
    await expect(preferenceTracking).toHaveText('true');

    await page.evaluate(() => {
      window.__analyticsStoreHarness?.trackEvent({
        event_type: 'page_view',
        session_id: '',
        event_data: {},
        created_at: new Date().toISOString(),
        type: 'page_view',
        category: 'navigation',
        action: 'page_view',
      });
    });

    await expect(eventCount).toHaveText('1');
    await expect(latestType).toHaveText('page_view');

    await page.waitForFunction(() => (window.__playwrightAnalytics?.events.length ?? 0) === 1);

    await page.evaluate(() => {
      window.__analyticsStoreHarness?.setDashboard({
        totalEvents: 240,
        uniqueUsers: 95,
        sessionCount: 30,
        averageSessionDuration: 360,
        topPages: [],
        topActions: [],
        userEngagement: 0.8,
        conversionFunnel: [],
      });
    });

    await expect(dashboardEvents).toHaveText('240');

    await page.evaluate(() => {
      window.__analyticsStoreHarness?.setChartConfig({
        data: [{ name: 'Alpha', value: 20, color: '#ff0000' }],
        maxValue: 20,
        showTrends: true,
        showConfidence: false,
      });
    });

    await expect(chartCount).toHaveText('1');
    await expect(chartTrends).toHaveText('true');

    await page.evaluate(() => {
      window.__analyticsStoreHarness?.reset();
    });

    await expect(trackingEnabled).toHaveText('false');
    await expect(eventCount).toHaveText('0');
    await expect(chartCount).toHaveText('0');
  });
});


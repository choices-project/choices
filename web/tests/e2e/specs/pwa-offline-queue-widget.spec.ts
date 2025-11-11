import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const ensureAnalyticsBridge = async (page: Page) => {
  await page.waitForFunction(() => Boolean(globalThis.__playwrightAnalytics));
};

const enableAnalytics = async (page: Page) => {
  await ensureAnalyticsBridge(page);
  await page.evaluate(() => globalThis.__playwrightAnalytics?.enable?.());
};

test.describe('PWA offline queue widget', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });

    await page.route('**/api/offline/process', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route('**/api/pwa/offline/sync', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });
  });

  test('reflects queue updates and manual processing events', async ({ page }) => {
    await page.goto('/e2e/pwa-analytics');
    await waitForPageReady(page);
    await enableAnalytics(page);

    const widget = page.getByTestId('pwa-offline-queue-widget');
    await expect(widget).toBeVisible();
    await expect(page.getByTestId('pwa-offline-queue-count')).toHaveText('0');

    await page.evaluate(() => {
      window.__pwaQueueHarness?.setQueueState?.(7, {
        cachedPages: 3,
        cachedResources: 2,
        isOffline: false,
      });
    });

    await expect(page.getByTestId('pwa-offline-queue-count')).toHaveText('7');
    await expect(page.getByTestId('pwa-offline-queue-status')).toContainText('Attention');

    await expect.poll(async () =>
      page.evaluate(() => {
        const events = globalThis.__playwrightAnalytics?.events ?? [];
        return events.filter((event) => event.action === 'offline_queue_updated').length;
      })
    ).toBeGreaterThan(0);

    await page.getByTestId('pwa-offline-queue-process').click();

    await expect(page.getByTestId('pwa-offline-queue-count')).toHaveText('0');
    await expect(page.getByTestId('pwa-offline-queue-status')).toContainText('Healthy');

    await page.evaluate(() => {
      window.__pwaQueueHarness?.setQueueState?.(2, {
        cachedPages: 1,
        cachedResources: 1,
        isOffline: true,
      });
    });

    await expect(page.getByTestId('pwa-offline-queue-count')).toHaveText('2');
    await expect(page.getByTestId('pwa-offline-queue-status')).toContainText('Monitor');
    await expect(page.getByTestId('pwa-offline-queue-widget')).toContainText('Device offline');
  });
});

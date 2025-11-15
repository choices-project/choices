import { expect, test, type Page } from '@playwright/test';

import type { PWAStoreHarness } from '@/app/(app)/e2e/pwa-store/page';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __pwaStoreHarness?: PWAStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/pwa-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__pwaStoreHarness));
  await page.waitForFunction(
    () => document.documentElement.dataset.pwaStoreHarness === 'ready'
  );
};

test.describe('@axe PWA store harness', () => {
  test('drives install, offline queue, notifications, and reset flows', async ({ page }) => {
    await gotoHarness(page);
    await runAxeAudit(page, 'pwa status harness initial');

    const installed = page.getByTestId('pwa-installed');
    const installable = page.getByTestId('pwa-installable');
    const online = page.getByTestId('pwa-online');
    const syncing = page.getByTestId('pwa-syncing');
    const queueSize = page.getByTestId('pwa-queue-size');
    const cachedPages = page.getByTestId('pwa-cached-pages');
    const cachedResources = page.getByTestId('pwa-cached-resources');
    const queueUpdated = page.getByTestId('pwa-queue-updated');
    const prefNotifications = page.getByTestId('pwa-pref-notifications');
    const prefBackgroundSync = page.getByTestId('pwa-pref-background-sync');
    const prefInstallPrompt = page.getByTestId('pwa-pref-install-prompt');
    const notificationList = page.getByTestId('pwa-notification-list');

    await expect(installed).toHaveText('false');
    await expect(installable).toHaveText('false');
    await expect(online).toHaveText('true');
    await expect(syncing).toHaveText('false');
    await expect(queueSize).toHaveText('0');
    await expect(notificationList).toHaveText(/No notifications queued/i);

    await page.evaluate(() => {
      window.__pwaStoreHarness?.setInstallation({ canInstall: true });
      window.__pwaStoreHarness?.setInstallation({ isInstalled: true });
    });

    await expect(installable).toHaveText('true');
    await expect(installed).toHaveText('true');
    await runAxeAudit(page, 'pwa status post-install');

    await page.evaluate(() => {
      window.__pwaStoreHarness?.setOfflineData({
        queuedActions: [
          {
            id: 'qa-1',
            type: 'install',
            endpoint: '/api/pwa/install',
            method: 'POST',
            timestamp: Date.now(),
            attempts: 0,
            maxAttempts: 3,
            payload: { feature: 'install' },
          } as any,
        ],
        cachedPages: ['/app', '/polls'],
        cachedResources: ['app.js'],
      });
      window.__pwaStoreHarness?.setOfflineQueueSize(1, new Date().toISOString());
      window.__pwaStoreHarness?.setOnlineStatus(false);
      window.__pwaStoreHarness?.setSyncing(true);
    });

    await expect(queueSize).toHaveText('1');
    await expect(cachedPages).toHaveText('2');
    await expect(cachedResources).toHaveText('1');
    await expect(queueUpdated).not.toHaveText('never');
    await expect(online).toHaveText('false');
    await expect(syncing).toHaveText('true');
    await runAxeAudit(page, 'pwa status offline queued actions');

    await page.evaluate(() => {
      window.__pwaStoreHarness?.updatePreferences({
        pushNotifications: false,
        backgroundSync: false,
        installPrompt: false,
      });
    });

    await expect(prefNotifications).toHaveText('false');
    await expect(prefBackgroundSync).toHaveText('false');
    await expect(prefInstallPrompt).toHaveText('false');

    await page.evaluate(() => {
      window.__pwaStoreHarness?.addNotification({
        type: 'install',
        title: 'Install ready',
        message: 'Install the Choices app for offline access',
        dismissible: true,
        priority: 'high',
        read: false,
      });
    });

    await expect(notificationList).not.toHaveText(/No notifications queued/i);
    await expect(notificationList).toContainText('Install ready');

    await page.evaluate(() => {
      window.__pwaStoreHarness?.setError('Sync failed: network unreachable');
    });

    await expect(page.getByTestId('pwa-error')).toHaveText(/Sync failed/i);

    await page.evaluate(() => {
      window.__pwaStoreHarness?.resetAll();
    });

    await expect(installed).toHaveText('false');
    await expect(online).toHaveText('true');
    await expect(queueSize).toHaveText('0');
    await expect(notificationList).toHaveText(/No notifications queued/i);
    await expect(syncing).toHaveText('false');
    await expect(prefNotifications).toHaveText('true');
    await expect(page.getByTestId('pwa-error')).toHaveCount(0);
  });
});


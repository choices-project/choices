import { expect, test, type Page } from '@playwright/test';

import type { NotificationStoreHarness } from '@/app/(app)/e2e/notification-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __notificationStoreHarness?: NotificationStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/notification-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__notificationStoreHarness));
  await page.evaluate(() => {
    window.__notificationStoreHarness?.clearAll();
    window.__notificationStoreHarness?.clearAllAdmin();
    window.__notificationStoreHarness?.resetSettings();
    window.__notificationStoreHarness?.updateSettings({
      enableAutoDismiss: true,
      duration: 800,
      enableStacking: true
    });
  });
};

test.describe('Notification store harness', () => {
  test('auto-dismisses transient notifications and preserves persistent ones', async ({ page }) => {
    await gotoHarness(page);

    const notificationList = page.getByTestId('notification-list');
    await expect(notificationList).toContainText('No notifications');

    await page.evaluate(() => {
      window.__notificationStoreHarness?.addNotification({
        type: 'success',
        title: 'Auto Success',
        message: 'This should disappear quickly.',
        duration: 500
      });
    });

    await expect(notificationList).toContainText('Auto Success');
    await page.waitForTimeout(700);
    await expect(notificationList).toContainText('No notifications');

    await page.evaluate(() => {
      window.__notificationStoreHarness?.addNotification({
        type: 'info',
        title: 'Persistent Info',
        message: 'Should remain visible.',
        duration: 0
      });
    });

    await expect(notificationList).toContainText('Persistent Info');
    await page.waitForTimeout(900);
    await expect(notificationList).toContainText('Persistent Info');
  });

  test('tracks admin notifications and supports mark-as-read + clear', async ({ page }) => {
    await gotoHarness(page);

    const adminList = page.getByTestId('admin-notification-list');
    const adminCount = page.getByTestId('admin-notification-count');
    const adminUnread = page.getByTestId('admin-notification-unread');

    await page.evaluate(() => {
      window.__notificationStoreHarness?.addAdminNotification({
        type: 'warning',
        title: 'Check queues',
        message: 'Background job stalled'
      });
      window.__notificationStoreHarness?.addAdminNotification({
        type: 'error',
        title: 'Service outage',
        message: 'Investigate immediately'
      });
    });

    await expect(adminCount).toHaveText('2');
    await expect(adminUnread).toHaveText('2');
    await expect(adminList).toContainText('Service outage');

    const adminNotificationIds = await page.evaluate(() => {
      return window.__notificationStoreHarness
        ? window.__notificationStoreHarness.getSnapshot().adminNotifications.map((item) => item.id)
        : [];
    });

    const firstId = adminNotificationIds[0];
    if (!firstId) {
      throw new Error('Expected at least one admin notification id');
    }
    await page.evaluate((id) => {
      window.__notificationStoreHarness?.markAdminAsRead(id);
    }, firstId);

    await expect(adminUnread).toHaveText('1');

    await page.evaluate(() => {
      window.__notificationStoreHarness?.clearAllAdmin();
    });

    await expect(adminCount).toHaveText('0');
    await expect(adminList).toContainText('No admin notifications');
  });
});


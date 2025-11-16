import { expect, test, type Page } from '@playwright/test';

import type { AdminStoreHarness } from '@/app/(app)/e2e/admin-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
   
  interface Window {
    __adminStoreHarness?: AdminStoreHarness;
  }
   
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/admin-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__adminStoreHarness));
};

test.describe('Admin store harness', () => {
  test('exposes key admin state transitions', async ({ page }) => {
    await gotoHarness(page);

    const sidebar = page.getByTestId('admin-sidebar-collapsed');
    const currentPage = page.getByTestId('admin-current-page');
    const notificationCount = page.getByTestId('admin-notification-count');
    const unreadCount = page.getByTestId('admin-unread-count');
    const enabledFlags = page.getByTestId('admin-feature-flags-enabled');
    const usersCount = page.getByTestId('admin-users-count');
    const bulkActionsVisible = page.getByTestId('admin-bulk-actions-visible');
    const selectedUsers = page.getByTestId('admin-selected-users');
    const usersList = page.getByTestId('admin-users-list');
  const reimportRunning = page.getByTestId('admin-reimport-running');
  const reimportProgress = page.getByTestId('admin-reimport-progress');
  const reimportLogs = page.getByTestId('admin-reimport-logs');

    await expect(sidebar).toHaveText('false');
    await expect(currentPage).toHaveText('dashboard');

    await page.evaluate(() => {
      window.__adminStoreHarness?.toggleSidebar();
    });

    await expect(sidebar).toHaveText('true');

    await page.evaluate(() => {
      window.__adminStoreHarness?.addNotification({
        type: 'info',
        title: 'Harness notification',
        message: 'Hello from the admin harness!',
        timestamp: new Date().toISOString(),
      });
    });

    await expect(notificationCount).toHaveText('1');
    await expect(unreadCount).toHaveText('1');

    await page.evaluate(() => {
      window.__adminStoreHarness?.seedUsers([
        {
          id: 'admin-user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          status: 'active',
          is_admin: true,
          created_at: new Date().toISOString(),
        } as any,
      ]);
    });

    await expect(usersCount).toHaveText('1');
    await expect(selectedUsers).toHaveText('none');
    await expect(bulkActionsVisible).toHaveText('false');
    await expect(usersList).toContainText('Admin User');

    await page.evaluate(() => {
      window.__adminStoreHarness?.selectUser('admin-user-1');
    });

    await expect(selectedUsers).toContainText('admin-user-1');
    await expect(bulkActionsVisible).toHaveText('true');

    await page.evaluate(() => {
      window.__adminStoreHarness?.selectAllUsers();
    });

    await expect(selectedUsers).toContainText('admin-user-1');
    await expect(bulkActionsVisible).toHaveText('true');

    await page.evaluate(() => {
      window.__adminStoreHarness?.deselectAllUsers();
    });

    await expect(selectedUsers).toHaveText('none');
    await expect(bulkActionsVisible).toHaveText('false');

    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const latestId = harness?.getSnapshot().notifications[0]?.id;
      if (latestId) {
        harness?.markNotificationRead(latestId);
      }
    });

    await expect(unreadCount).toHaveText('0');

    await page.evaluate(() => {
      window.__adminStoreHarness?.enableFeatureFlag('THEMES');
    });

    await expect(enabledFlags).toContainText('THEMES');

    await page.evaluate(() => {
      window.__adminStoreHarness?.setIsReimportRunning(true);
      window.__adminStoreHarness?.setReimportProgress({
        totalStates: 10,
        processedStates: 4,
      });
    });

    await expect(reimportRunning).toHaveText('true');
    await expect(reimportProgress).toHaveText('4/10');

    await page.evaluate(() => {
      window.__adminStoreHarness?.setReimportProgress({
        processedStates: 10,
        successfulStates: 10,
        totalStates: 10,
      });
      window.__adminStoreHarness?.setIsReimportRunning(false);
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      snapshot?.addReimportLog?.('Completed'); // fallback if action nested, else no-op
    });

    await expect(reimportRunning).toHaveText('false');
    await expect(reimportProgress).toHaveText('10/10');
    await expect(reimportLogs).toContainText(/completed/i);

    await page.evaluate(() => {
      window.__adminStoreHarness?.resetAdminState();
    });

    await expect(sidebar).toHaveText('false');
    await expect(notificationCount).toHaveText('0');
    await expect(unreadCount).toHaveText('0');
    await expect(enabledFlags).not.toContainText('THEMES');
    await expect(usersCount).toHaveText('0');
    await expect(selectedUsers).toHaveText('none');
    await expect(reimportRunning).toHaveText('false');
    await expect(reimportProgress).toHaveText('0/0');
  });
});



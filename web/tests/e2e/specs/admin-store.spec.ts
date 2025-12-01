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
  await page.waitForFunction(
    () => document.documentElement.dataset.adminStoreHarness === 'ready'
  );
};

test.describe('Admin Store E2E', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes admin store API', async ({ page }) => {
    const harness = await page.evaluate(() => window.__adminStoreHarness);
    expect(harness).toBeDefined();
    expect(harness?.toggleSidebar).toBeDefined();
    expect(harness?.addNotification).toBeDefined();
    expect(harness?.enableFeatureFlag).toBeDefined();
    expect(harness?.seedUsers).toBeDefined();
    expect(harness?.resetAdminState).toBeDefined();
  });

  test('toggles sidebar', async ({ page }) => {
    const initialCollapsed = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.sidebarCollapsed;
    });

    await page.evaluate(() => {
      window.__adminStoreHarness?.toggleSidebar();
    });

    const afterToggle = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.sidebarCollapsed;
    });

    expect(afterToggle).toBe(!initialCollapsed);
  });

  test('adds and marks notification as read', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.addNotification({
        id: 'test-notif-1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
      });
    });

    const notifications = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.notifications;
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Test Notification');

    await page.evaluate(() => {
      window.__adminStoreHarness?.markNotificationRead('test-notif-1');
    });

    const updatedNotifications = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.notifications;
    });

    expect(updatedNotifications[0].read).toBe(true);
  });

  test('manages feature flags', async ({ page }) => {
    const enabled = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      return harness?.enableFeatureFlag('SOCIAL_SHARING');
    });

    expect(enabled).toBe(true);

    const featureFlags = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.featureFlags;
    });

    expect(featureFlags?.SOCIAL_SHARING).toBe(true);

    const disabled = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      return harness?.disableFeatureFlag('SOCIAL_SHARING');
    });

    expect(disabled).toBe(true);

    const updatedFlags = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.featureFlags;
    });

    expect(updatedFlags?.SOCIAL_SHARING).toBe(false);
  });

  test('manages users (select, select all, deselect all)', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.seedUsers([
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    await page.evaluate(() => {
      window.__adminStoreHarness?.selectUser('user-1');
    });

    let selectedUsers = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.userFilters.selectedUsers;
    });

    expect(selectedUsers).toContain('user-1');

    await page.evaluate(() => {
      window.__adminStoreHarness?.selectAllUsers();
    });

    selectedUsers = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.userFilters.selectedUsers;
    });

    expect(selectedUsers.length).toBeGreaterThan(0);

    await page.evaluate(() => {
      window.__adminStoreHarness?.deselectAllUsers();
    });

    selectedUsers = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.userFilters.selectedUsers;
    });

    expect(selectedUsers).toHaveLength(0);
  });

  test('manages reimport progress', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.setReimportProgress({
        type: 'polls',
        isRunning: true,
        current: 50,
        total: 100,
        status: 'processing',
      });
    });

    const progress = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.reimportProgress;
    });

    expect(progress?.isRunning).toBe(true);
    expect(progress?.current).toBe(50);
    expect(progress?.total).toBe(100);
    expect(progress?.status).toBe('processing');
  });

  test('resets admin state', async ({ page }) => {
    // Set up some state
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.addNotification({
        id: 'test-1',
        title: 'Test',
        message: 'Test',
        type: 'info',
      });
      harness?.selectUser('user-1');
    });

    await page.evaluate(() => {
      window.__adminStoreHarness?.resetAdminState();
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.notifications).toHaveLength(0);
    expect(snapshot?.userFilters.selectedUsers).toHaveLength(0);
  });
});

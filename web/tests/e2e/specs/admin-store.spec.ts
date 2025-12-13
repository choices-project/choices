import { expect, test, type Page } from '@playwright/test';

import type { AdminStoreHarness } from '@/app/(app)/e2e/admin-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __adminStoreHarness?: AdminStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/admin-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__adminStoreHarness), { timeout: 60_000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.adminStoreHarness === 'ready',
    { timeout: 60_000 },
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
    // Add notification (id is auto-generated)
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.addNotification({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
      });
    });

    // Get the notification id from the created notification
    const notificationId = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      const notification = snapshot?.notifications?.[0];
      return notification?.id;
    });

    expect(notificationId).toBeDefined();

    const notifications = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.notifications;
    });

    expect(notifications).toBeDefined();
    expect(notifications?.length).toBeGreaterThanOrEqual(1);
    expect(notifications?.[0]?.title).toBe('Test Notification');
    expect(notifications?.[0]?.read).toBe(false); // Initially unread

    // Mark the notification as read using the actual id
    await page.evaluate((id) => {
      window.__adminStoreHarness?.markNotificationRead(id);
    }, notificationId);

    const updatedNotifications = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.notifications;
    });

    expect(updatedNotifications).toBeDefined();
    // Find the notification by id to ensure we're checking the right one
    const updatedNotification = updatedNotifications?.find((n) => n.id === notificationId);
    expect(updatedNotification?.read).toBe(true);
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

    expect(featureFlags?.flags?.SOCIAL_SHARING).toBe(true);

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

    expect(updatedFlags?.flags?.SOCIAL_SHARING).toBe(false);
  });

  test('manages users (select, select all, deselect all)', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.seedUsers([
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'user',
          status: 'active',
          is_admin: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'admin',
          status: 'active',
          is_admin: true,
          created_at: new Date().toISOString(),
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

    expect(selectedUsers?.length).toBeGreaterThan(0);

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
        totalStates: 50,
        processedStates: 25,
        successfulStates: 20,
        failedStates: 5,
        totalRepresentatives: 100,
        federalRepresentatives: 50,
        stateRepresentatives: 50,
        errors: [],
        stateResults: [],
      });
    });

    const progress = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.reimportProgress;
    });

    expect(progress?.totalStates).toBe(50);
    expect(progress?.processedStates).toBe(25);
    expect(progress?.successfulStates).toBe(20);
    expect(progress?.failedStates).toBe(5);
  });

  test('resets admin state', async ({ page }) => {
    // Set up some state
    await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      harness?.addNotification({
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

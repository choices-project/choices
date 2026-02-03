import { expect, test, type Page } from '@playwright/test';

import type { AdminStoreHarness } from '@/app/(app)/e2e/admin-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __adminStoreHarness?: AdminStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/admin-store', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await waitForPageReady(page, 90_000);
  await page.waitForFunction(() => Boolean(window.__adminStoreHarness), { timeout: 90_000 });
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.adminStoreHarness === 'ready',
      { timeout: 10_000 },
    );
  } catch {
    // Dataset attribute might not be set in staging, but harness is available
  }
};

const isProduction = () => {
  const base = process.env.BASE_URL ?? '';
  return base.includes('choices-app.com') || base.includes('production');
};

test.describe('Admin Store E2E', () => {
  test.skip(() => isProduction(), 'E2E harness route /e2e/admin-store is not deployed to production');

  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes admin store API', async ({ page }) => {
    const harnessExists = await page.evaluate(() => Boolean(window.__adminStoreHarness));
    expect(harnessExists).toBe(true);

    const hasToggleSidebar = await page.evaluate(
      () => typeof window.__adminStoreHarness?.toggleSidebar === 'function',
    );
    expect(hasToggleSidebar).toBe(true);

    const hasAddNotification = await page.evaluate(
      () => typeof window.__adminStoreHarness?.addNotification === 'function',
    );
    expect(hasAddNotification).toBe(true);

    const hasEnableFeatureFlag = await page.evaluate(
      () => typeof window.__adminStoreHarness?.enableFeatureFlag === 'function',
    );
    expect(hasEnableFeatureFlag).toBe(true);

    const hasSeedUsers = await page.evaluate(
      () => typeof window.__adminStoreHarness?.seedUsers === 'function',
    );
    expect(hasSeedUsers).toBe(true);

    const hasResetAdminState = await page.evaluate(
      () => typeof window.__adminStoreHarness?.resetAdminState === 'function',
    );
    expect(hasResetAdminState).toBe(true);
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
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
      });
    });

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
    expect(notifications?.[0]?.read).toBe(false);

    if (notificationId) {
      await page.evaluate((id) => {
        window.__adminStoreHarness?.markNotificationRead(id);
      }, notificationId);
    } else {
      throw new Error('Notification ID is undefined');
    }

    const updatedNotifications = await page.evaluate(() => {
      const harness = window.__adminStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.notifications;
    });

    expect(updatedNotifications).toBeDefined();
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

  test('resets admin state', async ({ page }) => {
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

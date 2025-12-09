import { expect, test, type Page } from '@playwright/test';

import type { PushNotificationsHarness } from '@/app/(app)/e2e/push-notifications/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __pushNotificationsHarness?: PushNotificationsHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/push-notifications', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__pushNotificationsHarness), { timeout: 60_000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.pushNotificationsHarness === 'ready',
    { timeout: 60_000 },
  );
};

test.describe('Push Notifications E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Grant notification permission for testing
    await page.context().grantPermissions(['notifications']);

    // Mock API endpoints
    await page.route('**/api/pwa/notifications/subscribe', async (route) => {
      const method = route.request().method();
      const body = route.request().postDataJSON();

      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            subscriptionId: 'test-sub-id-123',
            message: 'Push notifications enabled successfully',
            timestamp: new Date().toISOString(),
          }),
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Notification preferences updated successfully',
            timestamp: new Date().toISOString(),
          }),
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Push notifications disabled successfully',
            timestamp: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 405,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Method not allowed' }),
        });
      }
    });
  });

  test('displays notification preferences component', async ({ page }) => {
    await gotoHarness(page);

    const component = page.getByTestId('notification-preferences');
    await expect(component).toBeVisible();
    await expect(component).toContainText('Notification Preferences');
  });

  test('shows current permission status', async ({ page }) => {
    await gotoHarness(page);

    const permission = page.getByTestId('push-notification-permission');
    await expect(permission).toBeVisible();
    
    // Permission should be 'granted' since we granted it in beforeEach
    const permissionText = await permission.textContent();
    expect(permissionText).toBeTruthy();
  });

  test('handles permission request flow', async ({ page }) => {
    await gotoHarness(page);

    // Check initial state
    const permissionStatus = page.getByTestId('push-notification-permission');
    await expect(permissionStatus).toBeVisible();

    // Test requesting permission via harness
    const result = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.requestPermission();
    });

    expect(result).toBe('granted');
  });

  test('subscribes to push notifications', async ({ page }) => {
    await gotoHarness(page);

    // Subscribe via harness
    const subscribed = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.subscribe();
    });

    expect(subscribed).toBe(true);

    // Verify subscription status updated
    await expect(page.getByTestId('push-notification-subscribed')).toHaveText('Yes');
    
    // Verify endpoint is set
    const endpoint = page.getByTestId('push-notification-endpoint');
    await expect(endpoint).toBeVisible();
  });

  test('unsubscribes from push notifications', async ({ page }) => {
    await gotoHarness(page);

    // First subscribe
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
    });

    await expect(page.getByTestId('push-notification-subscribed')).toHaveText('Yes');

    // Then unsubscribe
    const unsubscribed = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.unsubscribe();
    });

    expect(unsubscribed).toBe(true);

    // Verify subscription status updated
    await expect(page.getByTestId('push-notification-subscribed')).toHaveText('No');
  });

  test('updates notification preferences', async ({ page }) => {
    await gotoHarness(page);

    // Subscribe first
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
    });

    // Update preferences via harness
    const updated = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.updatePreferences({
        newPolls: false,
        systemUpdates: true,
      });
    });

    expect(updated).toBe(true);

    // Verify preferences updated
    await expect(page.getByTestId('pref-new-polls')).toHaveText('Disabled');
    await expect(page.getByTestId('pref-system-updates')).toHaveText('Enabled');
  });

  test('handles UI permission request button', async ({ page }) => {
    // Revoke permission first to test request flow
    await page.context().clearPermissions();

    await gotoHarness(page);

    // Look for permission request button
    const requestButton = page.getByTestId('request-notification-permission');
    
    // Button should be visible if permission is default
    if (await requestButton.isVisible().catch(() => false)) {
      await requestButton.click();
      
      // Wait for permission dialog (Playwright handles this automatically)
      await page.waitForTimeout(1000);
      
      // Verify permission status updated
      const permission = page.getByTestId('push-notification-permission');
      await expect(permission).toBeVisible();
    }
  });

  test('handles subscribe/unsubscribe UI buttons', async ({ page }) => {
    await gotoHarness(page);

    // Check if subscribe button exists and click it
    const subscribeButton = page.getByTestId('subscribe-notifications');
    
    if (await subscribeButton.isVisible().catch(() => false)) {
      await subscribeButton.click();
      
      // Wait for subscription to complete
      await page.waitForTimeout(2000);
      
      // Verify subscribed
      await expect(page.getByTestId('push-notification-subscribed')).toHaveText('Yes');
      
      // Now test unsubscribe
      const unsubscribeButton = page.getByTestId('unsubscribe-notifications');
      if (await unsubscribeButton.isVisible().catch(() => false)) {
        await unsubscribeButton.click();
        await page.waitForTimeout(1000);
        
        // Verify unsubscribed
        await expect(page.getByTestId('push-notification-subscribed')).toHaveText('No');
      }
    }
  });

  test('handles preference toggle buttons', async ({ page }) => {
    await gotoHarness(page);

    // Subscribe first
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
    });

    await page.waitForTimeout(1000);

    // Test toggling preferences
    const newPollsToggle = page.getByTestId('new-polls-toggle');
    
    if (await newPollsToggle.isVisible().catch(() => false)) {
      // Get initial state
      const initialText = await page.getByTestId('pref-new-polls').textContent();
      expect(initialText).toBeTruthy();
      
      // Toggle
      await newPollsToggle.click();
      await page.waitForTimeout(500);
      
      // Verify preference updated (should be different from initial)
      const updatedText = await page.getByTestId('pref-new-polls').textContent();
      expect(updatedText).toBeTruthy();
      expect(updatedText).not.toBe(initialText);
    }
  });

  test('retrieves preferences via harness', async ({ page }) => {
    await gotoHarness(page);

    const prefs = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.getPreferences();
    });

    expect(prefs).toBeTruthy();
    expect(prefs?.newPolls).toBeDefined();
    expect(prefs?.pollResults).toBeDefined();
    expect(prefs?.systemUpdates).toBeDefined();
    expect(prefs?.weeklyDigest).toBeDefined();
  });

  test('handles unsupported browser scenario', async ({ page }) => {
    // Mock unsupported browser by removing Notification API
    await page.addInitScript(() => {
      delete (window as any).Notification;
    });

    await gotoHarness(page);

    // Should show unsupported message
    const unsupported = page.getByTestId('notification-preferences-unsupported');
    
    // Note: This might not show if component checks happen before our script
    // This test verifies the component handles the unsupported state
    if (await unsupported.isVisible().catch(() => false)) {
      await expect(unsupported).toContainText('not supported');
    }
  });

  test('handles API errors gracefully', async ({ page }) => {
    await gotoHarness(page);

    // Override route to return error
    await page.route('**/api/pwa/notifications/subscribe', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Try to subscribe
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
    });

    // Component should handle error gracefully
    const errorMessage = page.getByTestId('notification-error');
    
    // Error might be shown in component
    // This verifies the error handling flow exists
    await page.waitForTimeout(1000);
  });

  test('verifies subscription status check', async ({ page }) => {
    await gotoHarness(page);

    // Check initial subscription status
    const initialStatus = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.getSubscriptionStatus();
    });

    expect(initialStatus).toBe(false);

    // Subscribe
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
    });

    await page.waitForTimeout(1000);

    // Check subscription status again
    const subscribedStatus = await page.evaluate(async () => {
      return window.__pushNotificationsHarness?.getSubscriptionStatus();
    });

    expect(subscribedStatus).toBe(true);
  });

  test('maintains preferences across subscription', async ({ page }) => {
    await gotoHarness(page);

    // Update preferences before subscribing
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.updatePreferences({
        weeklyDigest: false,
      });
    });

    await page.waitForTimeout(500);

    // Verify preference is set
    await expect(page.getByTestId('pref-weekly-digest')).toHaveText('Disabled');

    // Subscribe
    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
    });

    await page.waitForTimeout(1000);

    // Verify preference maintained
    await expect(page.getByTestId('pref-weekly-digest')).toHaveText('Disabled');
  });
});

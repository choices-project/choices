import { expect, test, type Page } from '@playwright/test';

import type { PollWizardHarness } from '@/app/(app)/e2e/poll-wizard/page';
import type { PushNotificationsHarness } from '@/app/(app)/e2e/push-notifications/page';

import { setupExternalAPIMocks, waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __pollWizardHarness?: PollWizardHarness;
    __pushNotificationsHarness?: PushNotificationsHarness;
  }
}

const gotoHarness = async ({
  page,
  path,
  datasetKey,
  readySelector,
  readyTimeout = 30_000,
}: {
  page: Page;
  path: string;
  datasetKey?: string;
  readySelector?: string;
  readyTimeout?: number;
}) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  if (datasetKey) {
    try {
      await page.waitForFunction(
        (key) => document.documentElement.dataset[key] === 'ready' || document.documentElement.dataset[key] === 'true',
        datasetKey,
        { timeout: readyTimeout },
      );
    } catch (error) {
      if (!readySelector) {
        throw error;
      }
    }
  }
  if (readySelector) {
    await page.waitForSelector(readySelector, { timeout: readyTimeout });
  }
};

test.describe('@smoke Critical user journeys', () => {
  test('dashboard journey recovers from transient feed failures', async ({ page }) => {
    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await gotoHarness({
        page,
        path: '/e2e/dashboard-journey',
        datasetKey: 'dashboardJourneyHarness',
        readySelector: '[data-testid="personal-dashboard"]',
      });
      const toggle = page.getByTestId('show-elected-officials-toggle');
      await expect(toggle).toBeChecked();
      await toggle.uncheck();
      await expect(toggle).not.toBeChecked();

      await page.getByRole('button', { name: 'View Trending Feed' }).click();
      await page.waitForURL('**/feed');
      await waitForPageReady(page);
      await expect(page.getByTestId('unified-feed')).toBeVisible({ timeout: 20_000 });

      await page.route(
        '**/api/feeds**',
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Smoke test feed failure' }),
          });
        },
        { times: 1 },
      );

      await page.getByRole('button', { name: 'Refresh' }).click();
      // Ensure the feed request was made (helps verify route matched)
      await page.waitForResponse(
        (resp) => resp.url().includes('/api/feeds') && resp.status() === 500,
        { timeout: 10_000 },
      );
      // Assert the UI shows the failure alert with a more generous timeout
      await expect(page.getByText('Failed to refresh feeds')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('alert').first()).toContainText('Failed to refresh feeds', { timeout: 20_000 });

      await page.getByRole('button', { name: 'Try Again' }).click();
      await page.waitForSelector('text=Climate Action Now');
    } finally {
      await cleanupMocks();
    }
  });

  test('poll wizard produces a share-ready poll snapshot', async ({ page }) => {
    await gotoHarness({
      page,
      path: '/e2e/poll-wizard',
      datasetKey: 'pollWizardHarness',
      readySelector: '[data-testid="poll-wizard-harness"]',
    });

    await page.evaluate(() => {
      const harness = window.__pollWizardHarness;
      if (!harness) {
        throw new Error('Poll wizard harness missing');
      }
      harness.actions.resetWizard();
      harness.actions.updateData({
        title: 'Smoke Test Community Vote',
        description: 'Critical smoke path poll',
      });
      harness.actions.updateOption(0, 'Fund it');
      harness.actions.updateOption(1, 'Delay decision');
      harness.actions.nextStep();
      harness.actions.addTag('smoke');
      harness.actions.nextStep();
      harness.actions.nextStep();
    });

    await expect(page.getByTestId('wizard-is-complete')).toHaveText('true');
    await expect(page.getByTestId('wizard-data-title')).toContainText('Smoke Test Community Vote');
    await expect(page.getByTestId('wizard-tags-count')).toHaveText('1');
  });

  test('push notification opt-in toggles subscription and preferences', async ({ page }) => {
    await page.context().grantPermissions(['notifications']);
    await page.route('**/api/pwa/notifications/subscribe', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            subscriptionId: 'smoke-sub',
            message: 'Subscribed',
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }
      if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Preferences updated',
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unsubscribed' }),
      });
    });

    await gotoHarness({
      page,
      path: '/e2e/push-notifications',
      datasetKey: 'pushNotificationsHarness',
      readySelector: '[data-testid="push-notifications-harness"]',
      readyTimeout: 40_000, // Increase for this harness
    });
    
    // Wait for stores to hydrate if needed
    await page.waitForFunction(
      () => {
        const element = document.querySelector('[data-testid="push-notifications-harness"]');
        return element !== null && !element.textContent?.includes('Preparing');
      },
      { timeout: 40_000 }
    );
    
    await expect(page.getByTestId('notification-preferences')).toBeVisible({ timeout: 10_000 });

    await page.evaluate(async () => {
      await window.__pushNotificationsHarness?.subscribe();
      await window.__pushNotificationsHarness?.updatePreferences({
        newPolls: false,
        systemUpdates: true,
      });
    });

    await expect(page.getByTestId('push-notification-subscribed')).toHaveText('Yes');
    await expect(page.getByTestId('pref-new-polls')).toHaveText('Disabled');
    await expect(page.getByTestId('pref-system-updates')).toHaveText('Enabled');
  });
});


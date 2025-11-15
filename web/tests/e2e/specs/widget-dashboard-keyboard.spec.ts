import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

import type { WidgetDashboardHarness } from '@/app/(app)/e2e/widget-dashboard/page';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';
import {
  hasAnnouncementCapture,
  installScreenReaderCapture,
  waitForAnnouncement,
} from '../helpers/screen-reader';

const HARNESS_USER_ID = '00000000-0000-0000-0000-000000000042';
const DEFAULT_WIDGET_ID = 'widget-dashboard-default';

declare global {
  interface Window {
    __widgetDashboardHarness?: WidgetDashboardHarness;
  }
}

const stubLayout = {
  id: 'widget-dashboard-layout',
  userId: HARNESS_USER_ID,
  name: 'Widget Dashboard Harness Layout',
  description: 'Deterministic layout for widget dashboard keyboard tests',
  widgets: [
    {
      id: DEFAULT_WIDGET_ID,
      type: 'poll-heatmap',
      title: 'Poll Engagement Heatmap',
      description: 'Harness widget for keyboard interaction tests',
      icon: '🔥',
      enabled: true,
      position: { x: 0, y: 0 },
      size: { w: 4, h: 3 },
      minSize: { w: 2, h: 2 },
      maxSize: { w: 8, h: 6 },
      static: false,
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  isDefault: true,
  isPreset: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const layoutApiMatcher = '**/api/analytics/dashboard/layout*';

const gotoWidgetHarness = async (page: Page, testInfo: TestInfo) => {
  await installScreenReaderCapture(page);
  page.on('console', (msg) => {
    // eslint-disable-next-line no-console
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });

  await page.route(layoutApiMatcher, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(stubLayout),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route('**/api/analytics/poll-heatmap**', async (route) => {
    const responseBody = {
      ok: true,
      polls: [
        {
          poll_id: 'poll-1',
          title: 'Keyboard Harness Poll',
          category: 'Testing',
          total_votes: 420,
          unique_voters: 280,
          engagement_score: 85,
          created_at: new Date().toISOString(),
          is_active: true,
        },
        {
          poll_id: 'poll-2',
          title: 'Accessibility Baseline Poll',
          category: 'Accessibility',
          total_votes: 360,
          unique_voters: 240,
          engagement_score: 72,
          created_at: new Date().toISOString(),
          is_active: false,
        },
      ],
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });

  const consoleMessages: string[] = [];
  page.on('console', (message) => {
    const entry = `${message.type().toUpperCase()}: ${message.text()}`;
    consoleMessages.push(entry);
  });

  await page.goto('/e2e/widget-dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  await waitForPageReady(page, 60_000);
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined);
  try {
    await expect(page.getByTestId('widget-dashboard-harness')).toBeVisible({ timeout: 60_000 });
  } catch (error) {
    if (consoleMessages.length) {
      await testInfo.attach('console.log', {
        body: consoleMessages.join('\n'),
        contentType: 'text/plain',
      });
    }
    throw error;
  }

  await page.waitForFunction(
    (widgetId) =>
      Boolean(window.__widgetDashboardHarness?.getWidgetSnapshot?.(widgetId)),
    DEFAULT_WIDGET_ID,
    { timeout: 10_000 },
  );
};

test.describe('@keyboard Widget dashboard keyboard controls', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await gotoWidgetHarness(page, testInfo);
    const logCaptureReady = await hasAnnouncementCapture(page);
    console.log('[test] announce log capture ready', logCaptureReady);
    const results = await runAxeAudit(page, 'widget dashboard baseline', {
      allowViolations: true,
    });
    await test.info().attach('widget-dashboard-axe-results.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
  });

  test('move mode repositions widget with arrow keys', async ({ page }) => {
    const widgetCard = page.locator(`[data-widget-id="${DEFAULT_WIDGET_ID}"]`);
    await expect(widgetCard).toBeVisible();
    await widgetCard.focus();

    const moveButton = page.getByRole('button', { name: 'Move' });
    await moveButton.click();
    await expect(moveButton).toHaveAttribute('aria-pressed', 'true');
    await expect(widgetCard).toBeFocused();

    const widgetTitle = await page.evaluate((widgetId) => {
      const state = window.__widgetDashboardHarness?.dumpState();
      if (!state) {
        return '';
      }
      const widget = state.widgets.find(({ id }) => id === widgetId);
      return widget?.title ?? '';
    }, DEFAULT_WIDGET_ID);

    const initialX = await page.evaluate((widgetId) => {
      return (
        window.__widgetDashboardHarness
          ?.getWidgetSnapshot(widgetId)
          ?.position.x ?? 0
      );
    }, DEFAULT_WIDGET_ID);

    await page.keyboard.press('ArrowRight');

    await page.waitForTimeout(50);

    await page.waitForFunction(
      ({ widgetId, expectedX }) =>
        window.__widgetDashboardHarness?.getWidgetSnapshot(widgetId)?.position.x === expectedX,
      { widgetId: DEFAULT_WIDGET_ID, expectedX: initialX + 1 },
      { timeout: 5_000 },
    );

    await waitForAnnouncement(page, {
      priority: 'assertive',
      textFragment: `Move mode enabled for ${widgetTitle}`,
    });

    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Widget moved to column',
    });

    await page.keyboard.press('Enter');

    await expect(moveButton).toHaveAttribute('aria-pressed', 'false');
    await page.waitForFunction(
      (widgetId) =>
        window.__widgetDashboardHarness?.getWidgetSnapshot(widgetId)?.keyboardMode === 'idle',
      DEFAULT_WIDGET_ID,
      { timeout: 5_000 },
    );

    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Move mode exited',
    });
  });

  test('resize mode adjusts widget size with keyboard', async ({ page }) => {
    const widgetCard = page.locator(`[data-widget-id="${DEFAULT_WIDGET_ID}"]`);
    await expect(widgetCard).toBeVisible();
    await widgetCard.focus();

    const resizeButton = page.getByRole('button', { name: 'Resize' });
    await resizeButton.click();
    await expect(resizeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(widgetCard).toBeFocused();

    const widgetTitle = await page.evaluate((widgetId) => {
      const state = window.__widgetDashboardHarness?.dumpState();
      if (!state) {
        return '';
      }
      const widget = state.widgets.find(({ id }) => id === widgetId);
      return widget?.title ?? '';
    }, DEFAULT_WIDGET_ID);

    const initialWidth = await page.evaluate((widgetId) => {
      return (
        window.__widgetDashboardHarness
          ?.getWidgetSnapshot(widgetId)
          ?.size.w ?? 0
      );
    }, DEFAULT_WIDGET_ID);

    await page.keyboard.press('ArrowRight');

    await page.waitForTimeout(50);

    await page.waitForFunction(
      ({ widgetId, expectedWidth }) =>
        window.__widgetDashboardHarness?.getWidgetSnapshot(widgetId)?.size.w === expectedWidth,
      { widgetId: DEFAULT_WIDGET_ID, expectedWidth: initialWidth + 1 },
      { timeout: 5_000 },
    );

    await waitForAnnouncement(page, {
      priority: 'assertive',
      textFragment: `Resize mode enabled for ${widgetTitle}`,
    });

    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Widget size is now',
    });

    await page.keyboard.press('Escape');

    const resizeButtonCount = await page.getByRole('button', { name: 'Resize' }).count();
    if (resizeButtonCount > 0) {
      await expect(page.getByRole('button', { name: 'Resize' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
    await page.waitForFunction(
      (widgetId) =>
        window.__widgetDashboardHarness?.getWidgetSnapshot(widgetId)?.keyboardMode === 'idle',
      DEFAULT_WIDGET_ID,
      { timeout: 5_000 },
    );

    await waitForAnnouncement(page, {
      priority: 'polite',
      textFragment: 'Resize mode exited',
    });
  });
});


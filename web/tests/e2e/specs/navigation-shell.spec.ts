import { test, expect } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('App/Admin navigation shell', () => {
  test('updates AppShell data attributes and admin sidebar selection', async ({ page }) => {
    await page.goto('/e2e/navigation-shell', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await waitForPageReady(page);
    await page.waitForFunction(() => Boolean(window.__navigationShellHarness), { timeout: 30_000 });

    const setRoute = async (route: string, label: string) => {
      await page.evaluate(
        ([nextRoute, nextLabel]) =>
          window.__navigationShellHarness?.setRoute(nextRoute, nextLabel),
        [route, label],
      );
      const shell = page.locator('[data-testid="app-shell"]');
      await expect(shell).toBeVisible();
      await expect(shell).toHaveAttribute('data-theme', /.+/);
      await expect(shell).toHaveAttribute('data-sidebar-collapsed');
      await expect(page.locator('[data-testid="current-route"]')).toHaveText(route);
      await expect(page.locator('[data-testid="breadcrumbs"]')).toContainText(label);
    };

    await setRoute('/dashboard', 'Dashboard');
    await setRoute('/polls', 'Polls');
    await setRoute('/analytics', 'Analytics');

    const assertAdminSection = async (section: string, text: string) => {
      await page.evaluate(
        ([nextSection]) =>
          window.__navigationShellHarness?.setAdminSection(nextSection),
        [section],
      );
      await expect(
        page.locator('[aria-label="Admin navigation"]').locator(
          `a[aria-current="page"] >> text=${text}`,
        ),
      ).toBeVisible();
    };

    await assertAdminSection('admin-dashboard', 'Dashboard');
    await assertAdminSection('admin-users', 'Users');
    await assertAdminSection('admin-feature-flags', 'Feature Flags');
  });
});



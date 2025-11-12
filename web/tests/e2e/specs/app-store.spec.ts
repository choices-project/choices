import { expect, test, type Page } from '@playwright/test';

import type { AppStoreHarness } from '@/app/(app)/e2e/app-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __appStoreHarness?: AppStoreHarness;
  }
}

/**
 * Navigates to the app-store harness and waits until the harness API is available.
 */
const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/app-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__appStoreHarness));
};

test.describe('App store harness', () => {
  test('allows theme, layout, feature flag, and modal transitions', async ({ page }) => {
    await gotoHarness(page);

    const theme = page.getByTestId('app-theme');
    const resolvedTheme = page.getByTestId('app-resolved-theme');
    const sidebarCollapsed = page.getByTestId('app-sidebar-collapsed');
    const featureFlags = page.getByTestId('app-feature-flags');
    const animationsSetting = page.getByTestId('app-setting-animations');
    const modalStack = page.getByTestId('app-modal-stack');
    const currentRoute = page.getByTestId('app-current-route');
    const breadcrumbs = page.getByTestId('app-breadcrumbs');

    await expect(theme).toHaveText('system');
    await expect(resolvedTheme).toHaveText('light');
    await expect(sidebarCollapsed).toHaveText('false');

    await page.evaluate(() => {
      window.__appStoreHarness?.toggleTheme();
    });

    await expect(theme).toHaveText('dark');
    await expect(resolvedTheme).toHaveText('dark');

    await page.evaluate(() => {
      window.__appStoreHarness?.setTheme('light');
    });

    await expect(theme).toHaveText('light');
    await expect(resolvedTheme).toHaveText('light');

    await page.evaluate(() => {
      window.__appStoreHarness?.setSidebarCollapsed(true);
    });

    await expect(sidebarCollapsed).toHaveText('true');

    await page.evaluate(() => {
      window.__appStoreHarness?.setFeatureFlags({ analytics_beta: true, dark_mode_preview: true });
    });

    await expect(featureFlags).toContainText('analytics_beta');
    await expect(featureFlags).toContainText('dark_mode_preview');

    await page.evaluate(() => {
      window.__appStoreHarness?.updateSettings({
        animations: false,
        compactMode: true,
      });
    });

    await expect(animationsSetting).toHaveText('false');

    await page.evaluate(() => {
      window.__appStoreHarness?.openModal('settings-modal', { section: 'preferences' });
      window.__appStoreHarness?.pushModal('confirm-modal');
    });

    await expect(modalStack).toContainText('settings-modal');
    await expect(modalStack).toContainText('confirm-modal');

    await page.evaluate(() => {
      window.__appStoreHarness?.popModal();
    });

    await expect(modalStack).toContainText('settings-modal');
    await expect(modalStack).not.toContainText('confirm-modal');

    await page.evaluate(() => {
      window.__appStoreHarness?.setCurrentRoute('/dashboard');
      window.__appStoreHarness?.setBreadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
      ]);
    });

    await expect(currentRoute).toHaveText('/dashboard');
    await expect(breadcrumbs).toContainText('Home');
    await expect(breadcrumbs).toContainText('Dashboard');

    await page.evaluate(() => {
      window.__appStoreHarness?.resetAppState();
    });

    await expect(theme).toHaveText('system');
    await expect(resolvedTheme).toHaveText('light');
    await expect(sidebarCollapsed).toHaveText('false');
    await expect(featureFlags).not.toContainText('analytics_beta');
    await expect(animationsSetting).toHaveText('true');
    await expect(modalStack).toContainText('No modals on stack.');
    await expect(currentRoute).toHaveText('/');
    await expect(breadcrumbs).toContainText('No breadcrumbs.');
  });
});



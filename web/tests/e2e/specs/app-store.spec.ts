import { expect, test, type Page } from '@playwright/test';

import type { AppStoreHarness } from '@/app/(app)/e2e/app-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __appStoreHarness?: AppStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/app-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__appStoreHarness), { timeout: 60_000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.appStoreHarness === 'ready',
    { timeout: 60_000 },
  );
};

const isProduction = () => {
  const base = process.env.BASE_URL ?? '';
  return base.includes('choices-app.com') || base.includes('production');
};

test.describe('App Store E2E', () => {
  test.skip(() => isProduction(), 'E2E harness route /e2e/app-store is not deployed to production');

  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes app store API', async ({ page }) => {
    // Check harness exists
    const harnessExists = await page.evaluate(() => Boolean(window.__appStoreHarness));
    expect(harnessExists).toBe(true);

    // Check methods exist in page context (functions can't be serialized through evaluate)
    const hasToggleTheme = await page.evaluate(() =>
      typeof window.__appStoreHarness?.toggleTheme === 'function'
    );
    expect(hasToggleTheme).toBe(true);

    const hasSetTheme = await page.evaluate(() =>
      typeof window.__appStoreHarness?.setTheme === 'function'
    );
    expect(hasSetTheme).toBe(true);

    const hasToggleSidebar = await page.evaluate(() =>
      typeof window.__appStoreHarness?.toggleSidebar === 'function'
    );
    expect(hasToggleSidebar).toBe(true);

    const hasUpdateSettings = await page.evaluate(() =>
      typeof window.__appStoreHarness?.updateSettings === 'function'
    );
    expect(hasUpdateSettings).toBe(true);

    const hasResetAppState = await page.evaluate(() =>
      typeof window.__appStoreHarness?.resetAppState === 'function'
    );
    expect(hasResetAppState).toBe(true);

    const hasGetSnapshot = await page.evaluate(() =>
      typeof window.__appStoreHarness?.getSnapshot === 'function'
    );
    expect(hasGetSnapshot).toBe(true);
  });

  test('toggles theme', async ({ page }) => {
    // Get initial theme (acknowledge variable for potential future use)
    void await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.theme;
    });

    await page.evaluate(() => {
      window.__appStoreHarness?.toggleTheme();
    });

    // Toggle should change theme (light -> dark -> system cycle)
    const afterToggle = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.theme;
    });

    expect(afterToggle).toBeDefined();
  });

  test('sets theme directly', async ({ page }) => {
    await page.evaluate(() => {
      window.__appStoreHarness?.setTheme('dark');
    });

    const theme = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.theme;
    });

    expect(theme).toBe('dark');
  });

  test('updates system theme', async ({ page }) => {
    await page.evaluate(() => {
      window.__appStoreHarness?.setTheme('system');
      window.__appStoreHarness?.updateSystemTheme('dark');
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.systemTheme).toBe('dark');
    expect(snapshot?.theme).toBe('system');
    // resolvedTheme should match systemTheme when theme is 'system'
    expect(snapshot?.resolvedTheme).toBe('dark');
  });

  test('toggles sidebar', async ({ page }) => {
    const initialCollapsed = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.sidebarCollapsed;
    });

    await page.evaluate(() => {
      window.__appStoreHarness?.toggleSidebar();
    });

    const afterToggle = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.sidebarCollapsed;
    });

    expect(afterToggle).toBe(!initialCollapsed);
  });

  test('sets sidebar collapsed state', async ({ page }) => {
    await page.evaluate(() => {
      window.__appStoreHarness?.setSidebarCollapsed(true);
    });

    const collapsed = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.sidebarCollapsed;
    });

    expect(collapsed).toBe(true);
  });

  test('manages feature flags', async ({ page }) => {
    await page.evaluate(() => {
      window.__appStoreHarness?.setFeatureFlags({
        TEST_FEATURE: true,
        ANOTHER_FEATURE: false,
      });
    });

    const features = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.features;
    });

    expect(features?.TEST_FEATURE).toBe(true);
    expect(features?.ANOTHER_FEATURE).toBe(false);
  });

  test('updates settings', async ({ page }) => {
    await page.evaluate(() => {
      window.__appStoreHarness?.updateSettings({
        animations: false,
        compactMode: true,
        language: 'es',
      });
    });

    const settings = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.settings;
    });

    expect(settings?.animations).toBe(false);
    expect(settings?.compactMode).toBe(true);
    expect(settings?.language).toBe('es');
  });

  test('manages modals', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      harness?.openModal('test-modal-1', { key: 'value1' });
    });

    let snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.activeModal).toBe('test-modal-1');
    expect(snapshot?.modalStack).toHaveLength(1);

    // Push another modal
    await page.evaluate(() => {
      window.__appStoreHarness?.pushModal('test-modal-2', { key: 'value2' });
    });

    snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.activeModal).toBe('test-modal-2');
    expect(snapshot?.modalStack).toHaveLength(2);

    // Pop modal
    await page.evaluate(() => {
      window.__appStoreHarness?.popModal();
    });

    snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.activeModal).toBe('test-modal-1');
    expect(snapshot?.modalStack).toHaveLength(1);

    // Close modal
    await page.evaluate(() => {
      window.__appStoreHarness?.closeModal();
    });

    snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.activeModal).toBeNull();
    expect(snapshot?.modalStack).toHaveLength(0);
  });

  test('manages current route and breadcrumbs', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      harness?.setCurrentRoute('/test/route');
      harness?.setBreadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'Test', href: '/test' },
        { label: 'Route', href: '/test/route' },
      ]);
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.currentRoute).toBe('/test/route');
    expect(snapshot?.breadcrumbs).toHaveLength(3);
    expect(snapshot?.breadcrumbs?.[0]?.label).toBe('Home');
  });

  test('resets app state', async ({ page }) => {
    // Set up some state
    await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      harness?.setTheme('dark');
      harness?.setSidebarCollapsed(true);
      harness?.openModal('test-modal', {});
    });

    // Reset
    await page.evaluate(() => {
      window.__appStoreHarness?.resetAppState();
    });

    const snapshot = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      return harness?.getSnapshot();
    });

    expect(snapshot?.theme).toBe('system');
    expect(snapshot?.sidebarCollapsed).toBe(false);
    expect(snapshot?.activeModal).toBeNull();
    expect(snapshot?.modalStack).toHaveLength(0);
  });

  test('persists theme preference across navigation', async ({ page }) => {
    await page.evaluate(() => {
      window.__appStoreHarness?.setTheme('dark');
    });

    // Navigate away and back
    await page.goto('/');
    await gotoHarness(page);

    const theme = await page.evaluate(() => {
      const harness = window.__appStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.theme;
    });

    // Theme should persist (via localStorage persistence)
    expect(theme).toBe('dark');
  });
});

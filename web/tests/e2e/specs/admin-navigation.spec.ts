import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

 
declare global {
  interface Window {
    __navigationShellHarness?: {
      setRoute: (route: string, label: string) => void;
      setAdminSection: (section: string) => void;
    };
  }
}
 

const gotoNavigationShellHarness = async (page: Page) => {
  await page.goto('/e2e/navigation-shell', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await waitForPageReady(page, 90_000);
  await expect(page.getByTestId('navigation-shell-harness')).toBeVisible({ timeout: 90_000 });
  await page.waitForFunction(() => typeof window.__navigationShellHarness !== 'undefined', undefined, {
    timeout: 90_000,
  });
};

const ADMIN_NAVIGATION_STATES = [
  { route: '/admin', breadcrumbLabel: 'Dashboard', sidebarSection: 'admin-dashboard', sidebarText: /Dashboard/i },
  { route: '/admin/users', breadcrumbLabel: 'Users', sidebarSection: 'admin-users', sidebarText: /Users/i },
  { route: '/admin/analytics', breadcrumbLabel: 'Analytics', sidebarSection: 'admin-analytics', sidebarText: /Analytics/i },
  { route: '/admin/feature-flags', breadcrumbLabel: 'Feature Flags', sidebarSection: 'admin-feature-flags', sidebarText: /Feature Flags/i },
  { route: '/admin/system', breadcrumbLabel: 'System', sidebarSection: 'admin-system', sidebarText: /System/i },
];

const expectSidebarHighlight = async (page: Page, tabMatcher: RegExp) => {
  const activeNavItem = page
    .locator('nav[aria-label="Admin navigation"]')
    .locator('a[aria-current="page"]');
  await expect(activeNavItem).toContainText(tabMatcher);
};

const expectBreadcrumbMatches = async (page: Page, matcher: string) => {
  await page.waitForFunction(
    (expected) => {
      return Array.from(
        document.querySelectorAll<HTMLLIElement>('[data-testid="breadcrumbs"] li'),
      ).some((item) => item.textContent?.includes(expected));
    },
    matcher,
    { timeout: 60_000 },
  );
};

const setNavigationShellState = async (
  page: Page,
  state: { route: string; breadcrumbLabel: string; sidebarSection: string },
) => {
  await page.evaluate(
    ([route, label, section]) => {
      window.__navigationShellHarness?.setRoute(route, label);
      window.__navigationShellHarness?.setAdminSection(section);
    },
    [state.route, state.breadcrumbLabel, state.sidebarSection],
  );

  await page.waitForFunction(
    (expectedRoute) => {
      const currentRoute = document.querySelector<HTMLElement>('[data-testid="current-route"]');
      return currentRoute?.textContent?.includes(expectedRoute) ?? false;
    },
    state.route,
    { timeout: 60_000 },
  );
};

test.describe('@axe Admin navigation accessibility and routing', () => {
  test.beforeEach(async ({ page }) => {
    await gotoNavigationShellHarness(page);
  });

  test('sidebar and header landmarks pass axe', async ({ page }) => {
    await runAxeAudit(page, 'admin layout desktop', {
      include: ['nav[aria-label="Admin navigation"]', 'header[role="banner"]'],
    });

    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: /Admin navigation/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Notifications/ })).toHaveAttribute(
      'aria-haspopup',
      'true',
    );
  });

  test('sidebar toggle manages focus on mobile and passes axe', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoNavigationShellHarness(page);

    const toggle = page.getByRole('button', { name: /Toggle sidebar navigation/i });
    await toggle.waitFor({ timeout: 60_000 });
    await expect(toggle).toHaveAttribute('aria-controls', 'admin-sidebar-navigation');
    await expect(toggle).toHaveAttribute('aria-expanded');
    await runAxeAudit(page, 'admin navigation mobile', {
      include: ['nav[aria-label="Admin navigation"]'],
    });
  });

  test('selector-based navigation updates breadcrumbs and highlights', async ({ page }) => {
    for (const state of ADMIN_NAVIGATION_STATES) {
      await setNavigationShellState(page, state);
      await expectBreadcrumbMatches(page, state.breadcrumbLabel);
      await expectSidebarHighlight(page, state.sidebarText);
    }
  });
});


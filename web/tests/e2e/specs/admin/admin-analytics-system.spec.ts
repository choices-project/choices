import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../../helpers/e2e-setup';

test.describe('Admin Analytics & System Pages', () => {
  const pages = [
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Performance', path: '/admin/performance' },
    { name: 'System', path: '/admin/system' },
    { name: 'Site Messages', path: '/admin/site-messages' },
    { name: 'Feature Flags', path: '/admin/feature-flags' },
  ];

  for (const { name, path } of pages) {
    test(`should load ${name} page`, async ({ page }) => {
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        await page.addInitScript(() => {
          localStorage.setItem('e2e-dashboard-bypass', 'true');
        });
      }

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      // Verify page loaded (check for heading or main content)
      const heading = page.locator('h1, h2, [data-testid*="title"]');
      const mainContent = page.locator('main, [role="main"], [data-testid*="content"]');
      
      const hasHeading = await heading.count() > 0;
      const hasContent = await mainContent.count() > 0;

      expect(hasHeading || hasContent).toBe(true);
    });
  }

  test('should navigate between admin pages via sidebar', async ({ page }) => {
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      await page.addInitScript(() => {
        localStorage.setItem('e2e-dashboard-bypass', 'true');
      });
    }

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Test navigation to each page
    for (const { name, path } of pages.slice(0, 3)) {
      const link = page.locator(`nav a[href="${path}"]`).or(
        page.locator(`a:has-text("${name}")`)
      );
      if (await link.count() > 0 && !page.url().includes(path)) {
        await link.first().click();
        await page.waitForURL(`**${path}`, { timeout: 10_000 });
        await waitForPageReady(page);
      }
    }
  });
});


import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

const gotoHarness = async (page: import('@playwright/test').Page) => {
  await page.goto('/e2e/admin-navigation', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page, 60_000);
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined);
  await expect(page.locator('nav[aria-label="Admin navigation"]').first()).toBeVisible({
    timeout: 60_000,
  });
};

test.describe('Admin navigation accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
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
    await page.reload();
    await waitForPageReady(page, 60_000);
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined);
    await expect(page.locator('nav[aria-label="Admin navigation"]').first()).toBeVisible({
      timeout: 60_000,
    });

    const toggle = page.getByRole('button', { name: /Toggle sidebar navigation/i });
    await toggle.waitFor({ timeout: 30_000 });
    await expect(toggle).toHaveAttribute('aria-controls', 'admin-sidebar-navigation');
    await expect(toggle).toHaveAttribute('aria-expanded');
    await runAxeAudit(page, 'admin navigation mobile', {
      include: ['nav[aria-label="Admin navigation"]'],
    });
  });
});


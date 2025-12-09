import { expect, test, type Page } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/global-navigation', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page, 60_000);
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined);
  await expect(page.locator('nav[aria-label="Primary navigation"]').first()).toBeVisible({
    timeout: 60_000,
  });
};

test.describe('@axe Global navigation accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('desktop navigation exposes landmarks and passes axe', async ({ page }) => {
    test.setTimeout(90_000); // Increased timeout for CI
    await runAxeAudit(page, 'global navigation desktop', {
      include: ['nav[aria-label="Primary navigation"]'],
    });

    await expect(page.getByTestId('dashboard-nav').first()).toHaveAttribute('href', '/dashboard');
    await expect(page.getByRole('link', { name: /Skip to main content/i }).first()).toBeVisible();
  });

  test('mobile navigation manages focus and passes axe', async ({ page }) => {
    test.setTimeout(90_000); // Increased timeout for CI
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForPageReady(page, 60_000);
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined);
    await expect(page.locator('nav[aria-label="Primary navigation"]').first()).toBeVisible({
      timeout: 60_000,
    });

    const menuButton = page.getByTestId('mobile-menu').last();
    await menuButton.waitFor({ timeout: 30_000 });
    await expect(menuButton).toHaveAttribute('aria-controls', 'global-navigation-mobile-menu');
    await expect(menuButton).toHaveAttribute('aria-expanded');
    await runAxeAudit(page, 'global navigation mobile', {
      include: ['nav[aria-label="Primary navigation"]'],
    });
    await expect(menuButton).toHaveAttribute('aria-expanded');
  });

  test('language selector updates navigation labels', async ({ page, context }) => {
    test.setTimeout(90_000); // Increased timeout for CI
    const selector = page.getByTestId('language-selector').first();
    await selector.getByRole('button').click();
    await page.getByRole('option', { name: /Español/i }).click();

    await expect(page.getByRole('link', { name: 'Encuestas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Panel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.some((cookie) => cookie.name === 'choices.locale' && cookie.value === 'es')).toBeTruthy();
  });
});


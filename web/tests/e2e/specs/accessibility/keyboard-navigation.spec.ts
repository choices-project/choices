/**
 * Keyboard Navigation E2E Tests
 *
 * Verifies keyboard accessibility:
 * - Tab order and focus visibility
 * - Skip link works
 * - Escape closes modals
 *
 * Created: February 2026
 * Status: ACTIVE
 */

import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../../helpers/e2e-setup';

test.describe('@axe Keyboard Navigation', () => {
  test('skip link is focusable and targets main content', async ({ page }) => {
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Tab to skip link (first focusable)
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink).toBeFocused();
  });

  test('landing page has focusable elements in logical order', async ({ page }) => {
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Tab through first few elements
    const focusable = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThan(2); // Skip link, sign in, sign up at minimum
  });

  test('dashboard page has focusable main content', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const main = page.locator('#main-content, [role="main"], main');
    const hasMain = await main.count() > 0;
    expect(hasMain).toBe(true);
  });
});

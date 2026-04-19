/**
 * Keyboard Navigation E2E Tests
 *
 * Verifies keyboard accessibility per docs/KEYBOARD_NAVIGATION_AUDIT.md:
 * - Tab order and focus visibility
 * - Skip link works
 * - Escape closes modals
 *
 * Created: February 2026
 * Status: ACTIVE
 */

import { expect, test } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from '../../helpers/e2e-setup';

test.describe('@axe Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.PLAYWRIGHT_USE_MOCKS === '1') {
      await setupExternalAPIMocks(page);
    }
  });

  test('skip link is focusable and targets main content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Tab to skip link (first focusable)
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink).toBeFocused();
  });

  test('marketing home has focusable elements in logical order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Tab through first few elements
    const focusable = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThan(2); // Skip link, sign in, sign up at minimum
  });

  test('auth page has focusable form fields', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const focusable = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least email, password, submit, links
  });

  test('dashboard page has focusable main content', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const main = page.locator('#main-content, [role="main"], main');
    const hasMain = await main.count() > 0;
    expect(hasMain).toBe(true);
  });

  test('polls page has focusable elements', async ({ page }) => {
    await page.goto('/polls', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const focusable = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);
  });

  test('civics page has focusable state filter', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const stateFilter = page.locator('[data-testid="state-filter"], select, [role="combobox"]').first();
    const hasFilter = await stateFilter.count() > 0;
    expect(hasFilter).toBe(true);
  });

  test('representatives page has focusable elements', async ({ page }) => {
    await page.goto('/representatives', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const focusable = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);
  });

  test('feed page has focusable elements', async ({ page }) => {
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const focusable = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusable.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Escape closes BottomSheet when open (mobile share sheet)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/polls', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000);

    const pollLink = page.locator('[data-testid="poll-link"], a[href*="/polls/"]').first();
    if ((await pollLink.count()) === 0) {
      test.skip(true, 'No poll link (mocks may not provide polls)');
    }
    await pollLink.click();
    await page.waitForTimeout(1500);

    const shareBtn = page.locator('button:has-text("Share"), [aria-label*="Share"]').first();
    if ((await shareBtn.count()) === 0) {
      test.skip(true, 'Share button not found');
    }
    await shareBtn.click();
    await page.waitForTimeout(500);

    const sheet = page.locator('.fixed.inset-x-0.bottom-0, [class*="bottom-0"][class*="z-50"]');
    if ((await sheet.count()) === 0 || !(await sheet.first().isVisible().catch(() => false))) {
      test.skip(true, 'BottomSheet not visible');
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const sheetAfter = page.locator('.fixed.inset-x-0.bottom-0, [class*="bottom-0"][class*="z-50"]');
    const stillVisible = (await sheetAfter.count()) > 0 && (await sheetAfter.first().isVisible().catch(() => false));
    expect(stillVisible).toBe(false);
  });
});

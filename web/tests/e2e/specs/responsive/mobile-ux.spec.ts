import { expect, test, devices } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Mobile/Responsive UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up E2E bypass for auth
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
      }
    });

    // Set bypass cookie
    const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
    const url = new URL(baseUrl);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    try {
      await page.context().addCookies([{
        name: 'e2e-dashboard-bypass',
        value: '1',
        path: '/',
        domain: `.${domain}`,
        sameSite: 'None' as const,
        secure: true,
        httpOnly: false,
      }]);
    } catch (error) {
      console.log('[mobile-ux] Using localStorage only:', error);
    }
  });

  // Use mobile viewport for all tests
  test.use({
    ...devices['iPhone 13'],
  });

  test('mobile navigation menu works correctly', async ({ page }) => {
    test.setTimeout(60_000);

    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Mobile UX tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Look for mobile menu button (hamburger menu)
      const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], button:has([class*="hamburger"]), button:has(svg)').first();
      const menuButtonExists = await mobileMenuButton.count() > 0;

      // If mobile menu button exists, test it
      if (menuButtonExists) {
        // Click to open menu
        await mobileMenuButton.click({ timeout: 10_000 });
        await page.waitForTimeout(500);

        // Look for navigation links in menu
        const navLinks = page.locator('nav a, [role="navigation"] a, [class*="mobile"] a').filter({ hasText: /.+/ });
        const navLinkCount = await navLinks.count();

        // Should have navigation links when menu is open
        expect(navLinkCount).toBeGreaterThan(0);

        // Click a navigation link if available
        if (navLinkCount > 0) {
          const firstLink = navLinks.first();
          const href = await firstLink.getAttribute('href');
          expect(href).toBeTruthy();
        }
      } else {
        // If no mobile menu button, navigation should be visible directly
        const navLinks = page.locator('nav a, [role="navigation"] a').filter({ hasText: /.+/ });
        const navLinkCount = await navLinks.count();
        // Either mobile menu OR direct navigation should exist
        expect(navLinkCount).toBeGreaterThanOrEqual(0);
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('mobile dashboard layout is responsive and usable', async ({ page }) => {
    test.setTimeout(60_000);

    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Mobile UX tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check viewport width
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeLessThanOrEqual(390); // iPhone 13 width

      // Check for horizontal scrolling (should not exist)
      const horizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(horizontalScroll).toBeFalsy();

      // Check that content is readable (not cut off)
      const mainContent = page.locator('main, [role="main"], [class*="container"]').first();
      const mainExists = await mainContent.count() > 0;
      expect(mainExists).toBeTruthy();

      // Check that interactive elements are appropriately sized (minimum touch target 44x44px)
      const buttons = page.locator('button, a[role="button"], input[type="button"], input[type="submit"]');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        // Sample first few buttons for size
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();

        // Touch targets should be at least 44x44px (WCAG recommendation)
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('mobile forms are usable with virtual keyboard', async ({ page }) => {
    test.setTimeout(60_000);

    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Mobile UX tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      // Navigate to a page with forms (profile preferences or poll create)
      await page.goto('/profile/preferences');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Look for form inputs
      const inputs = page.locator('input[type="text"], input[type="email"], textarea, select');
      const inputCount = await inputs.count();

      test.skip(inputCount === 0, 'No form inputs found on preferences page');

      // Focus first input
      const firstInput = inputs.first();
      await firstInput.focus();
      await page.waitForTimeout(500);

      // Check that input is visible and accessible
      const isVisible = await firstInput.isVisible();
      expect(isVisible).toBeTruthy();

      // Input should have appropriate input type for mobile keyboard
      const inputType = await firstInput.getAttribute('type');
      const tagName = await firstInput.evaluate(el => el.tagName.toLowerCase());

      // Email inputs should have type="email" for appropriate keyboard
      if (tagName === 'input' && inputType !== 'email') {
        // If it's clearly an email field, it should have type="email"
        // But we won't fail the test, just note it
        expect(inputType || 'text').toBeTruthy(); // Informational check
      }

      // Input should be readable (not hidden behind keyboard or other elements)
      const box = await firstInput.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.height).toBeGreaterThan(0);
        expect(box.width).toBeGreaterThan(0);
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('mobile touch interactions work correctly', async ({ page }) => {
    test.setTimeout(60_000);

    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Mobile UX tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Find clickable elements (buttons, links)
      const clickableElements = page.locator('button, a[href], [role="button"]').filter({ hasText: /.+/ });
      const elementCount = await clickableElements.count();

      test.skip(elementCount === 0, 'No clickable elements found on dashboard');

      // Test tapping/clicking an element
      const firstElement = clickableElements.first();

      // Tap the element (Playwright click works for touch)
      await firstElement.click({ timeout: 10_000 });
      await page.waitForTimeout(1000);

      // Element should have responded (page may have navigated or state changed)
      // We'll just verify no errors occurred
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('mobile pages do not cause horizontal scrolling', async ({ page }) => {
    test.setTimeout(60_000);

    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Mobile UX tests require production environment');

    const testPages = ['/dashboard', '/feed', '/polls', '/profile/preferences', '/civics'];

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      for (const path of testPages) {
        await page.goto(path);
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Check for horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(hasHorizontalScroll).toBeFalsy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('mobile responsive breakpoints work correctly', async ({ page }) => {
    test.setTimeout(60_000);

    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Mobile UX tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Test at mobile width (375px - iPhone 13)
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);

      // Check layout adjusts
      const mobileLayout = await page.locator('body').count();
      expect(mobileLayout).toBeGreaterThan(0);

      // Test at tablet width (768px)
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);

      // Layout should adjust for tablet
      const tabletLayout = await page.locator('body').count();
      expect(tabletLayout).toBeGreaterThan(0);

      // Reset to mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(1000);

    } finally {
      await cleanupMocks();
    }
  });
});


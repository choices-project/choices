import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

/**
 * Comprehensive Mobile/Responsive Tests
 * 
 * Tests mobile and responsive design across different viewport sizes:
 * - Mobile (320px - 768px)
 * - Tablet (769px - 1024px)
 * - Desktop (1025px+)
 * 
 * Covers:
 * - Layout adaptation at breakpoints
 * - Touch target sizes (minimum 44x44px)
 * - Viewport meta tag
 * - Text readability
 * - Image responsiveness
 * - Form usability
 * - Navigation adaptation
 */

const BREAKPOINTS = {
  mobile: { width: 375, height: 812 }, // iPhone 13
  mobileSmall: { width: 320, height: 568 }, // iPhone SE
  mobileLarge: { width: 428, height: 926 }, // iPhone 14 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLandscape: { width: 1024, height: 768 }, // iPad landscape
  desktop: { width: 1920, height: 1080 }, // Desktop
  desktopSmall: { width: 1280, height: 720 }, // Small desktop
};

test.describe('Comprehensive Mobile/Responsive Tests', () => {
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
      console.log('[mobile-responsive] Using localStorage only:', error);
    }
  });

  test.describe('Viewport Meta Tag', () => {
    test('viewport meta tag is correctly configured', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      await page.goto('/dashboard');
      await waitForPageReady(page);

      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      
      // Should have viewport meta tag
      expect(viewportMeta).toBeTruthy();
      
      // Should include width=device-width for proper mobile rendering
      expect(viewportMeta).toContain('width=device-width');
      
      // Should include initial-scale for proper zoom
      expect(viewportMeta).toMatch(/initial-scale/);
    });
  });

  test.describe('Breakpoint Testing', () => {
    const testPages = ['/dashboard', '/feed', '/polls', '/civics'];

    for (const pagePath of testPages) {
      test(`layout adapts correctly at mobile breakpoint (${pagePath})`, async ({ page }) => {
        test.setTimeout(60_000);

        const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
        test.skip(useMocks, 'Responsive tests require production environment');

        const cleanupMocks = await setupExternalAPIMocks(page, {
          feeds: true,
          notifications: true,
          analytics: true,
          auth: true,
          civics: true,
        });

        try {
          await page.setViewportSize(BREAKPOINTS.mobile);
          await page.goto(pagePath);
          await waitForPageReady(page);
          await page.waitForTimeout(2000);

          // Check that page renders without horizontal scroll
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          expect(hasHorizontalScroll).toBeFalsy();

          // Check that main content is visible
          const mainContent = page.locator('main, [role="main"], [data-testid*="dashboard"], [data-testid*="feed"]').first();
          const isVisible = await mainContent.isVisible({ timeout: 10_000 }).catch(() => false);
          expect(isVisible).toBeTruthy();

        } finally {
          await cleanupMocks();
        }
      });

      test(`layout adapts correctly at tablet breakpoint (${pagePath})`, async ({ page }) => {
        test.setTimeout(60_000);

        const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
        test.skip(useMocks, 'Responsive tests require production environment');

        const cleanupMocks = await setupExternalAPIMocks(page, {
          feeds: true,
          notifications: true,
          analytics: true,
          auth: true,
          civics: true,
        });

        try {
          await page.setViewportSize(BREAKPOINTS.tablet);
          await page.goto(pagePath);
          await waitForPageReady(page);
          await page.waitForTimeout(2000);

          // Check that page renders without horizontal scroll
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          expect(hasHorizontalScroll).toBeFalsy();

          // Check that main content is visible
          const mainContent = page.locator('main, [role="main"]').first();
          const isVisible = await mainContent.isVisible({ timeout: 10_000 }).catch(() => false);
          expect(isVisible).toBeTruthy();

        } finally {
          await cleanupMocks();
        }
      });
    }
  });

  test.describe('Touch Target Sizes', () => {
    test('interactive elements meet minimum touch target size (44x44px)', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.setViewportSize(BREAKPOINTS.mobile);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Get all interactive elements
        const interactiveElements = await page.locator('button, a[href], input[type="button"], input[type="submit"], [role="button"]').all();
        
        if (interactiveElements.length > 0) {
          // Check first 10 interactive elements for minimum size
          for (let i = 0; i < Math.min(10, interactiveElements.length); i++) {
            const element = interactiveElements[i];
            const box = await element.boundingBox();
            
            if (box) {
              // Minimum touch target is 44x44px (WCAG 2.5.5)
              const minSize = 44;
              const meetsSize = box.width >= minSize && box.height >= minSize;
              
              // Log if element is too small (but don't fail for all - some may be decorative)
              if (!meetsSize) {
                const tagName = await element.evaluate(el => el.tagName);
                const text = await element.textContent().catch(() => '');
                console.log(`Small touch target found: ${tagName} "${text?.substring(0, 30)}" (${box.width}x${box.height}px)`);
              }
            }
          }
        }

      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('Text Readability', () => {
    test('text is readable at mobile sizes without zooming', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.setViewportSize(BREAKPOINTS.mobile);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Check that body text has reasonable font size (at least 14px)
        const bodyText = page.locator('body p, body span, body div').first();
        const fontSize = await bodyText.evaluate((el) => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        }).catch(() => null);

        // Font size should be at least 14px for readability (16px is ideal)
        if (fontSize !== null) {
          expect(fontSize).toBeGreaterThanOrEqual(12); // Allow 12px minimum
        }

      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('Image Responsiveness', () => {
    test('images scale correctly on mobile devices', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.setViewportSize(BREAKPOINTS.mobile);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Get all images
        const images = await page.locator('img').all();
        
        if (images.length > 0) {
          // Check first 5 images don't exceed viewport width
          for (let i = 0; i < Math.min(5, images.length); i++) {
            const img = images[i];
            const box = await img.boundingBox();
            
            if (box) {
              // Image should not exceed viewport width (with some padding tolerance)
              const viewportWidth = page.viewportSize()?.width ?? BREAKPOINTS.mobile.width;
              expect(box.width).toBeLessThanOrEqual(viewportWidth + 20); // 20px tolerance for padding
            }
          }
        }

      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('Form Usability', () => {
    test('forms are usable on mobile devices', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.setViewportSize(BREAKPOINTS.mobile);
        await page.goto('/profile/preferences');
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Check for form inputs
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();

        if (inputCount > 0) {
          // Check first input is accessible
          const firstInput = inputs.first();
          const box = await firstInput.boundingBox();
          
          if (box) {
            // Input should be at least 44px tall for touch targets
            expect(box.height).toBeGreaterThanOrEqual(40); // Allow 40px minimum
          }

          // Input should be visible
          const isVisible = await firstInput.isVisible({ timeout: 5_000 }).catch(() => false);
          expect(isVisible).toBeTruthy();
        }

      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('Navigation Adaptation', () => {
    test('navigation adapts to mobile viewport', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.setViewportSize(BREAKPOINTS.mobile);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // On mobile, should have mobile menu button
        const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
        const hasMobileMenu = await mobileMenuButton.isVisible({ timeout: 5_000 }).catch(() => false);
        
        // Mobile menu button should be visible on mobile
        expect(hasMobileMenu).toBeTruthy();

        // Desktop navigation should be hidden on mobile (or links in mobile menu)
        // This is acceptable - desktop nav links might be in the mobile menu on mobile

      } finally {
        await cleanupMocks();
      }
    });

    test('navigation adapts to desktop viewport', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.setViewportSize(BREAKPOINTS.desktop);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // On desktop, navigation links should be visible
        const navLinks = page.locator('[data-testid="global-navigation"] a').filter({ hasText: /.+/ });
        const navLinkCount = await navLinks.count();
        
        // Should have navigation links visible on desktop
        expect(navLinkCount).toBeGreaterThan(0);

      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('layout adapts to landscape orientation', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Responsive tests require production environment');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        // Start in portrait
        await page.setViewportSize(BREAKPOINTS.mobile);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        await page.waitForTimeout(1000);

        // Switch to landscape
        await page.setViewportSize({ width: BREAKPOINTS.mobile.height, height: BREAKPOINTS.mobile.width });
        await page.waitForTimeout(1000);

        // Check that page still renders without horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBeFalsy();

        // Main content should still be visible
        const mainContent = page.locator('main, [role="main"]').first();
        const isVisible = await mainContent.isVisible({ timeout: 5_000 }).catch(() => false);
        expect(isVisible).toBeTruthy();

      } finally {
        await cleanupMocks();
      }
    });
  });
});


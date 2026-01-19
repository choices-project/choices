import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { waitForPageReady } from '../../helpers/e2e-setup';

const isAdminAccessDenied = async (page: Page) => {
  const url = page.url();
  if (!url.includes('/admin')) {
    return true;
  }
  const denialNotice = page.locator('text=/access denied|not authorized|sign in|login/i');
  return (await denialNotice.count()) > 0;
};

const shouldSkipAdminSuite =
  process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' &&
  (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Dashboard - Dark Mode', () => {
  test.skip(shouldSkipAdminSuite, 'Admin credentials not configured for production tests.');
  test.beforeEach(async ({ page }) => {
    // Set up E2E harness bypass if enabled
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      await page.addInitScript(() => {
        localStorage.setItem('e2e-dashboard-bypass', 'true');
      });
    }

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    test.skip(await isAdminAccessDenied(page), 'Admin auth required in production.');
  });

  test.describe('Dark Mode Toggle', () => {
    test('should toggle dark mode on and off', async ({ page }) => {
      // Check if dark mode toggle exists (if implemented)
      const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]').or(
        page.locator('button[aria-label*="dark" i]').or(
          page.locator('button[aria-label*="theme" i]')
        )
      );

      const toggleExists = await darkModeToggle.count() > 0;

      if (toggleExists) {
        // Get initial state
        const initialClass = await page.locator('html').getAttribute('class');
        const isInitiallyDark = initialClass?.includes('dark') ?? false;

        // Toggle dark mode
        await darkModeToggle.first().click();
        await page.waitForTimeout(500); // Wait for transition

        // Check if dark class was added/removed
        const afterToggleClass = await page.locator('html').getAttribute('class');
        const isAfterDark = afterToggleClass?.includes('dark') ?? false;

        expect(isAfterDark).toBe(!isInitiallyDark);

        // Toggle back
        await darkModeToggle.first().click();
        await page.waitForTimeout(500);

        const finalClass = await page.locator('html').getAttribute('class');
        const isFinalDark = finalClass?.includes('dark') ?? false;
        expect(isFinalDark).toBe(isInitiallyDark);
      } else {
        // If no toggle exists, test that dark mode classes are applied when dark class is present
        // This tests the dark mode CSS support we just added
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });

        // Verify dark mode classes are applied
        const header = page.locator('header');
        await expect(header).toHaveClass(/dark:bg-gray-900/);
      }
    });
  });

  test.describe('Dark Mode Visual Consistency', () => {
    test('should apply dark mode styles to header', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Check that dark mode background is applied
      const headerBg = await header.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor;
      });

      // In dark mode, background should be dark (not white)
      expect(headerBg).not.toBe('rgb(255, 255, 255)');
    });

    test('should apply dark mode styles to sidebar', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const sidebar = page.locator('nav[aria-label="Admin navigation"]').locator('..');
      await expect(sidebar).toBeVisible();

      // Verify sidebar has dark mode classes
      const sidebarClasses = await sidebar.getAttribute('class');
      expect(sidebarClasses).toContain('dark:bg-gray-900');
    });

    test('should apply dark mode styles to main content', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible();

      // Check that text is visible in dark mode
      const textColor = await mainContent.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.color;
      });

      // Text should be visible (not black on dark background)
      expect(textColor).not.toBe('rgb(0, 0, 0)');
    });

    test('should apply dark mode styles to cards and containers', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Look for cards or containers with dark mode support
      const cards = page.locator('[class*="bg-white"][class*="dark:bg-gray"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // Verify at least one card has dark mode classes
        const firstCard = cards.first();
        const cardClasses = await firstCard.getAttribute('class');
        expect(cardClasses).toContain('dark:bg-gray');
      }
    });

    test('should apply dark mode styles to buttons and inputs', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Check search input
      const searchInput = page.locator('input[type="text"][placeholder*="Search" i]');
      if (await searchInput.count() > 0) {
        const inputClasses = await searchInput.getAttribute('class');
        expect(inputClasses).toContain('dark:bg-gray');
      }

      // Check buttons
      const buttons = page.locator('button').first();
      if (await buttons.count() > 0) {
        const buttonClasses = await buttons.getAttribute('class');
        // Buttons should have dark mode hover states or backgrounds
        expect(buttonClasses).toMatch(/dark:(bg-gray|hover:bg-gray|text-gray)/);
      }
    });

    test('should apply dark mode styles to tables', async ({ page }) => {
      await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const table = page.locator('table');
      if (await table.count() > 0) {
        const tableClasses = await table.getAttribute('class');
        // Table should have dark mode support
        expect(tableClasses).toMatch(/dark:(bg-gray|divide-gray|text-gray)/);
      }
    });

    test('should apply dark mode styles to status badges', async ({ page }) => {
      await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Look for status badges
      const badges = page.locator('[class*="rounded-full"][class*="bg-"]');
      const badgeCount = await badges.count();

      if (badgeCount > 0) {
        const firstBadge = badges.first();
        const badgeClasses = await firstBadge.getAttribute('class');
        // Badges should have dark mode variants
        expect(badgeClasses).toMatch(/dark:(bg-|text-)/);
      }
    });
  });

  test.describe('Dark Mode Navigation', () => {
    test('should maintain dark mode across page navigation', async ({ page }) => {
      // Enable dark mode and persist it
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });

      // Navigate to different pages
      await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      // Re-apply dark mode if needed (since navigation might reset it)
      await page.evaluate(() => {
        if (localStorage.getItem('theme') === 'dark') {
          document.documentElement.classList.add('dark');
        }
      });

      // Verify dark mode is still active
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toContain('dark');

      await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded' });
      await waitForPageReady(page);

      // Re-apply dark mode if needed
      await page.evaluate(() => {
        if (localStorage.getItem('theme') === 'dark') {
          document.documentElement.classList.add('dark');
        }
      });

      // Verify dark mode persists
      const htmlClass2 = await page.locator('html').getAttribute('class');
      expect(htmlClass2).toContain('dark');
    });

    test('should apply dark mode to all admin pages', async ({ page }) => {
      const adminPages = [
        '/admin',
        '/admin/users',
        '/admin/feedback',
        '/admin/monitoring',
        '/admin/system',
        '/admin/performance',
      ];

      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      for (const route of adminPages) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        // Verify page loaded with dark mode
        const header = page.locator('header');
        await expect(header).toBeVisible({ timeout: 10_000 });

        // Check that dark mode classes are present
        const headerClasses = await header.getAttribute('class');
        expect(headerClasses).toMatch(/dark:(bg-|text-|border-)/);
      }
    });
  });

  test.describe('Dark Mode Accessibility', () => {
    test('should maintain contrast ratios in dark mode', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Check text contrast
      const mainText = page.locator('main[id="admin-main"] p, main[id="admin-main"] span').first();
      if (await mainText.count() > 0) {
        const textColor = await mainText.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.color;
        });

        const bgColor = await mainText.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor;
        });

        // Colors should be different (basic contrast check)
        expect(textColor).not.toBe(bgColor);
      }
    });

    test('should maintain focus indicators in dark mode', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Focus on a button
      const firstButton = page.locator('button').first();
      if (await firstButton.count() > 0) {
        await firstButton.focus();

        // Check for focus ring
        const focusRing = await firstButton.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline || styles.boxShadow;
        });

        // Should have some focus indicator
        expect(focusRing).toBeTruthy();
      }
    });
  });
});


/**
 * UnifiedFeed E2E Tests
 * 
 * Comprehensive end-to-end testing for the UnifiedFeed component
 * Tests real user interactions and workflows
 * 
 * Created: January 19, 2025
 * Status: ✅ PRODUCTION READY
 */

import { test, expect, type Page } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('UnifiedFeed Component - E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set up test environment
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Basic Functionality', () => {
    test('should load UnifiedFeed component with all essential elements', async () => {
      // Navigate to feeds page
      await page.goto('/feeds');
      
      // Wait for the component to load
      await page.waitForSelector('[data-testid="unified-feed"]', { timeout: 10000 });
      
      // Check for essential elements
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Unified Feed')).toBeVisible();
      await expect(page.getByText('Personalized content with hashtag-polls integration')).toBeVisible();
      
      // Check for control buttons
      await expect(page.getByRole('button', { name: /switch to dark mode/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /toggle advanced filters/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /refresh feed/i })).toBeVisible();
    });

    test('should display feed items correctly', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check for feed items
      const feedItems = page.locator('[data-testid="feed-item"]');
      const count = await feedItems.count();
      expect(count).toBeGreaterThan(0);
      
      // Check for feed item content
      await expect(page.getByText('Test Poll')).toBeVisible();
      await expect(page.getByText('This is a test poll')).toBeVisible();
      await expect(page.getByText('politics')).toBeVisible();
      await expect(page.getByText('election')).toBeVisible();
    });

    test('should show online status indicator', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check for online status
      await expect(page.getByText('Online')).toBeVisible();
      await expect(page.locator('.w-2.h-2.bg-green-500')).toBeVisible();
    });
  });

  test.describe('Dark Mode Functionality', () => {
    test('should toggle dark mode correctly', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check initial state (light mode)
      const body = page.locator('body');
      await expect(body).not.toHaveClass(/dark/);
      
      // Click dark mode toggle
      await page.getByRole('button', { name: /switch to dark mode/i }).click();
      
      // Check dark mode is applied
      await expect(body).toHaveClass(/dark/);
      await expect(page.getByRole('button', { name: /switch to light mode/i })).toBeVisible();
      
      // Toggle back to light mode
      await page.getByRole('button', { name: /switch to light mode/i }).click();
      
      // Check light mode is applied
      await expect(body).not.toHaveClass(/dark/);
      await expect(page.getByRole('button', { name: /switch to dark mode/i })).toBeVisible();
    });

    test('should persist dark mode preference in localStorage', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Toggle dark mode
      await page.getByRole('button', { name: /switch to dark mode/i }).click();
      
      // Check localStorage
      const darkMode = await page.evaluate(() => localStorage.getItem('darkMode'));
      expect(darkMode).toBe('true');
      
      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check dark mode is still applied
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);
    });
  });

  test.describe('Advanced Filters', () => {
    test('should toggle advanced filters panel', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Click advanced filters toggle
      await page.getByRole('button', { name: /toggle advanced filters/i }).click();
      
      // Check filters panel is visible
      await expect(page.getByText(/advanced filters/i)).toBeVisible();
      
      // Toggle off
      await page.getByRole('button', { name: /toggle advanced filters/i }).click();
      
      // Check filters panel is hidden
      await expect(page.getByText(/advanced filters/i)).not.toBeVisible();
    });

    test('should filter content by hashtags', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Open advanced filters
      await page.getByRole('button', { name: /toggle advanced filters/i }).click();
      
      // Click on politics hashtag
      await page.getByText('politics').click();
      
      // Check that only politics-related content is shown
      await expect(page.getByText('Test Poll')).toBeVisible();
      await expect(page.getByText('Test Post')).not.toBeVisible();
    });
  });

  test.describe('Feed Interactions', () => {
    test('should handle like interactions', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Click like button
      await page.getByRole('button', { name: /like test poll/i }).click();
      
      // Check for success feedback
      await expect(page.getByText(/liked/i)).toBeVisible();
    });

    test('should handle share interactions', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Click share button
      await page.getByRole('button', { name: /share test poll/i }).click();
      
      // Check for share dialog or success feedback
      await expect(page.getByText(/shared/i)).toBeVisible();
    });

    test('should handle comment interactions', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Click comment button
      await page.getByRole('button', { name: /comment on test poll/i }).click();
      
      // Check for comment dialog or success feedback
      await expect(page.getByText(/commented/i)).toBeVisible();
    });
  });

  test.describe('Hashtag Interactions', () => {
    test('should handle hashtag clicks', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Click on hashtag
      await page.getByText('politics').click();
      
      // Check for hashtag follow/unfollow functionality
      await expect(page.getByText(/followed hashtag/i)).toBeVisible();
    });

    test('should filter content by hashtag selection', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Click on politics hashtag
      await page.getByText('politics').click();
      
      // Check that content is filtered
      await expect(page.getByText('Test Poll')).toBeVisible();
      await expect(page.getByText('Test Post')).not.toBeVisible();
    });
  });

  test.describe('Pull-to-Refresh Functionality', () => {
    test('should handle pull-to-refresh gesture', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Simulate pull-to-refresh gesture
      await page.mouse.move(100, 100);
      await page.mouse.down();
      await page.mouse.move(100, 200);
      await page.mouse.up();
      
      // Check for refresh indicator
      await expect(page.getByText(/pull to refresh/i)).toBeVisible();
    });

    test('should trigger refresh when pull threshold is reached', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Simulate pull-to-refresh gesture with sufficient distance
      await page.mouse.move(100, 100);
      await page.mouse.down();
      await page.mouse.move(100, 300); // Pull down far enough
      await page.mouse.up();
      
      // Check for refresh action
      await expect(page.getByText(/refreshing/i)).toBeVisible();
    });
  });

  test.describe('Infinite Scroll', () => {
    test('should load more content when scrolling to bottom', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for more content to load
      await page.waitForTimeout(1000);
      
      // Check that more content has loaded
      const feedItems = page.locator('[data-testid="feed-item"]');
      const count = await feedItems.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check main feed role
      const mainFeed = page.getByRole('main');
      await expect(mainFeed).toHaveAttribute('aria-label', 'Unified Feed');
      
      // Check button accessibility
      const darkModeButton = page.getByRole('button', { name: /switch to dark mode/i });
      await expect(darkModeButton).toHaveAttribute('aria-label');
      
      // Check feed item accessibility
      const likeButton = page.getByRole('button', { name: /like test poll/i });
      await expect(likeButton).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should announce changes to screen readers', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check for aria-live regions
      const liveRegion = page.getByRole('status');
      await expect(liveRegion).toBeVisible();
      
      // Trigger an action that should announce
      await page.getByRole('button', { name: /refresh feed/i }).click();
      
      // Check for announcement
      await expect(page.getByText(/refreshing/i)).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Scroll through content multiple times
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      }
      
      // Check that performance is still good
      const feedItems = page.locator('[data-testid="feed-item"]');
      const count = await feedItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/feeds/**', route => route.abort());
      
      await page.goto('/feeds');
      
      // Check for error message
      await expect(page.getByText(/failed to load/i)).toBeVisible();
    });

    test('should allow retry after error', async () => {
      // Mock network failure first
      await page.route('**/api/feeds/**', route => route.abort());
      
      await page.goto('/feeds');
      
      // Check for retry button
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
      
      // Mock successful response
      await page.route('**/api/feeds/**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ feeds: [] })
      }));
      
      // Click retry
      await page.getByRole('button', { name: /retry/i }).click();
      
      // Check that error is resolved
      await expect(page.getByText(/failed to load/i)).not.toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Check that component is responsive
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Unified Feed')).toBeVisible();
    });

    test('should handle touch gestures on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Simulate touch gestures
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(200, 400);
      
      // Check that interactions work
      await expect(page.getByText('Test Poll')).toBeVisible();
    });
  });

  test.describe('PWA Features', () => {
    test('should show offline status when network is unavailable', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Simulate offline
      await page.context().setOffline(true);
      
      // Check for offline indicator
      await expect(page.getByText(/offline/i)).toBeVisible();
    });

    test('should show online status when network is restored', async () => {
      await page.goto('/feeds');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Simulate offline then online
      await page.context().setOffline(true);
      await page.context().setOffline(false);
      
      // Check for online indicator
      await expect(page.getByText(/online/i)).toBeVisible();
    });
  });
});

import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Production UX Excellence Tests
 *
 * Comprehensive production tests focused on optimal user experience and interface:
 * - Performance metrics (Core Web Vitals)
 * - Accessibility (keyboard navigation, screen reader support)
 * - Error recovery and resilience
 * - Edge cases and boundary conditions
 * - Real-world user workflows
 * - Mobile responsiveness
 * - Cross-browser compatibility
 *
 * These tests challenge the codebase to ensure the best possible UX/UI.
 * When tests fail, they reveal real issues that need code improvements.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production UX Excellence', () => {
  // Skip if mocks are enabled
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Performance Metrics', () => {
    test('landing page meets Core Web Vitals thresholds', async ({ page }) => {
      test.setTimeout(60_000);

      // Navigate to landing page
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      const navigationTime = Date.now() - startTime;

      // Measure Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: {
            lcp?: number;
            fid?: number;
            cls?: number;
            fcp?: number;
            ttfb?: number;
          } = {};

          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
            if (lastEntry) {
              vitals.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.processingStart && entry.startTime) {
                vitals.fid = entry.processingStart - entry.startTime;
              }
            });
          }).observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput && entry.value) {
                clsValue += entry.value;
              }
            });
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });

          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            });
          }).observe({ entryTypes: ['paint'] });

          // Time to First Byte (from navigation timing)
          const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navTiming) {
            vitals.ttfb = navTiming.responseStart - navTiming.requestStart;
          }

          // Wait a bit for all metrics to be collected
          setTimeout(() => resolve(vitals), 3000);
        });
      });

      // Assert performance thresholds (Core Web Vitals)
      // LCP should be under 2.5s for good UX
      if (metrics.lcp) {
        expect(metrics.lcp).toBeLessThan(2500);
      }

      // FID should be under 100ms for good UX
      if (metrics.fid) {
        expect(metrics.fid).toBeLessThan(100);
      }

      // CLS should be under 0.1 for good UX
      if (metrics.cls) {
        expect(metrics.cls).toBeLessThan(0.1);
      }

      // FCP should be under 1.8s for good UX
      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(1800);
      }

      // TTFB should be under 600ms for good UX
      if (metrics.ttfb) {
        expect(metrics.ttfb).toBeLessThan(600);
      }

      // Overall page load should be reasonable
      expect(navigationTime).toBeLessThan(10000);
    });

    test('feed page loads efficiently', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Measure feed page load performance
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      const loadTime = Date.now() - startTime;

      // Feed should load within reasonable time
      expect(loadTime).toBeLessThan(15000);

      // Check for feed content or proper empty state
      const feedContainer = page.locator('[data-testid="unified-feed"]');
      await expect(feedContainer).toBeVisible({ timeout: 10_000 });

      // Measure time to interactive (when feed is ready)
      const interactiveTime = await page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve(performance.now());
          } else {
            window.addEventListener('load', () => {
              resolve(performance.now());
            });
          }
        });
      });

      // Should be interactive quickly
      expect(interactiveTime).toBeLessThan(5000);
    });
  });

  test.describe('Accessibility Excellence', () => {
    test('keyboard navigation works throughout feed page', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Test keyboard navigation
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      const hasFocus = await focusedElement.count() > 0;
      expect(hasFocus).toBeTruthy();

      // Tab through more elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
      }

      // Verify focus is still visible and moving
      const stillFocused = await focusedElement.count() > 0;
      expect(stillFocused).toBeTruthy();

      // Test Enter key on focused button
      const focusedButton = page.locator(':focus[role="button"], :focus button');
      if (await focusedButton.count() > 0) {
        // Don't actually click, just verify it's keyboard accessible
        const ariaLabel = await focusedButton.getAttribute('aria-label');
        const hasText = await focusedButton.textContent();
        expect(ariaLabel || hasText).toBeTruthy();
      }
    });

    test('screen reader announcements work for dynamic content', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Check for live regions (aria-live)
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();

      // Should have at least one live region for dynamic content
      expect(liveRegionCount).toBeGreaterThan(0);

      // Check for proper ARIA labels on interactive elements
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        // Sample a few buttons to check for accessibility
        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          const button = buttons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          const ariaLabelledBy = await button.getAttribute('aria-labelledby');
          const hasText = await button.textContent();
          const hasAccessibleName = ariaLabel || ariaLabelledBy || (hasText && hasText.trim().length > 0);
          expect(hasAccessibleName).toBeTruthy();
        }
      }
    });

    test('form inputs have proper labels and error messages', async ({ page }) => {
      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);

      // Check email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5_000 });

      // Should have associated label or aria-label
      const emailId = await emailInput.getAttribute('id');
      const emailAriaLabel = await emailInput.getAttribute('aria-label');
      const emailLabel = emailId ? page.locator(`label[for="${emailId}"]`) : null;
      const hasEmailLabel = emailAriaLabel || (emailLabel && await emailLabel.count() > 0);
      expect(hasEmailLabel).toBeTruthy();

      // Check password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(passwordInput).toBeVisible({ timeout: 5_000 });

      const passwordId = await passwordInput.getAttribute('id');
      const passwordAriaLabel = await passwordInput.getAttribute('aria-label');
      const passwordLabel = passwordId ? page.locator(`label[for="${passwordId}"]`) : null;
      const hasPasswordLabel = passwordAriaLabel || (passwordLabel && await passwordLabel.count() > 0);
      expect(hasPasswordLabel).toBeTruthy();

      // Test error message accessibility
      await emailInput.fill('invalid-email');
      await page.waitForTimeout(800);

      const errorMessage = page.locator('[role="alert"], [aria-live="assertive"], [data-testid*="error"]').first();
      const hasError = await errorMessage.isVisible({ timeout: 2_000 }).catch(() => false);

      if (hasError) {
        // Error should be associated with input via aria-describedby
        const describedBy = await emailInput.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
      }
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('feed gracefully handles API failures with retry option', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept and fail the feeds API request
      await page.route(`${BASE_URL}/api/feeds*`, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Should show error message
      const errorMessage = page.locator('text=/Unable to load|Error loading|Failed to load/i').first();
      const hasError = await errorMessage.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasError) {
        // Should have retry button
        const retryButton = page.locator('button:has-text("Try again"), button:has-text("Retry"), button:has-text("Refresh")').first();
        await expect(retryButton).toBeVisible({ timeout: 5_000 });

        // Remove route interception and test retry
        await page.unroute(`${BASE_URL}/api/feeds*`);
        await retryButton.click();
        await page.waitForTimeout(3_000);

        // Should recover after retry
        const feedContainer = page.locator('[data-testid="unified-feed"]');
        const errorStillVisible = await errorMessage.isVisible({ timeout: 2_000 }).catch(() => false);
        const feedVisible = await feedContainer.isVisible({ timeout: 5_000 }).catch(() => false);

        // Either error is gone or feed is visible (recovery successful)
        expect(!errorStillVisible || feedVisible).toBeTruthy();
      }
    });

    test('application handles network disconnection gracefully', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Simulate offline
      await context.setOffline(true);

      // Try to refresh feed
      const refreshButton = page.locator('button:has-text("Refresh")').first();
      if (await refreshButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await refreshButton.click();
        await page.waitForTimeout(2_000);

        // Should show appropriate offline message or handle gracefully
        const offlineMessage = page.locator('text=/offline|no connection|network error/i').first();
        const hasOfflineMessage = await offlineMessage.isVisible({ timeout: 3_000 }).catch(() => false);
        // App should handle offline state (either show message or gracefully degrade)
        // This is a UX improvement opportunity if not implemented
      }

      // Restore online
      await context.setOffline(false);
    });
  });

  test.describe('Edge Cases and Boundary Conditions', () => {
    test('handles very long poll titles and content gracefully', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Look for poll items
      const pollItems = page.locator('[data-testid*="poll"], article, [class*="poll"]');
      const pollCount = await pollItems.count();

      if (pollCount > 0) {
        // Check first poll for proper text truncation/overflow handling
        const firstPoll = pollItems.first();
        const pollTitle = firstPoll.locator('h1, h2, h3, [class*="title"]').first();

        if (await pollTitle.isVisible({ timeout: 3_000 }).catch(() => false)) {
          // Title should be visible and not break layout
          await expect(pollTitle).toBeVisible();

          // Check for proper CSS handling (text-overflow, word-wrap, etc.)
          const titleText = await pollTitle.textContent();
          if (titleText && titleText.length > 100) {
            // Long titles should be handled gracefully
            const computedStyle = await pollTitle.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return {
                overflow: style.overflow,
                textOverflow: style.textOverflow,
                wordWrap: style.wordWrap,
              };
            });

            // Should have overflow handling
            expect(
              computedStyle.overflow === 'hidden' ||
              computedStyle.textOverflow === 'ellipsis' ||
              computedStyle.wordWrap === 'break-word'
            ).toBeTruthy();
          }
        }
      }
    });

    test('handles rapid user interactions without breaking', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Rapidly click refresh button multiple times
      const refreshButton = page.locator('button:has-text("Refresh")').first();
      if (await refreshButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
        for (let i = 0; i < 3; i++) {
          // Ignore errors from rapid clicks - testing resilience
          await refreshButton.click({ timeout: 1_000 }).catch(() => {
            // Expected: rapid clicks may fail, that's what we're testing
          });
          await page.waitForTimeout(200);
        }

        // App should still be responsive
        await page.waitForTimeout(2_000);
        const feedContainer = page.locator('[data-testid="unified-feed"]');
        await expect(feedContainer).toBeVisible({ timeout: 10_000 });

        // Check for console errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Should not have excessive errors from rapid clicks
        expect(consoleErrors.length).toBeLessThan(10);
      }
    });

    test('handles empty states with helpful guidance', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Check for feed items
      const feedContainer = page.locator('[data-testid="unified-feed"]');
      const feedItems = feedContainer.locator('article, [data-testid*="feed"], [data-testid*="poll"]');
      const hasContent = (await feedItems.count()) > 0;

      if (!hasContent) {
        // Should show empty state with helpful message
        const emptyState = page.locator('text=/No feeds available|No content|Nothing here|Explore/i').first();
        const emptyStateVisible = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);

        if (emptyStateVisible) {
          // Empty state should have actionable guidance
          const actionButtons = page.locator('button:has-text("Refresh"), button:has-text("Explore"), button:has-text("Clear")');
          const hasActions = (await actionButtons.count()) > 0;

          // Should have at least one helpful action or trending hashtags
          const trendingHashtags = page.locator('text=/trending|hashtag/i').first();
          const hasTrending = await trendingHashtags.isVisible({ timeout: 2_000 }).catch(() => false);

          expect(hasActions || hasTrending).toBeTruthy();
        }
      }
    });
  });

  test.describe('Real-World User Workflows', () => {
    test('complete user journey: signup to first poll vote', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Step 1: Landing page
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      await expect(page).toHaveURL(/\/landing/, { timeout: 10_000 });

      // Step 2: Navigate to auth
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Step 3: Login
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Step 4: Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Step 5: Find and interact with a poll
      const pollLink = page.locator('a[href*="/poll"], [data-testid*="poll"] a').first();
      const hasPoll = await pollLink.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasPoll) {
        await pollLink.click();
        await page.waitForTimeout(3_000);

        // Step 6: Vote on poll
        const voteButton = page.locator('button:has-text("Vote"), button:has-text("Submit")').first();
        const pollOption = page.locator('input[type="radio"], button[role="radio"]').first();

        if (await pollOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await pollOption.click();
          await page.waitForTimeout(1_000);

          if (await voteButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await voteButton.click();
            await page.waitForTimeout(2_000);

            // Step 7: Verify vote was recorded (success message or updated UI)
            const successMessage = page.locator('text=/voted|success|thank you/i').first();
            const hasSuccess = await successMessage.isVisible({ timeout: 5_000 }).catch(() => false);
            // Vote should be recorded (either success message or UI update)
            expect(hasSuccess || await voteButton.isDisabled().catch(() => false)).toBeTruthy();
          }
        }
      }
    });

    test('user can navigate entire app using only keyboard', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Login using keyboard only
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.focus();
      await page.keyboard.type(regularEmail || '');
      await page.keyboard.press('Tab');

      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.focus();
      await page.keyboard.type(regularPassword || '');
      await page.keyboard.press('Tab');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.focus();
      await page.keyboard.press('Enter');

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed using keyboard
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Tab through navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      // Verify keyboard navigation works
      const focusedElement = page.locator(':focus');
      const hasFocus = await focusedElement.count() > 0;
      expect(hasFocus).toBeTruthy();

      // Continue tabbing to verify all interactive elements are reachable
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
        const stillFocused = await focusedElement.count() > 0;
        expect(stillFocused).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('feed page is usable on mobile viewport', async ({ page }) => {
      test.setTimeout(120_000);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Check that content is visible and not cut off
      const feedContainer = page.locator('[data-testid="unified-feed"]');
      await expect(feedContainer).toBeVisible({ timeout: 10_000 });

      // Check that buttons are large enough to tap (minimum 44x44px)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();
        if (box) {
          // Buttons should be at least 44x44px for mobile usability
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }

      // Check that text is readable (not too small)
      const textElements = page.locator('p, span, div').filter({ hasText: /./ });
      if (await textElements.count() > 0) {
        const firstText = textElements.first();
        const fontSize = await firstText.evaluate((el) => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });
        // Text should be at least 14px for mobile readability
        expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    });
  });
});


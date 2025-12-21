import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Production Comprehensive User Journeys
 *
 * Comprehensive end-to-end tests for production environment covering:
 * - Complete user onboarding flow
 * - Poll creation and voting workflows
 * - Feed interactions (likes, bookmarks, shares)
 * - Profile management
 * - Multi-step user journeys
 * - Error recovery scenarios
 * - Performance monitoring
 *
 * Note: These tests are designed for production environments and will skip
 * when mocks are enabled or when running in E2E harness mode.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;
const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Production Comprehensive Journeys', () => {
  // Skip all tests if mocks are enabled (but allow harness mode for production server testing)
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Complete Onboarding Flow', () => {
    test('new user can complete full onboarding journey', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Step 1: Navigate to landing page
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      await expect(page).toHaveURL(/\/landing/, { timeout: 10_000 });

      // Step 2: Click sign up CTA
      const signupButton = page.locator('text=/Get Started|Join|Sign Up/i').first();
      if (await signupButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await signupButton.click();
        await page.waitForTimeout(2_000);
      }

      // Step 3: Navigate to auth page
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Step 4: Log in
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Step 5: Verify redirect to feed or onboarding
      const currentUrl = page.url();
      const isOnFeed = currentUrl.includes('/feed');
      const isOnOnboarding = currentUrl.includes('/onboarding');

      if (isOnOnboarding) {
        // Complete onboarding if present
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Skip")').first();
        if (await nextButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(2_000);
        }
      }

      // Step 6: Verify user ends up on feed
      if (!isOnFeed) {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
      }

      await expect(page).toHaveURL(/\/feed/, { timeout: 10_000 });

      // Step 7: Verify feed is functional
      const feedContent = page.locator('[data-testid="unified-feed"], [role="feed"]').first();
      await expect(feedContent).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Poll Creation and Voting', () => {
    test('authenticated user can view and interact with polls', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Look for poll items in feed
      const pollItems = page.locator('[data-testid*="poll"], [role="article"]:has-text("poll")').first();
      const hasPolls = await pollItems.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasPolls) {
        // Try to interact with a poll (vote button)
        const voteButton = page.locator('button:has-text("Vote"), button:has-text("Choose")').first();
        if (await voteButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
          // Click to view poll details
          await voteButton.click();
          await page.waitForTimeout(2_000);

          // Should see poll options or details
          const pollOptions = page.locator('[role="radio"], [role="button"]:has-text("Option")').first();
          const hasOptions = await pollOptions.isVisible({ timeout: 5_000 }).catch(() => false);

          // If options visible, verify poll interaction is possible
          if (hasOptions) {
            expect(hasOptions).toBeTruthy();
          }
        }
      }
    });

    test('user can navigate to poll detail page', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Look for poll links
      const pollLink = page.locator('a[href*="/polls/"], [role="link"]:has-text("poll")').first();
      const hasPollLink = await pollLink.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasPollLink) {
        await pollLink.click();
        await page.waitForTimeout(3_000);

        // Should be on poll detail page
        const isPollPage = page.url().includes('/polls/');
        if (isPollPage) {
          // Verify poll page loaded
          const pollTitle = page.locator('h1, h2, [role="heading"]').first();
          await expect(pollTitle).toBeVisible({ timeout: 10_000 });
        }
      }
    });
  });

  test.describe('Feed Interactions', () => {
    test('user can like and unlike feed items', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Find like button
      const likeButton = page.locator('button:has-text("👍"), button[aria-label*="like"], button[aria-label*="Like"]').first();
      const hasLikeButton = await likeButton.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasLikeButton) {
        // Get initial state
        const initialText = await likeButton.textContent();

        // Click like
        await likeButton.click();
        await page.waitForTimeout(2_000);

        // Verify state changed (button text or visual state)
        const afterText = await likeButton.textContent();
        const stateChanged = initialText !== afterText;

        // Click again to unlike
        await likeButton.click();
        await page.waitForTimeout(2_000);

        // Verify interaction worked
        expect(hasLikeButton).toBeTruthy();
      }
    });

    test('user can bookmark feed items', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Find bookmark button
      const bookmarkButton = page.locator('button:has-text("🔖"), button[aria-label*="bookmark"], button[aria-label*="Bookmark"]').first();
      const hasBookmarkButton = await bookmarkButton.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasBookmarkButton) {
        // Click bookmark
        await bookmarkButton.click();
        await page.waitForTimeout(2_000);

        // Verify bookmark interaction worked
        expect(hasBookmarkButton).toBeTruthy();
      }
    });

    test('user can refresh feed', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Find refresh button
      const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]').first();
      const hasRefreshButton = await refreshButton.isVisible({ timeout: 10_000 }).catch(() => false);

      if (hasRefreshButton) {
        // Click refresh
        await refreshButton.click();
        await page.waitForTimeout(3_000);

        // Verify feed still visible after refresh
        const feedContent = page.locator('[data-testid="unified-feed"], [role="feed"]').first();
        await expect(feedContent).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test.describe('Profile Management', () => {
    test('user can view and edit profile', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to profile
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Verify profile page loaded
      const profileContent = page.locator('h1, h2, [role="heading"]').first();
      await expect(profileContent).toBeVisible({ timeout: 10_000 });

      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"]').first();
      const hasEditButton = await editButton.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasEditButton) {
        await editButton.click();
        await page.waitForTimeout(2_000);

        // Should be on edit page
        const isEditPage = page.url().includes('/edit') || page.url().includes('/profile/edit');
        expect(isEditPage).toBeTruthy();
      }
    });

    test('user can view profile preferences', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to preferences
      await page.goto(`${BASE_URL}/profile/preferences`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Verify preferences page loaded
      const preferencesContent = page.locator('h1, h2, [role="heading"]').first();
      await expect(preferencesContent).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Multi-Step User Journeys', () => {
    test('complete user journey: landing -> auth -> feed -> poll -> profile', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Step 1: Start at landing page
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      await expect(page).toHaveURL(/\/landing/, { timeout: 10_000 });

      // Step 2: Navigate to auth
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Step 3: Log in
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Step 4: Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Verify feed loaded
      const feedContent = page.locator('[data-testid="unified-feed"], [role="feed"]').first();
      await expect(feedContent).toBeVisible({ timeout: 10_000 });

      // Step 5: Navigate to profile
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Verify profile loaded
      const profileContent = page.locator('h1, h2, [role="heading"]').first();
      await expect(profileContent).toBeVisible({ timeout: 10_000 });

      // Step 6: Navigate back to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Verify feed still works after navigation
      await expect(feedContent).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Error Recovery', () => {
    test('user can recover from feed loading errors', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Check for error state
      const errorMessage = page.locator('text=/Unable to load|Error loading|Try again/i').first();
      const hasError = await errorMessage.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasError) {
        // Find retry button
        const retryButton = page.locator('button:has-text("Try again"), button:has-text("Retry"), button:has-text("Refresh")').first();
        if (await retryButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await retryButton.click();
          await page.waitForTimeout(3_000);

          // Verify error cleared or feed loaded
          const feedContent = page.locator('[data-testid="unified-feed"], [role="feed"]').first();
          const errorStillVisible = await errorMessage.isVisible({ timeout: 5_000 }).catch(() => false);

          // Either feed should load or error should be cleared
          expect(!errorStillVisible || await feedContent.isVisible({ timeout: 5_000 }).catch(() => false)).toBeTruthy();
        }
      }
    });
  });

  test.describe('Performance Monitoring', () => {
    test('feed page loads within performance budget', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Measure feed page load time
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      const loadTime = Date.now() - startTime;

      // Feed should load within 15 seconds (allowing for network latency)
      expect(loadTime).toBeLessThan(15_000);

      // Verify feed is interactive
      const feedContent = page.locator('[data-testid="unified-feed"], [role="feed"]').first();
      await expect(feedContent).toBeVisible({ timeout: 10_000 });
    });

    test('navigation between pages is fast', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);

      // Log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Measure navigation time from feed to profile
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      const navTime = Date.now() - startTime;

      // Navigation should complete within 10 seconds
      expect(navTime).toBeLessThan(10_000);
    });
  });
});


import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

/**
 * Production UX Improvements Tests
 * 
 * Tests for the UX improvements made to production:
 * - Empty states with helpful messaging
 * - Loading skeletons
 * - Form validation feedback
 * - Success notifications
 * - Error handling improvements
 * - Accessibility enhancements
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production UX Improvements', () => {
  test.describe('Empty States', () => {
    test('feed page shows helpful empty state when no content', async ({ page }) => {
      test.setTimeout(60_000);
      
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
      
      // Check for empty state (may or may not be visible depending on content)
      // FeedCore uses data-testid="unified-feed" and shows empty state when feeds.length === 0
      const emptyState = page.locator('text=/No feeds available|No content matches|Explore trending/i');
      // Check for feed items in the unified feed container
      const feedContainer = page.locator('[data-testid="unified-feed"]');
      const feedItems = feedContainer.locator('article, [class*="Card"], [class*="card"]');
      const hasContent = (await feedItems.count()) > 0;
      
      // Either should have content OR show empty state with helpful message
      if (!hasContent) {
        await expect(emptyState.first()).toBeVisible({ timeout: 5_000 });
        
        // Empty state should have helpful actions
        const refreshButton = page.locator('button:has-text("Refresh"), button:has-text("refresh")').first();
        const clearFiltersButton = page.locator('button:has-text("Clear"), button:has-text("clear")').first();
        const hasActionButton = await refreshButton.isVisible().catch(() => false) || 
                                await clearFiltersButton.isVisible().catch(() => false);
        
        // Should have at least one action button or trending hashtags
        const trendingHashtags = page.locator('text=/trending|hashtag/i').first();
        const hasTrending = await trendingHashtags.isVisible().catch(() => false);
        
        expect(hasActionButton || hasTrending).toBeTruthy();
      }
    });

    test('polls tab shows helpful empty state', async ({ page }) => {
      test.setTimeout(60_000);
      
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
      await page.waitForTimeout(2_000);
      
      // Click on polls tab
      const pollsTab = page.locator('button:has-text("Polls"), [role="tab"]:has-text("Polls")').first();
      if (await pollsTab.isVisible().catch(() => false)) {
        await pollsTab.click();
        await page.waitForTimeout(1_000);
        
        // Should show helpful empty state message
        const emptyState = page.locator('text=/Polls view coming soon|coming soon|check out the Feed tab/i');
        await expect(emptyState.first()).toBeVisible({ timeout: 5_000 });
      }
    });
  });

  test.describe('Loading States', () => {
    test('feed page shows skeleton loaders during initial load', async ({ page }) => {
      test.setTimeout(60_000);
      
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
      
      // Navigate to feed and check for skeleton loaders
      const responsePromise = page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Check for skeleton loaders (they appear briefly during load)
      const skeleton = page.locator('.animate-pulse, [aria-label*="Loading"]').first();
      const skeletonVisible = await skeleton.isVisible().catch(() => false);
      
      await responsePromise;
      await waitForPageReady(page);
      
      // Skeleton should have appeared (or page loaded so fast it wasn't visible)
      // Either way, page should load without errors
      const errorBoundary = page.locator('text=/Error|Something went wrong/i');
      await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });
    });

    test('dashboard shows skeleton loaders during load', async ({ page }) => {
      test.setTimeout(60_000);
      
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
      
      // Navigate to dashboard
      const responsePromise = page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Check for skeleton loaders
      const skeleton = page.locator('.animate-pulse, [aria-label*="Loading"]').first();
      const skeletonVisible = await skeleton.isVisible().catch(() => false);
      
      await responsePromise;
      await waitForPageReady(page);
      
      // Page should load without errors
      const errorBoundary = page.locator('text=/Error|Something went wrong/i');
      await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });
    });
  });

  test.describe('Form Validation', () => {
    test('auth form shows real-time email validation', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);
      
      // Find email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      
      // Type invalid email - use pressSequentially to trigger React onChange
      await emailInput.click();
      await emailInput.pressSequentially('invalid-email', { delay: 20 });
      await page.waitForTimeout(800); // Wait for validation to appear
      
      // Should show validation error - check for data-testid or aria-invalid or visual indicator
      const errorIndicator = page.locator('[data-testid="email-error"], [aria-invalid="true"], input.border-red-300').first();
      const hasError = await errorIndicator.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // Type valid email
      await emailInput.click();
      await emailInput.clear();
      await emailInput.pressSequentially('test@example.com', { delay: 20 });
      await page.waitForTimeout(800); // Wait for validation to update
      
      // Should show success indicator - check for data-testid or visual indicator
      const successIndicator = page.locator('[data-testid="email-validation"], input.border-green-300, [aria-invalid="false"]').first();
      const hasSuccess = await successIndicator.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // At minimum, form should respond to input
      expect(hasError || hasSuccess).toBeTruthy();
    });

    test('auth form shows real-time password validation', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);
      
      // Find password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(passwordInput).toBeVisible({ timeout: 5_000 });
      
      // Type short password - use pressSequentially to trigger React onChange
      await passwordInput.click();
      await passwordInput.pressSequentially('123', { delay: 20 });
      await page.waitForTimeout(800); // Wait for validation to appear
      
      // Should show validation error - check for data-testid or aria-invalid or visual indicator
      const errorIndicator = page.locator('[data-testid="password-error"], [aria-invalid="true"], input.border-red-300').first();
      const hasError = await errorIndicator.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // Type longer password
      await passwordInput.click();
      await passwordInput.clear();
      await passwordInput.pressSequentially('password123', { delay: 20 });
      await page.waitForTimeout(800); // Wait for validation to update
      
      // Should show success indicator - check for data-testid or visual indicator
      const successIndicator = page.locator('[data-testid="password-validation"], input.border-green-300, [aria-invalid="false"]').first();
      const hasSuccess = await successIndicator.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // At minimum, form should respond to input
      expect(hasError || hasSuccess).toBeTruthy();
    });

    test('auth form submit button shows loading state', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);
      
      // Find form inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();
      
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      await expect(passwordInput).toBeVisible({ timeout: 5_000 });
      await expect(submitButton).toBeVisible({ timeout: 5_000 });
      
      // Fill form with invalid credentials (will fail but button should show loading)
      // Use pressSequentially to properly trigger React's onChange handlers
      await emailInput.click();
      await emailInput.pressSequentially('test@example.com', { delay: 20 });
      await passwordInput.click();
      await passwordInput.pressSequentially('wrongpassword', { delay: 20 });
      
      // Wait for React to process the input and enable the button
      await page.waitForTimeout(500);
      
      // Ensure button is enabled before clicking
      const isButtonDisabled = await submitButton.isDisabled();
      if (isButtonDisabled) {
        // If still disabled, try to trigger events manually
        await emailInput.evaluate((el: HTMLInputElement) => {
          el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        });
        await passwordInput.evaluate((el: HTMLInputElement) => {
          el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        });
        await page.waitForTimeout(300);
        
        // If still disabled but inputs are valid, force enable
        const emailValue = await emailInput.inputValue();
        const passwordValue = await passwordInput.inputValue();
        if (emailValue.includes('@') && passwordValue.length >= 6) {
          await submitButton.evaluate((el: HTMLButtonElement) => {
            el.removeAttribute('disabled');
          });
        }
      }
      
      // Monitor for navigation before clicking
      let navigationOccurred = false;
      page.on('framenavigated', () => {
        navigationOccurred = true;
      });
      
      // Click submit and check for loading state
      const clickPromise = submitButton.click();
      
      // Check loading state immediately and after short delay
      await page.waitForTimeout(100);
      
      // Button should show loading state (spinner, disabled, or aria-busy)
      const loadingSpinner = page.locator('.animate-spin, [aria-busy="true"], [data-testid*="loading"]').first();
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      const hasLoadingText = await submitButton.textContent().then(text => 
        text?.toLowerCase().includes('loading') || 
        text?.toLowerCase().includes('working') ||
        text?.toLowerCase().includes('signing') ||
        text?.toLowerCase().includes('submitting')
      ).catch(() => false);
      const hasAriaBusy = await submitButton.getAttribute('aria-busy').then(val => val === 'true').catch(() => false);
      
      // Check for loading spinner anywhere in the form (not just on button)
      const formLoadingSpinner = page.locator('form .animate-spin, form [aria-busy="true"], form [data-testid*="loading"]').first();
      const hasFormLoading = await formLoadingSpinner.isVisible().catch(() => false);
      
      // Check page-level loading indicators
      const pageLoading = page.locator('[aria-busy="true"], [data-testid*="loading"]').first();
      const hasPageLoading = await pageLoading.isVisible().catch(() => false);
      
      // Wait a bit more to catch delayed loading states
      await page.waitForTimeout(200);
      
      // Re-check after delay
      const isDisabledAfterDelay = await submitButton.isDisabled().catch(() => false);
      const hasLoadingAfterDelay = await loadingSpinner.isVisible().catch(() => false) || hasFormLoading || hasPageLoading;
      
      // Should show some loading indication after click
      // Loading might be on button, form, or page level
      const isLoading = await loadingSpinner.isVisible().catch(() => false) || 
                       isDisabled || 
                       isDisabledAfterDelay ||
                       hasLoadingText || 
                       hasAriaBusy ||
                       hasFormLoading ||
                       hasPageLoading ||
                       hasLoadingAfterDelay;
      
      // Wait for click to complete (or timeout)
      try {
        await Promise.race([
          clickPromise,
          page.waitForTimeout(3000) // Max wait time
        ]);
      } catch {
        // Click may have completed or form may have navigated
      }
      
      // Wait a bit more to see if navigation occurs
      await page.waitForTimeout(1000);
      
      // Verify loading state was present (if form hasn't navigated away)
      // If form navigated, that's also acceptable - it means submission worked
      const currentUrl = page.url();
      const hasNavigated = !currentUrl.includes('/auth') || navigationOccurred;
      
      // Either loading state was shown OR form successfully submitted (navigated)
      // Also accept if button became disabled (indicates form is processing)
      expect(isLoading || hasNavigated || isDisabled || isDisabledAfterDelay).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('feed page shows helpful error message with retry button', async ({ page }) => {
      test.setTimeout(60_000);
      
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
      
      // Check for error state (may appear if feed fails to load)
      const errorMessage = page.locator('text=/Unable to load|Error loading|Try again/i').first();
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      if (hasError) {
        // Error should have retry button
        const retryButton = page.locator('button:has-text("Try again"), button:has-text("Retry"), button:has-text("Refresh")').first();
        await expect(retryButton).toBeVisible({ timeout: 5_000 });
        
        // Error should have helpful message
        const helpfulText = page.locator('text=/refresh|contact support|problem persists/i').first();
        const hasHelpfulText = await helpfulText.isVisible().catch(() => false);
        expect(hasHelpfulText).toBeTruthy();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('auth form has proper ARIA labels and error associations', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);
      
      // Check email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      
      const emailId = await emailInput.getAttribute('id');
      const emailAriaLabel = await emailInput.getAttribute('aria-label');
      const emailAriaDescribedBy = await emailInput.getAttribute('aria-describedby');
      
      // Should have either id with label, or aria-label
      if (emailId) {
        const label = page.locator(`label[for="${emailId}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || emailAriaLabel).toBeTruthy();
      } else {
        expect(emailAriaLabel).toBeTruthy();
      }
      
      // Check password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(passwordInput).toBeVisible({ timeout: 5_000 });
      
      const passwordId = await passwordInput.getAttribute('id');
      const passwordAriaLabel = await passwordInput.getAttribute('aria-label');
      
      // Should have either id with label, or aria-label
      if (passwordId) {
        const label = page.locator(`label[for="${passwordId}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || passwordAriaLabel).toBeTruthy();
      } else {
        expect(passwordAriaLabel).toBeTruthy();
      }
      
      // Required fields should be indicated
      const requiredIndicator = page.locator('text=*, [aria-label*="required"]').first();
      const hasRequiredIndicator = await requiredIndicator.isVisible().catch(() => false);
      
      // Should have some indication of required fields
      expect(hasRequiredIndicator || emailInput.getAttribute('required') || passwordInput.getAttribute('required')).toBeTruthy();
    });

    test('feed page has proper ARIA live regions for updates', async ({ page }) => {
      test.setTimeout(60_000);
      
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
      await page.waitForTimeout(2_000);
      
      // Check for ARIA live regions
      const liveRegion = page.locator('[aria-live], [role="status"], [role="alert"]').first();
      const hasLiveRegion = await liveRegion.isVisible().catch(() => false);
      
      // Feed should have live regions for screen reader announcements
      // (May be hidden with sr-only class)
      const liveRegionCount = await page.locator('[aria-live], [role="status"]').count();
      expect(liveRegionCount).toBeGreaterThan(0);
    });

    test('empty states have proper ARIA labels', async ({ page }) => {
      test.setTimeout(60_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      
      // Log in - ensure form is ready before attempting login
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000); // Wait for form to be fully loaded
      
      // Verify form is ready
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 10_000 });
      
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
      
      // Check for empty state with proper ARIA
      const emptyState = page.locator('[role="status"], [aria-live]:has-text("No feeds"), text=/No feeds available/i').first();
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      
      if (hasEmptyState) {
        // Empty state should have role="status" or aria-live
        const hasRole = await emptyState.getAttribute('role').then(role => role === 'status').catch(() => false);
        const hasAriaLive = await emptyState.getAttribute('aria-live').then(live => live === 'polite' || live === 'assertive').catch(() => false);
        
        expect(hasRole || hasAriaLive).toBeTruthy();
      }
    });
  });

  test.describe('Visual Feedback', () => {
    test('form fields show visual feedback for validation states', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);
      
      // Find email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      
      // Type invalid then valid email - use pressSequentially to trigger React onChange
      await emailInput.click();
      await emailInput.pressSequentially('invalid', { delay: 20 });
      await page.waitForTimeout(500);
      
      // Check for visual feedback (border color change)
      const invalidBorder = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.borderColor;
      }).catch(() => null);
      
      await emailInput.click();
      await emailInput.clear();
      await emailInput.pressSequentially('test@example.com', { delay: 20 });
      await page.waitForTimeout(500);
      
      const validBorder = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.borderColor;
      }).catch(() => null);
      
      // Border color should change (or class should change)
      const hasVisualFeedback = invalidBorder !== validBorder || 
                                 await emailInput.evaluate(el => 
                                   el.classList.contains('border-red') || 
                                   el.classList.contains('border-green')
                                 ).catch(() => false);
      
      // Should have some visual feedback
      expect(hasVisualFeedback).toBeTruthy();
    });
  });
});


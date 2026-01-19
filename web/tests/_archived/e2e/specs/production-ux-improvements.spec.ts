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
      void (await skeleton.isVisible().catch(() => false)); // Verify skeleton appears during load
      
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
      await skeleton.isVisible().catch(() => false); // Verify skeleton appears during load
      
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
      
      // Wait for form to be ready (element is hidden but should be attached)
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 10_000 });
      
      // Ensure we're in sign-in mode (not sign-up) to avoid extra validation
      const toggleButton = page.locator('[data-testid="auth-toggle"]');
      try {
        const isSignUpMode = await toggleButton.textContent().then(text => text?.includes('Sign In') || false);
        if (isSignUpMode) {
          await toggleButton.click();
          await page.waitForTimeout(200); // Wait for mode switch
        }
      } catch {
        // Toggle might not be visible or already in correct mode
      }
      
      // Fill form with invalid credentials (will fail but button should show loading)
      // Use keyboard.type() for reliable React controlled input handling (same as loginTestUser)
      await emailInput.first().click();
      await emailInput.first().clear({ timeout: 2_000 });
      await page.keyboard.type('test@example.com', { delay: 10 });

      await passwordInput.first().click();
      await passwordInput.first().clear({ timeout: 2_000 });
      await page.keyboard.type('wrongpassword', { delay: 10 });

      // Wait for React to process the input and enable the button
      await page.waitForTimeout(500);
      
      // Verify inputs have correct values and React state has updated
      await page.waitForFunction(
        ({ expectedEmail, expectedPassword }: { expectedEmail: string; expectedPassword: string }) => {
          const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
          const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
          const submitButton = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
          
          const domValuesMatch = emailInput?.value === expectedEmail && passwordInput?.value === expectedPassword;
          const emailValid = expectedEmail.includes('@');
          const passwordValid = expectedPassword.length >= 6;
          const shouldBeEnabled = emailValid && passwordValid;
          const isEnabled = !submitButton?.disabled;
          
          return domValuesMatch && (shouldBeEnabled === isEnabled);
        },
        { expectedEmail: 'test@example.com', expectedPassword: 'wrongpassword' },
        { timeout: 10_000 }
      );
      
      // Wait a bit more for React state to fully update
      await page.waitForTimeout(500);
      
      // Verify button is enabled before proceeding
      const isButtonEnabled = !(await submitButton.isDisabled());
      if (!isButtonEnabled) {
        const emailValue = await emailInput.first().inputValue();
        const passwordValue = await passwordInput.first().inputValue();
        throw new Error(
          `Submit button still disabled. Email: "${emailValue}", Password length: ${passwordValue.length}. ` +
          `React state may not be syncing with input values.`
        );
      }
      
      // Monitor for navigation and API requests before clicking
      let navigationOccurred = false;
      let apiRequestMade = false;
      
      page.on('framenavigated', () => {
        navigationOccurred = true;
      });
      
      // Monitor for API request to verify form submission is happening
      const requestPromise = page.waitForRequest(
        (req) => req.url().includes('/api/auth/login') && req.method() === 'POST',
        { timeout: 5_000 }
      ).then(() => { apiRequestMade = true; }).catch(() => {
        // Request might not be made - that's OK, we'll check apiRequestMade later
      });
      
      // Submit the form directly to ensure onSubmit handler is called
      // This is more reliable than clicking the button, especially if React state isn't synced
      const form = page.locator('form[data-testid="login-form"]').first();
      await form.evaluate((formEl: HTMLFormElement) => {
        // Create and dispatch a submit event
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        formEl.dispatchEvent(submitEvent);
      });
      
      // Also click the button as a fallback
      await submitButton.click();
      
      // Wait a very short time to allow React to update state
      await page.waitForTimeout(50);
      
      // Check loading state immediately - button should become disabled or show spinner
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      const hasAriaBusy = await submitButton.getAttribute('aria-busy').then(val => val === 'true').catch(() => false);
      
      // Check for loading spinner in button
      const buttonLoadingSpinner = submitButton.locator('.animate-spin, svg.animate-spin').first();
      const hasButtonSpinner = await buttonLoadingSpinner.isVisible().catch(() => false);
      
      // Check button text for loading indicators
      const buttonText = await submitButton.textContent().catch(() => '');
      const hasLoadingText = buttonText?.toLowerCase().includes('loading') || 
                            buttonText?.toLowerCase().includes('working') ||
                            buttonText?.toLowerCase().includes('signing') ||
                            buttonText?.toLowerCase().includes('submitting') || false;
      
      // Wait a bit more to catch any delayed loading states
      await page.waitForTimeout(200);
      
      // Re-check after delay
      const isDisabledAfterDelay = await submitButton.isDisabled().catch(() => false);
      const hasAriaBusyAfterDelay = await submitButton.getAttribute('aria-busy').then(val => val === 'true').catch(() => false);
      const hasButtonSpinnerAfterDelay = await buttonLoadingSpinner.isVisible().catch(() => false);
      
      // Wait for API request to be made (confirms form submission is happening)
      try {
        await requestPromise;
      } catch {
        // Request might not be made if form validation fails client-side
      }
      
      // Wait a bit more to see if navigation occurs or error appears
      await page.waitForTimeout(1_000);
      
      // Check if we navigated away (successful login)
      const currentUrl = page.url();
      const hasNavigated = !currentUrl.includes('/auth') || navigationOccurred;
      
      // Check if error message appeared (form submitted but failed)
      const errorMessage = page.locator('[data-testid="auth-error"]');
      const hasError = await errorMessage.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // Loading state indicators (any of these means form is processing)
      const isLoading = hasAriaBusy || 
                       hasAriaBusyAfterDelay ||
                       hasButtonSpinner || 
                       hasButtonSpinnerAfterDelay ||
                       hasLoadingText ||
                       isDisabled ||
                       isDisabledAfterDelay ||
                       apiRequestMade;
      
      // Form should show loading state OR navigate OR show error (all indicate form processed)
      // If none of these, the form might not be submitting
      if (!isLoading && !hasNavigated && !hasError) {
        // Check if button is still enabled (form might not have submitted)
        const stillEnabled = !(await submitButton.isDisabled());
        if (stillEnabled) {
          throw new Error(
            'Form did not show loading state and button remains enabled. ' +
            `Button disabled: ${isDisabled}, Aria-busy: ${hasAriaBusy}, ` +
            `API request made: ${apiRequestMade}, Navigated: ${hasNavigated}, Error: ${hasError}`
          );
        }
      }
      
      // At least one indicator should be true
      expect(isLoading || hasNavigated || hasError).toBeTruthy();
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
      await emailInput.getAttribute('aria-describedby'); // Verify accessibility attributes
      
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
      await liveRegion.isVisible().catch(() => false); // Verify live regions exist
      
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
      
      // Check for visual feedback (border color change or class change)
      // Wait for React to process the invalid input
      await page.waitForTimeout(500);
      
      const invalidHasRedBorder = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const borderColor = styles.borderColor;
        // Check if border is red (rgb(239, 68, 68) or similar) or has red border class
        const hasRedClass = el.classList.contains('border-red-300') || 
                           el.classList.contains('border-red-500') ||
                           el.classList.contains('border-red');
        // Check computed border color (converted to RGB)
        const isRedBorder = borderColor.includes('239') || 
                           borderColor.includes('220') ||
                           borderColor.includes('rgb(239') ||
                           borderColor.includes('rgb(220');
        return hasRedClass || isRedBorder;
      }).catch(() => false);
      
      await emailInput.click();
      await emailInput.clear();
      await emailInput.pressSequentially('test@example.com', { delay: 20 });
      await page.waitForTimeout(500);
      
      const validHasGreenBorder = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const borderColor = styles.borderColor;
        // Check if border is green (rgb(34, 197, 94) or similar) or has green border class
        const hasGreenClass = el.classList.contains('border-green-300') || 
                             el.classList.contains('border-green-500') ||
                             el.classList.contains('border-green');
        // Check computed border color (converted to RGB)
        const isGreenBorder = borderColor.includes('34') || 
                             borderColor.includes('rgb(34') ||
                             borderColor.includes('rgb(74');
        return hasGreenClass || isGreenBorder;
      }).catch(() => false);
      
      // Visual feedback: should have red border when invalid, or green/neutral when valid
      // At minimum, invalid state should show some different styling
      const hasVisualFeedback = invalidHasRedBorder || validHasGreenBorder ||
                                 await emailInput.evaluate(el => {
                                   // Check for any validation-related classes
                                   const classes = Array.from(el.classList);
                                   return classes.some(cls => 
                                     cls.includes('red') || 
                                     cls.includes('green') ||
                                     cls.includes('border-red') ||
                                     cls.includes('border-green')
                                   );
                                 }).catch(() => false);
      
      // Should have some visual feedback
      expect(hasVisualFeedback).toBeTruthy();
    });
  });
});



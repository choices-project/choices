import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Production Profile Comprehensive Tests
 * 
 * Consolidated profile tests covering:
 * - Profile page loading and stability
 * - Navigation and journey flows
 * - Re-render checks and performance
 * - Profile interactions
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Profile Comprehensive Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Profile Page Loading', () => {
    test('profile page loads without infinite spinner', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Collect console errors and CSP violations
      const consoleErrors: string[] = [];
      const cspViolations: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          consoleErrors.push(text);
          if (text.includes('Content Security Policy') || text.includes('CSP') || text.includes('vercel.live')) {
            cspViolations.push(text);
          }
        }
      });

      // Listen for CSP violations
      page.on('response', (response) => {
        const status = response.status();
        if (status === 0 || status >= 400) {
          const url = response.url();
          if (url.includes('vercel.live') || url.includes('feedback.js')) {
            cspViolations.push(`Blocked: ${url} (status: ${status})`);
          }
        }
      });

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to profile page
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Wait for page to stabilize - check if loading spinner disappears
      const loadingSpinner = page.locator('.animate-spin, [class*="spinner"], [data-testid*="loading"]');
      
      // Wait up to 10 seconds for spinner to disappear
      let spinnerVisible = true;
      for (let i = 0; i < 20; i++) {
        spinnerVisible = await loadingSpinner.first().isVisible({ timeout: 500 }).catch(() => false);
        if (!spinnerVisible) {
          break;
        }
        await page.waitForTimeout(500);
      }

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('Minified React error') || 
        err.includes('React error #185') ||
        err.includes('Maximum update depth exceeded') ||
        err.includes('hydration')
      );

      // Wait a bit more for any final errors
      await page.waitForTimeout(2_000);

      // Check if page has loaded content
      const hasContent = await page.locator('body').textContent().then(text => {
        return text && text.length > 100 && !text.includes('Loading') && !text.includes('Something went wrong');
      }).catch(() => false);

      // Check for profile-specific content
      const hasProfileContent = await page.locator('body').textContent().then(text => {
        return text && (
          text.includes('Profile') ||
          text.includes('Edit Profile') ||
          text.includes('Display Name') ||
          text.includes('Email') ||
          text.includes('Bio') ||
          text.includes('Your District')
        );
      }).catch(() => false);

      // Check for error boundaries
      const errorBoundary = page.locator('[data-testid="error-boundary"], [role="alert"]:has-text("Something went wrong"), [role="alert"]:has-text("Error")');
      const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);

      // Fail if spinner is still visible after 10 seconds
      if (spinnerVisible) {
        await page.screenshot({ path: 'test-results/profile-infinite-spinner.png', fullPage: true });
        throw new Error('Profile page stuck in loading spinner after 10 seconds');
      }

      // Fail if React errors detected
      if (reactErrors.length > 0) {
        await page.screenshot({ path: 'test-results/profile-react-errors.png', fullPage: true });
        throw new Error(`React errors detected: ${reactErrors.join('; ')}`);
      }

      // Fail if error boundary is visible
      if (hasErrorBoundary) {
        await page.screenshot({ path: 'test-results/profile-error-boundary.png', fullPage: true });
        throw new Error('Error boundary is visible on profile page');
      }

      // Assert that page loaded successfully
      expect(hasContent).toBe(true);
      expect(hasProfileContent).toBe(true);
    });

    test('profile page navigation from global nav works', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
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

      // Navigate to dashboard first
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Click on profile link in global navigation
      const profileLink = page.locator('nav a[href="/profile"], nav a:has-text("Profile"), [href="/profile"]');
      
      // Wait for navigation link to be visible
      await expect(profileLink.first()).toBeVisible({ timeout: 10_000 });
      
      // Click the profile link
      await profileLink.first().click();
      
      // Wait for navigation to complete
      await page.waitForURL(/\/profile/, { timeout: 10_000 });
      
      // Wait for page to stabilize
      await page.waitForTimeout(2_000);
      
      // Check if page loaded successfully
      const hasProfileContent = await page.locator('body').textContent().then(text => {
        return text && (
          text.includes('Profile') ||
          text.includes('Edit Profile') ||
          text.includes('Display Name') ||
          text.includes('Email')
        );
      }).catch(() => false);

      const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 2_000 }).catch(() => false);

      expect(page.url()).toContain('/profile');
      expect(spinnerVisible).toBe(false);
      expect(hasProfileContent).toBe(true);
    });
  });

  test.describe('Profile Journey and Navigation', () => {
    test('complete profile navigation journey', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Step 1: Navigate to profile from dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Click profile link in navigation
      const profileNavLink = page.locator('nav a[href="/profile"], nav a:has-text("Profile")').first();
      await expect(profileNavLink).toBeVisible({ timeout: 10_000 });
      await profileNavLink.click();
      
      // Wait for profile page
      await page.waitForURL(/\/profile/, { timeout: 10_000 });
      await page.waitForTimeout(2_000);

      // Verify profile page loaded
      const hasProfileContent = await page.locator('body').textContent().then(text => {
        return text && (text.includes('Profile') || text.includes('Edit Profile') || text.includes('Display Name'));
      }).catch(() => false);
      expect(hasProfileContent).toBe(true);
      expect(page.url()).toContain('/profile');

      // Step 2: Navigate to edit profile
      const editButton = page.locator('button:has-text("Edit Profile"), a[href="/profile/edit"]').first();
      const editButtonVisible = await editButton.isVisible({ timeout: 5_000 }).catch(() => false);
      
      if (editButtonVisible) {
        await editButton.click();
        await page.waitForURL(/\/profile\/edit/, { timeout: 10_000 });
        await page.waitForTimeout(2_000);

        // Verify edit page loaded
        const hasEditContent = await page.locator('body').textContent().then(text => {
          return text && (text.includes('Edit Profile') || text.includes('Display Name') || text.includes('Save'));
        }).catch(() => false);
        expect(hasEditContent).toBe(true);

        // Step 3: Go back to profile
        const backButton = page.locator('button:has-text("Back"), a[href="/profile"]').first();
        const backButtonVisible = await backButton.isVisible({ timeout: 5_000 }).catch(() => false);
        
        if (backButtonVisible) {
          await backButton.click();
          await page.waitForURL(/\/profile(?!\/edit)/, { timeout: 10_000 });
          await page.waitForTimeout(2_000);
          expect(page.url()).toContain('/profile');
          expect(page.url()).not.toContain('/edit');
        }
      }

      // Step 4: Navigate to preferences
      const preferencesLink = page.locator('a[href="/profile/preferences"], button:has-text("Settings")').first();
      const preferencesVisible = await preferencesLink.isVisible({ timeout: 5_000 }).catch(() => false);
      
      if (preferencesVisible) {
        await preferencesLink.click();
        await page.waitForURL(/\/profile\/preferences/, { timeout: 10_000 }).catch(() => {
          // Navigation may not happen if preferences link is not available
        });
        await page.waitForTimeout(2_000);

        // Verify preferences page loaded (if navigation worked)
        if (page.url().includes('/preferences')) {
          const hasPreferencesContent = await page.locator('body').textContent().then(text => {
            return text && (text.includes('Preferences') || text.includes('Interests'));
          }).catch(() => false);
          expect(hasPreferencesContent).toBe(true);
        }
      }

      // Final check: no React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React error #185') ||
        err.includes('Maximum update depth exceeded') ||
        err.includes('hydration')
      );

      if (reactErrors.length > 0) {
        console.log('React errors during journey:', reactErrors);
        await page.screenshot({ path: 'test-results/profile-journey-errors.png', fullPage: true });
      }

      expect(reactErrors.length).toBe(0);
    });

    test('profile page interactions work correctly', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
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

      // Navigate to profile
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Test export data button (should open dialog, not crash)
      const exportButton = page.locator('button:has-text("Export Data")').first();
      const exportButtonVisible = await exportButton.isVisible({ timeout: 5_000 }).catch(() => false);
      
      if (exportButtonVisible) {
        await exportButton.click();
        await page.waitForTimeout(1_000);

        // Check if dialog appeared (or button just worked without error)
        const dialog = page.locator('[role="dialog"], [data-testid*="export"]').first();
        const dialogVisible = await dialog.isVisible({ timeout: 2_000 }).catch(() => false);
        
        // If dialog appeared, close it
        if (dialogVisible) {
          const closeButton = page.locator('button:has-text("Cancel"), button[aria-label*="Close"]').first();
          await closeButton.click().catch(() => {
            // Close button may not be available
          });
          await page.waitForTimeout(500);
        }
      }

      // Verify page is still functional
      const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
      const hasContent = await page.locator('body').textContent().then(text => {
        return text && text.length > 100 && !text.includes('Something went wrong');
      }).catch(() => false);

      expect(spinnerVisible).toBe(false);
      expect(hasContent).toBe(true);
    });
  });

  test.describe('Profile Stability and Performance', () => {
    test('profile page does not trigger infinite re-renders', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Track console errors and warnings
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];
      const reactErrorCounts = {
        infiniteLoop: 0,
        hydration: 0,
        maximumUpdate: 0,
      };

      page.on('console', (msg) => {
        const text = msg.text();
        const type = msg.type();
        
        if (type === 'error') {
          consoleErrors.push(text);
          if (text.includes('Maximum update depth exceeded') || text.includes('React error #185')) {
            reactErrorCounts.infiniteLoop++;
          }
          if (text.includes('hydration')) {
            reactErrorCounts.hydration++;
          }
          if (text.includes('Maximum update depth')) {
            reactErrorCounts.maximumUpdate++;
          }
        } else if (type === 'warning') {
          consoleWarnings.push(text);
        }
      });

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to profile page
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      
      // Wait for initial render to complete
      await page.waitForTimeout(3_000);

      // Monitor for 10 seconds to detect infinite re-renders
      const startTime = Date.now();
      const monitorDuration = 10_000; // 10 seconds
      
      while (Date.now() - startTime < monitorDuration) {
        await page.waitForTimeout(1_000);
        
        // Check for React errors that indicate infinite loops
        if (reactErrorCounts.infiniteLoop > 0 || reactErrorCounts.maximumUpdate > 0) {
          await page.screenshot({ path: 'test-results/profile-infinite-render.png', fullPage: true });
          throw new Error(`Infinite re-render detected: ${reactErrorCounts.infiniteLoop} infinite loop errors, ${reactErrorCounts.maximumUpdate} maximum update errors`);
        }
      }

      // Final check: no critical React errors
      expect(reactErrorCounts.infiniteLoop).toBe(0);
      expect(reactErrorCounts.maximumUpdate).toBe(0);
      
      // Hydration errors are less critical but should be noted
      if (reactErrorCounts.hydration > 0) {
        console.warn(`Hydration errors detected: ${reactErrorCounts.hydration}`);
      }
    });

    test('profile edit page does not trigger infinite re-renders', async ({ page }) => {
      test.setTimeout(180_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Track console errors
      const consoleErrors: string[] = [];
      const reactErrorCounts = {
        infiniteLoop: 0,
        hydration: 0,
        maximumUpdate: 0,
      };

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          consoleErrors.push(text);
          if (text.includes('Maximum update depth exceeded') || text.includes('React error #185')) {
            reactErrorCounts.infiniteLoop++;
          }
          if (text.includes('hydration')) {
            reactErrorCounts.hydration++;
          }
          if (text.includes('Maximum update depth')) {
            reactErrorCounts.maximumUpdate++;
          }
        }
      });

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to profile edit page
      await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      
      // Wait for initial render to complete
      await page.waitForTimeout(3_000);

      // Monitor for 10 seconds to detect infinite re-renders
      const startTime = Date.now();
      const monitorDuration = 10_000; // 10 seconds
      
      while (Date.now() - startTime < monitorDuration) {
        await page.waitForTimeout(1_000);
        
        // Check for React errors that indicate infinite loops
        if (reactErrorCounts.infiniteLoop > 0 || reactErrorCounts.maximumUpdate > 0) {
          await page.screenshot({ path: 'test-results/profile-edit-infinite-render.png', fullPage: true });
          throw new Error(`Infinite re-render detected on edit page: ${reactErrorCounts.infiniteLoop} infinite loop errors, ${reactErrorCounts.maximumUpdate} maximum update errors`);
        }
      }

      // Final check: no critical React errors
      expect(reactErrorCounts.infiniteLoop).toBe(0);
      expect(reactErrorCounts.maximumUpdate).toBe(0);
    });
  });
});


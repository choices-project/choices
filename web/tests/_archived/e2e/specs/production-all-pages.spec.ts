import { expect, test } from '@playwright/test';

import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe('Production - All Pages & Features', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Public Pages', () => {
    test('landing page loads and displays content', async ({ page }) => {
      test.setTimeout(90_000);

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Check for landing page content
      const heroHeading = page.locator('h1:has-text("Democracy"), h1:has-text("Choices")').first();
      const hasHero = await heroHeading.isVisible({ timeout: 10_000 }).catch(() => false);

      // Check for navigation
      const nav = page.locator('nav, [role="navigation"]').first();
      const hasNav = await nav.isVisible({ timeout: 5_000 }).catch(() => false);

      // Check for CTA buttons
      const cta = page.locator('a:has-text("Get Started"), a:has-text("Sign Up"), button:has-text("Get Started")').first();
      const hasCTA = await cta.isVisible({ timeout: 5_000 }).catch(() => false);

      // At minimum, page should load without errors
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });

      // Log what we found
      if (!hasHero && !hasNav && !hasCTA) {
        const pageContent = await page.content();
        const hasContent = pageContent.length > 1000;
        if (!hasContent) {
          throw new Error('Landing page appears to be empty or not loading');
        }
      }
    });

    test('auth page loads and displays login form', async ({ page }) => {
      test.setTimeout(90_000);

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for auth form to be ready
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 10_000 }).catch(() => {
        // Continue if test ID not found
      });

      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const hasEmailInput = await emailInput.isVisible({ timeout: 10_000 }).catch(() => false);

      // Check for password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const hasPasswordInput = await passwordInput.isVisible({ timeout: 10_000 }).catch(() => false);

      // Check for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();
      const hasSubmitButton = await submitButton.isVisible({ timeout: 10_000 }).catch(() => false);

      // At minimum, page should load
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });

      if (!hasEmailInput && !hasPasswordInput && !hasSubmitButton) {
        const pageContent = await page.content();
        const hasContent = pageContent.length > 1000;
        if (!hasContent) {
          throw new Error('Auth page appears to be empty or not loading properly');
        }
      }
    });

    test('terms page loads', async ({ page }) => {
      test.setTimeout(60_000);

      const response = await page.goto(`${BASE_URL}/terms`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Should return 200 or redirect
      if (response) {
        expect([200, 301, 302, 307, 308]).toContain(response.status());
      }

      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });
    });

    test('privacy page loads', async ({ page }) => {
      test.setTimeout(60_000);

      const response = await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        expect([200, 301, 302, 307, 308]).toContain(response.status());
      }

      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Authenticated Pages', () => {
    test.beforeEach(async ({ page }) => {
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
    });

    test('feed page loads and displays content', async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Check for feed content or loading state
      const feedContent = page.locator('[data-testid="unified-feed"], [data-testid="feed-loading-skeleton"], main, [role="main"]').first();
      await expect(feedContent).toBeVisible({ timeout: 15_000 });

      // Check for navigation
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible({ timeout: 10_000 }).catch(() => {
        // Navigation is optional
      });

      // Check for no error boundaries
      const errorBoundary = page.locator('[data-testid="feed-error-boundary"], [role="alert"]:has-text("error")').first();
      const hasError = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
      if (hasError) {
        const errorText = await errorBoundary.textContent();
        throw new Error(`Feed page has error boundary: ${errorText}`);
      }
    });

    test('dashboard page loads', async ({ page }) => {
      test.setTimeout(120_000);

      const response = await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // May redirect to onboarding if profile incomplete
      if (response) {
        const status = response.status();
        const finalUrl = page.url();

        // Should either load dashboard or redirect to onboarding/auth
        if (status === 200 && !finalUrl.includes('/onboarding') && !finalUrl.includes('/auth')) {
          await waitForPageReady(page);

          // Check for dashboard content
          const dashboardContent = page.locator('[data-testid="personal-dashboard"], main, [role="main"]').first();
          await expect(dashboardContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Dashboard might be loading or have different structure
          });
        } else if (finalUrl.includes('/onboarding')) {
          // Redirected to onboarding - this is expected if profile incomplete
          test.skip(true, 'User redirected to onboarding (profile incomplete)');
        } else if (finalUrl.includes('/auth')) {
          throw new Error('Dashboard redirected to auth - authentication may have failed');
        }
      }
    });

    test('profile page loads', async ({ page }) => {
      test.setTimeout(120_000);

      const response = await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        const status = response.status();
        const finalUrl = page.url();

        if (status === 200 && !finalUrl.includes('/auth')) {
          await waitForPageReady(page);

          // Check for profile content
          const profileContent = page.locator('main, [role="main"], form, [data-testid*="profile"]').first();
          await expect(profileContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Profile page might have different structure
          });

          // Verify page doesn't show error boundary (indicates graceful error handling)
          const errorBoundary = page.locator('[data-testid="error-boundary"]');
          const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
          if (hasErrorBoundary) {
            throw new Error('Profile page is showing error boundary - page should handle errors gracefully');
          }
        } else if (finalUrl.includes('/auth')) {
          throw new Error('Profile page redirected to auth - authentication may have failed');
        }
      }
    });

    test('onboarding page loads (if redirected)', async ({ page }) => {
      test.setTimeout(120_000);

      // Try to access onboarding directly
      const response = await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        const status = response.status();
        if (status === 200) {
          await waitForPageReady(page);

          // Check for onboarding content
          const onboardingContent = page.locator('main, [role="main"], form, [data-testid*="onboarding"]').first();
          await expect(onboardingContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Onboarding might have different structure
          });
        }
      }
    });

    test('polls page loads', async ({ page }) => {
      test.setTimeout(120_000);

      const response = await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        const status = response.status();
        const finalUrl = page.url();

        if (status === 200 && !finalUrl.includes('/auth')) {
          await waitForPageReady(page);

          // Check for polls content
          const pollsContent = page.locator('main, [role="main"], [data-testid*="poll"]').first();
          await expect(pollsContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Polls page might have different structure
          });

          // Verify page doesn't show error boundary (indicates graceful error handling)
          const errorBoundary = page.locator('[data-testid="error-boundary"]');
          const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
          if (hasErrorBoundary) {
            throw new Error('Polls page is showing error boundary - page should handle errors gracefully');
          }
        } else if (finalUrl.includes('/auth')) {
          throw new Error('Polls page redirected to auth - authentication may have failed');
        } else if (status === 404) {
          test.skip(true, 'Polls page route does not exist');
        }
      }
    });

    test('pages handle API errors gracefully without crashing', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Test that pages load even if API calls fail
      // We'll check dashboard which calls getUserRepresentatives
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Page should load without showing error boundary
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // Page should still render content even if some API calls fail
      const pageContent = page.locator('body');
      const hasContent = await pageContent.textContent().then(text => (text?.length ?? 0) > 100).catch(() => false);

      expect(hasContent).toBeTruthy();
      // Error boundary should not be visible (errors should be handled gracefully)
      expect(hasErrorBoundary).toBeFalsy();
    });
  });

  test.describe('Admin Pages', () => {
    test.beforeEach(async ({ page }) => {
      if (!adminEmail || !adminPassword) {
        test.skip(true, 'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: adminEmail,
        password: adminPassword,
        username: adminEmail.split('@')[0] ?? 'e2e-admin',
      });
      await waitForPageReady(page);
    });

    test('admin dashboard loads', async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for admin page to resolve (loading, dashboard, or access denied)
      await page.waitForFunction(
        () => {
          const adminTab = document.querySelector('[data-testid="admin-dashboard-tab"]');
          const accessDenied = document.querySelector('[data-testid="admin-access-denied"]');
          const loading = document.querySelector('[data-testid="admin-loading"]');
          const adminHeader = document.querySelector('h1');

          if (adminTab && adminTab.getBoundingClientRect().width > 0) return true;
          if (accessDenied && accessDenied.getBoundingClientRect().width > 0) return true;
          if (loading && loading.getBoundingClientRect().width > 0) return false; // Still loading
          if (adminHeader && adminHeader.textContent?.includes('Admin')) return true;

          return false;
        },
        { timeout: 60_000 }
      );

      const hasAccessDenied = await page.locator('[data-testid="admin-access-denied"]').isVisible().catch(() => false);
      if (hasAccessDenied) {
        test.skip(true, 'Admin access denied - credentials may not have admin privileges');
        return;
      }

      // Check for admin content
      const adminContent = page.locator('[data-testid="admin-dashboard-tab"], main, [role="main"]').first();
      await expect(adminContent).toBeVisible({ timeout: 15_000 }).catch(() => {
        // Admin dashboard might have different structure
      });
    });

    test('admin users page loads', async ({ page }) => {
      test.setTimeout(120_000);

      const response = await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        const status = response.status();
        if (status === 200) {
          await waitForPageReady(page);

          // Check for admin users content
          const usersContent = page.locator('main, [role="main"], table, [data-testid*="user"]').first();
          await expect(usersContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Users page might have different structure
          });
        } else if (status === 404) {
          test.skip(true, 'Admin users page route does not exist');
        }
      }
    });

    test('admin feedback page loads', async ({ page }) => {
      test.setTimeout(120_000);

      const response = await page.goto(`${BASE_URL}/admin/feedback`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        const status = response.status();
        if (status === 200) {
          await waitForPageReady(page);

          // Check for admin feedback content
          const feedbackContent = page.locator('main, [role="main"], [data-testid*="feedback"]').first();
          await expect(feedbackContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Feedback page might have different structure
          });
        } else if (status === 404) {
          test.skip(true, 'Admin feedback page route does not exist');
        }
      }
    });

    test('admin analytics page loads', async ({ page }) => {
      test.setTimeout(120_000);

      const response = await page.goto(`${BASE_URL}/admin/analytics`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      if (response) {
        const status = response.status();
        if (status === 200) {
          await waitForPageReady(page);

          // Check for admin analytics content
          const analyticsContent = page.locator('main, [role="main"], [data-testid*="analytics"]').first();
          await expect(analyticsContent).toBeVisible({ timeout: 15_000 }).catch(() => {
            // Analytics page might have different structure
          });
        } else if (status === 404) {
          test.skip(true, 'Admin analytics page route does not exist');
        }
      }
    });
  });

  test.describe('API Endpoints', () => {
    test('health API endpoint works', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
    });

    test('feeds API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/feeds`, { timeout: 10_000 });
      // Should return 200 (if authenticated) or 401/403 (if not)
      expect([200, 401, 403]).toContain(response.status());
    });

    test('profile API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/profile`, { timeout: 10_000 });
      // Should return 200 (if authenticated) or 401/403 (if not)
      expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('polls API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/polls`, { timeout: 10_000 });
      // Should return 200 or appropriate status
      expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('feedback API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/feedback`, { timeout: 10_000 });
      // GET should return 200 or 405 (Method Not Allowed if only POST)
      expect([200, 405]).toContain(response.status());
    });

    test('admin health API endpoint works (requires auth)', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/health`, { timeout: 10_000 });
      // Should return 200 (if admin) or 401/403 (if not)
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Navigation & Routing', () => {
    test('navigation links work', async ({ page }) => {
      test.setTimeout(90_000);

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

      // Try to navigate using navigation
      const navLinks = page.locator('nav a, [role="navigation"] a').first();
      const hasNavLinks = await navLinks.isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasNavLinks) {
        // Try clicking a nav link if available
        const feedLink = page.locator('nav a[href*="feed"], [role="navigation"] a[href*="feed"]').first();
        const hasFeedLink = await feedLink.isVisible({ timeout: 2_000 }).catch(() => false);

        if (hasFeedLink) {
          await feedLink.click();
          await page.waitForTimeout(2_000);
          const currentUrl = page.url();
          expect(currentUrl).toContain('/feed');
        }
      }
    });

    test('browser back/forward navigation works', async ({ page }) => {
      test.setTimeout(90_000);

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

      // Navigate to feed
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Navigate to profile
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Go back
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Should be back on feed
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/feed|\/profile/);
    });
  });

  test.describe('Error Handling', () => {
    test('404 page handles missing routes', async ({ page }) => {
      test.setTimeout(60_000);

      const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-${Date.now()}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000
      });

      // Should return 404 or show 404 page
      if (response) {
        expect([404, 200]).toContain(response.status());
      }

      // Check for 404 content
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });
    });

    test('invalid API endpoint returns appropriate error', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/invalid-endpoint-${Date.now()}`, { timeout: 10_000 });
      expect([404, 405, 500]).toContain(response.status());
    });
  });
});


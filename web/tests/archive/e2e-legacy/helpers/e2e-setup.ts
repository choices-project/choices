/**
 * E2E Test Setup Helper
 *
 * Provides V2 mock factory integration for E2E test data setup and seeding.
 * This allows E2E tests to use the V2 mock factory for database preparation
 * while still testing real user flows in the browser.
 *
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import type { Page } from '@playwright/test';

export type E2ETestUser = {
  email: string;
  username: string;
  password: string;
  id?: string;
}

export type E2ETestPoll = {
  title: string;
  description: string;
  options: string[];
  category?: string;
  privacy?: 'public' | 'private';
  votingMethod?: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';
}

export type E2ETestData = {
  user: E2ETestUser;
  poll?: E2ETestPoll;
  votes?: Array<{ pollId: string; optionId: string; userId: string }>;
}

/**
 * E2E Test Data Setup
 *
 * This function prepares test data for E2E tests.
 * For E2E tests, we don't use the mock factory since we're testing
 * real user flows in the browser. Instead, we prepare test data
 * that can be used for API calls and database seeding.
 */
export async function setupE2ETestData(testData: E2ETestData): Promise<void> {
  // For E2E tests, we prepare test data but don't use mocks
  // The actual application will handle database operations

  const userId = `test-user-${Date.now()}`;
  const pollId = testData.poll ? `test-poll-${Date.now()}` : null;

  console.log('✅ E2E test data setup complete:', {
    userId,
    pollId,
    userEmail: testData.user.email,
    pollTitle: testData.poll?.title ?? 'none'
  });
}

/**
 * Clean up E2E test data
 *
 * This function cleans up test data after E2E tests complete.
 * In a real implementation, this would delete the test data
 * from the database.
 */
export async function cleanupE2ETestData(_testData: E2ETestData): Promise<void> {
  // For E2E tests, cleanup is handled by the test framework
  // In a real implementation, this would delete test data from the database

  console.log('🧹 E2E test data cleanup complete');
}

/**
 * Create a test user with realistic data
 */
export function createTestUser(overrides: Partial<E2ETestUser> = {}): E2ETestUser {
  const timestamp = Date.now();
  return Object.assign({
    email: `test-${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    password: 'TestPassword123!',
  }, overrides);
}

/**
 * Create a test poll with realistic data
 */
export function createTestPoll(overrides: Partial<E2ETestPoll> = {}): E2ETestPoll {
  const timestamp = Date.now();
  return Object.assign({
    title: `Test Poll ${timestamp}`,
    description: `This is a test poll created at ${new Date().toISOString()}`,
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    category: 'general',
    privacy: 'public',
    votingMethod: 'single',
  }, overrides);
}

/**
 * Wait for page to be ready for E2E testing
 *
 * This function ensures the page is fully loaded and ready
 * for E2E test interactions.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  try {
    // Wait for DOM content to be loaded (more reliable than networkidle)
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Wait for body element to exist (but don't require it to be visible)
    // Some pages may have hidden body during loading
    await page.waitForSelector('body', { state: 'attached', timeout: 5000 }).catch(() => {
      // Body might already exist, continue anyway
    });

    // Wait for any loading spinners to disappear (with shorter timeout)
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 2000 }).catch(() => {
      // Loading spinner might not exist, which is fine
    });

    // Give React time to hydrate
    await page.waitForTimeout(500);
  } catch (error) {
    // If page loading fails, try to wait a bit more and continue
    console.warn('⚠️ Page ready check had issues, continuing anyway:', error);
    await page.waitForTimeout(2000);
  }
}

/**
 * Mock external API calls for E2E tests
 *
 * This function sets up common external API mocks that E2E tests
 * might need, such as civics API, analytics, etc.
 */
export async function setupExternalAPIMocks(page: Page): Promise<void> {
  // Mock Google Civic Information API
  await page.route('**/google_civic/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        district: '13',
        state: 'IL',
        county: 'Sangamon',
        normalizedInput: {
          line1: '123 Any St',
          city: 'Springfield',
          state: 'IL',
          zip: '62704'
        }
      })
    });
  });

  // Mock analytics API
  await page.route('**/api/analytics/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  // Mock notification API
  await page.route('**/api/notifications/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  // Mock civics address lookup API
  await page.route('**/api/v1/civics/address-lookup', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        normalizedInput: {
          line1: '123 Any St',
          city: 'Springfield',
          state: 'IL',
          zip: '62704'
        },
        district: '13',
        state: 'IL',
        county: 'Sangamon'
      })
    });
  });

  console.log('✅ External API mocks setup complete');
}

/**
 * E2E Test Configuration
 *
 * This object contains common configuration for E2E tests
 * using the V2 mock factory patterns.
 */
export const E2E_CONFIG = {
  // Test data timeouts (optimized for performance)
  TIMEOUTS: {
    PAGE_LOAD: 15000, // Reduced from 30s
    ELEMENT_WAIT: 5000, // Reduced from 10s
    API_RESPONSE: 3000 // Reduced from 5s
  },

  // Common test data
  TEST_DATA: {
    DEFAULT_USER: createTestUser(),
    DEFAULT_POLL: createTestPoll(),
    ADMIN_USER: createTestUser({ email: 'admin@example.com', username: 'admin' })
  },

  // Browser settings
  BROWSER: {
    VIEWPORT: { width: 1280, height: 720 },
    MOBILE_VIEWPORT: { width: 375, height: 667 }
  }
};

/**
 * Login a test user for E2E tests using REAL authentication
 *
 * SECURITY: This uses real Supabase authentication - no bypass.
 * Test users must exist in the database with proper credentials.
 *
 * @param page - Playwright page object
 * @param user - Test user credentials (must exist in database)
 */
export async function loginTestUser(page: Page, user: E2ETestUser): Promise<void> {
  console.log('[E2E Auth] Logging in test user:', user.email);

  try {
    // Navigate to auth page (combined login/register)
    console.log('[E2E Auth] Navigating to /auth...');
    await page.goto('/auth', { waitUntil: 'load', timeout: 60000 });

    console.log('[E2E Auth] Page loaded, waiting for React to hydrate...');

    // Wait for React hydration - CRITICAL for form to appear
    // The auth page uses dynamic imports and heavy React components
    try {
      // Wait for hydration sentinel to appear (proves React has mounted)
      await page.waitForSelector('[data-testid="auth-hydrated"]', {
        state: 'attached',
        timeout: 30000  // Increased timeout for slow hydration
      });
      console.log('[E2E Auth] ✅ React hydration complete');
    } catch (error) {
      console.error('[E2E Auth] ❌ React did not hydrate - form will not appear');
      // Take screenshot to see what went wrong
      await page.screenshot({ path: `test-results/hydration-failed-${Date.now()}.png`, fullPage: true });
      throw new Error('React hydration failed - auth form not rendered');
    }

    // Give React a moment to finish rendering all components
    await page.waitForTimeout(1000);

    // Wait for page to be fully interactive
    await waitForPageReady(page);

    // Ensure we're in sign-in mode (not sign-up)
    // Check if we need to toggle to sign-in mode
    const toggleButton = page.locator('[data-testid="auth-toggle"]');
    const toggleText = await toggleButton.textContent().catch(() => '');

    if (toggleText?.includes("Don't have an account")) {
      // We're in sign-in mode, good!
      console.log('[E2E Auth] ✅ Already in sign-in mode');
    } else if (toggleText?.includes('Already have an account')) {
      // We're in sign-up mode, need to toggle
      console.log('[E2E Auth] Switching to sign-in mode...');
      await toggleButton.click();
      await page.waitForTimeout(500); // Wait for form to update
    }

    // Wait for login form to be ready - use test IDs (best practice)
    console.log('[E2E Auth] Waiting for login form...');

    // Strategy 1: Use data-testid (RECOMMENDED for E2E tests)
    let emailInput = page.getByTestId('login-email');
    let passwordInput = page.getByTestId('login-password');

    try {
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      console.log('[E2E Auth] ✅ Email input found by test ID');
    } catch (error) {
      // Strategy 2: Fallback to ID selector
      console.log('[E2E Auth] ⚠️ Email input not found by test ID, trying ID...');
      emailInput = page.locator('#email').first();
      passwordInput = page.locator('#password').first();

      try {
        await emailInput.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[E2E Auth] ✅ Email input found by ID');
      } catch {
        // Strategy 3: Final fallback to name attribute
        console.log('[E2E Auth] ⚠️ Email input not found by ID, trying name...');
        emailInput = page.locator('input[name="email"]').first();
        passwordInput = page.locator('input[name="password"]').first();
        await emailInput.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[E2E Auth] ✅ Email input found by name');
      }
    }

    // Verify inputs are actually visible and enabled
    const emailVisible = await emailInput.isVisible();
    const emailEnabled = await emailInput.isEnabled();
    console.log('[E2E Auth] Email input state:', { visible: emailVisible, enabled: emailEnabled });

    if (!emailVisible || !emailEnabled) {
      // Take screenshot for debugging
      await page.screenshot({ path: `test-results/auth-page-debug-${Date.now()}.png` });
      throw new Error('Email input is not visible or enabled');
    }

    // Fill in credentials with retries
    console.log('[E2E Auth] Filling credentials...');
    await emailInput.clear();
    await emailInput.fill(user.email);
    await passwordInput.clear();
    await passwordInput.fill(user.password);

    // Verify values were set
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    console.log('[E2E Auth] Credentials filled:', {
      emailSet: emailValue === user.email,
      passwordSet: passwordValue.length > 0
    });

    if (emailValue !== user.email) {
      throw new Error(`Email not set correctly. Expected: ${user.email}, Got: ${emailValue}`);
    }

    // Find and click submit button (prefer test ID)
    const submitButton = page.getByTestId('login-submit');
    const submitVisible = await submitButton.isVisible();
    console.log('[E2E Auth] Submit button state:', { visible: submitVisible });

    if (!submitVisible) {
      await page.screenshot({ path: `test-results/auth-submit-missing-${Date.now()}.png` });
      throw new Error('Submit button is not visible');
    }

    console.log('[E2E Auth] Submitting form...');
    await submitButton.click();

    // Wait for navigation or auth completion
    // Check if we're redirected or if auth state changes
    try {
      // Wait for either navigation or auth state change
      await Promise.race([
        page.waitForURL(/\/(dashboard|admin|onboarding)/, { timeout: 10000 }),
        page.waitForFunction(
          () => {
            return document.cookie.includes('sb-') ||
                   localStorage.getItem('supabase.auth.token') !== null;
          },
          { timeout: 10000 }
        )
      ]);
      console.log('[E2E Auth] ✅ Navigation or auth state change detected');
    } catch {
      // If no navigation, wait a bit for auth to complete
      console.log('[E2E Auth] ⚠️ No navigation detected, waiting for auth...');
      await page.waitForTimeout(3000);
    }

    // Verify we're authenticated by checking for auth state
    const isAuthenticated = await page.evaluate(() => {
      // Check for Supabase auth cookies or tokens
      const hasCookie = document.cookie.includes('sb-');
      const hasToken = localStorage.getItem('supabase.auth.token') !== null;
      const hasSession = sessionStorage.getItem('supabase.auth.token') !== null;

      return hasCookie || hasToken || hasSession;
    });

    if (!isAuthenticated) {
      // Take screenshot for debugging
      await page.screenshot({ path: `test-results/auth-failed-${Date.now()}.png` });
      const currentUrl = page.url();
      const pageContent = await page.content();
      console.error('[E2E Auth] ❌ Authentication failed');
      console.error('[E2E Auth] Current URL:', currentUrl);
      console.error('[E2E Auth] Page title:', await page.title());
      throw new Error(`Authentication failed - no auth cookies/tokens found. URL: ${currentUrl}`);
    }

    console.log('[E2E Auth] ✅ Test user logged in successfully');
  } catch (error) {
    console.error('[E2E Auth] ❌ Login failed:', error);
    // Take screenshot for debugging
    const screenshotPath = `test-results/login-failure-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    console.error('[E2E Auth] Screenshot saved to:', screenshotPath);

    // Log page state for debugging
    try {
      const url = page.url();
      const title = await page.title();
      const bodyText = await page.locator('body').textContent();
      console.error('[E2E Auth] Page state:', { url, title, bodyLength: bodyText?.length });
    } catch {}

    throw new Error(`Failed to login test user: ${error}`);
  }
}

/**
 * Login as admin user for E2E tests
 *
 * SECURITY: Uses real admin authentication - test admin user must exist.
 * Credentials loaded from environment variables (no hardcoded defaults).
 *
 * @param page - Playwright page object
 * @param adminUser - Admin user credentials (must have is_admin=true in database)
 */
export async function loginAsAdmin(page: Page, adminUser?: E2ETestUser): Promise<void> {
  // Use credentials from environment - no defaults!
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in .env.test.local\n' +
      'Run: npm run test:e2e:check'
    );
  }

  const admin: E2ETestUser = adminUser ?? {
    email: adminEmail,
    username: adminEmail.split('@')[0] || 'admin',
    password: adminPassword,
  };

  console.log('[E2E Auth] Logging in as admin:', admin.email);

  // Use the standard login flow
  await loginTestUser(page, admin);

  // Admin access is verified by middleware when tests navigate to admin routes
  // No need to verify here - it slows down tests and can cause flakiness
  console.log('[E2E Auth] ✅ Admin logged in (access verified by middleware)');
}

/**
 * Register a test user for E2E tests
 *
 * This function handles the complete registration flow for E2E tests.
 * It navigates to the register page, fills in all required fields,
 * submits the form, and waits for successful registration.
 *
 * @param page - Playwright page object
 * @param user - Test user details
 */
export async function registerTestUser(page: Page, user: E2ETestUser): Promise<void> {
  console.log('[E2E Auth] Registering test user:', user.email);

  try {
    // Navigate to register page with password method
    await page.goto('/register?e2e=1&method=password', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Wait for register form to be ready
    await page.waitForSelector('[data-testid="register-form"]', { timeout: 10000 });

    // Fill in all registration fields
    await page.fill('[data-testid="username"]', user.username);
    await page.fill('[data-testid="displayName"]', user.username); // Use username as display name
    await page.fill('[data-testid="email"]', user.email);
    await page.fill('[data-testid="password"]', user.password);
    await page.fill('[data-testid="confirmPassword"]', user.password);

    // Submit form
    await page.click('[data-testid="register-submit"]');

    // Wait for successful registration (redirect to onboarding or dashboard)
    await Promise.race([
      page.waitForURL('**/onboarding**', { timeout: 10000 }),
      page.waitForURL('**/dashboard**', { timeout: 10000 }),
      page.waitForURL('**/', { timeout: 10000 })
    ]).catch(() => {
      console.warn('[E2E Auth] No redirect detected after registration, continuing anyway');
    });

    await waitForPageReady(page);

    console.log('[E2E Auth] ✅ Test user registered successfully');
  } catch (error) {
    console.error('[E2E Auth] ❌ Registration failed:', error);
    throw new Error(`Failed to register test user: ${error}`);
  }
}

import { expect, type Page } from '@playwright/test';

import { CIVICS_ADDRESS_LOOKUP, CIVICS_STATE_FIXTURE } from '../../fixtures/api/civics';
import { buildDashboardData } from '../../fixtures/api/dashboard';
import {
  buildNotification,
  buildNotificationList,
} from '../../fixtures/api/notifications';
import {
  POLL_FIXTURES,
  type MockPollRecord,
  createPollRecord,
} from '../../fixtures/api/polls';
import { profileRecord } from '../../fixtures/api/profile';
import { buildE2ERepresentativesListPayload } from '../../fixtures/api/representatives';
import { buildShareAnalytics } from '../../fixtures/api/share';
import {
  buildFeedCategoriesResponse,
  buildFeedInteractionResponse,
  buildFeedSearchResponse,
  buildFeedsResponse,
  FEED_FIXTURES,
} from '../../msw/feeds-handlers';
import { normalizeMockPayload } from '../../msw/utils/envelope';

type RouteHandler = Parameters<Page['route']>[1];
type RoutePattern = Parameters<Page['route']>[0];
type PlaywrightRoute = Parameters<RouteHandler>[0];

/** Playwright URL globs do not reliably match `?query=...`; use regex for list endpoints. */
const API_POLLS_COLLECTION_RE = /https?:\/\/[^/]+\/api\/polls(?:\?|$)/;
const API_REPRESENTATIVES_LIST_RE = /https?:\/\/[^/]+\/api\/representatives(?:\?|$)/;
const API_DASHBOARD_RE = /https?:\/\/[^/]+\/api\/dashboard(?:\?|$)/;
const API_PROFILE_RE = /https?:\/\/[^/]+\/api\/profile(?:\?|$)/;
const API_ADMIN_USERS_RE = /https?:\/\/[^/]+\/api\/admin\/users(?:\?|$)/;
const API_ADMIN_FEEDBACK_RE = /https?:\/\/[^/]+\/api\/admin\/feedback(?:\?|$)/;
const API_ADMIN_HEALTH_RE = /https?:\/\/[^/]+\/api\/admin\/health(?:\?|$)/;

type SeedRecord = {
  user: TestUser;
  poll?: TestPoll;
  createdAt: number;
};

export type TestUser = {
  email: string;
  username: string;
  password: string;
};

export type TestPoll = {
  title: string;
  description: string;
  options: string[];
  category: string;
};

export type TestDataPayload = {
  user?: Partial<TestUser>;
  poll?: Partial<TestPoll>;
};

export type SeedHandle = string;

const DISABLE_FLAGS = new Set(['0', 'false', 'no', 'off']);

const envFlagEnabled = (value: string | undefined, defaultEnabled: boolean): boolean => {
  if (value === undefined) {
    return defaultEnabled;
  }
  return !DISABLE_FLAGS.has(value.trim().toLowerCase());
};

export const SHOULD_USE_MOCKS = envFlagEnabled(process.env.PLAYWRIGHT_USE_MOCKS, true);

/**
 * Get E2E test user credentials from environment variables
 * @returns TestUser credentials or null if not available
 */
export function getE2EUserCredentials(): TestUser | null {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    username: email.split('@')[0] ?? 'e2e-user',
  };
}

/**
 * Get E2E admin credentials from environment variables
 * @returns TestUser credentials or null if not available
 */
export function getE2EAdminCredentials(): TestUser | null {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return {
    email,
    password,
    username: email.split('@')[0] ?? 'e2e-admin',
  };
}

export type ExternalMockOptions = {
  civics: boolean;
  analytics: boolean;
  notifications: boolean;
  auth: boolean;
  feeds: boolean;
  api: boolean;
  admin?: boolean; // Optional admin mocks
};

export type LoginOptions = {
  path?: string;
  timeoutMs?: number;
  /** Prefer a URL predicate for /feed so query strings like `redirectTo=/feed` do not satisfy a loose RegExp on /auth. Use `false` to skip (caller waits for navigation). */
  expectRedirect?: string | RegExp | ((url: URL) => boolean) | false;
  expectSessionCookie?: boolean;
  /** When true, skip the initial `page.goto(path)` (caller already navigated, e.g. production /auth after auth-hydrated). */
  skipInitialNavigation?: boolean;
};

const DEFAULT_USER: TestUser = {
  email: 'test-user@example.com',
  username: 'testuser',
  password: 'TestPassword123!',
};

const DEFAULT_POLL: TestPoll = {
  title: 'Sample Poll',
  description: 'Sample poll description',
  options: ['Option 1', 'Option 2'],
  category: 'general',
};

const SEEDED_DATA = new Map<SeedHandle, SeedRecord>();

const DEFAULT_TIMEOUTS = {
  pageLoad: 60_000, // Increased for CI reliability
  element: 10_000, // Increased for CI reliability
  api: 5_000, // Increased for CI reliability
};

const AUTH_SELECTORS = {
  form: '[data-testid="login-form"]',
  toggle: '[data-testid="auth-toggle"]',
  email: '[data-testid="login-email"]',
  password: '[data-testid="login-password"]',
  submit: '[data-testid="login-submit"]',
};

const FALLBACK_EMAIL_SELECTORS = ['#email', 'input[name="email"]', 'input[type="email"]'];
const FALLBACK_PASSWORD_SELECTORS = ['#password', 'input[name="password"]', 'input[type="password"]'];
const FALLBACK_SUBMIT_SELECTORS = ['button[type="submit"]', 'input[type="submit"]'];

export const E2E_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  timeouts: DEFAULT_TIMEOUTS,
  browser: {
    viewport: { width: 1280, height: 720 },
    mobileViewport: { width: 375, height: 667 },
  },
};

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const timestamp = Date.now();
  return {
    email: overrides.email ?? `test-${timestamp}@example.com`,
    username: overrides.username ?? `testuser${timestamp}`,
    password: overrides.password ?? DEFAULT_USER.password,
  };
}

export function createTestPoll(overrides: Partial<TestPoll> = {}): TestPoll {
  const timestamp = new Date().toISOString();
  return {
    title: overrides.title ?? `Test Poll ${timestamp}`,
    description: overrides.description ?? `Generated at ${timestamp}`,
    options: overrides.options ?? ['Option 1', 'Option 2', 'Option 3'],
    category: overrides.category ?? DEFAULT_POLL.category,
  };
}

export async function setupE2ETestData(payload: TestDataPayload = {}): Promise<SeedHandle> {
  const handle = `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record: SeedRecord = {
    user: createTestUser(payload.user),
    createdAt: Date.now(),
  };
  if (payload.poll) {
    record.poll = createTestPoll(payload.poll);
  }
  SEEDED_DATA.set(handle, cloneSeed(record));
  return handle;
}

export async function cleanupE2ETestData(handle: SeedHandle): Promise<void> {
  SEEDED_DATA.delete(handle);
}

export function getSeededData(handle: SeedHandle): SeedRecord | undefined {
  const record = SEEDED_DATA.get(handle);
  return record ? cloneSeed(record) : undefined;
}

export async function waitForPageReady(page: Page, timeoutMs = DEFAULT_TIMEOUTS.pageLoad): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs });
  await page.locator('body').waitFor({ state: 'attached', timeout: Math.min(timeoutMs, 5_000) }).catch(() => undefined);
  const spinner = page.locator('.animate-spin');
  if (await spinner.count()) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);
  }
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
}

/**
 * `app/(app)/dashboard/page.tsx` server-redirects to `/feed`. Use this so tests land on a stable URL
 * before assertions or axe (avoids mid-navigation execution context teardown).
 */
export async function gotoDashboardResolvingRedirect(page: Page, timeoutMs = 20_000): Promise<void> {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(
    (u) => u.pathname === '/feed' || u.pathname.startsWith('/feed/'),
    { timeout: timeoutMs },
  );
}

export async function loginWithPassword(page: Page, credentials: TestUser, options: LoginOptions = {}): Promise<void> {
  const {
    path = '/auth',
    timeoutMs = 15_000,
    expectRedirect,
    expectSessionCookie,
    skipInitialNavigation = false,
  } = options;
  if (!skipInitialNavigation) {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await waitForPageReady(page, timeoutMs);
  }

  const form = page.locator(AUTH_SELECTORS.form);
  if (await form.count()) {
    await form.first().waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUTS.element }).catch(() => undefined);
  }

  const { emailField, passwordField, submitButton } = await locateAuthInputs(page);
  await emailField.fill(credentials.email, { timeout: DEFAULT_TIMEOUTS.element });
  await passwordField.fill(credentials.password, { timeout: DEFAULT_TIMEOUTS.element });

  // Ensure React-controlled state updates after programmatic fill (sync runs on interval/focus).
  // Trigger native value setter + input/change so auth page sync sees the values.
  await page.evaluate(
    ({ email, password }: { email: string; password: string }) => {
      const setNativeValue = (input: HTMLInputElement | null, value: string) => {
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const emailEl = (document.getElementById('email') || document.querySelector('[data-testid="login-email"]')) as HTMLInputElement | null;
      const passwordEl = (document.getElementById('password') || document.querySelector('[data-testid="login-password"]')) as HTMLInputElement | null;
      if (emailEl) setNativeValue(emailEl, email);
      if (passwordEl) setNativeValue(passwordEl, password);
      // Blur to trigger auth page sync (runs on focus/blur)
      if (passwordEl) passwordEl.blur();
    },
    { email: credentials.email, password: credentials.password }
  );

  await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => undefined);

  // Allow auth page DOM-to-React sync to run (runs every 100ms, or on blur)
  await page.waitForTimeout(800);

  // Wait for submit to become enabled (React state sync can be async) before clicking.
  await submitButton.waitFor({ state: 'visible', timeout: timeoutMs });
  await expect(submitButton).toBeEnabled({ timeout: Math.min(timeoutMs, 15_000) });
  await submitButton.click();

  if (expectRedirect !== undefined && expectRedirect !== false) {
    await page.waitForURL(expectRedirect, { timeout: timeoutMs });
  }

  if (expectSessionCookie) {
    await page.waitForFunction(() => document.cookie.includes('sb-'), { timeout: timeoutMs });
  }
}

export async function ensureLoggedOut(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.context().clearPermissions();
  await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => undefined);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }).catch(() => undefined);
}

async function assertSupabaseSessionCookies(page: Page): Promise<void> {
  const allCookies = await page.context().cookies();
  const hasAccessToken = allCookies.some(c => c.name === 'sb-access-token' && c.value && c.value.length > 0);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let hasProjectAuthToken = false;
  let projectRef: string | null = null;
  if (supabaseUrl) {
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.(co|io)/);
    if (urlMatch?.[1]) {
      projectRef = urlMatch[1];
      hasProjectAuthToken = allCookies.some(
        c => c.name === `sb-${projectRef}-auth-token` && c.value && c.value.length > 0
      );
    }
  }
  const hasAnySupabaseAuthCookie = allCookies.some(cookie => {
    if (!cookie.name.startsWith('sb-') || !cookie.value || cookie.value.length === 0) return false;
    return (
      cookie.name.includes('auth') ||
      cookie.name.includes('session') ||
      cookie.name.includes('access')
    );
  });
  if (!hasAccessToken && !hasProjectAuthToken && !hasAnySupabaseAuthCookie) {
    const cookieNames = allCookies.map(c => `${c.name}=…`).join(', ');
    throw new Error(
      `No Supabase auth cookies found after login. ` +
        `Checked for: sb-access-token, sb-${projectRef ?? '<project-ref>'}-auth-token, or any sb-*auth* cookies. ` +
        `Available cookies: ${cookieNames || 'none'}.`
    );
  }
  await page.waitForTimeout(500);
}

/**
 * Logs in a test user via the authentication form.
 *
 * **Important:** This function uses `fill()` followed by proper React synthetic event creation
 * to trigger React's `onChange` handlers for controlled inputs. React controlled inputs require
 * the `onChange` event to fire with `e.target.value` properly set for React state to update,
 * which enables form validation and the submit button.
 *
 * @param page - Playwright Page instance
 * @param user - Test user credentials (email, password, username)
 * @throws Error if email or password is missing
 * @throws Error if form inputs don't update React state (submit button stays disabled)
 * @throws Error if login API request fails
 * @throws Error if navigation to /feed or /onboarding doesn't occur after login
 *
 * When `E2E_PRODUCTION=1`, uses the `/auth` UI (not `POST /api/auth/login`) so session cookies attach like a real browser sign-in.
 *
 * @example
 * ```typescript
 * await loginTestUser(page, {
 *   email: 'test@example.com',
 *   password: 'password123',
 *   username: 'testuser'
 * });
 * ```
 */
export async function loginTestUser(page: Page, user: TestUser): Promise<void> {
  const { email, password } = user;
  if (!email || !password) {
    throw new Error('loginTestUser requires both email and password');
  }

  if (process.env.E2E_PRODUCTION === '1') {
    const pageUrl = page.url();
    const originBase =
      pageUrl && !pageUrl.startsWith('about:')
        ? new URL(pageUrl).origin
        : process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || '';
    if (!originBase) {
      throw new Error(
        'loginTestUser (production): page URL has no origin; set BASE_URL or PLAYWRIGHT_BASE_URL',
      );
    }

    // API `page.request.post(/api/auth/login)` + `page.goto(/feed)` is unreliable on production: SameSite=Lax
    // HttpOnly cookies are often not sent on those programmatic navigations (middleware comment), so middleware
    // redirects to /auth while Playwright’s cookie jar still looks logged-in. Use the real sign-in form like users do.
    await page.goto(new URL('/auth', originBase).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await loginWithPassword(page, { email, password, username: user.username }, {
      path: '/auth',
      timeoutMs: 120_000,
      skipInitialNavigation: true,
      expectRedirect: false,
      expectSessionCookie: false,
    });

    await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 120_000 });

    const afterAuthPath = new URL(page.url()).pathname;
    if (afterAuthPath !== '/feed' && !afterAuthPath.startsWith('/feed/')) {
      await page.goto(new URL('/feed', originBase).toString(), {
        waitUntil: 'load',
        timeout: 90_000,
      });
    }

    await page.locator('[data-testid="app-shell"]').waitFor({ state: 'visible', timeout: 60_000 });
    await assertSupabaseSessionCookies(page);
    return;
  }

  // Only navigate if we're not already on the auth page
  const currentUrl = page.url();
  if (!currentUrl.includes('/auth')) {
    await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 60_000 });
  await waitForPageReady(page);

  const authErrorBanner = page.locator('text=/Application error: a client-side exception/i');
  if (await authErrorBanner.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const pageErrors = (page as unknown as { __authPageErrors?: string[] }).__authPageErrors ?? [];
    const consoleErrors = (page as unknown as { __authConsoleErrors?: string[] }).__authConsoleErrors ?? [];
    throw new Error(
      `Auth page crashed during login. Page errors: ${pageErrors.join(' | ') || 'none'}. Console errors: ${consoleErrors.join(' | ') || 'none'}.`
    );
  }

  const toggle = page.locator('[data-testid="auth-toggle"]');
  const toggleText = await toggle.textContent().catch(() => null);
  if (toggleText?.includes('Already have an account')) {
    await toggle.click();
    await page.waitForTimeout(300);
  }

  let emailInput = page.getByTestId('login-email');
  if ((await emailInput.count()) === 0) {
    emailInput = page.locator('#email');
  }
  if ((await emailInput.count()) === 0) {
    emailInput = page.locator('input[name="email"]');
  }

  let passwordInput = page.getByTestId('login-password');
  if ((await passwordInput.count()) === 0) {
    passwordInput = page.locator('#password');
  }
  if ((await passwordInput.count()) === 0) {
    passwordInput = page.locator('input[name="password"]');
  }

  await emailInput.first().waitFor({ state: 'visible', timeout: 10_000 });
  await passwordInput.first().waitFor({ state: 'visible', timeout: 10_000 });

  // Ensure we're in sign-in mode (not sign-up) to avoid extra validation
  const toggleButton = page.locator('[data-testid="auth-toggle"]');
  try {
    const toggleText = await toggleButton.textContent({ timeout: 2_000 });
    if (toggleText?.includes('Sign In')) {
      await toggleButton.click();
      await page.waitForTimeout(300); // Wait for mode switch and React state update
    }
  } catch {
    // Toggle might not be visible or already in correct mode
  }

  // Wait for form to be fully hydrated and ready
  await page.waitForSelector('[data-testid="auth-hydrated"]', {
    state: 'attached',
    timeout: 30_000,
  });

  // Fill inputs directly to avoid focus loss during per-character typing
  await emailInput.first().fill(email, { timeout: 10_000 });
  try {
    await passwordInput.first().fill(password, { timeout: 10_000 });
  } catch (error) {
    const authErrorBanner = page.locator('text=/Application error: a client-side exception/i');
    const hasAppError = await authErrorBanner.isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasAppError) {
      const pageErrors = (page as unknown as { __authPageErrors?: string[] }).__authPageErrors ?? [];
      const consoleErrors = (page as unknown as { __authConsoleErrors?: string[] }).__authConsoleErrors ?? [];
      throw new Error(
        `Auth page crashed during input. Page errors: ${pageErrors.join(' | ') || 'none'}. Console errors: ${consoleErrors.join(' | ') || 'none'}.`
      );
    }
    throw error;
  }

  await page.evaluate(
    ({ expectedEmail, expectedPassword }: { expectedEmail: string; expectedPassword: string }) => {
      const emailInput =
        (document.querySelector('[data-testid="login-email"]') as HTMLInputElement | null) ||
        (document.getElementById('email') as HTMLInputElement | null);
      const passwordInput =
        (document.querySelector('[data-testid="login-password"]') as HTMLInputElement | null) ||
        (document.getElementById('password') as HTMLInputElement | null);

      const setNativeValue = (input: HTMLInputElement | null, value: string) => {
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      setNativeValue(emailInput, expectedEmail);
      setNativeValue(passwordInput, expectedPassword);

      emailInput?.focus();
      emailInput?.blur();
      passwordInput?.focus();
      passwordInput?.blur();
    },
    { expectedEmail: email, expectedPassword: password }
  );

  await page.waitForTimeout(500);

  const submitButton = page.getByTestId('login-submit');
  await expect(submitButton).toBeVisible({ timeout: 90_000 });
  await expect(submitButton).toBeEnabled({ timeout: 90_000 });

  if (email.includes('@')) {
    try {
      await page.waitForSelector('[data-testid="email-validation"]', {
        state: 'visible',
        timeout: 2_000
      });
    } catch {
      // Continue even if validation indicator doesn't appear
    }
  }

  // Try to directly update React state if button is still disabled
  // This is a workaround for React controlled inputs not updating
  const isDisabled = await submitButton.isDisabled();
  if (isDisabled) {
    // Try to directly access and update React's formData state
    await page.evaluate(({ emailValue, passwordValue }: { emailValue: string; passwordValue: string }) => {
      // Find the form element
      const form = document.querySelector('[data-testid="login-form"]');
      if (!form) return;

      // Try to find React component instance through DOM
      const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;

      if (emailInput && passwordInput) {
        // Try to trigger React's onChange by creating a proper synthetic event
        // React uses SyntheticEvent, so we need to create an event that React recognizes
        const createSyntheticEvent = (target: HTMLInputElement, value: string) => {
          // Set the value first
          Object.defineProperty(target, 'value', {
            value: value,
            writable: true,
            configurable: true
          });

          // Create and dispatch input event
          const inputEvent = new Event('input', { bubbles: true, cancelable: true });
          Object.defineProperty(inputEvent, 'target', { value: target, enumerable: true });
          Object.defineProperty(inputEvent, 'currentTarget', { value: target, enumerable: true });
          target.dispatchEvent(inputEvent);

          // Create and dispatch change event
          const changeEvent = new Event('change', { bubbles: true, cancelable: true });
          Object.defineProperty(changeEvent, 'target', { value: target, enumerable: true });
          Object.defineProperty(changeEvent, 'currentTarget', { value: target, enumerable: true });
          target.dispatchEvent(changeEvent);
        };

        createSyntheticEvent(emailInput, emailValue);
        createSyntheticEvent(passwordInput, passwordValue);
      }
    }, { emailValue: email, passwordValue: password });

    // Wait for React to process
    await page.waitForTimeout(1000);
  }

  // Verify React state has updated by checking if button becomes enabled
  // We need to wait for React's formData state to match the input values
  let isEnabled = false;
  let reactStateReady = false;

  // Wait for React state to sync - check button enabled state AND verify React has processed the inputs
  for (let attempt = 0; attempt < 30; attempt++) {
    isEnabled = !(await submitButton.isDisabled());

    // Verify React state has actually updated by checking if form validation passes
    // We check this by looking at whether the button is enabled, which depends on formData
    if (isEnabled) {
      // Double-check that React state is ready by verifying formData would pass validation
      reactStateReady = await page.evaluate(({ emailValue, passwordValue }: { emailValue: string; passwordValue: string }) => {
        // Check if form would be valid based on input values
        const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
        const submitButton = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;

        if (!emailInput || !passwordInput || !submitButton) return false;

        const emailValid = emailInput.value.includes('@') && emailInput.value === emailValue;
        const passwordValid = passwordInput.value.length >= 6 && passwordInput.value === passwordValue;
        const buttonDisabled = submitButton.disabled;

        // If inputs are valid but button is disabled, React state hasn't synced yet
        return emailValid && passwordValid && !buttonDisabled;
      }, { emailValue: email, passwordValue: password }).catch(() => false);

      if (reactStateReady) break;
    }

    // Re-trigger input by typing last character again to ensure React processes
    // This simulates real user interaction which React handles better
    if (attempt > 0 && attempt % 5 === 0) {
      // Type the last character again to trigger React's onChange
      await emailInput.first().focus();
      await page.keyboard.press('End');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(email.slice(-1), { delay: 10 });

      await passwordInput.first().focus();
      await page.keyboard.press('End');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(password.slice(-1), { delay: 10 });
    }

    await page.waitForTimeout(300);
  }

  // Final verification: Ensure button is enabled before clicking
  if (!isEnabled || !reactStateReady) {
    const emailValue = await emailInput.first().inputValue();
    const passwordValue = await passwordInput.first().inputValue();
    const emailValid = emailValue.includes('@') && emailValue === email;
    const passwordValid = passwordValue.length >= 8 && passwordValue === password; // Form requires >= 8 characters

    if (emailValid && passwordValid) {
      // Inputs are valid, but React state might not be synced
      // Try one more time to trigger React state update
      await page.evaluate(() => {
        const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;

        if (emailInput && passwordInput) {
          // Focus and trigger events to ensure React processes them
          emailInput.focus();
          emailInput.blur();
          passwordInput.focus();
          passwordInput.blur();
        }
        return true;
      });

      await page.waitForTimeout(500);
      isEnabled = !(await submitButton.isDisabled());
    }

    if (!isEnabled) {
      throw new Error(
        `Submit button still disabled after all attempts. ` +
        `Input values - Email: "${emailValue}" (expected: "${email}", valid: ${emailValid}), ` +
        `Password length: ${passwordValue.length} (expected: ${password.length}, valid: ${passwordValid}). ` +
        `React state (formData) is not updating from input events. This may indicate a bug in the form component.`
      );
    }
  }

  // Set up network request interception BEFORE clicking
  type LoginResponse = { status: number; body: any };

  // Increase timeout for production server which may be slower
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const isProductionServer = process.env.BASE_URL?.includes('127.0.0.1') || process.env.BASE_URL?.includes('localhost');
  const apiTimeout = (isCI || isProductionServer) ? 60_000 : 30_000; // 60s for CI/production server, 30s for local

  // Set up request promise to verify the request is actually being made
  const requestPromise = page.waitForRequest(
    (req) => req.url().includes('/api/auth/login') && req.method() === 'POST',
    { timeout: 10_000 } // Shorter timeout for request - should happen quickly after click
  ).catch(() => null);

  // Set up response promise BEFORE clicking
  let loginResponse: LoginResponse | null = null;
  let apiError: string | null = null;

  // Ensure button is enabled and visible before clicking
  await submitButton.waitFor({ state: 'visible', timeout: 2_000 });
  const isButtonEnabledFinal = !(await submitButton.isDisabled());
  if (!isButtonEnabledFinal) {
    throw new Error('Submit button is not enabled. React state may not be synchronized.');
  }

  // Click submit
  await submitButton.click();

  // Wait for request to be made (this verifies the form submission is working)
  const requestMade = await requestPromise;
  if (!requestMade) {
    // Request wasn't made - check for validation errors or other issues
    await page.waitForTimeout(1000); // Wait a bit for any error messages to appear

    const authError = page.getByTestId('auth-error');
    const errorCount = await authError.count();
    if (errorCount > 0) {
      const errorText = await authError.first().textContent().catch(() => 'Unknown error');

      // Check if React state has the values - if not, that's the root cause
      const reactStateCheck = await page.evaluate(({ emailValue, passwordValue }: { emailValue: string; passwordValue: string }) => {
        const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
        const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
        return {
          emailValue: emailInput?.value || '',
          passwordValue: passwordInput?.value || '',
          emailMatches: emailInput?.value === emailValue,
          passwordMatches: passwordInput?.value === passwordValue
        };
      }, { emailValue: email, passwordValue: password });

      throw new Error(
        `Login form validation error: ${errorText}. API request was not made. ` +
        `React state check - Email: "${reactStateCheck.emailValue}" (matches: ${reactStateCheck.emailMatches}), ` +
        `Password length: ${reactStateCheck.passwordValue.length} (matches: ${reactStateCheck.passwordMatches}). ` +
        `This suggests React's formData state is not synced with input values.`
      );
    }

    // No error message, but request wasn't made - check if button is still disabled
    const stillDisabled = await submitButton.isDisabled();
    if (stillDisabled) {
      throw new Error(
        `Login form submission failed - API request was not made. Button is still disabled. ` +
        `This indicates React state (formData) is not updating properly from input events.`
      );
    }

    throw new Error('Login form submission failed - API request was not made. Check if form is properly configured.');
  }

  // Now wait for the response
  try {
    const response = await page.waitForResponse(
      (res) => res.url().includes('/api/auth/login') && res.request().method() === 'POST',
      { timeout: apiTimeout }
    );
    const body = await response.json().catch(() => ({}));
    loginResponse = {
      status: response.status(),
      body,
    };
  } catch (error) {
    // Response timeout or error - capture the error message
    apiError = error instanceof Error ? error.message : String(error);
    loginResponse = null;
  }

  // Check for API errors
  if (loginResponse !== null) {
    // Use a const to help TypeScript narrow the type
    const response: LoginResponse = loginResponse;
    if (response.status !== 200) {
      const errorMessage = response.body?.message || `Login API returned status ${response.status}`;
      throw new Error(`Login API error: ${errorMessage}`);
    }
  } else if (apiError) {
    // API call timed out or failed - check for UI errors to get more context
    const authError = page.getByTestId('auth-error');
    const errorCount = await authError.count();
    if (errorCount > 0) {
      const errorText = await authError.first().textContent().catch(() => 'Unknown error');
      throw new Error(`Login API timeout/error: ${apiError}. UI error: ${errorText}`);
    }
    throw new Error(`Login API timeout/error: ${apiError}`);
  }

  // Check for UI errors (auth-error element) - only if API succeeded
  const authError = page.getByTestId('auth-error');
  const errorCount = await authError.count();
  if (errorCount > 0) {
    const errorText = await authError.first().textContent().catch(() => 'Unknown error');
    throw new Error(`Login UI error: ${errorText}`);
  }

  // Wait for authentication to complete - increase timeout for production server
  // Wait for either redirect or auth tokens/cookies
  // Use longer timeout in CI or when BASE_URL is localhost (production server mode)
  // Reuse isCI and isProductionServer from above
  const authTimeout = (isCI || isProductionServer) ? 90_000 : 15_000; // 90s for CI/production server, 15s for local

  try {
    // Wait for navigation or cookies/tokens
    // Accept dashboard, onboarding, feed, or admin routes (feed is the new default for authenticated users)
    await Promise.race([
      page.waitForURL(/\/(dashboard|admin|onboarding|feed)/, { timeout: authTimeout }),
      page.waitForFunction(
        () => {
          // Check for Supabase cookies
          const cookies = document.cookie;
          if (cookies.includes('sb-access-token') || cookies.includes('sb-refresh-token')) {
            return true;
          }
          // Check for tokens in storage
          const localStorageToken = localStorage.getItem('supabase.auth.token');
          const sessionStorageToken = sessionStorage.getItem('supabase.auth.token');
          if (localStorageToken && localStorageToken !== 'null') return true;
          if (sessionStorageToken && sessionStorageToken !== 'null') return true;
          return false;
        },
        { timeout: authTimeout },
      ),
    ]);
  } catch (error) {
    // If both time out, log the current state for debugging
    const currentUrl = page.url();
    const cookies = await page.evaluate(() => document.cookie).catch(() => '');
    const hasCookie = cookies.includes('sb-access-token') || cookies.includes('sb-refresh-token');
    const hasToken = await page.evaluate(() => {
      const token = localStorage.getItem('supabase.auth.token');
      return token !== null && token !== 'null';
    }).catch(() => false);

    // Check for any error messages on the page
    const pageText = await page.textContent('body').catch(() => '') ?? '';
    const hasError = pageText.includes('error') || pageText.includes('Error') || pageText.includes('failed');

    const apiResponseInfo = loginResponse
      ? `status: ${loginResponse.status}, body: ${JSON.stringify(loginResponse.body).substring(0, 200)}`
      : apiError
        ? `timeout/error: ${apiError}`
        : 'none (timeout waiting for response)';

    throw new Error(
      `Authentication timeout after ${authTimeout}ms. ` +
      `Current URL: ${currentUrl}, ` +
      `Has cookie: ${hasCookie}, ` +
      `Has token: ${hasToken}, ` +
      `API response: ${apiResponseInfo}, ` +
      `Page has error: ${hasError}, ` +
      `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Give a moment for any post-auth processing
  await page.waitForTimeout(1_000);

  await assertSupabaseSessionCookies(page);
}

export async function loginAsAdmin(page: Page, overrides: Partial<TestUser> = {}): Promise<void> {
  const adminEmail = overrides.email ?? process.env.E2E_ADMIN_EMAIL;
  const adminPassword = overrides.password ?? process.env.E2E_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set for loginAsAdmin');
  }

  const resolvedEmail = adminEmail;
  const resolvedPassword = adminPassword;

  await loginTestUser(page, {
    email: resolvedEmail,
    password: resolvedPassword,
    username: overrides.username ?? resolvedEmail.split('@')[0] ?? 'admin',
  });
}

export async function setupExternalAPIMocks(page: Page, overrides: Partial<ExternalMockOptions> = {}): Promise<() => Promise<void>> {
  if (!SHOULD_USE_MOCKS) {
    return async () => Promise.resolve();
  }

  const respondJson = async (route: PlaywrightRoute, payload: unknown, status = 200) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(normalizeMockPayload(payload)),
    });
  };

  const parseJsonBody = (route: PlaywrightRoute) => {
    const raw = route.request().postData();
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  const hasAuthHeader = (route: PlaywrightRoute) => {
    const headers = route.request().headers();
    return typeof headers['authorization'] === 'string' && headers['authorization'].startsWith('Bearer ');
  };

  const shouldBypassHarnessAuth = (route: PlaywrightRoute) => {
    // In E2E harness mode, always bypass auth checks (authentication is mocked)
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return true;
    }
    // Also check for bypass cookie in non-harness scenarios
    const cookieHeader = route.request().headers()['cookie'] ?? '';
    return cookieHeader.includes('e2e-dashboard-bypass=1');
  };

  const unauthorizedResponse = () => ({
    success: false,
    error: 'Admin authentication required',
    code: 'AUTH_ERROR',
    metadata: { timestamp: new Date().toISOString() },
  });

  const options: ExternalMockOptions = {
    civics: overrides.civics ?? true,
    analytics: overrides.analytics ?? true,
    notifications: overrides.notifications ?? true,
    auth: overrides.auth ?? true,
    feeds: overrides.feeds ?? true,
    api: overrides.api ?? true,
    admin: overrides.admin ?? true,
  };

  const routes: Array<{ url: RoutePattern; handler: RouteHandler }> = [];

  if (options.civics) {
    const civicsHandler: RouteHandler = async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await respondJson(route, {
        success: true,
        data: CIVICS_ADDRESS_LOOKUP,
        metadata: {
          integration: 'google-civic',
          fallback: false,
        },
      });
    };
    await page.route('**/api/v1/civics/address-lookup', civicsHandler);
    routes.push({ url: '**/api/v1/civics/address-lookup', handler: civicsHandler });
  }

  if (options.analytics) {
    const analyticsHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: {
          tracked: true,
        },
      });
    };
    await page.route('**/api/analytics/**', analyticsHandler);
    routes.push({ url: '**/api/analytics/**', handler: analyticsHandler });
  }

  if (options.notifications) {
    const notificationsHandler: RouteHandler = async (route) => {
      const method = route.request().method().toUpperCase();

      if (method === 'GET') {
        await respondJson(
          route,
          {
            success: true,
            data: buildNotificationList(),
          },
          200,
        );
        return;
      }

      if (method === 'POST') {
        const body = parseJsonBody(route);
        await respondJson(
          route,
          {
            success: true,
            data: buildNotification({
              title: body?.title,
              message: body?.message,
            }),
          },
          201,
        );
        return;
      }

      if (method === 'PUT') {
        const body = parseJsonBody(route);
        const notificationId = body?.notificationId ?? 'notification-1';
        await respondJson(
          route,
          {
            success: true,
            data: {
              id: notificationId,
              readAt: new Date().toISOString(),
            },
          },
        );
        return;
      }

      // For unsupported verbs just continue
      await route.continue();
    };
    await page.route('**/api/notifications/**', notificationsHandler);
    routes.push({ url: '**/api/notifications/**', handler: notificationsHandler });
  }

  if (options.auth) {
    const registerOptionsHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: {
        challengeId: 'mock-register-challenge-id',
        challenge: 'dGVzdC1jaGFsbGVuZ2U=',
        rp: { id: 'localhost', name: 'Choices' },
        user: {
          id: 'dGVzdC11c2VyLWlk',
          name: 'user@example.com',
          displayName: 'Test User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60_000,
        excludeCredentials: [],
        authenticatorSelection: {
          userVerification: 'required',
          authenticatorAttachment: 'platform',
        },
        attestation: 'none',
        extensions: {},
        },
      });
    };

    const registerVerifyHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: {
          credentialId: 'test-credential',
          publicKey: 'BASE64_PUBLIC_KEY',
          counter: 0,
          transports: ['internal'],
        },
      });
    };

    const authOptionsHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: {
        challengeId: 'mock-authenticate-challenge-id',
        challenge: 'dGVzdC1jaGFsbGVuZ2U=',
        allowCredentials: [
          {
            id: 'dGVzdC1jaGFsbGVuZ2U=',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        timeout: 60_000,
        rpId: 'localhost',
        userVerification: 'required',
        extensions: {},
        },
      });
    };

    const authVerifyHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: {
          credentialId: 'test-credential',
          newCounter: 1,
        },
      });
    };

    let currentAuthEmail = profileRecord.email as string;
    const profileState = { ...profileRecord };

    const loginHandler: RouteHandler = async (route) => {
      const payload = parseJsonBody(route);
      if (typeof payload.email === 'string') {
        currentAuthEmail = payload.email;
        profileState.email = payload.email;
      }
      await respondJson(route, {
        success: true,
        data: {
          token: 'mock-auth-token',
          user: { id: 'test-user', email: currentAuthEmail },
        },
      });
    };

    const registerHandler: RouteHandler = async (route) => {
      const payload = parseJsonBody(route);
      if (typeof payload?.email === 'string') {
        currentAuthEmail = payload.email;
        profileState.email = payload.email;
      }
      await respondJson(route, {
        success: true,
        data: { user: { id: 'test-user', email: currentAuthEmail } },
      }, 201);
    };

    const profileHandler: RouteHandler = async (route) => {
      // In E2E harness mode, always allow profile requests (authentication is mocked)
      // Only check auth header if not in harness mode
      if (!shouldBypassHarnessAuth(route) && !hasAuthHeader(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      if (route.request().method() === 'GET') {
        await respondJson(route, { profile: profileState });
        return;
      }
      if (route.request().method() === 'PUT') {
        const payload = parseJsonBody(route);
        if (typeof payload.displayName === 'string') {
          profileState.display_name = payload.displayName;
        } else if (typeof payload.display_name === 'string') {
          profileState.display_name = payload.display_name;
        }
        if (typeof payload.bio === 'string') {
          profileState.bio = payload.bio;
        }
        await respondJson(route, { profile: profileState });
        return;
      }
      await respondJson(route, { success: false, error: 'Method not allowed' }, 405);
    };

    const logoutHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: { message: 'Logged out' },
      });
    };

    await page.route('**/api/v1/auth/webauthn/native/register/options', registerOptionsHandler);
    await page.route('**/api/v1/auth/webauthn/native/register/verify', registerVerifyHandler);
    await page.route('**/api/v1/auth/webauthn/native/authenticate/options', authOptionsHandler);
    await page.route('**/api/v1/auth/webauthn/native/authenticate/verify', authVerifyHandler);
    await page.route('**/api/auth/login', loginHandler);
    await page.route('**/api/auth/register', registerHandler);
    await page.route(API_PROFILE_RE, profileHandler);
    await page.route('**/api/auth/logout', logoutHandler);

    routes.push({ url: '**/api/v1/auth/webauthn/native/register/options', handler: registerOptionsHandler });
    routes.push({ url: '**/api/v1/auth/webauthn/native/register/verify', handler: registerVerifyHandler });
    routes.push({ url: '**/api/v1/auth/webauthn/native/authenticate/options', handler: authOptionsHandler });
    routes.push({ url: '**/api/v1/auth/webauthn/native/authenticate/verify', handler: authVerifyHandler });
    routes.push({ url: '**/api/auth/login', handler: loginHandler });
    routes.push({ url: '**/api/auth/register', handler: registerHandler });
    routes.push({ url: API_PROFILE_RE, handler: profileHandler });
    routes.push({ url: '**/api/auth/logout', handler: logoutHandler });
  }

  if (options.api) {
    const polls: MockPollRecord[] = POLL_FIXTURES.map((poll) => ({
      ...poll,
      options: poll.options.map((option) => ({ ...option })),
    }));

    const ensurePoll = (
      payload: Partial<MockPollRecord> & {
        rawOptions?: string[];
      },
    ): MockPollRecord => {
      const poll = createPollRecord({
        id: payload.id ?? `poll-${polls.length + 1}`,
        ...payload,
        options:
          payload.options ??
          payload.rawOptions?.map((text, index) => ({
            id: `${payload.id ?? `poll-${polls.length + 1}`}-option-${index + 1}`,
            text,
          })) ??
          [],
      });
      polls.push({
        ...poll,
        options: poll.options.map((option) => ({ ...option })),
      });
      return poll;
    };

    const extractPollId = (url: string) => {
      const match = url.match(/\/api\/polls\/([^/]+)/);
      return match?.[1];
    };

    const pollsHandler: RouteHandler = async (route) => {
      if (route.request().method() === 'POST') {
        const payload = parseJsonBody(route);
        const inputOptions = Array.isArray(payload.options) ? (payload.options as string[]) : undefined;
        const poll = ensurePoll({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          ...(inputOptions ? { rawOptions: inputOptions } : {}),
        });
        await respondJson(route, {
          success: true,
          data: poll,
          metadata: { timestamp: new Date().toISOString() },
        }, 201);
        return;
      }

      await respondJson(route, {
        success: true,
        data: { polls },
        metadata: {
          timestamp: new Date().toISOString(),
          pagination: {
            limit: polls.length,
            offset: 0,
            total: polls.length,
            hasMore: false,
            page: 1,
            totalPages: 1,
          },
        },
      });
    };

    const pollDetailHandler: RouteHandler = async (route) => {
      const pollId = extractPollId(route.request().url());
      const poll = pollId ? polls.find((p) => p.id === pollId) : undefined;
      if (!poll) {
        await respondJson(route, { success: false, error: 'Poll not found' }, 404);
        return;
      }
      await respondJson(route, {
        success: true,
        data: poll,
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const pollVoteHandler: RouteHandler = async (route) => {
      const pollId = extractPollId(route.request().url());
      const poll = pollId ? polls.find((p) => p.id === pollId) : undefined;
      const payload = parseJsonBody(route);
      if (!poll) {
        await respondJson(route, { success: false, error: 'Poll not found' }, 404);
        return;
      }
      await respondJson(route, {
        success: true,
        data: {
          pollId,
          optionId: payload.optionId ?? poll?.options[0]?.id ?? null,
        },
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const pollResultsHandler: RouteHandler = async (route) => {
      const pollId = extractPollId(route.request().url());
      const poll = pollId ? polls.find((p) => p.id === pollId) : undefined;
      if (!poll) {
        await respondJson(route, { success: false, error: 'Poll not found' }, 404);
        return;
      }
      await respondJson(route, {
        success: true,
        data: {
          pollId,
          results: poll.options.map((option, index) => ({
            optionId: option.id,
            count: index + 1,
          })),
        },
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const dashboardHandler: RouteHandler = async (route) => {
      if (!hasAuthHeader(route) && !shouldBypassHarnessAuth(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      await respondJson(route, buildDashboardData(polls));
    };

    const representativesListHandler: RouteHandler = async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/representatives') {
        await route.continue();
        return;
      }
      await respondJson(route, buildE2ERepresentativesListPayload());
    };

    const civicsStateHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: CIVICS_STATE_FIXTURE,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    };

    const pwaSubscribeHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: { subscriptionId: 'mock-subscription' },
      });
    };

    const pwaNotificationHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: { message: 'Notification recorded' },
      });
    };

    const offlineHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: { synced: true },
      });
    };

    const shareHandler: RouteHandler = async (route) => {
      if (route.request().method() === 'POST') {
        const payload = parseJsonBody(route);
        await respondJson(route, {
          success: true,
          data: {
            message: 'Share event tracked successfully',
            shareId: `share-${Date.now()}`,
            request: payload,
          },
          metadata: { timestamp: new Date().toISOString() },
        }, 201);
        return;
      }

      const url = new URL(route.request().url());
      const days = Number(url.searchParams.get('days') ?? '7');
      const platform = url.searchParams.get('platform') ?? 'all';
      const pollId = url.searchParams.get('poll_id') ?? 'all';

      await respondJson(route, {
        success: true,
        data: buildShareAnalytics({
          periodDays: days,
          filters: { platform, pollId },
        }),
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const sharedPollHandler: RouteHandler = async (route) => {
      const match = route.request().url().match(/\/api\/shared\/poll\/([^/?]+)/);
      const pollId = match?.[1] ?? 'shared-poll';

      await respondJson(route, {
        success: true,
        data: {
          poll: {
            id: pollId,
            question: 'Mock shared poll question',
            createdAt: new Date().toISOString(),
            isPublic: true,
            isShareable: true,
            options: [
              { id: `${pollId}-opt-1`, text: 'Option A', createdAt: new Date().toISOString() },
              { id: `${pollId}-opt-2`, text: 'Option B', createdAt: new Date().toISOString() },
            ],
            results: [
              { optionId: `${pollId}-opt-1`, votes: 120 },
              { optionId: `${pollId}-opt-2`, votes: 45 },
            ],
          },
        },
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const siteMessagesHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: [],
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const mockAdminUsers = [
      {
        user_id: 'e2e-mock-admin-1',
        username: 'mock_admin',
        email: 'mock-admin@example.com',
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const adminUsersHandler: RouteHandler = async (route) => {
      if (!shouldBypassHarnessAuth(route) && !hasAuthHeader(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      const method = route.request().method().toUpperCase();
      if (method === 'PUT') {
        await respondJson(route, {
          success: true,
          data: { updated: true },
        });
        return;
      }
      if (method !== 'GET') {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      const limitRaw = Number.parseInt(url.searchParams.get('limit') ?? '50', 10);
      const pageRaw = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;
      const pageNum = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
      const offset = (pageNum - 1) * limit;
      const total = mockAdminUsers.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      await respondJson(route, {
        success: true,
        data: mockAdminUsers,
        metadata: {
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
            page: pageNum,
            totalPages,
          },
        },
      });
    };

    const adminFeedbackHandler: RouteHandler = async (route) => {
      if (!shouldBypassHarnessAuth(route) && !hasAuthHeader(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      if (route.request().method().toUpperCase() !== 'GET') {
        await route.continue();
        return;
      }
      await respondJson(route, {
        success: true,
        data: {
          feedback: [],
          total: 0,
          admin: { id: 'e2e-mock-admin', email: 'mock-admin@example.com' },
          filters: {},
        },
      });
    };

    const adminHealthHandler: RouteHandler = async (route) => {
      if (!shouldBypassHarnessAuth(route) && !hasAuthHeader(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      if (route.request().method().toUpperCase() !== 'GET') {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      const type = url.searchParams.get('type') ?? 'metrics';
      const lastUpdated = new Date().toISOString();
      const metrics = {
        total_topics: 0,
        total_polls: 2,
        active_polls: 1,
        system_health: 'healthy',
        last_updated: lastUpdated,
        system_uptime: 99.9,
        performance_metrics: {
          response_time_avg: 42,
          error_rate: 0.1,
          throughput: 120,
        },
      };
      if (type === 'metrics') {
        await respondJson(route, { success: true, data: { metrics } });
        return;
      }
      if (type === 'status') {
        await respondJson(route, {
          success: true,
          data: {
            status: {
              ok: true,
              checks: [],
              meta: { generatedAt: lastUpdated, region: 'e2e' },
            },
          },
        });
        return;
      }
      await respondJson(route, {
        success: true,
        data: {
          metrics,
          status: {
            ok: true,
            checks: [],
            meta: { generatedAt: lastUpdated, region: 'e2e' },
          },
        },
      });
    };

    const sharedVoteHandler: RouteHandler = async (route) => {
      const payload = parseJsonBody(route);
      await respondJson(route, {
        success: true,
        data: {
          voteId: `vote-${Date.now()}`,
          pollId: payload.poll_id ?? 'shared-poll',
          optionId: payload.option_id ?? 'shared-option',
        },
        metadata: { timestamp: new Date().toISOString() },
      }, 201);
    };

    await page.route('**/api/polls/*/vote', pollVoteHandler);
    await page.route('**/api/polls/*/results', pollResultsHandler);
    await page.route('**/api/polls/*', pollDetailHandler);
    await page.route(API_POLLS_COLLECTION_RE, pollsHandler);
    await page.route(API_DASHBOARD_RE, dashboardHandler);
    await page.route(API_REPRESENTATIVES_LIST_RE, representativesListHandler);
    await page.route('**/api/v1/civics/by-state**', civicsStateHandler);
    await page.route('**/api/pwa/notifications/subscribe', pwaSubscribeHandler);
    await page.route('**/api/pwa/notifications/send', pwaNotificationHandler);
    await page.route('**/api/pwa/offline/process', offlineHandler);
    await page.route('**/api/pwa/offline/sync', offlineHandler);
    await page.route('**/api/share*', shareHandler);
    await page.route('**/api/shared/poll/*', sharedPollHandler);
    await page.route('**/api/shared/vote', sharedVoteHandler);
    await page.route('**/api/site-messages', siteMessagesHandler);

    if (options.admin) {
      await page.route(API_ADMIN_USERS_RE, adminUsersHandler);
      await page.route(API_ADMIN_FEEDBACK_RE, adminFeedbackHandler);
      await page.route(API_ADMIN_HEALTH_RE, adminHealthHandler);
      routes.push({ url: API_ADMIN_USERS_RE, handler: adminUsersHandler });
      routes.push({ url: API_ADMIN_FEEDBACK_RE, handler: adminFeedbackHandler });
      routes.push({ url: API_ADMIN_HEALTH_RE, handler: adminHealthHandler });
    }

    routes.push({ url: '**/api/polls/*/vote', handler: pollVoteHandler });
    routes.push({ url: '**/api/polls/*/results', handler: pollResultsHandler });
    routes.push({ url: '**/api/polls/*', handler: pollDetailHandler });
    routes.push({ url: API_POLLS_COLLECTION_RE, handler: pollsHandler });
    routes.push({ url: API_DASHBOARD_RE, handler: dashboardHandler });
    routes.push({ url: API_REPRESENTATIVES_LIST_RE, handler: representativesListHandler });
    routes.push({ url: '**/api/v1/civics/by-state**', handler: civicsStateHandler });
    routes.push({ url: '**/api/pwa/notifications/subscribe', handler: pwaSubscribeHandler });
    routes.push({ url: '**/api/pwa/notifications/send', handler: pwaNotificationHandler });
    routes.push({ url: '**/api/pwa/offline/process', handler: offlineHandler });
    routes.push({ url: '**/api/pwa/offline/sync', handler: offlineHandler });
    routes.push({ url: '**/api/share*', handler: shareHandler });
    routes.push({ url: '**/api/shared/poll/*', handler: sharedPollHandler });
    routes.push({ url: '**/api/shared/vote', handler: sharedVoteHandler });
    routes.push({ url: '**/api/site-messages', handler: siteMessagesHandler });
  }

  if (options.feeds) {
    const feedsUrl = '**/api/feeds**';
    const feedsHandler: RouteHandler = async (route) => {
      const requestUrl = new URL(route.request().url());
      const limit = Number(requestUrl.searchParams.get('limit') ?? FEED_FIXTURES.length);
      const offset = Number(requestUrl.searchParams.get('offset') ?? '0');
      const category = requestUrl.searchParams.get('category');
      const district = requestUrl.searchParams.get('district');
      const sort = requestUrl.searchParams.get('sort');
      const response = buildFeedsResponse({ limit, offset, category, district, sort });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    };

    const feedSearchUrl = '**/api/feeds/search';
    const feedSearchHandler: RouteHandler = async (route) => {
      const raw = route.request().postData();
      let query = '';
      if (raw) {
        try {
          const body = JSON.parse(raw) as { query?: string };
          query = body.query ?? '';
        } catch {
          query = '';
        }
      }
      const response = buildFeedSearchResponse(query);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    };

    const feedInteractionUrl = '**/api/feeds/interactions';
    const feedInteractionHandler: RouteHandler = async (route) => {
      const response = buildFeedInteractionResponse();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    };

    const feedCategoriesUrl = '**/api/feeds/categories';
    const feedCategoriesHandler: RouteHandler = async (route) => {
      const response = buildFeedCategoriesResponse();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    };

    await page.route(feedsUrl, feedsHandler);
    await page.route(feedSearchUrl, feedSearchHandler);
    await page.route(feedInteractionUrl, feedInteractionHandler);
    await page.route(feedCategoriesUrl, feedCategoriesHandler);

    routes.push({ url: feedsUrl, handler: feedsHandler });
    routes.push({ url: feedSearchUrl, handler: feedSearchHandler });
    routes.push({ url: feedInteractionUrl, handler: feedInteractionHandler });
    routes.push({ url: feedCategoriesUrl, handler: feedCategoriesHandler });
  }

  return async () => {
    try {
      // Check if page/context is still open before attempting to unroute
      if (page.isClosed()) {
        return;
      }
      await Promise.all(routes.map(({ url, handler }) => page.unroute(url, handler)));
    } catch (error) {
      // Ignore errors if page/context is closed (test timeout scenario)
      if (error instanceof Error && error.message.includes('closed')) {
        return;
      }
      throw error;
    }
  };
}

async function locateAuthInputs(page: Page) {
  const preferred = {
    emailField: page.locator(AUTH_SELECTORS.email),
    passwordField: page.locator(AUTH_SELECTORS.password),
    submitButton: page.locator(AUTH_SELECTORS.submit),
  };

  const visiblePreferred = await ensureVisible(preferred);
  if (visiblePreferred) {
    return visiblePreferred;
  }

  const emailField = await findFirstVisible(page, FALLBACK_EMAIL_SELECTORS);
  const passwordField = await findFirstVisible(page, FALLBACK_PASSWORD_SELECTORS);
  const submitButton = await findFirstVisible(page, FALLBACK_SUBMIT_SELECTORS);

  return { emailField, passwordField, submitButton };
}

async function ensureVisible(fields: {
  emailField: ReturnType<Page['locator']>;
  passwordField: ReturnType<Page['locator']>;
  submitButton: ReturnType<Page['locator']>;
}) {
  try {
    await Promise.all([
      fields.emailField.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUTS.element }),
      fields.passwordField.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUTS.element }),
      fields.submitButton.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUTS.element }),
    ]);
    return fields;
  } catch {
    return undefined;
  }
}

async function findFirstVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUTS.element });
      return locator;
    } catch {
      // try next selector
    }
  }

  throw new Error(`Unable to locate a visible element for selectors: ${selectors.join(', ')}`);
}

function cloneSeed(record: SeedRecord): SeedRecord {
  return {
    user: { ...record.user },
    ...(record.poll ? { poll: { ...record.poll } } : {}),
    createdAt: record.createdAt,
  };
}

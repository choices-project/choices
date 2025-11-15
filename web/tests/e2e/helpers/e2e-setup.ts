import type { Page } from '@playwright/test';

type RouteHandler = Parameters<Page['route']>[1];
type RoutePattern = Parameters<Page['route']>[0];
type PlaywrightRoute = Parameters<RouteHandler>[0];

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

type MockPollOption = {
  id: string;
  text: string;
};

type MockPollRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  options: MockPollOption[];
};

export type TestDataPayload = {
  user?: Partial<TestUser>;
  poll?: Partial<TestPoll>;
};

export type SeedHandle = string;

import {
  buildFeedCategoriesResponse,
  buildFeedInteractionResponse,
  buildFeedSearchResponse,
  buildFeedsResponse,
  FEED_FIXTURES,
} from '../../msw/feeds-handlers';

const DISABLE_FLAGS = new Set(['0', 'false', 'no', 'off']);

const envFlagEnabled = (value: string | undefined, defaultEnabled: boolean): boolean => {
  if (value === undefined) {
    return defaultEnabled;
  }
  return !DISABLE_FLAGS.has(value.trim().toLowerCase());
};

export const SHOULD_USE_MOCKS = envFlagEnabled(process.env.PLAYWRIGHT_USE_MOCKS, true);

export type ExternalMockOptions = {
  civics: boolean;
  analytics: boolean;
  notifications: boolean;
  auth: boolean;
  feeds: boolean;
  api: boolean;
};

export type LoginOptions = {
  path?: string;
  timeoutMs?: number;
  expectRedirect?: string | RegExp;
  expectSessionCookie?: boolean;
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
  pageLoad: 15_000,
  element: 5_000,
  api: 3_000,
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

export async function loginWithPassword(page: Page, credentials: TestUser, options: LoginOptions = {}): Promise<void> {
  const { path = '/login', timeoutMs = 15_000, expectRedirect, expectSessionCookie } = options;
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  await waitForPageReady(page, timeoutMs);

  const form = page.locator(AUTH_SELECTORS.form);
  if (await form.count()) {
    await form.first().waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUTS.element }).catch(() => undefined);
  }

  const { emailField, passwordField, submitButton } = await locateAuthInputs(page);
  await emailField.fill(credentials.email, { timeout: DEFAULT_TIMEOUTS.element });
  await passwordField.fill(credentials.password, { timeout: DEFAULT_TIMEOUTS.element });
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => undefined),
    submitButton.click(),
  ]);

  if (expectRedirect) {
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
}

export async function loginTestUser(page: Page, user: TestUser): Promise<void> {
  const { email, password } = user;
  if (!email || !password) {
    throw new Error('loginTestUser requires both email and password');
  }

  await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 30_000 });
  await waitForPageReady(page);

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

  await emailInput.first().fill(email, { timeout: 5_000 });
  await passwordInput.first().fill(password, { timeout: 5_000 });

  const submitButton = page.getByTestId('login-submit');
  await submitButton.waitFor({ state: 'visible', timeout: 5_000 });
  await submitButton.click();

  await Promise.race([
    page.waitForURL(/\/(dashboard|admin|onboarding)/, { timeout: 15_000 }).catch(() => undefined),
    page.waitForFunction(
      () =>
        document.cookie.includes('sb-') ||
        window.localStorage.getItem('supabase.auth.token') !== null ||
        window.sessionStorage.getItem('supabase.auth.token') !== null,
      { timeout: 15_000 },
    ),
  ]);
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

  type MockEnvelope = {
    success: boolean;
    data?: unknown;
    error?: string;
    code?: string;
    details?: unknown;
    metadata?: Record<string, unknown>;
  };

  const buildMetadata = (metadata?: Record<string, unknown>) => ({
    timestamp: new Date().toISOString(),
    ...(metadata ?? {}),
  });

  const normalizePayload = (payload: unknown): MockEnvelope => {
    if (payload && typeof payload === 'object' && 'success' in payload) {
      const envelope = payload as MockEnvelope;
      if (envelope.success) {
        return {
          success: true,
          data: 'data' in envelope ? envelope.data ?? null : null,
          metadata: buildMetadata(envelope.metadata),
        };
      }

      return {
        success: false,
        error: envelope.error ?? 'Request failed',
        ...(envelope.code ? { code: envelope.code } : {}),
        ...(envelope.details ? { details: envelope.details } : {}),
        metadata: buildMetadata(envelope.metadata),
      };
    }

    return {
      success: true,
      data: payload,
      metadata: buildMetadata(),
    };
  };

  const respondJson = async (route: PlaywrightRoute, payload: unknown, status = 200) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(normalizePayload(payload)),
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
        data: {
          jurisdiction: {
            district: '13',
            state: 'IL',
            county: 'Sangamon',
            fallback: false,
          },
          normalizedInput: {
            line1: '123 Any St',
            city: 'Springfield',
            state: 'IL',
            zip: '62704',
          },
        },
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
            data: {
              notifications: [],
              total: 0,
            },
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
            data: {
              id: 'mock-notification-id',
              title: body?.title ?? 'Mock Notification',
              message: body?.message ?? 'Mock notification body',
              createdAt: new Date().toISOString(),
            },
          },
          201,
        );
        return;
      }

      if (method === 'PUT') {
        const body = parseJsonBody(route);
        const notificationId = body?.notificationId ?? 'mock-notification-id';
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

    let currentAuthEmail = 'user@example.com';
    const profileState = {
      email: currentAuthEmail,
      displayName: 'Test User',
      bio: '',
    };

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
      if (!hasAuthHeader(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      if (route.request().method() === 'GET') {
        await respondJson(route, profileState);
        return;
      }
      if (route.request().method() === 'PUT') {
        const payload = parseJsonBody(route);
        if (typeof payload.displayName === 'string') {
          profileState.displayName = payload.displayName;
        }
        if (typeof payload.bio === 'string') {
          profileState.bio = payload.bio;
        }
        await respondJson(route, profileState);
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
    await page.route('**/api/profile', profileHandler);
    await page.route('**/api/auth/logout', logoutHandler);

    routes.push({ url: '**/api/v1/auth/webauthn/native/register/options', handler: registerOptionsHandler });
    routes.push({ url: '**/api/v1/auth/webauthn/native/register/verify', handler: registerVerifyHandler });
    routes.push({ url: '**/api/v1/auth/webauthn/native/authenticate/options', handler: authOptionsHandler });
    routes.push({ url: '**/api/v1/auth/webauthn/native/authenticate/verify', handler: authVerifyHandler });
    routes.push({ url: '**/api/auth/login', handler: loginHandler });
    routes.push({ url: '**/api/auth/register', handler: registerHandler });
    routes.push({ url: '**/api/profile', handler: profileHandler });
    routes.push({ url: '**/api/auth/logout', handler: logoutHandler });
  }

  if (options.api) {
    const polls: MockPollRecord[] = [];

    const ensurePoll = (
      payload: Partial<MockPollRecord> & {
        rawOptions?: string[];
      },
    ): MockPollRecord => {
      const id = payload.id ?? `poll-${polls.length + 1}`;
      const rawOptions = payload.rawOptions ?? payload.options?.map((option) => option.text);
      const options =
        (payload.options && payload.options.length > 0 ? payload.options : undefined) ??
        (Array.isArray(rawOptions) && rawOptions.length > 0
          ? rawOptions.map((text, index) => ({
              id: `${id}-option-${index + 1}`,
              text,
            }))
          : ['Option 1', 'Option 2'].map((text, index) => ({
              id: `${id}-option-${index + 1}`,
              text,
            })));

      const poll: MockPollRecord = {
        id,
        title: payload.title ?? `Mock Poll ${polls.length + 1}`,
        description: payload.description ?? 'Mock poll description',
        category: payload.category ?? 'general',
        options,
      };
      polls.push(poll);
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
      if (!hasAuthHeader(route)) {
        await respondJson(route, unauthorizedResponse(), 401);
        return;
      }
      await respondJson(route, {
        platform: {
          activeUsers: 120,
          newPolls: polls.length,
        },
        polls,
        analytics: {
          total_votes: 480,
          total_polls_created: polls.length,
        },
      });
    };

    const civicsStateHandler: RouteHandler = async (route) => {
      await respondJson(route, {
        success: true,
        data: {
          state: 'IL',
          level: 'federal',
          count: 1,
          representatives: [
            {
              id: 'rep-1',
              name: 'Representative Example',
              office: 'House',
              level: 'federal',
              jurisdiction: 'IL',
              party: 'Independent',
              last_updated: new Date().toISOString()
            }
          ]
        },
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
        data: {
          analytics: {
            totalShares: 128,
            platformBreakdown: {
              twitter: 64,
              facebook: 32,
              sms: 16,
              other: 16,
            },
            topPolls: [
              { pollId: 'share-poll-1', shares: 24 },
              { pollId: 'share-poll-2', shares: 18 },
            ],
            periodDays: days,
            filters: { platform, pollId },
          },
        },
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

    await page.route('**/api/polls', pollsHandler);
    await page.route('**/api/polls/*/vote', pollVoteHandler);
    await page.route('**/api/polls/*/results', pollResultsHandler);
    await page.route('**/api/polls/*', pollDetailHandler);
    await page.route('**/api/dashboard', dashboardHandler);
    await page.route('**/api/v1/civics/by-state**', civicsStateHandler);
    await page.route('**/api/pwa/notifications/subscribe', pwaSubscribeHandler);
    await page.route('**/api/pwa/notifications/send', pwaNotificationHandler);
    await page.route('**/api/pwa/offline/process', offlineHandler);
    await page.route('**/api/pwa/offline/sync', offlineHandler);
    await page.route('**/api/share', shareHandler);
    await page.route('**/api/shared/poll/*', sharedPollHandler);
    await page.route('**/api/shared/vote', sharedVoteHandler);

    routes.push({ url: '**/api/polls', handler: pollsHandler });
    routes.push({ url: '**/api/polls/*/vote', handler: pollVoteHandler });
    routes.push({ url: '**/api/polls/*/results', handler: pollResultsHandler });
    routes.push({ url: '**/api/polls/*', handler: pollDetailHandler });
    routes.push({ url: '**/api/dashboard', handler: dashboardHandler });
    routes.push({ url: '**/api/v1/civics/by-state**', handler: civicsStateHandler });
    routes.push({ url: '**/api/pwa/notifications/subscribe', handler: pwaSubscribeHandler });
    routes.push({ url: '**/api/pwa/notifications/send', handler: pwaNotificationHandler });
    routes.push({ url: '**/api/pwa/offline/process', handler: offlineHandler });
    routes.push({ url: '**/api/pwa/offline/sync', handler: offlineHandler });
    routes.push({ url: '**/api/share', handler: shareHandler });
    routes.push({ url: '**/api/shared/poll/*', handler: sharedPollHandler });
    routes.push({ url: '**/api/shared/vote', handler: sharedVoteHandler });
  }

  if (options.feeds) {
    const feedsUrl = '**/api/feeds**';
    const feedsHandler: RouteHandler = async (route) => {
      const requestUrl = new URL(route.request().url());
      const limit = Number(requestUrl.searchParams.get('limit') ?? FEED_FIXTURES.length);
      const category = requestUrl.searchParams.get('category');
      const district = requestUrl.searchParams.get('district');
      const sort = requestUrl.searchParams.get('sort');
      const response = buildFeedsResponse({ limit, category, district, sort });
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
    await Promise.all(routes.map(({ url, handler }) => page.unroute(url, handler)));
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

import { expect, test, type Page } from '@playwright/test';

import {
  cleanupE2ETestData,
  getSeededData,
  setupE2ETestData,
  setupExternalAPIMocks,
  waitForPageReady,
  type SeedHandle,
  type TestPoll,
  type TestUser,
} from './helpers/e2e-setup';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
};

type ApiResponse<T> = {
  status: number;
  ok: boolean;
  body: T;
};

type MockPollResponse = {
  id: string;
  title: string;
  description: string;
  category: string;
  options: Array<{ id: string; text: string }>;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  metadata?: Record<string, unknown>;
};

async function apiFetch<T = unknown>(
  page: Page,
  { method = 'GET', url, data, headers = {} }: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  return page.evaluate(
    async ({ method, url, data, headers }) => {
      const init: RequestInit = {
        method,
        headers: { ...headers },
      };

      if (data !== undefined) {
        init.body = JSON.stringify(data);
        init.headers = { 'content-type': 'application/json', ...init.headers };
      }

      const response = await fetch(url, init);
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        // keep raw text for non-JSON payloads (e.g., service worker)
      }

      return { status: response.status, ok: response.ok, body: parsed as T };
    },
    { method, url, data, headers },
  );
}

async function loginForToken(page: Page, user: TestUser): Promise<string> {
  const response = await apiFetch<ApiEnvelope<{ token: string }>>(page, {
    method: 'POST',
    url: '/api/auth/login',
    data: {
      email: user.email,
      password: user.password,
    },
  });
  expect(response.status).toBe(200);
  const token = response.body?.data?.token;
  expect(token).toBeTruthy();
  return token!;
}

const APP_BOOT_TIMEOUT = 90_000;

test.describe('API endpoints (mock harness)', () => {
  let seedHandle: SeedHandle;
  let testData: { user: TestUser; poll: TestPoll };
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    seedHandle = await setupE2ETestData({
      user: {
        email: 'api-test@example.com',
        username: 'apitestuser',
        password: 'ApiTest123!',
      },
      poll: {
        title: 'Mock API Test Poll',
        description: 'Testing API endpoints via harness',
        options: ['API Option 1', 'API Option 2', 'API Option 3'],
        category: 'general',
      },
    });

    const seeded = getSeededData(seedHandle);
    if (!seeded?.user || !seeded.poll) {
      throw new Error('Failed to seed API test data');
    }

    testData = {
      user: seeded.user,
      poll: seeded.poll,
    };

    await setupExternalAPIMocks(page, { api: true });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: APP_BOOT_TIMEOUT });
    await waitForPageReady(page, APP_BOOT_TIMEOUT);
  });

  test.afterEach(async () => {
    await cleanupE2ETestData(seedHandle);
  });

  test('auth endpoints issue tokens and allow logout', async ({ page }) => {
    const registerResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/auth/register',
      data: {
        email: `api-suite-${Date.now()}@example.com`,
        username: `apisuite${Date.now()}`,
        password: 'ApiSuite123!',
      },
    });
    expect([200, 201, 409]).toContain(registerResponse.status);

    authToken = await loginForToken(page, testData.user);

    const logoutResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/auth/logout',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(logoutResponse.status).toBe(200);
  });

  test('poll endpoints support creation, listing, voting, and results', async ({ page }) => {
    authToken = await loginForToken(page, testData.user);

    const createPollResponse = await apiFetch<ApiEnvelope<MockPollResponse>>(page, {
      method: 'POST',
      url: '/api/polls',
      headers: { Authorization: `Bearer ${authToken}` },
      data: testData.poll,
    });
    expect(createPollResponse.status).toBe(201);
    expect(createPollResponse.body?.success).toBe(true);
    const createdPoll = createPollResponse.body?.data;
    expect(createdPoll).toBeDefined();
    if (!createdPoll) {
      throw new Error('Failed to create poll via API harness');
    }
    expect(createdPoll).toHaveProperty('id');

    const listResponse = await apiFetch<ApiEnvelope<{ polls: MockPollResponse[] }>>(page, {
      url: '/api/polls',
    });
    expect(listResponse.status).toBe(200);
    expect(listResponse.body?.success).toBe(true);
    expect(listResponse.body?.data?.polls?.some((poll) => poll.id === createdPoll.id)).toBe(true);

    const detailResponse = await apiFetch<ApiEnvelope<MockPollResponse>>(page, {
      url: `/api/polls/${createdPoll.id}`,
    });
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body?.data?.title).toBe(createdPoll?.title);

    const voteResponse = await apiFetch(page, {
      method: 'POST',
      url: `/api/polls/${createdPoll.id}/vote`,
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        optionId: createdPoll.options[0]?.id,
        votingMethod: 'single',
      },
    });
    expect(voteResponse.status).toBe(200);
    expect((voteResponse.body as { success?: boolean })?.success).toBe(true);

    const resultsResponse = await apiFetch(page, {
      url: `/api/polls/${createdPoll.id}/results`,
    });
    expect(resultsResponse.status).toBe(200);
    expect(resultsResponse.body).toHaveProperty('success', true);
  });

  test('share endpoints provide analytics and shared poll flows', async ({ page }) => {
    const sharePost = await apiFetch<ApiEnvelope<{ message: string; shareId: string }>>(page, {
      method: 'POST',
      url: '/api/share',
      data: {
        platform: 'twitter',
        poll_id: 'share-poll-1',
        placement: 'floating',
      },
    });
    expect(sharePost.status).toBe(201);
    expect(sharePost.body?.data?.message).toContain('Share event tracked');
    expect(sharePost.body?.data?.shareId).toMatch(/^share-/);

    const shareAnalytics = await apiFetch<ApiEnvelope<{ analytics: { totalShares: number } }>>(page, {
      url: '/api/share?days=3&platform=twitter',
    });
    expect(shareAnalytics.status).toBe(200);
    expect(shareAnalytics.body?.data?.analytics?.totalShares).toBeGreaterThan(0);

    const sharedPoll = await apiFetch<ApiEnvelope<{ poll: { id: string; options: unknown[] } }>>(page, {
      url: '/api/shared/poll/share-poll-1',
    });
    expect(sharedPoll.status).toBe(200);
    expect(sharedPoll.body?.data?.poll?.id).toBe('share-poll-1');
    expect(sharedPoll.body?.data?.poll?.options?.length).toBeGreaterThan(0);

    const sharedVote = await apiFetch<ApiEnvelope<{ voteId: string }>>(page, {
      method: 'POST',
      url: '/api/shared/vote',
      data: {
        poll_id: 'share-poll-1',
        option_id: 'share-poll-1-opt-1',
        voter_session: 'session-123',
      },
    });
    expect(sharedVote.status).toBe(201);
    expect(sharedVote.body?.data?.voteId).toMatch(/^vote-/);
  });

  test('civics and dashboard endpoints respond with seeded data', async ({ page }) => {
    const addressResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/v1/civics/address-lookup',
      data: { address: '123 Any St, Springfield, IL 62704' },
      headers: { 'x-e2e-bypass': '1' },
    });
    expect(addressResponse.status).toBe(200);
    expect(addressResponse.body).toHaveProperty('success', true);
    expect(addressResponse.body).toHaveProperty('data.jurisdiction.state', 'IL');

    const byStateResponse = await apiFetch(page, {
      url: '/api/v1/civics/by-state?state=IL&level=federal',
    });
    expect(byStateResponse.status).toBe(200);
    expect(byStateResponse.body).toHaveProperty('success', true);

    authToken = await loginForToken(page, testData.user);
    const dashboardResponse = await apiFetch(page, {
      url: '/api/dashboard',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body).toHaveProperty('success', true);
    expect(dashboardResponse.body).toHaveProperty('data.analytics');
  });

  test('profile and WebAuthn endpoints respect authentication', async ({ page }) => {
    authToken = await loginForToken(page, testData.user);

    const profileResponse = await apiFetch(page, {
      url: '/api/profile',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body).toHaveProperty('success', true);
    expect(profileResponse.body).toHaveProperty('data.profile.email', testData.user.email);

    const updateProfileResponse = await apiFetch(page, {
      method: 'PUT',
      url: '/api/profile',
      headers: { Authorization: `Bearer ${authToken}` },
      data: { display_name: 'Updated Display Name', bio: 'Updated bio' },
    });
    expect(updateProfileResponse.status).toBe(200);
    expect(updateProfileResponse.body).toHaveProperty('success', true);
    expect(updateProfileResponse.body).toHaveProperty('data.profile.display_name', 'Updated Display Name');

    const registerOptionsResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/v1/auth/webauthn/native/register/options',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(registerOptionsResponse.status).toBe(200);

    const registerVerifyResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/v1/auth/webauthn/native/register/verify',
      headers: { Authorization: `Bearer ${authToken}` },
      data: {},
    });
    expect(registerVerifyResponse.status).toBe(200);

    const authOptionsResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/v1/auth/webauthn/native/authenticate/options',
      headers: { Authorization: `Bearer ${authToken}` },
      data: {},
    });
    expect(authOptionsResponse.status).toBe(200);

    const authVerifyResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/v1/auth/webauthn/native/authenticate/verify',
      headers: { Authorization: `Bearer ${authToken}` },
      data: {},
    });
    expect(authVerifyResponse.status).toBe(200);
  });

  test('PWA endpoints and manifest respond successfully', async ({ page }) => {
    const manifestResponse = await apiFetch<Record<string, unknown>>(page, {
      url: '/manifest.json',
    });
    expect(manifestResponse.status).toBe(200);
    expect(manifestResponse.body).toHaveProperty('name');

    const swResponse = await apiFetch<string>(page, {
      url: '/service-worker.js',
    });
    expect(swResponse.status).toBe(200);
    expect(typeof swResponse.body).toBe('string');

    authToken = await loginForToken(page, testData.user);
    const subscribeResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/pwa/notifications/subscribe',
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        subscription: {
          endpoint: 'https://example.com/fcm/send/mock-endpoint',
          keys: {
            p256dh: 'mock-p256dh',
            auth: 'mock-auth',
          },
        },
        userId: testData.user.email,
      },
    });
    expect(subscribeResponse.status).toBe(200);

    const notificationResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/pwa/notifications/send',
      headers: { Authorization: `Bearer ${authToken}` },
      data: { message: 'Hello from API suite' },
    });
    expect(notificationResponse.status).toBe(200);

    const offlineResponse = await apiFetch(page, {
      method: 'POST',
      url: '/api/pwa/offline/process',
      headers: { Authorization: `Bearer ${authToken}` },
      data: { queue: [] },
    });
    expect(offlineResponse.status).toBe(200);
  });

  test('API error handling and rate limiting paths are deterministic', async ({ page }) => {
    const unauthorizedProfile = await apiFetch(page, { url: '/api/profile' });
    expect(unauthorizedProfile.status).toBe(401);

    const invalidPoll = await apiFetch(page, { url: '/api/polls/invalid-id' });
    expect([400, 404]).toContain(invalidPoll.status);

    const invalidVote = await apiFetch(page, {
      method: 'POST',
      url: '/api/polls/invalid-id/vote',
      data: { optionId: 'invalid-option' },
    });
    expect(invalidVote.status).toBe(404);

    const rateResponses = await Promise.all(
      Array.from({ length: 5 }).map(() => apiFetch(page, { url: '/api/polls' })),
    );
    rateResponses.forEach((response) => {
      expect(response.ok || response.status === 429).toBeTruthy();
    });

    const civicsFallback = await apiFetch(page, { url: '/api/v1/civics/by-state?state=CA&level=state' });
    expect(civicsFallback.status).toBe(200);
  });
});


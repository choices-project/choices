/**
 * API Endpoints E2E Tests - V2 Upgrade
 * 
 * Tests all API endpoints for proper functionality, error handling, and security
 * using V2 mock factory for test data setup and improved test patterns.
 * This ensures the backend is working correctly.
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('API Endpoints - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'api-test@example.com',
        username: 'apitestuser',
        password: 'ApiTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 API Test Poll',
        description: 'Testing API endpoints with V2 setup',
        options: ['API Option 1', 'API Option 2', 'API Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should test authentication API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for authentication API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test registration endpoint
    const registerResponse = await page.request.post('/api/auth/register', {
      data: {
        email: testData.user.email,
        username: testData.user.username,
        password: testData.user.password
      }
    });
    
    expect(registerResponse.ok()).toBe(true);
    const registerData = await registerResponse.json();
    expect(registerData).toHaveProperty('success', true);

    // Test login endpoint
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    expect(loginResponse.ok()).toBe(true);
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('token');
    authToken = loginData.token;
  });

  test('should test poll API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for poll API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Test poll creation endpoint
    const createPollResponse = await page.request.post('/api/polls', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        title: testData.poll.title,
        description: testData.poll.description,
        options: testData.poll.options,
        category: testData.poll.category
      }
    });
    
    expect(createPollResponse.ok()).toBe(true);
    const pollData = await createPollResponse.json();
    expect(pollData).toHaveProperty('id');
    expect(pollData.title).toBe(testData.poll.title);

    // Test poll retrieval endpoint
    const getPollResponse = await page.request.get(`/api/polls/${pollData.id}`);
    expect(getPollResponse.ok()).toBe(true);
    const retrievedPoll = await getPollResponse.json();
    expect(retrievedPoll.title).toBe(testData.poll.title);

    // Test polls list endpoint
    const listPollsResponse = await page.request.get('/api/polls');
    expect(listPollsResponse.ok()).toBe(true);
    const pollsList = await listPollsResponse.json();
    expect(Array.isArray(pollsList)).toBe(true);
  });

  test('should test voting API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for voting API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Create a poll first
    const createPollResponse = await page.request.post('/api/polls', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        title: testData.poll.title,
        description: testData.poll.description,
        options: testData.poll.options,
        category: testData.poll.category
      }
    });
    
    const pollData = await createPollResponse.json();

    // Test vote submission endpoint
    const voteResponse = await page.request.post(`/api/polls/${pollData.id}/vote`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        optionId: pollData.options[0].id,
        votingMethod: 'single'
      }
    });
    
    expect(voteResponse.ok()).toBe(true);
    const voteData = await voteResponse.json();
    expect(voteData).toHaveProperty('success', true);

    // Test poll results endpoint
    const resultsResponse = await page.request.get(`/api/polls/${pollData.id}/results`);
    expect(resultsResponse.ok()).toBe(true);
    const resultsData = await resultsResponse.json();
    expect(resultsData).toHaveProperty('results');
  });

  test('should test civics API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for civics API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test address lookup endpoint
    const addressLookupResponse = await page.request.post('/api/v1/civics/address-lookup', {
      data: {
        address: '123 Any St, Springfield, IL 62704'
      }
    });
    
    expect(addressLookupResponse.ok()).toBe(true);
    const addressData = await addressLookupResponse.json();
    expect(addressData).toHaveProperty('district');
    expect(addressData).toHaveProperty('state');

    // Test jurisdiction info endpoint
    const jurisdictionResponse = await page.request.get('/api/v1/civics/jurisdiction-info', {
      params: {
        state: 'IL',
        district: '13'
      }
    });
    
    expect(jurisdictionResponse.ok()).toBe(true);
    const jurisdictionData = await jurisdictionResponse.json();
    expect(jurisdictionData).toHaveProperty('representatives');
  });

  test('should test user profile API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for user profile API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Test get user profile endpoint
    const getProfileResponse = await page.request.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(getProfileResponse.ok()).toBe(true);
    const profileData = await getProfileResponse.json();
    expect(profileData).toHaveProperty('email');
    expect(profileData.email).toBe(testData.user.email);

    // Test update user profile endpoint
    const updateProfileResponse = await page.request.put('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        displayName: 'Updated Display Name',
        bio: 'Updated bio'
      }
    });
    
    expect(updateProfileResponse.ok()).toBe(true);
    const updatedProfileData = await updateProfileResponse.json();
    expect(updatedProfileData.displayName).toBe('Updated Display Name');
  });

  test('should test dashboard API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for dashboard API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Test dashboard data endpoint
    const dashboardResponse = await page.request.get('/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(dashboardResponse.ok()).toBe(true);
    const dashboardData = await dashboardResponse.json();
    expect(dashboardData).toHaveProperty('metrics');
    expect(dashboardData).toHaveProperty('recentPolls');

    // Test dashboard metrics endpoint
    const metricsResponse = await page.request.get('/api/dashboard/metrics', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(metricsResponse.ok()).toBe(true);
    const metricsData = await metricsResponse.json();
    expect(metricsData).toHaveProperty('pollsCreated');
    expect(metricsData).toHaveProperty('votesCast');
  });

  test('should test WebAuthn API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Test WebAuthn registration options endpoint
    const registerOptionsResponse = await page.request.post('/api/v1/auth/webauthn/register/options', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {}
    });
    
    expect(registerOptionsResponse.ok()).toBe(true);
    const registerOptionsData = await registerOptionsResponse.json();
    expect(registerOptionsData).toHaveProperty('challenge');

    // Test WebAuthn authentication options endpoint
    const authOptionsResponse = await page.request.post('/api/v1/auth/webauthn/authenticate/options', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {}
    });
    
    expect(authOptionsResponse.ok()).toBe(true);
    const authOptionsData = await authOptionsResponse.json();
    expect(authOptionsData).toHaveProperty('challenge');
  });

  test('should test PWA API endpoints with V2 setup', async ({ page }) => {
    // Set up test data for PWA API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First authenticate
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Test PWA manifest endpoint
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.ok()).toBe(true);
    const manifestData = await manifestResponse.json();
    expect(manifestData).toHaveProperty('name');
    expect(manifestData).toHaveProperty('short_name');

    // Test service worker endpoint
    const swResponse = await page.request.get('/sw.js');
    expect(swResponse.ok()).toBe(true);

    // Test push notification subscription endpoint
    const pushSubscriptionResponse = await page.request.post('/api/pwa/push-subscribe', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      }
    });
    
    expect(pushSubscriptionResponse.ok()).toBe(true);
    const subscriptionData = await pushSubscriptionResponse.json();
    expect(subscriptionData).toHaveProperty('success', true);
  });

  test('should test API error handling with V2 setup', async ({ page }) => {
    // Set up test data for API error handling testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test invalid authentication
    const invalidAuthResponse = await page.request.get('/api/user/profile', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    expect(invalidAuthResponse.status()).toBe(401);

    // Test invalid poll ID
    const invalidPollResponse = await page.request.get('/api/polls/invalid-id');
    expect(invalidPollResponse.status()).toBe(404);

    // Test invalid vote data
    const invalidVoteResponse = await page.request.post('/api/polls/invalid-id/vote', {
      data: {
        optionId: 'invalid-option'
      }
    });
    
    expect(invalidVoteResponse.status()).toBe(400);
  });

  test('should test API rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for API rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Make multiple requests to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(page.request.get('/api/polls'));
    }

    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should test API with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-api@example.com',
      username: 'regularapi'
    });

    const adminUser = createTestUser({
      email: 'admin-api@example.com',
      username: 'adminapi'
    });

    // Test regular user API access
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    const regularLoginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: regularUser.email,
        password: regularUser.password
      }
    });
    
    const regularLoginData = await regularLoginResponse.json();
    const regularToken = regularLoginData.token;

    // Test regular user endpoints
    const regularProfileResponse = await page.request.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${regularToken}`
      }
    });
    
    expect(regularProfileResponse.ok()).toBe(true);

    // Test admin user API access
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    const adminLoginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: adminUser.email,
        password: adminUser.password
      }
    });
    
    const adminLoginData = await adminLoginResponse.json();
    const adminToken = adminLoginData.token;

    // Test admin user endpoints
    const adminProfileResponse = await page.request.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    expect(adminProfileResponse.ok()).toBe(true);
  });

  test('should test API with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test mobile API endpoints
    const mobilePollsResponse = await page.request.get('/api/polls');
    expect(mobilePollsResponse.ok()).toBe(true);

    const mobileManifestResponse = await page.request.get('/manifest.json');
    expect(mobileManifestResponse.ok()).toBe(true);
  });

  test('should test API performance with V2 setup', async ({ page }) => {
    // Set up test data for API performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure API performance
    const startTime = Date.now();

    // Test multiple API endpoints
    const responses = await Promise.all([
      page.request.get('/api/polls'),
      page.request.get('/manifest.json'),
      page.request.get('/sw.js')
    ]);

    const endTime = Date.now();
    const apiTime = endTime - startTime;

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBe(true);
    });

    // Performance should be acceptable
    expect(apiTime).toBeLessThan(5000);
  });

  test('should test API with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline API testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Test API endpoints while offline
    const offlineResponse = await page.request.get('/api/polls');
    expect(offlineResponse.status()).toBe(0); // Network error

    // Go back online
    await page.context().setOffline(false);

    // Test API endpoints while online
    const onlineResponse = await page.request.get('/api/polls');
    expect(onlineResponse.ok()).toBe(true);
  });
});

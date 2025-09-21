/**
 * API Endpoints E2E Tests
 * 
 * Tests all API endpoints for proper functionality, error handling, and security.
 * This ensures the backend is working correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  let authToken: string;
  let testUser: { email: string; username: string; password: string };

  test.beforeEach(async ({ page }) => {
    // Set up test data
    testUser = {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      password: 'password123'
    };

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should test authentication API endpoints', async ({ page }) => {
    // Test registration endpoint
    const registerResponse = await page.request.post('/api/auth/register', {
      data: {
        email: testUser.email,
        username: testUser.username,
        password: testUser.password
      }
    });
    
    expect(registerResponse.ok()).toBe(true);
    const registerData = await registerResponse.json();
    expect(registerData).toHaveProperty('success', true);

    // Test login endpoint
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    expect(loginResponse.ok()).toBe(true);
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('success', true);
    expect(loginData).toHaveProperty('token');
    
    authToken = loginData.token;

    // Test me endpoint
    const meResponse = await page.request.get('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(meResponse.ok()).toBe(true);
    const meData = await meResponse.json();
    expect(meData).toHaveProperty('user');
    expect(meData.user).toHaveProperty('email', testUser.email);

    // Test logout endpoint
    const logoutResponse = await page.request.post('/api/auth/logout', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(logoutResponse.ok()).toBe(true);
  });

  test('should test poll API endpoints', async ({ page }) => {
    // First, authenticate
    await page.request.post('/api/auth/register', {
      data: testUser
    });
    
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // Test poll creation
    const createPollResponse = await page.request.post('/api/polls', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        title: 'Test Poll',
        description: 'Test Description',
        options: ['Option 1', 'Option 2'],
        category: 'general',
        privacyLevel: 'public'
      }
    });
    
    expect(createPollResponse.ok()).toBe(true);
    const pollData = await createPollResponse.json();
    expect(pollData).toHaveProperty('poll');
    expect(pollData.poll).toHaveProperty('id');
    
    const pollId = pollData.poll.id;

    // Test poll retrieval
    const getPollResponse = await page.request.get(`/api/polls/${pollId}`);
    expect(getPollResponse.ok()).toBe(true);
    const retrievedPoll = await getPollResponse.json();
    expect(retrievedPoll).toHaveProperty('title', 'Test Poll');

    // Test poll voting
    const voteResponse = await page.request.post(`/api/polls/${pollId}/vote`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        optionId: retrievedPoll.options[0].id
      }
    });
    
    expect(voteResponse.ok()).toBe(true);
    const voteData = await voteResponse.json();
    expect(voteData).toHaveProperty('success', true);

    // Test poll results
    const resultsResponse = await page.request.get(`/api/polls/${pollId}/results`);
    expect(resultsResponse.ok()).toBe(true);
    const results = await resultsResponse.json();
    expect(results).toHaveProperty('results');
  });

  test('should test PWA API endpoints', async ({ page }) => {
    // Test PWA manifest endpoint
    const manifestResponse = await page.request.get('/api/pwa/manifest');
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest).toHaveProperty('success', true);
    expect(manifest).toHaveProperty('manifest');

    // Test PWA status endpoint
    const statusResponse = await page.request.get('/api/pwa/status');
    expect(statusResponse.ok()).toBe(true);
    const status = await statusResponse.json();
    expect(status).toHaveProperty('success', true);
    expect(status).toHaveProperty('status');

    // Test PWA offline sync endpoint
    const syncResponse = await page.request.post('/api/pwa/offline/sync', {
      data: {
        actions: []
      }
    });
    expect(syncResponse.ok()).toBe(true);
    const syncData = await syncResponse.json();
    expect(syncData).toHaveProperty('success', true);
  });

  test('should test WebAuthn API endpoints', async ({ page }) => {
    // Test WebAuthn registration endpoint
    const registerResponse = await page.request.post('/api/auth/webauthn/register', {
      data: {
        username: testUser.username,
        displayName: 'Test User'
      }
    });
    
    // This might fail if WebAuthn is not available in test environment
    // But we should get a proper error response, not a 500
    expect(registerResponse.status()).toBeLessThan(500);

    // Test WebAuthn authentication endpoint
    const authResponse = await page.request.post('/api/auth/webauthn/authenticate', {
      data: {
        username: testUser.username
      }
    });
    
    expect(authResponse.status()).toBeLessThan(500);
  });

  test('should test admin API endpoints', async ({ page }) => {
    // Test admin system status endpoint
    const systemStatusResponse = await page.request.get('/api/admin/system-status');
    expect(systemStatusResponse.ok()).toBe(true);
    const systemStatus = await systemStatusResponse.json();
    expect(systemStatus).toHaveProperty('status');

    // Test admin users endpoint
    const usersResponse = await page.request.get('/api/admin/users');
    // This might require admin authentication, so we expect either 200 or 401/403
    expect([200, 401, 403]).toContain(usersResponse.status());

    // Test admin feedback endpoint
    const feedbackResponse = await page.request.get('/api/admin/feedback');
    expect([200, 401, 403]).toContain(feedbackResponse.status());
  });

  test('should test health check endpoints', async ({ page }) => {
    // Test main health endpoint
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.ok()).toBe(true);
    const health = await healthResponse.json();
    expect(health).toHaveProperty('status', 'ok');

    // Test database health endpoint
    const dbHealthResponse = await page.request.get('/api/database-health');
    expect(dbHealthResponse.ok()).toBe(true);
    const dbHealth = await dbHealthResponse.json();
    expect(dbHealth).toHaveProperty('status');

    // Test civics health endpoint
    const civicsHealthResponse = await page.request.get('/api/health/civics');
    expect(civicsHealthResponse.ok()).toBe(true);
    const civicsHealth = await civicsHealthResponse.json();
    expect(civicsHealth).toHaveProperty('status');
  });

  test('should test error handling for invalid requests', async ({ page }) => {
    // Test invalid authentication
    const invalidAuthResponse = await page.request.get('/api/auth/me', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    expect(invalidAuthResponse.status()).toBe(401);

    // Test invalid poll ID
    const invalidPollResponse = await page.request.get('/api/polls/invalid-id');
    expect(invalidPollResponse.status()).toBe(404);

    // Test invalid endpoint
    const invalidEndpointResponse = await page.request.get('/api/invalid-endpoint');
    expect(invalidEndpointResponse.status()).toBe(404);
  });

  test('should test rate limiting', async ({ page }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(page.request.get('/api/health'));
    }
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed (rate limiting might not be enabled in test)
    // But we should not get 500 errors
    responses.forEach(response => {
      expect(response.status()).toBeLessThan(500);
    });
  });

  test('should test CORS headers', async ({ page }) => {
    // Test that API endpoints return proper CORS headers
    const response = await page.request.get('/api/health');
    const headers = response.headers();
    
    // Check for CORS headers
    expect(headers).toHaveProperty('access-control-allow-origin');
    expect(headers).toHaveProperty('access-control-allow-methods');
  });

  test('should test feature flag API', async ({ page }) => {
    // Test feature flag endpoint
    const flagsResponse = await page.request.get('/api/e2e/flags');
    expect(flagsResponse.ok()).toBe(true);
    const flags = await flagsResponse.json();
    
    // Verify expected flags are present
    expect(flags).toHaveProperty('PWA');
    expect(flags).toHaveProperty('SOCIAL_SHARING');
    expect(flags).toHaveProperty('ANALYTICS');
    
    // Verify expected values
    expect(flags.PWA).toBe(true);
    expect(flags.SOCIAL_SHARING).toBe(false);
    expect(flags.ANALYTICS).toBe(false);
  });

  test('should test analytics API (should be disabled)', async ({ page }) => {
    // Test analytics endpoint - should be disabled
    const analyticsResponse = await page.request.get('/api/analytics');
    expect(analyticsResponse.status()).toBe(404);
    
    // Test analytics summary endpoint - should be disabled
    const summaryResponse = await page.request.get('/api/analytics/summary');
    expect(summaryResponse.status()).toBe(404);
  });

  test('should test social sharing API (should be disabled)', async ({ page }) => {
    // Test social sharing endpoints - should be disabled
    const socialResponse = await page.request.get('/api/social/share');
    expect(socialResponse.status()).toBe(404);
    
    const candidatesResponse = await page.request.get('/api/social/candidates');
    expect(candidatesResponse.status()).toBe(404);
  });

  test('should test civics API (should be disabled)', async ({ page }) => {
    // Test civics endpoints - should be disabled
    const civicsResponse = await page.request.get('/api/civics/by-state');
    expect(civicsResponse.status()).toBe(404);
    
    const localResponse = await page.request.get('/api/civics/local/la');
    expect(localResponse.status()).toBe(404);
  });
});


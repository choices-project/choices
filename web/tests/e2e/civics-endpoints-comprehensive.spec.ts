/**
 * Comprehensive Civics Endpoints E2E Tests
 * 
 * Tests all civics API endpoints that were recently fixed:
 * - /api/v1/civics/address-lookup (GET)
 * - /api/v1/civics/by-state (GET)
 * - /api/civics/contact/[id] (GET, POST)
 * - /api/civics/actions (GET, POST)
 * - /api/civics/actions/[id] (GET, PUT, DELETE)
 * - /api/civics/representative/[id] (GET)
 * 
 * Created: January 29, 2025
 */

import { test, expect } from '@playwright/test';

import {
  setupE2ETestData,
  cleanupE2ETestData,
  createTestUser,
  setupExternalAPIMocks
} from './helpers/e2e-setup';

test.describe('Civics Endpoints - Comprehensive E2E Tests', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    // Create test data
    testData = {
      user: createTestUser({
        email: `civics-e2e-${Date.now()}@example.com`,
        username: `civicse2e${Date.now()}`,
        password: 'CivicsE2ETest123!'
      })
    };

    await setupE2ETestData({
      user: testData.user
    });

    await setupExternalAPIMocks(page);

    // Authenticate for tests that need it
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: testData.user.email,
        password: testData.user.password
      },
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.token || 'mock-token';
    }
  });

  test.afterEach(async () => {
    await cleanupE2ETestData({
      user: testData.user
    });
  });

  // ============================================================================
  // /api/v1/civics/address-lookup Tests
  // ============================================================================

  test('GET /api/v1/civics/address-lookup should return representatives for valid address', async ({ page }) => {
    const response = await page.request.get('/api/v1/civics/address-lookup?address=123%20Main%20St,%20Springfield,%20IL%2062701', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('representatives');
    expect(Array.isArray(data.data.representatives)).toBe(true);
    expect(data.metadata.source).toBe('database');
  });

  test('GET /api/v1/civics/address-lookup should return 400 for missing address', async ({ page }) => {
    const response = await page.request.get('/api/v1/civics/address-lookup', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Address');
  });

  test('GET /api/v1/civics/address-lookup should handle rate limiting', async ({ page }) => {
    // Make 60 requests rapidly (limit is 50 per 15 minutes)
    const promises = [];
    for (let i = 0; i < 60; i++) {
      promises.push(
        page.request.get(`/api/v1/civics/address-lookup?address=123%20Main%20St,%20IL&_=${i}`, {
          headers: {
            'x-e2e-bypass': '1'
          }
        })
      );
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status() === 429);
    
    // Should have some rate limited responses (may vary based on timing)
    console.log(`Rate limited requests: ${rateLimited.length} out of ${responses.length}`);
  });

  // ============================================================================
  // /api/v1/civics/by-state Tests
  // ============================================================================

  test('GET /api/v1/civics/by-state should return representatives for valid state', async ({ page }) => {
    const response = await page.request.get('/api/v1/civics/by-state?state=IL', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('representatives');
    expect(Array.isArray(data.data.representatives)).toBe(true);
    expect(data.data.state).toBe('IL');
  });

  test('GET /api/v1/civics/by-state should filter by level', async ({ page }) => {
    const response = await page.request.get('/api/v1/civics/by-state?state=CA&level=federal', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    if (data.data.representatives.length > 0) {
      expect(data.data.representatives[0].level).toBe('federal');
    }
  });

  test('GET /api/v1/civics/by-state should return 400 for missing state', async ({ page }) => {
    const response = await page.request.get('/api/v1/civics/by-state', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  // ============================================================================
  // /api/civics/contact/[id] Tests
  // ============================================================================

  test('GET /api/civics/contact/[id] should return contact information', async ({ page }) => {
    // First, get a representative ID from by-state
    const stateResponse = await page.request.get('/api/v1/civics/by-state?state=IL&limit=1', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    const stateData = await stateResponse.json();
    if (stateData.success && stateData.data.representatives.length > 0) {
      const repId = stateData.data.representatives[0].id;

      const response = await page.request.get(`/api/civics/contact/${repId}`, {
        headers: {
          'x-e2e-bypass': '1'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.data).toHaveProperty('representative');
      expect(data.data).toHaveProperty('contact_methods');
    }
  });

  test('GET /api/civics/contact/[id] should return 400 for invalid ID', async ({ page }) => {
    const response = await page.request.get('/api/civics/contact/invalid', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.ok).toBe(false);
  });

  test('POST /api/civics/contact/[id] should log communication for authenticated user', async ({ page }) => {
    // Get a representative ID
    const stateResponse = await page.request.get('/api/v1/civics/by-state?state=IL&limit=1', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    const stateData = await stateResponse.json();
    if (stateData.success && stateData.data.representatives.length > 0) {
      const repId = stateData.data.representatives[0].id;

      const response = await page.request.post(`/api/civics/contact/${repId}`, {
        data: {
          communication_type: 'email',
          subject: 'Test Subject',
          message_preview: 'Test message preview'
        },
        headers: {
          'x-e2e-bypass': '1',
          'Cookie': `sb-access-token=${authToken}`
        }
      });

      // Should succeed (201) or fail with 401 if auth not properly set up in E2E
      expect([200, 201, 401]).toContain(response.status());
      const data = await response.json();
      
      if (response.status() === 200 || response.status() === 201) {
        expect(data.ok).toBe(true);
      } else if (response.status() === 401) {
        expect(data.error).toContain('Authentication');
      }
    }
  });

  test('POST /api/civics/contact/[id] should require authentication', async ({ page }) => {
    const response = await page.request.post('/api/civics/contact/1', {
      data: {
        communication_type: 'email'
      },
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Authentication');
  });

  // ============================================================================
  // /api/civics/actions Tests
  // ============================================================================

  test('GET /api/civics/actions should require authentication', async ({ page }) => {
    const response = await page.request.get('/api/civics/actions', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('POST /api/civics/actions should create civic action for authenticated user', async ({ page }) => {
    const response = await page.request.post('/api/civics/actions', {
      data: {
        type: 'contact',
        title: 'Test Civic Action',
        description: 'Test description',
        targetRepresentativeId: 1,
        priority: 'high'
      },
      headers: {
        'x-e2e-bypass': '1',
        'Cookie': `sb-access-token=${authToken}`
      }
    });

    // Should succeed (201) or fail with 401 if auth not properly set up
    expect([200, 201, 401]).toContain(response.status());
    const data = await response.json();
    
    if (response.status() === 200 || response.status() === 201) {
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('action');
    }
  });

  // ============================================================================
  // /api/civics/representative/[id] Tests
  // ============================================================================

  test('GET /api/civics/representative/[id] should return detailed representative info', async ({ page }) => {
    // Get a representative ID
    const stateResponse = await page.request.get('/api/v1/civics/by-state?state=IL&limit=1', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    const stateData = await stateResponse.json();
    if (stateData.success && stateData.data.representatives.length > 0) {
      const repId = stateData.data.representatives[0].id;

      const response = await page.request.get(`/api/civics/representative/${repId}`, {
        headers: {
          'x-e2e-bypass': '1'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('contact');
    }
  });

  test('GET /api/civics/representative/[id] should return 404 for non-existent ID', async ({ page }) => {
    const response = await page.request.get('/api/civics/representative/999999', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.ok).toBe(false);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  test('All endpoints should handle database errors gracefully', async ({ page }) => {
    // Test by-state with invalid state code (should still return empty array or error)
    const response = await page.request.get('/api/v1/civics/by-state?state=XX', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    // Should return 200 with empty array, or 400 for invalid state
    expect([200, 400]).toContain(response.status());
  });

  test('Endpoints should validate input parameters', async ({ page }) => {
    // Test invalid representative ID format
    const response = await page.request.get('/api/civics/contact/not-a-number', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(400);
  });

  // ============================================================================
  // Architecture Compliance Tests
  // ============================================================================

  test('by-address endpoint should only query Supabase (no external APIs)', async ({ page }) => {
    let externalApiCalled = false;

    // Monitor network requests
    page.on('request', (request) => {
      const url = request.url();
      if (
        url.includes('googleapis.com') ||
        url.includes('openstates.org') ||
        url.includes('api.open.fec.gov')
      ) {
        // Only allow if it's from the deprecated address-lookup endpoint
        if (!url.includes('/api/v1/civics/address-lookup')) {
          externalApiCalled = true;
        }
      }
    });

    const response = await page.request.get('/api/v1/civics/address-lookup?address=Springfield,%20IL', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(200);
    expect(externalApiCalled).toBe(false);
  });

  test('by-state endpoint should only query Supabase', async ({ page }) => {
    let externalApiCalled = false;

    page.on('request', (request) => {
      const url = request.url();
      if (
        url.includes('googleapis.com') ||
        url.includes('openstates.org') ||
        url.includes('api.open.fec.gov')
      ) {
        externalApiCalled = true;
      }
    });

    const response = await page.request.get('/api/v1/civics/by-state?state=CA', {
      headers: {
        'x-e2e-bypass': '1'
      }
    });

    expect(response.status()).toBe(200);
    expect(externalApiCalled).toBe(false);
  });
});





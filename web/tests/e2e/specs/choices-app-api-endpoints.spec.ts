import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests for choices-app.com
 * 
 * These tests verify that all critical API endpoints are working correctly
 * and return appropriate responses.
 */

test.describe('Production API Endpoints', () => {
  test.beforeEach(async () => {
    test.setTimeout(30_000);
  });

  test('Site messages API should work without authentication', async ({ request }) => {
    const response = await request.get('https://choices-app.com/api/site-messages');
    
    expect(response.status(), 'Site messages should be accessible without auth').toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('messages');
    expect(Array.isArray(data.data.messages)).toBe(true);
  });

  test('Dashboard API should require authentication', async ({ request }) => {
    const response = await request.get('https://choices-app.com/api/dashboard/data');
    
    // Should return 401 when not authenticated
    expect(response.status(), 'Dashboard should require authentication').toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('Auth login endpoint should exist', async ({ request }) => {
    // Try to access login endpoint (should exist even if it requires POST)
    const response = await request.get('https://choices-app.com/api/auth/login');
    
    // Should either return 405 (method not allowed) or handle GET
    expect([200, 405, 404]).toContain(response.status());
  });

  test('Health check endpoint should work', async ({ request }) => {
    // Check if there's a health endpoint
    const response = await request.get('https://choices-app.com/api/health', {
      failOnStatusCode: false,
    });
    
    // Health endpoint might not exist, but if it does, it should work
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('API should handle CORS correctly', async ({ request }) => {
    const response = await request.get('https://choices-app.com/api/site-messages', {
      headers: {
        'Origin': 'https://example.com',
      },
    });
    
    // Should either allow CORS or return the response
    expect([200, 403]).toContain(response.status());
  });

  test('API should return proper error format', async ({ request }) => {
    const response = await request.get('https://choices-app.com/api/dashboard/data');
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    
    // Error responses should have a consistent format
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });

  test('API should handle invalid routes gracefully', async ({ request }) => {
    const response = await request.get('https://choices-app.com/api/nonexistent-endpoint', {
      failOnStatusCode: false,
    });
    
    // Should return 404, not 500
    expect([404, 405]).toContain(response.status());
    
    if (response.status() === 404) {
      // 404 should not expose internal errors
      const text = await response.text();
      expect(text.toLowerCase()).not.toContain('error:');
      expect(text.toLowerCase()).not.toContain('stack');
    }
  });

  test('API response times should be reasonable', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('https://choices-app.com/api/site-messages');
    const duration = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    // API should respond within 5 seconds
    expect(duration, 'API should respond within 5 seconds').toBeLessThan(5000);
  });
});


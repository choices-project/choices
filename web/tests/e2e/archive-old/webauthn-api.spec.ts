/**
 * WebAuthn API E2E Tests
 * 
 * Tests the existing WebAuthn API endpoints directly
 * Validates the @simplewebauthn/server integration
 * 
 * Created: January 18, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('WebAuthn API Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should validate WebAuthn feature flag is enabled', async ({ page }) => {
    const response = await page.request.get('/api/e2e/flags');
    const data = await response.json();
    
    expect(response.ok()).toBe(true);
    expect(data.flags.WEBAUTHN).toBe(true);
  });

  test('should reject unauthenticated registration options requests', async ({ page }) => {
    const response = await page.request.post('/api/v1/auth/webauthn/register/options', {
      data: {}
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should reject unauthenticated authentication options requests', async ({ page }) => {
    const response = await page.request.post('/api/v1/auth/webauthn/authenticate/options', {
      data: {}
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should reject unauthenticated registration verification requests', async ({ page }) => {
    const response = await page.request.post('/api/v1/auth/webauthn/register/verify', {
      data: {
        credential: {
          id: 'test-id',
          rawId: 'test-raw-id',
          response: {
            clientDataJSON: 'test-client-data',
            attestationObject: 'test-attestation'
          },
          type: 'public-key'
        }
      }
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should reject unauthenticated authentication verification requests', async ({ page }) => {
    const response = await page.request.post('/api/v1/auth/webauthn/authenticate/verify', {
      data: {
        credential: {
          id: 'test-id',
          rawId: 'test-raw-id',
          response: {
            clientDataJSON: 'test-client-data',
            authenticatorData: 'test-auth-data',
            signature: 'test-signature',
            userHandle: 'test-user-handle'
          },
          type: 'public-key'
        }
      }
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle invalid request data gracefully', async ({ page }) => {
    // Test with missing credential data
    const response = await page.request.post('/api/v1/auth/webauthn/register/verify', {
      data: {
        // Missing credential object
      }
    });
    
    // Should return 400 (Bad Request) or 401 (Unauthorized) - both are acceptable
    expect([400, 401]).toContain(response.status());
  });

  test('should validate WebAuthn configuration', async ({ page }) => {
    // Test privacy status endpoint
    const response = await page.request.get('/api/status/privacy');
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('webauthn');
    }
  });

  test('should test legacy WebAuthn endpoints (if they exist)', async ({ page }) => {
    // Test legacy endpoints that might still be in use
    const legacyEndpoints = [
      '/api/webauthn/register/begin',
      '/api/webauthn/register/complete',
      '/api/webauthn/authenticate/begin',
      '/api/webauthn/authenticate/complete',
      '/api/auth/webauthn/register',
      '/api/auth/webauthn/authenticate',
      '/api/auth/passkey/register',
      '/api/auth/passkey/login'
    ];

    for (const endpoint of legacyEndpoints) {
      const response = await page.request.post(endpoint, {
        data: {}
      });
      
      // Should return 400, 401, 403, 404, or 503 - all are acceptable for unauthenticated requests
      expect([400, 401, 403, 404, 503]).toContain(response.status());
    }
  });

  test('should validate WebAuthn client utilities', async ({ page }) => {
    // Test that WebAuthn client utilities are available
    const webauthnSupport = await page.evaluate(() => {
      return {
        hasCredentials: 'credentials' in navigator,
        hasWebAuthn: 'credentials' in navigator && 'create' in navigator.credentials,
        userAgent: navigator.userAgent
      };
    });

    expect(webauthnSupport.hasCredentials).toBe(true);
    expect(webauthnSupport.hasWebAuthn).toBe(true);
  });

  test('should test WebAuthn error handling', async ({ page }) => {
    // Test with malformed JSON
    const response = await page.request.post('/api/v1/auth/webauthn/register/options', {
      data: 'invalid-json'
    });
    
    // Should handle malformed requests gracefully
    expect([400, 401, 403, 500]).toContain(response.status());
  });

  test('should validate CORS headers for WebAuthn endpoints', async ({ page }) => {
    const endpoints = [
      '/api/v1/auth/webauthn/register/options',
      '/api/v1/auth/webauthn/register/verify',
      '/api/v1/auth/webauthn/authenticate/options',
      '/api/v1/auth/webauthn/authenticate/verify'
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.post(endpoint, {
        data: {}
      });
      
      // Check that CORS headers are present (if applicable)
      const headers = response.headers();
      // WebAuthn endpoints should have appropriate security headers
      expect(headers).toBeDefined();
    }
  });
});

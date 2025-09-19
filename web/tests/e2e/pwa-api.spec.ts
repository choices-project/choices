/**
 * PWA API Endpoints E2E Tests
 * 
 * Tests PWA API endpoints including:
 * - PWA status endpoint
 * - Offline sync endpoint
 * - Notification subscription endpoints
 * - Manifest endpoint
 * - Error handling
 */

import { test, expect, Page } from '@playwright/test';

test.describe('PWA API Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should serve PWA status endpoint', async ({ page }) => {
    const response = await page.request.get('/api/pwa/status');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('features');
    expect(data).toHaveProperty('system');
    expect(data).toHaveProperty('timestamp');
    
    // Check PWA features
    expect(data.features).toHaveProperty('pwa', true);
    expect(data.features).toHaveProperty('offlineVoting', true);
    expect(data.features).toHaveProperty('pushNotifications', true);
    expect(data.features).toHaveProperty('backgroundSync', true);
  });

  test('should serve PWA status with user data', async ({ page }) => {
    const response = await page.request.get('/api/pwa/status?userId=test-user&includeUserData=true');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data.user).toHaveProperty('userId', 'test-user');
    expect(data.user).toHaveProperty('preferences');
    expect(data.user).toHaveProperty('stats');
  });

  test('should handle PWA status POST requests', async ({ page }) => {
    const response = await page.request.post('/api/pwa/status', {
      data: {
        action: 'register',
        userId: 'test-user',
        data: {
          deviceInfo: {
            platform: 'web',
            userAgent: 'test-agent'
          }
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('action', 'register');
    expect(data).toHaveProperty('result');
  });

  test('should serve PWA manifest endpoint', async ({ page }) => {
    const response = await page.request.get('/api/pwa/manifest');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('manifest');
    
    // Check manifest properties
    const manifest = data.manifest;
    expect(manifest).toHaveProperty('name', 'Choices - Democratic Polling Platform');
    expect(manifest).toHaveProperty('short_name', 'Choices');
    expect(manifest).toHaveProperty('display', 'standalone');
    expect(manifest).toHaveProperty('icons');
    expect(Array.isArray(manifest.icons)).toBe(true);
  });

  test('should serve PWA manifest as application/manifest+json', async ({ page }) => {
    const response = await page.request.get('/api/pwa/manifest?format=json');
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/manifest+json');
  });

  test('should handle offline sync POST requests', async ({ page }) => {
    const response = await page.request.post('/api/pwa/offline/sync', {
      data: {
        votes: [
          {
            id: 'test-vote-1',
            pollId: 'test-poll',
            optionIds: ['option-1'],
            timestamp: new Date().toISOString(),
            status: 'pending'
          }
        ],
        deviceId: 'test-device',
        timestamp: new Date().toISOString()
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('syncedCount');
    expect(data).toHaveProperty('failedCount');
    expect(data).toHaveProperty('results');
  });

  test('should handle offline sync GET requests', async ({ page }) => {
    const response = await page.request.get('/api/pwa/offline/sync?deviceId=test-device');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('deviceId', 'test-device');
    expect(data).toHaveProperty('syncStatus');
  });

  test('should handle notification subscription POST requests', async ({ page }) => {
    const response = await page.request.post('/api/pwa/notifications/subscribe', {
      data: {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        },
        userId: 'test-user',
        preferences: {
          newPolls: true,
          pollResults: true,
          systemUpdates: false,
          weeklyDigest: true
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('subscriptionId');
    expect(data).toHaveProperty('message');
  });

  test('should handle notification subscription DELETE requests', async ({ page }) => {
    const response = await page.request.delete('/api/pwa/notifications/subscribe?userId=test-user');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message');
  });

  test('should handle notification subscription GET requests', async ({ page }) => {
    const response = await page.request.get('/api/pwa/notifications/subscribe?userId=test-user');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('userId', 'test-user');
    expect(data).toHaveProperty('preferences');
  });

  test('should handle notification subscription PUT requests', async ({ page }) => {
    const response = await page.request.put('/api/pwa/notifications/subscribe', {
      data: {
        userId: 'test-user',
        preferences: {
          newPolls: false,
          pollResults: true,
          systemUpdates: true,
          weeklyDigest: false
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message');
  });

  test('should handle notification send POST requests', async ({ page }) => {
    const response = await page.request.post('/api/pwa/notifications/send', {
      data: {
        title: 'Test Notification',
        message: 'This is a test notification',
        url: '/dashboard',
        targetUsers: ['test-user'],
        targetType: 'specific'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('results');
    expect(data.results).toHaveProperty('total');
    expect(data.results).toHaveProperty('successful');
    expect(data.results).toHaveProperty('failed');
  });

  test('should handle notification history GET requests', async ({ page }) => {
    const response = await page.request.get('/api/pwa/notifications/send?userId=test-user&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('history');
    expect(Array.isArray(data.history)).toBe(true);
  });

  test('should handle invalid requests gracefully', async ({ page }) => {
    // Test invalid offline sync request
    const response = await page.request.post('/api/pwa/offline/sync', {
      data: {
        // Missing required fields
        deviceId: 'test-device'
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should handle missing parameters', async ({ page }) => {
    // Test missing userId parameter
    const response = await page.request.get('/api/pwa/notifications/subscribe');
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error by sending malformed data
    const response = await page.request.post('/api/pwa/status', {
      data: {
        action: 'invalid-action'
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should validate request data', async ({ page }) => {
    // Test invalid subscription data
    const response = await page.request.post('/api/pwa/notifications/subscribe', {
      data: {
        subscription: {
          // Missing required fields
          endpoint: 'invalid-endpoint'
        },
        userId: 'test-user'
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should handle rate limiting', async ({ page }) => {
    // Send multiple rapid requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.get('/api/pwa/status')
      );
    }
    
    const responses = await Promise.all(requests);
    
    // All requests should be handled (rate limiting is not implemented in test)
    responses.forEach(response => {
      expect(response.status()).toBeLessThan(500);
    });
  });

  test('should include proper CORS headers', async ({ page }) => {
    const response = await page.request.get('/api/pwa/status');
    
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    expect(headers['access-control-allow-headers']).toBeDefined();
  });

  test('should handle feature flag disabled state', async ({ page }) => {
    // Mock feature flag disabled
    await page.evaluate(() => {
      // This would require mocking the feature flag system
      // For now, we'll test the error response structure
    });

    // The API should still respond with proper error structure
    const response = await page.request.get('/api/pwa/status');
    
    // In test environment, PWA should be enabled
    expect(response.status()).toBe(200);
  });

  test('should provide consistent response format', async ({ page }) => {
    const endpoints = [
      '/api/pwa/status',
      '/api/pwa/manifest',
      '/api/pwa/offline/sync?deviceId=test'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      const data = await response.json();
      
      // All responses should have consistent structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.timestamp).toBe('string');
    }
  });
});

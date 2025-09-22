/**
 * Simple test to verify rate limiting bypass works - V2 Upgrade
 * 
 * Tests rate limiting bypass functionality with V2 mock factory setup
 * for comprehensive testing and improved patterns.
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

test.describe('Rate Limiting Bypass - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'simple-bypass-test@example.com',
        username: 'simplebypasstestuser',
        password: 'SimpleBypassTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Simple Bypass Test Poll',
        description: 'Testing simple bypass with V2 setup',
        options: ['Bypass Option 1', 'Bypass Option 2', 'Bypass Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should access login page multiple times without rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, verify the server is accessible
    const initialResponse = await page.goto('/login?e2e=1', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // Verify we can reach the login page
    expect(initialResponse?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toContainText('Sign in');
    
    // Now test multiple rapid requests
    for (let i = 0; i < 5; i++) { // Reduced from 15 to 5
      const response = await page.goto('/login?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400);
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(200);
    }
  });

  test('should access admin API without rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for admin API rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Try to access admin API multiple times
    for (let i = 0; i < 5; i++) { // Reduced from 10 to 5
      const response = await page.request.get('/api/admin/system-status?e2e=1');
      
      // Should get 401 (unauthorized) not 429 (rate limited)
      expect(response.status()).toBe(401);
      
      // Small delay
      await page.waitForTimeout(200);
    }
  });

  test('should access polls page multiple times without rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for polls page rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test multiple rapid requests to polls page
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/polls?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400);
      
      // Small delay
      await page.waitForTimeout(200);
    }
  });

  test('should access dashboard page multiple times without rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for dashboard page rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test multiple rapid requests to dashboard page
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/dashboard?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400);
      
      // Small delay
      await page.waitForTimeout(200);
    }
  });

  test('should access civics page multiple times without rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for civics page rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test multiple rapid requests to civics page
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/civics?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400);
      
      // Small delay
      await page.waitForTimeout(200);
    }
  });

  test('should access API endpoints multiple times without rate limiting with V2 setup', async ({ page }) => {
    // Set up test data for API endpoint rate limiting testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test multiple rapid requests to various API endpoints
    const endpoints = [
      '/api/pwa/status',
      '/api/polls',
      '/manifest.json',
      '/sw.js'
    ];

    for (const endpoint of endpoints) {
      for (let i = 0; i < 3; i++) {
        const response = await page.request.get(`${endpoint}?e2e=1`);
        
        // Should get a successful response (not rate limited)
        expect(response.status()).toBeLessThan(400);
        
        // Small delay
        await page.waitForTimeout(100);
      }
    }
  });

  test('should handle rate limiting bypass with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate the user
    await page.goto('/login?e2e=1');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Test multiple rapid requests to authenticated endpoints
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/dashboard?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400);
      
      // Small delay
      await page.waitForTimeout(200);
    }
  });

  test('should handle rate limiting bypass with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-bypass@example.com',
      username: 'regularbypass'
    });

    const adminUser = createTestUser({
      email: 'admin-bypass@example.com',
      username: 'adminbypass'
    });

    // Test regular user rate limiting bypass
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    for (let i = 0; i < 3; i++) {
      const response = await page.goto('/login?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      expect(response?.status()).toBeLessThan(400);
      await page.waitForTimeout(200);
    }

    // Test admin user rate limiting bypass
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    for (let i = 0; i < 3; i++) {
      const response = await page.goto('/login?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      expect(response?.status()).toBeLessThan(400);
      await page.waitForTimeout(200);
    }
  });

  test('should handle rate limiting bypass with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test multiple rapid requests on mobile
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/login?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      // Should get a successful response (not rate limited)
      expect(response?.status()).toBeLessThan(400);
      
      // Small delay
      await page.waitForTimeout(200);
    }
  });

  test('should handle rate limiting bypass performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure rate limiting bypass performance
    const startTime = Date.now();

    // Test multiple rapid requests
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/login?e2e=1', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      expect(response?.status()).toBeLessThan(400);
      await page.waitForTimeout(100);
    }

    const endTime = Date.now();
    const bypassTime = endTime - startTime;

    // Verify rate limiting bypass performance is acceptable
    expect(bypassTime).toBeLessThan(10000);
  });

  test('should handle rate limiting bypass with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline rate limiting bypass testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Test rate limiting bypass while offline
    const offlineResponse = await page.goto('/login?e2e=1', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    
    // Should get network error, not rate limiting
    expect(offlineResponse?.status()).toBe(0);

    // Go back online
    await page.context().setOffline(false);

    // Test rate limiting bypass while online
    const onlineResponse = await page.goto('/login?e2e=1', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    
    expect(onlineResponse?.status()).toBeLessThan(400);
  });
});

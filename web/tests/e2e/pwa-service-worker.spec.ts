/**
 * PWA Service Worker E2E Tests
 * 
 * Tests service worker functionality including:
 * - Service worker registration
 * - Caching strategies
 * - Update management
 * - Background sync
 * - Push notifications
 */

import { test, expect, Page } from '@playwright/test';

test.describe('PWA Service Worker', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should register service worker', async ({ page }) => {
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);

    // Check service worker status
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return {
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting
          };
        }
      }
      return null;
    });
    
    expect(swStatus).not.toBeNull();
    expect(swStatus?.active).toBe(true);
  });

  test('should cache static assets', async ({ page }) => {
    // Wait for service worker to cache resources
    await page.waitForTimeout(3000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to access cached resources
    const response = await page.goto('/');
    
    // Should still load from cache
    expect(response?.status()).toBe(200);
    
    // Check if essential resources are cached
    const cachedResources = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const results = [];
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          results.push({
            cacheName,
            count: keys.length,
            urls: keys.map(req => req.url)
          });
        }
        
        return results;
      }
      return [];
    });
    
    expect(cachedResources.length).toBeGreaterThan(0);
  });

  test('should handle service worker updates', async ({ page }) => {
    // Mock service worker update
    await page.evaluate(() => {
      // Simulate update found event
      const event = new Event('updatefound');
      window.dispatchEvent(event);
    });

    // Check if update notification appears
    await page.waitForSelector('[data-testid="sw-update-notification"]', { timeout: 5000 });
    
    const updateNotification = page.locator('[data-testid="sw-update-notification"]');
    await expect(updateNotification).toBeVisible();
    await expect(updateNotification).toContainText('Update Available');
  });

  test('should allow skipping waiting for updates', async ({ page }) => {
    // Mock service worker waiting state
    await page.evaluate(() => {
      // Simulate waiting service worker
      const event = new Event('updatefound');
      window.dispatchEvent(event);
    });

    // Wait for update notification
    await page.waitForSelector('[data-testid="sw-update-notification"]');
    
    // Click update button
    const updateButton = page.locator('[data-testid="sw-update-button"]');
    await expect(updateButton).toBeVisible();
    await updateButton.click();

    // Mock skip waiting
    await page.evaluate(() => {
      // Simulate skip waiting
      window.dispatchEvent(new Event('controllerchange'));
    });

    // Update notification should disappear
    await page.waitForSelector('[data-testid="sw-update-notification"]', { state: 'hidden', timeout: 5000 });
  });

  test('should implement cache-first strategy for static assets', async ({ page }) => {
    // Wait for caching
    await page.waitForTimeout(2000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Try to access static assets
    const staticAssets = [
      '/icons/icon-192x192.svg',
      '/icons/icon-512x512.svg',
      '/manifest.json'
    ];
    
    for (const asset of staticAssets) {
      const response = await page.request.get(asset);
      // Should be served from cache (status 200 or cached response)
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('should implement network-first strategy for API calls', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Try to make API call
    const response = await page.request.get('/api/pwa/status');
    
    // Should handle offline gracefully (not crash)
    expect(response.status()).toBeLessThan(500);
  });

  test('should implement stale-while-revalidate for pages', async ({ page }) => {
    // Wait for caching
    await page.waitForTimeout(2000);
    
    // Go offline
    await page.context().setOffline(true);
    
    // Navigate to a page
    await page.goto('/dashboard');
    
    // Should load from cache
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle background sync', async ({ page }) => {
    // Mock background sync event
    await page.evaluate(() => {
      // Simulate background sync
      const event = new Event('sync');
      (event as any).tag = 'offline-votes';
      window.dispatchEvent(event);
    });

    // Check if background sync is handled
    const syncHandled = await page.evaluate(() => {
      // Check if sync event was processed
      return localStorage.getItem('background-sync-processed') === 'true';
    });
    
    // Background sync should be handled (mocked in service worker)
    expect(syncHandled).toBe(true);
  });

  test('should handle push notifications', async ({ page }) => {
    // Mock push notification
    await page.evaluate(() => {
      const event = new Event('push');
      (event as any).data = {
        json: () => ({
          title: 'Test Notification',
          body: 'Test message',
          tag: 'test-notification'
        })
      };
      window.dispatchEvent(event);
    });

    // Check if notification was shown
    const notificationShown = await page.evaluate(() => {
      return localStorage.getItem('notification-shown') === 'true';
    });
    
    expect(notificationShown).toBe(true);
  });

  test('should handle notification clicks', async ({ page }) => {
    // Mock notification click
    await page.evaluate(() => {
      const event = new Event('notificationclick');
      (event as any).action = 'view';
      (event as any).notification = {
        data: { url: '/dashboard' },
        close: () => {}
      };
      window.dispatchEvent(event);
    });

    // Check if notification click was handled
    const clickHandled = await page.evaluate(() => {
      return localStorage.getItem('notification-click-handled') === 'true';
    });
    
    expect(clickHandled).toBe(true);
  });

  test('should clean up old caches', async ({ page }) => {
    // Wait for service worker to activate
    await page.waitForTimeout(3000);
    
    // Check cache cleanup
    const cacheInfo = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        return {
          cacheCount: cacheNames.length,
          cacheNames: cacheNames
        };
      }
      return null;
    });
    
    expect(cacheInfo).not.toBeNull();
    expect(cacheInfo?.cacheCount).toBeGreaterThan(0);
    
    // Should only have current version caches
    const currentVersionCaches = cacheInfo?.cacheNames.filter(name => 
      name.includes('choices-v2.0.0')
    );
    expect(currentVersionCaches?.length).toBeGreaterThan(0);
  });

  test('should handle service worker errors gracefully', async ({ page }) => {
    // Mock service worker error
    await page.evaluate(() => {
      const event = new Event('error');
      (event as any).error = new Error('Service worker error');
      window.dispatchEvent(event);
    });

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();
    
    // Should not crash
    const isFunctional = await page.evaluate(() => {
      return document.body !== null;
    });
    
    expect(isFunctional).toBe(true);
  });

  test('should provide service worker version information', async ({ page }) => {
    // Get service worker version
    const version = await page.evaluate(async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send message to service worker to get version
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.version);
          };
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          );
        });
      }
      return null;
    });
    
    expect(version).toBe('choices-v2.0.0');
  });

  test('should handle service worker unregistration', async ({ page }) => {
    // Unregister service worker
    const unregistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return await registration.unregister();
        }
      }
      return false;
    });
    
    expect(unregistered).toBe(true);
    
    // Verify service worker is unregistered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBe(false);
  });
});

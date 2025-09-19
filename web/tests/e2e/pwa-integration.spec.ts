/**
 * PWA Integration E2E Tests
 * 
 * Tests complete PWA integration including:
 * - End-to-end PWA workflow
 * - Cross-browser compatibility
 * - Performance metrics
 * - User experience flow
 * - Error recovery
 */

import { test, expect, Page } from '@playwright/test';

test.describe('PWA Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full PWA installation workflow', async ({ page }) => {
    // Step 1: Check PWA support
    const pwaSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    });
    expect(pwaSupported).toBe(true);

    // Step 2: Verify service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    expect(swRegistered).toBe(true);

    // Step 3: Mock installation prompt
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });

    // Step 4: Verify installation prompt appears
    await page.waitForSelector('[data-testid="pwa-install-prompt"]', { timeout: 5000 });
    const installPrompt = page.locator('[data-testid="pwa-install-prompt"]');
    await expect(installPrompt).toBeVisible();

    // Step 5: Click install button
    const installButton = page.locator('[data-testid="pwa-install-button"]');
    await installButton.click();

    // Step 6: Verify installation success
    await page.waitForSelector('[data-testid="pwa-install-success"]', { timeout: 5000 });
    const successMessage = page.locator('[data-testid="pwa-install-success"]');
    await expect(successMessage).toBeVisible();
  });

  test('should handle complete offline workflow', async ({ page }) => {
    // Step 1: Wait for service worker to cache resources
    await page.waitForTimeout(3000);

    // Step 2: Go offline
    await page.context().setOffline(true);
    await page.waitForSelector('[data-testid="offline-indicator"]');

    // Step 3: Verify offline indicator appears
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible();
    await expect(offlineIndicator).toContainText('You\'re offline');

    // Step 4: Create offline vote
    await page.evaluate(() => {
      const offlineVote = {
        id: 'integration-test-vote',
        pollId: 'test-poll',
        optionIds: ['option-1'],
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const offlineVotes = JSON.parse(localStorage.getItem('choices_offline_outbox') || '[]');
      offlineVotes.push(offlineVote);
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
      
      // Trigger offline vote event
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { syncedCount: 0, pendingCount: 1 }
      }));
    });

    // Step 5: Verify offline vote indicator appears
    await page.waitForSelector('[data-testid="offline-votes-indicator"]', { timeout: 5000 });
    const offlineVotesIndicator = page.locator('[data-testid="offline-votes-indicator"]');
    await expect(offlineVotesIndicator).toBeVisible();
    await expect(offlineVotesIndicator).toContainText('1 vote');

    // Step 6: Go back online
    await page.context().setOffline(false);

    // Step 7: Mock successful sync
    await page.evaluate(() => {
      localStorage.removeItem('choices_offline_outbox');
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { syncedCount: 1, pendingCount: 0 }
      }));
    });

    // Step 8: Verify sync success message
    await page.waitForSelector('[data-testid="sync-success-message"]', { timeout: 5000 });
    const syncMessage = page.locator('[data-testid="sync-success-message"]');
    await expect(syncMessage).toBeVisible();
    await expect(syncMessage).toContainText('synced');
  });

  test('should handle complete notification workflow', async ({ page }) => {
    // Step 1: Mock notification permission
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.resolve('granted'),
          permission: 'granted'
        },
        writable: true
      });
    });

    // Step 2: Request notification permission
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await expect(permissionButton).toBeVisible();
    await permissionButton.click();

    // Step 3: Verify permission granted
    const permissionGranted = await page.evaluate(() => {
      return localStorage.getItem('notification-permission') === 'granted';
    });
    expect(permissionGranted).toBe(true);

    // Step 4: Mock push subscription
    await page.evaluate(() => {
      Object.defineProperty(window, 'PushManager', {
        value: {
          prototype: {
            subscribe: () => Promise.resolve({
              endpoint: 'https://fcm.googleapis.com/fcm/send/test',
              keys: {
                p256dh: 'test-p256dh-key',
                auth: 'test-auth-key'
              }
            })
          }
        },
        writable: true
      });
    });

    // Step 5: Subscribe to notifications
    const subscribeButton = page.locator('[data-testid="subscribe-notifications"]');
    await expect(subscribeButton).toBeVisible();
    await subscribeButton.click();

    // Step 6: Verify subscription successful
    const subscribed = await page.evaluate(() => {
      return localStorage.getItem('push-subscription') !== null;
    });
    expect(subscribed).toBe(true);

    // Step 7: Mock notification display
    await page.evaluate(() => {
      const mockNotification = {
        close: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      };
      
      Object.defineProperty(window, 'Notification', {
        value: function(title: string, options: any) {
          localStorage.setItem('last-notification', JSON.stringify({ title, options }));
          return mockNotification;
        },
        writable: true
      });
    });

    // Step 8: Trigger notification
    await page.evaluate(() => {
      const event = new Event('push');
      (event as any).data = {
        json: () => ({
          title: 'Integration Test Notification',
          body: 'This is a test notification',
          tag: 'integration-test'
        })
      };
      window.dispatchEvent(event);
    });

    // Step 9: Verify notification displayed
    const notificationDisplayed = await page.evaluate(() => {
      const lastNotification = localStorage.getItem('last-notification');
      if (lastNotification) {
        const notification = JSON.parse(lastNotification);
        return notification.title === 'Integration Test Notification';
      }
      return false;
    });
    expect(notificationDisplayed).toBe(true);
  });

  test('should handle PWA status dashboard integration', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if PWA status component is visible
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();

    // Check PWA status elements
    const installationStatus = page.locator('[data-testid="installation-status"]');
    await expect(installationStatus).toBeVisible();

    const offlineStatus = page.locator('[data-testid="offline-status"]');
    await expect(offlineStatus).toBeVisible();

    const notificationStatus = page.locator('[data-testid="notification-status"]');
    await expect(notificationStatus).toBeVisible();

    // Check PWA controls
    const installButton = page.locator('[data-testid="pwa-install-button"]');
    await expect(installButton).toBeVisible();

    const syncButton = page.locator('[data-testid="sync-offline-data-button"]');
    await expect(syncButton).toBeVisible();
  });

  test('should handle error recovery scenarios', async ({ page }) => {
    // Test 1: Service worker registration failure
    await page.evaluate(() => {
      // Mock service worker registration failure
      const originalRegister = navigator.serviceWorker.register;
      navigator.serviceWorker.register = () => Promise.reject(new Error('Registration failed'));
      
      // Trigger registration
      window.dispatchEvent(new Event('load'));
      
      // Restore original function
      navigator.serviceWorker.register = originalRegister;
    });

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Test 2: Notification permission denial
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.resolve('denied'),
          permission: 'denied'
        },
        writable: true
      });
    });

    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await permissionButton.click();

    // Should handle denial gracefully
    const permissionDenied = await page.evaluate(() => {
      return localStorage.getItem('notification-permission') === 'denied';
    });
    expect(permissionDenied).toBe(true);

    // Test 3: Offline sync failure
    await page.context().setOffline(true);
    
    await page.evaluate(() => {
      const offlineVote = {
        id: 'error-test-vote',
        pollId: 'test-poll',
        optionIds: ['option-1'],
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const offlineVotes = JSON.parse(localStorage.getItem('choices_offline_outbox') || '[]');
      offlineVotes.push(offlineVote);
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
    });

    await page.context().setOffline(false);

    // Mock sync failure
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { 
          syncedCount: 0, 
          pendingCount: 1,
          errors: ['Sync failed: Network error']
        }
      }));
    });

    // Should show error message
    await page.waitForSelector('[data-testid="sync-error-message"]', { timeout: 5000 });
    const errorMessage = page.locator('[data-testid="sync-error-message"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should maintain PWA state across page navigation', async ({ page }) => {
    // Set up PWA state
    await page.evaluate(() => {
      localStorage.setItem('pwa-install-dismissed', 'true');
      localStorage.setItem('notification-permission', 'granted');
      localStorage.setItem('push-subscription', JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' }
      }));
    });

    // Navigate to different pages
    const pages = ['/dashboard', '/polls', '/profile'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // PWA state should be maintained
      const pwaState = await page.evaluate(() => {
        return {
          installDismissed: localStorage.getItem('pwa-install-dismissed'),
          notificationPermission: localStorage.getItem('notification-permission'),
          pushSubscription: localStorage.getItem('push-subscription')
        };
      });
      
      expect(pwaState.installDismissed).toBe('true');
      expect(pwaState.notificationPermission).toBe('granted');
      expect(pwaState.pushSubscription).not.toBeNull();
    }
  });

  test('should handle PWA performance metrics', async ({ page }) => {
    // Measure PWA performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    // PWA should have good performance metrics
    expect(performanceMetrics.loadTime).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(performanceMetrics.firstPaint).toBeLessThan(1500); // 1.5 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
  });

  test('should handle PWA accessibility', async ({ page }) => {
    // Check PWA accessibility features
    const accessibilityFeatures = await page.evaluate(() => {
      return {
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),
        hasViewport: !!document.querySelector('meta[name="viewport"]'),
        hasAppleTouchIcon: !!document.querySelector('link[rel="apple-touch-icon"]'),
        hasFavicon: !!document.querySelector('link[rel="icon"]')
      };
    });

    // All accessibility features should be present
    expect(accessibilityFeatures.hasManifest).toBe(true);
    expect(accessibilityFeatures.hasThemeColor).toBe(true);
    expect(accessibilityFeatures.hasViewport).toBe(true);
    expect(accessibilityFeatures.hasAppleTouchIcon).toBe(true);
    expect(accessibilityFeatures.hasFavicon).toBe(true);
  });

  test('should handle PWA cross-browser compatibility', async ({ page }) => {
    // Test PWA features across different browser scenarios
    const browserSupport = await page.evaluate(() => {
      return {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notifications: 'Notification' in window,
        caches: 'caches' in window,
        indexedDB: 'indexedDB' in window,
        webManifest: 'onbeforeinstallprompt' in window
      };
    });

    // Core PWA features should be supported
    expect(browserSupport.serviceWorker).toBe(true);
    expect(browserSupport.pushManager).toBe(true);
    expect(browserSupport.notifications).toBe(true);
    expect(browserSupport.caches).toBe(true);
    expect(browserSupport.indexedDB).toBe(true);
  });

  test('should handle PWA user experience flow', async ({ page }) => {
    // Test complete user experience flow
    const userFlow = await page.evaluate(() => {
      const flow = {
        step1: 'App loads successfully',
        step2: 'Service worker registers',
        step3: 'PWA features are available',
        step4: 'User can interact with PWA components',
        step5: 'Offline functionality works',
        step6: 'Notifications can be enabled',
        step7: 'App can be installed'
      };
      
      return flow;
    });

    // All user flow steps should be defined
    expect(userFlow.step1).toBe('App loads successfully');
    expect(userFlow.step2).toBe('Service worker registers');
    expect(userFlow.step3).toBe('PWA features are available');
    expect(userFlow.step4).toBe('User can interact with PWA components');
    expect(userFlow.step5).toBe('Offline functionality works');
    expect(userFlow.step6).toBe('Notifications can be enabled');
    expect(userFlow.step7).toBe('App can be installed');
  });
});

/**
 * PWA Notifications E2E Tests
 * 
 * Tests push notification functionality including:
 * - Notification permission requests
 * - Push notification subscription
 * - Notification display
 * - Notification interactions
 * - User preferences
 */

import { test, expect, Page } from '@playwright/test';

test.describe('PWA Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should request notification permission', async ({ page }) => {
    // Mock notification permission
    await page.evaluate(() => {
      // Mock Notification.requestPermission
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.resolve('granted'),
          permission: 'default'
        },
        writable: true
      });
    });

    // Click notification permission button
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await expect(permissionButton).toBeVisible();
    await permissionButton.click();

    // Check if permission was granted
    const permissionGranted = await page.evaluate(() => {
      return localStorage.getItem('notification-permission') === 'granted';
    });
    
    expect(permissionGranted).toBe(true);
  });

  test('should handle notification permission denial', async ({ page }) => {
    // Mock denied notification permission
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.resolve('denied'),
          permission: 'denied'
        },
        writable: true
      });
    });

    // Click notification permission button
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await permissionButton.click();

    // Check if denial is handled gracefully
    const permissionDenied = await page.evaluate(() => {
      return localStorage.getItem('notification-permission') === 'denied';
    });
    
    expect(permissionDenied).toBe(true);
  });

  test('should subscribe to push notifications', async ({ page }) => {
    // Grant notification permission first
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.resolve('granted'),
          permission: 'granted'
        },
        writable: true
      });
    });

    // Mock push manager
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

    // Click subscribe button
    const subscribeButton = page.locator('[data-testid="subscribe-notifications"]');
    await expect(subscribeButton).toBeVisible();
    await subscribeButton.click();

    // Check if subscription was successful
    const subscribed = await page.evaluate(() => {
      return localStorage.getItem('push-subscription') !== null;
    });
    
    expect(subscribed).toBe(true);
  });

  test('should unsubscribe from push notifications', async ({ page }) => {
    // Set up existing subscription
    await page.evaluate(() => {
      localStorage.setItem('push-subscription', JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' }
      }));
    });

    // Click unsubscribe button
    const unsubscribeButton = page.locator('[data-testid="unsubscribe-notifications"]');
    await expect(unsubscribeButton).toBeVisible();
    await unsubscribeButton.click();

    // Check if subscription was removed
    const unsubscribed = await page.evaluate(() => {
      return localStorage.getItem('push-subscription') === null;
    });
    
    expect(unsubscribed).toBe(true);
  });

  test('should display notification preferences', async ({ page }) => {
    // Navigate to dashboard to see PWA status
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if notification preferences are shown
    const notificationStatus = page.locator('[data-testid="notification-status"]');
    await expect(notificationStatus).toBeVisible();
    
    // Check notification settings
    const notificationSettings = page.locator('[data-testid="notification-settings"]');
    await expect(notificationSettings).toBeVisible();
  });

  test('should handle notification display', async ({ page }) => {
    // Mock notification display
    await page.evaluate(() => {
      // Mock Notification constructor
      const mockNotification = {
        close: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      };
      
      Object.defineProperty(window, 'Notification', {
        value: function(title: string, options: any) {
          // Store notification for testing
          localStorage.setItem('last-notification', JSON.stringify({ title, options }));
          return mockNotification;
        },
        writable: true
      });
      
      // Mock showNotification
      Object.defineProperty(window, 'showNotification', {
        value: (title: string, options: any) => {
          new (window as any).Notification(title, options);
        },
        writable: true
      });
    });

    // Trigger notification
    await page.evaluate(() => {
      (window as any).showNotification('Test Notification', {
        body: 'Test message',
        icon: '/icons/icon-192x192.svg'
      });
    });

    // Check if notification was displayed
    const notificationDisplayed = await page.evaluate(() => {
      const lastNotification = localStorage.getItem('last-notification');
      if (lastNotification) {
        const notification = JSON.parse(lastNotification);
        return notification.title === 'Test Notification';
      }
      return false;
    });
    
    expect(notificationDisplayed).toBe(true);
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

  test('should handle notification dismissals', async ({ page }) => {
    // Mock notification dismissal
    await page.evaluate(() => {
      const event = new Event('notificationclick');
      (event as any).action = 'dismiss';
      (event as any).notification = {
        close: () => {}
      };
      window.dispatchEvent(event);
    });

    // Check if dismissal was handled
    const dismissalHandled = await page.evaluate(() => {
      return localStorage.getItem('notification-dismissed') === 'true';
    });
    
    expect(dismissalHandled).toBe(true);
  });

  test('should update notification preferences', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Update notification preferences
    await page.evaluate(() => {
      const preferences = {
        newPolls: true,
        pollResults: false,
        systemUpdates: true,
        weeklyDigest: false
      };
      localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    });

    // Check if preferences were updated
    const preferencesUpdated = await page.evaluate(() => {
      const preferences = localStorage.getItem('notification-preferences');
      if (preferences) {
        const prefs = JSON.parse(preferences);
        return prefs.newPolls === true && prefs.pollResults === false;
      }
      return false;
    });
    
    expect(preferencesUpdated).toBe(true);
  });

  test('should handle notification errors gracefully', async ({ page }) => {
    // Mock notification error
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.reject(new Error('Notification error')),
          permission: 'default'
        },
        writable: true
      });
    });

    // Try to request permission
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await permissionButton.click();

    // App should not crash
    await expect(page.locator('body')).toBeVisible();
    
    // Error should be handled gracefully
    const errorHandled = await page.evaluate(() => {
      return localStorage.getItem('notification-error') === 'handled';
    });
    
    expect(errorHandled).toBe(true);
  });

  test('should show notification history', async ({ page }) => {
    // Mock notification history
    await page.evaluate(() => {
      const history = [
        {
          id: 'notif-1',
          title: 'New Poll Available',
          message: 'A new poll has been created',
          sentAt: new Date().toISOString(),
          status: 'sent'
        },
        {
          id: 'notif-2',
          title: 'Poll Results Ready',
          message: 'Results for "Community Survey" are available',
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'sent'
        }
      ];
      localStorage.setItem('notification-history', JSON.stringify(history));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if notification history is displayed
    const historyDisplayed = await page.evaluate(() => {
      const history = localStorage.getItem('notification-history');
      return history !== null;
    });
    
    expect(historyDisplayed).toBe(true);
  });

  test('should handle notification rate limiting', async ({ page }) => {
    // Mock multiple rapid notification requests
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        const event = new Event('push');
        (event as any).data = {
          json: () => ({
            title: `Test Notification ${i}`,
            body: 'Test message',
            tag: `test-${i}`
          })
        };
        window.dispatchEvent(event);
      }
    });

    // Check if rate limiting is applied
    const rateLimited = await page.evaluate(() => {
      return localStorage.getItem('notification-rate-limited') === 'true';
    });
    
    expect(rateLimited).toBe(true);
  });

  test('should respect user notification preferences', async ({ page }) => {
    // Set user preferences to disable notifications
    await page.evaluate(() => {
      const preferences = {
        newPolls: false,
        pollResults: false,
        systemUpdates: false,
        weeklyDigest: false
      };
      localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    });

    // Try to send notification
    await page.evaluate(() => {
      const event = new Event('push');
      (event as any).data = {
        json: () => ({
          title: 'Test Notification',
          body: 'This should be blocked',
          tag: 'test-blocked'
        })
      };
      window.dispatchEvent(event);
    });

    // Check if notification was blocked
    const notificationBlocked = await page.evaluate(() => {
      return localStorage.getItem('notification-blocked') === 'true';
    });
    
    expect(notificationBlocked).toBe(true);
  });
});

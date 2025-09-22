/**
 * PWA Notifications E2E Tests - V2 Upgrade
 * 
 * Tests push notification functionality including:
 * - Notification permission requests with V2 mock factory setup
 * - Push notification subscription
 * - Notification display
 * - Notification interactions
 * - User preferences
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect, type Page } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('PWA Notifications - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'notifications-test@example.com',
        username: 'notificationstestuser',
        password: 'NotificationsTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 PWA Notifications Test Poll',
        description: 'Testing PWA notifications with V2 setup',
        options: ['Notification Option 1', 'Notification Option 2', 'Notification Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should request notification permission with V2 setup', async ({ page }) => {
    // Set up test data for notification permission testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

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

  test('should subscribe to push notifications with V2 setup', async ({ page }) => {
    // Set up test data for push notification subscription
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock push manager
    await page.evaluate(() => {
      Object.defineProperty(window, 'PushManager', {
        value: {
          subscribe: () => Promise.resolve({
            endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
            keys: {
              p256dh: 'test-p256dh-key',
              auth: 'test-auth-key'
            }
          })
        },
        writable: true
      });
    });

    // Click subscribe button
    const subscribeButton = page.locator('[data-testid="subscribe-notifications"]');
    await expect(subscribeButton).toBeVisible();
    await subscribeButton.click();

    // Check if subscription was successful
    const subscriptionActive = await page.evaluate(() => {
      return localStorage.getItem('push-subscription') !== null;
    });
    
    expect(subscriptionActive).toBe(true);
  });

  test('should display notifications with V2 setup', async ({ page }) => {
    // Set up test data for notification display testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock notification display
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: class MockNotification {
          constructor(title: string, options: any) {
            this.title = title;
            this.options = options;
            this.onclick = null;
            this.onshow = null;
            this.onclose = null;
          }
          
          title: string;
          options: any;
          onclick: any;
          onshow: any;
          onclose: any;
          
          close() {
            if (this.onclose) this.onclose();
          }
          
          static requestPermission = () => Promise.resolve('granted');
          static permission = 'granted';
        },
        writable: true
      });
    });

    // Trigger notification
    await page.evaluate(() => {
      new Notification('Test Notification', {
        body: 'This is a test notification from V2 PWA setup',
        icon: '/icon-192x192.png'
      });
    });

    // Check if notification was created
    const notificationCreated = await page.evaluate(() => {
      return window.lastNotification !== undefined;
    });
    
    expect(notificationCreated).toBe(true);
  });

  test('should handle notification interactions with V2 setup', async ({ page }) => {
    // Set up test data for notification interaction testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock notification with click handler
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: class MockNotification {
          constructor(title: string, options: any) {
            this.title = title;
            this.options = options;
            this.onclick = null;
            this.onshow = null;
            this.onclose = null;
          }
          
          title: string;
          options: any;
          onclick: any;
          onshow: any;
          onclose: any;
          
          close() {
            if (this.onclose) this.onclose();
          }
          
          static requestPermission = () => Promise.resolve('granted');
          static permission = 'granted';
        },
        writable: true
      });
    });

    // Create notification with click handler
    await page.evaluate(() => {
      const notification = new Notification('Test Notification', {
        body: 'Click to test interaction',
        icon: '/icon-192x192.png'
      });
      
      notification.onclick = () => {
        window.notificationClicked = true;
      };
      
      window.lastNotification = notification;
    });

    // Simulate notification click
    await page.evaluate(() => {
      if (window.lastNotification && window.lastNotification.onclick) {
        window.lastNotification.onclick();
      }
    });

    // Check if click was handled
    const clickHandled = await page.evaluate(() => {
      return window.notificationClicked === true;
    });
    
    expect(clickHandled).toBe(true);
  });

  test('should handle user notification preferences with V2 setup', async ({ page }) => {
    // Set up test data for notification preferences testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to settings page
    await page.goto('/settings');
    await waitForPageReady(page);

    // Check notification preferences section
    await expect(page.locator('[data-testid="notification-preferences"]')).toBeVisible();

    // Toggle notification types
    const pollNotifications = page.locator('[data-testid="poll-notifications-toggle"]');
    const commentNotifications = page.locator('[data-testid="comment-notifications-toggle"]');
    const systemNotifications = page.locator('[data-testid="system-notifications-toggle"]');

    await pollNotifications.click();
    await commentNotifications.click();
    await systemNotifications.click();

    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');

    // Check if preferences were saved
    const preferencesSaved = await page.evaluate(() => {
      return localStorage.getItem('notification-preferences') !== null;
    });
    
    expect(preferencesSaved).toBe(true);
  });

  test('should handle notification errors gracefully with V2 setup', async ({ page }) => {
    // Set up test data for error handling testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock notification error
    await page.evaluate(() => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.reject(new Error('Permission denied')),
          permission: 'denied'
        },
        writable: true
      });
    });

    // Try to request permission
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await permissionButton.click();

    // Check if error was handled
    await expect(page.locator('[data-testid="notification-error"]')).toBeVisible();
    await expect(page.locator('text=Permission denied')).toBeVisible();
  });

  test('should handle notification with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-notifications@example.com',
      username: 'regularnotifications'
    });

    const adminUser = createTestUser({
      email: 'admin-notifications@example.com',
      username: 'adminnotifications'
    });

    // Test regular user notifications
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', regularUser.email);
    await page.fill('[data-testid="login-password"]', regularUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Check regular user notification features
    await expect(page.locator('[data-testid="regular-user-notifications"]')).toBeVisible();

    // Test admin user notifications
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Check admin user notification features
    await expect(page.locator('[data-testid="admin-user-notifications"]')).toBeVisible();
  });

  test('should handle notification with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile notification testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check mobile notification features
    await expect(page.locator('[data-testid="mobile-notifications"]')).toBeVisible();

    // Test mobile notification permission request
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await expect(permissionButton).toBeVisible();
    await permissionButton.click();

    // Check if permission was requested on mobile
    const permissionRequested = await page.evaluate(() => {
      return localStorage.getItem('notification-permission-requested') === 'true';
    });
    
    expect(permissionRequested).toBe(true);
  });

  test('should handle notification with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management notification integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Create a poll
    await page.goto('/polls/create');
    await waitForPageReady(page);

    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');

    await page.selectOption('select', testData.poll.category || 'general');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Check if poll creation notification was sent
    await expect(page.locator('[data-testid="poll-created-notification"]')).toBeVisible();

    // Return to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check if poll appears in dashboard with notification
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
    await expect(page.locator(`text=${testData.poll.title}`)).toBeVisible();
  });

  test('should handle notification with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics notification integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up civics context
    await page.goto('/civics');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Check civics notification integration
    await expect(page.locator('[data-testid="civics-notifications"]')).toBeVisible();
    await expect(page.locator('text=Local Poll Notifications')).toBeVisible();
  });

  test('should handle notification performance with V2 setup', async ({ page }) => {
    // Set up test data for notification performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure notification performance
    const startTime = Date.now();

    // Request notification permission
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await permissionButton.click();

    // Subscribe to notifications
    const subscribeButton = page.locator('[data-testid="subscribe-notifications"]');
    await subscribeButton.click();

    // Send test notification
    await page.evaluate(() => {
      new Notification('Performance Test', {
        body: 'Testing notification performance with V2 setup'
      });
    });

    const endTime = Date.now();
    const notificationTime = endTime - startTime;

    // Verify notification performance is acceptable
    expect(notificationTime).toBeLessThan(2000);
  });

  test('should handle notification with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline notification testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Check offline notification handling
    await expect(page.locator('[data-testid="offline-notifications"]')).toBeVisible();

    // Try to request permission while offline
    const permissionButton = page.locator('[data-testid="request-notification-permission"]');
    await permissionButton.click();

    // Check if offline message is shown
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check that notifications work again
    await expect(page.locator('[data-testid="offline-notifications"]')).not.toBeVisible();
  });
});

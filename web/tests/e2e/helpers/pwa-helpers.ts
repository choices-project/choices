/**
 * PWA Test Helpers
 * 
 * Utility functions for PWA E2E testing including:
 * - Service worker management
 * - Notification mocking
 * - Offline state management
 * - PWA feature detection
 */

import { type Page, expect } from '@playwright/test';

export class PWAHelpers {
  constructor(private page: Page) {}

  /**
   * Check if PWA features are supported in the current browser
   */
  async checkPWASupport(): Promise<{
    serviceWorker: boolean;
    pushManager: boolean;
    notifications: boolean;
    caches: boolean;
    indexedDB: boolean;
    webManifest: boolean;
  }> {
    return await this.page.evaluate(() => {
      return {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notifications: 'Notification' in window,
        caches: 'caches' in window,
        indexedDB: 'indexedDB' in window,
        webManifest: 'onbeforeinstallprompt' in window
      };
    });
  }

  /**
   * Wait for service worker to be registered and active
   */
  async waitForServiceWorker(timeout = 10000): Promise<boolean> {
    return await this.page.evaluate(async (timeout) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkSW = async () => {
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.active) {
              resolve(true);
              return;
            }
          }
          
          if (Date.now() - startTime > timeout) {
            resolve(false);
            return;
          }
          
          setTimeout(checkSW, 100);
        };
        
        checkSW();
      });
    }, timeout);
  }

  /**
   * Mock service worker registration
   */
  async mockServiceWorkerRegistration(success = true): Promise<void> {
    await this.page.evaluate((success) => {
      if (success) {
        // Mock successful registration
        const mockRegistration = {
          active: { state: 'activated' },
          installing: null,
          waiting: null,
          unregister: () => Promise.resolve(true)
        };
        
        Object.defineProperty(navigator.serviceWorker, 'register', {
          value: () => Promise.resolve(mockRegistration),
          writable: true
        });
      } else {
        // Mock failed registration
        Object.defineProperty(navigator.serviceWorker, 'register', {
          value: () => Promise.reject(new Error('Registration failed')),
          writable: true
        });
      }
    }, success);
  }

  /**
   * Mock notification permission
   */
  async mockNotificationPermission(permission: 'granted' | 'denied' | 'default' = 'granted'): Promise<void> {
    await this.page.evaluate((permission) => {
      Object.defineProperty(window, 'Notification', {
        value: {
          requestPermission: () => Promise.resolve(permission),
          permission: permission
        },
        writable: true
      });
    }, permission);
  }

  /**
   * Mock push manager subscription
   */
  async mockPushSubscription(success = true): Promise<void> {
    await this.page.evaluate((success) => {
      if (success) {
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
      } else {
        Object.defineProperty(window, 'PushManager', {
          value: {
            prototype: {
              subscribe: () => Promise.reject(new Error('Subscription failed'))
            }
          },
          writable: true
        });
      }
    }, success);
  }

  /**
   * Mock beforeinstallprompt event
   */
  async mockInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted'): Promise<void> {
    await this.page.evaluate((outcome) => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome });
      window.dispatchEvent(event);
    }, outcome);
  }

  /**
   * Mock app installation
   */
  async mockAppInstallation(): Promise<void> {
    await this.page.evaluate(() => {
      const event = new Event('appinstalled');
      window.dispatchEvent(event);
    });
  }

  /**
   * Create offline vote data
   */
  async createOfflineVote(voteData: {
    id: string;
    pollId: string;
    optionIds: string[];
    timestamp?: string;
    status?: string;
  }): Promise<void> {
    await this.page.evaluate((voteData) => {
      const offlineVote = {
        id: voteData.id,
        pollId: voteData.pollId,
        optionIds: voteData.optionIds,
        timestamp: voteData.timestamp || new Date().toISOString(),
        status: voteData.status || 'pending'
      };
      
      const offlineVotes = JSON.parse(localStorage.getItem('choices_offline_outbox') || '[]');
      offlineVotes.push(offlineVote);
      localStorage.setItem('choices_offline_outbox', JSON.stringify(offlineVotes));
      
      // Trigger offline vote event
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { syncedCount: 0, pendingCount: offlineVotes.length }
      }));
    }, voteData);
  }

  /**
   * Clear offline vote data
   */
  async clearOfflineVotes(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('choices_offline_outbox');
    });
  }

  /**
   * Mock offline vote sync
   */
  async mockOfflineVoteSync(syncedCount: number, failedCount = 0): Promise<void> {
    await this.page.evaluate(({ syncedCount, failedCount }) => {
      // Clear offline votes (simulate successful sync)
      if (syncedCount > 0) {
        localStorage.removeItem('choices_offline_outbox');
      }
      
      // Trigger sync event
      window.dispatchEvent(new CustomEvent('offlineVotesSynced', {
        detail: { 
          syncedCount, 
          pendingCount: 0,
          failedCount,
          errors: failedCount > 0 ? ['Sync failed: Network error'] : []
        }
      }));
    }, { syncedCount, failedCount });
  }

  /**
   * Mock push notification
   */
  async mockPushNotification(notificationData: {
    title: string;
    body: string;
    tag?: string;
    data?: any;
  }): Promise<void> {
    await this.page.evaluate((notificationData) => {
      const event = new Event('push');
      (event as any).data = {
        json: () => notificationData
      };
      window.dispatchEvent(event);
    }, notificationData);
  }

  /**
   * Mock notification display
   */
  async mockNotificationDisplay(): Promise<void> {
    await this.page.evaluate(() => {
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
    });
  }

  /**
   * Mock notification click
   */
  async mockNotificationClick(action: 'view' | 'dismiss' = 'view', url = '/dashboard'): Promise<void> {
    await this.page.evaluate(({ action, url }) => {
      const event = new Event('notificationclick');
      (event as any).action = action;
      (event as any).notification = {
        data: { url },
        close: () => {}
      };
      window.dispatchEvent(event);
    }, { action, url });
  }

  /**
   * Set PWA user preferences
   */
  async setPWAPreferences(preferences: {
    installDismissed?: boolean;
    notificationPermission?: 'granted' | 'denied' | 'default';
    pushSubscription?: any;
    notificationPreferences?: {
      newPolls: boolean;
      pollResults: boolean;
      systemUpdates: boolean;
      weeklyDigest: boolean;
    };
  }): Promise<void> {
    await this.page.evaluate((preferences) => {
      if (preferences.installDismissed !== undefined) {
        localStorage.setItem('pwa-install-dismissed', preferences.installDismissed.toString());
      }
      
      if (preferences.notificationPermission) {
        localStorage.setItem('notification-permission', preferences.notificationPermission);
      }
      
      if (preferences.pushSubscription) {
        localStorage.setItem('push-subscription', JSON.stringify(preferences.pushSubscription));
      }
      
      if (preferences.notificationPreferences) {
        localStorage.setItem('notification-preferences', JSON.stringify(preferences.notificationPreferences));
      }
    }, preferences);
  }

  /**
   * Get PWA state
   */
  async getPWAState(): Promise<{
    installDismissed: string | null;
    notificationPermission: string | null;
    pushSubscription: string | null;
    notificationPreferences: string | null;
    offlineVotes: string | null;
  }> {
    return await this.page.evaluate(() => {
      return {
        installDismissed: localStorage.getItem('pwa-install-dismissed'),
        notificationPermission: localStorage.getItem('notification-permission'),
        pushSubscription: localStorage.getItem('push-subscription'),
        notificationPreferences: localStorage.getItem('notification-preferences'),
        offlineVotes: localStorage.getItem('choices_offline_outbox')
      };
    });
  }

  /**
   * Wait for PWA component to be visible
   */
  async waitForPWAComponent(componentId: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(`[data-testid="${componentId}"]`, { timeout });
  }

  /**
   * Check if PWA component is visible
   */
  async isPWAComponentVisible(componentId: string): Promise<boolean> {
    const element = this.page.locator(`[data-testid="${componentId}"]`);
    return await element.isVisible();
  }

  /**
   * Get PWA component text
   */
  async getPWAComponentText(componentId: string): Promise<string> {
    const element = this.page.locator(`[data-testid="${componentId}"]`);
    return await element.textContent() || '';
  }

  /**
   * Click PWA component
   */
  async clickPWAComponent(componentId: string): Promise<void> {
    const element = this.page.locator(`[data-testid="${componentId}"]`);
    await element.click();
  }

  /**
   * Wait for PWA API response
   */
  async waitForPWAAPIResponse(endpoint: string, timeout = 5000): Promise<any> {
    const response = await this.page.waitForResponse(
      response => response.url().includes(endpoint) && response.status() === 200,
      { timeout }
    );
    return await response.json();
  }

  /**
   * Mock PWA API response
   */
  async mockPWAAPIResponse(endpoint: string, responseData: any, status = 200): Promise<void> {
    await this.page.route(`**/api/pwa/**`, async route => {
      if (route.request().url().includes(endpoint)) {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(responseData)
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Clear all PWA data
   */
  async clearAllPWAData(): Promise<void> {
    await this.page.evaluate(() => {
      // Clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('pwa-') || 
            key.startsWith('notification-') || 
            key.startsWith('choices_offline_') ||
            key.startsWith('push-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear service worker caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('choices-')) {
              caches.delete(cacheName);
            }
          });
        });
      }
    });
  }

  /**
   * Take PWA screenshot
   */
  async takePWAScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/pwa-${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Measure PWA performance
   */
  async measurePWAPerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
    serviceWorkerRegistration: number;
  }> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        serviceWorkerRegistration: performance.now()
      };
    });
  }
}

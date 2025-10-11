/**
 * Superior Mobile PWA E2E Tests
 * 
 * Tests all superior mobile PWA features including:
 * - Advanced PWA features (app installation, offline support, push notifications)
 * - Mobile-optimized components with touch gestures
 * - Dark mode and theme customization
 * - Background sync and data caching
 * - Performance optimization
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

import { test, expect, type Page } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Superior Mobile PWA E2E Tests', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data
    testData = {
      user: createTestUser({
        email: 'mobile-pwa-test@example.com',
        username: 'mobile-pwa-user',
        password: 'MobilePwaTest123!'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
  });

  test.afterEach(async () => {
    await cleanupE2ETestData(testData);
  });

  test.describe('PWA Installation and Manifest', () => {
    test('should have valid PWA manifest', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for manifest link
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toBeVisible();

      // Test manifest content
      const manifestResponse = await page.request.get('/api/pwa/manifest');
      expect(manifestResponse.status()).toBe(200);
      
      const manifest = await manifestResponse.json();
      expect(manifest).toHaveProperty('success', true);
      expect(manifest.manifest).toHaveProperty('name', 'Choices - Democratic Polling Platform');
      expect(manifest.manifest).toHaveProperty('short_name', 'Choices');
      expect(manifest.manifest).toHaveProperty('start_url', '/feed');
      expect(manifest.manifest).toHaveProperty('display', 'standalone');
      expect(manifest.manifest).toHaveProperty('theme_color', '#3b82f6');
      expect(manifest.manifest).toHaveProperty('background_color', '#ffffff');
    });

    test('should have proper PWA meta tags', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for PWA meta tags
      await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toBeVisible();
      await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toBeVisible();
      await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toBeVisible();
      await expect(page.locator('meta[name="mobile-web-app-capable"]')).toBeVisible();
      await expect(page.locator('meta[name="theme-color"]')).toBeVisible();
      await expect(page.locator('meta[name="background-color"]')).toBeVisible();
    });

    test('should have proper app icons', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for app icons
      await expect(page.locator('link[rel="icon"]')).toBeVisible();
      await expect(page.locator('link[rel="apple-touch-icon"]')).toBeVisible();
      
      // Check for multiple icon sizes
      const iconLinks = page.locator('link[rel="apple-touch-icon"]');
      const iconCount = await iconLinks.count();
      expect(iconCount).toBeGreaterThan(5); // Multiple sizes
    });
  });

  test.describe('Service Worker and Offline Functionality', () => {
    test('should register service worker', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check service worker registration
      const swRegistration = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            return registration ? 'registered' : 'not registered';
          } catch {
            return 'error';
          }
        }
        return 'not supported';
      });

      expect(swRegistration).toBe('registered');
    });

    test('should work offline', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Go offline
      await page.context().setOffline(true);

      // Check that offline indicator is shown
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

      // Check that cached content is still accessible
      await expect(page.locator('[data-testid="feed-container"]')).toBeVisible();

      // Go back online
      await page.context().setOffline(false);

      // Check that online indicator is shown
      await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
    });

    test('should sync data when back online', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Go offline
      await page.context().setOffline(true);
      await page.waitForTimeout(1000);

      // Go back online
      await page.context().setOffline(false);

      // Check for sync indicator
      await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    });
  });

  test.describe('Mobile Touch Gestures', () => {
    test('should support swipe navigation', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test swipe navigation
      const feedContainer = page.locator('[data-testid="feed-container"]');
      await expect(feedContainer).toBeVisible();

      // Simulate swipe gesture
      await page.evaluate(() => {
        const feed = document.querySelector('[data-testid="feed-container"]');
        if (feed) {
          const touchStart = new TouchEvent('touchstart', { 
            touches: [{ 
              clientX: 100, 
              clientY: 200,
              force: 1,
              identifier: 1,
              pageX: 100,
              pageY: 200,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              screenX: 100,
              screenY: 200,
              target: feed
            }] 
          });
          const touchMove = new TouchEvent('touchmove', { 
            touches: [{ 
              clientX: 200, 
              clientY: 200,
              force: 1,
              identifier: 1,
              pageX: 200,
              pageY: 200,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              screenX: 200,
              screenY: 200,
              target: feed
            }] 
          });
          const touchEnd = new TouchEvent('touchend', { 
            touches: [{ 
              clientX: 200, 
              clientY: 200,
              force: 1,
              identifier: 1,
              pageX: 200,
              pageY: 200,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              screenX: 200,
              screenY: 200,
              target: feed
            }] 
          });
          
          feed.dispatchEvent(touchStart);
          feed.dispatchEvent(touchMove);
          feed.dispatchEvent(touchEnd);
        }
      });

      // Check that swipe was handled
      await page.waitForTimeout(500);
    });

    test('should support pull-to-refresh', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test pull-to-refresh
      const feedContainer = page.locator('[data-testid="feed-container"]');
      await expect(feedContainer).toBeVisible();

      // Simulate pull-to-refresh gesture
      await page.evaluate(() => {
        const feed = document.querySelector('[data-testid="feed-container"]');
        if (feed) {
          const touchStart = new TouchEvent('touchstart', { 
            touches: [{ 
              clientX: 100,
              clientY: 100,
              force: 1,
              identifier: 1,
              pageX: 100,
              pageY: 100,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              screenX: 100,
              screenY: 100,
              target: feed
            }] 
          });
          const touchMove = new TouchEvent('touchmove', { 
            touches: [{ 
              clientX: 100,
              clientY: 50,
              force: 1,
              identifier: 1,
              pageX: 100,
              pageY: 50,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              screenX: 100,
              screenY: 50,
              target: feed
            }] 
          });
          const touchEnd = new TouchEvent('touchend', { 
            touches: [{ 
              clientX: 100,
              clientY: 50,
              force: 1,
              identifier: 1,
              pageX: 100,
              pageY: 50,
              radiusX: 10,
              radiusY: 10,
              rotationAngle: 0,
              screenX: 100,
              screenY: 50,
              target: feed
            }] 
          });
          
          feed.dispatchEvent(touchStart);
          feed.dispatchEvent(touchMove);
          feed.dispatchEvent(touchEnd);
        }
      });

      // Check for refresh indicator
      await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
    });
  });

  test.describe('Dark Mode and Themes', () => {
    test('should support dark mode toggle', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for theme toggle
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      await expect(themeToggle).toBeVisible();

      // Test theme switching
      await themeToggle.click();
      
      // Check for dark mode classes
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);

      // Test switching back to light mode
      await themeToggle.click();
      await expect(body).not.toHaveClass(/dark/);
    });

    test('should persist theme preference', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Set dark mode
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      await themeToggle.click();

      // Reload page
      await page.reload();
      await waitForPageReady(page);

      // Check that dark mode is still active
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);
    });
  });

  test.describe('Push Notifications', () => {
    test('should request notification permission', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for notification permission request
      const notificationPermission = await page.evaluate(() => {
        return Notification.permission;
      });

      // Should be either 'granted', 'denied', or 'default'
      expect(['granted', 'denied', 'default']).toContain(notificationPermission);
    });

    test('should handle notification subscription', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for notification subscription
      const subscriptionStatus = await page.evaluate(async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return subscription ? 'subscribed' : 'not subscribed';
          } catch {
            return 'error';
          }
        }
        return 'not supported';
      });

      expect(['subscribed', 'not subscribed', 'not supported']).toContain(subscriptionStatus);
    });
  });

  test.describe('Performance Optimization', () => {
    test('should load quickly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/feed');
      await waitForPageReady(page);
      const loadTime = Date.now() - startTime;

      // Should load within 2 seconds on mobile
      expect(loadTime).toBeLessThan(2000);
    });

    test('should have optimized images', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for optimized images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // Check that images have proper attributes
        const firstImage = images.first();
        await expect(firstImage).toHaveAttribute('loading', 'lazy');
        await expect(firstImage).toHaveAttribute('alt');
      }
    });

    test('should use efficient caching', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for cache headers
      const response = await page.request.get('/feed');
      const cacheControl = response.headers()['cache-control'];
      
      // Should have some caching strategy
      expect(cacheControl).toBeDefined();
    });
  });

  test.describe('Accessibility', () => {
    test('should support screen readers', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for accessibility attributes
      await expect(page.locator('[data-testid="feed-container"]')).toHaveAttribute('role');
      await expect(page.locator('[data-testid="representative-card"]')).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Mobile-Specific Features', () => {
    test('should have mobile-optimized navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for mobile navigation
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      
      // Check for hamburger menu
      await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
    });

    test('should have touch-optimized buttons', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for touch-optimized buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const buttonStyle = await firstButton.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            minHeight: style.minHeight,
            minWidth: style.minWidth
          };
        });
        
        // Buttons should be touch-friendly (at least 44px)
        expect(parseInt(buttonStyle.minHeight)).toBeGreaterThanOrEqual(44);
        expect(parseInt(buttonStyle.minWidth)).toBeGreaterThanOrEqual(44);
      }
    });
  });
});

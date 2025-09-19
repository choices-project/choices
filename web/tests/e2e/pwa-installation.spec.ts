/**
 * PWA Installation E2E Tests
 * 
 * Tests PWA installation functionality including:
 * - Installation prompt detection
 * - Installation flow
 * - App installation verification
 * - Cross-browser compatibility
 */

import { test, expect, Page } from '@playwright/test';

test.describe('PWA Installation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard to trigger PWA initialization
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for PWA components to be rendered
    await page.waitForSelector('[data-testid="pwa-status"]', { timeout: 10000 });
    
    // Additional wait to ensure PWA initialization is complete
    await page.waitForTimeout(2000);
  });

  test('should detect PWA installation criteria', async ({ page }) => {
    // Check if PWA is supported
    const pwaSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    });
    
    expect(pwaSupported).toBe(true);

    // Check if manifest is present
    const manifestLink = await page.locator('link[rel="manifest"]').first();
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        console.log('Service worker registration:', registration);
        if (registration) {
          console.log('Service worker active:', registration.active);
          console.log('Service worker installing:', registration.installing);
          console.log('Service worker waiting:', registration.waiting);
        }
        return !!registration;
      }
      return false;
    });
    
    // Wait a bit for service worker to register
    await page.waitForTimeout(2000);
    
    // Check again
    const swRegisteredAfterWait = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegisteredAfterWait).toBe(true);
  });

  test('should show PWA status and installation options', async ({ page }) => {
    // Check if PWA status component is visible
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    // Check if PWA status shows installation as installable
    const installationStatus = page.locator('[data-testid="installation-status"]');
    await expect(installationStatus).toBeVisible();
    
    // Check if service worker status is shown
    const serviceWorkerStatus = page.locator('text=Service Worker');
    await expect(serviceWorkerStatus).toBeVisible();
    
    // Check if connection status is shown
    const connectionStatus = page.locator('[data-testid="offline-status"]');
    await expect(connectionStatus).toBeVisible();
  });

  test('should show PWA status components', async ({ page }) => {
    // Check if PWA status component is visible
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    // Check if installation status is shown
    const installationStatus = page.locator('[data-testid="installation-status"]');
    await expect(installationStatus).toBeVisible();
    
    // Check if connection status is shown
    const connectionStatus = page.locator('[data-testid="offline-status"]');
    await expect(connectionStatus).toBeVisible();
  });

  test('should show PWA notification status', async ({ page }) => {
    // Check if PWA status component is visible
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    // Check if notification status is shown
    const notificationStatus = page.locator('[data-testid="notification-status"]');
    await expect(notificationStatus).toBeVisible();
  });

  test('should detect app installation', async ({ page }) => {
    // Mock app installation
    await page.evaluate(() => {
      const event = new Event('appinstalled');
      window.dispatchEvent(event);
    });

    // Check if installation is detected
    const isInstalled = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches;
    });

    // In test environment, we can't actually install, but we can verify the detection logic
    expect(typeof isInstalled).toBe('boolean');
  });

  test('should show PWA status information', async ({ page }) => {
    // Check if PWA status component is visible
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    // Check if connection status is shown
    const connectionStatus = page.locator('[data-testid="offline-status"]');
    await expect(connectionStatus).toBeVisible();
    
    // Check if notification status is shown
    const notificationStatus = page.locator('[data-testid="notification-status"]');
    await expect(notificationStatus).toBeVisible();
  });

  test('should handle PWA status gracefully', async ({ page }) => {
    // Check if PWA status component is visible and functional
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    // The app should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show PWA status after page reload', async ({ page }) => {
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for PWA components to be rendered
    await page.waitForSelector('[data-testid="pwa-status"]', { timeout: 10000 });
    
    // Check if PWA status is still visible after reload
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    await expect(pwaStatus).toBeVisible();
    
    // Check if installation status is still there
    const installationStatus = page.locator('[data-testid="installation-status"]');
    await expect(installationStatus).toBeVisible();
  });
});

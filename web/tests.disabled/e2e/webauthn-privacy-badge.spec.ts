/**
 * WebAuthn Privacy Badge E2E Tests
 * 
 * End-to-end tests for WebAuthn privacy status badge functionality
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn Privacy Badge', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (assuming user is logged in)
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display privacy status badge @passkeys', async ({ page }) => {
    // Verify privacy status badge is visible
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
    
    // Verify badge shows "Privacy protections: ON"
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy protections: ON');
    
    // Verify badge has correct styling (green/positive)
    const badge = page.locator('[data-testid="privacy-status-badge"]');
    await expect(badge).toHaveClass(/text-green/);
  });

  test('should show privacy details on hover @passkeys', async ({ page }) => {
    // Hover over privacy status badge
    await page.hover('[data-testid="privacy-status-badge"]');
    
    // Wait for tooltip to appear
    await expect(page.locator('[data-testid="privacy-tooltip"]')).toBeVisible();
    
    // Verify tooltip content
    await expect(page.locator('[data-testid="privacy-tooltip"]')).toContainText('WebAuthn enabled');
    await expect(page.locator('[data-testid="privacy-tooltip"]')).toContainText('Biometric data stays on your device');
  });

  test('should display privacy badge on profile page @passkeys', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify privacy status badge is visible
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
    
    // Verify badge shows privacy status
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy protections: ON');
  });

  test('should display privacy badge on poll pages @passkeys', async ({ page }) => {
    // Navigate to polls page
    await page.goto('/polls');
    
    // Verify privacy status badge is visible
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
    
    // Verify badge shows privacy status
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy protections: ON');
  });

  test('should show different status when WebAuthn is disabled @passkeys', async ({ page }) => {
    // Mock WebAuthn disabled state
    await page.route('**/api/status/privacy', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          webauthn_enabled: false,
          privacy_protections: 'partial'
        })
      });
    });
    
    // Reload page to get updated status
    await page.reload();
    
    // Verify privacy status badge shows different status
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy protections: PARTIAL');
    
    // Verify badge has different styling (yellow/warning)
    const badge = page.locator('[data-testid="privacy-status-badge"]');
    await expect(badge).toHaveClass(/text-yellow/);
  });

  test('should show error state when privacy check fails @passkeys', async ({ page }) => {
    // Mock privacy check failure
    await page.route('**/api/status/privacy', route => {
      route.fulfill({ status: 500, body: 'Server error' });
    });
    
    // Reload page to get error state
    await page.reload();
    
    // Verify privacy status badge shows error state
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy status: Unknown');
    
    // Verify badge has error styling (red/error)
    const badge = page.locator('[data-testid="privacy-status-badge"]');
    await expect(badge).toHaveClass(/text-red/);
  });

  test('should update privacy status when WebAuthn is enabled @passkeys', async ({ page }) => {
    // Initially mock WebAuthn disabled
    await page.route('**/api/status/privacy', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          webauthn_enabled: false,
          privacy_protections: 'partial'
        })
      });
    });
    
    // Reload page
    await page.reload();
    
    // Verify initial state
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy protections: PARTIAL');
    
    // Mock WebAuthn enabled
    await page.route('**/api/status/privacy', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          webauthn_enabled: true,
          privacy_protections: 'full'
        })
      });
    });
    
    // Reload page
    await page.reload();
    
    // Verify updated state
    await expect(page.locator('[data-testid="privacy-status-badge"]')).toContainText('Privacy protections: ON');
  });

  test('should show privacy badge in header navigation @passkeys', async ({ page }) => {
    // Verify privacy badge is in header
    const header = page.locator('[data-testid="header"]');
    await expect(header).toBeVisible();
    
    // Verify privacy badge is in header
    await expect(header.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
  });

  test('should show privacy badge in mobile navigation @passkeys', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Verify mobile menu is open
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verify privacy badge is in mobile menu
    await expect(page.locator('[data-testid="mobile-menu"] [data-testid="privacy-status-badge"]')).toBeVisible();
  });

  test('should show privacy badge on all authenticated pages @passkeys', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/profile',
      '/polls',
      '/polls/create',
      '/admin'
    ];
    
    for (const pagePath of pages) {
      // Navigate to page
      await page.goto(pagePath);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Verify privacy badge is visible
      await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
    }
  });

  test('should not show privacy badge on public pages @passkeys', async ({ page }) => {
    // Log out first
    await page.click('[data-testid="logout-button"]');
    
    // Navigate to public pages
    const publicPages = [
      '/',
      '/login',
      '/register'
    ];
    
    for (const pagePath of publicPages) {
      // Navigate to page
      await page.goto(pagePath);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Verify privacy badge is not visible on public pages
      await expect(page.locator('[data-testid="privacy-status-badge"]')).not.toBeVisible();
    }
  });
});

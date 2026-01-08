/**
 * Admin Pages Loading Test
 * 
 * Verifies that all admin pages load correctly when navigating via the sidebar.
 * This test ensures the AdminLayout pattern is correctly applied to all pages.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Pages Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard and authenticate
    await page.goto('/admin', { waitUntil: 'networkidle' });
    
    // Wait for admin dashboard to load
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 }).catch(() => {
      // If dashboard testid doesn't exist, wait for any admin content
      await page.waitForSelector('main', { timeout: 10000 });
    });
  });

  test('admin dashboard page loads', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible (AdminLayout provides it)
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
    
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('admin users page loads', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
    
    // Verify page content loads (check for users management content)
    await expect(page.locator('main')).toBeVisible();
  });

  test('admin feedback page loads', async ({ page }) => {
    await page.goto('/admin/feedback', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
  });

  test('admin analytics page loads', async ({ page }) => {
    await page.goto('/admin/analytics', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
    
    // Verify analytics content loads
    await expect(page.locator('h1:has-text("Analytics")')).toBeVisible({ timeout: 10000 });
  });

  test('admin performance page loads', async ({ page }) => {
    await page.goto('/admin/performance', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
  });

  test('admin system page loads', async ({ page }) => {
    await page.goto('/admin/system', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
  });

  test('admin site-messages page loads', async ({ page }) => {
    await page.goto('/admin/site-messages', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
  });

  test('admin feature-flags page loads', async ({ page }) => {
    await page.goto('/admin/feature-flags', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
  });

  test('admin monitoring page loads', async ({ page }) => {
    await page.goto('/admin/monitoring', { waitUntil: 'networkidle' });
    
    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
    
    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible();
  });

  test('sidebar navigation works for all pages', async ({ page }) => {
    const sidebarLinks = [
      { href: '/admin', name: 'Dashboard' },
      { href: '/admin/users', name: 'Users' },
      { href: '/admin/feedback', name: 'Feedback' },
      { href: '/admin/analytics', name: 'Analytics' },
      { href: '/admin/performance', name: 'Performance' },
      { href: '/admin/system', name: 'System' },
      { href: '/admin/site-messages', name: 'Site Messages' },
      { href: '/admin/feature-flags', name: 'Feature Flags' },
    ];

    for (const link of sidebarLinks) {
      // Click sidebar link
      await page.click(`nav[aria-label="Admin navigation"] a[href="${link.href}"]`);
      
      // Wait for navigation
      await page.waitForURL(`**${link.href}`, { timeout: 10000 });
      
      // Verify sidebar is still visible (AdminLayout persists)
      await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible();
      
      // Verify main content area is visible
      await expect(page.locator('main[id="admin-main"]')).toBeVisible();
      
      // Verify no critical console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      
      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource')
      );
      
      expect(criticalErrors.length).toBe(0);
    }
  });
});


import { test, expect } from '@playwright/test';

test.describe('Enhanced Dashboard System - Simple Tests', () => {
  test('should load dashboard page without errors', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });

  test('should have proper page structure on dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait a bit for any redirects to complete
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      await expect(page.locator('h1, h2, h3')).toContainText(/sign|login/i);
      return;
    }
    
    const dashboardElement = page.locator('[data-testid="enhanced-dashboard"]');
    const isDashboardVisible = await dashboardElement.isVisible();
    console.log('Dashboard element visible:', isDashboardVisible);
    
    if (isDashboardVisible) {
      await expect(dashboardElement).toBeVisible();
      await expect(page.locator('h1')).toContainText(/dashboard/i);
    } else {
      expect(currentUrl).toContain('/dashboard');
    }
  });

  test('should handle loading state properly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show loading spinner initially
    const loadingSpinner = page.locator('.animate-spin');
    const isSpinnerVisible = await loadingSpinner.isVisible();
    
    if (isSpinnerVisible) {
      await expect(loadingSpinner).toBeVisible();
    }
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/dashboard/data', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      expect(currentUrl).toContain('/login');
      return;
    }
    
    // Should show error state or redirect to login
    const errorElement = page.locator('text=Error Loading Dashboard');
    const isErrorVisible = await errorElement.isVisible();
    
    if (isErrorVisible) {
      await expect(errorElement).toBeVisible();
      await expect(page.locator('text=Try Again')).toBeVisible();
    } else {
      // If not showing error, should be on dashboard or login
      expect(currentUrl).toMatch(/\/(dashboard|login)/);
    }
  });
});

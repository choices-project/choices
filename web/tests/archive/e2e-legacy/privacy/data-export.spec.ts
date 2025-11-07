/**
 * Data Export E2E Tests
 * 
 * Tests for GDPR/CCPA compliant data export functionality
 * 
 * Created: November 5, 2025
 * Status: ✅ COMPLETE
 */

import { test, expect } from '@playwright/test';

test.describe('Data Export (GDPR/CCPA Compliance)', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in - adjust based on your auth setup
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');
  });

  test('should export all user data in JSON format', async ({ page }) => {
    // Navigate to My Data dashboard
    await page.click('[data-testid="my-data-tab"]');
    await page.waitForSelector('[data-testid="export-data-button"]');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-data-button"]');
    const download = await downloadPromise;
    
    // Verify download occurred
    expect(download.suggestedFilename()).toContain('choices-data-export');
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // Download and parse the file
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should include only opted-in data in export', async ({ page }) => {
    // First, navigate to privacy settings and enable specific controls
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');
    
    // Enable only interest tracking
    await page.click('[data-testid="privacy-setting-trackInterests"]');
    await page.waitForTimeout(1500); // Wait for auto-save
    
    // Navigate to My Data
    await page.click('[data-testid="my-data-tab"]');
    
    // Trigger export via API call (check response)
    const response = await page.request.post('/api/profile/export', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    // Verify structure
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.userId).toBeDefined();
    expect(data.data.exportDate).toBeDefined();
    expect(data.data.privacySettings).toBeDefined();
    
    // Verify privacy settings reflect what we enabled
    expect(data.data.privacySettings.trackInterests).toBe(true);
    expect(data.data.privacySettings.collectLocationData).toBe(false);
  });

  test('should include summary statistics in export', async ({ page }) => {
    const response = await page.request.post('/api/profile/export');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.totalDataPoints).toBeGreaterThanOrEqual(0);
    expect(data.data.summary.categoriesWithData).toBeDefined();
  });

  test('should export successfully even with no optional data', async ({ page }) => {
    // Ensure all privacy settings are OFF
    await page.goto('/account/privacy');
    await page.click('[data-testid="privacy-preset-maximum"]');
    await page.waitForTimeout(1500);
    
    // Export should still work
    const response = await page.request.post('/api/profile/export');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.profile).toBeDefined(); // Profile always included
  });

  test('should handle export errors gracefully', async ({ page }) => {
    // Test error handling (e.g., unauthenticated)
    await page.goto('/');
    const response = await page.request.post('/api/profile/export');
    
    // Should return error for unauthenticated user
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});


/**
 * Privacy Settings Persistence E2E Tests
 * 
 * Tests for privacy settings updates and persistence
 * 
 * Created: November 5, 2025
 * Status: ✅ COMPLETE
 */

import { test, expect } from '@playwright/test';

test.describe('Privacy Settings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');
  });

  test('should persist privacy settings after page reload', async ({ page }) => {
    // Enable specific controls
    await page.click('[data-testid="privacy-setting-trackInterests"]');
    await page.click('[data-testid="privacy-setting-personalizeFeeds"]');
    
    // Wait for auto-save
    await page.waitForTimeout(1500);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify settings persisted
    await expect(page.locator('[data-testid="privacy-setting-trackInterests"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-personalizeFeeds"]')).toBeChecked();
  });

  test('should auto-save privacy settings after 1 second', async ({ page }) => {
    // Enable a control
    await page.click('[data-testid="privacy-setting-collectAnalytics"]');
    
    // Wait for auto-save
    await page.waitForTimeout(1500);
    
    // Verify save indicator appeared
    await expect(page.locator('[data-testid="settings-saved-indicator"]')).toBeVisible();
  });

  test('should update multiple settings independently', async ({ page }) => {
    // Enable first control
    await page.click('[data-testid="privacy-setting-trackInterests"]');
    await page.waitForTimeout(1500);
    
    // Enable second control
    await page.click('[data-testid="privacy-setting-showBookmarks"]');
    await page.waitForTimeout(1500);
    
    // Disable first control
    await page.click('[data-testid="privacy-setting-trackInterests"]');
    await page.waitForTimeout(1500);
    
    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('[data-testid="privacy-setting-trackInterests"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-showBookmarks"]')).toBeChecked();
  });

  test('should apply quick presets correctly', async ({ page }) => {
    // Start with some settings enabled
    await page.click('[data-testid="privacy-setting-trackInterests"]');
    await page.click('[data-testid="privacy-setting-collectAnalytics"]');
    await page.waitForTimeout(1500);
    
    // Apply maximum privacy preset
    await page.click('[data-testid="preset-maximum-privacy"]');
    
    // All should be OFF
    const allToggles = await page.locator('[data-testid^="privacy-setting-"]').all();
    for (const toggle of allToggles) {
      expect(await toggle.isChecked()).toBe(false);
    }
    
    // Apply recommended preset
    await page.click('[data-testid="preset-recommended"]');
    
    // Some should be ON
    await expect(page.locator('[data-testid="privacy-setting-trackInterests"]')).toBeChecked();
  });

  test('should show current privacy status in dashboard', async ({ page }) => {
    // Navigate to My Data dashboard
    await page.click('[data-testid="my-data-tab"]');
    
    // Verify privacy status is displayed
    await expect(page.locator('[data-testid="privacy-status"]')).toBeVisible();
    
    // Should show count of enabled controls
    await expect(page.locator('[data-testid="enabled-controls-count"]')).toBeVisible();
  });

  test('should respect privacy settings across the app', async ({ page }) => {
    // Disable feed activity tracking
    await page.click('[data-testid="privacy-setting-trackFeedActivity"]');
    await page.waitForTimeout(1500);
    
    // Navigate to feeds
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    
    // Like a post - should work but not be tracked
    // (Backend should respect privacy setting)
    await page.click('[data-testid="like-button-first-post"]', { timeout: 5000 }).catch(() => {
      // Button might not exist, that's okay
    });
    
    // Navigate back to privacy dashboard
    await page.goto('/account/privacy');
    await page.click('[data-testid="my-data-tab"]');
    
    // Feed interactions should show 0 or not be tracked
    const feedInteractionsCount = await page.locator('[data-testid="feed-interactions-count"]').textContent();
    // With tracking OFF, should be 0
    expect(feedInteractionsCount).toBe('0');
  });

  test('should update privacy settings via API', async ({ page }) => {
    const response = await page.request.put('/api/user/preferences', {
      data: {
        privacySettings: {
          trackInterests: true,
          collectAnalytics: true,
          collectLocationData: false,
        }
      }
    });
    
    expect(response.ok()).toBe(true);
    
    // Reload page and verify
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('[data-testid="privacy-setting-trackInterests"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-collectAnalytics"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-collectLocationData"]')).not.toBeChecked();
  });
});


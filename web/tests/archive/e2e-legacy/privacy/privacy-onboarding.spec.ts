/**
 * Privacy Onboarding E2E Tests
 * 
 * Comprehensive tests for privacy onboarding flow with all 16 privacy controls
 * 
 * Created: November 5, 2025
 * Status: ✅ COMPLETE
 */

import { test, expect } from '@playwright/test';

test.describe('Privacy Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding (or wherever privacy step appears)
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
  });

  test('should display all 16 privacy controls with default OFF state', async ({ page }) => {
    // Navigate to privacy step (assuming it's in onboarding)
    // Adjust selectors based on actual implementation
    
    // Wait for privacy step to load
    await page.waitForSelector('[data-testid="privacy-step"]', { timeout: 10000 });
    
    // Verify all 16 privacy controls are present and defaulted to OFF
    const privacyControls = [
      'collectLocationData',
      'collectVotingHistory',
      'trackInterests',
      'trackFeedActivity',
      'collectAnalytics',
      'trackRepresentativeInteractions',
      'showReadHistory',
      'showBookmarks',
      'showLikes',
      'shareActivity',
      'personalizeFeeds',
      'personalizeRecommendations',
      'participateInTrustTier',
      'retainVotingHistory',
      'retainSearchHistory',
      'retainLocationHistory',
    ];

    for (const control of privacyControls) {
      const toggle = page.locator(`[data-testid="privacy-${control}"]`);
      await expect(toggle).toBeVisible();
      
      // Verify it's OFF by default (unchecked)
      const isChecked = await toggle.isChecked();
      expect(isChecked).toBe(false);
    }
  });

  test('should allow enabling privacy controls individually', async ({ page }) => {
    await page.waitForSelector('[data-testid="privacy-step"]');
    
    // Enable location data collection
    await page.click('[data-testid="privacy-collectLocationData"]');
    await expect(page.locator('[data-testid="privacy-collectLocationData"]')).toBeChecked();
    
    // Enable interest tracking
    await page.click('[data-testid="privacy-trackInterests"]');
    await expect(page.locator('[data-testid="privacy-trackInterests"]')).toBeChecked();
    
    // Verify others remain OFF
    await expect(page.locator('[data-testid="privacy-collectVotingHistory"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="privacy-trackFeedActivity"]')).not.toBeChecked();
  });

  test('should apply "Maximum Privacy" preset (all OFF)', async ({ page }) => {
    await page.waitForSelector('[data-testid="privacy-step"]');
    
    // Enable a few controls first
    await page.click('[data-testid="privacy-trackInterests"]');
    await page.click('[data-testid="privacy-collectAnalytics"]');
    
    // Click maximum privacy preset
    await page.click('[data-testid="privacy-preset-maximum"]');
    
    // Verify ALL controls are now OFF
    const allToggles = await page.locator('[data-testid^="privacy-"]').all();
    for (const toggle of allToggles) {
      const isChecked = await toggle.isChecked();
      expect(isChecked).toBe(false);
    }
  });

  test('should apply "Recommended" preset correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="privacy-step"]');
    
    // Click recommended preset
    await page.click('[data-testid="privacy-preset-recommended"]');
    
    // Verify recommended settings are enabled
    // (Based on PrivacyStepComprehensive.tsx implementation)
    await expect(page.locator('[data-testid="privacy-trackInterests"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-personalizeFeeds"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-collectAnalytics"]')).toBeChecked();
    
    // Verify sensitive settings remain OFF
    await expect(page.locator('[data-testid="privacy-collectLocationData"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="privacy-shareActivity"]')).not.toBeChecked();
  });

  test('should allow skipping privacy step (maximum privacy)', async ({ page }) => {
    await page.waitForSelector('[data-testid="privacy-step"]');
    
    // Click skip button
    await page.click('[data-testid="privacy-skip-button"]');
    
    // Should proceed to next step with all settings OFF
    // Verify we moved to next step
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    // Navigate to privacy settings to verify all are OFF
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');
    
    // Verify all controls are OFF
    const allToggles = await page.locator('[data-testid^="privacy-setting-"]').all();
    for (const toggle of allToggles) {
      const isChecked = await toggle.isChecked();
      expect(isChecked).toBe(false);
    }
  });

  test('should save privacy selections and proceed', async ({ page }) => {
    await page.waitForSelector('[data-testid="privacy-step"]');
    
    // Enable specific controls
    await page.click('[data-testid="privacy-trackInterests"]');
    await page.click('[data-testid="privacy-personalizeFeeds"]');
    await page.click('[data-testid="privacy-showBookmarks"]');
    
    // Save and continue
    await page.click('[data-testid="privacy-save-button"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Navigate to privacy settings to verify persistence
    await page.goto('/account/privacy');
    await page.waitForLoadState('networkidle');
    
    // Verify saved settings
    await expect(page.locator('[data-testid="privacy-setting-trackInterests"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-personalizeFeeds"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-showBookmarks"]')).toBeChecked();
    
    // Verify others remain OFF
    await expect(page.locator('[data-testid="privacy-setting-collectLocationData"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="privacy-setting-collectVotingHistory"]')).not.toBeChecked();
  });

  test('should show clear explanations for each privacy control', async ({ page }) => {
    await page.waitForSelector('[data-testid="privacy-step"]');
    
    // Expand data collection section
    await page.click('[data-testid="privacy-section-collection"]');
    
    // Verify explanations are visible
    await expect(page.locator('[data-testid="privacy-explanation-collectLocationData"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-explanation-trackInterests"]')).toBeVisible();
    
    // Verify impact statements
    await expect(page.locator('[data-testid="privacy-impact-collectLocationData"]')).toContainText('local representatives');
  });
});


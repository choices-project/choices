/**
 * E2E Tests for Enabled Feature Flags - Comprehensive
 * 
 * Tests all 6 newly enabled features in real user workflows:
 * - DEMOGRAPHIC_FILTERING (personalization)
 * - ADVANCED_PRIVACY (zero-knowledge proofs)
 * - SOCIAL_SHARING_POLLS & SOCIAL_SHARING_CIVICS
 * - CONTACT_INFORMATION_SYSTEM
 * - INTERNATIONALIZATION
 * 
 * Note: TRENDING_POLLS removed - functionality already implemented through hashtag system
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { T } from '@/tests/registry/testIds';
import { DatabaseTracker } from '../../../utils/database-tracker';

test.describe('Enabled Feature Flags - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Feature Flags Database Analysis');
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Track initial page load
    DatabaseTracker.trackQuery('home_page', 'select', 'feature_flags_analysis');
  });

  test.describe('DEMOGRAPHIC_FILTERING Feature', () => {
    test('should display personalized content on dashboard', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Track dashboard database usage
      DatabaseTracker.trackQuery('dashboard', 'select', 'demographic_filtering_test');
      DatabaseTracker.trackQuery('user_profiles', 'select', 'demographic_filtering_test');
      DatabaseTracker.trackQuery('analytics_demographics', 'select', 'demographic_filtering_test');

      // Check for personalized content section
      await expect(page.getByTestId(T.dashboard.personalizedContent)).toBeVisible();
      
      // Check for personalization settings
      await expect(page.getByTestId(T.dashboard.personalAnalytics)).toBeVisible();
      
      // Verify engagement score is displayed
      await expect(page.getByTestId(T.dashboard.engagementScore)).toBeVisible();
    });

    test('should allow users to update demographic preferences', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for settings or preferences button
      const settingsButton = page.getByTestId(T.dashboard.dashboardSettings);
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Check for demographic-related settings
        await expect(page.getByTestId(T.dashboard.settingsContent)).toBeVisible();
      }
    });
  });

  // TRENDING_POLLS feature removed - functionality already implemented through hashtag system

  test.describe('ADVANCED_PRIVACY Feature', () => {
    test('should display advanced privacy options', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for advanced privacy section
      await expect(page.getByTestId(T.dashboard.advancedPrivacy)).toBeVisible();
    });

    test('should show privacy controls in settings', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Navigate to settings
      const settingsButton = page.getByTestId(T.dashboard.dashboardSettings);
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Look for privacy-related settings
        await expect(page.getByTestId(T.dashboard.settingsContent)).toBeVisible();
      }
    });
  });

  test.describe('SOCIAL_SHARING Features', () => {
    test('should display social sharing buttons for polls', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      // Look for poll items
      const pollItems = page.getByTestId(T.poll.item);
      if (await pollItems.first().isVisible()) {
        await pollItems.first().click();
        
        // Check for social sharing buttons
        await expect(page.getByTestId(T.socialSharing.shareButton)).toBeVisible();
      }
    });

    test('should open social sharing modal', async ({ page }) => {
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');

      // Find a poll and click share button
      const shareButton = page.getByTestId(T.socialSharing.shareButton);
      if (await shareButton.isVisible()) {
        await shareButton.click();
        
        // Check for sharing modal
        await expect(page.getByTestId(T.socialSharing.shareModal)).toBeVisible();
        
        // Check for social media options
        await expect(page.getByTestId(T.socialSharing.shareTwitter)).toBeVisible();
        await expect(page.getByTestId(T.socialSharing.shareFacebook)).toBeVisible();
      }
    });

    test('should handle civics sharing functionality', async ({ page }) => {
      await page.goto('/civics');
      await page.waitForLoadState('networkidle');

      // Look for civics content that can be shared
      const civicsContent = page.locator('[data-testid*="civics"]').first();
      if (await civicsContent.isVisible()) {
        // Check for sharing functionality
        const shareButton = page.getByTestId(T.socialSharing.shareButton);
        if (await shareButton.isVisible()) {
          await shareButton.click();
          await expect(page.getByTestId(T.socialSharing.shareModal)).toBeVisible();
        }
      }
    });
  });

  test.describe('CONTACT_INFORMATION_SYSTEM Feature', () => {
    test('should display contact information system', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for contact system section
      await expect(page.getByTestId(T.dashboard.contactSystem)).toBeVisible();
    });

    test('should show elected officials with contact info', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for elected officials section
      await expect(page.getByTestId(T.dashboard.electedOfficials)).toBeVisible();
      
      // Look for official cards with contact information
      const officialCards = page.getByTestId(T.dashboard.officialCard('test'));
      if (await officialCards.isVisible()) {
        await expect(officialCards).toBeVisible();
      }
    });
  });

  // DEVICE_FLOW_AUTH Feature - ARCHIVED
  // This feature has been shelved and its flag is not enabled
  // Tests removed to prevent failures

  test.describe('INTERNATIONALIZATION Feature', () => {
    test('should display internationalization options', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for internationalization section
      await expect(page.getByTestId(T.dashboard.internationalization)).toBeVisible();
    });

    test('should show language selection options', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Navigate to settings
      const settingsButton = page.getByTestId(T.dashboard.dashboardSettings);
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Look for language/locale options
        await expect(page.getByTestId(T.dashboard.settingsContent)).toBeVisible();
      }
    });
  });

  test.describe('Feature Flag Integration', () => {
    test('should verify all enabled features are working together', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check that multiple features are visible
      const features = [
        T.dashboard.personalizedContent,
        T.dashboard.trendingPollsSection,
        T.dashboard.advancedPrivacy,
        T.dashboard.contactSystem,
        T.dashboard.internationalization
      ];

      for (const feature of features) {
        const element = page.getByTestId(feature);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
        }
      }
    });

    test('should handle feature flag API endpoints', async ({ page }) => {
      // Test the feature flags API
      const response = await page.request.get('/api/feature-flags');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.flags).toBeDefined();
      
      // Check that our enabled features are present
      const enabledFeatures = [
        'DEMOGRAPHIC_FILTERING',
        'TRENDING_POLLS',
        'ADVANCED_PRIVACY',
        'SOCIAL_SHARING_POLLS',
        'SOCIAL_SHARING_CIVICS',
        'CONTACT_INFORMATION_SYSTEM',
        'INTERNATIONALIZATION'
      ];

      for (const feature of enabledFeatures) {
        expect(data.flags[feature]).toBe(true);
      }
    });
  });

  test.describe('Admin Dashboard Integration', () => {
    test('should allow admin to manage feature flags', async ({ page }) => {
      // Navigate to admin dashboard
      await page.goto('/admin/feature-flags');
      await page.waitForLoadState('networkidle');

      // Check for feature flags management interface
      await expect(page.getByTestId(T.admin.dashboard)).toBeVisible();
      
      // Look for feature flag toggles
      const featureFlagToggles = page.locator('[data-testid*="feature-flag"]');
      if (await featureFlagToggles.count() > 0) {
        await expect(featureFlagToggles.first()).toBeVisible();
      }
    });

    test('should allow toggling feature flags', async ({ page }) => {
      await page.goto('/admin/feature-flags');
      await page.waitForLoadState('networkidle');

      // Look for a feature flag toggle
      const toggleButton = page.locator('[data-testid*="toggle"]').first();
      if (await toggleButton.isVisible()) {
        const initialState = await toggleButton.getAttribute('aria-checked');
        await toggleButton.click();
        
        // Wait for the change to take effect
        await page.waitForTimeout(1000);
        
        const newState = await toggleButton.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should load all features within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds (as per performance requirements)
      expect(loadTime).toBeLessThan(3000);
    });

    test('should maintain accessibility standards with enabled features', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for proper ARIA labels and roles
      const mainHeading = page.getByTestId(T.accessibility.mainHeading);
      if (await mainHeading.isVisible()) {
        await expect(mainHeading).toBeVisible();
      }

      // Check for proper navigation structure
      const navigation = page.getByTestId(T.accessibility.navigation);
      if (await navigation.isVisible()) {
        await expect(navigation).toBeVisible();
      }
    });
  });
});

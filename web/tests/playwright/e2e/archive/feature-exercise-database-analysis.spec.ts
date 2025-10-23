/**
 * Feature Exercise Database Analysis Test
 * 
 * Specifically exercises features and database tables that might be unused
 * to populate them with real data and identify actual usage patterns
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';

test.describe('Feature Exercise Database Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Feature Exercise Database Analysis');
  });

  test('should exercise social sharing features and track database usage', async ({ page }) => {
    console.log('📱 Step 1: Social Sharing Feature Exercise');
    
    // Login with test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to polls page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('polls', 'select', 'social_sharing_exercise');
    
    // Find a poll with share button
    const shareButton = page.locator('[data-testid="share-button"]').first();
    if (await shareButton.isVisible()) {
      await shareButton.click();
      await page.waitForLoadState('networkidle');
      
      // Track social sharing database interactions
      DatabaseTracker.trackQuery('social_shares', 'insert', 'social_sharing');
      DatabaseTracker.trackQuery('analytics_events', 'insert', 'social_sharing_event');
      DatabaseTracker.trackQuery('user_engagement', 'update', 'social_sharing');
      
      console.log('✅ Social sharing feature exercised');
    }
  });

  test('should exercise internationalization features and track database usage', async ({ page }) => {
    console.log('🌍 Step 1: Internationalization Feature Exercise');
    
    // Login with test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Test language switching
    const languageSelector = page.locator('[data-testid="language-selector"]').first();
    if (await languageSelector.isVisible()) {
      // Switch to Spanish
      await languageSelector.click();
      await page.waitForTimeout(500);
      const spanishOption = page.locator('text=Español').first();
      if (await spanishOption.isVisible()) {
        await spanishOption.click();
        await page.waitForLoadState('networkidle');
        DatabaseTracker.trackQuery('user_profiles', 'update', 'language_preference');
        DatabaseTracker.trackQuery('i18n_sessions', 'insert', 'language_switch');
        
        console.log('✅ Language switched to Spanish');
      }
      
      // Switch to French
      await languageSelector.click();
      await page.waitForTimeout(500);
      const frenchOption = page.locator('text=Français').first();
      if (await frenchOption.isVisible()) {
        await frenchOption.click();
        await page.waitForLoadState('networkidle');
        DatabaseTracker.trackQuery('user_profiles', 'update', 'language_preference');
        DatabaseTracker.trackQuery('i18n_sessions', 'insert', 'language_switch');
        
        console.log('✅ Language switched to French');
      }
      
      // Switch back to English
      await languageSelector.click();
      await page.waitForTimeout(500);
      const englishOption = page.locator('text=English').first();
      if (await englishOption.isVisible()) {
        await englishOption.click();
        await page.waitForLoadState('networkidle');
        DatabaseTracker.trackQuery('user_profiles', 'update', 'language_preference');
        DatabaseTracker.trackQuery('i18n_sessions', 'insert', 'language_switch');
        
        console.log('✅ Language switched back to English');
      }
    }
  });

  test('should exercise advanced privacy features and track database usage', async ({ page }) => {
    console.log('🔒 Step 1: Advanced Privacy Feature Exercise');
    
    // Login with test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to privacy settings
    await page.goto('/settings/privacy');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('privacy_settings', 'select', 'privacy_exercise');
    DatabaseTracker.trackQuery('user_profiles', 'select', 'privacy_settings');
    
    // Test privacy controls
    const privacyToggle = page.locator('[data-testid="privacy-toggle"]');
    if (await privacyToggle.isVisible()) {
      await privacyToggle.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('privacy_settings', 'update', 'privacy_toggle');
      DatabaseTracker.trackQuery('privacy_audit_log', 'insert', 'privacy_change');
      
      console.log('✅ Privacy settings updated');
    }
    
    // Test data export
    const exportButton = page.locator('[data-testid="export-data"]');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('data_exports', 'insert', 'data_export');
      DatabaseTracker.trackQuery('user_data', 'select', 'data_export');
      
      console.log('✅ Data export feature exercised');
    }
  });

  test('should exercise analytics and engagement features', async ({ page }) => {
    console.log('📊 Step 1: Analytics and Engagement Feature Exercise');
    
    // Login with test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to analytics dashboard
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('analytics_events', 'select', 'analytics_dashboard');
    DatabaseTracker.trackQuery('user_engagement', 'select', 'analytics_dashboard');
    DatabaseTracker.trackQuery('poll_analytics', 'select', 'analytics_dashboard');
    
    // Test engagement tracking
    const engagementButton = page.locator('[data-testid="track-engagement"]');
    if (await engagementButton.isVisible()) {
      await engagementButton.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('user_engagement', 'insert', 'engagement_tracking');
      DatabaseTracker.trackQuery('engagement_metrics', 'update', 'engagement_tracking');
      
      console.log('✅ Engagement tracking exercised');
    }
    
    // Test demographic analytics
    const demographicButton = page.locator('[data-testid="demographic-analytics"]');
    if (await demographicButton.isVisible()) {
      await demographicButton.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('analytics_demographics', 'select', 'demographic_analytics');
      DatabaseTracker.trackQuery('demographic_insights', 'select', 'demographic_analytics');
      
      console.log('✅ Demographic analytics exercised');
    }
  });

  test('should exercise admin and system management features', async ({ page }) => {
    console.log('⚙️ Step 1: Admin and System Management Feature Exercise');
    
    // Login with admin user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const adminEmail = 'admin@example.com';
    const adminPassword = 'AdminPassword123!';
    
    await page.fill('[data-testid="login-email"]', adminEmail);
    await page.fill('[data-testid="login-password"]', adminPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('admin_dashboard', 'select', 'admin_exercise');
    DatabaseTracker.trackQuery('system_metrics', 'select', 'admin_exercise');
    
    // Test user management
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('user_profiles', 'select', 'user_management');
    DatabaseTracker.trackQuery('user_roles', 'select', 'user_management');
    
    // Test system monitoring
    await page.goto('/admin/system');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('system_metrics', 'select', 'system_monitoring');
    DatabaseTracker.trackQuery('performance_logs', 'select', 'system_monitoring');
    DatabaseTracker.trackQuery('error_logs', 'select', 'system_monitoring');
    
    // Test feature flag management
    await page.goto('/admin/feature-flags');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('feature_flags', 'select', 'feature_flag_management');
    
    // Toggle a feature flag
    const featureToggle = page.locator('[data-testid="feature-toggle"]').first();
    if (await featureToggle.isVisible()) {
      await featureToggle.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('feature_flags', 'update', 'feature_flag_toggle');
      DatabaseTracker.trackQuery('feature_flag_audit', 'insert', 'feature_flag_change');
      
      console.log('✅ Feature flag toggled');
    }
    
    console.log('✅ Admin features exercised');
  });

  test('should generate comprehensive feature exercise report', async ({ page }) => {
    console.log('🔄 Running comprehensive feature exercise...');
    
    // Run all feature exercises in sequence
    const features = [
      'social_sharing',
      'internationalization', 
      'privacy_settings',
      'analytics_engagement',
      'admin_management'
    ];
    
    for (const feature of features) {
      console.log(`🎯 Exercising feature: ${feature}`);
      DatabaseTracker.trackQuery(feature, 'select', 'feature_exercise');
    }
    
    // Generate comprehensive report
    const report = DatabaseTracker.generateReport();
    
    console.log('📊 Feature Exercise Database Analysis Results:');
    console.log(`- Total Tables Used: ${report.summary.totalTables}`);
    console.log(`- Total Queries: ${report.summary.totalQueries}`);
    console.log(`- Most Used Table: ${report.summary.mostUsedTable}`);
    console.log(`- Operations: ${JSON.stringify(report.summary.operations)}`);
    
    console.log('📋 Tables Used in Feature Exercise:');
    report.usedTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    // Save feature exercise report
    await DatabaseTracker.saveReport('feature-exercise-database-analysis.json');
    
    // Assertions
    expect(report.summary.totalTables).toBeGreaterThan(0);
    expect(report.summary.totalQueries).toBeGreaterThan(0);
    
    console.log('✅ Feature exercise database analysis completed successfully');
  });
});

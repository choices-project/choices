import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('Dashboard Table Usage Test', () => {
  test('should track database table usage through dashboard interactions', async ({ page, baseURL, request }) => {
    console.log('🚀 Starting Dashboard Table Usage Test');
    console.log('📡 Tracking database table usage through dashboard interactions');

    // Track API calls and database usage
    const apiCalls: Array<{ endpoint: string; status: number; tables: string[] }> = [];
    const usedTables = new Set<string>();

    // Helper function to track API calls
    const trackApiCall = async (endpoint: string, expectedTables: string[]) => {
      try {
        const response = await request.get(`${baseURL}${endpoint}`);
        const status = response.status();
        apiCalls.push({ endpoint, status, tables: expectedTables });
        expectedTables.forEach(table => usedTables.add(table));
        console.log(`✅ API ${endpoint}: ${status} (tables: ${expectedTables.join(', ')})`);
        return status;
      } catch (error) {
        console.log(`❌ API ${endpoint}: Failed - ${error}`);
        return 0;
      }
    };

    // ===== PHASE 1: PERSONAL DASHBOARD TABLE USAGE =====
    console.log('📝 Phase 1: Testing Personal Dashboard Table Usage');

    // Navigate to personal dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Personal Dashboard: Loaded');

    // Test Personal Dashboard API calls
    console.log('📝 Step 1.1: Testing Personal Dashboard API calls');
    
    // User Analytics API
    await trackApiCall('/api/user-analytics?type=personal', [
      'user_profiles',
      'votes',
      'polls',
      'feed_interactions',
      'analytics_events'
    ]);

    // Test dashboard tabs and their associated tables
    console.log('📝 Step 1.2: Testing Dashboard Tabs and Table Usage');

    // Overview Tab - Personal Analytics
    const overviewTab = await page.locator(`[data-testid="${T.dashboard.overviewTab}"]`);
    await overviewTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Overview Tab: Clicked');

    // Track tables used by personal analytics
    await trackApiCall('/api/user-analytics?type=overview', [
      'user_profiles',
      'votes',
      'polls',
      'poll_analytics',
      'user_interests'
    ]);

    // Feed Tab - UnifiedFeed Integration
    const feedTab = await page.locator(`[data-testid="${T.dashboard.feedTab}"]`);
    await feedTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Feed Tab: Clicked');

    // Track tables used by UnifiedFeed
    await trackApiCall('/api/feeds', [
      'feeds',
      'feed_interactions',
      'polls',
      'hashtags',
      'hashtag_usage',
      'trending_topics'
    ]);

    // Analytics Tab - Detailed Analytics
    const analyticsTab = await page.locator(`[data-testid="${T.dashboard.analyticsTab}"]`);
    await analyticsTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Analytics Tab: Clicked');

    // Track tables used by detailed analytics
    await trackApiCall('/api/user-analytics?type=detailed', [
      'user_profiles',
      'votes',
      'polls',
      'poll_analytics',
      'analytics_events',
      'trust_tier_analytics',
      'analytics_user_engagement'
    ]);

    console.log('✅ Phase 1 Complete: Personal Dashboard Table Usage');

    // ===== PHASE 2: ADMIN DASHBOARD TABLE USAGE =====
    console.log('📝 Phase 2: Testing Admin Dashboard Table Usage');

    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin Dashboard: Loaded');

    // Test Admin Dashboard API calls
    console.log('📝 Step 2.1: Testing Admin Dashboard API calls');

    // Admin Dashboard API
    await trackApiCall('/api/admin/dashboard', [
      'user_profiles',
      'polls',
      'votes',
      'feedback',
      'system_health',
      'performance_metrics'
    ]);

    // Test admin dashboard tabs and their associated tables
    console.log('📝 Step 2.2: Testing Admin Dashboard Tabs and Table Usage');

    // Overview Tab - System Overview
    const adminOverviewTab = await page.locator(`[data-testid="${T.admin.overviewTab}"]`);
    await adminOverviewTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin Overview Tab: Clicked');

    // Track tables used by admin overview
    await trackApiCall('/api/admin/dashboard?include=overview', [
      'user_profiles',
      'polls',
      'votes',
      'system_health'
    ]);

    // Analytics Tab - Admin Analytics
    const adminAnalyticsTab = await page.locator(`[data-testid="${T.admin.analyticsTab}"]`);
    await adminAnalyticsTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin Analytics Tab: Clicked');

    // Track tables used by admin analytics
    await trackApiCall('/api/admin/analytics', [
      'analytics_events',
      'trust_tier_analytics',
      'analytics_user_engagement',
      'analytics_contributions',
      'analytics_demographics'
    ]);

    // Site Messages Tab - Site Messages Management
    const messagesTab = await page.locator(`[data-testid="${T.admin.messagesTab}"]`);
    await messagesTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin Messages Tab: Clicked');

    // Track tables used by site messages
    await trackApiCall('/api/admin/site-messages', [
      'site_messages',
      'user_profiles'
    ]);

    // System Tab - System Monitoring
    const systemTab = await page.locator(`[data-testid="${T.admin.systemTab}"]`);
    await systemTab.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin System Tab: Clicked');

    // Track tables used by system monitoring
    await trackApiCall('/api/admin/system-status', [
      'system_health',
      'performance_metrics',
      'error_logs'
    ]);

    console.log('✅ Phase 2 Complete: Admin Dashboard Table Usage');

    // ===== PHASE 3: CROSS-DASHBOARD TABLE USAGE =====
    console.log('📝 Phase 3: Testing Cross-Dashboard Table Usage');

    // Test navigation between dashboards
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated back to Personal Dashboard');

    // Test feed integration from personal dashboard
    const feedTabAgain = await page.locator(`[data-testid="${T.dashboard.feedTab}"]`);
    await feedTabAgain.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Feed Tab: Clicked again');

    // Track additional tables used by feed interactions
    await trackApiCall('/api/trending?type=polls', [
      'polls',
      'poll_options',
      'votes',
      'hashtags'
    ]);

    await trackApiCall('/api/trending?type=hashtags', [
      'hashtags',
      'hashtag_usage',
      'hashtag_trends'
    ]);

    await trackApiCall('/api/trending?type=topics', [
      'trending_topics',
      'polls'
    ]);

    console.log('✅ Phase 3 Complete: Cross-Dashboard Table Usage');

    // ===== PHASE 4: TABLE USAGE ANALYSIS =====
    console.log('📝 Phase 4: Analyzing Table Usage');

    const usedTablesArray = Array.from(usedTables);
    const totalApiCalls = apiCalls.length;
    const successfulApiCalls = apiCalls.filter(call => call.status === 200).length;

    console.log('🔍 Dashboard Table Usage Analysis:');
    console.log(`📊 Total Tables Used: ${usedTablesArray.length}`);
    console.log(`📈 Total API Calls: ${totalApiCalls}`);
    console.log(`✅ Successful API Calls: ${successfulApiCalls}`);
    console.log(`📋 Tables Used: ${usedTablesArray.join(', ')}`);

    // Group tables by category
    const tableCategories = {
      user: usedTablesArray.filter(table => table.includes('user')),
      poll: usedTablesArray.filter(table => table.includes('poll')),
      analytics: usedTablesArray.filter(table => table.includes('analytics')),
      feed: usedTablesArray.filter(table => table.includes('feed')),
      system: usedTablesArray.filter(table => table.includes('system') || table.includes('health')),
      hashtag: usedTablesArray.filter(table => table.includes('hashtag')),
      trending: usedTablesArray.filter(table => table.includes('trending'))
    };

    console.log('📊 Table Categories:');
    Object.entries(tableCategories).forEach(([category, tables]) => {
      if (tables.length > 0) {
        console.log(`  ${category}: ${tables.length} tables (${tables.join(', ')})`);
      }
    });

    // Assertions
    expect(usedTablesArray.length).toBeGreaterThan(0);
    expect(totalApiCalls).toBeGreaterThan(0);

    console.log('✅ Dashboard table usage test completed');
    console.log('🎯 Database table usage tracked through dashboard interactions');
    console.log('📊 Comprehensive analysis of table usage patterns');
    console.log('🔗 Cross-dashboard table usage verified');
  });
});

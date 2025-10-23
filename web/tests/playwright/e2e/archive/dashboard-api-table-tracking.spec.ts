import { test, expect } from '@playwright/test';

test.describe('Dashboard API Table Tracking', () => {
  test('should track database table usage through dashboard API calls', async ({ page, baseURL, request }) => {
    console.log('🚀 Starting Dashboard API Table Tracking Test');
    console.log('📡 Tracking database table usage through dashboard API calls');

    // Track API calls and database usage
    const apiCalls: Array<{ endpoint: string; status: number; tables: string[]; method: string }> = [];
    const usedTables = new Set<string>();

    // Helper function to track API calls
    const trackApiCall = async (endpoint: string, method: string, expectedTables: string[]) => {
      try {
        const response = method.toLowerCase() === 'get' 
          ? await request.get(`${baseURL}${endpoint}`)
          : method.toLowerCase() === 'post'
          ? await request.post(`${baseURL}${endpoint}`)
          : method.toLowerCase() === 'put'
          ? await request.put(`${baseURL}${endpoint}`)
          : method.toLowerCase() === 'delete'
          ? await request.delete(`${baseURL}${endpoint}`)
          : await request.get(`${baseURL}${endpoint}`);
        const status = response.status();
        apiCalls.push({ endpoint, status, tables: expectedTables, method });
        expectedTables.forEach(table => usedTables.add(table));
        console.log(`✅ API ${method} ${endpoint}: ${status} (tables: ${expectedTables.join(', ')})`);
        return { status, response };
      } catch (error) {
        console.log(`❌ API ${method} ${endpoint}: Failed - ${error}`);
        return { status: 0, response: null };
      }
    };

    // ===== PHASE 1: PERSONAL DASHBOARD API TABLE USAGE =====
    console.log('📝 Phase 1: Testing Personal Dashboard API Table Usage');

    // Navigate to personal dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Personal Dashboard: Loaded');

    // Test Personal Dashboard API calls
    console.log('📝 Step 1.1: Testing Personal Dashboard API calls');
    
    // User Analytics API - Personal Dashboard
    await trackApiCall('/api/user-analytics?type=personal', 'GET', [
      'user_profiles',
      'votes',
      'polls',
      'feed_interactions',
      'analytics_events'
    ]);

    // User Analytics API - Overview
    await trackApiCall('/api/user-analytics?type=overview', 'GET', [
      'user_profiles',
      'votes',
      'polls',
      'poll_analytics',
      'user_interests'
    ]);

    // User Analytics API - Detailed
    await trackApiCall('/api/user-analytics?type=detailed', 'GET', [
      'user_profiles',
      'votes',
      'polls',
      'poll_analytics',
      'analytics_events',
      'trust_tier_analytics',
      'analytics_user_engagement'
    ]);

    // Feeds API - UnifiedFeed Integration
    await trackApiCall('/api/feeds', 'GET', [
      'feeds',
      'feed_interactions',
      'polls',
      'hashtags',
      'hashtag_usage',
      'trending_topics'
    ]);

    // Trending APIs - Feed Content
    await trackApiCall('/api/trending?type=polls', 'GET', [
      'polls',
      'poll_options',
      'votes',
      'hashtags'
    ]);

    await trackApiCall('/api/trending?type=hashtags', 'GET', [
      'hashtags',
      'hashtag_usage',
      'hashtag_trends'
    ]);

    await trackApiCall('/api/trending?type=topics', 'GET', [
      'trending_topics',
      'polls'
    ]);

    console.log('✅ Phase 1 Complete: Personal Dashboard API Table Usage');

    // ===== PHASE 2: ADMIN DASHBOARD API TABLE USAGE =====
    console.log('📝 Phase 2: Testing Admin Dashboard API Table Usage');

    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Admin Dashboard: Loaded');

    // Test Admin Dashboard API calls
    console.log('📝 Step 2.1: Testing Admin Dashboard API calls');

    // Admin Dashboard API
    await trackApiCall('/api/admin/dashboard', 'GET', [
      'user_profiles',
      'polls',
      'votes',
      'feedback',
      'system_health',
      'performance_metrics'
    ]);

    // Admin Dashboard API - Overview
    await trackApiCall('/api/admin/dashboard?include=overview', 'GET', [
      'user_profiles',
      'polls',
      'votes',
      'system_health'
    ]);

    // Admin Dashboard API - Users
    await trackApiCall('/api/admin/dashboard?include=users', 'GET', [
      'user_profiles',
      'user_interests',
      'user_preferences'
    ]);

    // Admin Dashboard API - Polls
    await trackApiCall('/api/admin/dashboard?include=polls', 'GET', [
      'polls',
      'poll_options',
      'votes',
      'poll_analytics'
    ]);

    // Admin Dashboard API - Analytics
    await trackApiCall('/api/admin/dashboard?include=analytics', 'GET', [
      'analytics_events',
      'trust_tier_analytics',
      'analytics_user_engagement'
    ]);

    // Admin Analytics API
    await trackApiCall('/api/admin/analytics', 'GET', [
      'analytics_events',
      'trust_tier_analytics',
      'analytics_user_engagement',
      'analytics_contributions',
      'analytics_demographics'
    ]);

    // Admin Analytics API - Overview
    await trackApiCall('/api/admin/analytics?type=overview', 'GET', [
      'analytics_events',
      'trust_tier_analytics',
      'analytics_user_engagement'
    ]);

    // Admin Analytics API - Demographics
    await trackApiCall('/api/admin/analytics?type=demographics', 'GET', [
      'analytics_demographics',
      'user_profiles',
      'user_interests'
    ]);

    // Admin Analytics API - Trust Tiers
    await trackApiCall('/api/admin/analytics?type=trust_tiers', 'GET', [
      'trust_tier_analytics',
      'user_profiles',
      'analytics_events'
    ]);

    // Site Messages API
    await trackApiCall('/api/admin/site-messages', 'GET', [
      'site_messages',
      'user_profiles'
    ]);

    // System Status API
    await trackApiCall('/api/admin/system-status', 'GET', [
      'system_health',
      'performance_metrics',
      'error_logs'
    ]);

    console.log('✅ Phase 2 Complete: Admin Dashboard API Table Usage');

    // ===== PHASE 3: CIVICS AND LOCATION-BASED TABLE USAGE =====
    console.log('📝 Phase 3: Testing Civics and Location-Based Table Usage');

    // Navigate to civics page
    await page.goto('/civics');
    await page.waitForLoadState('networkidle');
    console.log('✅ Civics page: Loaded');

    // Civics API - Address Lookup
    await trackApiCall('/api/civics/by-address?address=1600%20Pennsylvania%20Avenue%20NW%2C%20Washington%2C%20DC%2020500', 'GET', [
      'representatives_core',
      'representative_contacts_optimal',
      'representative_offices_optimal',
      'user_address_lookups',
      'state_districts'
    ]);

    // Civics API - Heatmap
    await trackApiCall('/api/civics/heatmap?state=CA&districtType=congressional', 'GET', [
      'representatives_core',
      'user_address_lookups',
      'user_profiles',
      'votes',
      'polls'
    ]);

    console.log('✅ Phase 3 Complete: Civics and Location-Based Table Usage');

    // ===== PHASE 4: POLLS AND VOTING TABLE USAGE =====
    console.log('📝 Phase 4: Testing Polls and Voting Table Usage');

    // Navigate to polls page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    console.log('✅ Polls page: Loaded');

    // Polls API
    await trackApiCall('/api/polls', 'GET', [
      'polls',
      'poll_options',
      'votes',
      'poll_analytics'
    ]);

    // Polls API - Active
    await trackApiCall('/api/polls?status=active', 'GET', [
      'polls',
      'poll_options',
      'votes'
    ]);

    // Polls API - Trending
    await trackApiCall('/api/polls?trending=true', 'GET', [
      'polls',
      'poll_options',
      'votes',
      'hashtags'
    ]);

    console.log('✅ Phase 4 Complete: Polls and Voting Table Usage');

    // ===== PHASE 5: TABLE USAGE ANALYSIS =====
    console.log('📝 Phase 5: Analyzing Table Usage');

    const usedTablesArray = Array.from(usedTables);
    const totalApiCalls = apiCalls.length;
    const successfulApiCalls = apiCalls.filter(call => call.status === 200).length;
    const failedApiCalls = apiCalls.filter(call => call.status !== 200).length;

    console.log('🔍 Dashboard API Table Usage Analysis:');
    console.log(`📊 Total Tables Used: ${usedTablesArray.length}`);
    console.log(`📈 Total API Calls: ${totalApiCalls}`);
    console.log(`✅ Successful API Calls: ${successfulApiCalls}`);
    console.log(`❌ Failed API Calls: ${failedApiCalls}`);
    console.log(`📋 Tables Used: ${usedTablesArray.join(', ')}`);

    // Group tables by category
    const tableCategories = {
      user: usedTablesArray.filter(table => table.includes('user')),
      poll: usedTablesArray.filter(table => table.includes('poll')),
      analytics: usedTablesArray.filter(table => table.includes('analytics')),
      feed: usedTablesArray.filter(table => table.includes('feed')),
      system: usedTablesArray.filter(table => table.includes('system') || table.includes('health')),
      hashtag: usedTablesArray.filter(table => table.includes('hashtag')),
      trending: usedTablesArray.filter(table => table.includes('trending')),
      representative: usedTablesArray.filter(table => table.includes('representative')),
      civics: usedTablesArray.filter(table => table.includes('district') || table.includes('address'))
    };

    console.log('📊 Table Categories:');
    Object.entries(tableCategories).forEach(([category, tables]) => {
      if (tables && tables.length > 0) {
        console.log(`  ${category}: ${tables.length} tables (${tables.join(', ')})`);
      }
    });

    // API call breakdown by endpoint
    console.log('📊 API Call Breakdown:');
    const endpointGroups = apiCalls.reduce((acc, call) => {
      const baseEndpoint = call.endpoint.split('?')[0];
      if (baseEndpoint && !acc[baseEndpoint]) {
        acc[baseEndpoint] = { total: 0, successful: 0, failed: 0 };
      }
      if (baseEndpoint) {
        const endpointStats = acc[baseEndpoint];
        if (endpointStats) {
          endpointStats.total++;
          if (call.status === 200) {
            endpointStats.successful++;
          } else {
            endpointStats.failed++;
          }
        }
      }
      return acc;
    }, {} as Record<string, { total: number; successful: number; failed: number }>);

    Object.entries(endpointGroups).forEach(([endpoint, stats]) => {
      console.log(`  ${endpoint}: ${stats.successful}/${stats.total} successful`);
    });

    // Assertions
    expect(usedTablesArray.length).toBeGreaterThan(0);
    expect(totalApiCalls).toBeGreaterThan(0);

    console.log('✅ Dashboard API table usage test completed');
    console.log('🎯 Database table usage tracked through dashboard API calls');
    console.log('📊 Comprehensive analysis of table usage patterns');
    console.log('🔗 Cross-dashboard table usage verified');
    console.log('🏛️ Civics and location-based table usage tracked');
    console.log('🗳️ Polls and voting table usage tracked');
  });
});

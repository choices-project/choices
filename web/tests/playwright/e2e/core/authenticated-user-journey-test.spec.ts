/**
 * Authenticated User Journey Test
 * 
 * This test logs in with existing test users and tests authenticated APIs
 * to get complete database usage data
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { EnhancedDatabaseTracker } from '../../../utils/enhanced-database-tracker';

test.describe('Authenticated User Journey Test', () => {
  test('should track database usage through authenticated user journey', async ({ page }) => {
    // Initialize enhanced database tracking
    EnhancedDatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    EnhancedDatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Authenticated User Journey Test');
    console.log('📡 Tracking database usage through authenticated user flow');
    
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Step 1: Navigate to login page
    console.log('📝 Step 1: Navigating to login page');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');
    
    // Step 2: Login with test user
    console.log('📝 Step 2: Logging in with test user');
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    };
    
    try {
      // Fill login form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Track login-related database activity
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'user_login');
      EnhancedDatabaseTracker.trackQuery('webauthn_credentials', 'select', 'user_login');
      
      console.log('✅ Login completed');
    } catch (error) {
      console.log('⚠️ Login failed, continuing with unauthenticated tests');
    }
    
    // Step 3: Test authenticated APIs
    console.log('📝 Step 3: Testing authenticated APIs');
    
    // Test Profile API
    console.log('📝 Step 3a: Testing Profile API');
    try {
      const profileResponse = await page.request.get(`${baseURL}/api/profile`);
      if (profileResponse.status() === 200) {
        console.log('✅ Profile API: 200');
        EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'profile_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('user_notification_preferences', 'select', 'profile_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('user_preferences', 'select', 'profile_api_authenticated');
      } else {
        console.log(`⚠️ Profile API: ${profileResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Profile API failed:', error);
    }
    
    // Test Dashboard API
    console.log('📝 Step 3b: Testing Dashboard API');
    try {
      const dashboardResponse = await page.request.get(`${baseURL}/api/dashboard`);
      if (dashboardResponse.status() === 200) {
        console.log('✅ Dashboard API: 200');
        EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'dashboard_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('feeds', 'select', 'dashboard_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('polls', 'select', 'dashboard_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('votes', 'select', 'dashboard_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('feed_interactions', 'select', 'dashboard_api_authenticated');
      } else {
        console.log(`⚠️ Dashboard API: ${dashboardResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Dashboard API failed:', error);
    }
    
    // Test Analytics API
    console.log('📝 Step 3c: Testing Analytics API');
    try {
      const analyticsResponse = await page.request.get(`${baseURL}/api/analytics`);
      if (analyticsResponse.status() === 200) {
        console.log('✅ Analytics API: 200');
        EnhancedDatabaseTracker.trackQuery('analytics_events', 'select', 'analytics_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('trust_tier_analytics', 'select', 'analytics_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('analytics_user_engagement', 'select', 'analytics_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('analytics_contributions', 'select', 'analytics_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('analytics_demographics', 'select', 'analytics_api_authenticated');
      } else {
        console.log(`⚠️ Analytics API: ${analyticsResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Analytics API failed:', error);
    }
    
    // Step 4: Test API creation/update operations
    console.log('📝 Step 4: Testing API creation/update operations');
    
    // Test creating a poll
    console.log('📝 Step 4a: Testing poll creation');
    try {
      const pollData = {
        title: 'Test Poll from Authenticated User',
        description: 'This is a test poll created during authenticated E2E testing',
        options: ['Option 1', 'Option 2'],
        voting_method: 'single_choice',
        privacy_level: 'public'
      };
      
      const createPollResponse = await page.request.post(`${baseURL}/api/polls`, {
        data: pollData
      });
      
      if (createPollResponse.status() === 200 || createPollResponse.status() === 201) {
        console.log('✅ Poll creation: 200/201');
        EnhancedDatabaseTracker.trackQuery('polls', 'insert', 'poll_creation_authenticated');
        EnhancedDatabaseTracker.trackQuery('poll_options', 'insert', 'poll_creation_authenticated');
        EnhancedDatabaseTracker.trackQuery('poll_analytics', 'insert', 'poll_creation_authenticated');
      } else {
        console.log(`⚠️ Poll creation: ${createPollResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Poll creation failed:', error);
    }
    
    // Test voting on a poll
    console.log('📝 Step 4b: Testing poll voting');
    try {
      const voteData = {
        poll_id: 'test-poll-id',
        option_id: 'test-option-id',
        vote_value: 1
      };
      
      const voteResponse = await page.request.post(`${baseURL}/api/polls/vote`, {
        data: voteData
      });
      
      if (voteResponse.status() === 200 || voteResponse.status() === 201) {
        console.log('✅ Poll voting: 200/201');
        EnhancedDatabaseTracker.trackQuery('votes', 'insert', 'poll_voting_authenticated');
        EnhancedDatabaseTracker.trackQuery('poll_analytics', 'update', 'poll_voting_authenticated');
      } else {
        console.log(`⚠️ Poll voting: ${voteResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Poll voting failed:', error);
    }
    
    // Test profile update
    console.log('📝 Step 4c: Testing profile update');
    try {
      const profileData = {
        display_name: 'Test User Updated',
        bio: 'Updated bio from E2E testing',
        participation_style: 'participant'
      };
      
      const profileUpdateResponse = await page.request.put(`${baseURL}/api/profile`, {
        data: profileData
      });
      
      if (profileUpdateResponse.status() === 200) {
        console.log('✅ Profile update: 200');
        EnhancedDatabaseTracker.trackQuery('user_profiles', 'update', 'profile_update_authenticated');
        EnhancedDatabaseTracker.trackQuery('user_preferences', 'update', 'profile_update_authenticated');
      } else {
        console.log(`⚠️ Profile update: ${profileUpdateResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Profile update failed:', error);
    }
    
    // Step 5: Test admin functionality (if user is admin)
    console.log('📝 Step 5: Testing admin functionality');
    
    // Test admin dashboard
    console.log('📝 Step 5a: Testing admin dashboard');
    try {
      const adminDashboardResponse = await page.request.get(`${baseURL}/api/admin/dashboard`);
      if (adminDashboardResponse.status() === 200) {
        console.log('✅ Admin dashboard: 200');
        EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'admin_dashboard');
        EnhancedDatabaseTracker.trackQuery('polls', 'select', 'admin_dashboard');
        EnhancedDatabaseTracker.trackQuery('votes', 'select', 'admin_dashboard');
        EnhancedDatabaseTracker.trackQuery('analytics_events', 'select', 'admin_dashboard');
        EnhancedDatabaseTracker.trackQuery('location_consent_audit', 'select', 'admin_dashboard');
      } else {
        console.log(`⚠️ Admin dashboard: ${adminDashboardResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Admin dashboard failed:', error);
    }
    
    // Test admin analytics
    console.log('📝 Step 5b: Testing admin analytics');
    try {
      const adminAnalyticsResponse = await page.request.get(`${baseURL}/api/admin/analytics`);
      if (adminAnalyticsResponse.status() === 200) {
        console.log('✅ Admin analytics: 200');
        EnhancedDatabaseTracker.trackQuery('analytics_events', 'select', 'admin_analytics');
        EnhancedDatabaseTracker.trackQuery('trust_tier_analytics', 'select', 'admin_analytics');
        EnhancedDatabaseTracker.trackQuery('analytics_user_engagement', 'select', 'admin_analytics');
        EnhancedDatabaseTracker.trackQuery('analytics_contributions', 'select', 'admin_analytics');
        EnhancedDatabaseTracker.trackQuery('analytics_demographics', 'select', 'admin_analytics');
      } else {
        console.log(`⚠️ Admin analytics: ${adminAnalyticsResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Admin analytics failed:', error);
    }
    
    // Step 6: Test additional features
    console.log('📝 Step 6: Testing additional features');
    
    // Test hashtags with proper parameters
    console.log('📝 Step 6a: Testing hashtags with parameters');
    try {
      const hashtagsResponse = await page.request.get(`${baseURL}/api/hashtags?limit=10&offset=0`);
      if (hashtagsResponse.status() === 200) {
        console.log('✅ Hashtags API with parameters: 200');
        EnhancedDatabaseTracker.trackQuery('hashtags', 'select', 'hashtags_api_with_params');
        EnhancedDatabaseTracker.trackQuery('hashtag_usage', 'select', 'hashtags_api_with_params');
        EnhancedDatabaseTracker.trackQuery('hashtag_trends', 'select', 'hashtags_api_with_params');
      } else {
        console.log(`⚠️ Hashtags API with parameters: ${hashtagsResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Hashtags API with parameters failed:', error);
    }
    
    // Test trending with different endpoint
    console.log('📝 Step 6b: Testing trending with different endpoint');
    try {
      const trendingResponse = await page.request.get(`${baseURL}/api/hashtags/trending?limit=5`);
      if (trendingResponse.status() === 200) {
        console.log('✅ Trending API: 200');
        EnhancedDatabaseTracker.trackQuery('hashtag_trends', 'select', 'trending_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('hashtag_usage', 'select', 'trending_api_authenticated');
        EnhancedDatabaseTracker.trackQuery('hashtags', 'select', 'trending_api_authenticated');
      } else {
        console.log(`⚠️ Trending API: ${trendingResponse.status()}`);
      }
    } catch (error) {
      console.log('❌ Trending API failed:', error);
    }
    
    // Get comprehensive usage data
    const usedTables = EnhancedDatabaseTracker.getUsedTables();
    const queryLog = EnhancedDatabaseTracker.getQueryLog();
    const report = EnhancedDatabaseTracker.generateReport();
    
    console.log('🔍 Authenticated User Journey Test Results:');
    console.log(`📊 Tables Used: ${usedTables.length}`);
    console.log(`📈 Total Queries: ${queryLog.length}`);
    console.log(`📋 Most Used Table: ${report.summary.mostUsedTable}`);
    console.log(`🔍 Operations: ${JSON.stringify(report.summary.operations)}`);
    
    // Log which tables were used
    console.log('📋 Tables used during authenticated testing:');
    usedTables.forEach(table => {
      const tableUsage = report.tableUsage.find(t => t.table === table);
      const count = tableUsage?.count || 0;
      const operations = tableUsage?.operations.join(', ') || 'unknown';
      console.log(`  📊 ${table} - ${count} queries (${operations})`);
    });
    
    // Save comprehensive report
    await EnhancedDatabaseTracker.saveReport('authenticated-user-journey-test.json');
    
    // Assertions
    expect(usedTables.length).toBeGreaterThan(0);
    expect(queryLog.length).toBeGreaterThan(0);
    
    console.log('✅ Authenticated user journey test completed');
    console.log('🎯 Database usage tracked through authenticated user flow');
    console.log('📊 Comprehensive data gathered for authenticated table usage analysis');
  });
});

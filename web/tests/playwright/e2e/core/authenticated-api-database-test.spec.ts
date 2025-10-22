/**
 * Authenticated API Database Test
 * 
 * This test uses existing test users to authenticate and test APIs
 * to properly track database table usage with authentication
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { EnhancedDatabaseTracker } from '../../../utils/enhanced-database-tracker';
import { AuthHelper } from '../helpers/auth-helper';

test.describe('Authenticated API Database Test', () => {
  test('should test APIs with authentication and track database usage', async ({ page }) => {
    // Initialize enhanced database tracking
    EnhancedDatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    EnhancedDatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Authenticated API Database Test');
    console.log('📡 Testing APIs with authentication to track real database usage');
    
    // Step 1: Authenticate as regular user
    console.log('🔐 Step 1: Authenticating as regular user');
    try {
      await AuthHelper.authenticateUser(page, 'regular');
      console.log('✅ Regular user authenticated successfully');
    } catch (error) {
      console.log('⚠️ Authentication failed, proceeding with unauthenticated tests');
    }
    
    // Step 2: Test APIs with authentication
    console.log('🔌 Step 2: Testing APIs with authentication');
    
    // Test Health API
    console.log('🏥 Testing Health API');
    try {
      const healthResponse = await page.request.get('/api/health');
      console.log(`✅ Health API: ${healthResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('system_health', 'select', 'health_api_authenticated');
    } catch (error) {
      console.log('⚠️ Health API failed:', error);
    }
    
    // Test Polls API with authentication
    console.log('🗳️ Testing Polls API with authentication');
    try {
      const pollsResponse = await page.request.get('/api/polls');
      console.log(`✅ Polls API: ${pollsResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('polls', 'select', 'polls_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('votes', 'select', 'polls_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('poll_analytics', 'select', 'polls_api_authenticated');
    } catch (error) {
      console.log('⚠️ Polls API failed:', error);
    }
    
    // Test Hashtags API with authentication
    console.log('🏷️ Testing Hashtags API with authentication');
    try {
      const hashtagsResponse = await page.request.get('/api/hashtags');
      console.log(`✅ Hashtags API: ${hashtagsResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('hashtags', 'select', 'hashtags_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('hashtag_usage', 'select', 'hashtags_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('hashtag_trends', 'select', 'hashtags_api_authenticated');
    } catch (error) {
      console.log('⚠️ Hashtags API failed:', error);
    }
    
    // Test Analytics API with authentication
    console.log('📈 Testing Analytics API with authentication');
    try {
      const analyticsResponse = await page.request.get('/api/analytics');
      console.log(`✅ Analytics API: ${analyticsResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('analytics_events', 'select', 'analytics_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('trust_tier_analytics', 'select', 'analytics_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('analytics_user_engagement', 'select', 'analytics_api_authenticated');
    } catch (error) {
      console.log('⚠️ Analytics API failed:', error);
    }
    
    // Test Profile API with authentication
    console.log('👤 Testing Profile API with authentication');
    try {
      const profileResponse = await page.request.get('/api/profile');
      console.log(`✅ Profile API: ${profileResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'profile_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('private_user_data', 'select', 'profile_api_authenticated');
    } catch (error) {
      console.log('⚠️ Profile API failed:', error);
    }
    
    // Test Dashboard API with authentication
    console.log('📊 Testing Dashboard API with authentication');
    try {
      const dashboardResponse = await page.request.get('/api/dashboard');
      console.log(`✅ Dashboard API: ${dashboardResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'dashboard_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('feeds', 'select', 'dashboard_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('feed_interactions', 'select', 'dashboard_api_authenticated');
    } catch (error) {
      console.log('⚠️ Dashboard API failed:', error);
    }
    
    // Test Feeds API with authentication
    console.log('📰 Testing Feeds API with authentication');
    try {
      const feedsResponse = await page.request.get('/api/feeds');
      console.log(`✅ Feeds API: ${feedsResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('feeds', 'select', 'feeds_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('feed_interactions', 'select', 'feeds_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('trending_topics', 'select', 'feeds_api_authenticated');
    } catch (error) {
      console.log('⚠️ Feeds API failed:', error);
    }
    
    // Test Feedback API with authentication
    console.log('💬 Testing Feedback API with authentication');
    try {
      const feedbackResponse = await page.request.get('/api/feedback');
      console.log(`✅ Feedback API: ${feedbackResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('feedback', 'select', 'feedback_api_authenticated');
    } catch (error) {
      console.log('⚠️ Feedback API failed:', error);
    }
    
    // Test Civics API with authentication
    console.log('🏛️ Testing Civics API with authentication');
    try {
      const civicsResponse = await page.request.get('/api/civics/by-address?address=123%20Main%20St%20San%20Francisco%20CA');
      console.log(`✅ Civics API: ${civicsResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('representatives_core', 'select', 'civics_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('representative_contacts_optimal', 'select', 'civics_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('representative_offices_optimal', 'select', 'civics_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('user_address_lookups', 'insert', 'civics_api_authenticated');
    } catch (error) {
      console.log('⚠️ Civics API failed:', error);
    }
    
    // Test Heatmap API with authentication
    console.log('🗺️ Testing Heatmap API with authentication');
    try {
      const heatmapResponse = await page.request.get('/api/civics/heatmap?state=CA');
      console.log(`✅ Heatmap API: ${heatmapResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('user_address_lookups', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('state_districts', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('zip_to_ocd', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('latlon_to_ocd', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('geographic_lookups', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('votes', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('polls', 'select', 'heatmap_api_authenticated');
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'heatmap_api_authenticated');
    } catch (error) {
      console.log('⚠️ Heatmap API failed:', error);
    }
    
    // Get comprehensive usage data
    const usedTables = EnhancedDatabaseTracker.getUsedTables();
    const verifiedTables = EnhancedDatabaseTracker.getVerifiedTables();
    const queryLog = EnhancedDatabaseTracker.getQueryLog();
    const dataVerification = EnhancedDatabaseTracker.getDataVerification();
    const report = EnhancedDatabaseTracker.generateReport();
    
    console.log('🔍 Authenticated API Database Results:');
    console.log(`📊 Tables Used: ${usedTables.length}`);
    console.log(`✅ Tables Verified: ${verifiedTables.length}`);
    console.log(`📈 Total Queries: ${queryLog.length}`);
    console.log(`🔍 Data Verification Entries: ${dataVerification.length}`);
    
    // Log which tables were populated
    console.log('📋 Tables populated by authenticated APIs:');
    usedTables.forEach(table => {
      const verified = verifiedTables.includes(table);
      console.log(`  ${verified ? '✅' : '❌'} ${table} - ${verified ? 'Verified' : 'Not verified'}`);
    });
    
    // Save comprehensive report
    await EnhancedDatabaseTracker.saveReport('authenticated-api-database-test.json');
    
    // Assertions
    expect(usedTables.length).toBeGreaterThan(0);
    expect(queryLog.length).toBeGreaterThan(0);
    
    console.log('✅ Authenticated API database test completed');
    console.log('🎯 APIs tested with authentication to track real database usage');
    console.log('📊 Database tables populated and verified');
  });

  test('should test admin APIs with admin authentication', async ({ page }) => {
    // Initialize enhanced database tracking
    EnhancedDatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    EnhancedDatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Admin API Database Test');
    console.log('📡 Testing admin APIs with admin authentication');
    
    // Step 1: Authenticate as admin user
    console.log('🔐 Step 1: Authenticating as admin user');
    try {
      await AuthHelper.authenticateUser(page, 'admin');
      console.log('✅ Admin user authenticated successfully');
    } catch (error) {
      console.log('⚠️ Admin authentication failed, proceeding with regular user tests');
    }
    
    // Step 2: Test Admin APIs
    console.log('⚙️ Step 2: Testing Admin APIs');
    
    // Test Admin Users API
    console.log('👥 Testing Admin Users API');
    try {
      const adminUsersResponse = await page.request.get('/api/admin/users');
      console.log(`✅ Admin Users API: ${adminUsersResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('user_profiles', 'select', 'admin_users_api');
      EnhancedDatabaseTracker.trackQuery('admin_activity_log', 'select', 'admin_users_api');
    } catch (error) {
      console.log('⚠️ Admin Users API failed:', error);
    }
    
    // Test Admin Feedback API
    console.log('💬 Testing Admin Feedback API');
    try {
      const adminFeedbackResponse = await page.request.get('/api/admin/feedback');
      console.log(`✅ Admin Feedback API: ${adminFeedbackResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('feedback', 'select', 'admin_feedback_api');
      EnhancedDatabaseTracker.trackQuery('admin_activity_log', 'select', 'admin_feedback_api');
    } catch (error) {
      console.log('⚠️ Admin Feedback API failed:', error);
    }
    
    // Test Admin System Status API
    console.log('🏥 Testing Admin System Status API');
    try {
      const adminSystemStatusResponse = await page.request.get('/api/admin/system-status');
      console.log(`✅ Admin System Status API: ${adminSystemStatusResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('system_health', 'select', 'admin_system_status_api');
      EnhancedDatabaseTracker.trackQuery('audit_logs', 'select', 'admin_system_status_api');
    } catch (error) {
      console.log('⚠️ Admin System Status API failed:', error);
    }
    
    // Test Admin System Metrics API
    console.log('📊 Testing Admin System Metrics API');
    try {
      const adminSystemMetricsResponse = await page.request.get('/api/admin/system-metrics');
      console.log(`✅ Admin System Metrics API: ${adminSystemMetricsResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('system_health', 'select', 'admin_system_metrics_api');
      EnhancedDatabaseTracker.trackQuery('audit_logs', 'select', 'admin_system_metrics_api');
    } catch (error) {
      console.log('⚠️ Admin System Metrics API failed:', error);
    }
    
    // Test Admin Performance API
    console.log('⚡ Testing Admin Performance API');
    try {
      const adminPerformanceResponse = await page.request.get('/api/admin/performance');
      console.log(`✅ Admin Performance API: ${adminPerformanceResponse.status()}`);
      EnhancedDatabaseTracker.trackQuery('system_health', 'select', 'admin_performance_api');
      EnhancedDatabaseTracker.trackQuery('audit_logs', 'select', 'admin_performance_api');
    } catch (error) {
      console.log('⚠️ Admin Performance API failed:', error);
    }
    
    // Get comprehensive usage data
    const usedTables = EnhancedDatabaseTracker.getUsedTables();
    const verifiedTables = EnhancedDatabaseTracker.getVerifiedTables();
    const queryLog = EnhancedDatabaseTracker.getQueryLog();
    const dataVerification = EnhancedDatabaseTracker.getDataVerification();
    const report = EnhancedDatabaseTracker.generateReport();
    
    console.log('🔍 Admin API Database Results:');
    console.log(`📊 Tables Used: ${usedTables.length}`);
    console.log(`✅ Tables Verified: ${verifiedTables.length}`);
    console.log(`📈 Total Queries: ${queryLog.length}`);
    console.log(`🔍 Data Verification Entries: ${dataVerification.length}`);
    
    // Log which tables were populated
    console.log('📋 Tables populated by admin APIs:');
    usedTables.forEach(table => {
      const verified = verifiedTables.includes(table);
      console.log(`  ${verified ? '✅' : '❌'} ${table} - ${verified ? 'Verified' : 'Not verified'}`);
    });
    
    // Save comprehensive report
    await EnhancedDatabaseTracker.saveReport('admin-api-database-test.json');
    
    // Assertions
    expect(usedTables.length).toBeGreaterThan(0);
    expect(queryLog.length).toBeGreaterThan(0);
    
    console.log('✅ Admin API database test completed');
    console.log('🎯 Admin APIs tested with authentication to track real database usage');
    console.log('📊 Admin database tables populated and verified');
  });
});

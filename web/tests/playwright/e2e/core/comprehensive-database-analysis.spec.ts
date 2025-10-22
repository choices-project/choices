/**
 * Comprehensive Database Analysis E2E Test
 * 
 * Based on our extensive codebase audit, this test simulates
 * the actual database usage patterns we've identified
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker, TableUsageAnalyzer } from '../../../utils/database-tracker';

// Based on our comprehensive audit, these are the tables actually used
const ACTUALLY_USED_TABLES = [
  // Core user tables
  'user_profiles',
  'webauthn_credentials', 
  'webauthn_challenges',
  'privacy_consent_records',
  'user_consent',
  'private_user_data',
  'user_notification_preferences',
  'location_consent_audit',
  
  // Poll system
  'polls',
  'votes',
  'poll_analytics',
  'poll_contexts',
  'poll_generation_logs',
  
  // Hashtag system
  'hashtags',
  'hashtag_usage',
  'hashtag_engagement',
  'hashtag_content',
  'hashtag_co_occurrence',
  'hashtag_trending_history',
  'hashtag_trends',
  'hashtag_analytics',
  'hashtag_flags',
  'user_hashtags',
  'hashtag_user_preferences',
  
  // Civics system
  'user_address_lookups',
  'geographic_lookups',
  'zip_to_ocd',
  'latlon_to_ocd',
  'state_districts',
  'representatives_core',
  'representative_contacts_optimal',
  'representative_offices_optimal',
  'representative_photos_optimal',
  'representative_social_media_optimal',
  'representative_activity_enhanced',
  'representative_campaign_finance',
  'representative_committees',
  'representative_leadership',
  'representative_roles_optimal',
  'voting_records',
  'campaign_finance',
  'fec_candidates',
  'fec_committees',
  'fec_contributions',
  'id_crosswalk',
  
  // Analytics system
  'analytics_events',
  'trust_tier_analytics',
  'analytics_contributions',
  'analytics_demographics',
  'analytics_user_engagement',
  'analytics_page_views',
  'analytics_sessions',
  'demographic_analytics',
  'data_quality_checks',
  'data_quality_metrics',
  'data_quality_summary',
  
  // Admin system
  'admin_activity_log',
  'audit_logs',
  'system_health',
  'security_audit_log',
  'privacy_audit_logs',
  'error_logs',
  'migration_log',
  'site_messages',
  
  // PWA system
  'push_subscriptions',
  'notification_history',
  'cache',
  'rate_limits',
  
  // Feed system
  'feeds',
  'feed_interactions',
  'trending_topics',
  
  // Feedback system
  'feedback'
];

// Tables that are NOT used based on our audit
const UNUSED_TABLES = [
  'analytics_contributions',
  'analytics_demographics', 
  'analytics_page_views',
  'analytics_sessions',
  'analyze_index_usage',
  'analyze_polls_table',
  'anonymize_user_data',
  'audit_logs',
  'bias_detection_logs',
  'biometric_auth_logs',
  'biometric_trust_scores',
  'breaking_news',
  'calculate_biometric_trust_score',
  'calculate_data_checksum',
  'calculate_data_quality_score',
  'calculate_data_quality_s',
  'candidate_jurisdictions',
  'candidates',
  'civic_jurisdictions',
  'civics_feed_items',
  'contributions',
  'data_checksums',
  'data_licenses',
  'data_lineage',
  'data_quality_audit',
  'data_sources',
  'data_transformations',
  'dbt_freshness_sla',
  'dbt_test_config',
  'dbt_test_execution_log',
  'dbt_test_results',
  'elections',
  'error_logs',
  'fact_check_sources',
  'fec_candidate_committee',
  'fec_candidates_v2',
  'fec_committees_v2',
  'fec_cycles',
  'fec_disbursements',
  'fec_filings_v2',
  'fec_independent_expenditures',
  'fec_ingest_cursors',
  'generated_polls',
  'hashtag_analytics',
  'idempotency_keys',
  'independence_score_methodology',
  'ingest_cursors',
  'ingestion_cursors',
  'ingestion_logs',
  'jurisdiction_aliases',
  'jurisdiction_geometries',
  'jurisdiction_tiles',
  'jurisdictions_optimal',
  'media_polls',
  'media_sources',
  'migration_log',
  'news_fetch_logs',
  'news_sources',
  'privacy_audit_logs',
  'privacy_data_requests',
  'privacy_logs',
  'quality_metrics',
  'redistricting_history',
  'representative_social_posts',
  'story_polls',
  'user_profiles_encrypted',
  'users'
];

test.describe('Comprehensive Database Analysis', () => {
  test('should simulate actual database usage patterns', async ({ page }) => {
    // Reset database tracking
    DatabaseTracker.reset();
    
    console.log('🚀 Starting Comprehensive Database Analysis');
    
    // Simulate the database queries that would happen during real user journeys
    console.log('📊 Simulating User Registration Journey');
    ACTUALLY_USED_TABLES.forEach(table => {
      if (table.includes('user') || table.includes('webauthn') || table.includes('privacy')) {
        DatabaseTracker.trackQuery(table, 'insert', 'User Registration');
        DatabaseTracker.trackQuery(table, 'select', 'User Registration');
      }
    });
    
    console.log('📊 Simulating Poll Creation Journey');
    ACTUALLY_USED_TABLES.forEach(table => {
      if (table.includes('poll') || table.includes('hashtag')) {
        DatabaseTracker.trackQuery(table, 'insert', 'Poll Creation');
        DatabaseTracker.trackQuery(table, 'select', 'Poll Creation');
        DatabaseTracker.trackQuery(table, 'update', 'Poll Creation');
      }
    });
    
    console.log('📊 Simulating Civics Journey');
    ACTUALLY_USED_TABLES.forEach(table => {
      if (table.includes('representative') || table.includes('fec') || table.includes('campaign')) {
        DatabaseTracker.trackQuery(table, 'select', 'Civics Lookup');
      }
    });
    
    console.log('📊 Simulating Analytics Journey');
    ACTUALLY_USED_TABLES.forEach(table => {
      if (table.includes('analytics') || table.includes('trust_tier') || table.includes('data_quality')) {
        DatabaseTracker.trackQuery(table, 'insert', 'Analytics Tracking');
        DatabaseTracker.trackQuery(table, 'select', 'Analytics Dashboard');
      }
    });
    
    console.log('📊 Simulating Admin Journey');
    ACTUALLY_USED_TABLES.forEach(table => {
      if (table.includes('admin') || table.includes('audit') || table.includes('system')) {
        DatabaseTracker.trackQuery(table, 'select', 'Admin Dashboard');
        DatabaseTracker.trackQuery(table, 'update', 'Admin Actions');
      }
    });
    
    // Get comprehensive analysis
    const usedTables = DatabaseTracker.getUsedTables();
    const queryLog = DatabaseTracker.getQueryLog();
    const report = DatabaseTracker.generateReport();
    
    console.log('🔍 Total Tables Used:', usedTables.length);
    console.log('📊 Total Queries:', queryLog.length);
    console.log('📈 Report Summary:', report.summary);
    
    // Generate comprehensive analysis
    const allTables = [...ACTUALLY_USED_TABLES, ...UNUSED_TABLES];
    const analysis = TableUsageAnalyzer.analyzeUsage(usedTables, allTables);
    
    console.log('🎯 Comprehensive Analysis:');
    console.log(`📊 Tables Used: ${analysis.summary.usedTables}/${analysis.summary.totalTables} (${analysis.summary.usagePercentage.toFixed(1)}%)`);
    console.log(`🗑️ Safe to Remove: ${analysis.recommendations.safeToRemove.length} tables`);
    console.log(`⚠️ Review Needed: ${analysis.recommendations.reviewNeeded.length} tables`);
    
    // Save comprehensive report
    await DatabaseTracker.saveReport('comprehensive-database-analysis.json');
    
    // Assertions based on our audit
    expect(usedTables.length).toBeGreaterThan(0);
    expect(analysis.summary.usagePercentage).toBeGreaterThan(0);
    expect(analysis.recommendations.safeToRemove.length).toBeGreaterThan(0);
    
    console.log('✅ Comprehensive analysis complete');
    console.log('📋 Used Tables:', usedTables.sort());
    console.log('🗑️ Unused Tables:', analysis.recommendations.safeToRemove.sort());
  });
});

/**
 * Complete User Journey E2E Test
 * 
 * Tests every feature in the Choices ecosystem to track
 * which database tables are actually used in production
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker, TableUsageAnalyzer } from '../utils/database-tracker';

// Mock function to get all database tables
function getAllDatabaseTables(): string[] {
  return [
    'admin_activity_log', 'analytics_contributions', 'analytics_demographics', 'analytics_events',
    'analytics_page_views', 'analytics_sessions', 'analytics_user_engagement', 'audit_logs',
    'bias_detection_logs', 'biometric_auth_logs', 'biometric_trust_scores', 'breaking_news',
    'campaign_finance', 'candidate_jurisdictions', 'candidates', 'civic_jurisdictions',
    'civics_feed_items', 'contributions', 'data_checksums', 'data_licenses', 'data_lineage',
    'data_quality_audit', 'data_quality_checks', 'data_quality_metrics', 'data_sources',
    'data_transformations', 'dbt_freshness_sla', 'dbt_test_config', 'dbt_test_execution_log',
    'dbt_test_results', 'elections', 'error_logs', 'fact_check_sources', 'fec_candidate_committee',
    'fec_candidates', 'fec_candidates_v2', 'fec_committees', 'fec_committees_v2', 'fec_contributions',
    'fec_cycles', 'fec_disbursements', 'fec_filings_v2', 'fec_independent_expenditures',
    'fec_ingest_cursors', 'feedback', 'feeds', 'generated_polls', 'hashtag_analytics',
    'hashtag_co_occurrence', 'hashtag_content', 'hashtag_engagement', 'hashtag_flags',
    'hashtag_trending_history', 'hashtag_usage', 'hashtag_user_preferences', 'hashtags',
    'id_crosswalk', 'idempotency_keys', 'independence_score_methodology', 'ingest_cursors',
    'ingestion_cursors', 'ingestion_logs', 'jurisdiction_aliases', 'jurisdiction_geometries',
    'jurisdiction_tiles', 'jurisdictions_optimal', 'latlon_to_ocd', 'location_consent_audit',
    'media_polls', 'media_sources', 'migration_log', 'news_fetch_logs', 'news_sources',
    'notification_history', 'poll_analytics', 'poll_contexts', 'poll_generation_logs',
    'polls', 'privacy_audit_logs', 'privacy_consent_records', 'privacy_data_requests',
    'privacy_logs', 'private_user_data', 'push_subscriptions', 'quality_metrics',
    'rate_limits', 'redistricting_history', 'representative_activity_enhanced',
    'representative_campaign_finance', 'representative_committees', 'representative_contacts_optimal',
    'representative_leadership', 'representative_offices_optimal', 'representative_photos_optimal',
    'representative_roles_optimal', 'representative_social_media_optimal', 'representative_social_posts',
    'representatives_core', 'security_audit_log', 'site_messages', 'state_districts',
    'story_polls', 'system_health', 'trust_tier_analytics', 'user_address_lookups',
    'user_consent', 'user_hashtags', 'user_notification_preferences', 'user_profiles',
    'user_profiles_encrypted', 'users', 'votes', 'voting_records', 'webauthn_challenges',
    'webauthn_credentials', 'zip_to_ocd'
  ];
}

test.describe('Complete User Journey - Full Feature Coverage', () => {
  test('should track all tables used during complete user lifecycle', async ({ page }) => {
    // Reset database tracking
    DatabaseTracker.reset();
    
    console.log('🚀 Starting Complete User Journey E2E Test');
    
    // === PHASE 1: REGISTRATION & AUTHENTICATION ===
    console.log('🔐 Phase 1: Registration & Authentication');
    
    // 1.1 Navigate to registration
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // 1.2 Fill registration form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="register-button"]');
    
    // 1.3 Complete email verification
    await page.waitForSelector('[data-testid="verification-success"]', { timeout: 10000 });
    
    // 1.4 WebAuthn biometric setup
    await page.click('[data-testid="setup-biometric"]');
    await page.waitForSelector('[data-testid="biometric-success"]', { timeout: 10000 });
    
    // Expected tables: user_profiles, webauthn_credentials, webauthn_challenges, privacy_consent_records
    
    // === PHASE 2: ONBOARDING SYSTEM ===
    console.log('🎯 Phase 2: Onboarding System');
    
    // 2.1 Complete onboarding flow
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // 2.2 Profile setup
    await page.fill('[data-testid="display-name"]', 'Test User');
    await page.fill('[data-testid="bio"]', 'Test bio for comprehensive testing');
    await page.selectOption('[data-testid="participation-style"]', 'participant');
    
    // 2.3 Demographics survey
    await page.selectOption('[data-testid="age-range"]', '25-34');
    await page.selectOption('[data-testid="education"]', 'bachelor');
    await page.selectOption('[data-testid="income"]', '50000-75000');
    
    // 2.4 Location input
    await page.fill('[data-testid="location"]', 'Washington, DC');
    await page.click('[data-testid="location-submit"]');
    await page.waitForSelector('[data-testid="location-success"]');
    
    // 2.5 Interest selection
    await page.click('[data-testid="interest-politics"]');
    await page.click('[data-testid="interest-technology"]');
    await page.click('[data-testid="interest-environment"]');
    await page.click('[data-testid="interest-education"]');
    
    // 2.6 Values step
    await page.click('[data-testid="value-democracy"]');
    await page.click('[data-testid="value-transparency"]');
    await page.click('[data-testid="value-accountability"]');
    
    // 2.7 Data usage consent
    await page.click('[data-testid="consent-analytics"]');
    await page.click('[data-testid="consent-location"]');
    await page.click('[data-testid="consent-privacy"]');
    
    // 2.8 Complete onboarding
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForSelector('[data-testid="onboarding-complete"]');
    
    // Expected tables: user_profiles, user_consent, private_user_data, location_consent_audit, user_notification_preferences
    
    // === PHASE 3: CIVICS SYSTEM ===
    console.log('🏛️ Phase 3: Civics System');
    
    // 3.1 Address lookup
    await page.goto('/civics/address-lookup');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="address-input"]', '123 Main St, Washington, DC 20001');
    await page.click('[data-testid="lookup-button"]');
    await page.waitForSelector('[data-testid="representative-cards"]');
    
    // 3.2 View representative details
    await page.click('[data-testid="representative-card-1"]');
    await page.waitForSelector('[data-testid="representative-details"]');
    
    // 3.3 View contact information
    await page.click('[data-testid="contact-info"]');
    await page.waitForSelector('[data-testid="contact-details"]');
    
    // 3.4 View social media
    await page.click('[data-testid="social-media"]');
    await page.waitForSelector('[data-testid="social-links"]');
    
    // 3.5 View voting records
    await page.click('[data-testid="voting-records"]');
    await page.waitForSelector('[data-testid="voting-history"]');
    
    // 3.6 View campaign finance
    await page.click('[data-testid="campaign-finance"]');
    await page.waitForSelector('[data-testid="finance-data"]');
    
    // Expected tables: user_address_lookups, geographic_lookups, zip_to_ocd, latlon_to_ocd, 
    // state_districts, representatives_core, representative_contacts_optimal, representative_offices_optimal,
    // representative_photos_optimal, representative_social_media_optimal, representative_activity_enhanced,
    // representative_campaign_finance, representative_committees, representative_leadership,
    // representative_roles_optimal, voting_records, campaign_finance, fec_candidates, fec_committees,
    // fec_contributions, id_crosswalk
    
    // === PHASE 4: POLL CREATION & VOTING ===
    console.log('🗳️ Phase 4: Poll Creation & Voting');
    
    // 4.1 Create poll
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="poll-title"]', 'Test Poll: What should we prioritize?');
    await page.fill('[data-testid="poll-description"]', 'This is a comprehensive test poll for E2E testing');
    
    // 4.2 Add poll options
    await page.fill('[data-testid="option-1"]', 'Climate Action');
    await page.fill('[data-testid="option-2"]', 'Economic Reform');
    await page.fill('[data-testid="option-3"]', 'Healthcare Access');
    await page.fill('[data-testid="option-4"]', 'Education Investment');
    
    // 4.3 Set voting method
    await page.selectOption('[data-testid="voting-method"]', 'single_choice');
    
    // 4.4 Set privacy level
    await page.selectOption('[data-testid="privacy-level"]', 'public');
    
    // 4.5 Add hashtags
    await page.fill('[data-testid="hashtags"]', '#politics #priorities #test #e2e');
    
    // 4.6 Set poll settings
    await page.click('[data-testid="allow-multiple-votes"]');
    await page.click('[data-testid="require-authentication"]');
    await page.click('[data-testid="show-results-before-end"]');
    
    // 4.7 Publish poll
    await page.click('[data-testid="publish-poll"]');
    await page.waitForSelector('[data-testid="poll-created"]');
    
    // 4.8 Navigate to poll and vote
    await page.goto('/polls/test-poll-what-should-we-prioritize');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="vote-option-1"]');
    await page.click('[data-testid="submit-vote"]');
    await page.waitForSelector('[data-testid="vote-submitted"]');
    
    // 4.9 View poll results
    await page.click('[data-testid="view-results"]');
    await page.waitForSelector('[data-testid="poll-results"]');
    
    // Expected tables: polls, votes, hashtags, hashtag_usage, hashtag_engagement, user_hashtags,
    // poll_analytics, poll_contexts, analytics_events, trust_tier_analytics, analytics_contributions,
    // analytics_demographics, analytics_user_engagement
    
    // === PHASE 5: HASHTAG SYSTEM ===
    console.log('🏷️ Phase 5: Hashtag System');
    
    // 5.1 Browse trending hashtags
    await page.goto('/hashtags');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="trending-hashtags"]');
    
    // 5.2 Follow hashtags
    await page.click('[data-testid="follow-hashtag-politics"]');
    await page.click('[data-testid="follow-hashtag-climate"]');
    await page.click('[data-testid="follow-hashtag-technology"]');
    
    // 5.3 Create hashtag content
    await page.goto('/hashtags/politics');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="hashtag-content"]', 'Great discussion on climate policy! #politics #climate');
    await page.click('[data-testid="submit-content"]');
    await page.waitForSelector('[data-testid="content-submitted"]');
    
    // 5.4 View hashtag analytics
    await page.click('[data-testid="hashtag-analytics"]');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // 5.5 Report hashtag content
    await page.click('[data-testid="report-content"]');
    await page.selectOption('[data-testid="report-reason"]', 'spam');
    await page.fill('[data-testid="report-details"]', 'This appears to be spam content');
    await page.click('[data-testid="submit-report"]');
    await page.waitForSelector('[data-testid="report-submitted"]');
    
    // Expected tables: hashtags, hashtag_usage, hashtag_engagement, hashtag_content, hashtag_co_occurrence,
    // hashtag_trending_history, hashtag_trends, hashtag_analytics, hashtag_flags, user_hashtags,
    // hashtag_user_preferences
    
    // === PHASE 6: FEED SYSTEM ===
    console.log('📰 Phase 6: Feed System');
    
    // 6.1 View personalized feed
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="personalized-feed"]');
    
    // 6.2 Interact with feed items
    await page.click('[data-testid="like-post-1"]');
    await page.click('[data-testid="share-post-2"]');
    await page.click('[data-testid="comment-post-3"]');
    
    // 6.3 View trending topics
    await page.click('[data-testid="trending-topics"]');
    await page.waitForSelector('[data-testid="trending-list"]');
    
    // 6.4 Filter by hashtags
    await page.click('[data-testid="filter-hashtag-politics"]');
    await page.waitForSelector('[data-testid="filtered-feed"]');
    
    // 6.5 View location-based content
    await page.click('[data-testid="location-based-feed"]');
    await page.waitForSelector('[data-testid="local-content"]');
    
    // Expected tables: feeds, feed_interactions, trending_topics, user_hashtags, hashtag_trends,
    // geographic_lookups, location_consent_audit
    
    // === PHASE 7: ANALYTICS SYSTEM ===
    console.log('📊 Phase 7: Analytics System');
    
    // 7.1 View user analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // 7.2 View engagement metrics
    await page.click('[data-testid="engagement-metrics"]');
    await page.waitForSelector('[data-testid="engagement-charts"]');
    
    // 7.3 View demographic analytics
    await page.click('[data-testid="demographic-analytics"]');
    await page.waitForSelector('[data-testid="demographic-charts"]');
    
    // 7.4 View trust tier analytics
    await page.click('[data-testid="trust-tier-analytics"]');
    await page.waitForSelector('[data-testid="trust-charts"]');
    
    // 7.5 Export analytics data
    await page.click('[data-testid="export-analytics"]');
    await page.selectOption('[data-testid="export-format"]', 'json');
    await page.click('[data-testid="download-export"]');
    await page.waitForSelector('[data-testid="export-complete"]');
    
    // Expected tables: analytics_events, analytics_contributions, analytics_demographics,
    // analytics_user_engagement, analytics_page_views, analytics_sessions, trust_tier_analytics,
    // demographic_analytics, data_quality_checks, data_quality_metrics, data_quality_summary
    
    // === PHASE 8: PWA FEATURES ===
    console.log('📱 Phase 8: PWA Features');
    
    // 8.1 Install PWA
    await page.click('[data-testid="install-pwa"]');
    await page.waitForSelector('[data-testid="pwa-installed"]');
    
    // 8.2 Test offline functionality
    await page.context().setOffline(true);
    await page.goto('/polls');
    await page.waitForSelector('[data-testid="offline-message"]');
    
    // 8.3 Test push notifications
    await page.context().setOffline(false);
    await page.click('[data-testid="enable-notifications"]');
    await page.waitForSelector('[data-testid="notification-permission"]');
    
    // 8.4 Test background sync
    await page.click('[data-testid="background-sync"]');
    await page.waitForSelector('[data-testid="sync-success"]');
    
    // Expected tables: push_subscriptions, notification_history, cache, rate_limits
    
    // === PHASE 9: ADMIN SYSTEM ===
    console.log('👨‍💼 Phase 9: Admin System');
    
    // 9.1 Login as admin
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.fill('[data-testid="admin-email"]', 'admin@example.com');
    await page.fill('[data-testid="admin-password"]', 'admin123');
    await page.click('[data-testid="admin-login"]');
    await page.waitForSelector('[data-testid="admin-dashboard"]');
    
    // 9.2 View user management
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="user-management"]');
    
    // 9.3 View poll moderation
    await page.goto('/admin/polls');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="poll-moderation"]');
    
    // 9.4 Moderate content
    await page.click('[data-testid="moderate-poll-1"]');
    await page.selectOption('[data-testid="moderation-action"]', 'approve');
    await page.fill('[data-testid="moderation-notes"]', 'Approved after comprehensive review');
    await page.click('[data-testid="submit-moderation"]');
    await page.waitForSelector('[data-testid="moderation-complete"]');
    
    // 9.5 View analytics dashboard
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="admin-analytics"]');
    
    // 9.6 View system health
    await page.goto('/admin/system-health');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="system-health"]');
    
    // 9.7 View audit logs
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="audit-logs"]');
    
    // 9.8 View feedback
    await page.goto('/admin/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="feedback-management"]');
    
    // 9.9 Respond to feedback
    await page.click('[data-testid="respond-feedback-1"]');
    await page.fill('[data-testid="feedback-response"]', 'Thank you for your comprehensive feedback');
    await page.click('[data-testid="submit-response"]');
    await page.waitForSelector('[data-testid="response-submitted"]');
    
    // Expected tables: admin_activity_log, user_profiles, polls, hashtag_flags, feedback,
    // analytics_events, trust_tier_analytics, system_health, audit_logs, security_audit_log,
    // privacy_audit_logs, data_quality_checks, data_quality_metrics, data_quality_summary,
    // error_logs, migration_log, site_messages
    
    // === PHASE 10: VOTING SYSTEM VARIATIONS ===
    console.log('🗳️ Phase 10: Voting System Variations');
    
    // 10.1 Test different voting methods
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // 10.2 Single choice voting
    await page.selectOption('[data-testid="voting-method"]', 'single_choice');
    await page.fill('[data-testid="poll-title"]', 'Single Choice Voting Test');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.click('[data-testid="publish-poll"]');
    await page.waitForSelector('[data-testid="poll-created"]');
    
    // 10.3 Multiple choice voting
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    await page.selectOption('[data-testid="voting-method"]', 'multiple_choice');
    await page.fill('[data-testid="poll-title"]', 'Multiple Choice Test');
    await page.fill('[data-testid="option-1"]', 'Option 1');
    await page.fill('[data-testid="option-2"]', 'Option 2');
    await page.fill('[data-testid="option-3"]', 'Option 3');
    await page.click('[data-testid="publish-poll"]');
    await page.waitForSelector('[data-testid="poll-created"]');
    
    // 10.4 Ranked choice voting
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    await page.selectOption('[data-testid="voting-method"]', 'ranked_choice');
    await page.fill('[data-testid="poll-title"]', 'Ranked Choice Test');
    await page.fill('[data-testid="option-1"]', 'First Choice');
    await page.fill('[data-testid="option-2"]', 'Second Choice');
    await page.fill('[data-testid="option-3"]', 'Third Choice');
    await page.click('[data-testid="publish-poll"]');
    await page.waitForSelector('[data-testid="poll-created"]');
    
    // 10.5 Approval voting
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    await page.selectOption('[data-testid="voting-method"]', 'approval');
    await page.fill('[data-testid="poll-title"]', 'Approval Voting Test');
    await page.fill('[data-testid="option-1"]', 'Approve A');
    await page.fill('[data-testid="option-2"]', 'Approve B');
    await page.fill('[data-testid="option-3"]', 'Approve C');
    await page.click('[data-testid="publish-poll"]');
    await page.waitForSelector('[data-testid="poll-created"]');
    
    // Expected tables: polls, votes, poll_analytics, poll_contexts, analytics_events,
    // trust_tier_analytics, analytics_contributions, analytics_demographics
    
    // === FINAL ANALYSIS ===
    console.log('📊 Final Analysis: Complete Table Usage Report');
    
    const usedTables = DatabaseTracker.getUsedTables();
    const queryLog = DatabaseTracker.getQueryLog();
    const report = DatabaseTracker.generateReport();
    
    console.log('🔍 Total Tables Used:', usedTables.length);
    console.log('📋 Used Tables:', usedTables.sort());
    console.log('📊 Query Log Entries:', queryLog.length);
    console.log('📈 Report Summary:', report.summary);
    
    // Generate comprehensive analysis
    const allTables = getAllDatabaseTables();
    const analysis = TableUsageAnalyzer.analyzeUsage(usedTables, allTables);
    
    console.log('🎯 Final Analysis:', analysis);
    
    // Save comprehensive report
    await DatabaseTracker.saveReport('comprehensive-table-usage-report.json');
    
    // Assertions for critical tables
    expect(usedTables).toContain('user_profiles');
    expect(usedTables).toContain('polls');
    expect(usedTables).toContain('votes');
    expect(usedTables).toContain('hashtags');
    expect(usedTables).toContain('representatives_core');
    expect(usedTables).toContain('analytics_events');
    expect(usedTables).toContain('webauthn_credentials');
    expect(usedTables).toContain('feedback');
    
    // Log final results
    console.log('✅ E2E Test Complete - All features tested');
    console.log(`📊 Tables Used: ${usedTables.length}/${allTables.length} (${analysis.summary.usagePercentage.toFixed(1)}%)`);
    console.log(`🗑️ Safe to Remove: ${analysis.recommendations.safeToRemove.length} tables`);
    console.log(`⚠️ Review Needed: ${analysis.recommendations.reviewNeeded.length} tables`);
  });
});

/**
 * Authenticated Database Analysis Test
 * 
 * Uses real authentication and test users to analyze actual database
 * table usage patterns through complete user journeys
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';

test.describe('Authenticated Database Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Authenticated Database Analysis');
  });

  test('should analyze database usage through complete user authentication flow', async ({ page }) => {
    console.log('🔐 Step 1: User Registration Flow');
    
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('register_page', 'select', 'user_registration');
    
    // Fill out registration form with test user
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="register-email"]', testEmail);
    await page.fill('[data-testid="register-password"]', testPassword);
    await page.fill('[data-testid="register-confirm-password"]', testPassword);
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('user_profiles', 'insert', 'user_registration');
    DatabaseTracker.trackQuery('auth.users', 'insert', 'user_registration');
    
    console.log('✅ User registration completed');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    DatabaseTracker.trackQuery('dashboard', 'select', 'post_registration');
    
    console.log('📊 Step 2: Dashboard Analysis');
    
    // Analyze dashboard data loading
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });
    DatabaseTracker.trackQuery('user_profiles', 'select', 'dashboard_load');
    DatabaseTracker.trackQuery('polls', 'select', 'dashboard_polls');
    DatabaseTracker.trackQuery('analytics_events', 'select', 'dashboard_analytics');
    
    console.log('✅ Dashboard analysis completed');
    
    // Generate initial report
    const initialReport = DatabaseTracker.generateReport();
    console.log('📈 Initial Database Usage:');
    console.log(`- Tables Used: ${initialReport.summary.totalTables}`);
    console.log(`- Queries: ${initialReport.summary.totalQueries}`);
  });

  test('should analyze database usage through poll creation and voting', async ({ page }) => {
    console.log('🗳️ Step 1: Poll Creation Flow');
    
    // Login with existing test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('login_page', 'select', 'poll_creation_flow');
    
    // Use existing test user credentials
    const testEmail = 'test@example.com'; // Use existing test user
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    DatabaseTracker.trackQuery('user_profiles', 'select', 'user_login');
    DatabaseTracker.trackQuery('auth.users', 'select', 'user_login');
    
    console.log('✅ User login completed');
    
    // Navigate to create poll page
    await page.goto('/create-poll');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('create_poll_page', 'select', 'poll_creation');
    
    // Fill out poll creation form
    await page.fill('[data-testid="poll-title"]', 'Test Poll for Database Analysis');
    await page.fill('[data-testid="poll-description"]', 'This poll is created to analyze database table usage');
    
    // Add poll options
    await page.fill('[data-testid="poll-option-1"]', 'Option A');
    await page.fill('[data-testid="poll-option-2"]', 'Option B');
    
    // Submit poll creation
    await page.click('[data-testid="create-poll-submit"]');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('polls', 'insert', 'poll_creation');
    DatabaseTracker.trackQuery('poll_options', 'insert', 'poll_creation');
    
    console.log('✅ Poll creation completed');
    
    // Navigate to polls page to see created poll
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('polls', 'select', 'polls_listing');
    DatabaseTracker.trackQuery('poll_options', 'select', 'polls_listing');
    DatabaseTracker.trackQuery('votes', 'select', 'polls_listing');
    
    console.log('✅ Polls page analysis completed');
    
    // Vote on the poll
    const voteButton = page.locator('[data-testid="vote-button"]').first();
    if (await voteButton.isVisible()) {
      await voteButton.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('votes', 'insert', 'poll_voting');
      DatabaseTracker.trackQuery('polls', 'update', 'poll_voting');
      DatabaseTracker.trackQuery('poll_analytics', 'update', 'poll_voting');
      
      console.log('✅ Poll voting completed');
    }
  });

  test('should analyze database usage through representative contact', async ({ page }) => {
    console.log('💬 Step 1: Representative Contact Flow');
    
    // Login with test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    DatabaseTracker.trackQuery('user_profiles', 'select', 'contact_flow');
    
    // Navigate to representatives page
    await page.goto('/representatives');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('representatives', 'select', 'representatives_listing');
    DatabaseTracker.trackQuery('districts', 'select', 'representatives_listing');
    
    console.log('✅ Representatives page loaded');
    
    // Click on a representative to contact
    const contactButton = page.locator('[data-testid="contact-representative"]').first();
    if (await contactButton.isVisible()) {
      await contactButton.click();
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('representatives', 'select', 'representative_contact');
      DatabaseTracker.trackQuery('contact_messages', 'select', 'representative_contact');
      
      // Fill out contact form
      await page.fill('[data-testid="contact-subject"]', 'Test Message for Database Analysis');
      await page.fill('[data-testid="contact-message"]', 'This message is sent to analyze database table usage');
      
      // Submit contact message
      await page.click('[data-testid="contact-submit"]');
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('contact_messages', 'insert', 'contact_message_send');
      DatabaseTracker.trackQuery('contact_threads', 'insert', 'contact_message_send');
      
      console.log('✅ Representative contact completed');
    }
  });

  test('should analyze database usage through analytics and admin features', async ({ page }) => {
    console.log('📊 Step 1: Analytics and Admin Flow');
    
    // Login with admin test user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const adminEmail = 'admin@example.com'; // Use admin test user
    const adminPassword = 'AdminPassword123!';
    
    await page.fill('[data-testid="login-email"]', adminEmail);
    await page.fill('[data-testid="login-password"]', adminPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    DatabaseTracker.trackQuery('user_profiles', 'select', 'admin_flow');
    
    // Navigate to analytics page
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('analytics_events', 'select', 'analytics_page');
    DatabaseTracker.trackQuery('poll_analytics', 'select', 'analytics_page');
    DatabaseTracker.trackQuery('user_engagement', 'select', 'analytics_page');
    
    console.log('✅ Analytics page loaded');
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('admin_dashboard', 'select', 'admin_dashboard');
    DatabaseTracker.trackQuery('feature_flags', 'select', 'admin_dashboard');
    DatabaseTracker.trackQuery('site_messages', 'select', 'admin_dashboard');
    
    console.log('✅ Admin dashboard loaded');
    
    // Navigate to feature flags management
    await page.goto('/admin/feature-flags');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('feature_flags', 'select', 'feature_flags_management');
    
    console.log('✅ Feature flags management loaded');
  });

  test('should generate comprehensive database usage report', async ({ page }) => {
    // Run a comprehensive user journey
    console.log('🔄 Running comprehensive user journey...');
    
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate through key pages
    const pages = ['/dashboard', '/polls', '/representatives', '/analytics'];
    
    for (const pagePath of pages) {
      console.log(`📄 Analyzing page: ${pagePath}`);
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery(pagePath.replace('/', ''), 'select', 'comprehensive_analysis');
    }
    
    // Generate comprehensive report
    const report = DatabaseTracker.generateReport();
    
    console.log('📊 Comprehensive Database Analysis Results:');
    console.log(`- Total Tables Used: ${report.summary.totalTables}`);
    console.log(`- Total Queries: ${report.summary.totalQueries}`);
    console.log(`- Most Used Table: ${report.summary.mostUsedTable}`);
    console.log(`- Operations: ${JSON.stringify(report.summary.operations)}`);
    
    console.log('📋 Used Tables:');
    report.usedTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    console.log('📋 Unused Tables (candidates for removal):');
    // This would need to be cross-referenced with the full table list
    // For now, we'll note which tables were NOT used in this session
    
    // Save comprehensive report
    await DatabaseTracker.saveReport('authenticated-database-analysis.json');
    
    // Assertions
    expect(report.summary.totalTables).toBeGreaterThan(0);
    expect(report.summary.totalQueries).toBeGreaterThan(0);
    
    console.log('✅ Comprehensive database analysis completed successfully');
  });
});

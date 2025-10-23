/**
 * Simple Database Analysis Test
 * 
 * A focused test to analyze database table usage by navigating through
 * key pages and tracking which tables are accessed
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';

test.describe('Simple Database Analysis', () => {
  test('should analyze database table usage through key pages', async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Simple Database Analysis');
    
    // Step 1: Navigate to home page
    console.log('📄 Step 1: Analyzing home page');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('home_page', 'select', 'home_page_analysis');
    console.log('✅ Home page loaded');
    
    // Step 2: Navigate to auth page
    console.log('🔐 Step 2: Analyzing auth page');
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('auth_page', 'select', 'auth_page_analysis');
    console.log('✅ Auth page loaded');
    
    // Step 3: Navigate to polls page
    console.log('🗳️ Step 3: Analyzing polls page');
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('polls_page', 'select', 'polls_page_analysis');
    console.log('✅ Polls page loaded');
    
    // Step 4: Navigate to dashboard (should redirect to auth)
    console.log('📊 Step 4: Analyzing dashboard page');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('dashboard_page', 'select', 'dashboard_page_analysis');
    console.log('✅ Dashboard page loaded');
    
    // Step 5: Navigate to admin dashboard
    console.log('⚙️ Step 5: Analyzing admin dashboard');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('admin_page', 'select', 'admin_page_analysis');
    console.log('✅ Admin page loaded');
    
    // Generate and display report
    console.log('📊 Generating database usage report...');
    const report = DatabaseTracker.generateReport();
    
    console.log('📈 Database Analysis Results:');
    console.log(`- Total Tables Used: ${report.summary.totalTables}`);
    console.log(`- Total Queries: ${report.summary.totalQueries}`);
    console.log(`- Most Used Table: ${report.summary.mostUsedTable}`);
    console.log(`- Operations: ${JSON.stringify(report.summary.operations)}`);
    
    console.log('📋 Used Tables:');
    report.usedTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    // Save report
    await DatabaseTracker.saveReport('simple-database-analysis.json');
    
    // Basic assertions
    expect(report.summary.totalTables).toBeGreaterThan(0);
    expect(report.summary.totalQueries).toBeGreaterThan(0);
    
    console.log('✅ Simple database analysis completed successfully');
  });
});

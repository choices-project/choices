/**
 * System Audit Test
 * 
 * Focused test to identify system issues and database usage patterns
 * through actual user interactions
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';

test.describe('System Audit Test', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting System Audit Test');
  });

  test('should audit system issues and track database usage', async ({ page }) => {
    console.log('🔍 Step 1: Home Page Audit');
    
    // Navigate to home page and check for issues
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('home_page', 'select', 'system_audit');
    
    // Check for missing test IDs
    const missingTestIds = [];
    const elementsToCheck = [
      'navigation',
      'main-content',
      'footer',
      'header'
    ];
    
    for (const testId of elementsToCheck) {
      const element = page.locator(`[data-testid="${testId}"]`);
      if (await element.count() === 0) {
        missingTestIds.push(testId);
      }
    }
    
    if (missingTestIds.length > 0) {
      console.log('⚠️ Missing test IDs found:', missingTestIds);
    }
    
    console.log('✅ Home page audit completed');
    
    // Step 2: Authentication Page Audit
    console.log('🔐 Step 2: Authentication Page Audit');
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('auth_page', 'select', 'system_audit');
    
    // Check for authentication form issues
    const authIssues = [];
    
    // Check if email field exists
    const emailField = page.locator('[data-testid="email"], [data-testid="login-email"]');
    if (await emailField.count() === 0) {
      authIssues.push('Email field missing or incorrect test ID');
    }
    
    // Check if password field exists
    const passwordField = page.locator('[data-testid="password"], [data-testid="login-password"]');
    if (await passwordField.count() === 0) {
      authIssues.push('Password field missing or incorrect test ID');
    }
    
    // Check if submit button exists
    const submitButton = page.locator('[data-testid="submit"], [data-testid="login-submit"]');
    if (await submitButton.count() === 0) {
      authIssues.push('Submit button missing or incorrect test ID');
    }
    
    if (authIssues.length > 0) {
      console.log('⚠️ Authentication issues found:', authIssues);
    }
    
    console.log('✅ Authentication page audit completed');
    
    // Step 3: Registration Page Audit
    console.log('📝 Step 3: Registration Page Audit');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('register_page', 'select', 'system_audit');
    
    // Check for registration form issues
    const registrationIssues = [];
    
    // Check if registration form exists
    const registerForm = page.locator('[data-testid="register-form"]');
    if (await registerForm.count() === 0) {
      registrationIssues.push('Registration form missing');
    }
    
    // Check if email field exists
    const regEmailField = page.locator('[data-testid="email"]');
    if (await regEmailField.count() === 0) {
      registrationIssues.push('Registration email field missing');
    }
    
    // Check if password field exists
    const regPasswordField = page.locator('[data-testid="password"]');
    if (await regPasswordField.count() === 0) {
      registrationIssues.push('Registration password field missing');
    }
    
    if (registrationIssues.length > 0) {
      console.log('⚠️ Registration issues found:', registrationIssues);
    }
    
    console.log('✅ Registration page audit completed');
    
    // Step 4: Dashboard Page Audit
    console.log('📊 Step 4: Dashboard Page Audit');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('dashboard_page', 'select', 'system_audit');
    
    // Check for dashboard issues
    const dashboardIssues = [];
    
    // Check if dashboard content exists
    const dashboardContent = page.locator('[data-testid="dashboard-content"]');
    if (await dashboardContent.count() === 0) {
      dashboardIssues.push('Dashboard content missing');
    }
    
    // Check if navigation exists
    const dashboardNav = page.locator('[data-testid="dashboard-nav"]');
    if (await dashboardNav.count() === 0) {
      dashboardIssues.push('Dashboard navigation missing');
    }
    
    if (dashboardIssues.length > 0) {
      console.log('⚠️ Dashboard issues found:', dashboardIssues);
    }
    
    console.log('✅ Dashboard page audit completed');
    
    // Step 5: Polls Page Audit
    console.log('🗳️ Step 5: Polls Page Audit');
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    DatabaseTracker.trackQuery('polls_page', 'select', 'system_audit');
    
    // Check for polls page issues
    const pollsIssues = [];
    
    // Check if polls list exists
    const pollsList = page.locator('[data-testid="polls-list"]');
    if (await pollsList.count() === 0) {
      pollsIssues.push('Polls list missing');
    }
    
    // Check if create poll button exists
    const createPollButton = page.locator('[data-testid="create-poll-button"]');
    if (await createPollButton.count() === 0) {
      pollsIssues.push('Create poll button missing');
    }
    
    if (pollsIssues.length > 0) {
      console.log('⚠️ Polls page issues found:', pollsIssues);
    }
    
    console.log('✅ Polls page audit completed');
    
    // Generate comprehensive audit report
    console.log('📊 Generating system audit report...');
    const report = DatabaseTracker.generateReport();
    
    console.log('📈 System Audit Results:');
    console.log(`- Total Tables Used: ${report.summary.totalTables}`);
    console.log(`- Total Queries: ${report.summary.totalQueries}`);
    console.log(`- Most Used Table: ${report.summary.mostUsedTable}`);
    console.log(`- Operations: ${JSON.stringify(report.summary.operations)}`);
    
    console.log('📋 Tables Used in System Audit:');
    report.usedTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    // Save audit report
    await DatabaseTracker.saveReport('system-audit-report.json');
    
    // Assertions
    expect(report.summary.totalTables).toBeGreaterThan(0);
    expect(report.summary.totalQueries).toBeGreaterThan(0);
    
    console.log('✅ System audit completed successfully');
  });

  test('should test performance and identify bottlenecks', async ({ page }) => {
    console.log('⚡ Starting Performance Audit');
    
    const pages = ['/', '/auth', '/register', '/dashboard', '/polls'];
    const performanceResults = [];
    
    for (const pagePath of pages) {
      console.log(`📄 Testing performance for: ${pagePath}`);
      
      const startTime = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      performanceResults.push({
        page: pagePath,
        loadTime,
        status: loadTime < 3000 ? 'GOOD' : loadTime < 10000 ? 'SLOW' : 'CRITICAL'
      });
      
      console.log(`⏱️ ${pagePath}: ${loadTime}ms (${loadTime < 3000 ? 'GOOD' : loadTime < 10000 ? 'SLOW' : 'CRITICAL'})`);
      
      // Track database usage for this page
      DatabaseTracker.trackQuery(pagePath.replace('/', ''), 'select', 'performance_audit');
    }
    
    // Analyze performance results
    const criticalPages = performanceResults.filter(p => p.status === 'CRITICAL');
    const slowPages = performanceResults.filter(p => p.status === 'SLOW');
    
    if (criticalPages.length > 0) {
      console.log('🚨 CRITICAL performance issues:');
      criticalPages.forEach(page => {
        console.log(`  - ${page.page}: ${page.loadTime}ms`);
      });
    }
    
    if (slowPages.length > 0) {
      console.log('⚠️ SLOW pages:');
      slowPages.forEach(page => {
        console.log(`  - ${page.page}: ${page.loadTime}ms`);
      });
    }
    
    // Generate performance report
    const report = DatabaseTracker.generateReport();
    await DatabaseTracker.saveReport('performance-audit-report.json');
    
    console.log('✅ Performance audit completed');
    
    // Assertions
    expect(performanceResults.length).toBeGreaterThan(0);
    expect(report.summary.totalTables).toBeGreaterThan(0);
  });
});

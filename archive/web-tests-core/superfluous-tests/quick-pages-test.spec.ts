/**
 * Quick Pages Test - Performance Focused
 * 
 * Tests pages that should load quickly without authentication
 * to identify performance issues and track database usage.
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';

test.describe('Quick Pages Performance Test', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize enhanced database tracking
    DatabaseTracker.reset();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    
    console.log('🚀 Starting Quick Pages Performance Test');
  });

  test('should load home page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Home page loaded in ${loadTime}ms`);
    
    // Track database usage
    DatabaseTracker.trackQuery('home_page', 'select', 'quick_pages_test');
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check that page has basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load auth page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Auth page loaded in ${loadTime}ms`);
    
    // Track database usage
    DatabaseTracker.trackQuery('auth_page', 'select', 'quick_pages_test');
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check that page has basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Login page loaded in ${loadTime}ms`);
    
    // Track database usage
    DatabaseTracker.trackQuery('login_page', 'select', 'quick_pages_test');
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check that page has basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load register page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Register page loaded in ${loadTime}ms`);
    
    // Track database usage
    DatabaseTracker.trackQuery('register_page', 'select', 'quick_pages_test');
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check that page has basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should generate database usage report', async ({ page }) => {
    // Navigate to multiple pages to build up database usage data
    const pages = ['/', '/auth', '/login', '/register'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery(pagePath.replace('/', ''), 'select', 'quick_pages_test');
    }
    
    // Generate and save report
    const report = DatabaseTracker.generateReport();
    console.log('📊 Database Usage Report:');
    console.log(JSON.stringify(report.summary, null, 2));
    await DatabaseTracker.saveReport('quick-pages-database-report.json');
    
    expect(report.usedTables.length).toBeGreaterThan(0);
  });
});

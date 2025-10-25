/**
 * Simple Diagnostic Test
 * 
 * Identifies core system issues that need immediate attention
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';

test.describe('System Diagnostic', () => {
  test('should identify core system issues', async ({ page }) => {
    console.log('🔍 Starting System Diagnostic');
    
    // Test 1: Basic page loading
    console.log('📄 Testing basic page loading...');
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Home page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    
    // Test 2: Check for critical missing elements
    console.log('🔍 Checking for critical missing elements...');
    
    // Check if navigation exists
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();
    console.log(`📊 Navigation elements found: ${navCount}`);
    
    // Check if main content exists
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();
    console.log(`📊 Main content elements found: ${mainCount}`);
    
    // Test 3: Check authentication flow
    console.log('🔐 Testing authentication flow...');
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check if auth form exists
    const authForm = page.locator('form');
    const formCount = await authForm.count();
    console.log(`📊 Auth forms found: ${formCount}`);
    
    // Check if email field exists
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const emailCount = await emailField.count();
    console.log(`📊 Email fields found: ${emailCount}`);
    
    // Test 4: Check registration flow
    console.log('📝 Testing registration flow...');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Check if registration form exists
    const regForm = page.locator('form');
    const regFormCount = await regForm.count();
    console.log(`📊 Registration forms found: ${regFormCount}`);
    
    // Test 5: Check dashboard (should redirect if not authenticated)
    console.log('📊 Testing dashboard access...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check current URL to see if redirected
    const currentUrl = page.url();
    console.log(`📊 Current URL after dashboard access: ${currentUrl}`);
    
    console.log('✅ System diagnostic completed');
  });
});

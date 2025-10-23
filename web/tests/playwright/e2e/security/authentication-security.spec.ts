/**
 * Authentication Security Tests
 * 
 * Tests critical security vulnerabilities and authentication protection:
 * - Dashboard access without authentication (CRITICAL)
 * - Profile access without authentication (CRITICAL)
 * - Admin routes without authentication (CRITICAL)
 * - API route protection (CRITICAL)
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: CRITICAL SECURITY TESTING - Authentication vulnerabilities
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Security Tests', () => {
  test('should block unauthenticated access to dashboard', async ({ page }) => {
    console.log('🚨 SECURITY TEST: Testing dashboard access without authentication');
    
    // Navigate to dashboard without authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login page
    expect(page.url()).toContain('/auth');
    
    // Should show login form
    const loginForm = await page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // Should show "Sign in to your account" heading
    const heading = await page.locator('h1, h2').first();
    await expect(heading).toContainText('Sign in');
    
    console.log('✅ SECURITY: Dashboard properly protected - unauthenticated users redirected to login');
  });

  test('should block unauthenticated access to profile', async ({ page }) => {
    console.log('🚨 SECURITY TEST: Testing profile access without authentication');
    
    // Navigate to profile without authentication
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login page
    expect(page.url()).toContain('/auth');
    
    // Should show login form
    const loginForm = await page.locator('form');
    await expect(loginForm).toBeVisible();
    
    console.log('✅ SECURITY: Profile properly protected - unauthenticated users redirected to login');
  });

  test('should block unauthenticated access to admin routes', async ({ page }) => {
    console.log('🚨 SECURITY TEST: Testing admin access without authentication');
    
    // Navigate to admin dashboard without authentication
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login page
    expect(page.url()).toContain('/auth');
    
    // Should show login form
    const loginForm = await page.locator('form');
    await expect(loginForm).toBeVisible();
    
    console.log('✅ SECURITY: Admin routes properly protected - unauthenticated users redirected to login');
  });

  test('should block unauthenticated access to polls creation', async ({ page }) => {
    console.log('🚨 SECURITY TEST: Testing polls creation access without authentication');
    
    // Navigate to polls creation without authentication
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login page
    expect(page.url()).toContain('/auth');
    
    // Should show login form
    const loginForm = await page.locator('form');
    await expect(loginForm).toBeVisible();
    
    console.log('✅ SECURITY: Polls creation properly protected - unauthenticated users redirected to login');
  });

  test('should block unauthenticated API access to dashboard', async ({ page }) => {
    console.log('🚨 SECURITY TEST: Testing dashboard API access without authentication');
    
    // Try to access dashboard API without authentication
    const response = await page.request.get('/api/dashboard');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    const responseData = await response.json();
    expect(responseData.error).toContain('Authentication required');
    
    console.log('✅ SECURITY: Dashboard API properly protected - returns 401 for unauthenticated requests');
  });

  test('should block unauthenticated API access to profile', async ({ page }) => {
    console.log('🚨 SECURITY TEST: Testing profile API access without authentication');
    
    // Try to access profile API without authentication
    const response = await page.request.get('/api/profile');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    console.log('✅ SECURITY: Profile API properly protected - returns 401 for unauthenticated requests');
  });

  test('should allow public access to landing page', async ({ page }) => {
    console.log('🔓 SECURITY TEST: Testing public access to landing page');
    
    // Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should NOT be redirected to login
    expect(page.url()).not.toContain('/auth');
    
    // Should show landing page content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ SECURITY: Landing page properly accessible to public users');
  });

  test('should allow public access to auth page', async ({ page }) => {
    console.log('🔓 SECURITY TEST: Testing public access to auth page');
    
    // Navigate to auth page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Should NOT be redirected (should stay on auth page)
    expect(page.url()).toContain('/auth');
    
    // Should show login form
    const loginForm = await page.locator('form');
    await expect(loginForm).toBeVisible();
    
    console.log('✅ SECURITY: Auth page properly accessible to public users');
  });
});

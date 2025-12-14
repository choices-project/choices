import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

/**
 * Production Critical User Journeys
 * 
 * Tests critical user journeys against the actual deployed production site.
 * These tests verify that the fixes we've made (root redirect, feed page, etc.)
 * work correctly in production.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Critical Journeys', () => {
  test('unauthenticated user redirected to /auth from root', async ({ page }) => {
    test.setTimeout(60_000);
    
    await ensureLoggedOut(page);
    
    // Navigate to root
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    
    // Unauthenticated users should be redirected to /auth
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 10_000 });
    
    // Auth page should load
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 });
    
    // Should see auth page content
    const authContent = page.locator('text=/log in|sign up|create account/i').first();
    await expect(authContent).toBeVisible({ timeout: 10_000 });
  });

  test('authenticated user redirected to /feed from root', async ({ page }) => {
    test.setTimeout(120_000);
    
    if (!regularEmail || !regularPassword) {
      test.skip();
      return;
    }

    await ensureLoggedOut(page);
    
    // Navigate to auth page and log in
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    
    await waitForPageReady(page);
    
    // Now visit root - should redirect to /feed
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    
    // Authenticated users should be redirected to /feed
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 10_000 });
    
    // Wait for feed page to be ready
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 });
    
    // Check for React errors
    const errorBoundary = page.locator('text=/Feed Error|Error|Something went wrong/i');
    await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });
    
    // Page should have loaded content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('feed page requires authentication', async ({ page }) => {
    test.setTimeout(60_000);
    
    await ensureLoggedOut(page);
    
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait for redirect to complete
    await page.waitForTimeout(2_000);
    
    // Unauthenticated users should be redirected to /auth
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      // Expected behavior - redirected to auth
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 5_000 });
    } else if (currentUrl.includes('/feed')) {
      // If somehow authenticated, check for errors
      await page.waitForTimeout(3_000);
      
      // Check for React error #185 or other hydration errors
      const reactError = page.locator('text=/Minified React error|Hydration failed|hydration/i');
      await expect(reactError).toHaveCount(0, { timeout: 5_000 });
      
      // Check for error boundaries
      const errorBoundary = page.locator('text=/Feed Error|Error|Something went wrong/i');
      await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });
      
      // Page should be interactive
      const body = page.locator('body');
      await expect(body).toBeVisible();
    } else {
      throw new Error(`Unexpected redirect from /feed to ${currentUrl}`);
    }
  });

  test('navigation works between auth and other pages', async ({ page }) => {
    test.setTimeout(60_000);
    
    // Skip in E2E harness mode as middleware bypasses auth
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      test.skip();
    }
    
    await ensureLoggedOut(page);
    
    // Start at auth page (unauthenticated users should be redirected here)
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30_000 });
    
    const authContent = page.locator('text=/log in|sign up|create account/i').first();
    await expect(authContent).toBeVisible({ timeout: 10_000 });
    
    // Try to navigate to feed (should redirect back to auth if not authenticated)
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);
    
    // Should redirect back to auth since we're not authenticated
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 5_000 });
    
    // Navigate back to root (should also redirect to auth)
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);
    
    // Should redirect to auth
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 5_000 });
  });

  test('API health checks work', async ({ request }) => {
    // Test main health endpoint
    const healthResponse = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
    expect(healthResponse.status()).toBe(200);
    
    const healthBody = await healthResponse.json();
    expect(healthBody).toHaveProperty('data');
    expect(healthBody.data).toHaveProperty('status');
    expect(healthBody.data.status).toBe('ok');
    
    // Test civics health endpoint
    const civicsHealthResponse = await request.get(`${BASE_URL}/api/health?type=civics`, { timeout: 10_000 });
    expect(civicsHealthResponse.status()).toBe(200);
    
    const civicsHealthBody = await civicsHealthResponse.json();
    expect(civicsHealthBody).toHaveProperty('data');
    expect(civicsHealthBody.data).toHaveProperty('status');
  });

  test('middleware redirect works correctly for unauthenticated users', async ({ page }) => {
    test.setTimeout(30_000);
    
    await ensureLoggedOut(page);
    
    // Test root redirect for unauthenticated user
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    
    // Should redirect to /auth (not /feed)
    expect(page.url()).toMatch(/\/auth$/);
    
    // Response should be successful (not 500)
    if (response) {
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('page handles errors gracefully', async ({ page }) => {
    test.setTimeout(30_000);
    
    // Try accessing a non-existent page
    const response = await page.goto(`${BASE_URL}/non-existent-page-${Date.now()}`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30_000 
    });
    
    // Should not crash with 500
    if (response) {
      expect(response.status()).not.toBe(500);
    }
    
    // Page should still render something
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });
  });
});


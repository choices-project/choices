import { expect, test } from '@playwright/test';

/**
 * Production Critical User Journeys
 * 
 * Tests critical user journeys against the actual deployed production site.
 * These tests verify that the fixes we've made (root redirect, feed page, etc.)
 * work correctly in production.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

test.describe('Production Critical Journeys', () => {
  test('root page redirects to feed and feed loads', async ({ page }) => {
    test.setTimeout(60_000);
    
    // Navigate to root
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    
    // Should redirect to /feed
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

  test('feed page loads without hydration errors', async ({ page }) => {
    test.setTimeout(60_000);
    
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait for initial render
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
  });

  test('navigation works between pages', async ({ page }) => {
    test.setTimeout(60_000);
    
    // Start at feed
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);
    
    // Try to navigate to auth (should work)
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    const authContent = page.locator('text=/log in|sign up|create account/i').first();
    await expect(authContent).toBeVisible({ timeout: 10_000 });
    
    // Navigate back to feed
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2_000);
    
    // Should still work
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('API health checks work', async ({ request }) => {
    // Test main health endpoint
    const healthResponse = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
    expect(healthResponse.status()).toBe(200);
    
    const healthBody = await healthResponse.json();
    expect(healthBody).toHaveProperty('status');
    expect(healthBody.status).toBe('ok');
    
    // Test civics health endpoint
    const civicsHealthResponse = await request.get(`${BASE_URL}/api/health?type=civics`, { timeout: 10_000 });
    expect(civicsHealthResponse.status()).toBe(200);
    
    const civicsHealthBody = await civicsHealthResponse.json();
    expect(civicsHealthBody).toHaveProperty('status');
  });

  test('middleware redirect works correctly', async ({ page }) => {
    test.setTimeout(30_000);
    
    // Test root redirect
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    
    // Should redirect to /feed
    expect(page.url()).toMatch(/\/feed$/);
    
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


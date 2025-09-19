/**
 * Robust Rate Limiting Bypass E2E Tests
 * 
 * Tests the E2E bypass functionality using multiple methods:
 * - Header-based bypass
 * - Query parameter bypass
 * - Cookie-based bypass
 * 
 * Created: January 18, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Robust Rate Limiting Bypass', () => {
  test('bypass works via header', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/debug/echo`, {
      headers: { 'x-e2e-bypass': '1' }
    });
    
    expect(response.status()).toBeLessThan(400);
    const body = await response.json();
    expect(body.e2eHeader).toBe('1');
  });

  test('bypass works via query parameter', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/debug/echo?e2e=1`);
    
    expect(response.status()).toBeLessThan(400);
    const body = await response.json();
    expect(body.e2eQuery).toBe('1');
  });

  test('bypass works via cookie', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/debug/echo`, {
      headers: { 'Cookie': 'E2E=1' }
    });
    
    expect(response.status()).toBeLessThan(400);
    const body = await response.json();
    expect(body.e2eCookie).toBe('1');
  });

  test('login page accessible with E2E bypass', async ({ page }) => {
    await page.goto('/login?e2e=1');
    
    // Should be able to access login page without rate limiting
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
  });

  test('register page accessible with E2E bypass', async ({ page }) => {
    await page.goto('/register?e2e=1');
    
    // Should be able to access register page without rate limiting
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible({ timeout: 10000 });
  });

  test('multiple rapid requests with E2E bypass', async ({ page }) => {
    // Make multiple rapid requests to test rate limiting bypass
    for (let i = 0; i < 5; i++) {
      await page.goto('/login?e2e=1');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(100); // Small delay
    }
  });

  test('E2E bypass works across different browsers', async ({ page, browserName }) => {
    // This test will run on all browser projects
    await page.goto('/login?e2e=1');
    
    // Should work on all browsers
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
    
    console.log(`E2E bypass working on ${browserName}`);
  });
});

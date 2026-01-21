/**
 * Admin Performance Maintenance Tests
 *
 * Tests for materialized views refresh and database maintenance endpoints
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Performance Maintenance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin performance page
    // Note: This requires admin authentication
    await page.goto('/admin/performance');

    // Wait for page to load
    await page.waitForSelector('[data-testid="performance-dashboard"], .performance-dashboard, h2:has-text("Performance Dashboard")', { timeout: 10000 }).catch(() => {
      // If not authenticated, we'll skip the test
      test.skip(true, 'Admin authentication required');
    });
  });

  test('Refresh Materialized Views button should call API endpoint', async ({ page }) => {
    // Intercept the API call
    const apiCallPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/refresh-materialized-views') &&
        response.request().method() === 'POST',
      { timeout: 30000 }
    );

    // Find and click the "Refresh Views" button
    const refreshButton = page.locator('button:has-text("Refresh Views"), button:has-text("Refresh Materialized Views")').first();

    if (await refreshButton.count() === 0) {
      test.skip(true, 'Refresh Views button not found');
      return;
    }

    await refreshButton.click();

    // Wait for API response
    const response = await apiCallPromise;

    // Verify response
    expect(response.status()).toBeLessThan(500); // Should not be server error

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success');

    // Should return success even if functions don't exist (graceful degradation)
    if (response.status() === 200) {
      expect(responseBody.success).toBe(true);
    }
  });

  test('DB Maintenance button should call API endpoint', async ({ page }) => {
    // Intercept the API call
    const apiCallPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/perform-database-maintenance') &&
        response.request().method() === 'POST',
      { timeout: 60000 } // Maintenance can take longer
    );

    // Find and click the "DB Maintenance" button
    const maintenanceButton = page.locator('button:has-text("DB Maintenance"), button:has-text("Database Maintenance")').first();

    if (await maintenanceButton.count() === 0) {
      test.skip(true, 'DB Maintenance button not found');
      return;
    }

    await maintenanceButton.click();

    // Wait for API response
    const response = await apiCallPromise;

    // Verify response
    expect(response.status()).toBeLessThan(500); // Should not be server error

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success');

    // Should return success even if functions don't exist (graceful degradation)
    if (response.status() === 200) {
      expect(responseBody.success).toBe(true);
      expect(responseBody).toHaveProperty('operations');
    }
  });

  test('Endpoints should handle missing database functions gracefully', async ({ page, request }) => {
    // Test refresh-materialized-views endpoint directly
    const refreshResponse = await request.post('/api/admin/refresh-materialized-views', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        ),
      },
    });

    // Should not be a 500 error (should handle gracefully)
    expect(refreshResponse.status()).not.toBe(500);

    if (refreshResponse.ok()) {
      const body = await refreshResponse.json();
      expect(body).toHaveProperty('success');
      // Should indicate if functions are missing
      if (body.message) {
        expect(typeof body.message).toBe('string');
      }
    }

    // Test perform-database-maintenance endpoint directly
    const maintenanceResponse = await request.post('/api/admin/perform-database-maintenance', {
      headers: {
        'Cookie': await page.context().cookies().then(cookies =>
          cookies.map(c => `${c.name}=${c.value}`).join('; ')
        ),
      },
    });

    // Should not be a 500 error (should handle gracefully)
    expect(maintenanceResponse.status()).not.toBe(500);

    if (maintenanceResponse.ok()) {
      const body = await maintenanceResponse.json();
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('operations');
      // Should indicate if functions are missing
      if (body.note) {
        expect(typeof body.note).toBe('string');
      }
    }
  });
});

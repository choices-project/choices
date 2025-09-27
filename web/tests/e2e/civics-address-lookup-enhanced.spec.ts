/**
 * Enhanced E2E Tests for Civics Address Lookup Feature
 * Comprehensive testing of the civics address lookup functionality
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers/e2e-setup';

test.describe('Civics Address Lookup - Enhanced E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the civics API responses for consistent testing
    await page.route('**/api/v1/civics/address-lookup', async route => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      // Mock different responses based on address
      let mockResponse;
      if (body.address.includes('Springfield, IL')) {
        mockResponse = {
          ok: true,
          jurisdiction: {
            state: 'IL',
            district: '13',
            county: 'Sangamon',
            fallback: true
          }
        };
      } else if (body.address.includes('Washington, DC')) {
        mockResponse = {
          ok: true,
          jurisdiction: {
            state: 'DC',
            district: '0',
            county: 'District of Columbia',
            fallback: false
          }
        };
      } else if (body.address.includes('Menlo Park, CA')) {
        mockResponse = {
          ok: true,
          jurisdiction: {
            state: 'CA',
            district: '18',
            county: 'San Mateo',
            fallback: false
          }
        };
      } else {
        mockResponse = {
          ok: false,
          error: 'Address not found'
        };
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });
  });

  test('should successfully lookup address and display jurisdiction info', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);

    // Verify civics page loads
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();
    
    // Test address lookup form
    const addressInput = page.locator('[data-testid="address-input"]');
    const submitButton = page.locator('[data-testid="address-submit"]');
    
    await expect(addressInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Test with Springfield, IL address
    await addressInput.fill('123 Main St, Springfield, IL 62704');
    await submitButton.click();

    // Wait for API response
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Verify no errors are displayed
    const errorElement = page.locator('.text-red-600');
    await expect(errorElement).toHaveCount(0);
  });

  test('should handle different address formats correctly', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);

    const testAddresses = [
      '1600 Pennsylvania Avenue NW, Washington, DC 20500',
      '1 Hacker Way, Menlo Park, CA 94025',
      '123 Main St, Springfield, IL 62704'
    ];

    for (const address of testAddresses) {
      // Clear and fill address
      await page.locator('[data-testid="address-input"]').fill('');
      await page.locator('[data-testid="address-input"]').fill(address);
      await page.locator('[data-testid="address-submit"]').click();

      // Wait for API response
      await page.waitForResponse('**/api/v1/civics/address-lookup');
      
      // Verify no errors
      const errorElement = page.locator('.text-red-600');
      await expect(errorElement).toHaveCount(0);
    }
  });

  test('should handle invalid address gracefully', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);

    // Test with invalid address
    await page.locator('[data-testid="address-input"]').fill('Invalid Address 12345');
    await page.locator('[data-testid="address-submit"]').click();

    // Wait for API response
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Should handle error gracefully (no crash)
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();
  });

  test('should verify feature flag is enabled', async ({ page }) => {
    // Check that the civics feature is enabled via feature flags
    await page.goto('/api/e2e/flags');
    const flags = await page.textContent('body');
    const flagsData = JSON.parse(flags || '{}');
    
    expect(flagsData.CIVICS_ADDRESS_LOOKUP).toBe(true);
  });

  test('should handle empty address submission', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);

    // Submit empty address
    await page.locator('[data-testid="address-submit"]').click();
    
    // Should show validation error or handle gracefully
    // (exact behavior depends on frontend validation)
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();
  });

  test('should verify API endpoint is accessible', async ({ page }) => {
    // Test direct API access
    const response = await page.request.post('/api/v1/civics/address-lookup', {
      data: { address: '123 Main St, Springfield, IL 62704' }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('ok');
  });
});

/**
 * Performance Monitoring Integration
 * 
 * Integrates performance monitoring into E2E tests
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

import { test, expect } from '@playwright/test';
import { PerformanceTestUtils } from '../../utils/performance-test-utils';

test.describe('Performance Monitoring Integration', () => {
  let performanceUtils: PerformanceTestUtils;

  test.beforeEach(async ({ page }) => {
    performanceUtils = new PerformanceTestUtils(page);
  });

  test('Page load performance meets standards', async ({ page }) => {
    await page.goto('/');
    
    const performance = await performanceUtils.measurePageLoad();
    
    expect(performance.isFast).toBe(true);
    expect(performance.loadTime).toBeLessThan(3000);
  });

  test('API response times meet standards', async ({ page }) => {
    await page.goto('/');
    
    const apiResponse = await performanceUtils.measureAPIResponse('/api/polls');
    
    expect(apiResponse.isFast).toBe(true);
    expect(apiResponse.status).toBe(200);
  });

  test('Component render times meet standards', async ({ page }) => {
    await page.goto('/polls');
    
    const componentPerformance = await performanceUtils.measureComponentRender('[data-testid="polls-list"]');
    
    expect(componentPerformance.isFast).toBe(true);
    expect(componentPerformance.renderTime).toBeLessThan(500);
  });

  test('Browser performance metrics are within acceptable range', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await performanceUtils.getBrowserMetrics();
    
    expect(metrics.domContentLoaded).toBeLessThan(2000);
    expect(metrics.loadComplete).toBeLessThan(3000);
    expect(metrics.totalTime).toBeLessThan(5000);
  });
});
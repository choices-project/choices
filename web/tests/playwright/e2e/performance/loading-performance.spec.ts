import { test, expect } from '@playwright/test';
import { 
  measureLoadingPerformance, 
  measureResourcePerformance,
  measurePageLoadTime,
  assertPerformanceMetrics,
  DEFAULT_THRESHOLDS
} from '../performance-utils';

/**
 * Loading Performance Tests
 * 
 * Tests various aspects of loading performance including:
 * - First Contentful Paint (FCP)
 * - Time to Interactive (TTI)
 * - Total Blocking Time (TBT)
 * - Resource optimization
 * - Bundle sizes
 */
test.describe('Loading Performance Tests', () => {
  
  test('should load pages quickly', async ({ page }) => {
    const pages = ['/', '/polls', '/create-poll', '/profile'];
    
    for (const pagePath of pages) {
      console.log(`🔍 Testing load time for: ${pagePath}`);
      
      const loadTime = await measurePageLoadTime(page, pagePath);
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      console.log(`📊 ${pagePath} load time: ${loadTime}ms`);
    }
  });
  
  test('should meet First Contentful Paint (FCP) requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureLoadingPerformance(page);
    
    // FCP should be under 1.8 seconds
    expect(metrics.fcp).toBeLessThan(1800);
    console.log(`📊 FCP: ${metrics.fcp}ms (threshold: 1800ms)`);
  });
  
  test('should meet Time to Interactive (TTI) requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureLoadingPerformance(page);
    
    // TTI should be under 3.8 seconds
    expect(metrics.tti).toBeLessThan(3800);
    console.log(`📊 TTI: ${metrics.tti}ms (threshold: 3800ms)`);
  });
  
  test('should meet Total Blocking Time (TBT) requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureLoadingPerformance(page);
    
    // TBT should be under 200ms
    expect(metrics.tbt).toBeLessThan(200);
    console.log(`📊 TBT: ${metrics.tbt}ms (threshold: 200ms)`);
  });
  
  test('should have optimized JavaScript bundle size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureResourcePerformance(page);
    
    // JavaScript bundle should be under 500KB
    expect(metrics.jsBundleSize).toBeLessThan(500000);
    console.log(`📊 JS Bundle Size: ${(metrics.jsBundleSize! / 1024).toFixed(2)}KB (threshold: 500KB)`);
  });
  
  test('should have optimized CSS bundle size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureResourcePerformance(page);
    
    // CSS bundle should be under 100KB
    expect(metrics.cssBundleSize).toBeLessThan(100000);
    console.log(`📊 CSS Bundle Size: ${(metrics.cssBundleSize! / 1024).toFixed(2)}KB (threshold: 100KB)`);
  });
  
  test('should have reasonable number of requests', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureResourcePerformance(page);
    
    // Should not have excessive number of requests
    expect(metrics.totalRequests).toBeLessThan(50);
    console.log(`📊 Total Requests: ${metrics.totalRequests} (threshold: 50)`);
  });
  
  test('should have optimized images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureResourcePerformance(page);
    
    // Should not have excessive number of images
    expect(metrics.imageCount).toBeLessThan(20);
    console.log(`📊 Image Count: ${metrics.imageCount} (threshold: 20)`);
  });
  
  test('should maintain performance with cached resources', async ({ page, context }) => {
    // First visit - cold cache
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const coldMetrics = await measureLoadingPerformance(page);
    console.log(`📊 Cold cache FCP: ${coldMetrics.fcp}ms`);
    
    // Second visit - warm cache
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const warmMetrics = await measureLoadingPerformance(page);
    console.log(`📊 Warm cache FCP: ${warmMetrics.fcp}ms`);
    
    // Warm cache should be significantly faster
    if (coldMetrics.fcp && warmMetrics.fcp) {
      const improvement = coldMetrics.fcp - warmMetrics.fcp;
      expect(improvement).toBeGreaterThan(0);
      console.log(`📊 Cache improvement: ${improvement}ms`);
    }
  });
  
  test('should maintain performance with different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`🔍 Testing performance for ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const metrics = await measureLoadingPerformance(page);
      
      // Performance should be acceptable across all viewports
      expect(metrics.fcp).toBeLessThan(2000); // Slightly relaxed for mobile
      expect(metrics.tti).toBeLessThan(4000);
      
      console.log(`📊 ${viewport.name} FCP: ${metrics.fcp}ms, TTI: ${metrics.tti}ms`);
    }
  });
  
  test('should maintain performance with slow 3G connection', async ({ page, context }) => {
    // Simulate slow 3G connection
    await context.route('**/*', async (route) => {
      // Add 200ms delay to simulate slow 3G
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureLoadingPerformance(page);
    
    // Performance should still be acceptable on slow connections
    expect(metrics.fcp).toBeLessThan(3000); // Relaxed threshold for slow connection
    expect(metrics.tti).toBeLessThan(5000);
    
    console.log(`📊 Slow 3G FCP: ${metrics.fcp}ms, TTI: ${metrics.tti}ms`);
  });
  
  test('should maintain performance with multiple tabs', async ({ page, context }) => {
    // Open multiple tabs to simulate resource contention
    const tabs = [];
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage();
      await newPage.goto('/');
      tabs.push(newPage);
    }
    
    // Test performance on the main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await measureLoadingPerformance(page);
    
    // Performance should not degrade significantly with multiple tabs
    expect(metrics.fcp).toBeLessThan(2500);
    expect(metrics.tti).toBeLessThan(4500);
    
    console.log(`📊 Multi-tab FCP: ${metrics.fcp}ms, TTI: ${metrics.tti}ms`);
    
    // Clean up tabs
    for (const tab of tabs) {
      await tab.close();
    }
  });
  
  test('should meet all loading performance thresholds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Assert all performance metrics meet thresholds
    await assertPerformanceMetrics(page, DEFAULT_THRESHOLDS);
  });
});





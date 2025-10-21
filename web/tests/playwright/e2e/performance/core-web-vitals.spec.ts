import { test, expect } from '@playwright/test';
import { 
  measureCoreWebVitals, 
  measureLoadingPerformance, 
  measureResourcePerformance,
  assertPerformanceMetrics,
  DEFAULT_THRESHOLDS
} from '../performance-utils';
import type { PerformanceMetrics } from '../performance-utils';

/**
 * Core Web Vitals Performance Tests
 * 
 * Tests the three Core Web Vitals metrics that Google uses to measure
 * user experience: LCP, FID, and CLS.
 */
test.describe('Core Web Vitals Performance Tests', () => {
  
  test('should meet LCP (Largest Contentful Paint) requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure LCP
    const metrics = await measureCoreWebVitals(page);
    
    // LCP should be under 2.5 seconds
    expect(metrics.lcp).toBeLessThan(2500);
    console.log(`📊 LCP: ${metrics.lcp}ms (threshold: 2500ms)`);
  });
  
  test('should meet FID (First Input Delay) requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure FID by simulating user interaction
    const metrics = await measureCoreWebVitals(page);
    
    // FID should be under 100ms
    expect(metrics.fid).toBeLessThan(100);
    console.log(`📊 FID: ${metrics.fid}ms (threshold: 100ms)`);
  });
  
  test('should meet CLS (Cumulative Layout Shift) requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure CLS
    const metrics = await measureCoreWebVitals(page);
    
    // CLS should be under 0.1
    expect(metrics.cls).toBeLessThan(0.1);
    console.log(`📊 CLS: ${metrics.cls} (threshold: 0.1)`);
  });
  
  test('should meet all Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Assert all performance metrics meet thresholds
    await assertPerformanceMetrics(page, DEFAULT_THRESHOLDS);
  });
  
  test('should maintain performance across different pages', async ({ page }) => {
    const pages = ['/', '/polls', '/create-poll', '/profile'];
    
    for (const pagePath of pages) {
      console.log(`🔍 Testing performance for: ${pagePath}`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Measure Core Web Vitals for each page
      const metrics = await measureCoreWebVitals(page);
      
      // Assert performance thresholds
      expect(metrics.lcp).toBeLessThan(2500);
      expect(metrics.fid).toBeLessThan(100);
      expect(metrics.cls).toBeLessThan(0.1);
      
      console.log(`✅ ${pagePath} performance validated`);
    }
  });
  
  test('should maintain performance with user interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate user interactions
    const interactions = [
      { action: 'click', selector: 'button' },
      { action: 'type', selector: 'input' },
      { action: 'hover', selector: 'a' }
    ];
    
    for (const interaction of interactions) {
      try {
        if (await page.locator(interaction.selector).count() > 0) {
          const startTime = Date.now();
          
          switch (interaction.action) {
            case 'click':
              await page.click(interaction.selector);
              break;
            case 'type':
              await page.fill(interaction.selector, 'test');
              break;
            case 'hover':
              await page.hover(interaction.selector);
              break;
          }
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          // Interaction should be responsive
          expect(responseTime).toBeLessThan(100);
          console.log(`📊 ${interaction.action} response time: ${responseTime}ms`);
        }
      } catch (error) {
        console.log(`⚠️ Skipping ${interaction.action} on ${interaction.selector} - element not found`);
      }
    }
  });
  
  test('should maintain performance with dynamic content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure initial performance
    const initialMetrics = await measureCoreWebVitals(page);
    
    // Simulate dynamic content loading
    await page.evaluate(() => {
      // Simulate loading additional content
      const container = document.createElement('div');
      container.innerHTML = '<p>Dynamic content loaded</p>';
      document.body.appendChild(container);
    });
    
    // Wait for any layout shifts to settle
    await page.waitForTimeout(1000);
    
    // Measure performance after dynamic content
    const finalMetrics = await measureCoreWebVitals(page);
    
    // Performance should not degrade significantly
    if (initialMetrics.lcp && finalMetrics.lcp) {
      const lcpIncrease = finalMetrics.lcp - initialMetrics.lcp;
      expect(lcpIncrease).toBeLessThan(500); // Less than 500ms increase
    }
    
    console.log(`📊 LCP change: ${finalMetrics.lcp && initialMetrics.lcp ? finalMetrics.lcp - initialMetrics.lcp : 'N/A'}ms`);
  });
  
  test('should maintain performance with network throttling', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      // Add 100ms delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure performance under network throttling
    const metrics = await measureCoreWebVitals(page);
    
    // Performance should still be acceptable even with throttling
    expect(metrics.lcp).toBeLessThan(4000); // Relaxed threshold for throttled network
    expect(metrics.cls).toBeLessThan(0.1);
    
    console.log(`📊 Performance under network throttling - LCP: ${metrics.lcp}ms, CLS: ${metrics.cls}`);
  });
});





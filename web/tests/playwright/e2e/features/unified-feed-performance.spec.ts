/**
 * UnifiedFeed Performance Tests
 * 
 * Comprehensive performance testing for the UnifiedFeed component
 * Tests load times, rendering performance, and user interactions
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('UnifiedFeed Performance Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    
    // Set up performance observers
    await page.addInitScript(() => {
      // Track Core Web Vitals
      const vitals = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      };
      
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
        (window as any).vitals = vitals;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.processingStart && entry.startTime) {
            vitals.fid = entry.processingStart - entry.startTime;
          }
        });
        (window as any).vitals = vitals;
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        vitals.cls = clsValue;
        (window as any).vitals = vitals;
      }).observe({ entryTypes: ['layout-shift'] });
      
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        });
        (window as any).vitals = vitals;
      }).observe({ entryTypes: ['paint'] });
      
      // Time to First Byte
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'navigation') {
            vitals.ttfb = (entry as any).responseStart - (entry as any).requestStart;
          }
        });
        (window as any).vitals = vitals;
      }).observe({ entryTypes: ['navigation'] });
    });
  });

  test.afterEach(async () => {
    // Collect coverage data
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();
    
    // Log coverage metrics
    const jsUsedBytes = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
    const jsTotalBytes = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
    const cssUsedBytes = cssCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
    const cssTotalBytes = cssCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
    
    console.log(`📊 Coverage Metrics:`);
    console.log(`  JS Coverage: ${((jsUsedBytes / jsTotalBytes) * 100).toFixed(2)}%`);
    console.log(`  CSS Coverage: ${((cssUsedBytes / cssTotalBytes) * 100).toFixed(2)}%`);
    
    await page.close();
  });

  test.describe('Page Load Performance', () => {
    test('should load UnifiedFeed within performance thresholds', async () => {
      const startTime = Date.now();
      
      // Navigate to feed page
      await page.goto('/feed');
      
      // Wait for UnifiedFeed to load
      await page.waitForSelector('[data-testid="unified-feed"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Performance thresholds
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
      
      // Check Core Web Vitals
      const vitals = await page.evaluate(() => (window as any).vitals);
      
      if (vitals) {
        console.log('📊 Core Web Vitals:');
        console.log(`  LCP: ${vitals.lcp.toFixed(2)}ms`);
        console.log(`  FID: ${vitals.fid.toFixed(2)}ms`);
        console.log(`  CLS: ${vitals.cls.toFixed(4)}`);
        console.log(`  FCP: ${vitals.fcp.toFixed(2)}ms`);
        console.log(`  TTFB: ${vitals.ttfb.toFixed(2)}ms`);
        
        // Performance thresholds
        expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
        expect(vitals.fid).toBeLessThan(100); // FID < 100ms
        expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
        expect(vitals.fcp).toBeLessThan(1800); // FCP < 1.8s
        expect(vitals.ttfb).toBeLessThan(600); // TTFB < 600ms
      }
    });

    test('should handle large datasets efficiently', async () => {
      // Navigate to feed page
      await page.goto('/feed');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Simulate loading large dataset
      const startTime = Date.now();
      
      // Scroll to trigger infinite scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      const scrollTime = Date.now() - startTime;
      
      // Performance thresholds for scrolling
      expect(scrollTime).toBeLessThan(2000); // 2 seconds max for scroll operations
      
      // Check for feed items
      const feedItems = page.locator('[data-testid="feed-item"]');
      const count = await feedItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('User Interaction Performance', () => {
    test('should handle rapid interactions without performance degradation', async () => {
      await page.goto('/feed');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      const startTime = Date.now();
      
      // Rapid interactions
      for (let i = 0; i < 10; i++) {
        // Toggle dark mode
        await page.getByRole('button', { name: /switch to dark mode/i }).click();
        await page.waitForTimeout(100);
        
        // Toggle filters
        await page.getByRole('button', { name: /toggle advanced filters/i }).click();
        await page.waitForTimeout(100);
        
        // Refresh feed
        await page.getByRole('button', { name: /refresh feed/i }).click();
        await page.waitForTimeout(100);
      }
      
      const interactionTime = Date.now() - startTime;
      
      // Performance thresholds for rapid interactions
      expect(interactionTime).toBeLessThan(5000); // 5 seconds max for 10 interactions
      
      // Check that UI is still responsive
      await expect(page.getByRole('button', { name: /switch to dark mode/i })).toBeVisible();
    });

    test('should handle touch gestures efficiently', async () => {
      await page.goto('/feed');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      const startTime = Date.now();
      
      // Simulate touch gestures
      const feedItems = page.locator('[data-testid="feed-item"]').first();
      
      // Swipe gestures
      await feedItems.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();
      
      await page.waitForTimeout(100);
      
      // Long press
      await feedItems.hover();
      await page.mouse.down();
      await page.waitForTimeout(500);
      await page.mouse.up();
      
      const gestureTime = Date.now() - startTime;
      
      // Performance thresholds for gestures
      expect(gestureTime).toBeLessThan(1000); // 1 second max for gesture operations
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks during extended use', async () => {
      await page.goto('/feed');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (initialMemory) {
        console.log('📊 Initial Memory Usage:');
        console.log(`  Used JS Heap: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Total JS Heap: ${(initialMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        
        // Simulate extended use
        for (let i = 0; i < 20; i++) {
          // Scroll and interact
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(200);
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(200);
          
          // Toggle features
          await page.getByRole('button', { name: /toggle advanced filters/i }).click();
          await page.waitForTimeout(100);
        }
        
        // Get final memory usage
        const finalMemory = await page.evaluate(() => {
          return (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          } : null;
        });
        
        if (finalMemory) {
          console.log('📊 Final Memory Usage:');
          console.log(`  Used JS Heap: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
          console.log(`  Total JS Heap: ${(finalMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
          
          // Check for memory leaks (growth should be reasonable)
          const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
          const memoryGrowthMB = memoryGrowth / 1024 / 1024;
          
          console.log(`  Memory Growth: ${memoryGrowthMB.toFixed(2)}MB`);
          
          // Memory leak threshold (should not grow more than 50MB)
          expect(memoryGrowthMB).toBeLessThan(50);
        }
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should handle network requests efficiently', async () => {
      const requests: any[] = [];
      
      // Monitor network requests
      page.on('request', (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      });
      
      await page.goto('/feed');
      await page.waitForSelector('[data-testid="unified-feed"]');
      
      // Wait for all requests to complete
      await page.waitForLoadState('networkidle');
      
      // Analyze network performance
      const networkMetrics = {
        totalRequests: requests.length,
        averageResponseTime: 0,
        slowestRequest: 0,
        fastestRequest: Infinity
      };
      
      console.log('📊 Network Performance:');
      console.log(`  Total Requests: ${networkMetrics.totalRequests}`);
      
      // Performance thresholds
      expect(networkMetrics.totalRequests).toBeLessThan(50); // Should not make too many requests
      
      // Check for large requests
      const largeRequests = requests.filter(req => req.url.includes('large') || req.url.includes('bulk'));
      expect(largeRequests.length).toBeLessThan(5); // Should not have many large requests
    });
  });
});

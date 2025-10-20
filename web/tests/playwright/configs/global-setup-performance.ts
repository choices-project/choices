import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Performance Testing
 * 
 * Sets up performance monitoring and baseline measurements
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up performance testing environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Set up performance monitoring
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    // Record baseline performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
        cumulativeLayoutShift: performance.getEntriesByName('layout-shift').reduce((sum, entry) => sum + (entry as any).value, 0),
        totalBlockingTime: performance.getEntriesByType('measure').reduce((sum, entry) => sum + entry.duration, 0)
      };
    });
    
    console.log('📊 Baseline Performance Metrics:');
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`  Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`  First Paint: ${metrics.firstPaint.toFixed(2)}ms`);
    console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`  Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms`);
    console.log(`  Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(4)}`);
    console.log(`  Total Blocking Time: ${metrics.totalBlockingTime.toFixed(2)}ms`);
    
    // Store baseline metrics for comparison
    process.env.PERFORMANCE_BASELINE = JSON.stringify(metrics);
    
  } catch (error) {
    console.error('❌ Performance setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Performance testing environment ready');
}

export default globalSetup;

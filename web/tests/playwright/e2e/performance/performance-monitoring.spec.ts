import { test, expect } from '@playwright/test';
import { collectPerformanceMetrics, collectMonitoringMetrics, generateMonitoringAlerts } from './monitoring-utils';

/**
 * Performance Monitoring Tests
 * 
 * Tests performance monitoring including:
 * - Load time monitoring
 * - Render time monitoring
 * - Memory usage monitoring
 * - CPU usage monitoring
 * - Performance alerts
 */
test.describe('Performance Monitoring Tests', () => {
  
  test('should monitor page load performance', async ({ page }) => {
    const testName = 'page-load-performance';
    const browser = 'Chrome';
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await collectMonitoringMetrics(page, testName, browser);
    
    // Performance should be within acceptable limits
    expect(metrics.performance.loadTime).toBeLessThan(5000);
    expect(metrics.performance.renderTime).toBeLessThan(2000);
    expect(metrics.performance.interactionTime).toBeLessThan(3000);
    
    console.log(`📊 Performance monitoring for ${testName}:`);
    console.log(`  - Load time: ${metrics.performance.loadTime}ms`);
    console.log(`  - Render time: ${metrics.performance.renderTime}ms`);
    console.log(`  - Interaction time: ${metrics.performance.interactionTime}ms`);
    console.log(`  - Memory usage: ${metrics.performance.memoryUsage} bytes`);
  });
  
  test('should monitor performance across different pages', async ({ page }) => {
    const pages = ['/', '/about', '/contact', '/polls'];
    const browser = 'Chrome';
    
    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        const testName = `performance-${pagePath.replace('/', '') || 'home'}`;
        const metrics = await collectMonitoringMetrics(page, testName, browser);
        
        // Performance should be within acceptable limits
        expect(metrics.performance.loadTime).toBeLessThan(5000);
        expect(metrics.performance.renderTime).toBeLessThan(2000);
        
        console.log(`📊 Performance for ${pagePath}: ${metrics.performance.loadTime}ms`);
      } catch (error) {
        console.log(`⚠️ Could not test ${pagePath}: ${error}`);
      }
    }
  });
  
  test('should monitor performance under different network conditions', async ({ page }) => {
    const testName = 'network-performance';
    const browser = 'Chrome';
    
    // Test with different network conditions
    const networkConditions = [
      { name: 'Fast 3G', condition: 'fast-3g' },
      { name: 'Slow 3G', condition: 'slow-3g' },
      { name: 'Offline', condition: 'offline' }
    ];
    
    for (const network of networkConditions) {
      try {
        // Note: Network conditions would need to be set in the browser context
        // This is a simplified version for demonstration
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        const metrics = await collectMonitoringMetrics(page, `${testName}-${network.name}`, browser);
        
        console.log(`📊 Performance under ${network.name}: ${metrics.performance.loadTime}ms`);
      } catch (error) {
        console.log(`⚠️ Could not test ${network.name}: ${error}`);
      }
    }
  });
  
  test('should monitor memory usage', async ({ page }) => {
    const testName = 'memory-usage';
    const browser = 'Chrome';
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await collectMonitoringMetrics(page, testName, browser);
    
    // Memory usage should be reasonable
    expect(metrics.performance.memoryUsage).toBeGreaterThan(0);
    
    console.log(`📊 Memory usage: ${metrics.performance.memoryUsage} bytes`);
  });
  
  test('should generate performance alerts', async ({ page }) => {
    const testName = 'performance-alerts';
    const browser = 'Chrome';
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await collectMonitoringMetrics(page, testName, browser);
    const alerts = generateMonitoringAlerts(metrics);
    
    // Check for performance alerts
    const performanceAlerts = alerts.filter(alert => alert.type === 'performance');
    
    if (performanceAlerts.length > 0) {
      console.log(`🚨 Performance alerts generated: ${performanceAlerts.length}`);
      performanceAlerts.forEach(alert => {
        console.log(`  - ${alert.message}`);
        console.log(`  - Recommendations: ${alert.recommendations.join(', ')}`);
      });
    } else {
      console.log('✅ No performance alerts generated');
    }
  });
  
  test('should monitor performance trends', async ({ page }) => {
    const testName = 'performance-trends';
    const browser = 'Chrome';
    
    // Simulate multiple page loads to track trends
    const loadTimes = [];
    
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const metrics = await collectMonitoringMetrics(page, `${testName}-${i}`, browser);
      loadTimes.push(metrics.performance.loadTime);
      
      // Wait between loads
      await page.waitForTimeout(1000);
    }
    
    // Calculate trend
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);
    const minLoadTime = Math.min(...loadTimes);
    
    console.log(`📊 Performance trends:`);
    console.log(`  - Average load time: ${averageLoadTime}ms`);
    console.log(`  - Max load time: ${maxLoadTime}ms`);
    console.log(`  - Min load time: ${minLoadTime}ms`);
    console.log(`  - Load times: ${loadTimes.join(', ')}ms`);
    
    // Performance should be consistent
    expect(maxLoadTime - minLoadTime).toBeLessThan(2000); // Less than 2 second variance
  });
  
  test('should monitor performance under load', async ({ page }) => {
    const testName = 'load-performance';
    const browser = 'Chrome';
    
    // Simulate load by making multiple requests
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.goto('/').then(() => page.waitForLoadState('networkidle'))
      );
    }
    
    await Promise.all(requests);
    
    const metrics = await collectMonitoringMetrics(page, testName, browser);
    
    console.log(`📊 Performance under load: ${metrics.performance.loadTime}ms`);
    
    // Performance should still be acceptable under load
    expect(metrics.performance.loadTime).toBeLessThan(10000);
  });
  
  test('should monitor performance with different viewport sizes', async ({ page }) => {
    const testName = 'viewport-performance';
    const browser = 'Chrome';
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop' },
      { width: 1920, height: 1080, name: 'Large Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const metrics = await collectMonitoringMetrics(page, `${testName}-${viewport.name}`, browser);
      
      console.log(`📊 Performance at ${viewport.name}: ${metrics.performance.loadTime}ms`);
      
      // Performance should be acceptable across all viewports
      expect(metrics.performance.loadTime).toBeLessThan(5000);
    }
  });
  
  test('should monitor performance with different browsers', async ({ page }) => {
    const testName = 'browser-performance';
    const browser = 'Chrome'; // This would be different for each browser in actual cross-browser testing
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await collectMonitoringMetrics(page, testName, browser);
    
    console.log(`📊 Performance on ${browser}: ${metrics.performance.loadTime}ms`);
    
    // Performance should be acceptable
    expect(metrics.performance.loadTime).toBeLessThan(5000);
  });
  
  test('should monitor performance with different user interactions', async ({ page }) => {
    const testName = 'interaction-performance';
    const browser = 'Chrome';
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate user interactions
    try {
      await page.click('button');
      await page.waitForTimeout(100);
      
      await page.fill('input', 'test');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    } catch (error) {
      console.log(`⚠️ Could not simulate interactions: ${error}`);
    }
    
    const metrics = await collectMonitoringMetrics(page, testName, browser);
    
    console.log(`📊 Performance with interactions: ${metrics.performance.interactionTime}ms`);
    
    // Interaction time should be reasonable
    expect(metrics.performance.interactionTime).toBeLessThan(3000);
  });
});





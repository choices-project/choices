/**
 * Performance Optimization Tests
 * 
 * These tests focus on performance optimization and monitoring
 * to achieve the Testing Roadmap to Perfection.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';
import { performanceMonitor, PerformanceMonitor } from '../helpers/performance-monitor';

test.describe('Performance Optimization', () => {
  let monitor: PerformanceMonitor;

  test.beforeEach(async () => {
    monitor = performanceMonitor;
    monitor.reset();
  });

  test('should meet Core Web Vitals standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Monitor Core Web Vitals
    const metrics = await monitor.monitorComprehensive(page);

    // Check Core Web Vitals thresholds
    const check = monitor.checkThresholds(metrics);

    console.log('Core Web Vitals Results:');
    console.log(`LCP: ${metrics.lcp}ms (threshold: 2500ms)`);
    console.log(`FID: ${metrics.fid}ms (threshold: 100ms)`);
    console.log(`CLS: ${metrics.cls} (threshold: 0.1)`);

    expect(check.passed).toBe(true);
    if (!check.passed) {
      console.error('Core Web Vitals failures:', check.failures);
    }
  });

  test('should optimize page load performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Monitor performance metrics
    const metrics = await monitor.monitorComprehensive(page);

    // Check performance thresholds
    const check = monitor.checkThresholds(metrics);

    console.log('Performance Results:');
    console.log(`FCP: ${metrics.fcp}ms (threshold: 1800ms)`);
    console.log(`TTFB: ${metrics.ttfb}ms (threshold: 600ms)`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`Load Complete: ${metrics.loadComplete}ms`);

    expect(check.passed).toBe(true);
    if (!check.passed) {
      console.error('Performance failures:', check.failures);
    }
  });

  test('should prevent memory leaks', async ({ page }) => {
    // Navigate to multiple pages to test for memory leaks
    const pages = ['/', '/auth', '/polls/create', '/admin'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      // Monitor memory usage
      const metrics = await monitor.monitorComprehensive(page, 'navigation');
      
      console.log(`Memory usage at ${pageUrl}: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
      
      // Check for memory leaks
      expect(metrics.memoryLeaks).toBe(false);
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
    }
  });

  test('should optimize poll creation performance', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    // Fill out poll creation form
    await page.fill('[data-testid="poll-title-input"]', 'Performance Test Poll');
    await page.fill('[data-testid="poll-description-input"]', 'Testing poll creation performance');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');

    // Monitor poll creation performance
    const startTime = performance.now();
    await page.click('[data-testid="create-poll-btn"]');
    await page.waitForLoadState('networkidle');
    const endTime = performance.now();

    const pollCreationTime = endTime - startTime;
    console.log(`Poll creation time: ${pollCreationTime}ms`);

    // Should complete within 5 seconds
    expect(pollCreationTime).toBeLessThan(5000);
  });

  test('should optimize voting performance', async ({ page }) => {
    // Navigate to a poll (assuming one exists)
    await page.goto('/polls/test-poll-id');
    await page.waitForLoadState('networkidle');

    // Monitor voting performance
    const startTime = performance.now();
    
    // Simulate voting (if poll exists)
    const voteButton = page.locator('[data-testid="vote-button"]');
    if (await voteButton.isVisible()) {
      await voteButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    const endTime = performance.now();
    const votingTime = endTime - startTime;
    
    console.log(`Voting time: ${votingTime}ms`);

    // Should complete within 2 seconds
    expect(votingTime).toBeLessThan(2000);
  });

  test('should optimize navigation performance', async ({ page }) => {
    const pages = ['/', '/auth', '/polls/create', '/admin'];
    
    for (const pageUrl of pages) {
      const startTime = performance.now();
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      const endTime = performance.now();
      
      const navigationTime = endTime - startTime;
      console.log(`Navigation time to ${pageUrl}: ${navigationTime}ms`);
      
      // Should complete within 1 second
      expect(navigationTime).toBeLessThan(1000);
    }
  });

  test('should optimize network performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Monitor network performance
    const metrics = await monitor.monitorComprehensive(page);

    console.log('Network Performance Results:');
    console.log(`Requests Count: ${metrics.requestsCount}`);
    console.log(`Total Size: ${Math.round(metrics.totalSize / 1024)}KB`);
    console.log(`Slowest Request: ${metrics.slowestRequest}ms`);

    // Should have reasonable number of requests
    expect(metrics.requestsCount).toBeLessThan(50);
    
    // Should have reasonable total size
    expect(metrics.totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB
    
    // Should have reasonable slowest request
    expect(metrics.slowestRequest).toBeLessThan(3000); // 3 seconds
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');

    // Simulate rapid user interactions
    const startTime = performance.now();
    
    // Rapid form filling
    await page.fill('[data-testid="poll-title-input"]', 'Concurrent Test Poll');
    await page.fill('[data-testid="poll-description-input"]', 'Testing concurrent interactions');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    
    // Rapid clicking
    await page.click('[data-testid="add-option-btn"]');
    await page.fill('[data-testid="option-input-2"]', 'Option 3');
    
    const endTime = performance.now();
    const interactionTime = endTime - startTime;
    
    console.log(`Concurrent interaction time: ${interactionTime}ms`);
    
    // Should handle rapid interactions smoothly
    expect(interactionTime).toBeLessThan(3000); // 3 seconds
  });

  test('should generate comprehensive performance report', async ({ page }) => {
    // Run multiple performance tests
    await page.goto('/');
    await monitor.monitorComprehensive(page);
    
    await page.goto('/auth');
    await monitor.monitorComprehensive(page);
    
    await page.goto('/polls/create');
    await monitor.monitorComprehensive(page, 'poll-creation');

    // Generate performance report
    const report = monitor.generateReport();
    
    console.log('Performance Report:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed Tests: ${report.summary.passedTests}`);
    console.log(`Failed Tests: ${report.summary.failedTests}`);
    console.log(`Average LCP: ${report.summary.averageLCP}ms`);
    console.log(`Average FID: ${report.summary.averageFID}ms`);
    console.log(`Average CLS: ${report.summary.averageCLS}`);
    console.log(`Average Memory Usage: ${Math.round(report.summary.averageMemoryUsage / 1024 / 1024)}MB`);

    // Should have good performance overall
    expect(report.summary.passedTests).toBeGreaterThan(0);
    expect(report.summary.averageLCP).toBeLessThan(2500);
    expect(report.summary.averageFID).toBeLessThan(100);
    expect(report.summary.averageCLS).toBeLessThan(0.1);
  });
});

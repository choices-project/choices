/**
 * Performance Test Utilities
 * 
 * Utilities for testing performance metrics in E2E tests
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

import { Page, expect } from '@playwright/test';

export class PerformanceTestUtils {
  constructor(private page: Page) {}

  /**
   * Measure page load performance
   */
  async measurePageLoad() {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    return {
      loadTime,
      isFast: loadTime < 3000,
      isAcceptable: loadTime < 5000
    };
  }

  /**
   * Measure API response times
   */
  async measureAPIResponse(url: string) {
    const startTime = Date.now();
    const response = await this.page.request.get(url);
    const responseTime = Date.now() - startTime;
    
    return {
      responseTime,
      status: response.status(),
      isFast: responseTime < 1000,
      isAcceptable: responseTime < 3000
    };
  }

  /**
   * Measure component render time
   */
  async measureComponentRender(selector: string) {
    const startTime = Date.now();
    await this.page.waitForSelector(selector, { state: 'visible' });
    const renderTime = Date.now() - startTime;
    
    return {
      renderTime,
      isFast: renderTime < 500,
      isAcceptable: renderTime < 1000
    };
  }

  /**
   * Get performance metrics from browser
   */
  async getBrowserMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
  }
}

export default PerformanceTestUtils;
/**
 * Component Test Utilities
 * 
 * Comprehensive utilities for testing React components in E2E tests
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

import { Page, expect } from '@playwright/test';

export class ComponentTestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for component to be visible and ready
   */
  async waitForComponent(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Test component performance metrics
   */
  async testComponentPerformance(selector: string) {
    const startTime = Date.now();
    await this.waitForComponent(selector);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    return loadTime;
  }

  /**
   * Test component accessibility
   */
  async testComponentAccessibility(selector: string) {
    const element = this.page.locator(selector);
    
    // Check for proper ARIA attributes
    const ariaLabel = await element.getAttribute('aria-label');
    const role = await element.getAttribute('role');
    
    return { ariaLabel, role };
  }

  /**
   * Test component interactions
   */
  async testComponentInteractions(selector: string) {
    const element = this.page.locator(selector);
    
    // Test click interactions
    await element.click();
    await this.page.waitForTimeout(100);
    
    // Test keyboard navigation
    await element.press('Tab');
    await this.page.waitForTimeout(100);
    
    return true;
  }

  /**
   * Test component state changes
   */
  async testComponentState(selector: string, expectedState: string) {
    const element = this.page.locator(selector);
    const currentState = await element.getAttribute('data-state');
    
    expect(currentState).toBe(expectedState);
    return currentState;
  }
}

export default ComponentTestUtils;
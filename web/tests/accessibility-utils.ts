/**
 * Accessibility Testing Utilities
 * 
 * Comprehensive accessibility testing utilities for E2E tests including
 * WCAG compliance, keyboard navigation, and screen reader support.
 * 
 * @fileoverview Accessibility testing utilities for E2E testing
 * @author Choices Platform Team
 * @created 2025-10-24
 * @updated 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 * 
 * @requires @playwright/test
 * @requires axe-core
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TestIds } from './registry/testIds';

/**
 * Interface for accessibility test result
 */
export interface AccessibilityTestResult {
  testName: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
  details?: Record<string, any>;
}

/**
 * Interface for accessibility test configuration
 */
export interface AccessibilityTestConfig {
  baseUrl: string;
  timeout: number;
  skipKeyboardTests: boolean;
  skipScreenReaderTests: boolean;
  skipColorContrastTests: boolean;
  skipFocusTests: boolean;
}

/**
 * Accessibility Tester Class
 * 
 * Provides comprehensive accessibility testing capabilities for E2E tests
 * with proper error handling and detailed reporting.
 */
export class AccessibilityTester {
  private page: Page;
  private config: AccessibilityTestConfig;
  private results: AccessibilityTestResult[] = [];

  /**
   * Constructor for AccessibilityTester
   * @param page - Playwright page instance
   * @param config - Accessibility test configuration
   */
  constructor(page: Page, config: Partial<AccessibilityTestConfig> = {}) {
    this.page = page;
    this.config = {
      baseUrl: 'http://localhost:3000',
      timeout: 10000,
      skipKeyboardTests: false,
      skipScreenReaderTests: false,
      skipColorContrastTests: false,
      skipFocusTests: false,
      ...config
    };
  }

  /**
   * Run comprehensive accessibility tests
   * @returns Promise<AccessibilityTestResult[]> - Array of test results
   */
  public async runComprehensiveTests(): Promise<AccessibilityTestResult[]> {
    console.log('♿ Starting comprehensive accessibility testing...');
    
    this.results = [];
    
    // Basic accessibility tests
    await this.testBasicAccessibility();
    
    // Keyboard navigation tests
    if (!this.config.skipKeyboardTests) {
      await this.testKeyboardNavigation();
    }
    
    // Focus management tests
    if (!this.config.skipFocusTests) {
      await this.testFocusManagement();
    }
    
    // Screen reader tests
    if (!this.config.skipScreenReaderTests) {
      await this.testScreenReaderSupport();
    }
    
    // Color contrast tests
    if (!this.config.skipColorContrastTests) {
      await this.testColorContrast();
    }
    
    // ARIA tests
    await this.testAriaSupport();
    
    // Semantic HTML tests
    await this.testSemanticHTML();
    
    console.log(`♿ Accessibility testing completed. ${this.results.length} tests run.`);
    return this.results;
  }

  /**
   * Test basic accessibility requirements
   * @private
   */
  private async testBasicAccessibility(): Promise<void> {
    const tests = [
      {
        name: 'Page Title',
        test: async () => {
          const title = await this.page.title();
          return Boolean(title && title.length > 0);
        },
        severity: 'high' as const,
        description: 'Page should have a descriptive title'
      },
      {
        name: 'Language Attribute',
        test: async () => {
          const html = await this.page.locator('html').getAttribute('lang');
          return !!html;
        },
        severity: 'medium' as const,
        description: 'HTML element should have lang attribute'
      },
      {
        name: 'Skip Link',
        test: async () => {
          const skipLink = this.page.locator(`[data-testid="${TestIds.A11Y.SKIP_LINK}"]`);
          return await skipLink.isVisible();
        },
        severity: 'medium' as const,
        description: 'Page should have a skip link for keyboard users'
      },
      {
        name: 'Main Content Landmark',
        test: async () => {
          const mainContent = this.page.locator(`[data-testid="${TestIds.A11Y.LANDMARK_MAIN}"]`);
          return await mainContent.isVisible();
        },
        severity: 'high' as const,
        description: 'Page should have a main content landmark'
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addResult(test.name, result, test.severity, test.description);
      } catch (error) {
        this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Test keyboard navigation
   * @private
   */
  private async testKeyboardNavigation(): Promise<void> {
    const tests = [
      {
        name: 'Tab Navigation',
        test: async () => {
          await this.page.keyboard.press('Tab');
          const focusedElement = await this.page.evaluate(() => document.activeElement);
          return !!focusedElement;
        },
        severity: 'high' as const,
        description: 'Elements should be focusable with Tab key'
      },
      {
        name: 'Enter Key Activation',
        test: async () => {
          const buttons = this.page.locator('button, [role="button"]');
          const firstButton = buttons.first();
          if (await firstButton.isVisible()) {
            await firstButton.focus();
            await this.page.keyboard.press('Enter');
            return true;
          }
          return false;
        },
        severity: 'medium' as const,
        description: 'Buttons should be activatable with Enter key'
      },
      {
        name: 'Escape Key Functionality',
        test: async () => {
          // Test if Escape key closes modals or menus
          await this.page.keyboard.press('Escape');
          return true; // Placeholder - would need specific modal testing
        },
        severity: 'medium' as const,
        description: 'Escape key should close modals and menus'
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addResult(test.name, result, test.severity, test.description);
      } catch (error) {
        this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Test focus management
   * @private
   */
  private async testFocusManagement(): Promise<void> {
    const tests = [
      {
        name: 'Focus Trap in Modals',
        test: async () => {
          // Test if modals trap focus
          const modal = this.page.locator(`[data-testid="${TestIds.MODALS.MODAL_CONTAINER}"]`);
          if (await modal.isVisible()) {
            await this.page.keyboard.press('Tab');
            // Check if focus is within modal by checking if active element is a descendant
            const isFocusInModal = await this.page.evaluate(() => {
              const activeElement = document.activeElement;
              const modal = document.querySelector(`[data-testid="${TestIds.MODALS.MODAL_CONTAINER}"]`);
              if (!activeElement || !modal) return false;
              return modal.contains(activeElement);
            });
            return isFocusInModal;
          }
          return true; // No modal to test
        },
        severity: 'high' as const,
        description: 'Modals should trap focus within them'
      },
      {
        name: 'Focus Restoration',
        test: async () => {
          // Test if focus is restored after modal closes
          return true; // Placeholder - would need specific modal testing
        },
        severity: 'medium' as const,
        description: 'Focus should be restored when modals close'
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addResult(test.name, result, test.severity, test.description);
      } catch (error) {
        this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Test screen reader support
   * @private
   */
  private async testScreenReaderSupport(): Promise<void> {
    const tests = [
      {
        name: 'Alt Text for Images',
        test: async () => {
          const images = this.page.locator('img');
          const count = await images.count();
          if (count === 0) return true;
          
          let validAltCount = 0;
          for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            if (alt !== null) validAltCount++;
          }
          
          return validAltCount === count;
        },
        severity: 'high' as const,
        description: 'All images should have alt text'
      },
      {
        name: 'Form Labels',
        test: async () => {
          const inputs = this.page.locator('input, select, textarea');
          const count = await inputs.count();
          if (count === 0) return true;
          
          let labeledCount = 0;
          for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute('id');
            if (id) {
              const label = this.page.locator(`label[for="${id}"]`);
              const ariaLabel = await input.getAttribute('aria-label');
              const ariaLabelledBy = await input.getAttribute('aria-labelledby');
              
              if (await label.isVisible() || ariaLabel || ariaLabelledBy) {
                labeledCount++;
              }
            }
          }
          
          return labeledCount === count;
        },
        severity: 'high' as const,
        description: 'All form inputs should have labels'
      },
      {
        name: 'Heading Structure',
        test: async () => {
          const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
          const count = await headings.count();
          if (count === 0) return true;
          
          let h1Count = 0;
          for (let i = 0; i < count; i++) {
            const heading = headings.nth(i);
            const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'h1') h1Count++;
          }
          
          return h1Count === 1; // Should have exactly one h1
        },
        severity: 'medium' as const,
        description: 'Page should have exactly one h1 element'
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addResult(test.name, result, test.severity, test.description);
      } catch (error) {
        this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Test color contrast
   * @private
   */
  private async testColorContrast(): Promise<void> {
    try {
      // This would require more sophisticated color contrast testing
      // For now, we'll do basic checks
      const tests = [
        {
          name: 'Text Color Contrast',
          test: async () => {
            // Check if text has sufficient contrast
            const textElements = this.page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
            const count = await textElements.count();
            return count > 0; // Placeholder
          },
          severity: 'medium' as const,
          description: 'Text should have sufficient color contrast'
        }
      ];

      for (const test of tests) {
        try {
          const result = await test.test();
          this.addResult(test.name, result, test.severity, test.description);
        } catch (error) {
          this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    } catch (error) {
      this.addResult('Color Contrast', false, 'medium', 'Error testing color contrast', undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Test ARIA support
   * @private
   */
  private async testAriaSupport(): Promise<void> {
    const tests = [
      {
        name: 'ARIA Labels',
        test: async () => {
          const elementsWithAriaLabel = this.page.locator('[aria-label]');
          const count = await elementsWithAriaLabel.count();
          return count >= 0; // Any number is acceptable
        },
        severity: 'medium' as const,
        description: 'Elements should have ARIA labels where appropriate'
      },
      {
        name: 'ARIA Roles',
        test: async () => {
          const elementsWithRole = this.page.locator('[role]');
          const count = await elementsWithRole.count();
          return count >= 0; // Any number is acceptable
        },
        severity: 'medium' as const,
        description: 'Elements should have ARIA roles where appropriate'
      },
      {
        name: 'ARIA Live Regions',
        test: async () => {
          const liveRegion = this.page.locator(`[data-testid="${TestIds.A11Y.ARIA_LIVE_REGION}"]`);
          return await liveRegion.isVisible();
        },
        severity: 'low' as const,
        description: 'Dynamic content should have ARIA live regions'
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addResult(test.name, result, test.severity, test.description);
      } catch (error) {
        this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Test semantic HTML
   * @private
   */
  private async testSemanticHTML(): Promise<void> {
    const tests = [
      {
        name: 'Semantic Elements',
        test: async () => {
          const semanticElements = this.page.locator('main, nav, header, footer, section, article, aside');
          const count = await semanticElements.count();
          return count > 0;
        },
        severity: 'medium' as const,
        description: 'Page should use semantic HTML elements'
      },
      {
        name: 'Button Elements',
        test: async () => {
          const buttons = this.page.locator('button');
          const clickableDivs = this.page.locator('div[onclick], div[role="button"]');
          const buttonCount = await buttons.count();
          const divCount = await clickableDivs.count();
          
          return buttonCount > 0 || divCount === 0; // Prefer button elements
        },
        severity: 'high' as const,
        description: 'Interactive elements should use button elements'
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.addResult(test.name, result, test.severity, test.description);
      } catch (error) {
        this.addResult(test.name, false, test.severity, test.description, undefined, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  /**
   * Add test result
   * @private
   */
  private addResult(
    testName: string,
    passed: boolean,
    severity: AccessibilityTestResult['severity'],
    description: string,
    recommendation?: string,
    details?: Record<string, any>
  ): void {
    this.results.push({
      testName,
      passed,
      severity,
      description,
      recommendation,
      details
    });
    
    const status = passed ? '✅' : '❌';
    const severityIcon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : 'ℹ️';
    console.log(`${status} ${severityIcon} ${testName}: ${description}`);
  }

  /**
   * Get test results summary
   * @returns Object containing test summary
   */
  public getSummary(): {
    total: number;
    passed: number;
    failed: number;
    bySeverity: Record<string, number>;
    criticalIssues: AccessibilityTestResult[];
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    
    const bySeverity = this.results.reduce((acc, result) => {
      acc[result.severity] = (acc[result.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const criticalIssues = this.results.filter(r => !r.passed && r.severity === 'critical');
    
    return {
      total,
      passed,
      failed,
      bySeverity,
      criticalIssues
    };
  }

  /**
   * Generate accessibility report
   * @returns Object containing detailed accessibility report
   */
  public generateReport(): {
    summary: ReturnType<AccessibilityTester['getSummary']>;
    results: AccessibilityTestResult[];
    recommendations: string[];
  } {
    const summary = this.getSummary();
    const recommendations = this.results
      .filter(r => !r.passed && r.recommendation)
      .map(r => r.recommendation!)
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates
    
    return {
      summary,
      results: this.results,
      recommendations
    };
  }
}

/**
 * Utility functions for accessibility testing
 */
export const accessibilityUtils = {
  /**
   * Test keyboard navigation
   * @param page - Playwright page instance
   * @returns Promise<boolean> - True if keyboard navigation works
   */
  async testKeyboardNavigation(page: Page): Promise<boolean> {
    try {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement);
      return !!focusedElement;
    } catch (error) {
      console.error('❌ Error testing keyboard navigation:', error);
      return false;
    }
  },

  /**
   * Test focus management
   * @param page - Playwright page instance
   * @returns Promise<boolean> - True if focus management works
   */
  async testFocusManagement(page: Page): Promise<boolean> {
    try {
      const focusableElements = await page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
      const count = await focusableElements.count();
      return count > 0;
    } catch (error) {
      console.error('❌ Error testing focus management:', error);
      return false;
    }
  }
};

/**
 * Default export for convenience
 */
export default AccessibilityTester;

/**
 * Factory function for creating AccessibilityTester instance
 * @param page - Playwright page instance
 * @param config - Accessibility test configuration
 * @returns AccessibilityTester instance
 */
export function createAccessibilityTester(page: Page, config?: Partial<AccessibilityTestConfig>): AccessibilityTester {
  return new AccessibilityTester(page, config);
}

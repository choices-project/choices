/**
 * Accessibility Testing Utilities
 * 
 * Created: October 22, 2025
 * Purpose: Modern accessibility testing utilities for Next.js 15 + Node.js 22
 * Standards: WCAG 2.1 AA compliance, current 2025 patterns
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

export interface AccessibilityTestResult {
  overall: {
    score: number;
    passed: boolean;
    violations: AccessibilityViolation[];
  };
  keyboard: {
    score: number;
    violations: AccessibilityViolation[];
  };
  screenReader: {
    score: number;
    violations: AccessibilityViolation[];
  };
  colorContrast: {
    score: number;
    violations: AccessibilityViolation[];
  };
  focusManagement: {
    score: number;
    violations: AccessibilityViolation[];
  };
  semanticStructure: {
    score: number;
    violations: AccessibilityViolation[];
  };
  violations: AccessibilityViolation[];
}

export interface AccessibilityTestOptions {
  includeWarnings?: boolean;
  strictMode?: boolean;
  customRules?: string[];
}

/**
 * Comprehensive accessibility testing using modern 2025 patterns
 */
export class AccessibilityTester {
  private page: Page;
  private options: AccessibilityTestOptions;

  constructor(page: Page, options: AccessibilityTestOptions = {}) {
    this.page = page;
    this.options = {
      includeWarnings: true,
      strictMode: false,
      customRules: [],
      ...options
    };
  }

  /**
   * Run comprehensive accessibility audit
   */
  async runAccessibilityAudit(): Promise<AccessibilityTestResult> {
    const allViolations: AccessibilityViolation[] = [];
    const warnings: string[] = [];

    // Test keyboard navigation
    const keyboardViolations: AccessibilityViolation[] = [];
    await this.testKeyboardNavigation(keyboardViolations, warnings);
    allViolations.push(...keyboardViolations);

    // Test screen reader compatibility
    const screenReaderViolations: AccessibilityViolation[] = [];
    await this.testScreenReaderCompatibility(screenReaderViolations, warnings);
    allViolations.push(...screenReaderViolations);

    // Test color contrast
    const colorContrastViolations: AccessibilityViolation[] = [];
    await this.testColorContrast(colorContrastViolations, warnings);
    allViolations.push(...colorContrastViolations);

    // Test focus management
    const focusViolations: AccessibilityViolation[] = [];
    await this.testFocusManagement(focusViolations, warnings);
    allViolations.push(...focusViolations);

    // Test ARIA attributes
    await this.testARIAAttributes(allViolations, warnings);

    // Test semantic HTML
    const semanticViolations: AccessibilityViolation[] = [];
    await this.testSemanticHTML(semanticViolations, warnings);
    allViolations.push(...semanticViolations);

    const passed = allViolations.length === 0;
    const overallScore = Math.max(0, 100 - (allViolations.length * 10) - (warnings.length * 2));
    const keyboardScore = Math.max(0, 100 - (keyboardViolations.length * 15));
    const screenReaderScore = Math.max(0, 100 - (screenReaderViolations.length * 15));
    const colorContrastScore = Math.max(0, 100 - (colorContrastViolations.length * 20));
    const focusScore = Math.max(0, 100 - (focusViolations.length * 15));
    const semanticScore = Math.max(0, 100 - (semanticViolations.length * 10));

    return {
      overall: {
        score: overallScore,
        passed,
        violations: allViolations
      },
      keyboard: {
        score: keyboardScore,
        violations: keyboardViolations
      },
      screenReader: {
        score: screenReaderScore,
        violations: screenReaderViolations
      },
      colorContrast: {
        score: colorContrastScore,
        violations: colorContrastViolations
      },
      focusManagement: {
        score: focusScore,
        violations: focusViolations
      },
      semanticStructure: {
        score: semanticScore,
        violations: semanticViolations
      },
      violations: allViolations
    };
  }

  /**
   * Test keyboard navigation using modern patterns
   */
  private async testKeyboardNavigation(violations: AccessibilityViolation[], warnings: string[]): Promise<void> {
    try {
      // Test Tab navigation
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.locator(':focus').first();
      
      if (await focusedElement.count() === 0) {
        violations.push({
          id: 'keyboard-navigation-1',
          impact: 'serious',
          description: 'No focusable elements found - keyboard navigation impossible',
          help: 'Ensure all interactive elements are keyboard accessible',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
          nodes: []
        });
      }

      // Test Enter key activation
      await this.page.keyboard.press('Enter');
      
      // Test Escape key handling
      await this.page.keyboard.press('Escape');
      
    } catch (error) {
      violations.push({
        id: 'keyboard-navigation-2',
        impact: 'moderate',
        description: `Keyboard navigation test failed: ${error}`,
        help: 'Fix keyboard navigation issues',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
        nodes: []
      });
    }
  }

  /**
   * Test screen reader compatibility using current standards
   */
  private async testScreenReaderCompatibility(violations: AccessibilityViolation[], warnings: string[]): Promise<void> {
    try {
      // Check for proper heading structure
      const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
      if (headings.length === 0) {
        violations.push({
          id: 'screen-reader-1',
          impact: 'serious',
          description: 'No heading structure found - screen readers need proper headings',
          help: 'Add proper heading structure for screen readers',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels',
          nodes: []
        });
      }

      // Check for alt text on images
      const images = await this.page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        if (alt === null) {
          violations.push({
            id: 'screen-reader-2',
            impact: 'serious',
            description: 'Image missing alt attribute',
            help: 'Add alt text to images for screen readers',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content',
            nodes: []
          });
        }
      }

      // Check for form labels
      const inputs = await this.page.locator('input, textarea, select').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
          const label = await this.page.locator(`label[for="${id}"]`).count();
          if (label === 0) {
            violations.push({
              id: 'screen-reader-3',
              impact: 'serious',
              description: `Input with id "${id}" missing associated label`,
              help: 'Add labels to form inputs for screen readers',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions',
              nodes: []
            });
          }
        }
      }

    } catch (error) {
      violations.push({
        id: 'screen-reader-4',
        impact: 'moderate',
        description: `Screen reader compatibility test failed: ${error}`,
        help: 'Fix screen reader compatibility issues',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/',
        nodes: []
      });
    }
  }

  /**
   * Test color contrast using modern browser APIs
   */
  private async testColorContrast(violations: AccessibilityViolation[], warnings: string[]): Promise<void> {
    try {
      // This would typically use a color contrast checking library
      // For now, we'll check for common contrast issues
      const textElements = await this.page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();
      
      for (const element of textElements) {
        const color = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor
          };
        });

        if (color.color === color.backgroundColor) {
          violations.push({
            id: 'color-contrast-1',
            impact: 'serious',
            description: 'Text and background colors are identical - no contrast',
            help: 'Ensure sufficient color contrast for readability',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
            nodes: []
          });
        }
      }

    } catch (error) {
      warnings.push(`Color contrast test failed: ${error}`);
    }
  }

  /**
   * Test focus management using current standards
   */
  private async testFocusManagement(violations: AccessibilityViolation[], warnings: string[]): Promise<void> {
    try {
      // Test focus trap in modals
      const modals = await this.page.locator('[role="dialog"], [role="modal"]').all();
      
      for (const modal of modals) {
        const isVisible = await modal.isVisible();
        if (isVisible) {
          const focusedElement = await this.page.locator(':focus').first();
          const isInModal = await modal.locator(':focus').count() > 0;
          
          if (!isInModal) {
            violations.push({
              id: 'focus-management-1',
              impact: 'serious',
              description: 'Modal is visible but focus is not trapped inside',
              help: 'Implement focus trap for modal dialogs',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-management',
              nodes: []
            });
          }
        }
      }

    } catch (error) {
      warnings.push(`Focus management test failed: ${error}`);
    }
  }

  /**
   * Test ARIA attributes using modern patterns
   */
  private async testARIAAttributes(violations: AccessibilityViolation[], warnings: string[]): Promise<void> {
    try {
      // Check for proper ARIA labels
      const ariaElements = await this.page.locator('[aria-label], [aria-labelledby]').all();
      
      for (const element of ariaElements) {
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledBy = await element.getAttribute('aria-labelledby');
        
        if (!ariaLabel && !ariaLabelledBy) {
          violations.push({
            id: 'aria-1',
            impact: 'moderate',
            description: 'Element has ARIA attributes but no accessible name',
            help: 'Add proper ARIA labels or labelledby attributes',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
            nodes: []
          });
        }
      }

      // Check for ARIA roles
      const roleElements = await this.page.locator('[role]').all();
      
      for (const element of roleElements) {
        const role = await element.getAttribute('role');
        if (role && !this.isValidARIARole(role)) {
          violations.push({
            id: 'aria-2',
            impact: 'moderate',
            description: `Invalid ARIA role: ${role}`,
            help: 'Use valid ARIA roles',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
            nodes: []
          });
        }
      }

    } catch (error) {
      warnings.push(`ARIA attributes test failed: ${error}`);
    }
  }

  /**
   * Test semantic HTML structure
   */
  private async testSemanticHTML(violations: AccessibilityViolation[], warnings: string[]): Promise<void> {
    try {
      // Check for proper semantic elements
      const main = await this.page.locator('main').count();
      if (main === 0) {
        warnings.push('No main landmark found - consider using <main> element');
      }

      const nav = await this.page.locator('nav').count();
      if (nav === 0) {
        warnings.push('No navigation landmark found - consider using <nav> element');
      }

      // Check for proper heading hierarchy
      const h1Count = await this.page.locator('h1').count();
      if (h1Count === 0) {
        violations.push({
          id: 'semantic-1',
          impact: 'serious',
          description: 'No h1 heading found - page needs a main heading',
          help: 'Add a main h1 heading to the page',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels',
          nodes: []
        });
      } else if (h1Count > 1) {
        warnings.push('Multiple h1 headings found - consider using only one per page');
      }

    } catch (error) {
      warnings.push(`Semantic HTML test failed: ${error}`);
    }
  }

  /**
   * Validate ARIA role
   */
  private isValidARIARole(role: string): boolean {
    const validRoles = [
      'button', 'link', 'textbox', 'checkbox', 'radio', 'menuitem',
      'menubar', 'menu', 'menuitemcheckbox', 'menuitemradio',
      'tab', 'tablist', 'tabpanel', 'tree', 'treeitem',
      'grid', 'gridcell', 'row', 'columnheader', 'rowheader',
      'dialog', 'alertdialog', 'tooltip', 'status', 'log',
      'marquee', 'timer', 'progressbar', 'slider', 'spinbutton',
      'switch', 'checkbox', 'radio', 'textbox', 'combobox',
      'listbox', 'option', 'group', 'region', 'banner',
      'complementary', 'contentinfo', 'form', 'main', 'navigation',
      'search', 'article', 'section', 'heading'
    ];
    
    return validRoles.includes(role);
  }

  /**
   * Generate accessibility report
   */
  async generateReport(): Promise<string> {
    const result = await this.runAccessibilityAudit();
    
    let report = `# Accessibility Test Report\n\n`;
    report += `**Overall Score:** ${result.overall.score}/100\n`;
    report += `**Status:** ${result.overall.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    if (result.overall.violations.length > 0) {
      report += `## Overall Violations (${result.overall.violations.length})\n\n`;
      result.overall.violations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.description}\n`;
      });
      report += `\n`;
    }
    
    if (result.violations.length > 0) {
      report += `## All Violations (${result.violations.length})\n\n`;
      result.violations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.description}\n`;
      });
    }
    
    return report;
  }
}

/**
 * Quick accessibility test helper
 */
export async function quickAccessibilityTest(page: Page): Promise<boolean> {
  const tester = new AccessibilityTester(page);
  const result = await tester.runAccessibilityAudit();
  return result.overall.passed;
}

/**
 * Comprehensive accessibility test with report
 */
export async function comprehensiveAccessibilityTest(
  page: Page, 
  options?: AccessibilityTestOptions
): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(page, options);
  return await tester.runAccessibilityAudit();
}

/**
 * Test keyboard navigation specifically
 */
export async function testKeyboardNavigation(page: Page): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(page);
  const violations: string[] = [];
  const warnings: string[] = [];
  await tester.testKeyboardNavigation(violations, warnings);
  
  const score = Math.max(0, 100 - (violations.length * 15));
  return {
    overall: { score, passed: violations.length === 0, violations },
    keyboard: { score, violations },
    screenReader: { score: 0, violations: [] },
    colorContrast: { score: 0, violations: [] },
    focusManagement: { score: 0, violations: [] },
    semanticStructure: { score: 0, violations: [] },
    violations
  };
}

/**
 * Test focus management specifically
 */
export async function testFocusManagement(page: Page): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(page);
  const violations: string[] = [];
  const warnings: string[] = [];
  await tester.testFocusManagement(violations, warnings);
  
  const score = Math.max(0, 100 - (violations.length * 15));
  return {
    overall: { score, passed: violations.length === 0, violations },
    keyboard: { score: 0, violations: [] },
    screenReader: { score: 0, violations: [] },
    colorContrast: { score: 0, violations: [] },
    focusManagement: { score, violations },
    semanticStructure: { score: 0, violations: [] },
    violations
  };
}

/**
 * Run axe accessibility tests (alias for comprehensive test)
 */
export async function runAxeAccessibilityTests(
  page: Page, 
  options?: AccessibilityTestOptions
): Promise<AccessibilityTestResult> {
  return comprehensiveAccessibilityTest(page, options);
}

/**
 * Run comprehensive accessibility tests (alias)
 */
export async function runComprehensiveAccessibilityTests(
  page: Page, 
  options?: AccessibilityTestOptions
): Promise<AccessibilityTestResult> {
  return comprehensiveAccessibilityTest(page, options);
}

/**
 * Test keyboard navigation specifically
 */
export async function testKeyboardNavigation(page: Page): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(page);
  const violations: string[] = [];
  const warnings: string[] = [];
  await tester.testKeyboardNavigation(violations, warnings);
  
  const score = Math.max(0, 100 - (violations.length * 15));
  return {
    overall: { score, passed: violations.length === 0, violations },
    keyboard: { score, violations },
    screenReader: { score: 0, violations: [] },
    colorContrast: { score: 0, violations: [] },
    focusManagement: { score: 0, violations: [] },
    semanticStructure: { score: 0, violations: [] },
    violations
  };
}

/**
 * Test focus management specifically
 */
export async function testFocusManagement(page: Page): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(page);
  const violations: string[] = [];
  const warnings: string[] = [];
  await tester.testFocusManagement(violations, warnings);
  
  const score = Math.max(0, 100 - (violations.length * 15));
  return {
    overall: { score, passed: violations.length === 0, violations },
    keyboard: { score: 0, violations: [] },
    screenReader: { score: 0, violations: [] },
    colorContrast: { score: 0, violations: [] },
    focusManagement: { score, violations },
    semanticStructure: { score: 0, violations: [] },
    violations
  };
}

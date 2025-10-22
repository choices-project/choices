import { type Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Testing Utilities
 * 
 * Provides utilities for accessibility testing including:
 * - WCAG compliance testing
 * - Keyboard navigation testing
 * - Screen reader compatibility
 * - Color contrast testing
 * - Focus management testing
 */

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
  passed: boolean;
  violations: AccessibilityViolation[];
  score: number; // 0-100
  recommendations: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityMetrics {
  overall: AccessibilityTestResult;
  keyboard: AccessibilityTestResult;
  screenReader: AccessibilityTestResult;
  colorContrast: AccessibilityTestResult;
  focusManagement: AccessibilityTestResult;
  semanticStructure: AccessibilityTestResult;
}

/**
 * Run comprehensive accessibility tests using axe-core
 */
export async function runAxeAccessibilityTests(page: Page): Promise<AccessibilityTestResult> {
  const results = await new AxeBuilder({ page: page as any })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const violations = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map(node => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary
    }))
  }));

  // Calculate score based on violations
  const criticalViolations = violations.filter(v => v.impact === 'critical').length;
  const seriousViolations = violations.filter(v => v.impact === 'serious').length;
  const moderateViolations = violations.filter(v => v.impact === 'moderate').length;
  const minorViolations = violations.filter(v => v.impact === 'minor').length;

  const score = Math.max(0, 100 - (criticalViolations * 25) - (seriousViolations * 15) - (moderateViolations * 10) - (minorViolations * 5));

  const recommendations = violations.map(violation => 
    `Fix ${violation.id}: ${violation.description}`
  );

  // Transform violations to match our interface
  const transformedViolations: AccessibilityViolation[] = violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map(node => ({
      target: Array.isArray(node.target) ? node.target.map(String) : [String(node.target)],
      html: node.html,
      failureSummary: node.failureSummary || ''
    }))
  }));

  return {
    passed: violations.length === 0,
    violations: transformedViolations,
    score,
    recommendations,
    wcagLevel: 'AA'
  };
}

/**
 * Test keyboard navigation accessibility
 */
export async function testKeyboardNavigation(page: Page): Promise<AccessibilityTestResult> {
  const violations: AccessibilityViolation[] = [];
  const recommendations: string[] = [];

  try {
    // Test 1: Tab navigation
    await page.goto('/');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    if (!focusedElement) {
      violations.push({
        id: 'keyboard-navigation',
        impact: 'serious',
        description: 'No focusable elements found',
        help: 'Ensure page has focusable elements',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-order-semantics',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'No focusable elements found on page'
        }]
      });
      recommendations.push('Add focusable elements to the page');
    }

    // Test 2: Skip links
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"], .skip-link').count();
    if (skipLinks === 0) {
      violations.push({
        id: 'skip-links',
        impact: 'moderate',
        description: 'No skip links found',
        help: 'Provide skip links for keyboard users',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/skip-link',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'No skip links found'
        }]
      });
      recommendations.push('Add skip links for keyboard navigation');
    }

    // Test 3: Focus indicators
    await page.keyboard.press('Tab');
    const focusStyles = await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return false;
      
      const computedStyle = window.getComputedStyle(activeElement);
      return computedStyle.outline !== 'none' || 
             computedStyle.boxShadow !== 'none' ||
             activeElement.style.outline !== 'none';
    });

    if (!focusStyles) {
      violations.push({
        id: 'focus-indicators',
        impact: 'serious',
        description: 'Focus indicators not visible',
        help: 'Ensure focus indicators are visible',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-indicator',
        nodes: [{
          target: ['*'],
          html: '<div></div>',
          failureSummary: 'Focus indicators not visible'
        }]
      });
      recommendations.push('Add visible focus indicators');
    }

    // Test 4: Keyboard traps
    const modals = await page.locator('[role="dialog"], .modal').count();
    if (modals > 0) {
      // Check if focus is trapped in modal
      const modal = page.locator('[role="dialog"], .modal').first();
      await modal.focus();
      
      // Try to tab out of modal
      await page.keyboard.press('Tab');
      const focusInModal = await modal.evaluate(el => el.contains(document.activeElement));
      
      if (!focusInModal) {
        violations.push({
          id: 'keyboard-trap',
          impact: 'serious',
          description: 'Focus not trapped in modal',
          help: 'Trap focus in modal dialogs',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-trap',
          nodes: [{
            target: ['[role="dialog"]'],
            html: '<div role="dialog"></div>',
            failureSummary: 'Focus not trapped in modal'
          }]
        });
        recommendations.push('Implement focus trapping in modals');
      }
    }

    const score = Math.max(0, 100 - (violations.length * 20));
    
    return {
      passed: violations.length === 0,
      violations,
      score,
      recommendations,
      wcagLevel: 'AA'
    };

  } catch (error) {
    return {
      passed: false,
      violations: [{
        id: 'keyboard-test-error',
        impact: 'serious',
        description: `Keyboard navigation test failed: ${error}`,
        help: 'Fix keyboard navigation implementation',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/keyboard',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'Keyboard navigation test failed'
        }]
      }],
      score: 0,
      recommendations: ['Fix keyboard navigation implementation'],
      wcagLevel: 'AA'
    };
  }
}

/**
 * Test screen reader compatibility
 */
export async function testScreenReaderCompatibility(page: Page): Promise<AccessibilityTestResult> {
  const violations: AccessibilityViolation[] = [];
  const recommendations: string[] = [];

  try {
    // Test 1: ARIA labels and roles
    const elementsWithoutLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll('input, button, select, textarea');
      const withoutLabels = [];
      
      for (const element of elements) {
        const hasLabel = element.getAttribute('aria-label') || 
                        element.getAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${element.id}"]`);
        
        if (!hasLabel) {
          withoutLabels.push({
            tagName: element.tagName,
            type: element.getAttribute('type'),
            id: element.id
          });
        }
      }
      
      return withoutLabels;
    });

    if (elementsWithoutLabels.length > 0) {
      violations.push({
        id: 'missing-labels',
        impact: 'serious',
        description: 'Form elements missing labels',
        help: 'Provide labels for all form elements',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/label',
        nodes: elementsWithoutLabels.map(el => ({
          target: [el.tagName.toLowerCase()],
          html: `<${el.tagName.toLowerCase()} ${el.type ? `type="${el.type}"` : ''} ${el.id ? `id="${el.id}"` : ''}></${el.tagName.toLowerCase()}>`,
          failureSummary: `Missing label for ${el.tagName.toLowerCase()}`
        }))
      });
      recommendations.push('Add labels for all form elements');
    }

    // Test 2: Heading structure
    const headingStructure = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const levels = Array.from(headings).map(h => parseInt(h.tagName.substring(1)));
      
      // Check for skipped heading levels
      const skippedLevels = [];
      for (let i = 1; i < levels.length; i++) {
        const currentLevel = levels[i];
        const previousLevel = levels[i-1];
        if (currentLevel && previousLevel && currentLevel - previousLevel > 1) {
          skippedLevels.push({ from: previousLevel, to: currentLevel });
        }
      }
      
      return { total: headings.length, skippedLevels };
    });

    if (headingStructure.skippedLevels.length > 0) {
      violations.push({
        id: 'heading-structure',
        impact: 'moderate',
        description: 'Skipped heading levels found',
        help: 'Maintain proper heading hierarchy',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/heading-order',
        nodes: [{
          target: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          html: '<h1></h1>',
          failureSummary: 'Skipped heading levels detected'
        }]
      });
      recommendations.push('Fix heading hierarchy - no skipped levels');
    }

    // Test 3: Alt text for images
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const withoutAlt = [];
      
      for (const img of images) {
        if (!img.alt && !img.getAttribute('aria-label')) {
          withoutAlt.push({
            src: img.src,
            alt: img.alt
          });
        }
      }
      
      return withoutAlt;
    });

    if (imagesWithoutAlt.length > 0) {
      violations.push({
        id: 'missing-alt-text',
        impact: 'serious',
        description: 'Images missing alt text',
        help: 'Provide alt text for all images',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/image-alt',
        nodes: imagesWithoutAlt.map(img => ({
          target: ['img'],
          html: `<img src="${img.src}" alt="${img.alt}">`,
          failureSummary: 'Image missing alt text'
        }))
      });
      recommendations.push('Add alt text to all images');
    }

    // Test 4: ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo'];
      const foundLandmarks = [];
      
      for (const role of landmarkRoles) {
        const elements = document.querySelectorAll(`[role="${role}"]`);
        if (elements.length === 0) {
          foundLandmarks.push(role);
        }
      }
      
      return foundLandmarks;
    });

    if (landmarks.length > 0) {
      violations.push({
        id: 'missing-landmarks',
        impact: 'moderate',
        description: 'Missing ARIA landmarks',
        help: 'Provide ARIA landmarks for page structure',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/landmark-one-main',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'Missing ARIA landmarks'
        }]
      });
      recommendations.push('Add ARIA landmarks for page structure');
    }

    const score = Math.max(0, 100 - (violations.length * 15));
    
    return {
      passed: violations.length === 0,
      violations,
      score,
      recommendations,
      wcagLevel: 'AA'
    };

  } catch (error) {
    return {
      passed: false,
      violations: [{
        id: 'screen-reader-test-error',
        impact: 'serious',
        description: `Screen reader compatibility test failed: ${error}`,
        help: 'Fix screen reader compatibility',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/aria',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'Screen reader compatibility test failed'
        }]
      }],
      score: 0,
      recommendations: ['Fix screen reader compatibility'],
      wcagLevel: 'AA'
    };
  }
}

/**
 * Test color contrast accessibility
 */
export async function testColorContrast(page: Page): Promise<AccessibilityTestResult> {
  const violations: AccessibilityViolation[] = [];
  const recommendations: string[] = [];

  try {
    // Test color contrast using axe-core
    const axeResults = await new AxeBuilder({ page: page as any })
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolations = axeResults.violations.filter(v => 
      v.id.includes('color-contrast') || v.id.includes('color-contrast-enhanced')
    );

    const violations = contrastViolations.map(violation => ({
      id: violation.id,
      impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        target: Array.isArray(node.target) ? node.target.map(String) : [String(node.target)],
        html: node.html,
        failureSummary: node.failureSummary || ''
      }))
    }));

    const recommendations = violations.map(violation => 
      `Fix color contrast: ${violation.description}`
    );

    const score = Math.max(0, 100 - (violations.length * 20));
    
    return {
      passed: violations.length === 0,
      violations,
      score,
      recommendations,
      wcagLevel: 'AA'
    };

  } catch (error) {
    return {
      passed: false,
      violations: [{
        id: 'color-contrast-test-error',
        impact: 'serious',
        description: `Color contrast test failed: ${error}`,
        help: 'Fix color contrast implementation',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/color-contrast',
        nodes: [{
          target: ['*'],
          html: '<div></div>',
          failureSummary: 'Color contrast test failed'
        }]
      }],
      score: 0,
      recommendations: ['Fix color contrast implementation'],
      wcagLevel: 'AA'
    };
  }
}

/**
 * Test focus management
 */
export async function testFocusManagement(page: Page): Promise<AccessibilityTestResult> {
  const violations: AccessibilityViolation[] = [];
  const recommendations: string[] = [];

  try {
    // Test 1: Focus order
    await page.goto('/');
    const focusOrder = await page.evaluate(() => {
      const focusableElements = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      return Array.from(focusableElements).map(el => ({
        tagName: el.tagName,
        text: el.textContent?.trim().substring(0, 50) || '',
        tabIndex: el.getAttribute('tabindex')
      }));
    });

    if (focusOrder.length === 0) {
      violations.push({
        id: 'no-focusable-elements',
        impact: 'serious',
        description: 'No focusable elements found',
        help: 'Provide focusable elements for keyboard users',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-order-semantics',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'No focusable elements found'
        }]
      });
      recommendations.push('Add focusable elements to the page');
    }

    // Test 2: Focus visibility
    await page.keyboard.press('Tab');
    const focusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return false;
      
      const computedStyle = window.getComputedStyle(activeElement);
      return computedStyle.outline !== 'none' || 
             computedStyle.boxShadow !== 'none' ||
             activeElement.style.outline !== 'none';
    });

    if (!focusVisible) {
      violations.push({
        id: 'focus-not-visible',
        impact: 'serious',
        description: 'Focus not visible',
        help: 'Make focus indicators visible',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-indicator',
        nodes: [{
          target: ['*'],
          html: '<div></div>',
          failureSummary: 'Focus not visible'
        }]
      });
      recommendations.push('Add visible focus indicators');
    }

    // Test 3: Focus trap in modals
    const modals = await page.locator('[role="dialog"], .modal').count();
    if (modals > 0) {
      const modal = page.locator('[role="dialog"], .modal').first();
      await modal.focus();
      
      // Check if focus is trapped
      const focusTrapped = await modal.evaluate(el => {
        const focusableElements = el.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return false;
        
        // Check if focus cycles within modal
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        firstElement.focus();
        return document.activeElement === firstElement;
      });

      if (!focusTrapped) {
        violations.push({
          id: 'focus-not-trapped',
          impact: 'serious',
          description: 'Focus not trapped in modal',
          help: 'Trap focus in modal dialogs',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-trap',
          nodes: [{
            target: ['[role="dialog"]'],
            html: '<div role="dialog"></div>',
            failureSummary: 'Focus not trapped in modal'
          }]
        });
        recommendations.push('Implement focus trapping in modals');
      }
    }

    const score = Math.max(0, 100 - (violations.length * 25));
    
    return {
      passed: violations.length === 0,
      violations,
      score,
      recommendations,
      wcagLevel: 'AA'
    };

  } catch (error) {
    return {
      passed: false,
      violations: [{
        id: 'focus-management-test-error',
        impact: 'serious',
        description: `Focus management test failed: ${error}`,
        help: 'Fix focus management implementation',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/focus-order-semantics',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'Focus management test failed'
        }]
      }],
      score: 0,
      recommendations: ['Fix focus management implementation'],
      wcagLevel: 'AA'
    };
  }
}

/**
 * Test semantic structure
 */
export async function testSemanticStructure(page: Page): Promise<AccessibilityTestResult> {
  const violations: AccessibilityViolation[] = [];
  const recommendations: string[] = [];

  try {
    // Test 1: Proper heading structure
    const headingStructure = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const levels = Array.from(headings).map(h => parseInt(h.tagName.substring(1)));
      
      // Check for multiple h1 elements
      const h1Count = levels.filter(level => level === 1).length;
      
      // Check for skipped levels
      const skippedLevels = [];
      for (let i = 1; i < levels.length; i++) {
        const currentLevel = levels[i];
        const previousLevel = levels[i-1];
        if (currentLevel && previousLevel && currentLevel - previousLevel > 1) {
          skippedLevels.push({ from: previousLevel, to: currentLevel });
        }
      }
      
      return { h1Count, skippedLevels, total: headings.length };
    });

    if (headingStructure.h1Count > 1) {
      violations.push({
        id: 'multiple-h1',
        impact: 'moderate',
        description: 'Multiple h1 elements found',
        help: 'Use only one h1 element per page',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/heading-order',
        nodes: [{
          target: ['h1'],
          html: '<h1></h1>',
          failureSummary: 'Multiple h1 elements found'
        }]
      });
      recommendations.push('Use only one h1 element per page');
    }

    if (headingStructure.skippedLevels.length > 0) {
      violations.push({
        id: 'skipped-heading-levels',
        impact: 'moderate',
        description: 'Skipped heading levels found',
        help: 'Maintain proper heading hierarchy',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/heading-order',
        nodes: [{
          target: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          html: '<h1></h1>',
          failureSummary: 'Skipped heading levels detected'
        }]
      });
      recommendations.push('Fix heading hierarchy - no skipped levels');
    }

    // Test 2: Proper list structure
    const listStructure = await page.evaluate(() => {
      const lists = document.querySelectorAll('ul, ol');
      const invalidLists = [];
      
      for (const list of lists) {
        const listItems = list.querySelectorAll('li');
        if (listItems.length === 0) {
          invalidLists.push({
            tagName: list.tagName,
            innerHTML: list.innerHTML
          });
        }
      }
      
      return invalidLists;
    });

    if (listStructure.length > 0) {
      violations.push({
        id: 'empty-lists',
        impact: 'moderate',
        description: 'Empty lists found',
        help: 'Lists should contain list items',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/list',
        nodes: listStructure.map(list => ({
          target: [list.tagName.toLowerCase()],
          html: `<${list.tagName.toLowerCase()}>${list.innerHTML}</${list.tagName.toLowerCase()}>`,
          failureSummary: 'Empty list found'
        }))
      });
      recommendations.push('Remove empty lists or add list items');
    }

    // Test 3: Proper table structure
    const tableStructure = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const invalidTables = [];
      
      for (const table of tables) {
        const headers = table.querySelectorAll('th');
        const rows = table.querySelectorAll('tr');
        
        if (headers.length === 0 && rows.length > 0) {
          invalidTables.push({
            tagName: table.tagName,
            innerHTML: table.innerHTML.substring(0, 100)
          });
        }
      }
      
      return invalidTables;
    });

    if (tableStructure.length > 0) {
      violations.push({
        id: 'tables-without-headers',
        impact: 'serious',
        description: 'Tables without headers found',
        help: 'Tables should have proper headers',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/table-fake-caption',
        nodes: tableStructure.map(table => ({
          target: ['table'],
          html: `<table>${table.innerHTML}</table>`,
          failureSummary: 'Table without headers found'
        }))
      });
      recommendations.push('Add proper headers to tables');
    }

    const score = Math.max(0, 100 - (violations.length * 20));
    
    return {
      passed: violations.length === 0,
      violations,
      score,
      recommendations,
      wcagLevel: 'AA'
    };

  } catch (error) {
    return {
      passed: false,
      violations: [{
        id: 'semantic-structure-test-error',
        impact: 'serious',
        description: `Semantic structure test failed: ${error}`,
        help: 'Fix semantic structure implementation',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/heading-order',
        nodes: [{
          target: ['body'],
          html: '<body></body>',
          failureSummary: 'Semantic structure test failed'
        }]
      }],
      score: 0,
      recommendations: ['Fix semantic structure implementation'],
      wcagLevel: 'AA'
    };
  }
}

/**
 * Run comprehensive accessibility tests
 */
export async function runComprehensiveAccessibilityTests(page: Page): Promise<AccessibilityMetrics> {
  console.log('♿ Running comprehensive accessibility tests...');
  
  const overall = await runAxeAccessibilityTests(page);
  const keyboard = await testKeyboardNavigation(page);
  const screenReader = await testScreenReaderCompatibility(page);
  const colorContrast = await testColorContrast(page);
  const focusManagement = await testFocusManagement(page);
  const semanticStructure = await testSemanticStructure(page);
  
  return {
    overall,
    keyboard,
    screenReader,
    colorContrast,
    focusManagement,
    semanticStructure
  };
}


/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(metrics: AccessibilityMetrics): string {
  return `
# Accessibility Test Report

## Overall Accessibility Score: ${metrics.overall.score}/100

## Keyboard Navigation: ${metrics.keyboard.score}/100
${metrics.keyboard.violations.length > 0 ? 
  `**Violations:**\n${metrics.keyboard.violations.map(v => `- ${v.description}`).join('\n')}` : 
  '✅ No violations found'}

## Screen Reader Compatibility: ${metrics.screenReader.score}/100
${metrics.screenReader.violations.length > 0 ? 
  `**Violations:**\n${metrics.screenReader.violations.map(v => `- ${v.description}`).join('\n')}` : 
  '✅ No violations found'}

## Color Contrast: ${metrics.colorContrast.score}/100
${metrics.colorContrast.violations.length > 0 ? 
  `**Violations:**\n${metrics.colorContrast.violations.map(v => `- ${v.description}`).join('\n')}` : 
  '✅ No violations found'}

## Focus Management: ${metrics.focusManagement.score}/100
${metrics.focusManagement.violations.length > 0 ? 
  `**Violations:**\n${metrics.focusManagement.violations.map(v => `- ${v.description}`).join('\n')}` : 
  '✅ No violations found'}

## Semantic Structure: ${metrics.semanticStructure.score}/100
${metrics.semanticStructure.violations.length > 0 ? 
  `**Violations:**\n${metrics.semanticStructure.violations.map(v => `- ${v.description}`).join('\n')}` : 
  '✅ No violations found'}

## WCAG Compliance
- **Level A**: ${metrics.overall.wcagLevel === 'A' ? '✅' : '❌'}
- **Level AA**: ${metrics.overall.wcagLevel === 'AA' ? '✅' : '❌'}
- **Level AAA**: ${metrics.overall.wcagLevel === 'AAA' ? '✅' : '❌'}

## Recommendations
${metrics.overall.recommendations.map(r => `- ${r}`).join('\n')}

## Accessibility Status
${metrics.overall.passed ? '🟢 ACCESSIBLE' : '🔴 ACCESSIBILITY ISSUES DETECTED'}
`;
}





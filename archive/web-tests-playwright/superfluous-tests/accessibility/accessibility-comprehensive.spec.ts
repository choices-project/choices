import { test, expect } from '@playwright/test';
import { comprehensiveAccessibilityTest, AccessibilityTester } from '../accessibility-utils';

/**
 * Comprehensive Accessibility Test Suite
 * 
 * Runs all accessibility tests and generates a comprehensive report
 */
test.describe('Comprehensive Accessibility Tests', () => {
  
  test('should pass all accessibility tests', async ({ page }) => {
    console.log('♿ Starting comprehensive accessibility testing...');
    
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Generate and log accessibility report
    const tester = new AccessibilityTester(page);
    const report = await tester.generateReport();
    console.log(report);
    
    // Overall accessibility should be acceptable
    expect(metrics.overall.score).toBeGreaterThanOrEqual(80);
    
    // Log individual scores
    console.log(`\n📊 Accessibility Scores:`);
    console.log(`  Overall: ${metrics.overall.score}/100`);
    console.log(`  Keyboard Navigation: ${metrics.keyboard.score}/100`);
    console.log(`  Screen Reader: ${metrics.screenReader.score}/100`);
    console.log(`  Color Contrast: ${metrics.colorContrast.score}/100`);
    console.log(`  Focus Management: ${metrics.focusManagement.score}/100`);
    console.log(`  Semantic Structure: ${metrics.semanticStructure.score}/100`);
    
    // Check for critical accessibility issues
    const criticalIssues = metrics.violations.filter((violation) => 
      violation.impact === 'critical' || violation.impact === 'serious'
    );
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ACCESSIBILITY ISSUES DETECTED:');
      criticalIssues.forEach(issue => console.log(`  - ${issue.description}`));
    }
    
    // Accessibility status
    if (metrics.overall.passed) {
      console.log('\n🟢 ACCESSIBILITY STATUS: PASSED');
    } else {
      console.log('\n🔴 ACCESSIBILITY STATUS: FAILED');
      console.log(`Found ${metrics.overall.violations.length} accessibility issues`);
    }
  });
  
  test('should meet minimum accessibility standards', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Minimum accessibility standards
    const minScores = {
      overall: 80,
      keyboard: 80,
      screenReader: 80,
      colorContrast: 90,
      focusManagement: 80,
      semanticStructure: 80
    };
    
    // Check each accessibility area meets minimum standards
    expect(metrics.overall.score).toBeGreaterThanOrEqual(minScores.overall);
    expect(metrics.keyboard.score).toBeGreaterThanOrEqual(minScores.keyboard);
    expect(metrics.screenReader.score).toBeGreaterThanOrEqual(minScores.screenReader);
    expect(metrics.colorContrast.score).toBeGreaterThanOrEqual(minScores.colorContrast);
    expect(metrics.focusManagement.score).toBeGreaterThanOrEqual(minScores.focusManagement);
    expect(metrics.semanticStructure.score).toBeGreaterThanOrEqual(minScores.semanticStructure);
    
    console.log('✅ All accessibility areas meet minimum standards');
  });
  
  test('should have no critical accessibility violations', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Check for critical violations
    const criticalViolations = metrics.overall.violations.filter(violation => 
      violation.impact === 'critical'
    );
    
    expect(criticalViolations.length).toBe(0);
    
    if (criticalViolations.length === 0) {
      console.log('✅ No critical accessibility violations found');
    } else {
      console.log('🚨 Critical accessibility violations found:');
      criticalViolations.forEach(violation => console.log(`  - ${violation.description}`));
    }
  });
  
  test('should meet WCAG 2.1 AA compliance', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // WCAG 2.1 AA compliance requires high scores
    expect(metrics.overall.score).toBeGreaterThanOrEqual(90);
    expect(metrics.colorContrast.score).toBeGreaterThanOrEqual(95);
    expect(metrics.keyboard.score).toBeGreaterThanOrEqual(90);
    expect(metrics.screenReader.score).toBeGreaterThanOrEqual(90);
    
    console.log('✅ WCAG 2.1 AA compliance achieved');
  });
  
  test('should have proper semantic structure', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Semantic structure should be excellent
    expect(metrics.semanticStructure.score).toBeGreaterThanOrEqual(85);
    
    if (metrics.semanticStructure.violations.length > 0) {
      console.log('⚠️ Semantic structure issues found:');
      metrics.semanticStructure.violations.forEach(violation => {
        console.log(`  - ${violation.description}`);
      });
    } else {
      console.log('✅ Semantic structure is excellent');
    }
  });
  
  test('should have excellent keyboard navigation', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Keyboard navigation should be excellent
    expect(metrics.keyboard.score).toBeGreaterThanOrEqual(85);
    
    if (metrics.keyboard.violations.length > 0) {
      console.log('⚠️ Keyboard navigation issues found:');
      metrics.keyboard.violations.forEach(violation => {
        console.log(`  - ${violation.description}`);
      });
    } else {
      console.log('✅ Keyboard navigation is excellent');
    }
  });
  
  test('should have excellent screen reader support', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Screen reader support should be excellent
    expect(metrics.screenReader.score).toBeGreaterThanOrEqual(85);
    
    if (metrics.screenReader.violations.length > 0) {
      console.log('⚠️ Screen reader support issues found:');
      metrics.screenReader.violations.forEach(violation => {
        console.log(`  - ${violation.description}`);
      });
    } else {
      console.log('✅ Screen reader support is excellent');
    }
  });
  
  test('should have excellent color contrast', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Color contrast should be excellent
    expect(metrics.colorContrast.score).toBeGreaterThanOrEqual(95);
    
    if (metrics.colorContrast.violations.length > 0) {
      console.log('⚠️ Color contrast issues found:');
      metrics.colorContrast.violations.forEach(violation => {
        console.log(`  - ${violation.description}`);
      });
    } else {
      console.log('✅ Color contrast is excellent');
    }
  });
  
  test('should have excellent focus management', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    
    // Focus management should be excellent
    expect(metrics.focusManagement.score).toBeGreaterThanOrEqual(85);
    
    if (metrics.focusManagement.violations.length > 0) {
      console.log('⚠️ Focus management issues found:');
      metrics.focusManagement.violations.forEach(violation => {
        console.log(`  - ${violation.description}`);
      });
    } else {
      console.log('✅ Focus management is excellent');
    }
  });
  
  test('should generate accessibility report', async ({ page }) => {
    const metrics = await comprehensiveAccessibilityTest(page);
    const tester = new AccessibilityTester(page);
    const report = await tester.generateReport();
    
    // Report should contain all necessary information
    expect(report).toContain('Accessibility Test Report');
    expect(report).toContain('Overall Accessibility Score');
    expect(report).toContain('Keyboard Navigation');
    expect(report).toContain('Screen Reader Compatibility');
    expect(report).toContain('Color Contrast');
    expect(report).toContain('Focus Management');
    expect(report).toContain('Semantic Structure');
    expect(report).toContain('WCAG Compliance');
    expect(report).toContain('Recommendations');
    expect(report).toContain('Accessibility Status');
    
    console.log('✅ Accessibility report generated successfully');
  });
});





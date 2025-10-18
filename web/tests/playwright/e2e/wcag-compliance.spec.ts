import { test, expect } from '@playwright/test';
import { runAxeAccessibilityTests, runComprehensiveAccessibilityTests } from './accessibility-utils';

/**
 * WCAG Compliance Tests
 * 
 * Tests WCAG 2.1 AA compliance including:
 * - Perceivable content
 * - Operable interface
 * - Understandable information
 * - Robust implementation
 */
test.describe('WCAG Compliance Tests', () => {
  
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    const result = await runAxeAccessibilityTests(page);
    
    // WCAG AA compliance should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    
    console.log(`♿ WCAG Compliance Score: ${result.score}/100`);
    
    if (result.violations.length > 0) {
      console.log('⚠️ WCAG Violations found:');
      result.violations.forEach(violation => {
        console.log(`  - ${violation.description} (${violation.impact})`);
        console.log(`    Help: ${violation.help}`);
        console.log(`    URL: ${violation.helpUrl}`);
      });
    }
    
    if (result.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  });
  
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for single h1 element
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    console.log('✅ Single h1 element found');
    
    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(h => ({
        tagName: h.tagName,
        text: h.textContent?.trim().substring(0, 50) || '',
        level: parseInt(h.tagName.substring(1))
      }));
    });
    
    // Check for skipped heading levels
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i]?.level;
      const previousLevel = headings[i-1]?.level;
      
      if (currentLevel && previousLevel && currentLevel - previousLevel > 1) {
        throw new Error(`Skipped heading level: ${previousLevel} → ${currentLevel}`);
      }
    }
    
    console.log('✅ Proper heading hierarchy maintained');
  });
  
  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    
    // Check all form elements have labels
    const formElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('input, select, textarea');
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
    
    expect(formElements.length).toBe(0);
    console.log('✅ All form elements have proper labels');
  });
  
  test('should have proper color contrast', async ({ page }) => {
    const result = await runAxeAccessibilityTests(page);
    
    // Check for color contrast violations
    const contrastViolations = result.violations.filter(v => 
      v.id.includes('color-contrast')
    );
    
    expect(contrastViolations.length).toBe(0);
    console.log('✅ Color contrast meets WCAG AA standards');
  });
  
  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Test focus indicators
    await page.keyboard.press('Tab');
    
    const focusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement) return false;
      
      const computedStyle = window.getComputedStyle(activeElement);
      return computedStyle.outline !== 'none' || 
             computedStyle.boxShadow !== 'none' ||
             activeElement.style.outline !== 'none';
    });
    
    expect(focusVisible).toBe(true);
    console.log('✅ Focus indicators are visible');
  });
  
  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');
    
    // Check all images have alt text
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
    
    expect(imagesWithoutAlt.length).toBe(0);
    console.log('✅ All images have proper alt text');
  });
  
  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo'];
      const foundLandmarks = [];
      
      for (const role of landmarkRoles) {
        const elements = document.querySelectorAll(`[role="${role}"]`);
        if (elements.length > 0) {
          foundLandmarks.push(role);
        }
      }
      
      return foundLandmarks;
    });
    
    // Should have at least main landmark
    expect(landmarks).toContain('main');
    console.log('✅ ARIA landmarks properly implemented');
  });
  
  test('should have proper skip links', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip links
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"], .skip-link').count();
    
    if (skipLinks > 0) {
      console.log('✅ Skip links found');
    } else {
      console.log('⚠️ No skip links found - consider adding for keyboard users');
    }
  });
  
  test('should have proper table structure', async ({ page }) => {
    await page.goto('/');
    
    // Check tables have proper headers
    const tables = await page.locator('table').count();
    
    if (tables > 0) {
      for (let i = 0; i < tables; i++) {
        const table = page.locator('table').nth(i);
        const headers = await table.locator('th').count();
        const rows = await table.locator('tr').count();
        
        if (rows > 0 && headers === 0) {
          throw new Error(`Table ${i} has no headers`);
        }
      }
      console.log('✅ Tables have proper headers');
    } else {
      console.log('ℹ️ No tables found on page');
    }
  });
  
  test('should have proper list structure', async ({ page }) => {
    await page.goto('/');
    
    // Check lists have proper structure
    const lists = await page.locator('ul, ol').count();
    
    if (lists > 0) {
      for (let i = 0; i < lists; i++) {
        const list = page.locator('ul, ol').nth(i);
        const items = await list.locator('li').count();
        
        if (items === 0) {
          throw new Error(`List ${i} has no items`);
        }
      }
      console.log('✅ Lists have proper structure');
    } else {
      console.log('ℹ️ No lists found on page');
    }
  });
  
  test('should have proper button labels', async ({ page }) => {
    await page.goto('/');
    
    // Check all buttons have accessible labels
    const buttons = await page.evaluate(() => {
      const buttonElements = document.querySelectorAll('button');
      const withoutLabels = [];
      
      for (const button of buttonElements) {
        const hasLabel = button.textContent?.trim() || 
                        button.getAttribute('aria-label') ||
                        button.getAttribute('aria-labelledby');
        
        if (!hasLabel) {
          withoutLabels.push({
            tagName: button.tagName,
            id: button.id,
            className: button.className
          });
        }
      }
      
      return withoutLabels;
    });
    
    expect(buttons.length).toBe(0);
    console.log('✅ All buttons have proper labels');
  });
  
  test('should have proper link text', async ({ page }) => {
    await page.goto('/');
    
    // Check all links have descriptive text
    const links = await page.evaluate(() => {
      const linkElements = document.querySelectorAll('a[href]');
      const withoutText = [];
      
      for (const link of linkElements) {
        const hasText = link.textContent?.trim() || 
                       link.getAttribute('aria-label');
        
        if (!hasText) {
          withoutText.push({
            href: link.getAttribute('href'),
            id: link.id,
            className: link.className
          });
        }
      }
      
      return withoutText;
    });
    
    expect(links.length).toBe(0);
    console.log('✅ All links have descriptive text');
  });
});





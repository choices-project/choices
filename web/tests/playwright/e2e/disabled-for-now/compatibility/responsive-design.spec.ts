import { test, expect } from '@playwright/test';
import { testResponsiveDesign } from './cross-browser-utils';

/**
 * Responsive Design Tests
 * 
 * Tests responsive design across different viewport sizes and devices including:
 * - Mobile responsiveness
 * - Tablet responsiveness
 * - Desktop responsiveness
 * - Large screen responsiveness
 */
test.describe('Responsive Design Tests', () => {
  
  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
    console.log('✅ Mobile responsive design works');
  });
  
  test('should be responsive on tablet devices', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
    console.log('✅ Tablet responsive design works');
  });
  
  test('should be responsive on desktop devices', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 }); // Desktop
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
    console.log('✅ Desktop responsive design works');
  });
  
  test('should be responsive on large screens', async ({ page }) => {
    // Test large screen viewport
    await page.setViewportSize({ width: 1920, height: 1080 }); // Large Desktop
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
    console.log('✅ Large screen responsive design works');
  });
  
  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    expect(viewportMeta).toBeDefined();
    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1');
    
    console.log(`✅ Viewport meta tag: ${viewportMeta}`);
  });
  
  test('should have proper media queries', async ({ page }) => {
    await page.goto('/');
    
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop' },
      { width: 1920, height: 1080, name: 'Large Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if page is responsive
      const isResponsive = await page.evaluate(() => {
        const body = document.body;
        const bodyWidth = body.scrollWidth;
        const viewportWidth = window.innerWidth;
        
        return bodyWidth <= viewportWidth;
      });
      
      expect(isResponsive).toBe(true);
      console.log(`✅ Responsive at ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
  });
  
  test('should have proper touch targets on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for touch targets
    const touchTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
      const smallTargets = [];
      
      for (const element of interactiveElements) {
        const rect = element.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          smallTargets.push({
            tagName: element.tagName,
            width: rect.width,
            height: rect.height
          });
        }
      }
      
      return smallTargets;
    });
    
    // Touch targets should be at least 44px
    expect(touchTargets.length).toBe(0);
    console.log('✅ Touch targets are properly sized for mobile');
  });
  
  test('should have proper font sizes', async ({ page }) => {
    await page.goto('/');
    
    // Test font sizes at different viewports
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check font sizes
      const fontSizes = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        const smallFonts = [];
        
        for (const element of elements) {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = parseFloat(computedStyle.fontSize);
          
          if (fontSize < 12) {
            smallFonts.push({
              tagName: element.tagName,
              fontSize
            });
          }
        }
        
        return smallFonts;
      });
      
      // Font sizes should be readable
      expect(fontSizes.length).toBe(0);
      console.log(`✅ Font sizes are readable at ${viewport.name}`);
    }
  });
  
  test('should have proper image responsiveness', async ({ page }) => {
    await page.goto('/');
    
    // Check for responsive images
    const images = await page.locator('img').count();
    
    if (images > 0) {
      for (let i = 0; i < images; i++) {
        const img = page.locator('img').nth(i);
        
        // Check for responsive image attributes
        const srcset = await img.getAttribute('srcset');
        const sizes = await img.getAttribute('sizes');
        
        if (srcset || sizes) {
          console.log(`✅ Image ${i + 1} has responsive attributes`);
        } else {
          console.log(`⚠️ Image ${i + 1} may not be responsive`);
        }
      }
    } else {
      console.log('ℹ️ No images found for responsiveness testing');
    }
  });
  
  test('should have proper navigation on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for mobile navigation
    const mobileNav = await page.locator('[data-testid="mobile-nav"], .mobile-nav, nav[aria-label="mobile"]').count();
    
    if (mobileNav > 0) {
      console.log('✅ Mobile navigation found');
    } else {
      console.log('⚠️ No mobile navigation found - consider adding for mobile users');
    }
  });
  
  test('should have proper form layout on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for forms
    const forms = await page.locator('form').count();
    
    if (forms > 0) {
      const form = page.locator('form').first();
      const inputs = await form.locator('input, select, textarea').count();
      
      if (inputs > 0) {
        // Check if form is mobile-friendly
        const isMobileFriendly = await page.evaluate(() => {
          const form = document.querySelector('form');
          if (!form) return true;
          
          const inputs = form.querySelectorAll('input, select, textarea');
          for (const input of inputs) {
            const rect = input.getBoundingClientRect();
            if (rect.width < 200) {
              return false;
            }
          }
          
          return true;
        });
        
        expect(isMobileFriendly).toBe(true);
        console.log('✅ Form layout is mobile-friendly');
      } else {
        console.log('ℹ️ No form inputs found for mobile testing');
      }
    } else {
      console.log('ℹ️ No forms found for mobile testing');
    }
  });
  
  test('should run comprehensive responsive design tests', async ({ page }) => {
    const result = await testResponsiveDesign(page);
    
    // Responsive design should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    
    console.log(`📱 Responsive Design Score: ${result.score}/100`);
    console.log(`📱 Browser: ${result.browser}`);
    
    if (result.issues.length > 0) {
      console.log('⚠️ Responsive Design Issues found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.recommendations.length > 0) {
      console.log('💡 Responsive Design Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  });
});





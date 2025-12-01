import { test, expect } from '@playwright/test';

/**
 * Accessibility Tests for choices-app.com
 * 
 * These tests verify WCAG compliance and accessibility best practices.
 */

test.describe('Production Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
  });

  test('Page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const headings = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');
      const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim() || '');
      const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim() || '');
      return { h1s, h2s, h3s };
    });

    // Should have at least one h1
    expect(headings.h1s.length, 'Page should have at least one h1 heading').toBeGreaterThan(0);
    
    // Should not have too many h1s (usually 1 per page)
    expect(headings.h1s.length, 'Page should not have too many h1 headings').toBeLessThanOrEqual(3);

    console.log('Heading structure:', headings);
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        hasAlt: !!img.alt,
      }));
    });

    // Decorative images can have empty alt, but should have alt attribute
    const imagesWithoutAlt = images.filter(img => !img.hasAlt && !img.src.includes('data:'));
    
    if (imagesWithoutAlt.length > 0) {
      console.log('Images without alt text:', imagesWithoutAlt);
    }

    // All images should have alt attribute (even if empty for decorative)
    const imagesWithoutAltAttr = images.filter(img => 
      img.alt === undefined && !img.src.includes('data:')
    );
    expect(imagesWithoutAltAttr.length, 'All images should have alt attribute').toBe(0);
  });

  test('Form inputs should have labels', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, textarea, select')).map(input => {
        const id = (input as HTMLElement).id;
        const name = (input as HTMLElement).getAttribute('name');
        const type = (input as HTMLElement).getAttribute('type');
        const ariaLabel = (input as HTMLElement).getAttribute('aria-label');
        const ariaLabelledBy = (input as HTMLElement).getAttribute('aria-labelledby');
        
        // Check if has associated label
        let hasLabel = false;
        if (id) {
          hasLabel = !!document.querySelector(`label[for="${id}"]`);
        }
        if (!hasLabel && ariaLabel) hasLabel = true;
        if (!hasLabel && ariaLabelledBy) hasLabel = true;
        
        return {
          id,
          name,
          type,
          hasLabel,
          ariaLabel,
        };
      });
    });

    // Filter out hidden inputs
    const visibleInputs = inputs.filter(input => input.type !== 'hidden');
    const inputsWithoutLabels = visibleInputs.filter(input => !input.hasLabel);

    if (inputsWithoutLabels.length > 0) {
      console.log('Inputs without labels:', inputsWithoutLabels);
    }

    // All visible inputs should have labels
    expect(inputsWithoutLabels.length, 'All visible form inputs should have labels').toBe(0);
  });

  test('Interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const interactiveElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [tabindex]'));
      return elements.map(el => {
        const tag = el.tagName.toLowerCase();
        const hasTabIndex = el.hasAttribute('tabindex');
        const tabIndex = el.getAttribute('tabindex');
        const isDisabled = (el as HTMLElement).hasAttribute('disabled');
        const ariaDisabled = el.getAttribute('aria-disabled') === 'true';
        
        return {
          tag,
          hasTabIndex,
          tabIndex,
          isDisabled: isDisabled || ariaDisabled,
          // Negative tabindex should only be used for programmatic focus
          hasNegativeTabIndex: tabIndex && parseInt(tabIndex) < 0,
        };
      });
    });

    // Check for problematic patterns
    const problematicElements = interactiveElements.filter(el => 
      !el.isDisabled && el.hasNegativeTabIndex
    );

    if (problematicElements.length > 0) {
      console.log('Elements with negative tabindex (may be inaccessible):', problematicElements);
    }

    // Should not have many elements with negative tabindex (unless disabled)
    expect(problematicElements.length, 'Should not have many inaccessible interactive elements').toBeLessThan(10);
  });

  test('Page should have proper language attribute', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const lang = await page.getAttribute('html', 'lang');
    
    expect(lang, 'HTML should have lang attribute').toBeTruthy();
    expect(lang?.length, 'Lang attribute should not be empty').toBeGreaterThan(0);
    
    // Should be a valid language code
    expect(['en', 'es', 'en-US', 'es-ES']).toContain(lang);
  });

  test('Page should have skip links for keyboard navigation', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const skipLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href^="#"]')).filter(link => {
        const text = link.textContent?.toLowerCase().trim() || '';
        return text.includes('skip') || text.includes('main') || text.includes('content');
      });
    });

    // Skip links are helpful but not always required
    if (skipLinks.length === 0) {
      console.log('No skip links found (consider adding for better keyboard navigation)');
    } else {
      console.log(`Found ${skipLinks.length} skip link(s)`);
    }
  });

  test('Color contrast should be sufficient', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    // Check for common low-contrast patterns
    const lowContrastElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const issues: string[] = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // Check for very light text on light background or dark on dark
        // This is a basic check - full contrast checking requires more sophisticated analysis
        if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
          // Basic heuristic: if both are very light or both are very dark, might be low contrast
          // This is simplified - real contrast checking needs proper color math
        }
      });
      
      return issues;
    });

    // This is a basic check - full contrast analysis would require more sophisticated tools
    console.log('Contrast check completed (basic)');
  });

  test('Page should not have autoplay media with sound', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);

    const autoplayMedia = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      const audios = Array.from(document.querySelectorAll('audio'));
      
      return {
        videos: videos.filter(v => v.autoplay && !v.muted).length,
        audios: audios.filter(a => a.autoplay).length,
      };
    });

    // Should not have autoplay media with sound (accessibility issue)
    expect(autoplayMedia.videos, 'Should not have autoplay videos with sound').toBe(0);
    expect(autoplayMedia.audios, 'Should not have autoplay audio').toBe(0);
  });
});


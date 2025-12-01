import { expect, test } from '@playwright/test';

/**
 * HTML Structure Tests
 * 
 * Verify the actual HTML being served matches what Next.js should generate
 */

test.describe('Choices App - HTML Structure', () => {
  test('should verify HTML structure matches Next.js expectations', async ({ page }) => {
    const response = await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    expect(response?.status()).toBe(200);
    
    await page.waitForTimeout(5000);
    
    // Get the raw HTML
    const html = await page.content();
    
    // Check for critical Next.js markers
    const structureCheck = await page.evaluate(() => {
      // Check for __NEXT_DATA__ script tag
      const nextDataScript = document.querySelector('script#__NEXT_DATA__');
      const nextDataContent = nextDataScript?.textContent;
      
      // Check for __next_f script
      const nextFScript = document.querySelector('script[src*="__next_f"]');
      
      // Check for React root
      const reactRoot = document.querySelector('#__next');
      
      // Check for body structure
      const body = document.body;
      const bodyChildren = Array.from(body.children);
      
      // Check for script tags
      const scripts = Array.from(document.scripts);
      const scriptSources = scripts.map(s => s.src || 'inline');
      
      return {
        hasNextDataScript: !!nextDataScript,
        nextDataLength: nextDataContent?.length || 0,
        nextDataPreview: nextDataContent?.substring(0, 200) || 'none',
        hasNextFScript: !!nextFScript,
        nextFScriptSrc: nextFScript?.getAttribute('src') || 'none',
        hasReactRoot: !!reactRoot,
        reactRootId: reactRoot?.id || 'none',
        bodyChildCount: bodyChildren.length,
        bodyChildIds: bodyChildren.map(c => c.id || c.tagName).join(', '),
        scriptCount: scripts.length,
        scriptSources: scriptSources.slice(0, 5),
      };
    });
    
    console.log('\n=== HTML STRUCTURE CHECK ===');
    console.log(JSON.stringify(structureCheck, null, 2));
    
    // Check if HTML contains expected content
    const htmlCheck = {
      hasNextDataInHTML: html.includes('__NEXT_DATA__'),
      hasNextFInHTML: html.includes('__next_f'),
      hasReactRootInHTML: html.includes('id="__next"'),
      hasBodyTag: html.includes('<body'),
      htmlLength: html.length,
      htmlPreview: html.substring(0, 500),
    };
    
    console.log('\n=== HTML CONTENT CHECK ===');
    console.log(JSON.stringify(htmlCheck, null, 2));
    
    // Check for error messages in HTML
    const errorCheck = {
      hasErrorInHTML: html.includes('error') || html.includes('Error'),
      hasFallbackInHTML: html.includes('fallback') || html.includes('Fallback'),
      hasStaticContent: html.includes('Authentication') && html.includes('Please log in'),
    };
    
    console.log('\n=== ERROR CHECK ===');
    console.log(JSON.stringify(errorCheck, null, 2));
    
    // Save HTML for inspection
    await page.screenshot({ path: 'test-results/html-structure.png', fullPage: true });
    
    expect(structureCheck.hasNextDataScript).toBe(true);
  });

  test('should check if auth page is server-rendered correctly', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);
    
    // Check server-side rendering
    const ssrCheck = await page.evaluate(() => {
      // Check if the page has server-rendered content
      const bodyText = document.body.textContent || '';
      const hasServerContent = bodyText.length > 100;
      
      // Check for hydration markers
      const hydrationErrors = document.querySelectorAll('[data-nextjs-hydration-error]');
      
      // Check if React has hydrated
      const reactHydrated = typeof (window as any).__REACT_HYDRATION__ !== 'undefined';
      
      // Check for Next.js page props
      const nextData = (window as any).__NEXT_DATA__;
      const hasPageProps = nextData?.props?.pageProps !== undefined;
      
      return {
        hasServerContent,
        bodyTextLength: bodyText.length,
        bodyTextPreview: bodyText.substring(0, 300),
        hydrationErrors: hydrationErrors.length,
        reactHydrated,
        hasPageProps,
        nextDataExists: !!nextData,
      };
    });
    
    console.log('\n=== SSR CHECK ===');
    console.log(JSON.stringify(ssrCheck, null, 2));
    
    // Check network requests for the page
    const networkCheck = await page.evaluate(() => {
      // This would need to be checked via network monitoring
      return {
        note: 'Check network tab for failed requests',
      };
    });
    
    console.log('\n=== NETWORK CHECK ===');
    console.log(JSON.stringify(networkCheck, null, 2));
    
    expect(ssrCheck.hasServerContent).toBe(true);
  });
});


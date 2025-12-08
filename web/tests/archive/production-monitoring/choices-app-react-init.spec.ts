import { expect, test } from '@playwright/test';

/**
 * React Initialization Tests
 * 
 * These tests verify that React is properly initializing in production
 * and identify what's preventing it from working.
 */

test.describe('Choices App - React Initialization', () => {
  test('should verify React providers are set up correctly', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(10000);
    
    // Check if Next.js Providers are present
    const providerCheck = await page.evaluate(() => {
      // Check for Next.js data
      const nextData = (window as any).__NEXT_DATA__;
      
      // Check for React root
      const reactRoot = document.querySelector('#__next');
      
      // Check for NextIntl provider
      const hasIntlProvider = typeof (window as any).__NEXT_INTL__ !== 'undefined';
      
      // Check for React Query provider
      const hasQueryProvider = typeof (window as any).__REACT_QUERY__ !== 'undefined';
      
      return {
        hasNextData: !!nextData,
        hasReactRoot: !!reactRoot,
        reactRootId: reactRoot?.id || 'none',
        hasIntlProvider,
        hasQueryProvider,
        nextDataPage: nextData?.page || 'unknown',
        nextDataProps: nextData?.props ? 'present' : 'missing',
      };
    });
    
    console.log('\n=== PROVIDER CHECK ===');
    console.log(JSON.stringify(providerCheck, null, 2));
    
    // Check for i18n errors
    const i18nCheck = await page.evaluate(() => {
      // Try to access next-intl
      try {
        // Check if messages are loaded
        const nextData = (window as any).__NEXT_DATA__;
        const props = nextData?.props?.pageProps;
        const hasMessages = props && typeof props === 'object';
        
        return {
          hasMessages,
          propsType: typeof props,
        };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : 'Unknown error',
        };
      }
    });
    
    console.log('i18n Check:', JSON.stringify(i18nCheck, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/react-init-check.png', fullPage: true });
    
    expect(providerCheck.hasNextData).toBe(true);
  });

  test('should check for JavaScript errors preventing React init', async ({ page }) => {
    const errors: Array<{ message: string; stack?: string }> = [];
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ message: msg.text() });
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
      });
    });
    
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(10000);
    
    console.log('\n=== JAVASCRIPT ERRORS ===');
    if (errors.length > 0) {
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.substring(0, 200)}...`);
        }
      });
    } else {
      console.log('No errors found');
    }
    
    console.log('\n=== WARNINGS ===');
    if (warnings.length > 0) {
      warnings.slice(0, 10).forEach((warning, i) => {
        console.log(`${i + 1}. ${warning.substring(0, 200)}`);
      });
    } else {
      console.log('No warnings found');
    }
    
    // Check if React is trying to initialize
    const reactInitCheck = await page.evaluate(() => {
      // Check for React-related globals
      const hasReact = typeof (window as any).React !== 'undefined';
      const hasReactDOM = typeof (window as any).ReactDOM !== 'undefined';
      
      // Check for React DevTools
      const hasDevTools = typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
      
      // Check for Next.js React
      const scripts = Array.from(document.scripts);
      const reactScripts = scripts.filter(s => 
        s.src.includes('react') || 
        s.src.includes('next') ||
        s.textContent?.includes('React')
      );
      
      return {
        hasReact,
        hasReactDOM,
        hasDevTools,
        reactScriptCount: reactScripts.length,
        totalScripts: scripts.length,
      };
    });
    
    console.log('\n=== REACT INIT CHECK ===');
    console.log(JSON.stringify(reactInitCheck, null, 2));
    
    expect(errors.length).toBe(0);
  });

  test('should verify auth page has correct layout structure', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(10000);
    
    // Check HTML structure
    const structureCheck = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const nextRoot = document.querySelector('#__next');
      
      return {
        hasHtml: !!html,
        hasBody: !!body,
        hasNextRoot: !!nextRoot,
        bodyChildren: body?.children.length || 0,
        nextRootChildren: nextRoot?.children.length || 0,
        bodyHTML: body?.innerHTML.substring(0, 500) || 'empty',
      };
    });
    
    console.log('\n=== STRUCTURE CHECK ===');
    console.log(JSON.stringify(structureCheck, null, 2));
    
    // Check if the page is server-rendered vs client-rendered
    const renderCheck = await page.evaluate(() => {
      // Check for hydration markers
      const hydrationErrors = document.querySelectorAll('[data-nextjs-hydration-error]');
      
      // Check for React component markers
      const reactComponents = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
      
      // Check if content is static HTML or React-rendered
      const hasStaticContent = document.body.textContent?.includes('Authentication') && 
                              document.body.textContent?.includes('Please log in');
      const hasReactContent = document.querySelector('[data-testid="auth-hydrated"]') !== null;
      
      return {
        hydrationErrors: hydrationErrors.length,
        reactComponents: reactComponents.length,
        hasStaticContent,
        hasReactContent,
        isServerRendered: hasStaticContent && !hasReactContent,
      };
    });
    
    console.log('\n=== RENDER CHECK ===');
    console.log(JSON.stringify(renderCheck, null, 2));
    
    expect(structureCheck.hasNextRoot).toBe(true);
  });
});


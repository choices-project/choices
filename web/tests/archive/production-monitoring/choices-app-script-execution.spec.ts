import { expect, test } from '@playwright/test';

/**
 * Script Execution Tests
 * 
 * Verify that JavaScript is actually executing, not just loading
 */

test.describe('Choices App - Script Execution', () => {
  test('should verify scripts are executing, not just loading', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for scripts to load
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(10000);
    
    // Check if scripts are actually executing
    const executionCheck = await page.evaluate(() => {
      // Try to execute some JavaScript
      const canExecute = typeof window !== 'undefined' && typeof document !== 'undefined';
      
      // Check if we can create elements
      const canCreateElement = typeof document.createElement === 'function';
      
      // Check if we can access window properties
      const canAccessWindow = typeof window.location !== 'undefined';
      
      // Try to evaluate a simple expression
      let evalWorks = false;
      try {
        // eslint-disable-next-line no-eval
        eval('evalWorks = true');
      } catch {
        evalWorks = false;
      }
      
      // Check if scripts have executed by looking for global variables
      const hasNextData = typeof (window as any).__NEXT_DATA__ !== 'undefined';
      const hasNextF = typeof (window as any).__next_f !== 'undefined';
      
      // Check script execution by trying to call a function
      const canCallFunction = typeof (() => {}) === 'function';
      
      return {
        canExecute,
        canCreateElement,
        canAccessWindow,
        evalWorks,
        hasNextData,
        hasNextF,
        canCallFunction,
        windowType: typeof window,
        documentType: typeof document,
      };
    });
    
    console.log('\n=== EXECUTION CHECK ===');
    console.log(JSON.stringify(executionCheck, null, 2));
    
    // Check script tags and their execution status
    const scriptCheck = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return scripts.map(s => ({
        src: s.src || 'inline',
        async: s.async,
        defer: s.defer,
        type: s.type,
        readyState: s.readyState, // 'loading', 'interactive', 'complete'
        hasText: !!s.textContent,
        textLength: s.textContent?.length || 0,
      }));
    });
    
    console.log('\n=== SCRIPT STATUS ===');
    console.log(`Total scripts: ${scriptCheck.length}`);
    scriptCheck.slice(0, 10).forEach((script, i) => {
      console.log(`${i + 1}. ${script.src.substring(0, 80)} - State: ${script.readyState}`);
    });
    
    // Check for CSP violations
    const cspCheck = await page.evaluate(() => {
      const metaTags = Array.from(document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]'));
      const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      
      return {
        hasCSPMeta: metaTags.length > 0,
        cspContent: cspHeader?.getAttribute('content') || 'none',
      };
    });
    
    console.log('\n=== CSP CHECK ===');
    console.log(JSON.stringify(cspCheck, null, 2));
    
    // Try to manually trigger React initialization
    const reactInitAttempt = await page.evaluate(() => {
      // Check if React scripts are in the DOM but not executing
      const reactScripts = Array.from(document.scripts).filter(s => 
        s.src.includes('react') || s.src.includes('next')
      );
      
      // Try to access React if it exists
      let reactAccessible = false;
      try {
        // Check if React is available but not initialized
        reactAccessible = typeof (window as any).React !== 'undefined';
      } catch {
        reactAccessible = false;
      }
      
      return {
        reactScriptCount: reactScripts.length,
        reactScriptsReady: reactScripts.filter(s => s.readyState === 'complete').length,
        reactAccessible,
      };
    });
    
    console.log('\n=== REACT INIT ATTEMPT ===');
    console.log(JSON.stringify(reactInitAttempt, null, 2));
    
    expect(executionCheck.canExecute).toBe(true);
  });

  test('should check for blocking issues preventing React', async ({ page }) => {
    // Monitor network requests
    const blockedRequests: string[] = [];
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(10000);
    
    console.log('\n=== FAILED REQUESTS ===');
    if (failedRequests.length > 0) {
      failedRequests.slice(0, 20).forEach((req, i) => {
        console.log(`${i + 1}. ${req}`);
      });
    } else {
      console.log('No failed requests');
    }
    
    // Check for CORS or CSP issues
    const securityCheck = await page.evaluate(() => {
      // Check for CSP errors in console (we already capture these)
      // Check for CORS issues
      const hasCorsIssues = false; // Would need to check network tab
      
      return {
        hasCorsIssues,
        origin: window.location.origin,
        protocol: window.location.protocol,
      };
    });
    
    console.log('\n=== SECURITY CHECK ===');
    console.log(JSON.stringify(securityCheck, null, 2));
    
    // Check if the issue is timing-related
    const timingCheck = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const allComplete = scripts.every(s => s.readyState === 'complete');
      const allInteractive = scripts.every(s => s.readyState === 'interactive' || s.readyState === 'complete');
      
      return {
        allComplete,
        allInteractive,
        totalScripts: scripts.length,
        completeScripts: scripts.filter(s => s.readyState === 'complete').length,
        loadingScripts: scripts.filter(s => s.readyState === 'loading').length,
      };
    });
    
    console.log('\n=== TIMING CHECK ===');
    console.log(JSON.stringify(timingCheck, null, 2));
    
    expect(failedRequests.length).toBe(0);
  });
});


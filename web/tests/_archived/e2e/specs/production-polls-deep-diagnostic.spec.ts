import { test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Polls Page Deep Diagnostic', () => {
  test('deep diagnostic - check all state and warnings', async ({ page }) => {
    test.setTimeout(180_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    // Collect all console messages
    const consoleMessages: Array<{ type: string; text: string }> = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleInfo: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      consoleMessages.push({ type, text });
      
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      } else if (type === 'info' || type === 'log') {
        consoleInfo.push(text);
      }
    });

    await ensureLoggedOut(page);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    await waitForPageReady(page);

    // Navigate to polls page
    await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait and check state multiple times
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1_000);
      
      const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 500 }).catch(() => false);
      const mountSpinner = await page.locator('[data-testid="polls-loading-mount"]').isVisible({ timeout: 500 }).catch(() => false);
      const dataSpinner = await page.locator('[data-testid="polls-loading-data"]').isVisible({ timeout: 500 }).catch(() => false);
      const hasContent = await page.locator('body').textContent().then(text => {
        return text && text.length > 200 && !text.includes('Loading') && !text.includes('Something went wrong');
      }).catch(() => false);
      
      console.log(`Check ${i + 1}: spinner=${spinnerVisible}, mountSpinner=${mountSpinner}, dataSpinner=${dataSpinner}, hasContent=${hasContent}`);
      
      if (!spinnerVisible && hasContent) {
        console.log('Page loaded successfully!');
        break;
      }
    }
    
    // Final state check
    const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const mountSpinner = await page.locator('[data-testid="polls-loading-mount"]').isVisible({ timeout: 500 }).catch(() => false);
    const dataSpinner = await page.locator('[data-testid="polls-loading-data"]').isVisible({ timeout: 500 }).catch(() => false);
    
    // Check for polls page specific content
    // We check for the container AND that it's not one of the loading spinners
    const pollsContainer = page.locator('.container.mx-auto.px-4.py-8').filter({
      hasNot: page.locator('[data-testid="polls-loading-mount"], [data-testid="polls-loading-data"]')
    });
    const hasPollsContainer = await pollsContainer.isVisible({ timeout: 2_000 }).catch(() => false);
    const pollsContent = await pollsContainer.textContent().catch(() => '');
    const hasContent = hasPollsContainer && pollsContent && pollsContent.length > 50;
    
    const bodyText = await page.locator('body').textContent().catch(() => '') ?? '';
    
    // Check React state
    // Next.js App Router may not use #__next, so check multiple indicators
    const reactState = await page.evaluate(() => {
      const hasNextRoot = !!document.querySelector('#__next');
      const hasNextDiv = !!document.querySelector('[id*="__next"]');
      const hasReactContent = document.body.querySelector('[data-reactroot], [data-react], [class*="react"]');
      // React is likely mounted if we have substantial body content
      const hasSubstantialContent = document.body.children.length > 5 && document.body.textContent && document.body.textContent.length > 1000;
      
      return {
        readyState: document.readyState,
        hasReactRoot: hasNextRoot || hasNextDiv || !!hasReactContent || hasSubstantialContent,
        hasNextRootId: hasNextRoot,
        hasNextDiv: hasNextDiv,
        hasReactContent: !!hasReactContent,
        hasSubstantialContent,
        bodyChildren: document.body.children.length,
        bodyTextLength: document.body.textContent?.length || 0,
        hasSpinner: !!document.querySelector('.animate-spin'),
      };
    }).catch(() => null);
    
    // Log all findings
    console.log('\n=== DEEP DIAGNOSTIC RESULTS ===');
    console.log('Current URL:', page.url());
    console.log('Spinner Visible:', spinnerVisible);
    console.log('Mount Spinner (isMounted=false):', mountSpinner);
    console.log('Data Spinner (isLoading=true):', dataSpinner);
    console.log('Has Polls Container:', hasPollsContainer);
    console.log('Has Content:', hasContent);
    console.log('Polls Content Length:', pollsContent?.length || 0);
    console.log('Body Text Length:', bodyText?.length || 0);
    console.log('React State:', reactState);
    console.log('\nConsole Messages Count:', consoleMessages.length);
    console.log('  Errors:', consoleErrors.length);
    console.log('  Warnings:', consoleWarnings.length);
    console.log('  Info:', consoleInfo.length);
    
    if (consoleWarnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      consoleWarnings.forEach((warn, i) => {
        console.log(`${i + 1}. ${warn}`);
      });
    }
    
    if (consoleInfo.length > 0) {
      console.log('\n=== CONSOLE INFO MESSAGES ===');
      consoleInfo.forEach((info, i) => {
        console.log(`${i + 1}. ${info}`);
      });
    }
    
    // Also show all console messages for debugging
    const allLogMessages = consoleMessages.filter(m => m.type === 'log' || m.type === 'info');
    if (allLogMessages.length > 0) {
      console.log('\n=== ALL CONSOLE LOG/INFO MESSAGES ===');
      allLogMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      });
    }
    
    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/polls-deep-diagnostic.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/polls-deep-diagnostic.png');
    
    // Check if page has any error boundaries or error messages
    const errorElements = await page.locator('[role="alert"], [data-testid*="error"], .error, [class*="error"]').all();
    if (errorElements.length > 0) {
      console.log('\n=== ERROR ELEMENTS FOUND ===');
      for (const elem of errorElements.slice(0, 5)) {
        const text = await elem.textContent().catch(() => '');
        if (text) console.log(`  - ${text.substring(0, 100)}`);
      }
    }
  });
});


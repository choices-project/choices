import { test, expect } from '@playwright/test';

/**
 * Detailed Hydration Mismatch Capture
 * 
 * This test captures the exact DOM structure at the moment of hydration error
 * to identify the precise mismatch between server and client HTML.
 */

test.describe('Detailed Hydration Mismatch Capture', () => {
  test.beforeEach(async ({ context, page }) => {
    // Set up E2E bypass for testing
    await context.addCookies([
      {
        name: 'e2e-dashboard-bypass',
        value: '1',
        domain: '.choices-app.com',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'None',
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem('e2e-dashboard-bypass', '1');
    });
  });

  test('capture exact DOM structure at hydration error', async ({ page }) => {
    const hydrationErrors: Array<{
      message: string;
      timestamp: number;
      domSnapshot: any;
      bailoutTemplates: any[];
    }> = [];

    // Capture hydration errors with full DOM context
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('185') || text.includes('hydration') || text.includes('Hydration')) {
        const timestamp = Date.now();
        page.evaluate(() => {
          const appShell = document.querySelector('[data-testid="app-shell"]');
          const dashboardContent = document.querySelector('[data-testid="dashboard-content"]') || 
                                   document.querySelector('[data-testid="dashboard-loading-skeleton"]');
          const bailoutTemplates = Array.from(document.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]'));
          
          return {
            appShell: appShell ? {
              tagName: appShell.tagName,
              className: appShell.className,
              children: Array.from(appShell.children).map(child => ({
                tagName: child.tagName,
                className: child.className,
                id: child.id,
                dataTestId: child.getAttribute('data-testid'),
                hasBailoutTemplate: Boolean(child.querySelector('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')),
              })),
            } : null,
            dashboardContent: dashboardContent ? {
              tagName: dashboardContent.tagName,
              className: dashboardContent.className,
              innerHTML: dashboardContent.innerHTML.substring(0, 500),
            } : null,
            bailoutTemplates: bailoutTemplates.map(template => ({
              parentTag: template.parentElement?.tagName,
              parentClass: template.parentElement?.className,
              parentId: template.parentElement?.id,
              parentDataTestId: template.parentElement?.getAttribute('data-testid'),
              nextSibling: template.nextElementSibling?.tagName,
            })),
            bodyHTML: document.body.innerHTML.substring(0, 2000),
          };
        }).then(domSnapshot => {
          hydrationErrors.push({
            message: text,
            timestamp,
            domSnapshot,
            bailoutTemplates: domSnapshot.bailoutTemplates,
          });
        }).catch(() => {});
      }
    });

    page.on('pageerror', (error) => {
      if (error.message.includes('185') || error.message.includes('hydration')) {
        const timestamp = Date.now();
        page.evaluate(() => {
          return {
            appShell: document.querySelector('[data-testid="app-shell"]')?.outerHTML.substring(0, 1000),
            bodyHTML: document.body.innerHTML.substring(0, 2000),
          };
        }).then(domSnapshot => {
          hydrationErrors.push({
            message: error.message,
            timestamp,
            domSnapshot,
            bailoutTemplates: [],
          });
        }).catch(() => {});
      }
    });

    console.log('\n=== NAVIGATING TO DASHBOARD ===');
    await page.goto('https://www.choices-app.com/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait a bit for hydration to occur
    await page.waitForTimeout(3000);

    console.log('\n=== HYDRATION ERRORS CAPTURED ===');
    console.log(`Total hydration errors: ${hydrationErrors.length}`);

    if (hydrationErrors.length > 0) {
      hydrationErrors.forEach((error, index) => {
        console.log(`\n--- Error ${index + 1} ---`);
        console.log(`Message: ${error.message}`);
        console.log(`Timestamp: ${error.timestamp}`);
        console.log(`Bailout Templates: ${JSON.stringify(error.bailoutTemplates, null, 2)}`);
        console.log(`DOM Snapshot: ${JSON.stringify(error.domSnapshot, null, 2)}`);
      });
    }

    // Also capture the final DOM structure
    const finalDOM = await page.evaluate(() => {
      const appShell = document.querySelector('[data-testid="app-shell"]');
      const children = appShell ? Array.from(appShell.children) : [];
      
      return {
        appShellExists: Boolean(appShell),
        appShellChildren: children.map((child, index) => ({
          index,
          tagName: child.tagName,
          className: child.className,
          id: child.id,
          dataTestId: child.getAttribute('data-testid'),
          innerHTML: child.innerHTML.substring(0, 500),
          hasBailoutTemplate: Boolean(child.querySelector('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')),
        })),
        bailoutTemplates: Array.from(document.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')).map(t => ({
          parentTag: t.parentElement?.tagName,
          parentClass: t.parentElement?.className,
          parentDataTestId: t.parentElement?.getAttribute('data-testid'),
        })),
      };
    });

    console.log('\n=== FINAL DOM STRUCTURE ===');
    console.log(JSON.stringify(finalDOM, null, 2));

    // Don't fail - we're just capturing information
    expect(hydrationErrors.length).toBeGreaterThanOrEqual(0);
  });
});


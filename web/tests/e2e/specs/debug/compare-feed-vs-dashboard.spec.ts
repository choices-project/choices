import { test, expect } from '@playwright/test';

/**
 * Compare Feed vs Dashboard DOM Structure
 * 
 * This test compares the exact DOM structure of the working feed page
 * with the failing dashboard page to identify structural differences.
 */

test.describe('Feed vs Dashboard DOM Structure Comparison', () => {
  test.beforeEach(async ({ context, page }) => {
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

  test('compare feed and dashboard DOM structures', async ({ page }) => {
    // Test Feed Page (working)
    console.log('\n=== TESTING FEED PAGE (WORKING) ===');
    await page.goto('https://www.choices-app.com/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const feedDOM = await page.evaluate(() => {
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
          innerHTML: child.innerHTML.substring(0, 300),
          hasBailoutTemplate: Boolean(child.querySelector('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')),
          bailoutTemplateCount: child.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]').length,
        })),
        bailoutTemplates: Array.from(document.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')).map(t => ({
          parentTag: t.parentElement?.tagName,
          parentClass: t.parentElement?.className,
          parentDataTestId: t.parentElement?.getAttribute('data-testid'),
          parentIndex: appShell ? Array.from(appShell.children).indexOf(t.parentElement as Element) : -1,
        })),
      };
    });

    console.log('\n=== FEED PAGE DOM STRUCTURE ===');
    console.log(JSON.stringify(feedDOM, null, 2));

    // Test Dashboard Page (failing)
    console.log('\n=== TESTING DASHBOARD PAGE (FAILING) ===');
    await page.goto('https://www.choices-app.com/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const dashboardDOM = await page.evaluate(() => {
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
          innerHTML: child.innerHTML.substring(0, 300),
          hasBailoutTemplate: Boolean(child.querySelector('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')),
          bailoutTemplateCount: child.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]').length,
        })),
        bailoutTemplates: Array.from(document.querySelectorAll('template[data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"]')).map(t => ({
          parentTag: t.parentElement?.tagName,
          parentClass: t.parentElement?.className,
          parentDataTestId: t.parentElement?.getAttribute('data-testid'),
          parentIndex: appShell ? Array.from(appShell.children).indexOf(t.parentElement as Element) : -1,
        })),
      };
    });

    console.log('\n=== DASHBOARD PAGE DOM STRUCTURE ===');
    console.log(JSON.stringify(dashboardDOM, null, 2));

    // Compare structures
    console.log('\n=== COMPARISON ===');
    console.log(`Feed bailout templates: ${feedDOM.bailoutTemplates.length}`);
    console.log(`Dashboard bailout templates: ${dashboardDOM.bailoutTemplates.length}`);
    console.log(`Feed appShell children: ${feedDOM.appShellChildren.length}`);
    console.log(`Dashboard appShell children: ${dashboardDOM.appShellChildren.length}`);

    // Find differences
    const differences: string[] = [];
    
    if (feedDOM.appShellChildren.length !== dashboardDOM.appShellChildren.length) {
      differences.push(`Different number of appShell children: Feed=${feedDOM.appShellChildren.length}, Dashboard=${dashboardDOM.appShellChildren.length}`);
    }

    feedDOM.appShellChildren.forEach((feedChild, index) => {
      const dashboardChild = dashboardDOM.appShellChildren[index];
      if (!dashboardChild) {
        differences.push(`Feed has child at index ${index} but dashboard doesn't`);
        return;
      }
      if (feedChild.hasBailoutTemplate !== dashboardChild.hasBailoutTemplate) {
        differences.push(`Index ${index}: Feed hasBailoutTemplate=${feedChild.hasBailoutTemplate}, Dashboard=${dashboardChild.hasBailoutTemplate}`);
      }
      if (feedChild.bailoutTemplateCount !== dashboardChild.bailoutTemplateCount) {
        differences.push(`Index ${index}: Feed bailoutTemplateCount=${feedChild.bailoutTemplateCount}, Dashboard=${dashboardChild.bailoutTemplateCount}`);
      }
    });

    console.log('\n=== DIFFERENCES FOUND ===');
    differences.forEach(diff => console.log(`- ${diff}`));

    expect(differences.length).toBeGreaterThanOrEqual(0);
  });
});


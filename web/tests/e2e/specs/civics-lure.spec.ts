import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // First, wait for the HTML to be fully loaded with lang attribute
    // The root layout sets lang on the <html> element, so wait for that
    await page.waitForFunction(() => {
      const htmlElement = document.documentElement;
      const lang = htmlElement.getAttribute('lang');
      return lang !== null && lang.trim() !== '';
    }, { timeout: 10_000 });
    
    // Wait for React to hydrate and set document.title
    // The component's useEffect sets document.title, and the root layout provides default title
    await page.waitForFunction(() => {
      const title = document.title?.trim();
      return title && title !== '';
    }, { timeout: 30_000 });
    
    // Double-check that both are present
    const title = await page.title();
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    if (!title || !lang) {
      throw new Error(`Title or lang missing: title="${title}", lang="${lang}"`);
    }
    
    await waitForPageReady(page, 60_000);

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



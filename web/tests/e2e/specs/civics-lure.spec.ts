import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'networkidle', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    
    // Wait for React to fully hydrate and set both title and lang
    // The root layout provides lang in initial HTML, and the component's useEffect sets title
    // Wait for both to be present and non-empty
    await page.waitForFunction(
      () => {
        const title = document.title?.trim();
        const lang = document.documentElement.getAttribute('lang')?.trim();
        // Root layout provides default title, component may override it
        // Both should be present
        return title && title !== '' && lang && lang !== '';
      },
      { timeout: 30_000 }
    );
    
    // Verify both are present before running Axe
    const title = await page.title();
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    if (!title || !lang) {
      throw new Error(`Title or lang missing after wait: title="${title}", lang="${lang}"`);
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



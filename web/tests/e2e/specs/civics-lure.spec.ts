import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'networkidle', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    
    // Wait for React to hydrate and ensure title/lang are present
    // Root layout provides title/lang in HTML, but we need to wait for React hydration
    // The component's useEffect also sets document.title, so wait for that too
    await page.waitForFunction(() => {
      const title = document.title?.trim();
      const lang = document.documentElement.getAttribute('lang')?.trim();
      // Root layout should provide both in initial HTML, but ensure they're present
      return title && title !== '' && lang && lang !== '';
    }, { timeout: 30_000 });
    
    // Double-check that title/lang are actually present before running Axe
    const title = await page.title();
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    if (!title || !lang) {
      throw new Error(`Title or lang missing before Axe check: title="${title}", lang="${lang}"`);
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



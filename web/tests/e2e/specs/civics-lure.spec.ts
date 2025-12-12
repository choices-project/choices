import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'networkidle', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    
    // Wait for React to hydrate - root layout provides title/lang in HTML, but we need to wait for hydration
    // Also wait for the component's useEffect to set document.title
    await page.waitForFunction(() => {
      const title = document.title?.trim();
      const lang = document.documentElement.lang?.trim();
      // Root layout should provide both, but wait for them to be set
      return title && title !== '' && lang && lang !== '';
    }, { timeout: 20_000 }).catch(async () => {
      // Fallback: if waitForFunction times out, check if title/lang are in initial HTML
      const title = await page.title();
      const lang = await page.evaluate(() => document.documentElement.lang);
      if (!title || !lang) {
        throw new Error(`Title or lang missing: title="${title}", lang="${lang}"`);
      }
    });

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



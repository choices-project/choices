import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'networkidle', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    
    // Wait for React to hydrate and set title/lang (root layout provides them, but React needs to hydrate)
    await page.waitForFunction(() => {
      const hasTitle = document.title && document.title.trim() !== '';
      const hasLang = document.documentElement.lang && document.documentElement.lang.trim() !== '';
      return hasTitle && hasLang;
    }, { timeout: 15_000 });

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



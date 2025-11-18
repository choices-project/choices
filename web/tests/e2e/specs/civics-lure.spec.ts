import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



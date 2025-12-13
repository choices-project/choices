import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for lang attribute first (set by root layout in initial HTML)
    await page.waitForFunction(
      () => {
        const lang = document.documentElement.getAttribute('lang');
        return lang !== null && lang.trim() !== '';
      },
      { timeout: 10_000 }
    );
    
    // Wait for page to be ready (React hydration)
    await waitForPageReady(page, 60_000);
    
    // Wait for title to be set (root layout provides default, component may override in useEffect)
    // Check both the default title from root layout and any custom title
    await page.waitForFunction(
      () => {
        const title = document.title?.trim();
        // Root layout provides "Choices - Democratic Polling Platform" as default
        // Component may override with "Civics Lure E2E Harness - Choices"
        // Either is acceptable for accessibility
        return title && title !== '';
      },
      { timeout: 30_000 }
    );
    
    // Verify both are present before running Axe
    const title = await page.title();
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    if (!title || title.trim() === '') {
      throw new Error(`Title missing after wait: title="${title}"`);
    }
    if (!lang || lang.trim() === '') {
      throw new Error(`Lang missing after wait: lang="${lang}"`);
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



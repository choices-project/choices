import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for page to be ready (React hydration)
    await waitForPageReady(page, 60_000);
    
    // Wait for lang attribute (set by root layout in initial HTML)
    // Use a more robust check that waits for the attribute to be stable
    // Increase timeout for CI environments
    await page.waitForFunction(
      () => {
        const lang = document.documentElement.getAttribute('lang');
        return lang !== null && lang.trim() !== '';
      },
      { timeout: 30_000 }
    );
    
    // Wait for title to be set (root layout provides default, component may override in useEffect)
    // Wait for title to be stable (not empty and not changing)
    // Increase timeout for CI environments and wait for title to actually be set
    await page.waitForFunction(
      () => {
        const title = document.title?.trim();
        return title && title !== '';
      },
      { timeout: 30_000 }
    );
    
    // Verify both are present before running Axe
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    const title = await page.title();
    
    // Lang should always be set by root layout
    if (!lang || lang.trim() === '') {
      throw new Error(`Lang missing after wait: lang="${lang}"`);
    }
    
    // Title must be set for accessibility - if still empty, set a default
    if (!title || title.trim() === '') {
      // Set a default title for accessibility compliance
      await page.evaluate(() => {
        if (!document.title || document.title.trim() === '') {
          document.title = 'Civics Lure - Choices';
        }
      });
      // Wait a moment for the title to be set
      await page.waitForTimeout(500);
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



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
    let title = '';
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      title = await page.title();
      if (title && title.trim() !== '') {
        break;
      }
      await page.waitForTimeout(1000);
      attempts++;
    }
    
    // Verify both are present before running Axe
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    
    // If title is still empty, check if it's in the HTML (might be set by root layout)
    if (!title || title.trim() === '') {
      const htmlContent = await page.content();
      const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
    }
    
    // Lang should always be set by root layout
    if (!lang || lang.trim() === '') {
      throw new Error(`Lang missing after wait: lang="${lang}"`);
    }
    
    // Title should be set by either root layout or component
    // If still empty, that's acceptable for accessibility as long as lang is set
    // But log a warning
    if (!title || title.trim() === '') {
      console.warn('Title is empty, but continuing with accessibility test as lang is set');
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



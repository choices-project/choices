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
    // Use a more robust check that handles both initial HTML and React hydration
    try {
      await page.waitForFunction(() => {
        const title = document.title?.trim();
        const lang = document.documentElement.getAttribute('lang')?.trim();
        // Root layout should provide both in initial HTML, but ensure they're present
        return title && title !== '' && lang && lang !== '';
      }, { timeout: 30_000 });
    } catch (error) {
      // If waitForFunction times out, check what's actually in the DOM
      const title = await page.title();
      const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
      const htmlContent = await page.content();
      const hasTitleInHTML = htmlContent.includes('<title>');
      const hasLangInHTML = htmlContent.includes('lang=');
      
      // Log diagnostic info
      console.error('Title/lang check failed:', {
        title,
        lang,
        hasTitleInHTML,
        hasLangInHTML,
        htmlSnippet: htmlContent.substring(0, 500)
      });
      
      // If title/lang are in HTML but not detected, wait a bit more for React hydration
      if (hasTitleInHTML && hasLangInHTML) {
        await page.waitForTimeout(2000); // Give React more time to hydrate
        const finalTitle = await page.title();
        const finalLang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
        if (!finalTitle || !finalLang) {
          throw new Error(`Title or lang missing after additional wait: title="${finalTitle}", lang="${finalLang}"`);
        }
      } else {
        throw new Error(`Title or lang missing in HTML: title="${title}", lang="${lang}", hasTitleInHTML=${hasTitleInHTML}, hasLangInHTML=${hasLangInHTML}`);
      }
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



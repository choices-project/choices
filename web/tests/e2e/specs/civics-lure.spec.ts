import { expect, test } from '@playwright/test';

import { runAxeAudit } from '../helpers/accessibility';
import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('@axe Civics lure', () => {
  test('renders election countdown and surfaces live announcements', async ({ page }) => {
    await page.goto('/e2e/civics-lure', { waitUntil: 'networkidle', timeout: 60_000 });
    
    // Wait for page to be ready (React hydration)
    await waitForPageReady(page, 60_000);
    
    // Wait for lang attribute (set by root layout in initial HTML)
    // Use a more robust check that waits for the attribute to be stable
    await page.waitForFunction(
      () => {
        const lang = document.documentElement.getAttribute('lang');
        return lang !== null && lang.trim() !== '';
      },
      { timeout: 15_000 }
    );
    
    // Wait for title to be set (root layout provides default, component may override in useEffect)
    // Wait for title to be stable (not empty and not changing)
    await page.waitForFunction(
      () => {
        const title = document.title?.trim();
        // Root layout provides "Choices - Democratic Polling Platform" as default
        // Component may override with "Civics Lure E2E Harness - Choices"
        // Either is acceptable for accessibility
        return title && title !== '';
      },
      { timeout: 15_000 }
    );
    
    // Additional wait to ensure DOM is fully settled and attributes are stable
    await page.waitForTimeout(1000);
    
    // Verify both are present before running Axe
    const title = await page.title();
    const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    if (!title || title.trim() === '') {
      throw new Error(`Title missing after wait: title="${title}"`);
    }
    if (!lang || lang.trim() === '') {
      throw new Error(`Lang missing after wait: lang="${lang}"`);
    }

    // Double-check that title and lang are in the actual HTML before running Axe
    const htmlContent = await page.content();
    const hasTitleInHtml = /<title[^>]*>[\s\S]*?<\/title>/i.test(htmlContent);
    const hasLangInHtml = /<html[^>]*\s+lang\s*=/i.test(htmlContent);
    
    if (!hasTitleInHtml) {
      throw new Error('Title element not found in HTML');
    }
    if (!hasLangInHtml) {
      throw new Error('Lang attribute not found in HTML');
    }

    await runAxeAudit(page, 'civics lure page', {
      exclude: ['nextjs-portal', 'div[data-nextjs-toast-wrapper="true"]'],
    });

    await expect(page.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });
});



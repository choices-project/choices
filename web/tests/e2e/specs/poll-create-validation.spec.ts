import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('Poll creation validation', () => {
  test('blocks progression until required fields are satisfied', async ({ page }) => {
    await page.goto('/e2e/poll-create', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const nextButton = page.getByRole('button', { name: /^next$/i });
    await expect(nextButton).toBeDisabled();

    await page.fill('#poll-title-input', 'Quarterly budget priorities');
    await expect(nextButton).toBeDisabled();

    await page.fill('#poll-description-input', 'Help us decide where to focus investment next quarter.');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.getByRole('heading', { name: /response options/i, level: 3 })).toBeVisible();

    await nextButton.click();
    const optionError = page.getByRole('alert').filter({ hasText: /at least 2 options/i });
    await expect(optionError).toBeVisible();

    const optionInputs = page.locator('input[id^="poll-option-"]');
    await optionInputs.nth(0).fill('Increase R&D capacity');
    await expect(nextButton).toBeDisabled();
    await expect(optionError).toBeVisible();
    await optionInputs.nth(1).fill('Expand customer support hours');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.getByRole('heading', { name: /select a category/i, level: 3 })).toBeVisible();

    await nextButton.click();
    const tagError = page.getByRole('alert').filter({ hasText: /at least one tag/i });
    await expect(tagError).toBeVisible();

    await page.getByRole('button', { name: /^category /i }).first().click();
    await page.fill('#poll-tags-input', 'budget');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.getByRole('heading', { name: /voting & privacy settings/i, level: 3 })).toBeVisible();
  });
});


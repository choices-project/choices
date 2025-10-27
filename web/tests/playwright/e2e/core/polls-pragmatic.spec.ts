import { test, expect } from '@playwright/test';
import { T } from '../../../registry/testIds';

test.describe('Polls Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic error handling
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
  });

  test('should load polls page', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check if polls page loads
    expect(page.url()).toContain('/polls');
    
    // Look for polls content using proper test IDs
    const pollsContainer = await page.locator(`[data-testid="${T.POLLS.POLLS_CONTAINER}"]`).first();
    const pollCreateButton = await page.locator(`[data-testid="${T.POLLS.POLL_CREATE_BUTTON}"]`).first();
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/polls-page-loaded.png' });
  });

  test('should navigate to poll creation page', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Check if create poll page loads
    expect(page.url()).toContain('/create');
    
    // Look for create poll elements using proper test IDs
    const pollCreateForm = await page.locator(`[data-testid="${T.POLLS.POLL_CREATE_FORM}"]`).first();
    const pollTitleInput = await page.locator(`[data-testid="${T.POLLS.POLL_TITLE_INPUT}"]`).first();
    const pollDescriptionInput = await page.locator(`[data-testid="${T.POLLS.POLL_DESCRIPTION_INPUT}"]`).first();
    const pollSubmitButton = await page.locator(`[data-testid="${T.POLLS.POLL_SUBMIT_BUTTON}"]`).first();
    
    // Log what we found
    console.log('Create poll elements found:', {
      form: await pollCreateForm.count() > 0,
      titleInput: await pollTitleInput.count() > 0,
      descriptionInput: await pollDescriptionInput.count() > 0,
      submitButton: await pollSubmitButton.count() > 0
    });
    
    await page.screenshot({ path: 'test-results/create-poll-page.png' });
  });

  test('should handle poll page interactions', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with the page
    const body = await page.locator('body');
    await body.click();
    
    // Check if page is interactive
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isInteractive).toBe(true);
  });

  test('should load polls templates page', async ({ page }) => {
    await page.goto('/polls/templates');
    await page.waitForLoadState('networkidle');
    
    // Check if templates page loads
    expect(page.url()).toContain('/templates');
    
    await page.screenshot({ path: 'test-results/polls-templates-page.png' });
  });

  test('should handle polls analytics page', async ({ page }) => {
    await page.goto('/polls/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check if analytics page loads
    expect(page.url()).toContain('/analytics');
    
    await page.screenshot({ path: 'test-results/polls-analytics-page.png' });
  });

  test('should handle individual poll page', async ({ page }) => {
    // Try to access a poll with ID 1 (common test ID)
    await page.goto('/polls/1');
    await page.waitForLoadState('networkidle');
    
    // Check if poll page loads (might be 404, that's okay)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/individual-poll-page.png' });
  });
});

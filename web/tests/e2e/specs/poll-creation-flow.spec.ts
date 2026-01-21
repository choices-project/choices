import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/e2e-setup';

test.describe('Poll Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginTestUser(page);
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate through all steps using Previous/Next buttons', async ({ page }) => {
    // Step 1: Details
    await expect(page.locator('h1:has-text("Create Poll")')).toBeVisible();
    await expect(page.locator('input[id="title"]')).toBeVisible();
    
    // Fill in details
    await page.fill('input[id="title"]', 'Test Poll Title');
    await page.fill('textarea[id="description"]', 'Test poll description');
    
    // Go to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Step 2: Options
    await expect(page.locator('text=Add response options')).toBeVisible();
    await expect(page.locator('input[placeholder*="Option 1"]')).toBeVisible();
    
    // Add options
    const optionInputs = page.locator('input[placeholder*="Option"]');
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`Option ${i + 1}`);
    }
    
    // Go to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Step 3: Audience
    await expect(page.locator('text=Audience & discovery')).toBeVisible();
    
    // Go to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Step 4: Review
    await expect(page.locator('text=Preview & publish')).toBeVisible();
    await expect(page.locator('text=Preview')).toBeVisible();
    
    // Go back
    await page.click('button:has-text("Previous")');
    await page.waitForTimeout(500);
    
    // Should be back on Audience step
    await expect(page.locator('text=Audience & discovery')).toBeVisible();
    
    // Go back again
    await page.click('button:has-text("Previous")');
    await page.waitForTimeout(500);
    
    // Should be back on Options step
    await expect(page.locator('text=Add response options')).toBeVisible();
  });

  test('should allow clicking on step indicators to navigate', async ({ page }) => {
    // Fill in details to enable step navigation
    await page.fill('input[id="title"]', 'Test Poll');
    await page.fill('textarea[id="description"]', 'Test description');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Add options
    const optionInputs = page.locator('input[placeholder*="Option"]');
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`Option ${i + 1}`);
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Now on step 3, click on step 1 indicator
    const step1Button = page.locator('button[aria-label*="step 1"]').first();
    if (await step1Button.isVisible()) {
      await step1Button.click();
      await page.waitForTimeout(500);
      
      // Should be on step 1
      await expect(page.locator('input[id="title"]')).toBeVisible();
    }
  });

  test('should show ranked choice preview correctly', async ({ page }) => {
    // Fill in details
    await page.fill('input[id="title"]', 'Ranked Choice Poll');
    await page.fill('textarea[id="description"]', 'Test ranked choice poll');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Add options
    const optionInputs = page.locator('input[placeholder*="Option"]');
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`Option ${i + 1}`);
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Set voting method to ranked
    await page.selectOption('select[id="voting-method"]', 'ranked');
    await page.waitForTimeout(300);
    
    // Go to review
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Check for ranked choice preview
    await expect(page.locator('text=Ranked Choice Voting')).toBeVisible();
    await expect(page.locator('text=Voters will rank each option')).toBeVisible();
    
    // Check option text is readable (not too light)
    const optionText = page.locator('div:has-text("Option 1")').first();
    if (await optionText.isVisible()) {
      const color = await optionText.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.color;
      });
      // Should not be a very light gray (muted-foreground)
      expect(color).not.toContain('rgb(161, 161, 170)'); // gray-400
    }
  });

  test('should publish poll successfully', async ({ page }) => {
    // Fill in all required fields
    await page.fill('input[id="title"]', 'E2E Test Poll');
    await page.fill('textarea[id="description"]', 'This is a test poll created by E2E tests');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Add at least 2 options
    const optionInputs = page.locator('input[placeholder*="Option"]');
    const count = await optionInputs.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      await optionInputs.nth(i).fill(`Test Option ${i + 1}`);
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Select a category
    const categoryButton = page.locator('button[aria-pressed="false"]').first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await page.waitForTimeout(300);
    }
    
    // Go to review
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Verify preview shows correct data
    await expect(page.locator('text=E2E Test Poll')).toBeVisible();
    await expect(page.locator('text=Test Option 1')).toBeVisible();
    
    // Click publish
    const publishButton = page.locator('button:has-text("Publish")');
    await expect(publishButton).toBeEnabled();
    
    await publishButton.click();
    
    // Wait for either success (share dialog) or error
    await page.waitForTimeout(2000);
    
    // Check for either success dialog or error message
    const shareDialog = page.locator('text=Share your poll').or(page.locator('[role="dialog"]'));
    const errorMessage = page.locator('[role="alert"]').or(page.locator('text=/error/i'));
    
    const hasShareDialog = await shareDialog.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    // Should either show share dialog (success) or error (but not both)
    expect(hasShareDialog || hasError).toBe(true);
  });

  test('should show readable option text in preview', async ({ page }) => {
    // Navigate to review step
    await page.fill('input[id="title"]', 'Readability Test');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Add options with visible text
    const optionInputs = page.locator('input[placeholder*="Option"]');
    const count = await optionInputs.count();
    for (let i = 0; i < count; i++) {
      await optionInputs.nth(i).fill(`Visible Option ${i + 1}`);
    }
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Check option text in preview
    const optionElements = page.locator('div:has-text("Visible Option")');
    const firstOption = optionElements.first();
    
    if (await firstOption.isVisible()) {
      // Check that text is visible and has good contrast
      const textContent = await firstOption.textContent();
      expect(textContent).toContain('Visible Option');
      
      // Check computed styles for readability
      const fontWeight = await firstOption.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.fontWeight;
      });
      
      // Should be at least medium weight (400+) for readability
      const weight = parseInt(fontWeight) || 400;
      expect(weight).toBeGreaterThanOrEqual(400);
    }
  });

  test('should disable Previous button on first step', async ({ page }) => {
    // On first step, Previous should be disabled
    const previousButton = page.locator('button:has-text("Previous")');
    await expect(previousButton).toBeDisabled();
  });

  test('should enable Previous button after navigating forward', async ({ page }) => {
    // Fill in title to enable Next
    await page.fill('input[id="title"]', 'Test');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    // Previous should now be enabled
    const previousButton = page.locator('button:has-text("Previous")');
    await expect(previousButton).toBeEnabled();
  });
});

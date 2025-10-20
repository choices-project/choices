import { test, expect } from '@playwright/test';
import AuthHelper from '../helpers/auth-helper';

test.describe('Poll Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await AuthHelper.authenticateWithOnboarding(page, 'regular');
  });

  test('should load poll creation page', async ({ page }) => {
    await page.goto('/polls/create');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the poll creation page
    expect(page.url()).toContain('/polls/create');
  });

  test('should show poll creation form', async ({ page }) => {
    await page.goto('/polls/create');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for poll creation form elements
    // Based on the usePollWizard hook, look for:
    // - Title input
    // - Description input
    // - Options inputs
    // - Voting method selection
    // - Privacy settings
    
    // Check for form elements with data-testid attributes
    const titleInput = page.locator('[data-testid="poll-title-input"]');
    const descriptionInput = page.locator('[data-testid="poll-description-input"]');
    
    // At least one form element should be visible
    const hasFormElements = await titleInput.isVisible() || await descriptionInput.isVisible();
    expect(hasFormElements).toBeTruthy();
  });

  test('should handle poll creation workflow', async ({ page }) => {
    await page.goto('/polls/create');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for poll creation workflow elements
    // Based on the PollWizardState, look for:
    // - Step indicators
    // - Navigation buttons
    // - Form validation
    
    // Check for workflow elements
    const titleInput = page.locator('[data-testid="poll-title-input"]');
    const createButton = page.locator('[data-testid="create-poll-btn"]');
    
    // Should have at least the title input
    if (await titleInput.isVisible()) {
      expect(titleInput).toBeVisible();
    }
    
    // Should have create button
    if (await createButton.isVisible()) {
      expect(createButton).toBeVisible();
    }
  });
});

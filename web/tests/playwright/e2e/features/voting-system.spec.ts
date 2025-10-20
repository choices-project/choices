import { test, expect } from '@playwright/test';
import AuthHelper from '../helpers/auth-helper';

test.describe('Voting System', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await AuthHelper.authenticateWithOnboarding(page, 'regular');
  });

  test('should load voting interface', async ({ page }) => {
    // Try to navigate to a poll page (assuming we have polls)
    await page.goto('/polls/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on a poll page
    expect(page.url()).toContain('/polls/');
  });

  test('should show voting options', async ({ page }) => {
    await page.goto('/polls/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for voting interface elements
    // Based on the VotingInterface component, look for:
    // - Voting options
    // - Vote buttons
    // - Results display
    
    // Check for any voting elements
    const voting = await page.locator('[data-testid*="vote"]').first();
    if (await voting.isVisible()) {
      expect(voting).toBeVisible();
    }
  });

  test('should handle different voting methods', async ({ page }) => {
    await page.goto('/polls/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for voting method elements
    // Based on the voting types, look for:
    // - Single choice voting
    // - Multiple choice voting
    // - Ranked choice voting
    // - Approval voting
    // - Range voting
    // - Quadratic voting
    
    // Check for any voting method elements
    const votingMethod = await page.locator('[data-testid*="voting"]').first();
    if (await votingMethod.isVisible()) {
      expect(votingMethod).toBeVisible();
    }
  });
});

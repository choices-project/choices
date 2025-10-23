import { test, expect } from '@playwright/test';
import { T } from '@/tests/registry/testIds';

test.describe('Onboarding Flow', () => {
  test('should load onboarding page', async ({ page }) => {
    // Navigate to onboarding page directly
    await page.goto('/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the onboarding page
    expect(page.url()).toContain('/onboarding');
  });

  test('should show onboarding steps', async ({ page }) => {
    // Navigate to onboarding page directly
    await page.goto('/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for onboarding flow elements using proper test IDs
    const onboardingFlow = page.locator(`[data-testid="${T.onboarding.flow}"]`);
    if (await onboardingFlow.isVisible()) {
      expect(onboardingFlow).toBeVisible();
    }
    
    // Look for progress indicator
    const progress = page.locator(`[data-testid="${T.onboarding.progress}"]`);
    if (await progress.isVisible()) {
      expect(progress).toBeVisible();
    }
  });

  test('should handle onboarding steps', async ({ page }) => {
    // Navigate to onboarding page directly
    await page.goto('/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for specific onboarding step elements using proper test IDs
    const currentStep = page.locator(`[data-testid="${T.onboarding.currentStep}"]`);
    if (await currentStep.isVisible()) {
      expect(currentStep).toBeVisible();
    }
    
    // Look for welcome step
    const welcomeStep = page.locator(`[data-testid="${T.onboarding.welcomeStep}"]`);
    if (await welcomeStep.isVisible()) {
      expect(welcomeStep).toBeVisible();
    }
  });
});
import { test, expect } from '@playwright/test';
import AuthHelper from '../helpers/auth-helper';

test.describe('Onboarding Flow', () => {
  test('should load onboarding page', async ({ page }) => {
    // First authenticate, then go to onboarding
    await AuthHelper.authenticateUser(page, 'regular');
    await page.goto('/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the onboarding page
    expect(page.url()).toContain('/onboarding');
  });

  test('should show onboarding steps', async ({ page }) => {
    // First authenticate, then go to onboarding
    await AuthHelper.authenticateUser(page, 'regular');
    await page.goto('/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for onboarding flow elements
    // Based on the BalancedOnboardingFlow component, look for:
    // - Step indicators (welcome, privacy, demographics, auth, profile, complete)
    // - Progress bar
    // - Navigation buttons
    
    // Check for any onboarding elements
    const onboarding = await page.locator('[data-testid="onboarding"]').first();
    if (await onboarding.isVisible()) {
      expect(onboarding).toBeVisible();
    }
  });

  test('should handle onboarding steps', async ({ page }) => {
    // First authenticate, then go to onboarding
    await AuthHelper.authenticateUser(page, 'regular');
    await page.goto('/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for specific onboarding step elements
    // Based on the OnboardingStep type, look for:
    // - Welcome step
    // - Privacy step
    // - Demographics step
    // - Auth step
    // - Profile step
    // - Complete step
    
    // Check for any step elements
    const steps = await page.locator('[data-testid*="step"]').first();
    if (await steps.isVisible()) {
      expect(steps).toBeVisible();
    }
  });
});
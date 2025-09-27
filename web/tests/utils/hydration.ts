/**
 * Hydration Testing Utilities
 * 
 * Provides robust utilities for testing React hydration and form rendering
 * in E2E tests. Handles timing issues with dynamic imports and SSR/hydration mismatches.
 * 
 * Created: January 18, 2025
 */

import { expect, type Page } from '@playwright/test';

/**
 * Waits for a React hydration sentinel like:
 *   <div data-testid="register-hydrated" hidden>{hydrated ? '1' : '0'}</div>
 * Then asserts a target element is visible (e.g., the form).
 * 
 * This addresses the common issue where tests timeout waiting for forms
 * because hydration hasn't completed or dynamic imports haven't mounted.
 */
export async function waitForHydrationAndForm(
  page: Page,
  hydratedTestId: string,
  formTestId: string,
) {
  // 1) Ensure we didn't silently redirect
  await expect(page).toHaveURL(/\/(register|login)/, { timeout: 10_000 });

  // 2) Hydration sentinel: must flip to "1"
  const hydrated = page.getByTestId(hydratedTestId);
  await expect(hydrated).toHaveText('1', { timeout: 10_000 });

  // 3) Now the form must be visible
  await expect(page.getByTestId(formTestId)).toBeVisible({ timeout: 10_000 });
}

/**
 * Waits for hydration and then checks for specific form elements
 * Useful for login/register forms that need multiple elements to be ready
 */
export async function waitForHydrationAndFormElements(
  page: Page,
  hydratedTestId: string,
  formTestId: string,
  requiredElements: string[]
) {
  // Wait for hydration and form
  await waitForHydrationAndForm(page, hydratedTestId, formTestId);
  
  // Check all required elements are visible
  for (const elementId of requiredElements) {
    await expect(page.getByTestId(elementId)).toBeVisible({ timeout: 5_000 });
  }
}

/**
 * Waits for page to be fully loaded and hydrated
 * Includes network idle and DOM content loaded
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for any async components
  await page.waitForTimeout(500);
}

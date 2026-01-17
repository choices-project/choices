/**
 * Accessibility Testing Helpers
 * 
 * Minimal stubs for archived tests - actual helpers are in e2e/helpers/
 * These are here to satisfy imports in archived test files.
 */

import type { Page } from '@playwright/test';

/**
 * Run axe audit on a page
 * @deprecated Use e2e/helpers/accessibility.ts instead
 */
export async function runAxeAudit(_page: Page): Promise<any> {
  // Stub implementation - archived tests are ignored by Playwright
  // This exists only to satisfy TypeScript imports
  return { violations: [], passes: [] };
}


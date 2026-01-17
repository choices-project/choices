/**
 * E2E Setup Helpers
 * 
 * Minimal stubs for archived tests - actual helpers are in e2e/helpers/
 * These are here to satisfy imports in archived test files.
 */

import type { Page } from '@playwright/test';

/**
 * Wait for page to be ready
 * @deprecated Use e2e/helpers/e2e-setup.ts instead
 */
export async function waitForPageReady(_page: Page): Promise<void> {
  // Stub implementation - archived tests are ignored by Playwright
  // This exists only to satisfy TypeScript imports
  return Promise.resolve();
}

/**
 * Login test user
 * @deprecated Use e2e/helpers/e2e-setup.ts instead
 */
export async function loginTestUser(_page: Page): Promise<void> {
  // Stub implementation
  return Promise.resolve();
}

/**
 * Ensure user is logged out
 * @deprecated Use e2e/helpers/e2e-setup.ts instead
 */
export async function ensureLoggedOut(_page: Page): Promise<void> {
  // Stub implementation
  return Promise.resolve();
}

/**
 * Setup external API mocks
 * @deprecated Use e2e/helpers/e2e-setup.ts instead
 */
export async function setupExternalAPIMocks(_page: Page): Promise<void> {
  // Stub implementation
  return Promise.resolve();
}

/**
 * Should use mocks flag
 * @deprecated Use e2e/helpers/e2e-setup.ts instead
 */
export const SHOULD_USE_MOCKS = false;


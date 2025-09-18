/**
 * E2E Feature Flags Helper
 * 
 * Utilities for managing feature flags during E2E testing.
 * 
 * Created: 2024-12-19
 * Updated: 2024-12-19
 */

import { Page } from '@playwright/test';

export interface FeatureFlags {
  CORE_AUTH?: boolean;
  CORE_POLLS?: boolean;
  CORE_USERS?: boolean;
  ADMIN?: boolean;
  WEBAUTHN?: boolean;
  PWA?: boolean;
  ANALYTICS?: boolean;
  EXPERIMENTAL_UI?: boolean;
  EXPERIMENTAL_ANALYTICS?: boolean;
  ADVANCED_PRIVACY?: boolean;
  FEATURE_DB_OPTIMIZATION_SUITE?: boolean;
}

/**
 * Set feature flags via the E2E API
 */
export async function setFeatureFlags(page: Page, flags: FeatureFlags, project?: string): Promise<void> {
  const baseURL = page.url().split('/').slice(0, 3).join('/');
  
  const response = await page.request.post(`${baseURL}/api/e2e/flags`, {
    data: {
      flags,
      project: project || 'e2e-test'
    }
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to set feature flags: ${response.status()} ${errorText}`);
  }
}

/**
 * Get current feature flags via the E2E API
 */
export async function getFeatureFlags(page: Page): Promise<FeatureFlags> {
  const baseURL = page.url().split('/').slice(0, 3).join('/');
  
  const response = await page.request.get(`${baseURL}/api/e2e/flags`);
  
  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get feature flags: ${response.status()} ${errorText}`);
  }

  const data = await response.json();
  return data.flags || {};
}

/**
 * Predefined flag configurations for different test scenarios
 */
export const FlagConfigs = {
  core: {
    CORE_AUTH: true,
    CORE_POLLS: true,
    CORE_USERS: true,
    ADMIN: true,
    WEBAUTHN: false,
    PWA: false,
    ANALYTICS: false,
    EXPERIMENTAL_UI: false,
    EXPERIMENTAL_ANALYTICS: false,
    ADVANCED_PRIVACY: false,
    FEATURE_DB_OPTIMIZATION_SUITE: true
  } as FeatureFlags,

  withWebAuthn: {
    CORE_AUTH: true,
    CORE_POLLS: true,
    CORE_USERS: true,
    ADMIN: true,
    WEBAUTHN: true,
    PWA: false,
    ANALYTICS: false,
    EXPERIMENTAL_UI: false,
    EXPERIMENTAL_ANALYTICS: false,
    ADVANCED_PRIVACY: false,
    FEATURE_DB_OPTIMIZATION_SUITE: true
  } as FeatureFlags,

  withPWA: {
    CORE_AUTH: true,
    CORE_POLLS: true,
    CORE_USERS: true,
    ADMIN: true,
    WEBAUTHN: false,
    PWA: true,
    ANALYTICS: false,
    EXPERIMENTAL_UI: false,
    EXPERIMENTAL_ANALYTICS: false,
    ADVANCED_PRIVACY: false,
    FEATURE_DB_OPTIMIZATION_SUITE: true
  } as FeatureFlags,

  experimental: {
    CORE_AUTH: true,
    CORE_POLLS: true,
    CORE_USERS: true,
    ADMIN: true,
    WEBAUTHN: true,
    PWA: true,
    ANALYTICS: true,
    EXPERIMENTAL_UI: true,
    EXPERIMENTAL_ANALYTICS: true,
    ADVANCED_PRIVACY: true,
    FEATURE_DB_OPTIMIZATION_SUITE: true
  } as FeatureFlags
};

/**
 * Wait for feature flags to be applied
 */
export async function waitForFlagsApplied(page: Page, timeout = 5000): Promise<void> {
  // Wait for the application to reload with new flags
  await page.waitForLoadState('networkidle', { timeout });
  
  // Additional wait to ensure flags are fully applied
  await page.waitForTimeout(1000);
}

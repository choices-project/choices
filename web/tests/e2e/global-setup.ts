/**
 * Playwright Global Setup
 * 
 * Configures feature flags per project before running E2E tests.
 * This ensures each test project runs with the appropriate feature configuration.
 * 
 * Created: 2024-12-19
 * Updated: 2024-12-19
 */

import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Configure feature flags for each project
    for (const project of config.projects) {
      const projectName = project.name;
      let flags = {};

      // Set flags based on project type
      switch (projectName) {
        case 'chromium-core':
          flags = {
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
          };
          break;

        case 'chromium-passkeys':
          flags = {
            CORE_AUTH: true,
            CORE_POLLS: true,
            CORE_USERS: true,
            ADMIN: true,
            WEBAUTHN: true, // Enable WebAuthn for passkeys tests
            PWA: false,
            ANALYTICS: false,
            EXPERIMENTAL_UI: false,
            EXPERIMENTAL_ANALYTICS: false,
            ADVANCED_PRIVACY: false,
            FEATURE_DB_OPTIMIZATION_SUITE: true
          };
          break;

        case 'chromium-pwa':
          flags = {
            CORE_AUTH: true,
            CORE_POLLS: true,
            CORE_USERS: true,
            ADMIN: true,
            WEBAUTHN: false,
            PWA: true, // Enable PWA for PWA tests
            ANALYTICS: false,
            EXPERIMENTAL_UI: false,
            EXPERIMENTAL_ANALYTICS: false,
            ADVANCED_PRIVACY: false,
            FEATURE_DB_OPTIMIZATION_SUITE: true
          };
          break;

        default:
          // Legacy projects use core configuration
          flags = {
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
          };
      }

      // Set flags via API
      try {
        const response = await page.request.post(`${baseURL}/api/e2e/flags`, {
          data: {
            flags,
            project: projectName
          }
        });

        if (response.ok()) {
          console.log(`✅ Global setup: Feature flags configured for ${projectName}`);
        } else {
          console.warn(`⚠️ Global setup: Failed to configure flags for ${projectName}:`, await response.text());
        }
      } catch (error) {
        console.warn(`⚠️ Global setup: Error configuring flags for ${projectName}:`, error);
      }
    }

    console.log('🎯 Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

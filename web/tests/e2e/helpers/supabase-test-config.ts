/**
 * Supabase Test Configuration
 * 
 * This module provides test-specific configuration for Supabase
 * during E2E tests.
 * 
 * Created: January 27, 2025
 * Updated: October 8, 2025
 */

/**
 * Test environment configuration
 */
export const SUPABASE_TEST_CONFIG = {
  // Test environment settings
  TEST_MODE: true,
  
  // Use test database
  USE_TEST_DATABASE: true,
  
  // Disable external API calls in tests
  DISABLE_EXTERNAL_APIS: true
};

/**
 * Check if we're in a test environment
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || 
         process.env.PLAYWRIGHT_TEST === 'true' ||
         process.env.NODE_ENV === 'development';
}

/**
 * Get test email configuration
 */
export function getTestEmailConfig() {
  return {
    // Use a test email service that accepts all emails
    smtp: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: null
    },
    // Disable email sending entirely in tests
    disableSending: true,
    // Auto-confirm all test emails
    autoConfirm: true
  };
}

/**
 * Supabase Test Configuration
 * 
 * This module provides test-specific configuration for Supabase
 * to prevent email bounces and keep Supabase happy during E2E tests.
 * 
 * Created: January 27, 2025
 * Status: ✅ CRITICAL FIX FOR SUPABASE
 */

/**
 * Test environment configuration to prevent email bounces
 */
export const SUPABASE_TEST_CONFIG = {
  // Disable email sending in test environment
  DISABLE_EMAIL_SENDING: true,
  
  // Use test email addresses that won't bounce
  TEST_EMAIL_DOMAINS: [
    'mailinator.com',
    '10minutemail.com', 
    'guerrillamail.com',
    'temp-mail.org'
  ],
  
  // Auto-confirm emails in test environment
  AUTO_CONFIRM_EMAILS: true,
  
  // Use mock SMTP for testing
  USE_MOCK_SMTP: true
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

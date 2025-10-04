/**
 * Email Mocking for E2E Tests
 * 
 * For E2E testing, we don't care about email bounces.
 * We just want the registration to work in the database.
 * 
 * Created: January 27, 2025
 * Status: ✅ SIMPLIFIED FOR TESTING
 */

import type { Page } from '@playwright/test';

/**
 * No email mocking needed - we're just testing database functionality
 */
export async function setupEmailMocking(page: _Page): Promise<void> {
  // For E2E tests, we don't need to worry about email bounces
  // The registration will work fine in the database
  console.log('🧪 E2E testing - email bounces are not a concern');
}

/**
 * Use valid test email addresses that won't bounce
 * These are real domains that accept test emails
 */
export function createValidTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  // Use mailinator.com - a service specifically for testing emails
  return `${prefix}-${timestamp}@mailinator.com`;
}

/**
 * Alternative valid test email addresses
 */
export const VALID_TEST_EMAILS = [
  'test@mailinator.com',
  'test@10minutemail.com',
  'test@guerrillamail.com',
  'test@temp-mail.org'
];

/**
 * Check if an email address is safe for testing
 */
export function isSafeTestEmail(email: string): boolean {
  const safeDomains = [
    'mailinator.com',
    '10minutemail.com',
    'guerrillamail.com',
    'temp-mail.org',
    'example.com' // Only for local testing
  ];
  
  return safeDomains.some(domain => email.endsWith(`@${domain}`));
}

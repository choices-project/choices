/**
 * WebAuthn Feature Module
 * 
 * This module provides WebAuthn functionality when the feature is enabled.
 * When disabled, it provides graceful fallbacks.
 */

import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Re-export WebAuthn utilities only when feature is enabled
export const WebAuthnUtils = isFeatureEnabled('WEBAUTHN') ? {
  // WebAuthn functionality will be available here when enabled
  isSupported: () => false,
  register: () => Promise.reject(new Error('WebAuthn feature is disabled')),
  authenticate: () => Promise.reject(new Error('WebAuthn feature is disabled')),
} : {
  isSupported: () => false,
  register: () => Promise.reject(new Error('WebAuthn feature is disabled')),
  authenticate: () => Promise.reject(new Error('WebAuthn feature is disabled')),
};

// Re-export components only when feature is enabled
export const BiometricComponents = isFeatureEnabled('WEBAUTHN') ? {
  // Components will be available here when enabled
} : {
  // Graceful fallback components
};

/**
 * Check if WebAuthn is available
 */
export function isWebAuthnAvailable(): boolean {
  return isFeatureEnabled('WEBAUTHN');
}

/**
 * Get WebAuthn status message
 */
export function getWebAuthnStatus(): string {
  return isFeatureEnabled('WEBAUTHN') 
    ? 'WebAuthn is enabled' 
    : 'WebAuthn is disabled - focusing on core features';
}

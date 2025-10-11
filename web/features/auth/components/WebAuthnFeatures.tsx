'use client';

import React from 'react';
import { FeatureWrapper } from './WebAuthnPrompt';
import { T } from '@/lib/testing/testIds';

/**
 * WebAuthn Features Component
 * 
 * Displays WebAuthn-related features when the WEBAUTHN feature flag is enabled.
 * This component is used by E2E tests to verify that WebAuthn features are available.
 */
export function WebAuthnFeatures() {
  return (
    <FeatureWrapper feature="WEBAUTHN">
      <div data-testid={T.webauthn.features} className="webauthn-features">
        <h3>WebAuthn Features</h3>
        <ul>
          <li>Passkey Authentication</li>
          <li>Biometric Login</li>
          <li>Cross-Device Authentication</li>
          <li>Security Key Support</li>
        </ul>
      </div>
    </FeatureWrapper>
  );
}

export default WebAuthnFeatures;

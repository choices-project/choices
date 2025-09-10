#!/usr/bin/env node

/**
 * Enable WebAuthn Features Script
 * 
 * This script re-enables WebAuthn features by renaming .disabled files back
 * to their original names and fixing import paths.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Re-enabling WebAuthn features...');

// Files to re-enable
const filesToEnable = [
  'web/app/auth/biometric-setup/page.tsx.disabled',
  'web/app/profile/biometric-setup/page.tsx.disabled',
  'web/components/features/auth/BiometricSetup.tsx.disabled',
  'web/components/features/auth/BiometricLogin.tsx.disabled',
  'web/components/features/auth/BiometricError.tsx.disabled',
  'web/app/api/auth/webauthn/register/route.ts.disabled',
  'web/app/api/auth/webauthn/authenticate/route.ts.disabled',
  'web/app/api/auth/webauthn/trust-score/route.ts.disabled',
  'web/app/api/auth/register-biometric/route.ts.disabled'
];

// Re-enable files by removing .disabled suffix
filesToEnable.forEach(disabledPath => {
  if (fs.existsSync(disabledPath)) {
    const originalPath = disabledPath.replace('.disabled', '');
    fs.renameSync(disabledPath, originalPath);
    console.log(`✅ Re-enabled: ${originalPath}`);
  }
});

console.log('🎉 WebAuthn features re-enabled!');
console.log('📝 See docs/features/WEBAUTHN_IMPLEMENTATION_STATUS.md for completion roadmap.');

#!/usr/bin/env node

/**
 * Disable WebAuthn Features Script
 * 
 * This script temporarily disables WebAuthn features to ensure the build works
 * while the feature is being completed. It renames files to .disabled and
 * comments out problematic imports.
 * 
 * To re-enable: Run scripts/enable-webauthn-features.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Disabling WebAuthn features for stable build...');

// Files to disable
const filesToDisable = [
  'web/app/auth/biometric-setup/page.tsx',
  'web/app/profile/biometric-setup/page.tsx',
  'web/components/features/auth/BiometricSetup.tsx',
  'web/components/features/auth/BiometricLogin.tsx',
  'web/components/features/auth/BiometricError.tsx',
  'web/app/api/auth/webauthn/register/route.ts',
  'web/app/api/auth/webauthn/authenticate/route.ts',
  'web/app/api/auth/webauthn/trust-score/route.ts',
  'web/app/api/auth/register-biometric/route.ts'
];

// Disable files by renaming to .disabled
filesToDisable.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const disabledPath = filePath + '.disabled';
    fs.renameSync(filePath, disabledPath);
    console.log(`✅ Disabled: ${filePath}`);
  }
});

// Fix import issues in remaining files
const filesToFix = [
  'web/lib/auth/webauthn.ts'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix logger import
    content = content.replace(
      "import { devLog } from './logger';",
      "import { devLog } from '../utils/logger';"
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
});

console.log('🎉 WebAuthn features disabled! Build should now work.');
console.log('📝 See docs/features/WEBAUTHN_IMPLEMENTATION_STATUS.md for details.');
console.log('🔄 To re-enable: Run scripts/enable-webauthn-features.js');

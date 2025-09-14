#!/usr/bin/env node

/**
 * Alias Verification Script
 * 
 * Verifies that all import aliases are properly configured and working.
 * This script runs before and after reorganization to ensure consistency.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read tsconfig.json
const tsconfigPath = join(projectRoot, 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));

// Expected minimal alias set (expert's recommendation)
const expectedAliases = {
  '@/*': ['./*'],
  '@/lib/*': ['./lib/*'],
  '@/utils/supabase/server': ['./utils/supabase/server'],
  '@/lib/supabase/server': ['./utils/supabase/server']
};

// Current aliases
const currentAliases = tsconfig.compilerOptions.paths || {};

console.log('🔍 Verifying import aliases...\n');

// Check for expected aliases
let hasIssues = false;

console.log('📋 Expected minimal alias set:');
Object.entries(expectedAliases).forEach(([alias, paths]) => {
  console.log(`  ${alias} → ${paths.join(', ')}`);
});

console.log('\n📋 Current aliases:');
Object.entries(currentAliases).forEach(([alias, paths]) => {
  const isExpected = expectedAliases[alias];
  const status = isExpected ? '✅' : '⚠️';
  console.log(`  ${status} ${alias} → ${paths.join(', ')}`);
  
  if (!isExpected) {
    hasIssues = true;
  }
});

// Check for problematic aliases
const problematicAliases = [
  '@/shared/**',
  '@/features/**',
  '@/shared/core/**',
  '@/features/webauthn/**',
  '@/features/pwa/**',
  '@/features/analytics/**',
  '@/features/civics/**',
  '@/features/auth/**',
  '@/features/polls/**',
  '@/features/voting/**',
  '@/features/testing/**',
  '@/features/dashboard/**',
  '@/features/landing/**',
  '@/shared/*',
  '@/shared/utils/*',
  '@/components/auth/*',
  '@/lib/feedback-tracker',
  '@/lib/webauthn',
  '@/lib/supabase-ssr-safe',
  '@/lib/auth/server-actions',
  '@/lib/auth/session-cookies',
  '@/lib/real-time-news-service',
  '@/lib/types/guards',
  '@/lib/auth-middleware',
  '@/lib/services/AnalyticsService',
  '@/lib/device-flow',
  '@/lib/database-optimizer',
  '@/lib/rate-limit',
  '@/lib/auth-utils',
  '@/lib/hybrid-voting-service',
  '@/lib/auth',
  '@/components/PWAComponents',
  '@/lib/auth/idempotency',
  '@/lib/security/config',
  '@/shared/modules/*',
  '@/admin/*',
  '@/dev/*',
  '@/disabled/*'
];

console.log('\n🚨 Problematic aliases found:');
problematicAliases.forEach(alias => {
  if (currentAliases[alias]) {
    console.log(`  ❌ ${alias} → ${currentAliases[alias].join(', ')}`);
    hasIssues = true;
  }
});

if (!hasIssues) {
  console.log('\n✅ All aliases are properly configured!');
  process.exit(0);
} else {
  console.log('\n❌ Alias issues found. Please fix before proceeding.');
  process.exit(1);
}

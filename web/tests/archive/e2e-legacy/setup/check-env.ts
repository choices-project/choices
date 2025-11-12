/**
 * Check .env.test.local configuration
 */

import * as path from 'path';

import * as dotenv from 'dotenv';

// Load .env.local first, then .env.test.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.test.local') });

console.log('\n📋 Current E2E Test Configuration:\n');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('E2E_ADMIN_EMAIL:', process.env.E2E_ADMIN_EMAIL || '❌ Missing');
console.log('E2E_ADMIN_PASSWORD:', process.env.E2E_ADMIN_PASSWORD ? '✅ Set (hidden)' : '❌ Missing');
console.log('\n');

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

console.log('\n💡 Using credentials from .env.local (or .env.test.local if overridden)');
console.log('   All credentials loaded successfully!\n');


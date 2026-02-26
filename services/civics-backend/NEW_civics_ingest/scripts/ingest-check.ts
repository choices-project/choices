#!/usr/bin/env node
/**
 * Pre-flight check for civics ingest.
 * Run before ingest to verify setup. Noobie-proof: clear messages, no jargon.
 *
 * Usage: npm run ingest:check
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED = [
  {
    key: 'SUPABASE_URL',
    alt: 'NEXT_PUBLIC_SUPABASE_URL',
    msg: 'Supabase URL (dashboard → Settings → API)',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    alt: null,
    msg: 'Supabase service role key (dashboard → Settings → API → service_role)',
  },
] as const;

const OPTIONAL = [
  { key: 'OPENSTATES_API_KEY', msg: 'State/local committees, activity (configurable limit; default 250/day for freemium)' },
  { key: 'CONGRESS_GOV_API_KEY', msg: 'Federal IDs (Congress.gov)' },
  { key: 'FEC_API_KEY', msg: 'Federal campaign finance' },
  { key: 'GOVINFO_API_KEY', msg: 'Federal GovInfo IDs' },
] as const;

function get(key: string, alt: string | null): string | undefined {
  return process.env[key] ?? (alt ? process.env[alt] : undefined);
}

function main(): void {
  console.log('\n🔍 Civics Ingest — Pre-flight Check\n');
  console.log('='.repeat(50));

  let ok = true;

  // 1. Env file (.env or .env.local)
  const envPath = resolve(process.cwd(), '.env');
  const envLocalPath = resolve(process.cwd(), '.env.local');
  const hasEnv = existsSync(envPath) || existsSync(envLocalPath);
  if (!hasEnv) {
    console.log('\n❌ No .env or .env.local found');
    console.log('   Run: npm run ingest:setup');
    console.log('   Or: cp env.example .env  (then edit .env)\n');
    ok = false;
  } else {
    console.log('\n✅ Env configured (.env or .env.local)');
  }

  // 2. Required vars
  console.log('\nRequired:');
  for (const { key, alt, msg } of REQUIRED) {
    const val = get(key, alt);
    if (!val || val.includes('replace') || val.includes('your-')) {
      console.log(`   ❌ ${key} — ${msg}`);
      ok = false;
    } else {
      console.log(`   ✅ ${key}`);
    }
  }

  // 3. Optional vars
  console.log('\nOptional (enables more data):');
  for (const { key, msg } of OPTIONAL) {
    const val = process.env[key];
    if (!val || val.includes('replace')) {
      console.log(`   ⚪ ${key} — not set (${msg})`);
    } else {
      console.log(`   ✅ ${key}`);
    }
  }

  // 4. Dependencies (best-effort; may fail in monorepo)
  try {
    require.resolve('@supabase/supabase-js');
    console.log('\n✅ Dependencies installed');
  } catch {
    console.log('\n⚠️  Could not find @supabase/supabase-js — run: npm install');
    // Don't fail: in workspaces deps may be hoisted
  }

  console.log('\n' + '='.repeat(50));
  if (ok) {
    console.log('\n✅ Ready. Run: npm run ingest\n');
  } else {
    console.log('\n❌ Fix the issues above, then run: npm run ingest:check\n');
    process.exit(1);
  }
}

main();

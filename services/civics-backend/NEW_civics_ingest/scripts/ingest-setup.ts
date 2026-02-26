#!/usr/bin/env node
/**
 * One-time setup for civics ingest.
 * Creates .env from env.example if missing, then runs pre-flight check.
 *
 * Usage: npm run ingest:setup
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envPath = resolve(root, '.env');
const envLocalPath = resolve(root, '.env.local');
const examplePath = resolve(root, 'env.example');

function main(): void {
  console.log('\n🔧 Civics Ingest — Setup\n');

  if (!existsSync(examplePath)) {
    console.log('❌ env.example not found. Are you in services/civics-backend?');
    process.exit(1);
  }

  const hasEnv = existsSync(envPath) || existsSync(envLocalPath);
  if (!hasEnv) {
    copyFileSync(examplePath, envPath);
    console.log('✅ Created .env from env.example');
    console.log('   Edit .env and add your Supabase URL and service role key.');
    console.log('   Get them from: Supabase dashboard → Settings → API\n');
  } else {
    console.log('✅ Env configured (.env or .env.local exists)\n');
  }

  try {
    execSync('npm run ingest:check', { stdio: 'inherit', cwd: root });
  } catch {
    process.exit(1);
  }
}

main();

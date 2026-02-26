#!/usr/bin/env node
/**
 * Single-command ingest orchestration.
 * Runs baseline → OpenStates API syncs → federal enrichment in order.
 * Noobie-proof: one command does everything.
 *
 * Usage: npm run ingest [-- --dry-run]
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { execSync } from 'child_process';

const dryRun = process.argv.includes('--dry-run');

function run(cmd: string, env?: Record<string, string>): boolean {
  if (dryRun) return true;
  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, ...env },
    });
    return true;
  } catch {
    return false;
  }
}

function hasKey(key: string): boolean {
  const v = process.env[key];
  return Boolean(v && !v.includes('replace') && !v.includes('your-'));
}

function main(): void {
  console.log('\n📦 Civics Ingest — Full Pipeline\n');
  console.log('='.repeat(50));
  if (dryRun) {
    console.log('\n[DRY RUN] No writes will be made. Run without --dry-run to execute.\n');
  }

  // 1. Baseline (YAML) — always run
  console.log('\nStep 1/4: Baseline (OpenStates YAML)...');
  if (dryRun) {
    console.log('   [dry-run] Would run: npm run openstates:ingest');
  } else if (!run('npm run openstates:ingest')) {
    console.error('\n❌ Baseline failed. Fix errors and run again.');
    process.exit(1);
  }

  // 2. Re-ingest (committees + activity) — only if OpenStates key
  if (hasKey('OPENSTATES_API_KEY')) {
    console.log('\nStep 2/4: Re-ingest (committees + activity)...');
    if (dryRun) {
      console.log('   [dry-run] Would run: npm run reingest:scheduled');
    } else {
      run('npm run reingest:scheduled');
    }
  } else {
    console.log('\nStep 2/4: Skipping re-ingest (OPENSTATES_API_KEY not set)');
  }

  // 3. Federal Congress IDs
  if (hasKey('CONGRESS_GOV_API_KEY')) {
    console.log('\nStep 3/4: Federal Congress IDs...');
    if (dryRun) {
      console.log('   [dry-run] Would run: npm run federal:enrich:congress');
    } else {
      run('npm run federal:enrich:congress');
    }
  } else {
    console.log('\nStep 3/4: Skipping federal Congress (CONGRESS_GOV_API_KEY not set)');
  }

  // 4. Federal FEC finance
  if (hasKey('FEC_API_KEY')) {
    console.log('\nStep 4/4: Federal campaign finance...');
    if (dryRun) {
      console.log('   [dry-run] Would run: npm run federal:enrich:finance');
    } else {
      run('npm run federal:enrich:finance');
    }
  } else {
    console.log('\nStep 4/4: Skipping FEC (FEC_API_KEY not set)');
  }

  console.log('\n' + '='.repeat(50));
  if (dryRun) {
    console.log('\n✅ Dry run complete. Run `npm run ingest` (without --dry-run) to execute.\n');
  } else {
    console.log('\n✅ Ingest complete. Run `npm run tools:metrics:dashboard` to view results.\n');
  }
}

main();

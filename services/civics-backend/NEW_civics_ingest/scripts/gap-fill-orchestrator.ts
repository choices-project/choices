#!/usr/bin/env node
/**
 * Standalone gap-fill orchestrator.
 *
 * Identifies missing data, checks rate limits, and fills gaps in priority order.
 * Backs off gracefully when limits are reached. Safe to run repeatedly (e.g. cron).
 *
 * CRITICAL: OpenStates = state/local ONLY. There is never any federal data from OpenStates.
 * Federal gaps are filled via Congress.gov, FEC, GovInfo — never OpenStates.
 *
 * Flow:
 * 1. Report gaps (finance, congress, activity, committees)
 * 2. OpenStates: committees first (~50 calls), then activity (budget-aware) — state/local only
 * 3. Federal: Congress IDs, then FEC finance
 * 4. Stop when any API limit is reached; resume next run
 *
 * Usage:
 *   npm run gap:fill
 *   npm run gap:fill -- --dry-run
 *   npm run gap:fill -- --skip-openstates
 *   npm run gap:fill -- --skip-federal
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { execSync } from 'child_process';
import { computeGapReport } from './tools/report-gaps.js';
import { getOpenStatesUsageStats } from '../clients/openstates.js';

const RESERVE = Number(process.env.OPENSTATES_BUDGET_RESERVE ?? '100');
const DAILY_LIMIT = Number(process.env.OPENSTATES_DAILY_LIMIT ?? '250');
const COMMITTEES_BUDGET = DAILY_LIMIT < 100 ? 0 : Math.min(60, Math.floor(DAILY_LIMIT * 0.25));

function log(msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function run(cmd: string, env?: Record<string, string>): boolean {
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipOpenstates = args.includes('--skip-openstates');
  const skipFederal = args.includes('--skip-federal');

  log('Gap-fill orchestrator starting');
  if (dryRun) log('DRY RUN — no writes');

  // 1. Report gaps
  let gaps;
  try {
    gaps = await computeGapReport();
    log(`Gaps: finance=${gaps.finance.total}, congress=${gaps.congress.total}, activity=${gaps.activity.missing}, committees=${gaps.committees.missing}`);
  } catch (err) {
    log(`Gap report failed: ${(err as Error).message}`);
    process.exit(1);
  }

  if (dryRun) {
    log('Dry run complete. Run without --dry-run to fill gaps.');
    process.exit(0);
  }

  // 2. OpenStates (committees + activity)
  if (!skipOpenstates && hasKey('OPENSTATES_API_KEY')) {
    const stats = getOpenStatesUsageStats();
    if (stats.remaining <= 0) {
      log(`OpenStates limit reached (${stats.dailyRequests}/${stats.dailyLimit}). Run again when limit resets.`);
    } else if (stats.remaining < RESERVE) {
      log(`OpenStates remaining (${stats.remaining}) below reserve (${RESERVE}). Skipping.`);
    } else {
      let budget = stats.remaining - RESERVE;

      // Committees
      if (gaps.committees.missing > 0 && budget >= COMMITTEES_BUDGET) {
        log(`Step 1: Committees (${gaps.committees.missing} missing)...`);
        run('npm run openstates:sync:committees -- --resume');
        budget -= COMMITTEES_BUDGET;
      }

      // Activity
      if (gaps.activity.missing > 0 && budget > 0) {
        const activityBudget = Math.floor(budget);
        log(`Step 2: Activity (max ${activityBudget} reps)...`);
        run('npm run openstates:sync:activity -- --resume', {
          OPENSTATES_ACTIVITY_MAX_REPS: String(activityBudget),
        });
      }
    }
  } else if (skipOpenstates) {
    log('Skipping OpenStates (--skip-openstates)');
  } else {
    log('Skipping OpenStates (OPENSTATES_API_KEY not set)');
  }

  // 3. Federal Congress
  if (!skipFederal && hasKey('CONGRESS_GOV_API_KEY') && gaps.congress.total > 0) {
    log('Step 3: Federal Congress IDs...');
    run('npm run federal:enrich:congress');
  }

  // 4. Federal FEC finance
  if (!skipFederal && hasKey('FEC_API_KEY') && gaps.finance.total > 0) {
    log('Step 4: Federal campaign finance...');
    run('npm run federal:enrich:finance -- --lookup-missing-fec-ids');
  }

  log('Gap-fill run complete. Run `npm run tools:metrics:dashboard` to verify.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Rate-limit-aware re-ingest scheduler.
 *
 * Optimized for:
 * - Initial intake: fills as much as possible within daily limits
 * - Subsequent re-ingest: when limits reset (e.g. daily cron), resumes and continues
 *
 * Flow:
 * 1. Check OpenStates API remaining budget
 * 2. Committees (~50 calls, jurisdiction cache) — run if budget allows
 * 3. Activity (1 call/rep) — run with maxReps = remaining - reserve, --resume
 * 4. Events — run if budget allows (optional)
 *
 * Run daily via cron. Each run progresses; checkpoints enable resume.
 *
 * Usage:
 *   npm run reingest:scheduled
 *   OPENSTATES_BUDGET_RESERVE=200 npm run reingest:scheduled
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { execSync } from 'child_process';
import { getOpenStatesUsageStats } from '../clients/openstates.js';
import { loadCheckpoint } from '../utils/checkpoint.js';

const RESERVE = Number(process.env.OPENSTATES_BUDGET_RESERVE ?? '100');
const DAILY_LIMIT = Number(process.env.OPENSTATES_DAILY_LIMIT ?? '250');
const COMMITTEES_BUDGET = DAILY_LIMIT < 100 ? 0 : Math.min(60, Math.floor(DAILY_LIMIT * 0.25)); // ~50 jurisdictions; skip if limit very low

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

function hasOpenStatesKey(): boolean {
  const key = process.env.OPENSTATES_API_KEY;
  return Boolean(key && !key.includes('replace') && !key.includes('your-'));
}

async function main(): Promise<void> {
  log('Rate-limit-aware re-ingest starting');

  if (!hasOpenStatesKey()) {
    log('OPENSTATES_API_KEY not set or invalid.');
    log('Skipping committees and activity sync. Add key to .env to enable.');
    log('Baseline (YAML) data is already loaded. Federal enrichment runs separately.');
    process.exit(0);
  }

  const stats = getOpenStatesUsageStats();
  log(`OpenStates API: ${stats.dailyRequests}/${stats.dailyLimit} (${stats.remaining} remaining)`);

  if (stats.remaining <= 0) {
    log('Daily limit reached. Run again when limit resets.');
    log(`Resets at: ${stats.resetAt?.toISOString() ?? 'unknown'}`);
    process.exit(0);
  }

  if (stats.remaining < RESERVE) {
    log(`Remaining (${stats.remaining}) below reserve (${RESERVE}). Run again when limit resets.`);
    process.exit(0);
  }

  let budget = stats.remaining - RESERVE;
  log(`Budget for this run: ${budget} (reserve: ${RESERVE})`);

  // 1. Committees — cheap with jurisdiction cache (~50 calls)
  if (budget >= COMMITTEES_BUDGET) {
    log('Step 1/3: Committees (--resume)...');
    const ok = run('npm run openstates:sync:committees -- --resume');
    if (ok) {
      budget -= COMMITTEES_BUDGET;
      log(`Committees done. Budget remaining: ~${budget}`);
    }
  } else {
    log('Step 1/3: Skipping committees (insufficient budget)');
  }

  // 2. Activity — 1 call per rep, use remaining budget
  const activityBudget = Math.max(0, budget);
  if (activityBudget > 0) {
    log(`Step 2/3: Activity (--resume, max ${activityBudget} reps)...`);
    run('npm run openstates:sync:activity -- --resume', {
      OPENSTATES_ACTIVITY_MAX_REPS: String(activityBudget),
    });
  } else {
    log('Step 2/3: Skipping activity (no budget)');
  }

  // 3. Events — optional, skip if we're tight (events vary by jurisdiction)
  log('Step 3/3: Events — run separately: npm run openstates:sync:events');

  // Checkpoint status
  const activityCheckpoint = await loadCheckpoint('openstates-activity-sync');
  const committeesCheckpoint = await loadCheckpoint('openstates-committees-sync');

  log('---');
  log('Re-ingest run complete.');
  if (activityCheckpoint && activityCheckpoint.total > 0) {
    const pct = Math.round((activityCheckpoint.processed / activityCheckpoint.total) * 100);
    const remaining = activityCheckpoint.total - activityCheckpoint.processed;
    const estDays = DAILY_LIMIT > 0 ? Math.ceil(remaining / Math.max(1, DAILY_LIMIT - RESERVE - COMMITTEES_BUDGET)) : 0;
    log(`Activity: ${activityCheckpoint.processed}/${activityCheckpoint.total} (${pct}%) — run again to continue`);
    if (estDays > 1 && remaining > 0) {
      log(`   Estimated days to complete at current limit: ~${estDays}`);
    }
  }
  if (committeesCheckpoint) {
    log(`Committees: ${committeesCheckpoint.processed}/${committeesCheckpoint.total} — run again to continue`);
  }
  log('Run this script daily (cron) or when API limit resets.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

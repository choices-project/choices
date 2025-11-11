#!/usr/bin/env node
/**
 * Populate `representative_activity` with OpenStates bill activity.
 *
 * Usage:
 *   npm run sync:activity [--states=CA,NY] [--limit=200] [--dry-run]
 */
import 'dotenv/config';

import { syncActivityForRepresentatives, type ActivitySyncOptions } from '../workflows/activity-sync.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
  includeFederalOnly?: boolean;
};

function parseArgs(): CliOptions {
  const options: CliOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, raw] = arg.includes('=') ? arg.slice(2).split('=') : [arg.slice(2), args[i + 1]];
    const value = raw && !raw.startsWith('--') ? raw : undefined;

    switch (flag) {
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'limit':
        if (value) options.limit = Number(value);
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'federal-only':
        options.includeFederalOnly = true;
        break;
      default:
        break;
    }

    if (raw && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const result = await syncActivityForRepresentatives(options as ActivitySyncOptions);
  if (result.dryRun) {
    console.log(
      `[dry-run] Would sync activity entries for ${result.total} representatives (total bills: ${result.activityRows}).`,
    );
  } else {
    console.log(
      `✅ Activity sync complete (${result.processed}/${result.total}, failed: ${result.failed}). Activity rows written: ${result.activityRows}.`,
    );
  }
}

main().catch((error) => {
  console.error('Activity sync failed:', error);
  process.exit(1);
});



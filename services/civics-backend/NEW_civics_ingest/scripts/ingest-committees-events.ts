#!/usr/bin/env node
/**
 * Ingest committees and events from OpenStates API.
 * 
 * This script runs both committee and events syncs in sequence,
 * with proper rate limit handling and progress reporting.
 * 
 * Usage:
 *   npm run ingest:committees-events [--states=CA,NY] [--skip-committees] [--skip-events] [--dry-run]
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { execSync } from 'child_process';

type CliOptions = {
  states?: string[];
  skipCommittees?: boolean;
  skipEvents?: boolean;
  dryRun?: boolean;
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
      case 'skip-committees':
        options.skipCommittees = true;
        break;
      case 'skip-events':
        options.skipEvents = true;
        break;
      case 'dry-run':
        options.dryRun = true;
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

  console.log('\n' + '='.repeat(60));
  console.log('📊 OpenStates Committees & Events Ingestion');
  console.log('='.repeat(60));
  if (options.states?.length) {
    console.log(`States: ${options.states.join(', ')}`);
  }
  if (options.dryRun) {
    console.log('Mode: DRY RUN');
  }
  console.log('='.repeat(60) + '\n');

  const args: string[] = [];
  if (options.states && options.states.length > 0) {
    args.push(`--states=${options.states.join(',')}`);
  }
  if (options.dryRun) {
    args.push('--dry-run');
  }

  // Committees sync
  if (!options.skipCommittees) {
    console.log('🏛️  Syncing committees (YAML + API)...\n');
    try {
      execSync(`npm run openstates:sync:committees ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('\n✅ Committees sync complete.\n');
    } catch (error) {
      console.error('\n❌ Committees sync failed:', (error as Error).message);
      if (!options.skipEvents) {
        console.log('Continuing with events sync...\n');
      }
    }
  } else {
    console.log('⏭️  Skipping committees sync (--skip-committees flag set)\n');
  }

  // Events sync
  if (!options.skipEvents) {
    console.log('📅 Syncing legislative events...\n');
    try {
      execSync(`npm run openstates:sync:events ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('\n✅ Events sync complete.\n');
    } catch (error) {
      console.error('\n❌ Events sync failed:', (error as Error).message);
    }
  } else {
    console.log('⏭️  Skipping events sync (--skip-events flag set)\n');
  }

  console.log('='.repeat(60));
  console.log('✅ Ingestion complete!');
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});

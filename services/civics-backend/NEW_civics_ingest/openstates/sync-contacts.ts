#!/usr/bin/env node
/**
 * Normalize and persist representative contact records into Supabase.
 *
 * Usage:
 *   npm run openstates:sync:contacts [--states=CA,NY] [--limit=500] [--dry-run]
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { collectActiveRepresentatives, type CollectOptions } from '../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';
import { syncRepresentativeContacts } from '../persist/contacts.js';
import { logger } from '../utils/logger.js';

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
};

function parseArgs(): CliOptions {
  const options: CliOptions = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) continue;
    if (!arg.startsWith('--')) continue;

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
        if (value) {
          options.limit = Number(value);
        }
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

function dedupeRepresentatives(reps: CanonicalRepresentative[]): CanonicalRepresentative[] {
  const seenIds = new Set<number>();
  const fallbackKeys = new Set<string>();
  const result: CanonicalRepresentative[] = [];

  for (const rep of reps) {
    const supabaseId = rep.supabaseRepresentativeId ?? undefined;
    if (supabaseId && seenIds.has(supabaseId)) {
      continue;
    }
    if (!supabaseId) {
      // fall back to canonicalKey to avoid repeated null entries
      if (fallbackKeys.has(rep.canonicalKey)) continue;
      fallbackKeys.add(rep.canonicalKey);
    } else {
      seenIds.add(supabaseId);
    }
    result.push(rep);
  }

  return result;
}

async function loadRepresentatives(options: CliOptions): Promise<CanonicalRepresentative[]> {
  // OpenStates only has state/local data - never fetch federal reps
  const stateOptions: CollectOptions = {};
  if (options.states && options.states.length > 0) {
    stateOptions.states = options.states;
  }
  if (typeof options.limit === 'number') {
    stateOptions.limit = options.limit;
  }
  const reps = await collectActiveRepresentatives(stateOptions);
  return dedupeRepresentatives(reps);
}

async function main() {
  const options = parseArgs();
  const reps = await loadRepresentatives(options);

  const eligible = reps.filter((rep) => rep.supabaseRepresentativeId != null);
  if (eligible.length === 0) {
    logger.info('No representatives with Supabase IDs found; nothing to sync.');
    return;
  }

  if (options.dryRun) {
    logger.info(
      `[dry-run] Would sync contacts for ${eligible.length} representatives${options.states?.length ? ` in ${options.states.join(', ')}` : ''}.`,
    );
    return;
  }

  logger.info(
    `Syncing contact records for ${eligible.length} representatives${
      options.states?.length ? ` filtered by ${options.states.join(', ')}` : ''
    }...`,
  );

  let succeeded = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rep of eligible) {
    try {
      const result = await syncRepresentativeContacts(rep);
      if (result.success) {
        succeeded += 1;
        totalAdded += result.contactsAdded;
        totalSkipped += result.contactsSkipped;
        if (result.warnings.length > 0) {
          warnings.push(...result.warnings.map((w: string) => `${rep.name}: ${w}`));
        }
      } else {
        errors.push(`${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown'}): ${result.errors.join('; ')}`);
        totalSkipped += result.contactsSkipped;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${rep.name} (${rep.supabaseRepresentativeId ?? 'unknown id'}): ${errorMessage}`);
    }
  }

  logger.info(`✅ Contact sync complete (${succeeded}/${eligible.length} succeeded).`);
  logger.info(`   Contacts added: ${totalAdded}, skipped: ${totalSkipped}`);
  if (warnings.length > 0) {
    logger.info(`   Warnings: ${warnings.length}`);
    warnings.slice(0, 5).forEach((w) => logger.info(`     - ${w}`));
    if (warnings.length > 5) {
      logger.info(`     ... and ${warnings.length - 5} more warnings`);
    }
  }
  if (errors.length > 0) {
    logger.info(`   Errors: ${errors.length}`);
    errors.slice(0, 5).forEach((e) => logger.error(`     - ${e}`));
    if (errors.length > 5) {
      logger.error(`     ... and ${errors.length - 5} more errors`);
    }
  }
}

main().catch((error) => {
  logger.error('Contact sync failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});


#!/usr/bin/env node
/**
 * Preview representatives data for QA.
 *
 * Default: sample from representatives_core (DB) — total count, breakdown by level,
 * and a few sample rows. Use for ingest:qa to verify we can read from the DB.
 *
 * --pipeline: use pipeline-based preview (federal from DB + state from OpenStates YAML).
 * --limit=N: max sample size (default 10 for DB; 12 for pipeline).
 * --states=X,Y: filter by state codes (DB or pipeline).
 */
import 'dotenv/config';

import { getSupabaseClient } from './clients/supabase.js';
import {
  buildFederalPipelineBatch,
  buildStatePipelineBatch,
  type UnifiedRepresentative,
} from './pipeline/index.js';

const DEFAULT_LIMIT = 10;

type PreviewOptions = {
  limit: number;
  states: string[];
  pipeline: boolean;
};

function parseArgs(): PreviewOptions {
  const args = process.argv.slice(2);
  const options: PreviewOptions = {
    limit: DEFAULT_LIMIT,
    states: [],
    pipeline: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg?.startsWith('--')) continue;

    const [flag, raw] = arg.includes('=') ? arg.slice(2).split('=') : [arg.slice(2), args[i + 1]];
    const value = raw && !raw.startsWith('--') ? raw : undefined;

    switch (flag) {
      case 'limit':
        if (value) {
          const n = Number(value);
          if (!Number.isNaN(n) && n > 0) options.limit = Math.min(Math.floor(n), 100);
        }
        break;
      case 'states':
        if (value) {
          options.states = value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
        }
        break;
      case 'pipeline':
        options.pipeline = true;
        break;
      default:
        break;
    }
    if (value && !arg.includes('=')) i += 1;
  }

  return options;
}

function baseCountQuery(
  client: ReturnType<typeof getSupabaseClient>,
  states: string[],
) {
  let q = client
    .from('representatives_core')
    .select('id', { head: true, count: 'exact' })
    .not('name', 'ilike', '%test%');
  if (states.length) q = q.in('state', states);
  return q;
}

async function previewFromDb(options: PreviewOptions): Promise<void> {
  const client = getSupabaseClient();
  const base = () => baseCountQuery(client, options.states);

  const [totalRes, federalRes, stateRes, localRes] = await Promise.all([
    base(),
    base().eq('level', 'federal'),
    base().eq('level', 'state'),
    base().eq('level', 'local'),
  ]);

  if (totalRes.error) {
    throw new Error(`Failed to count representatives_core: ${totalRes.error.message}`);
  }

  const total = totalRes.count ?? 0;
  const federal = federalRes.count ?? 0;
  const state = stateRes.count ?? 0;
  const local = localRes.count ?? 0;
  const other = Math.max(0, total - federal - state - local);

  const byLevel: Record<string, number> = {};
  if (federal) byLevel.federal = federal;
  if (state) byLevel.state = state;
  if (local) byLevel.local = local;
  if (other) byLevel.other = other;

  let sampleQ = client
    .from('representatives_core')
    .select('id, name, office, level, state, district, is_active')
    .not('name', 'ilike', '%test%')
    .order('id', { ascending: true })
    .limit(options.limit);

  if (options.states.length) {
    sampleQ = sampleQ.in('state', options.states);
  }

  const { data: sample, error: sampleErr } = await sampleQ;

  if (sampleErr) {
    throw new Error(`Failed to fetch sample: ${sampleErr.message}`);
  }

  console.log('representatives_core (DB preview)');
  console.log(`  Total (excl. test): ${total}`);
  console.log('  By level:', JSON.stringify(byLevel));
  console.log(`  Sample (limit=${options.limit}):`);
  console.log(JSON.stringify(sample ?? [], null, 2));
}

async function previewFromPipeline(options: PreviewOptions): Promise<void> {
  const stateFilter = options.states.length ? { states: options.states } : {};
  const limit = options.limit || 12;

  const federal = await buildFederalPipelineBatch({ ...stateFilter, limit });
  console.log(`Federal sample (${federal.length} records):`);
  console.log(
    federal.slice(0, 10).map((record: UnifiedRepresentative) => ({
      name: record.canonical.name,
      state: record.canonical.state,
      office:
        record.canonical.currentRoles[0]?.title ??
        record.canonical.currentRoles[0]?.jurisdiction ??
        'Unknown',
      biography: summarizeBiography(record.canonical.biography),
      aliases: record.canonical.aliases.map(summarizeAlias).slice(0, 5),
      contacts: record.state?.contacts ?? {
        emails: record.canonical.emails,
        phones: record.canonical.phones,
        links: record.canonical.links,
      },
      socials: summarizeSocial(record.state?.social ?? record.federal?.social ?? {}),
      offices: record.canonical.offices.map(summarizeOffice).slice(0, 3),
      score: record.quality.overall,
      qualityNotes: record.quality.notes,
      identifiers: record.canonical.identifiers,
      extras: record.canonical.extras ?? undefined,
      sources: record.canonical.sources.slice(0, 6),
    })),
  );

  const state = await buildStatePipelineBatch({ ...stateFilter, limit });
  console.log(`\nState sample (${state.length} records):`);
  console.log(
    state.slice(0, 10).map((record: UnifiedRepresentative) => ({
      name: record.canonical.name,
      state: record.canonical.state,
      office:
        record.canonical.currentRoles[0]?.title ??
        record.canonical.currentRoles[0]?.jurisdiction ??
        'Unknown',
      biography: summarizeBiography(record.canonical.biography),
      aliases: record.canonical.aliases.map(summarizeAlias).slice(0, 5),
      contacts: record.state?.contacts ?? {
        emails: record.canonical.emails,
        phones: record.canonical.phones,
        links: record.canonical.links,
      },
      socials: summarizeSocial(record.state?.social ?? {}),
      offices: record.canonical.offices.map(summarizeOffice).slice(0, 3),
      score: record.quality.overall,
      qualityNotes: record.quality.notes,
      identifiers: record.canonical.identifiers,
      extras: record.canonical.extras ?? undefined,
      sources: record.canonical.sources.slice(0, 6),
    })),
  );
}

function summarizeBiography(biography: string | null): string | undefined {
  if (!biography) return undefined;
  return biography.length > 240 ? `${biography.slice(0, 237)}…` : biography;
}

function summarizeAlias(alias: UnifiedRepresentative['canonical']['aliases'][number]) {
  return {
    name: alias.name,
    span:
      alias.startDate || alias.endDate
        ? [alias.startDate ?? 'unknown', alias.endDate ?? 'present'].join(' → ')
        : undefined,
  };
}

function summarizeOffice(
  office: UnifiedRepresentative['canonical']['offices'][number],
): Record<string, string | null> {
  return {
    classification: office.classification,
    name: office.name,
    phone: office.phone,
    email: office.email,
    address: office.address ? truncate(office.address, 160) : null,
  };
}

function summarizeSocial(social: Record<string, string>): Record<string, string> {
  const summary: Record<string, string> = {};
  const entries = Object.entries(social);
  for (const [platform, value] of entries.slice(0, 6)) {
    summary[platform] = value;
  }
  if (entries.length > 6) {
    summary._more = `+${entries.length - 6} more`;
  }
  return summary;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.pipeline) {
    await previewFromPipeline(options);
  } else {
    await previewFromDb(options);
  }
}

main().catch((error) => {
  console.error('Preview failed:', error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Preview ingest output for a small subset (federal and state) without writing to Supabase.
 */
import 'dotenv/config';

import {
  buildFederalPipelineBatch,
  buildStatePipelineBatch,
  type UnifiedRepresentative,
} from './pipeline/index.js';

const states = process.argv.slice(2);

async function main() {
  const stateFilter = states.length ? { states } : {};

  const federal = await buildFederalPipelineBatch({ ...stateFilter, limit: 12 });
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

  const state = await buildStatePipelineBatch({ ...stateFilter, limit: 12 });
  console.log(`State sample (${state.length} records):`);
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

main().catch((error) => {
  console.error('Preview failed:', error);
  process.exit(1);
});

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


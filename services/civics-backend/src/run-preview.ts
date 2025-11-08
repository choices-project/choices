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
      office: record.canonical.currentRoles[0]?.jurisdiction ?? 'Unknown',
      score: record.quality.overall,
      qualityNotes: record.quality.notes,
      identifiers: record.canonical.identifiers,
      sources: record.canonical.sources.slice(0, 6),
    })),
  );

  const state = await buildStatePipelineBatch({ ...stateFilter, limit: 12 });
  console.log(`State sample (${state.length} records):`);
  console.log(
    state.slice(0, 10).map((record: UnifiedRepresentative) => ({
      name: record.canonical.name,
      state: record.canonical.state,
      office: record.canonical.currentRoles[0]?.jurisdiction ?? 'Unknown',
      score: record.quality.overall,
      qualityNotes: record.quality.notes,
      identifiers: record.canonical.identifiers,
      sources: record.canonical.sources.slice(0, 6),
    })),
  );
}

main().catch((error) => {
  console.error('Preview failed:', error);
  process.exit(1);
});


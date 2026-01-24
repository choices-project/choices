#!/usr/bin/env node
/**
 * Find representatives with the lowest data-quality scores so you can
 * prioritise enrichment runs. Safe to execute repeatedly; reads Supabase only.
 *
 * Uses representative_activity (type = 'bill') for issue signals. Canonical
 * activity = bills only; see src/persist/activity.ts and npm run audit:activity.
 */
import 'dotenv/config';

import { deriveKeyIssuesFromBills } from '@choices/civics-shared';
import { getSupabaseClient } from './clients/supabase.js';

interface RepresentativeRow {
  id: number;
  name: string | null;
  data_quality_score: number | null;
  state: string | null;
}

interface ActivityRow {
  title: string;
  date: string | null;
  metadata: { subjects?: string[] } | null;
}

const TABLE = 'representatives_core';
const SCORE_COLUMN = 'data_quality_score';

async function lookupTopIssues(representativeId: number): Promise<string[]> {
  try {
    const client = getSupabaseClient();
    const { data } = await client
      .from('representative_activity')
      .select('title, date, metadata')
      .eq('representative_id', representativeId)
      .eq('type', 'bill')
      .limit(10);

    if (!data || data.length === 0) {
      return [];
    }

    const billLike = (data as ActivityRow[]).map((r) => ({
      title: r.title,
      subjects: r.metadata?.subjects ?? [],
      updated_at: r.date ?? undefined,
    }));

    return deriveKeyIssuesFromBills(billLike, {
      source: 'ingest-cache',
      limit: 2,
    }).map((issue) => issue.issue);
  } catch (err) {
    console.warn(`Unable to fetch bill activity for rep ${representativeId}:`, err);
    return [];
  }
}

async function main(): Promise<void> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from(TABLE)
    .select(`id,name,${SCORE_COLUMN},state`)
    .order(SCORE_COLUMN, { ascending: true })
    .limit(25);

  if (error) {
    console.error(`Failed to query ${TABLE}:`, error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No representative rows found—run the ingest first.');
    process.exit(0);
  }

  const typedData = data as RepresentativeRow[];
  const rows = await Promise.all(
    typedData.map(async (row) => {
      const topIssues = await lookupTopIssues(row.id);
      return {
        id: row.id,
        name: row.name ?? 'Unknown',
        state: row.state ?? '—',
        score: row.data_quality_score ?? 'N/A',
        topIssues: topIssues.join(', '),
      };
    }),
  );

  console.table(rows);
}

main().catch((err) => {
  console.error('Unexpected error reading low-quality representatives:', err);
  process.exit(1);
});

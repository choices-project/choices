#!/usr/bin/env node
/**
 * Find representatives with the lowest data-quality scores so you can
 * prioritise enrichment runs. Safe to execute repeatedly; reads Supabase only.
 */
import 'dotenv/config';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { deriveKeyIssuesFromBills } from '@choices/civics-shared';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

interface RepresentativeRow {
  id: string;
  name: string | null;
  data_quality_score: number | null;
  state: string | null;
}

interface BillRow {
  metadata: Record<string, any> | null;
}

const supabase: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const TABLE = 'representatives_core';
const SCORE_COLUMN = 'data_quality_score';

try {
  const { data, error } = await supabase
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

  const typedData = (data ?? []) as RepresentativeRow[];

  const rows = await Promise.all(
    typedData.map(async (row: RepresentativeRow) => {
      const issues = await lookupTopIssues(row.id);

      return {
        id: row.id,
        name: row.name ?? 'Unknown',
        state: row.state ?? '—',
        score: row.data_quality_score ?? 'N/A',
        topIssues: issues.join(', '),
      };
    }),
  );

  console.table(rows);
} catch (error) {
  console.error('Unexpected error reading low-quality representatives:', error);
  process.exit(1);
}

async function lookupTopIssues(representativeId: string): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('representative_bills')
      .select('metadata')
      .eq('representative_id', representativeId)
      .limit(10);

    if (!data || data.length === 0) {
      return [];
    }

    const normalizedBills = (data as BillRow[])
      .map((entry) => entry.metadata)
      .filter(Boolean);
    return deriveKeyIssuesFromBills(normalizedBills, {
      source: 'ingest-cache',
      limit: 2,
    }).map((issue) => issue.issue);
  } catch (error) {
    console.warn(`Unable to fetch cached bills for ${representativeId}:`, error);
    return [];
  }
}


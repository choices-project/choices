#!/usr/bin/env node
/**
 * Fetch upcoming elections from the Google Civic Information API and upsert them into Supabase.
 *
 * Usage:
 *   npm run state:sync:google-elections [--dry-run] [--include-raw]
 */
import 'dotenv/config';

import { fetchElections } from '../../clients/googleCivic.js';
import { getSupabaseClient } from '../../clients/supabase.js';

type CliOptions = {
  dryRun?: boolean;
  includeRaw?: boolean;
};

interface ElectionRow {
  election_id: string;
  name: string;
  election_day: string;
  ocd_division_id: string;
  fetched_at: string;
  raw_payload?: unknown;
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const flag = arg.slice(2);
    switch (flag) {
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'include-raw':
        options.includeRaw = true;
        break;
      default:
        break;
    }
  }

  return options;
}

function normaliseDivisionId(value?: string): string | null {
  const t = typeof value === 'string' ? value.trim() : '';
  if (!t) return null;
  return t;
}

/**
 * Only include elections with a specific OCD division. Skip when the API returns
 * none (avoids "same for everyone"). Do not default missing ocdDivisionId to
 * ocd-division/country:us; store only when the API provides a division.
 */
function buildElectionRows(
  elections: Awaited<ReturnType<typeof fetchElections>>,
  includeRaw: boolean,
): ElectionRow[] {
  const timestamp = new Date().toISOString();
  const rows: ElectionRow[] = [];
  for (const election of elections) {
    const ocd = normaliseDivisionId((election as { ocdDivisionId?: string }).ocdDivisionId);
    if (!ocd) continue;
    rows.push({
      election_id: election.id,
      name: election.name,
      election_day: election.electionDay,
      ocd_division_id: ocd,
      fetched_at: timestamp,
      raw_payload: includeRaw ? election : undefined,
    });
  }
  return rows;
}

async function upsertElections(rows: ElectionRow[]): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('civic_elections').upsert(
    rows.map((row) => ({
      election_id: row.election_id,
      name: row.name,
      election_day: row.election_day,
      ocd_division_id: row.ocd_division_id,
      fetched_at: row.fetched_at,
      raw_payload: row.raw_payload ?? null,
    })),
    { onConflict: 'election_id' },
  );

  if (error) {
    throw new Error(`Failed to upsert civic_elections: ${error.message}`);
  }
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_CIVIC_API_KEY) {
    console.error('GOOGLE_CIVIC_API_KEY is required to fetch elections.');
    process.exit(1);
  }

  const options = parseCliOptions();
  console.log('Fetching elections from Google Civic API…');
  const elections = await fetchElections();
  if (elections.length === 0) {
    console.log('No elections returned from Google Civic API.');
    return;
  }

  const rows = buildElectionRows(elections, Boolean(options.includeRaw));

  if (options.dryRun) {
    console.log(`[dry-run] Would upsert ${rows.length} elections.`);
    console.log(
      JSON.stringify(
        rows.slice(0, 5).map((row) => ({
          election_id: row.election_id,
          name: row.name,
          election_day: row.election_day,
          ocd_division_id: row.ocd_division_id,
        })),
        null,
        2,
      ),
    );
    return;
  }

  await upsertElections(rows);
  console.log(`✅ Upserted ${rows.length} election(s) into civic_elections.`);
}

main().catch((error) => {
  console.error('Google Civic elections sync failed:', error);
  process.exit(1);
});



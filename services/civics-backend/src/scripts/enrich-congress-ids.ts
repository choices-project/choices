#!/usr/bin/env node
import 'dotenv/config';

import { fetchCongressMembers } from '../clients/congress.js';
import { fetchGovInfoMember } from '../clients/govinfo.js';
import { getSupabaseClient } from '../clients/supabase.js';

interface CliOptions {
  limit?: number;
  states?: string[];
  dryRun?: boolean;
}

interface RepresentativeRow {
  id: number;
  name: string;
  state: string | null;
  district: string | null;
  bioguide_id: string | null;
  congress_gov_id: string | null;
  govinfo_id: string | null;
  is_active: boolean | null;
}

interface UpdateResult {
  representativeId: number;
  name: string;
  state: string | null;
  district: string | null;
  congressGovId: string | null;
  govinfoId: string | null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, rawValue] = arg.includes('=')
      ? arg.slice(2).split('=')
      : [arg.slice(2), args[i + 1]];

    const value = rawValue && !rawValue.startsWith('--') ? rawValue : undefined;

    switch (flag) {
      case 'limit':
        if (value) options.limit = Number(value);
        break;
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      default:
        break;
    }

    if (rawValue && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

async function fetchFederalRows(options: CliOptions): Promise<RepresentativeRow[]> {
  const client = getSupabaseClient();
  let query = client
    .from('representatives_core')
    .select(
      'id,name,state,district,bioguide_id,congress_gov_id,govinfo_id,is_active,level',
    )
    .eq('level', 'federal')
    .eq('is_active', true);

  if (options.states && options.states.length > 0) {
    query = query.in('state', options.states);
  }

  if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch federal representatives: ${error.message}`);
  }

  return (data ?? []) as RepresentativeRow[];
}

function normaliseId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

async function updateRepresentativeIdentifiers(
  row: RepresentativeRow,
  updates: { congressGovId?: string | null; govinfoId?: string | null },
  dryRun: boolean,
): Promise<void> {
  const updatePayload: Record<string, string | null> = {};
  const tokens: string[] = [];
  const now = new Date().toISOString();

  if (updates.congressGovId !== undefined) {
    updatePayload.congress_gov_id = updates.congressGovId ?? null;
    if (updates.congressGovId) {
      tokens.push(`congress_gov:${updates.congressGovId}`);
    }
  }

  if (updates.govinfoId !== undefined) {
    updatePayload.govinfo_id = updates.govinfoId ?? null;
    if (updates.govinfoId) {
      tokens.push(`govinfo:${updates.govinfoId}`);
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return;
  }

  if (dryRun) {
    return;
  }

  const client = getSupabaseClient();

  const { error: updateError } = await client
    .from('representatives_core')
    .update(updatePayload)
    .eq('id', row.id);

  if (updateError) {
    throw new Error(`Failed to update representative ${row.id}: ${updateError.message}`);
  }

  if (tokens.length > 0) {
    const sourceRows = buildDataSourceRows(row.id, tokens, now);
    const { error: dataSourceError } = await client
      .from('representative_data_sources')
      .upsert(sourceRows, { onConflict: 'representative_id,source_name,source_type' });

    if (dataSourceError) {
      throw new Error(
        `Failed to upsert data source entries for ${row.id}: ${dataSourceError.message}`,
      );
    }
  }
}

function buildDataSourceRows(
  representativeId: number,
  tokens: string[],
  timestamp: string,
) {
  const rows = [];
  const congressToken = tokens.find((token) => token.startsWith('congress_gov:'));
  if (congressToken) {
    rows.push({
      representative_id: representativeId,
      source_name: 'Congress.gov Member API',
      source_type: 'congress_gov',
      confidence: 'high',
      validation_status: 'synced',
      last_updated: timestamp,
      updated_at: timestamp,
      raw_data: {
        tokens: [congressToken],
        labels: ['Congress.gov Member API'],
        base_name: 'Congress.gov Member API',
      },
    });
  }

  const govinfoToken = tokens.find((token) => token.startsWith('govinfo:'));
  if (govinfoToken) {
    rows.push({
      representative_id: representativeId,
      source_name: 'GovInfo Members API',
      source_type: 'govinfo',
      confidence: 'high',
      validation_status: 'synced',
      last_updated: timestamp,
      updated_at: timestamp,
      raw_data: {
        tokens: [govinfoToken],
        labels: ['GovInfo Members API'],
        base_name: 'GovInfo Members API',
      },
    });
  }

  return rows;
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.limit) {
    console.log(`Limiting enrichment to ${options.limit} representatives.`);
  }
  if (options.states?.length) {
    console.log(`Filtering by states: ${options.states.join(', ')}`);
  }
  if (options.dryRun) {
    console.log('Running in dry-run mode (no Supabase updates will be made).');
  }

  const rows = await fetchFederalRows(options);
  const targets = rows.filter(
    (row) =>
      normaliseId(row.bioguide_id) &&
      (normaliseId(row.congress_gov_id) === null || normaliseId(row.govinfo_id) === null),
  );

  if (targets.length === 0) {
    console.log('No federal representatives require Congress.gov / GovInfo enrichment.');
    return;
  }

  console.log(`Processing ${targets.length} representatives missing Congress.gov or GovInfo IDs...`);

  const congressMembers = await fetchCongressMembers();
  const memberMap = new Map<string, (typeof congressMembers)[number]>();
  for (const member of congressMembers) {
    const key = normaliseId(member.bioguideId)?.toUpperCase();
    if (key) {
      if (!memberMap.has(key)) {
        memberMap.set(key, member);
      }
    }
  }

  const results: UpdateResult[] = [];
  let updated = 0;
  let missingBioguide = 0;
  let noMatch = 0;
  let skippedUnchanged = 0;

  for (const row of targets) {
    const bioguide = normaliseId(row.bioguide_id);
    if (!bioguide) {
      console.warn(
        `Skipping ${row.name} (${row.state ?? ''}-${row.district ?? ''}): missing bioguide_id.`,
      );
      missingBioguide += 1;
      continue;
    }

    const member = memberMap.get(bioguide.toUpperCase());
    if (!member) {
      console.warn(
        `No Congress.gov member match found for ${row.name} (${bioguide}) — skipping.`,
      );
      noMatch += 1;
      continue;
    }

    const congressGovId = normaliseId(member.memberId) ?? normaliseId(member.bioguideId);
    let govinfoId = normaliseId(member.govInfoId);

    const needsGovInfoFetch =
      !govinfoId && typeof process.env.GOVINFO_API_KEY === 'string' && process.env.GOVINFO_API_KEY;
    if (needsGovInfoFetch) {
      try {
        const govinfo = await fetchGovInfoMember(bioguide);
        if (govinfo && govinfo.govInfoId) {
          govinfoId = normaliseId(govinfo.govInfoId);
        }
      } catch (error) {
        console.warn(`GovInfo lookup failed for ${bioguide}: ${(error as Error).message}`);
      }
    }

    const existingCongressId = normaliseId(row.congress_gov_id);
    const existingGovInfoId = normaliseId(row.govinfo_id);

    const updates: { congressGovId?: string | null; govinfoId?: string | null } = {};

    if (congressGovId && congressGovId !== existingCongressId) {
      updates.congressGovId = congressGovId;
    }
    if (govinfoId && govinfoId !== existingGovInfoId) {
      updates.govinfoId = govinfoId;
    }

    if (Object.keys(updates).length === 0) {
      skippedUnchanged += 1;
      continue;
    }

    await updateRepresentativeIdentifiers(row, updates, Boolean(options.dryRun));

    results.push({
      representativeId: row.id,
      name: row.name,
      state: row.state,
      district: row.district,
      congressGovId: updates.congressGovId ?? existingCongressId ?? null,
      govinfoId: updates.govinfoId ?? existingGovInfoId ?? null,
    });

    if (!options.dryRun) {
      updated += 1;
    }
  }

  if (results.length > 0) {
    console.table(
      results.map((row) => ({
        id: row.representativeId,
        name: row.name,
        state: row.state ?? '',
        district: row.district ?? '',
        congress_gov_id: row.congressGovId ?? '',
        govinfo_id: row.govinfoId ?? '',
      })),
    );
  }

  if (options.dryRun) {
    console.log(`✅ Dry-run complete. Would update ${results.length} representatives.`);
  } else {
    console.log(
      `✅ Congress.gov enrichment complete. Updated: ${updated}, skipped (unchanged): ${skippedUnchanged}, missing bioguide: ${missingBioguide}, no match: ${noMatch}.`,
    );
  }
}

main().catch((error) => {
  console.error('Congress.gov enrichment failed:', error);
  process.exit(1);
});


#!/usr/bin/env node
/**
 * Hydrate Congress.gov and GovInfo identifiers for federal representatives.
 *
 * Run via: `npm run federal:enrich:congress`
 */
import 'dotenv/config';

import { fetchCongressMembers } from '../../clients/congress.js';
import type { CongressMember } from '../../clients/congress.js';
import { fetchGovInfoMember } from '../../clients/govinfo.js';
import { getSupabaseClient } from '../../clients/supabase.js';

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
  canonical_id: string | null;
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
      'id,name,state,district,canonical_id,bioguide_id,congress_gov_id,govinfo_id,is_active,level',
    )
    .eq('level', 'federal')
    .or('is_active.eq.true,is_active.is.null');

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

async function hydrateBioguideFromCrosswalk(rows: RepresentativeRow[]): Promise<void> {
  const missingIds = rows
    .filter((row) => normaliseId(row.bioguide_id) === null)
    .map((row) => row.id);

  if (missingIds.length === 0) {
    return;
  }

  const canonicalIds = Array.from(
    new Set(
      rows
        .filter((row) => missingIds.includes(row.id))
        .map((row) => row.canonical_id)
        .filter((id): id is string => Boolean(normaliseId(id))),
    ),
  );

  if (canonicalIds.length === 0) {
    return;
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('id_crosswalk')
    .select('canonical_id,source,source_id')
    .in('canonical_id', canonicalIds)
    .in('source', ['bioguide', 'bioguide_id', 'open-states', 'congress']);

  if (error) {
    throw new Error(`Failed to fetch bioguide crosswalk entries: ${error.message}`);
  }

  const rowMap = new Map<string, RepresentativeRow[]>();
  rows.forEach((row) => {
    const key = normaliseId(row.canonical_id);
    if (!key) return;
    const list = rowMap.get(key) ?? [];
    list.push(row);
    rowMap.set(key, list);
  });

  data?.forEach((entry) => {
    const canonicalKey = normaliseId(entry.canonical_id);
    if (!canonicalKey || !entry.source_id) return;
    const matches = rowMap.get(canonicalKey);
    if (!matches) return;
    for (const row of matches) {
      if (!row.bioguide_id) {
        row.bioguide_id = entry.source_id;
      }
    }
  });
}

function normaliseId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function normaliseName(value: string | null | undefined): string {
  if (!value) return '';
  let processed = value.trim();

  if (processed.includes(',')) {
    const parts = processed
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const [last, ...rest] = parts;
      processed = `${rest.join(' ')} ${last}`.trim();
    } else {
      processed = parts.join(' ');
    }
  }

  return processed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNameKey(name: string | null | undefined, state: string | null | undefined): string {
  const normalizedState = normalizeStateCode(state);
  return `${normalizedState}::${normaliseName(name)}`;
}

async function updateRepresentativeBioguide(
  row: RepresentativeRow,
  bioguideId: string,
  dryRun: boolean,
): Promise<void> {
  if (dryRun || row.bioguide_id === bioguideId) {
    return;
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('representatives_core')
    .update({ bioguide_id: bioguideId })
    .eq('id', row.id);

  if (error) {
    throw new Error(`Failed to update bioguide for representative ${row.id}: ${error.message}`);
  }

  row.bioguide_id = bioguideId;
}

function pickMemberByName(
  row: RepresentativeRow,
  nameMap: Map<string, CongressMember[]>,
): CongressMember | null {
  const keys = [
    buildNameKey(row.name, row.state),
    buildNameKey(row.name, null),
  ].filter((key) => key && key !== '::');

  for (const key of keys) {
    const candidates = nameMap.get(key);
    if (!candidates || candidates.length === 0) {
      continue;
    }

    if (candidates.length === 1) {
      return candidates[0] ?? null;
    }

    const normalizedDistrict = (row.district ?? '').toString().trim();
    const districtMatch = candidates.find(
      (candidate) => (candidate.district ?? '').toString().trim() === normalizedDistrict,
    );
    if (districtMatch) {
      return districtMatch;
    }

    return candidates[0] ?? null;
  }

  return null;
}

const STATE_CODE_MAP: Record<string, string> = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  'DISTRICT OF COLUMBIA': 'DC',
  GUAM: 'GU',
  'NORTHERN MARIANA ISLANDS': 'MP',
  'PUERTO RICO': 'PR',
  'AMERICAN SAMOA': 'AS',
  'U.S. VIRGIN ISLANDS': 'VI'
};

function normalizeStateCode(state: string | null | undefined): string {
  if (!state) return '';
  const trimmed = state.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const mapped = STATE_CODE_MAP[trimmed.toUpperCase()];
  return mapped ?? trimmed.toUpperCase();
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
      .upsert(sourceRows, { onConflict: 'representative_id,source_name' });

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
  await hydrateBioguideFromCrosswalk(rows);
  const targets = rows.filter((row) => {
    const hasBioguide = Boolean(normaliseId(row.bioguide_id));
    const hasCongressId = Boolean(normaliseId(row.congress_gov_id));
    const hasGovInfoId = Boolean(normaliseId(row.govinfo_id));
    return !hasBioguide || !hasCongressId || !hasGovInfoId;
  });

  if (targets.length === 0) {
    console.log('No federal representatives require Congress.gov / GovInfo enrichment.');
    return;
  }

  console.log(`Processing ${targets.length} representatives missing Congress.gov or GovInfo IDs...`);

  const congressMembers = await fetchCongressMembers();
  const memberMap = new Map<string, CongressMember>();
  const memberNameMap = new Map<string, CongressMember[]>();
  for (const member of congressMembers) {
    const bioguideKey = normaliseId(member.bioguideId)?.toUpperCase();
    if (bioguideKey && !memberMap.has(bioguideKey)) {
      memberMap.set(bioguideKey, member);
    }

    const keys = [
      buildNameKey(member.name, member.state),
      buildNameKey(member.name, null),
    ].filter((key) => key && key !== '::');

    for (const key of keys) {
      const list = memberNameMap.get(key) ?? [];
      list.push(member);
      memberNameMap.set(key, list);
    }
  }

  const results: UpdateResult[] = [];
  let updated = 0;
  let missingBioguide = 0;
  let noMatch = 0;
  let skippedUnchanged = 0;
  let bioguideOnly = 0;

  for (const row of targets) {
    let bioguide = normaliseId(row.bioguide_id);
    const originalBioguide = bioguide;
    let member: CongressMember | null = null;
    if (bioguide) {
      const existing = memberMap.get(bioguide.toUpperCase());
      member = existing ?? null;
    }

    if (!member) {
      const fallbackMember = pickMemberByName(row, memberNameMap);
      if (fallbackMember) {
        const fallbackBioguide =
          normaliseId(fallbackMember.bioguideId) ?? normaliseId(fallbackMember.memberId);
        if (fallbackBioguide) {
          try {
            await updateRepresentativeBioguide(row, fallbackBioguide, Boolean(options.dryRun));
            bioguide = fallbackBioguide;
            member = fallbackMember;
            memberMap.set(fallbackBioguide.toUpperCase(), fallbackMember);
          } catch (error) {
            console.warn(
              `Failed to persist bioguide match for ${row.name}: ${(error as Error).message}`,
            );
          }
        }
      }
    }

    if (!bioguide || !member) {
      console.warn(
        `Skipping ${row.name} (${row.state ?? ''}-${row.district ?? ''}): unable to resolve bioguide match.`,
      );
      missingBioguide += 1;
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
      if (bioguide !== originalBioguide) {
        if (options.dryRun) {
          bioguideOnly += 1;
        } else {
          updated += 1;
        }
        results.push({
          representativeId: row.id,
          name: row.name,
          state: row.state,
          district: row.district,
          congressGovId: existingCongressId ?? null,
          govinfoId: existingGovInfoId ?? null,
        });
      } else {
        skippedUnchanged += 1;
      }
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
    console.log(
      `✅ Dry-run complete. Would update ${results.length} representatives (bioguide-only: ${bioguideOnly}).`,
    );
  } else {
    console.log(
      `✅ Congress.gov enrichment complete. Updated: ${updated}, bioguide-only: ${bioguideOnly}, skipped (unchanged): ${skippedUnchanged}, missing bioguide: ${missingBioguide}, no match: ${noMatch}.`,
    );
  }
}

main().catch((error) => {
  console.error('Congress.gov enrichment failed:', error);
  process.exit(1);
});


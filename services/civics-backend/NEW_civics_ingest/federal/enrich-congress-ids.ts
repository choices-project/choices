#!/usr/bin/env node
/**
 * Congress.gov federal roster: add new reps, deactivate those no longer in office,
 * then hydrate Congress.gov / GovInfo identifiers for federal representatives.
 *
 * Run via: `npm run federal:enrich:congress`
 */
import 'dotenv/config';

import {
  fetchCongressMembers,
  fetchMemberByBioguide,
} from '../clients/congress.js';
import type { CongressMember } from '../clients/congress.js';
import { fetchGovInfoMember } from '../clients/govinfo.js';
import { getSupabaseClient } from '../clients/supabase.js';

interface CliOptions {
  limit?: number;
  states?: string[];
  dryRun?: boolean;
  skipAdd?: boolean;
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
  status: 'active' | 'inactive' | 'historical' | null;
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

    let flag: string;
    let rawValue: string | undefined;
    if (arg.includes('=')) {
      const [f, v] = arg.slice(2).split('=');
      flag = f ?? '';
      rawValue = v;
    } else {
      flag = arg.slice(2);
      const next = args[i + 1];
      rawValue = next && !next.startsWith('--') ? next : undefined;
    }

    const value = rawValue && !String(rawValue).startsWith('--') ? String(rawValue).trim() : undefined;

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
      case 'skip-add':
        options.skipAdd = true;
        break;
      default:
        break;
    }

    if (!arg.includes('=') && rawValue !== undefined) {
      i += 1;
    }
  }

  return options;
}

const FEDERAL_SELECT =
  'id,name,state,district,canonical_id,bioguide_id,congress_gov_id,govinfo_id,is_active,status,level';

async function fetchFederalRows(options: CliOptions): Promise<RepresentativeRow[]> {
  const client = getSupabaseClient();
  let query = client
    .from('representatives_core')
    .select(FEDERAL_SELECT)
    .eq('level', 'federal')
    .eq('status', 'active');

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

const FEDERAL_PAGE_SIZE = 1000;

/** Fetch all federal reps (including inactive) for add/deactivate. Paginated; no limit cap. */
async function fetchAllFederalRows(options: CliOptions): Promise<RepresentativeRow[]> {
  const client = getSupabaseClient();
  const all: RepresentativeRow[] = [];
  let offset = 0;

  for (;;) {
    let query = client
      .from('representatives_core')
      .select(FEDERAL_SELECT)
      .eq('level', 'federal')
      .range(offset, offset + FEDERAL_PAGE_SIZE - 1);

    if (options.states && options.states.length > 0) {
      query = query.in('state', options.states);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch all federal representatives: ${error.message}`);
    }

    const page = (data ?? []) as RepresentativeRow[];
    all.push(...page);
    if (page.length < FEDERAL_PAGE_SIZE) break;
    offset += FEDERAL_PAGE_SIZE;
  }

  return all;
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

/** Schema limits: primary_phone 20, primary_website 500, primary_photo_url 500. */
const PROFILE_LIMITS = { phone: 20, website: 500, photo: 500 } as const;

async function updateRepresentativeProfileFromCongress(
  representativeId: number,
  detail: {
    contactPhone: string | null;
    contactAddress: string | null;
    portraitUrl: string | null;
    url: string | null;
  },
  dryRun: boolean,
): Promise<void> {
  const payload: Record<string, string | null> = {};
  if (detail.contactPhone) {
    payload.primary_phone = detail.contactPhone.slice(0, PROFILE_LIMITS.phone);
  }
  if (detail.url) {
    payload.primary_website = detail.url.slice(0, PROFILE_LIMITS.website);
  }
  if (detail.portraitUrl) {
    payload.primary_photo_url = detail.portraitUrl.slice(0, PROFILE_LIMITS.photo);
  }
  if (Object.keys(payload).length === 0) return;
  if (dryRun) return;

  const client = getSupabaseClient();
  const { error } = await client
    .from('representatives_core')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', representativeId);
  if (error) {
    throw new Error(`Failed to update profile for representative ${representativeId}: ${error.message}`);
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

function deriveOffice(member: CongressMember): string {
  const d = normaliseId(member.district);
  const s = normaliseId(member.state);
  
  // Senators don't have districts (district is null)
  // If we have a state but no district, it's likely a Senator
  // Exception: At-Large Representatives (e.g., territories) have district = "0" or "At-Large"
  if (!s) return 'Representative'; // No state = can't determine
  
  // If district is null and we have a state, it's a Senator
  if (!d && s) return 'Senator';
  
  // If district equals state code (e.g., "AK" == "AK"), it's a Senator
  if (d && s && d.toUpperCase() === s) return 'Senator';
  
  // At-Large Representatives (territories) have district = "0" or "At-Large"
  if (d === '0' || d === 'At-Large') return 'Representative';
  
  // Numeric districts (e.g., "1", "2", "3") are Representatives
  if (d && /^\d+$/.test(d)) return 'Representative';
  
  // Formatted districts (e.g., "CA-12") are Representatives
  if (d && /^[A-Z]{2}-\d+$/.test(d)) return 'Representative';
  
  // Default to Representative for any other format
  return 'Representative';
}

async function addNewFederalRepsFromCongress(
  congressMembers: CongressMember[],
  allFederal: RepresentativeRow[],
  dryRun: boolean,
): Promise<{ added: number }> {
  const bioguideSet = new Set(
    allFederal
      .map((r) => normaliseId(r.bioguide_id)?.toUpperCase())
      .filter((id): id is string => Boolean(id)),
  );
  const client = getSupabaseClient();
  let added = 0;

  for (const member of congressMembers) {
    const bioguide = normaliseId(member.bioguideId);
    if (!bioguide || bioguideSet.has(bioguide.toUpperCase())) continue;

    const state = (member.state ?? null)?.slice(0, 2) ?? null;
    if (!state) {
      console.warn(`Skipping add for ${member.name} (${bioguide}): no state mapping.`);
      continue;
    }

    const canonicalId = `congress:${bioguide}`;
    const congressGovId = normaliseId(member.memberId) ?? bioguide;
    const office = deriveOffice(member);
    const now = new Date().toISOString();

    const row = {
      name: (member.name ?? 'Unknown').slice(0, 255),
      office: office.slice(0, 255),
      level: 'federal',
      state,
      district: (member.district ?? null)?.slice(0, 50) ?? null,
      party: (member.party ?? null)?.slice(0, 100) ?? null,
      is_active: true, // Keep for backward compatibility
      status: 'active' as const,
      openstates_id: null,
      canonical_id: canonicalId.slice(0, 255),
      bioguide_id: bioguide.slice(0, 20),
      congress_gov_id: congressGovId.slice(0, 50),
      verification_status: 'pending',
      created_at: now,
      updated_at: now,
    };

    if (!dryRun) {
      const { data, error } = await client.from('representatives_core').insert(row).select('id').single();
      if (error) {
        console.warn(`Failed to add federal rep ${member.name} (${bioguide}): ${error.message}`);
        continue;
      }
      if (data?.id) {
        bioguideSet.add(bioguide.toUpperCase());
        // Upsert id_crosswalk: canonical_id -> bioguide mapping
        const { error: crosswalkError } = await client
          .from('id_crosswalk')
          .upsert(
            {
              entity_type: 'person',
              canonical_id: canonicalId,
              source: 'bioguide',
              source_id: bioguide,
              attrs: { quality_score: 0.9, source: 'congress-gov' },
              updated_at: now,
            },
            { onConflict: 'source,source_id' },
          );
        if (crosswalkError) {
          console.warn(`Failed to upsert id_crosswalk for ${bioguide}: ${crosswalkError.message}`);
        }
      }
    }
    added += 1;
  }

  return { added };
}

/** Congress-member key: bioguide or memberId. Used to dedupe rows that map to the same current member. */
function congressMemberKey(cm: CongressMember): string {
  const b = normaliseId(cm.bioguideId)?.toUpperCase();
  if (b) return b;
  const c = normaliseId(cm.memberId)?.toUpperCase();
  return c ?? '';
}

async function deactivateFederalRepsNotInCongress(
  congressMembers: CongressMember[],
  allFederal: RepresentativeRow[],
  dryRun: boolean,
): Promise<{ deactivated: number; kept: number }> {
  const inCongress = new Set<string>();
  for (const m of congressMembers) {
    const b = normaliseId(m.bioguideId)?.toUpperCase();
    const c = normaliseId(m.memberId)?.toUpperCase();
    if (b) inCongress.add(b);
    if (c) inCongress.add(c);
  }

  const buildMatchKey = (name: string | null, state: string | null, district: string | null) =>
    `${normaliseName(name)}::${normalizeStateCode(state)}::${(district ?? '').trim()}`;
  const congressByName = new Map<string, CongressMember>();
  for (const cm of congressMembers) {
    const key = buildMatchKey(cm.name, cm.state, cm.district);
    if (key && key !== '::' && !congressByName.has(key)) congressByName.set(key, cm);
  }

  const toDeactivate: number[] = [];
  const inCongressRows: { row: RepresentativeRow; memberKey: string }[] = [];

  for (const r of allFederal) {
    const bioguide = normaliseId(r.bioguide_id)?.toUpperCase();
    const congressId = normaliseId(r.congress_gov_id)?.toUpperCase();
    if (bioguide && inCongress.has(bioguide)) {
      inCongressRows.push({ row: r, memberKey: bioguide });
      continue;
    }
    if (congressId && inCongress.has(congressId)) {
      inCongressRows.push({ row: r, memberKey: congressId });
      continue;
    }

    const key = buildMatchKey(r.name, r.state, r.district);
    const match = key && key !== '::' ? congressByName.get(key) : null;
    if (match) {
      const mk = congressMemberKey(match);
      if (mk) inCongressRows.push({ row: r, memberKey: mk });
      else toDeactivate.push(r.id);
      continue;
    }

    toDeactivate.push(r.id);
  }

  // Deduplicate: one active row per current Congress member (by memberKey), deactivate rest.
  const byMemberKey = new Map<string, RepresentativeRow[]>();
  for (const { row, memberKey } of inCongressRows) {
    if (!byMemberKey.has(memberKey)) byMemberKey.set(memberKey, []);
    byMemberKey.get(memberKey)!.push(row);
  }
  for (const group of byMemberKey.values()) {
    const sorted = [...group].sort((a, b) => {
      const aHasBio = Boolean(normaliseId(a.bioguide_id));
      const bHasBio = Boolean(normaliseId(b.bioguide_id));
      if (aHasBio !== bHasBio) return aHasBio ? -1 : 1;
      return a.id - b.id;
    });
    for (let i = 1; i < sorted.length; i += 1) toDeactivate.push(sorted[i].id);
  }

  const kept = allFederal.length - toDeactivate.length;
  if (toDeactivate.length === 0) return { deactivated: 0, kept };
  if (!dryRun) {
    const client = getSupabaseClient();
    const BATCH = 500;
    for (let i = 0; i < toDeactivate.length; i += BATCH) {
      const batch = toDeactivate.slice(i, i + BATCH);
      // Use update_representative_status RPC for proper status tracking
      for (const id of batch) {
        const { error } = await client.rpc('update_representative_status', {
          p_representative_id: id,
          p_new_status: 'inactive',
          p_status_reason: 'no_longer_in_congress',
          p_replaced_by_id: null,
        });
        if (error) {
          throw new Error(`Failed to deactivate federal rep ${id} (batch ${i / BATCH + 1}): ${error.message}`);
        }
      }
    }
  }

  return { deactivated: toDeactivate.length, kept };
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
  if (options.skipAdd) {
    console.log('Running with --skip-add (skipping add/deactivate).');
  }

  console.log('Fetching Congress members...');
  const congressMembers = await fetchCongressMembers();
  console.log(`Congress members: ${congressMembers.length}.`);

  // Validation: Verify Congress.gov API returned expected member count
  // The 119th Congress endpoint should return ALL currently serving members:
  // - All Representatives (2-year terms, elected 2024)
  // - All Senators (6-year terms, including those continuing from 118th Congress)
  // Expected: ~535 total (435 House + 100 Senate)
  const EXPECTED_MIN = 500;
  const EXPECTED_MAX = 550;
  if (congressMembers.length < EXPECTED_MIN || congressMembers.length > EXPECTED_MAX) {
    console.warn(
      `⚠️  Warning: Unexpected member count (${congressMembers.length}). ` +
        `Expected ~535 for ${new Date().getFullYear()} Congress. ` +
        `This may indicate missing members or API issues.`,
    );
  } else {
    console.log(`✅ Member count validation passed: ${congressMembers.length} members (expected ~535).`);
  }

  let added = 0;
  let deactivated = 0;
  if (!options.skipAdd) {
    console.log('Fetching all federal rows...');
    const allFederal = await fetchAllFederalRows(options);
    console.log(`All federal rows: ${allFederal.length}.`);

    console.log('Adding new federal reps from Congress.gov...');
    const addResult = await addNewFederalRepsFromCongress(
      congressMembers,
      allFederal,
      Boolean(options.dryRun),
    );
    added = addResult.added;
    console.log(`Added ${added} new federal representative(s) from Congress.gov.`);

    console.log('Deactivating federal reps no longer in Congress...');
    const deactResult = await deactivateFederalRepsNotInCongress(
      congressMembers,
      allFederal,
      Boolean(options.dryRun),
    );
    deactivated = deactResult.deactivated;
    if (deactivated > 0) {
      console.log(`Deactivated ${deactivated} federal representative(s) no longer in office.`);
    }
    console.log(`Keeping ${deactResult.kept} active federal representative(s) (one per current Congress member).`);
  } else {
    console.log('Skipping add/deactivate (--skip-add).');
  }

  const rows = await fetchFederalRows(options);
  console.log(`Fetched ${rows.length} federal rows${typeof options.limit === 'number' ? ` (limit=${options.limit})` : ''}.`);
  await hydrateBioguideFromCrosswalk(rows);
  let targets = rows.filter((row) => {
    const hasBioguide = Boolean(normaliseId(row.bioguide_id));
    const hasCongressId = Boolean(normaliseId(row.congress_gov_id));
    const hasGovInfoId = Boolean(normaliseId(row.govinfo_id));
    return !hasBioguide || !hasCongressId || !hasGovInfoId;
  });
  if (typeof options.limit === 'number' && options.limit > 0 && targets.length > options.limit) {
    targets = targets.slice(0, options.limit);
    console.log(`Limiting to first ${options.limit} targets.`);
  }

  if (targets.length === 0) {
    console.log('No federal representatives require Congress.gov / GovInfo enrichment.');
    return;
  }

  console.log(`Processing ${targets.length} representatives missing Congress.gov or GovInfo IDs...`);

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

    try {
      const detail = await fetchMemberByBioguide(bioguide);
      if (detail) {
        await updateRepresentativeProfileFromCongress(
          row.id,
          {
            contactPhone: detail.contactPhone,
            contactAddress: detail.contactAddress,
            portraitUrl: detail.portraitUrl,
            url: detail.url,
          },
          Boolean(options.dryRun),
        );
      }
    } catch (err) {
      console.warn(`Congress member-detail fetch failed for ${bioguide}: ${(err as Error).message}`);
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

    // Post-enrichment verification: Check database has expected counts
    if (!options.skipAdd && typeof options.limit !== 'number') {
      const client = getSupabaseClient();
      const { data: verificationData, error: verificationError } = await client
        .from('representatives_core')
        .select('office')
        .eq('level', 'federal')
        .eq('status', 'active');

      if (!verificationError && verificationData) {
        const senators = verificationData.filter((r) => r.office === 'Senator').length;
        const representatives = verificationData.filter((r) => r.office === 'Representative').length;
        const total = verificationData.length;

        console.log(`\n📊 Post-enrichment verification:`);
        console.log(`   Senators: ${senators} (expected ~100)`);
        console.log(`   Representatives: ${representatives} (expected ~435)`);
        console.log(`   Total: ${total} (expected ~535)`);

        if (total < 500 || total > 550) {
          console.warn(
            `⚠️  Warning: Total active federal representatives (${total}) is outside expected range (500-550).`,
          );
        } else if (senators < 95 || senators > 105) {
          console.warn(
            `⚠️  Warning: Senator count (${senators}) is outside expected range (95-105). ` +
              `This may indicate missing Senators from prior Congresses.`,
          );
        } else if (representatives < 430 || representatives > 440) {
          console.warn(
            `⚠️  Warning: Representative count (${representatives}) is outside expected range (430-440).`,
          );
        } else {
          console.log(`✅ Verification passed: All counts within expected ranges.`);
        }
      }
    }
  }
}

main().catch((error) => {
  console.error('Congress.gov enrichment failed:', error);
  process.exit(1);
});


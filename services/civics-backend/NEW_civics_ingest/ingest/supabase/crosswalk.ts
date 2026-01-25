import { getSupabaseClient } from '../../clients/supabase.js';
import type { CanonicalRepresentative, CanonicalCrosswalkLink } from '../openstates/people.js';

export interface CrosswalkRow {
  canonical_id: string;
  source: string;
  source_id: string | null;
  attrs: Record<string, unknown> | null;
}

type PrimaryIdentifierKey = Exclude<keyof CanonicalRepresentative['identifiers'], 'other'>;

const SOURCE_TO_IDENTIFIER: Record<string, PrimaryIdentifierKey | undefined> = {
  'open-states': 'openstates',
  'bioguide': 'bioguide',
  'fec': 'fec',
  'wikipedia': 'wikipedia',
  'ballotpedia': 'ballotpedia',
};

const SOURCE_ALIAS: Record<string, PrimaryIdentifierKey | undefined> = {
  'fec-committee': 'fec',
  'fec-candidate': 'fec',
};

export async function fetchCrosswalkEntries(
  canonicalIds: string[],
): Promise<Map<string, CrosswalkRow[]>> {
  if (canonicalIds.length === 0) {
    return new Map();
  }

  const client = getSupabaseClient();
  const map = new Map<string, CrosswalkRow[]>();
  const chunkSize = 50;

  for (let i = 0; i < canonicalIds.length; i += chunkSize) {
    const chunk = canonicalIds.slice(i, i + chunkSize);
    const { data, error } = await client
      .from('id_crosswalk')
      .select('canonical_id, source, source_id, attrs')
      .in('canonical_id', chunk);

    if (error) {
      throw new Error(`Failed to fetch id_crosswalk entries: ${error.message}`);
    }

    const rows = (data ?? []) as CrosswalkRow[];
    for (const row of rows) {
      if (!map.has(row.canonical_id)) {
        map.set(row.canonical_id, []);
      }
      map.get(row.canonical_id)!.push(row);
    }
  }

  return map;
}

export function applyCrosswalkToRepresentative(
  rep: CanonicalRepresentative,
  entries: CrosswalkRow[] | undefined,
): CanonicalRepresentative {
  if (!entries || entries.length === 0) {
    return rep;
  }

  const updatedIdentifiers: CanonicalRepresentative['identifiers'] = {
    ...rep.identifiers,
    other: { ...rep.identifiers.other },
  };
  const crosswalkLinks: CanonicalCrosswalkLink[] = [];
  const mergedSources = new Set<string>(rep.sources);

  for (const entry of entries) {
    if (entry.source === 'fec') {
      if (!entry.source_id) {
        continue;
      }
      if (rep.identifiers.fec && rep.identifiers.fec !== entry.source_id) {
        continue;
      }
    }

    const key = SOURCE_TO_IDENTIFIER[entry.source] ?? SOURCE_ALIAS[entry.source];
    if (key && entry.source_id) {
      updatedIdentifiers[key] = entry.source_id;
    } else if (entry.source_id) {
      updatedIdentifiers.other[entry.source] = entry.source_id;
    }

    mergedSources.add(`crosswalk:${entry.source}`);

    const link: CanonicalCrosswalkLink = {
      source: entry.source,
      sourceId: entry.source_id ?? null,
      canonicalId: entry.canonical_id,
    };

    const qualityScore = extractQualityScore(entry.attrs);
    if (qualityScore !== undefined) {
      link.qualityScore = qualityScore;
    }

    if (entry.attrs) {
      link.rawAttributes = entry.attrs;
    }

    crosswalkLinks.push(link);
  }

  return {
    ...rep,
    identifiers: updatedIdentifiers,
    sources: Array.from(mergedSources),
    crosswalk: crosswalkLinks,
  };
}

function extractQualityScore(attrs: Record<string, unknown> | null): number | undefined {
  if (!attrs) return undefined;
  const value = (attrs as { quality_score?: unknown }).quality_score;
  if (typeof value === 'number') return value;
  return undefined;
}


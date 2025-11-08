import { getSupabaseClient } from '../../clients/supabase.js';
import type { CanonicalRepresentative } from '../openstates/people.js';
import { fetchCrosswalkEntries, applyCrosswalkToRepresentative } from './crosswalk.js';

export interface SupabaseRepresentativeRow {
  id: number;
  name: string;
  office: string | null;
  level: 'federal' | 'state' | 'local' | null;
  state: string | null;
  party: string | null;
  district: string | null;
  openstates_id: string | null;
  canonical_id: string | null;
  is_active: boolean | null;
  bioguide_id: string | null;
  fec_id: string | null;
  google_civic_id: string | null;
  congress_gov_id: string | null;
  wikipedia_url: string | null;
  ballotpedia_url: string | null;
  twitter_handle: string | null;
  facebook_url: string | null;
  instagram_handle: string | null;
  linkedin_url: string | null;
  youtube_channel: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_website: string | null;
  primary_photo_url: string | null;
  term_start_date: string | null;
  term_end_date: string | null;
  next_election_date: string | null;
}

export interface FetchFederalOptions {
  limit?: number;
  states?: string[];
}

function normalizeJurisdiction(row: SupabaseRepresentativeRow): string | null {
  if (row.level === 'federal') {
    if (row.state) {
      return `ocd-jurisdiction/country:us/state:${row.state.toLowerCase()}/government`;
    }
    return 'ocd-jurisdiction/country:us';
  }

  if (row.level === 'state' && row.state) {
    return `ocd-jurisdiction/country:us/state:${row.state.toLowerCase()}/government`;
  }

  return null;
}

function deriveChamber(row: SupabaseRepresentativeRow): CanonicalRepresentative['currentRoles'][number]['chamber'] {
  if (!row.office) return null;
  const office = row.office.toLowerCase();
  if (office.includes('senate') || office.includes('senator')) return 'upper';
  if (office.includes('house') || office.includes('representative')) return 'lower';
  return null;
}

function buildContact(row: SupabaseRepresentativeRow) {
  const emails = row.primary_email ? [row.primary_email] : [];
  const phones = row.primary_phone ? [row.primary_phone] : [];
  const links = row.primary_website ? [row.primary_website] : [];
  return { emails, phones, links };
}

function buildIdentifiers(row: SupabaseRepresentativeRow): CanonicalRepresentative['identifiers'] {
  return {
    openstates: row.openstates_id ?? null,
    bioguide: row.bioguide_id ?? null,
    fec: row.fec_id ?? null,
    wikipedia: row.wikipedia_url ?? null,
    ballotpedia: row.ballotpedia_url ?? null,
  };
}

function sanitizeHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return handle.replace(/^@/, '').trim() || null;
}

function normalizeUrl(platform: string, handle: string | null): string | null {
  if (!handle) return null;
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'youtube':
      return handle.startsWith('http') ? handle : `https://www.youtube.com/${handle}`;
    default:
      return null;
  }
}

function buildSocialFromRow(row: SupabaseRepresentativeRow): CanonicalRepresentative['social'] {
  const social = new Map<string, CanonicalRepresentative['social'][number]>();

  function add(platform: string, handle?: string | null, url?: string | null) {
    const normalizedHandle = sanitizeHandle(handle);
    const normalizedUrl = url ?? normalizeUrl(platform, normalizedHandle);
    const key = `${platform}:${normalizedHandle ?? normalizedUrl ?? ''}`;
    if (!social.has(key)) {
      social.set(key, {
        platform,
        handle: normalizedHandle,
        url: normalizedUrl ?? null,
        isOfficial: true,
      });
    }
  }

  if (row.twitter_handle) {
    add('twitter', row.twitter_handle);
  }
  if (row.facebook_url) {
    add('facebook', null, row.facebook_url);
  }
  if (row.instagram_handle) {
    add('instagram', row.instagram_handle);
  }
  if (row.linkedin_url) {
    add('linkedin', null, row.linkedin_url);
  }
  if (row.youtube_channel) {
    const handle = row.youtube_channel.includes('http') ? null : row.youtube_channel;
    add('youtube', handle, row.youtube_channel);
  }

  return Array.from(social.values());
}

function buildCanonicalFromRow(row: SupabaseRepresentativeRow): CanonicalRepresentative {
  const jurisdiction = normalizeJurisdiction(row);
  const chamber = deriveChamber(row);

  const role = {
    chamber,
    jurisdiction,
    district: row.district,
    startDate: row.term_start_date,
    endDate: row.term_end_date,
  };

  const contacts = buildContact(row);

  return {
    openstatesId: row.openstates_id ?? '',
    canonicalKey: deriveCanonicalKey(row),
    state: row.state ?? '',
    isRetired: row.is_active === false,
    supabaseRepresentativeId: row.id ?? null,
    name: row.name,
    givenName: null,
    familyName: null,
    gender: null,
    party: row.party,
    image: row.primary_photo_url,
    emails: contacts.emails,
    phones: contacts.phones,
    links: contacts.links,
    sources: buildSources(row),
    currentRoles: [role],
    allRoles: [role],
    offices: [],
    identifiers: buildIdentifiers(row),
    social: buildSocialFromRow(row),
  };
}

function buildSources(row: SupabaseRepresentativeRow): string[] {
  const sources = new Set<string>();
  sources.add('supabase:representatives_core');
  if (row.fec_id) sources.add('fec');
  if (row.bioguide_id) sources.add('bioguide');
  if (row.google_civic_id) sources.add('google-civic');
  if (row.congress_gov_id) sources.add('congress-gov');
  if (row.wikipedia_url) sources.add('wikipedia');
  if (row.ballotpedia_url) sources.add('ballotpedia');
  return Array.from(sources);
}

function createNameSlug(name: string | null | undefined): string {
  return name?.toLowerCase().replace(/[^a-z0-9]/g, '_') ?? '';
}

function buildFallbackCanonicalKey(row: SupabaseRepresentativeRow): string {
  if (row.bioguide_id) return `bioguide:${row.bioguide_id}`;
  if (row.fec_id) return `fec:${row.fec_id}`;
  if (row.openstates_id) return `openstates:${row.openstates_id}`;

  const nameSlug = createNameSlug(row.name);
  const state = row.state ?? 'unknown';
  const district = row.district ?? 'at-large';
  return `name:${state}:${nameSlug || 'unknown'}:${district}`;
}

function shouldTrustCanonicalId(row: SupabaseRepresentativeRow): boolean {
  if (!row.canonical_id) return false;
  const canonical = row.canonical_id.toLowerCase();
  if (canonical.startsWith('canonical-ocd-person/')) return true;
  if (row.bioguide_id && canonical.includes(row.bioguide_id.toLowerCase())) return true;
  if (row.fec_id && canonical.includes(row.fec_id.toLowerCase())) return true;
  const nameSlug = createNameSlug(row.name);
  if (nameSlug && canonical.includes(nameSlug)) return true;
  return false;
}

function deriveCanonicalKey(row: SupabaseRepresentativeRow): string {
  if (shouldTrustCanonicalId(row)) {
    return row.canonical_id as string;
  }
  return buildFallbackCanonicalKey(row);
}

function isSyntheticRepresentative(rep: CanonicalRepresentative): boolean {
  const name = rep.name?.toLowerCase() ?? '';
  return (
    name.startsWith('test representative') ||
    name.includes(' sample ') ||
    name.includes('placeholder')
  );
}

export async function fetchRepresentativeCoreByOpenStates(
  openstatesIds: string[],
): Promise<Map<string, SupabaseRepresentativeRow>> {
  if (openstatesIds.length === 0) return new Map();

  const client = getSupabaseClient();
  const map = new Map<string, SupabaseRepresentativeRow>();
  const chunkSize = 40;

  for (let i = 0; i < openstatesIds.length; i += chunkSize) {
    const chunk = openstatesIds.slice(i, i + chunkSize);
    const { data, error } = await client
      .from('representatives_core')
      .select(
        `id,name,office,level,state,party,district,openstates_id,canonical_id,is_active,bioguide_id,fec_id,google_civic_id,congress_gov_id,wikipedia_url,ballotpedia_url,twitter_handle,facebook_url,instagram_handle,linkedin_url,youtube_channel,primary_email,primary_phone,primary_website,primary_photo_url,term_start_date,term_end_date,next_election_date`,
      )
      .in('openstates_id', chunk);

    if (error) {
      throw new Error(`Failed to fetch representatives_core rows: ${error.message}`);
    }

    const rows = (data ?? []) as SupabaseRepresentativeRow[];
    for (const row of rows) {
      if (row.openstates_id) {
        map.set(row.openstates_id, row);
      }
    }
  }

  return map;
}

export function applyRepresentativeCore(
  rep: CanonicalRepresentative,
  row: SupabaseRepresentativeRow | undefined,
): CanonicalRepresentative {
  if (!row) return rep;

  const contact = buildContact(row);
  const identifiers = {
    ...rep.identifiers,
    bioguide: row.bioguide_id ?? rep.identifiers.bioguide,
    fec: row.fec_id ?? rep.identifiers.fec,
    wikipedia: row.wikipedia_url ?? rep.identifiers.wikipedia,
    ballotpedia: row.ballotpedia_url ?? rep.identifiers.ballotpedia,
  };

  const sources = new Set<string>(rep.sources);
  sources.add('supabase:representatives_core');

  return {
    ...rep,
    canonicalKey: deriveCanonicalKey(row),
    supabaseRepresentativeId: row.id ?? rep.supabaseRepresentativeId ?? null,
    party: row.party ?? rep.party,
    image: row.primary_photo_url ?? rep.image,
    emails: mergeUnique(rep.emails, contact.emails),
    phones: mergeUnique(rep.phones, contact.phones),
    links: mergeUnique(rep.links, contact.links),
    identifiers,
    sources: Array.from(sources),
    social: mergeSocialProfiles(rep.social, buildSocialFromRow(row)),
    currentRoles: rep.currentRoles.map((role) => ({
      ...role,
      jurisdiction: role.jurisdiction ?? normalizeJurisdiction(row),
      chamber: role.chamber ?? deriveChamber(row),
      district: role.district ?? row.district,
      startDate: role.startDate ?? row.term_start_date,
      endDate: role.endDate ?? row.term_end_date,
    })),
    allRoles: rep.allRoles,
  };
}

export async function fetchFederalRepresentatives(
  options: FetchFederalOptions = {},
): Promise<CanonicalRepresentative[]> {
  const client = getSupabaseClient();
  const { limit = 250, states } = options;

  let query = client
    .from('representatives_core')
    .select(
      `id,name,office,level,state,party,district,openstates_id,canonical_id,is_active,bioguide_id,fec_id,google_civic_id,congress_gov_id,wikipedia_url,ballotpedia_url,twitter_handle,facebook_url,instagram_handle,linkedin_url,youtube_channel,primary_email,primary_phone,primary_website,primary_photo_url,term_start_date,term_end_date,next_election_date`,
    )
    .eq('level', 'federal')
    .eq('is_active', true)
    .order('state', { ascending: true })
    .limit(limit);

  if (states && states.length > 0) {
    query = query.in('state', states.map((state) => state.toUpperCase()));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch federal representatives: ${error.message}`);
  }

  if (!data) return [];

  const rows = (data ?? []) as SupabaseRepresentativeRow[];

  const canonicalIds = rows
    .map((row) => (shouldTrustCanonicalId(row) ? (row.canonical_id as string) : null))
    .filter((id): id is string => Boolean(id));

  const crosswalkMap = await fetchCrosswalkEntries(canonicalIds);

  const deduped = new Map<string, CanonicalRepresentative>();

  for (const row of rows) {
    const rep = buildCanonicalFromRow(row);
    const enriched = applyCrosswalkToRepresentative(rep, crosswalkMap.get(rep.canonicalKey));
    if (!enriched.identifiers.fec && !enriched.identifiers.bioguide) {
      continue;
    }
    if (!deduped.has(enriched.canonicalKey)) {
      deduped.set(enriched.canonicalKey, enriched);
    }
  }

  return Array.from(deduped.values()).filter((rep) => !isSyntheticRepresentative(rep));
}

function mergeUnique(existing: string[], additions: string[]): string[] {
  const merged = new Set<string>(existing);
  for (const value of additions) {
    if (value) merged.add(value);
  }
  return Array.from(merged);
}

function mergeSocialProfiles(
  existing: CanonicalRepresentative['social'],
  additions: CanonicalRepresentative['social'],
): CanonicalRepresentative['social'] {
  const combined = new Map<string, CanonicalRepresentative['social'][number]>();
  for (const entry of existing) {
    const key = `${entry.platform}:${entry.handle ?? entry.url ?? ''}`;
    combined.set(key, entry);
  }
  for (const entry of additions) {
    const key = `${entry.platform}:${entry.handle ?? entry.url ?? ''}`;
    if (!combined.has(key)) {
      combined.set(key, entry);
    }
  }
  return Array.from(combined.values());
}


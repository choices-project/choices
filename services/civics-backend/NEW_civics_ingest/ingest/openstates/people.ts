/**
 * Utilities for turning the OpenStates "people" YAML archive into the canonical
 * representative shape used throughout the ingest service. This module does **not**
 * talk to the live OpenStates API – it only reads the vendored YAML snapshots that
 * describe state, executive, and municipal officials.
 *
 * The code here is intentionally file-system oriented so that state-level ingest runs
 * can operate without network access. API-based enrichment lives in
 * `src/clients/openstates.ts` and related enrichers.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export interface CanonicalOffice {
  classification: string | null;
  name: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
}

export interface CanonicalRole {
  chamber: string | null;
  jurisdiction: string | null;
  district: string | null;
  divisionId: string | null;
  title: string | null;
  memberRole: string | null;
  startDate: string | null;
  endDate: string | null;
  endReason: string | null;
}

export interface CanonicalIdentifiers {
  openstates: string | null;
  bioguide: string | null;
  fec: string | null;
  wikipedia: string | null;
  ballotpedia: string | null;
  other: Record<string, string>;
}

export interface CanonicalCrosswalkLink {
  source: string;
  sourceId: string | null;
  canonicalId: string;
  qualityScore?: number;
  rawAttributes?: Record<string, unknown> | null;
}

export interface CanonicalSocialProfile {
  platform: string;
  handle: string | null;
  url: string | null;
  isOfficial: boolean;
}

export interface CanonicalRepresentative {
  openstatesId: string;
  canonicalKey: string;
  state: string;
  isRetired: boolean;
  supabaseRepresentativeId: number | null;
  name: string;
  givenName: string | null;
  familyName: string | null;
  middleName: string | null;
  nickname: string | null;
  suffix: string | null;
  gender: string | null;
  party: string | null;
  image: string | null;
  birthDate: string | null;
  deathDate: string | null;
  biography: string | null;
  emails: string[];
  phones: string[];
  links: string[];
  sources: string[];
  crosswalk?: CanonicalCrosswalkLink[];
  currentRoles: CanonicalRole[];
  allRoles: CanonicalRole[];
  offices: CanonicalOffice[];
  identifiers: CanonicalIdentifiers;
  social: CanonicalSocialProfile[];
  aliases: CanonicalAlias[];
  extras: Record<string, unknown> | null;
}

export interface CanonicalAlias {
  name: string;
  startDate: string | null;
  endDate: string | null;
}

interface ParseOptions {
  states?: string[];
  includeRetired?: boolean;
  includeInactive?: boolean;
}

// Resolve path relative to source directory (NEW_civics_ingest), not build directory
// From build/ingest/openstates/people.js, we need to go to NEW_civics_ingest/data/openstates-people/data
// From source NEW_civics_ingest/ingest/openstates/people.ts, we need to go to NEW_civics_ingest/data/openstates-people/data
const PACKAGE_ROOT = (() => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  // If running from build/ingest/openstates/people.js, go up to project root then into NEW_civics_ingest
  const fromBuild = path.resolve(currentDir, '../../../NEW_civics_ingest');
  // If running from source NEW_civics_ingest/ingest/openstates/people.ts, go up two levels
  const fromSource = path.resolve(currentDir, '../..');
  
  // Check which one has the data directory
  if (existsSync(path.resolve(fromBuild, 'data/openstates-people/data'))) {
    return fromBuild;
  }
  if (existsSync(path.resolve(fromSource, 'data/openstates-people/data'))) {
    return fromSource;
  }
  // Default to source path
  return fromSource;
})();

const PEOPLE_ROOT = path.resolve(PACKAGE_ROOT, 'data/openstates-people/data');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Iterate through OpenStates YAML files on disk and yield canonicalized representative
 * objects. Consumers can filter by state or include retired/inactive people, but by
 * default the generator only returns currently serving officials.
 *
 * @param options.states Optional list of two-letter state codes to include (case-insensitive)
 * @param options.includeRetired When true, include entries under the `retired` folders
 * @param options.includeInactive When true, include people who no longer have any current roles
 */
export async function* readOpenStatesPeople(
  options: ParseOptions = {},
): AsyncGenerator<CanonicalRepresentative> {
  const { states, includeRetired = false, includeInactive = false } = options;
  const normalizedStates = states?.map((state) => state.toLowerCase());
  const stateFilter = normalizedStates ? new Set(normalizedStates) : null;

  const stateEntries = await readdir(PEOPLE_ROOT, { withFileTypes: true });

  for (const entry of stateEntries) {
    if (!entry.isDirectory()) continue;

    const stateCode = entry.name.toLowerCase();
    if (stateFilter && !stateFilter.has(stateCode)) continue;

    const categories = [
      { dir: 'legislature', isRetired: false },
      { dir: 'executive', isRetired: false },
      { dir: 'municipalities', isRetired: false },
    ];

    if (includeRetired) {
      categories.push({ dir: 'retired', isRetired: true });
    }

    for (const category of categories) {
      const dir = path.join(PEOPLE_ROOT, stateCode, category.dir);
      let files: import('fs').Dirent[];

      try {
        files = await readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.yml')) continue;

        const filePath = path.join(dir, file.name);
        const person = await parsePersonFile(filePath, {
          stateCode: stateCode.toUpperCase(),
          isRetired: category.isRetired,
        });

        if (!person) continue;
        if (!includeInactive && person.currentRoles.length === 0) continue;

        yield person;
      }
    }
  }
}

/**
 * Parse a single YAML file and promote it into a `CanonicalRepresentative`. Returns `null`
 * when the file cannot be parsed or lacks an OpenStates person identifier.
 */
async function parsePersonFile(
  filePath: string,
  context: { stateCode: string; isRetired: boolean },
): Promise<CanonicalRepresentative | null> {
  try {
    const raw = yaml.load(await readFile(filePath, 'utf8')) as Record<string, any>;
    if (!raw || typeof raw !== 'object') return null;
    return buildCanonicalPerson(raw, context);
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Promote a raw OpenStates person record into the canonical in-memory representation. This
 * step is strictly deterministic and does not perform any Supabase lookups; it prepares the
 * data so that downstream pipelines (dedupe, enrichment, persistence) can run uniformly.
 */
function buildCanonicalPerson(
  raw: Record<string, any>,
  { stateCode, isRetired }: { stateCode: string; isRetired: boolean },
): CanonicalRepresentative | null {
  const openstatesId = extractOpenStatesId(raw);
  if (!openstatesId) return null;

  const roles = Array.isArray(raw.roles) ? raw.roles : [];
  const offices = Array.isArray(raw.offices) ? raw.offices : [];

  const currentRoles = roles.filter((role) => isRoleActive(role));
  const allRoles = roles.map(normalizeRole);

  const contactInfo = collectContactInfo(raw, offices);
  const normalizedLinks = normalizeUrlArray(raw.links);
  const combinedLinks = mergeUniqueStrings(normalizedLinks, contactInfo.links);
  const normalizedSources = normalizeUrlArray(raw.sources);

  return {
    openstatesId,
    canonicalKey: buildCanonicalKey(raw, { openstatesId, stateCode }),
    state: stateCode,
    isRetired,
    supabaseRepresentativeId: null,
    name: String(raw.name ?? ''),
    givenName: raw.given_name ?? null,
    familyName: raw.family_name ?? null,
    middleName: raw.middle_name ?? null,
    nickname: raw.nickname ?? null,
    suffix: raw.suffix ?? null,
    gender: raw.gender ?? null,
    party: extractParty(raw),
    image: raw.image ?? null,
    birthDate: raw.birth_date ?? null,
    deathDate: raw.death_date ?? null,
    biography: typeof raw.biography === 'string' ? raw.biography : null,
    emails: contactInfo.emails,
    phones: contactInfo.phones,
    links: combinedLinks,
    sources: normalizedSources,
    currentRoles: currentRoles.map(normalizeRole),
    allRoles,
    offices: offices.map(normalizeOffice),
    identifiers: {
      openstates: openstatesId,
      bioguide: raw?.ids?.bioguide ?? raw.bioguide_id ?? null,
      fec: raw?.ids?.fec ?? raw.fec_id ?? null,
      wikipedia: extractUrlForDomain(raw.links, 'wikipedia.org'),
      ballotpedia: extractUrlForDomain(raw.links, 'ballotpedia.org'),
      other: collectOtherIdentifiers(raw),
    },
    social: collectSocialProfiles(raw, normalizedLinks),
    aliases: collectAliases(raw),
    extras: extractExtras(raw),
  };
}

function extractOpenStatesId(raw: Record<string, any>): string | null {
  if (typeof raw.id === 'string' && raw.id.startsWith('ocd-person/')) {
    return raw.id;
  }

  if (typeof raw.ids?.openstates === 'string') {
    return raw.ids.openstates;
  }

  return null;
}

function buildCanonicalKey(
  _raw: Record<string, any>,
  { openstatesId, stateCode: _stateCode }: { openstatesId: string; stateCode: string },
): string {
  return `canonical-${openstatesId}`;
}

function extractParty(raw: Record<string, any>): string | null {
  if (Array.isArray(raw.party) && raw.party.length > 0) {
    return raw.party[0]?.name ?? null;
  }
  if (typeof raw.party === 'string') {
    return raw.party;
  }
  return null;
}

const EMAIL_CONTACT_TYPES = new Set(['email', 'email address']);
const PHONE_CONTACT_TYPES = new Set(['voice', 'phone', 'telephone', 'office phone', 'main']);
const URL_CONTACT_TYPES = new Set(['url', 'website', 'home page', 'link']);
const FAX_CONTACT_TYPES = new Set(['fax']);

/**
 * Collects contact information from the raw YAML shape, deduplicating email/phone/link
 * values that appear across both the person record and office listings.
 */
function collectContactInfo(
  raw: Record<string, any>,
  offices: Array<Record<string, any>>,
): { emails: string[]; phones: string[]; links: string[] } {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const links = new Set<string>();

  const addEmail = (value: unknown) => {
    if (!value) return;
    const normalized = String(value).trim().toLowerCase();
    if (normalized) {
      emails.add(normalized);
    }
  };

  const addPhone = (value: unknown) => {
    if (!value) return;
    const normalized = String(value).trim();
    if (normalized) {
      phones.add(normalized);
    }
  };

  const addLink = (value: unknown) => {
    if (!value) return;
    const normalized = String(value).trim();
    if (normalized) {
      links.add(normalized);
    }
  };

  if (raw.email) {
    addEmail(raw.email);
  }

  if (Array.isArray(raw.contact_details)) {
    for (const entry of raw.contact_details) {
      if (!entry?.value) continue;
      const type = typeof entry.type === 'string' ? entry.type.toLowerCase() : '';
      if (EMAIL_CONTACT_TYPES.has(type)) {
        addEmail(entry.value);
      } else if (PHONE_CONTACT_TYPES.has(type) || FAX_CONTACT_TYPES.has(type)) {
        addPhone(entry.value);
      } else if (URL_CONTACT_TYPES.has(type)) {
        addLink(entry.value);
      }
    }
  }

  for (const office of offices) {
    addEmail(office?.email);
    addPhone(office?.voice);
    addLink(office?.url);
  }

  return {
    emails: Array.from(emails),
    phones: Array.from(phones),
    links: Array.from(links),
  };
}

function normalizeUrlArray(values: any): string[] {
  if (!Array.isArray(values)) return [];
  const urls = new Set<string>();
  for (const entry of values) {
    let candidate: unknown;
    if (!entry) {
      candidate = null;
    } else if (typeof entry === 'string') {
      candidate = entry;
    } else if (typeof entry === 'object' && typeof entry.url === 'string') {
      candidate = entry.url;
    } else {
      candidate = null;
    }

    if (!candidate) continue;
    const normalized = String(candidate).trim();
    if (normalized) {
      urls.add(normalized);
    }
  }
  return Array.from(urls);
}

function mergeUniqueStrings(
  ...collections: Array<Iterable<string> | null | undefined>
): string[] {
  const merged = new Set<string>();
  for (const collection of collections) {
    if (!collection) continue;
    for (const value of collection) {
      if (!value) continue;
      const normalized = String(value).trim();
      if (normalized) {
        merged.add(normalized);
      }
    }
  }
  return Array.from(merged);
}

function isRoleActive(role: Record<string, any>): boolean {
  if (!role) return false;
  if (!role.end_date) return true;
  if (!ISO_DATE.test(role.end_date)) return false;

  const endDate = new Date(role.end_date);
  return endDate >= new Date();
}

function normalizeRole(role: Record<string, any>): CanonicalRole {
  return {
    chamber: role?.type ?? null,
    jurisdiction: role?.jurisdiction ?? null,
    district: role?.district ?? null,
    divisionId: role?.division_id ?? null,
    title: role?.title ?? null,
    memberRole: role?.role ?? null,
    startDate: role?.start_date ?? null,
    endDate: role?.end_date ?? null,
    endReason: role?.end_reason ?? null,
  };
}

function normalizeOffice(office: Record<string, any>): CanonicalOffice {
  return {
    classification: office?.classification ?? null,
    name: office?.name ?? null,
    address: office?.address ?? null,
    phone: office?.voice ?? null,
    fax: office?.fax ?? null,
    email: office?.email ?? null,
  };
}

function extractUrlForDomain(links: any, domain: string): string | null {
  if (!Array.isArray(links)) return null;
  for (const entry of links) {
    const url = typeof entry === 'string' ? entry : entry?.url;
    if (typeof url === 'string' && url.includes(domain)) {
      return url;
    }
  }
  return null;
}

const KNOWN_SOCIAL_IDS: Record<string, string> = {
  twitter: 'twitter',
  twitter_id: 'twitter',
  facebook: 'facebook',
  facebook_id: 'facebook',
  instagram: 'instagram',
  instagram_id: 'instagram',
  youtube: 'youtube',
  youtube_id: 'youtube',
  youtube_channel: 'youtube',
  tiktok: 'tiktok',
  linkedin: 'linkedin',
  linkedin_id: 'linkedin',
};

const RESERVED_IDENTIFIER_SCHEMES = new Set([
  'openstates',
  'bioguide',
  'fec',
  'wikipedia',
  'wiki',
  'ballotpedia',
  'twitter',
  'twitter_id',
  'facebook',
  'instagram',
  'youtube',
  'linkedin',
  'tiktok',
  'google',
  'google_civic',
  'wikidata',
]);

const SOCIAL_DOMAINS: Array<{ domain: string; platform: string }> = [
  { domain: 'twitter.com', platform: 'twitter' },
  { domain: 'facebook.com', platform: 'facebook' },
  { domain: 'instagram.com', platform: 'instagram' },
  { domain: 'youtube.com', platform: 'youtube' },
  { domain: 'tiktok.com', platform: 'tiktok' },
  { domain: 'linkedin.com', platform: 'linkedin' },
];

function buildPlatformUrl(platform: string, handle: string | null): string | null {
  if (!handle) return null;
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'youtube':
      return `https://www.youtube.com/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle}`;
    default:
      return null;
  }
}

function sanitizeHandle(value: string | null | undefined): string | null {
  if (!value) return null;
  let normalized = value.trim();
  normalized = normalized.replace(/^https?:\/\/(www\.)?/i, '');
  normalized = normalized.replace(/^@/, '');
  normalized = normalized.replace(/\?.*$/, '');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length > 1) {
    normalized = segments[segments.length - 1] ?? normalized;
  } else if (segments.length === 1) {
    normalized = segments[0] ?? normalized;
  }
  normalized = normalized.trim();
  return normalized || null;
}

function buildSocialProfile(params: {
  platform: string;
  handle?: string | null;
  url?: string | null;
  isOfficial?: boolean;
}): CanonicalSocialProfile {
  const handle = params.handle ? params.handle.replace(/^@/, '').trim() : null;
  const preferredUrl = params.url ?? buildPlatformUrl(params.platform, handle);
  return {
    platform: params.platform,
    handle: handle ?? null,
    url: preferredUrl,
    isOfficial: params.isOfficial ?? true,
  };
}

function collectSocialProfiles(
  raw: Record<string, any>,
  normalizedLinks: string[],
): CanonicalSocialProfile[] {
  const profiles = new Map<string, CanonicalSocialProfile>();

  function addProfile(profile: CanonicalSocialProfile) {
    const key = `${profile.platform}:${profile.handle ?? profile.url ?? ''}`;
    if (!profiles.has(key)) {
      profiles.set(key, profile);
    }
  }

  const ids = raw?.ids ?? {};
  if (ids && typeof ids === 'object') {
    for (const [key, value] of Object.entries(ids)) {
      const platform = KNOWN_SOCIAL_IDS[key.toLowerCase()];
      if (!platform || typeof value !== 'string') continue;
      addProfile(
        buildSocialProfile({
          platform,
          handle: sanitizeHandle(value),
          url: value.includes('http') ? value : null,
          isOfficial: true,
        }),
      );
    }
  }

  if (Array.isArray(raw.social_media)) {
    for (const entry of raw.social_media) {
      if (!entry?.platform || !entry?.username) continue;
      addProfile(
        buildSocialProfile({
          platform: entry.platform.toLowerCase(),
          handle: sanitizeHandle(entry.username),
          url: entry.url ?? null,
          isOfficial: true,
        }),
      );
    }
  }

  for (const link of normalizedLinks) {
    const match = SOCIAL_DOMAINS.find(({ domain }) => link.includes(domain));
    if (!match) continue;
    const url = link;
    const handleCandidate = url.split('/').filter(Boolean).pop();
    addProfile(
      buildSocialProfile({
        platform: match.platform,
        handle: sanitizeHandle(handleCandidate),
        url,
        isOfficial: true,
      }),
    );
  }

  return Array.from(profiles.values());
}

function collectOtherIdentifiers(raw: Record<string, any>): Record<string, string> {
  const entries = new Map<string, string>();

  const add = (scheme: unknown, value: unknown) => {
    if (!scheme || !value) return;
    const normalizedScheme = String(scheme).trim().toLowerCase();
    if (!normalizedScheme || RESERVED_IDENTIFIER_SCHEMES.has(normalizedScheme)) return;

    const normalizedValue = String(value).trim();
    if (!normalizedValue) return;

    if (!entries.has(normalizedScheme)) {
      entries.set(normalizedScheme, normalizedValue);
    }
  };

  const addFromArray = (identifierList: any) => {
    if (!Array.isArray(identifierList)) return;
    for (const identifier of identifierList) {
      if (!identifier) continue;
      add(identifier.scheme, identifier.identifier);
    }
  };

  addFromArray(raw.identifiers);
  addFromArray(raw.other_identifiers);

  if (raw.ids && typeof raw.ids === 'object') {
    for (const [scheme, value] of Object.entries(raw.ids)) {
      add(scheme, value);
    }
  }

  if (entries.size === 0) {
    return {};
  }

  return Object.fromEntries(entries.entries());
}

function collectAliases(raw: Record<string, any>): CanonicalAlias[] {
  if (!Array.isArray(raw.other_names)) return [];
  return raw.other_names
    .filter((entry): entry is { name: string; start_date?: string; end_date?: string } => typeof entry?.name === 'string')
    .map((entry) => ({
      name: entry.name,
      startDate: entry.start_date ?? null,
      endDate: entry.end_date ?? null,
    }));
}

function extractExtras(raw: Record<string, any>): Record<string, unknown> | null {
  if (!raw?.extras || typeof raw.extras !== 'object') {
    return null;
  }
  return { ...(raw.extras as Record<string, unknown>) };
}

export { buildCanonicalPerson as _test_buildCanonicalPerson };


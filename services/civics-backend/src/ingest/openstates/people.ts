import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export interface CanonicalOffice {
  classification: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
}

export interface CanonicalRole {
  chamber: string | null;
  jurisdiction: string | null;
  district: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CanonicalIdentifiers {
  openstates: string | null;
  bioguide: string | null;
  fec: string | null;
  wikipedia: string | null;
  ballotpedia: string | null;
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
  gender: string | null;
  party: string | null;
  image: string | null;
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
}

interface ParseOptions {
  states?: string[];
  includeRetired?: boolean;
  includeInactive?: boolean;
}

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);

const PEOPLE_ROOT = path.resolve(PACKAGE_ROOT, 'data/openstates-people/data');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  const normalizedLinks = normalizeUrlArray(raw.links);

  return {
    openstatesId,
    canonicalKey: buildCanonicalKey(raw, { openstatesId, stateCode }),
    state: stateCode,
    isRetired,
    supabaseRepresentativeId: null,
    name: String(raw.name ?? ''),
    givenName: raw.given_name ?? null,
    familyName: raw.family_name ?? null,
    gender: raw.gender ?? null,
    party: extractParty(raw),
    image: raw.image ?? null,
    emails: collectEmails(raw, offices),
    phones: collectPhones(offices),
    links: normalizedLinks,
    sources: normalizeUrlArray(raw.sources),
    currentRoles: currentRoles.map(normalizeRole),
    allRoles,
    offices: offices.map(normalizeOffice),
    identifiers: {
      openstates: openstatesId,
      bioguide: raw?.ids?.bioguide ?? raw.bioguide_id ?? null,
      fec: raw?.ids?.fec ?? raw.fec_id ?? null,
      wikipedia: extractUrlForDomain(raw.links, 'wikipedia.org'),
      ballotpedia: extractUrlForDomain(raw.links, 'ballotpedia.org'),
    },
    social: collectSocialProfiles(raw, normalizedLinks),
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
  raw: Record<string, any>,
  { openstatesId, stateCode }: { openstatesId: string; stateCode: string },
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

function collectEmails(raw: Record<string, any>, offices: any[]): string[] {
  const emails = new Set<string>();

  if (raw.email) {
    emails.add(String(raw.email).toLowerCase());
  }

  for (const office of offices) {
    if (office?.email) {
      emails.add(String(office.email).toLowerCase());
    }
  }

  return Array.from(emails);
}

function collectPhones(offices: any[]): string[] {
  const phones = new Set<string>();
  for (const office of offices) {
    if (office?.voice) {
      phones.add(String(office.voice));
    }
  }
  return Array.from(phones);
}

function normalizeUrlArray(values: any): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return entry;
      if (typeof entry === 'object' && typeof entry.url === 'string') {
        return entry.url;
      }
      return null;
    })
    .filter((url): url is string => Boolean(url));
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
    startDate: role?.start_date ?? null,
    endDate: role?.end_date ?? null,
  };
}

function normalizeOffice(office: Record<string, any>): CanonicalOffice {
  return {
    classification: office?.classification ?? null,
    address: office?.address ?? null,
    phone: office?.voice ?? null,
    fax: office?.fax ?? null,
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

const SOCIAL_DOMAINS: Array<{ domain: string; platform: string }> = [
  { domain: 'twitter.com', platform: 'twitter' },
  { domain: 'facebook.com', platform: 'facebook' },
  { domain: 'instagram.com', platform: 'instagram' },
  { domain: 'youtube.com', platform: 'youtube' },
  { domain: 'tiktok.com', platform: 'tiktok' },
  { domain: 'linkedin.com', platform: 'linkedin' },
];

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
  const preferredUrl =
    params.url ??
    (handle
      ? `https://www.${params.platform}.com/${handle}`
      : null);
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


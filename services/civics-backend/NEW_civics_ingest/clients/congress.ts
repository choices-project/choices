import { URL } from 'node:url';

const BASE_URL = 'https://api.congress.gov/v3';
const DEFAULT_PAGE_SIZE = 250;
const CONGRESS_GOV_THROTTLE_MS = Number(process.env.CONGRESS_GOV_THROTTLE_MS ?? '1500');
const CONGRESS_GOV_MAX_RETRIES = 3;

let lastCongressRequestAt = 0;

async function throttleCongressRequest(): Promise<void> {
  if (CONGRESS_GOV_THROTTLE_MS <= 0) return;
  const now = Date.now();
  const wait = Math.max(0, lastCongressRequestAt + CONGRESS_GOV_THROTTLE_MS - now);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastCongressRequestAt = Date.now();
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retryCount = 0,
): Promise<Response> {
  await throttleCongressRequest();
  const response = await fetch(url, { headers });
  if (response.status === 429 && retryCount < CONGRESS_GOV_MAX_RETRIES) {
    const retryAfter = response.headers.get('Retry-After');
    const backoffMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, retryCount) * 5000;
    console.warn(
      `Congress.gov rate limit (429). Retrying in ${backoffMs / 1000}s (attempt ${retryCount + 1}/${CONGRESS_GOV_MAX_RETRIES})...`,
    );
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return fetchWithRetry(url, headers, retryCount + 1);
  }
  return response;
}

/**
 * Current Congress (119th, Jan 2025–).
 * The `/member/congress/119` endpoint returns ALL currently serving members, including:
 * - All newly elected Representatives (2-year terms)
 * - All Senators continuing from 118th Congress (6-year terms, elected 2018, 2020, 2022)
 * - All newly elected Senators (6-year terms, elected 2024)
 * Expected: ~535 total members (435 House + 100 Senate)
 */
const CURRENT_CONGRESS = 119;

export interface CongressMember {
  memberId: string | null;
  bioguideId: string | null;
  govInfoId: string | null;
  state: string | null;
  district: string | null;
  party: string | null;
  url: string | null;
  name: string | null;
}

/** Extended member data from the member-item endpoint (contact, portrait, legislation counts). */
export interface CongressMemberDetail {
  /** Same base fields as list response. */
  member: CongressMember;
  /** DC office phone, e.g. (202) 224-4242. */
  contactPhone: string | null;
  /** Full DC office address. */
  contactAddress: string | null;
  /** Official portrait URL. */
  portraitUrl: string | null;
  /** Official website (same as member.url when present). */
  url: string | null;
  birthYear: number | null;
  /** Total sponsored bills/resolutions. */
  sponsoredCount: number | null;
  /** Total cosponsored bills/resolutions. */
  cosponsoredCount: number | null;
  /** Leadership titles, e.g. ["President Pro Tempore"]. */
  leadershipTitles: string[];
}

class MissingCongressApiKeyError extends Error {
  constructor() {
    super('CONGRESS_GOV_API_KEY is required to fetch Congress.gov member data.');
  }
}

function getCongressApiKey(): string {
  const key =
    process.env.CONGRESS_GOV_API_KEY ??
    process.env.CONGRESS_GOV_APIKEY ??
    process.env.CONGRESS_GOV_KEY;
  if (!key) {
    throw new MissingCongressApiKeyError();
  }
  return key;
}

function normaliseString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function extractDistrict(raw: any): string | null {
  const district = raw?.district ?? raw?.role?.district ?? raw?.districtCode;
  if (district === undefined || district === null) return null;
  const normalised = String(district).trim();
  if (normalised.length === 0 || normalised.toLowerCase() === 'null') return null;
  return normalised;
}

/** Full state/territory name → 2-letter code. Matches enrich STATE_CODE_MAP. */
const STATE_NAME_TO_CODE: Record<string, string> = {
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
  NEW_HAMPSHIRE: 'NH',
  NEW_JERSEY: 'NJ',
  NEW_MEXICO: 'NM',
  NEW_YORK: 'NY',
  NORTH_CAROLINA: 'NC',
  NORTH_DAKOTA: 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  RHODE_ISLAND: 'RI',
  SOUTH_CAROLINA: 'SC',
  SOUTH_DAKOTA: 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  WEST_VIRGINIA: 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  DISTRICT_OF_COLUMBIA: 'DC',
  GUAM: 'GU',
  NORTHERN_MARIANA_ISLANDS: 'MP',
  PUERTO_RICO: 'PR',
  AMERICAN_SAMOA: 'AS',
  US_VIRGIN_ISLANDS: 'VI',
  VIRGIN_ISLANDS: 'VI'
};

function extractState(raw: any): string | null {
  const state =
    raw?.stateCode ??
    raw?.state ??
    raw?.role?.stateCode ??
    raw?.role?.state ??
    raw?.addressState ??
    raw?.postalState;
  if (!state) return null;
  const normalised = String(state).trim().toUpperCase();
  if (normalised.length === 2) return normalised;
  const key = normalised.replace(/\s+/g, '_').replace(/\./g, '');
  return STATE_NAME_TO_CODE[key] ?? null;
}

function extractName(raw: any): string | null {
  const direct =
    normaliseString(raw?.name) ??
    normaliseString(raw?.personName) ??
    normaliseString(raw?.fullName) ??
    normaliseString(raw?.officialName);
  if (direct) {
    return direct;
  }

  const first = normaliseString(raw?.firstName ?? raw?.first_name);
  const middle = normaliseString(raw?.middleName ?? raw?.middle_name);
  const last = normaliseString(raw?.lastName ?? raw?.last_name);
  const parts = [first, middle, last].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return null;
}

export async function fetchCongressMembers(): Promise<CongressMember[]> {
  const apiKey = getCongressApiKey();
  const members: CongressMember[] = [];

  let nextUrl: string | null = buildMembersUrl(0);
  let safetyCounter = 0;

  while (nextUrl) {
    const response = await fetchWithRetry(nextUrl, { 'X-API-Key': apiKey });
    if (!response.ok) {
      const body = await safeJson(response);
      throw new Error(
        `Congress.gov request failed (${response.status} ${response.statusText}): ${JSON.stringify(
          body,
        )}`,
      );
    }

    const payload: any = await response.json();
    const pageMembers = Array.isArray(payload.members) ? payload.members : [];
    for (const raw of pageMembers) {
      members.push(normalizeMember(raw));
    }

    const pagination = payload.pagination ?? {};
    nextUrl = typeof pagination.next === 'string' && pagination.next.length > 0 ? pagination.next : null;

    safetyCounter += 1;
    if (safetyCounter > 500) {
      throw new Error('Congress.gov pagination exceeded reasonable bounds (500 pages).');
    }
  }

  // Validation: Verify we got expected number of members
  // Expected: ~535 total (435 Representatives + 100 Senators)
  // The 119th Congress endpoint should return ALL currently serving members,
  // including Senators continuing from prior Congresses (6-year terms)
  const EXPECTED_MIN = 500; // Allow some variance for vacancies, special elections, etc.
  const EXPECTED_MAX = 550; // Upper bound to catch duplicates or errors
  if (members.length < EXPECTED_MIN) {
    console.warn(
      `⚠️  Warning: Congress.gov API returned only ${members.length} members for ${CURRENT_CONGRESS}th Congress. ` +
        `Expected ~535 (435 House + 100 Senate). This may indicate missing members from prior Congresses.`,
    );
  } else if (members.length > EXPECTED_MAX) {
    console.warn(
      `⚠️  Warning: Congress.gov API returned ${members.length} members for ${CURRENT_CONGRESS}th Congress. ` +
        `Expected ~535. This may indicate duplicates or data quality issues.`,
    );
  }

  return members;
}

/**
 * Fetch raw member-item JSON (for debugging). Same URL as fetchMemberByBioguide.
 */
export async function fetchMemberByBioguideRaw(bioguideId: string): Promise<any> {
  const bioguide = normaliseString(bioguideId);
  if (!bioguide) return null;

  const apiKey = getCongressApiKey();
  const url = new URL(`${BASE_URL}/member/${encodeURIComponent(bioguide)}`);
  url.searchParams.set('format', 'json');

  const response = await fetchWithRetry(url.toString(), { 'X-API-Key': apiKey });
  if (!response.ok) {
    if (response.status === 404) return null;
    const body = await safeJson(response);
    throw new Error(
      `Congress.gov member request failed (${response.status} ${response.statusText}): ${JSON.stringify(body)}`,
    );
  }
  return (await response.json()) as any;
}

/**
 * Fetch full member-item data (contact, portrait, sponsored/cosponsored counts).
 * Reuses API key, fetch pattern, and safeJson. Member-item endpoint: /member/{bioguideId}.
 */
export async function fetchMemberByBioguide(bioguideId: string): Promise<CongressMemberDetail | null> {
  const raw = await fetchMemberByBioguideRaw(bioguideId);
  if (!raw) return null;

  const member = raw?.member ?? raw;
  if (!member) return null;

  const base = normalizeMember(member);
  const addr = member?.addressInformation ?? member?.contact ?? {};
  const phone =
    normaliseString(addr?.phoneNumber ?? addr?.phone) ??
    normaliseString(member?.phoneNumber ?? member?.phone) ??
    null;
  let address = normaliseString(addr?.officeAddress ?? addr?.address ?? addr?.street ?? member?.address) ?? null;
  if (!address && (addr?.city ?? addr?.district ?? addr?.zipCode ?? addr?.postalCode)) {
    const parts = [
      addr?.officeAddress ?? addr?.address ?? addr?.street,
      addr?.city,
      addr?.district ?? addr?.stateCode ?? addr?.state,
      addr?.zipCode ?? addr?.postalCode,
    ].filter((x) => x != null && x !== '');
    if (parts.length) address = parts.join(', ').trim() || null;
  }
  const portrait =
    normaliseString(member?.depiction?.imageUrl ?? member?.depiction?.url ?? member?.portrait?.imageUrl ?? member?.portrait?.url ?? member?.imageUrl ?? member?.image) ?? null;
  const urlVal = normaliseString(member?.officialWebsiteUrl ?? member?.url ?? member?.uri) ?? base.url;

  const sponsored = member?.sponsoredLegislation ?? member?.sponsored_legislation;
  const sponsoredCount =
    typeof sponsored?.count === 'number'
      ? sponsored.count
      : typeof sponsored?.totalCount === 'number'
        ? sponsored.totalCount
        : null;
  const cosponsored = member?.cosponsoredLegislation ?? member?.cosponsored_legislation;
  const cosponsoredCount =
    typeof cosponsored?.count === 'number'
      ? cosponsored.count
      : typeof cosponsored?.totalCount === 'number'
        ? cosponsored.totalCount
        : null;

  let birth: number | null = null;
  const by = member?.birthYear ?? member?.birth_year;
  if (typeof by === 'number' && !Number.isNaN(by)) birth = by;
  else if (typeof by === 'string' && /^\d{4}$/.test(by.trim())) birth = parseInt(by.trim(), 10);

  const leadershipRaw = member?.leadership ?? member?.leadershipPositions ?? [];
  const arr = Array.isArray(leadershipRaw) ? leadershipRaw : [];
  const leadershipTitles = arr
    .map((x: any) => normaliseString(x?.title ?? x?.name ?? x))
    .filter((s): s is string => typeof s === 'string');

  return {
    member: base,
    contactPhone: phone,
    contactAddress: address ?? null,
    portraitUrl: portrait,
    url: urlVal,
    birthYear: birth,
    sponsoredCount: sponsoredCount ?? null,
    cosponsoredCount: cosponsoredCount ?? null,
    leadershipTitles,
  };
}

function buildMembersUrl(offset: number): string {
  const url = new URL(`${BASE_URL}/member/congress/${CURRENT_CONGRESS}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(DEFAULT_PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  return url.toString();
}

function normalizeMember(raw: any): CongressMember {
  const memberId =
    normaliseString(raw?.memberId) ??
    normaliseString(raw?.id) ??
    normaliseString(raw?.bioGuideId) ??
    normaliseString(raw?.bioguideId);

  const bioguideId =
    normaliseString(raw?.bioguideId) ??
    normaliseString(raw?.bioGuideId) ??
    normaliseString(raw?.bioguideID) ??
    memberId ??
    null;

  const govInfoId =
    normaliseString(raw?.govInfoId) ??
    normaliseString(raw?.gpoId) ??
    normaliseString(raw?.govinfoId) ??
    null;

  return {
    memberId,
    bioguideId,
    govInfoId,
    state: extractState(raw),
    district: extractDistrict(raw),
    party:
      normaliseString(raw?.party) ??
      normaliseString(raw?.partyName) ??
      normaliseString(raw?.role?.party) ??
      null,
    url: normaliseString(raw?.url) ?? normaliseString(raw?.uri) ?? null,
    name: extractName(raw),
  };
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}


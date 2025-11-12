import { URL } from 'node:url';

const BASE_URL = 'https://api.congress.gov/v3';
const DEFAULT_PAGE_SIZE = 250;

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

function extractState(raw: any): string | null {
  const state =
    raw?.state ??
    raw?.stateCode ??
    raw?.role?.state ??
    raw?.role?.stateCode ??
    raw?.addressState ??
    raw?.postalState;
  if (!state) return null;
  const normalised = String(state).trim().toUpperCase();
  if (normalised.length !== 2) return normalised || null;
  return normalised;
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
    const response = await fetch(nextUrl, {
      headers: {
        'X-API-Key': apiKey,
      },
    });
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

  return members;
}

function buildMembersUrl(offset: number): string {
  const url = new URL(`${BASE_URL}/member`);
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


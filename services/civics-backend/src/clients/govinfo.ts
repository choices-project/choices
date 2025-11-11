import { URL } from 'node:url';

const BASE_URL = 'https://api.govinfo.gov';

export interface GovInfoMember {
  bioguideId: string;
  govInfoId: string | null;
}

class MissingGovInfoApiKeyError extends Error {
  constructor() {
    super('GOVINFO_API_KEY is required to fetch GovInfo member data.');
  }
}

function getGovInfoApiKey(): string {
  const key =
    process.env.GOVINFO_API_KEY ??
    process.env.GPO_API_KEY ??
    process.env.GOVINFO_APIKEY ??
    process.env.GOVINFO_KEY;
  if (!key) {
    throw new MissingGovInfoApiKeyError();
  }
  return key;
}

export async function fetchGovInfoMember(bioguideId: string): Promise<GovInfoMember | null> {
  const key = getGovInfoApiKey();
  if (!bioguideId) return null;

  const url = new URL(`${BASE_URL}/members/${encodeURIComponent(bioguideId)}`);
  url.searchParams.set('api_key', key);
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString());
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await safeJson(response);
    throw new Error(
      `GovInfo request failed (${response.status} ${response.statusText}) for ${bioguideId}: ${JSON.stringify(
        body,
      )}`,
    );
  }

  const payload: any = await response.json();
  const member = payload?.member ?? payload ?? {};

  const govInfoId =
    normaliseString(member?.gpoId) ??
    normaliseString(member?.memberId) ??
    normaliseString(member?.govInfoId) ??
    null;

  return {
    bioguideId,
    govInfoId,
  };
}

function normaliseString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}


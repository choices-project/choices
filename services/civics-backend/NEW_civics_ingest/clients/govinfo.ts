import { URL } from 'node:url';

const BASE_URL = 'https://api.govinfo.gov';
const GOVINFO_THROTTLE_MS = Number(process.env.GOVINFO_THROTTLE_MS ?? '4000');
const GOVINFO_MAX_RETRIES = 3;

let lastGovInfoRequestAt = 0;

async function throttleGovInfoRequest(): Promise<void> {
  if (GOVINFO_THROTTLE_MS <= 0) return;
  const now = Date.now();
  const wait = Math.max(0, lastGovInfoRequestAt + GOVINFO_THROTTLE_MS - now);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastGovInfoRequestAt = Date.now();
}

async function fetchWithRetry(
  url: string,
  retryCount = 0,
): Promise<Response> {
  await throttleGovInfoRequest();
  const response = await fetch(url.toString());
  if (response.status === 429 && retryCount < GOVINFO_MAX_RETRIES) {
    const retryAfter = response.headers.get('Retry-After');
    const backoffMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, retryCount) * 5000;
    console.warn(
      `GovInfo rate limit (429). Retrying in ${backoffMs / 1000}s (attempt ${retryCount + 1}/${GOVINFO_MAX_RETRIES})...`,
    );
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return fetchWithRetry(url, retryCount + 1);
  }
  return response;
}

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

  const response = await fetchWithRetry(url.toString());
  const remaining = response.headers.get('X-RateLimit-Remaining');
  if (remaining !== null && parseInt(remaining, 10) < 100) {
    console.warn(`GovInfo API: ${remaining} requests remaining this hour`);
  }
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


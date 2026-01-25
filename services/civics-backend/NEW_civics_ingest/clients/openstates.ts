/**
 * Lightweight OpenStates API client used for live state-level enrichment
 * (recent bills, committee updates, etc.). This client is intentionally
 * separate from the YAML ingest helpers so we can clearly distinguish between
 * static "people" data sourced from the vendored archive and dynamic data
 * fetched from the V3 REST API.
 */

const OPENSTATES_API_BASE =
  process.env.OPENSTATES_API_BASE ?? 'https://v3.openstates.org';

interface OpenStatesApiResponse<T> {
  results?: T[];
  data?: T[];
  result?: T[];
}

/** Vote event on a bill; per-voter option (yes/no/abstain/etc.) */
export interface OpenStatesBillVoteEvent {
  id?: string | null;
  motion_text?: string | null;
  start_date?: string | null;
  result?: string | null;
  votes?: Array<{
    option?: string | null;
    voter?: { id?: string | null; name?: string | null } | null;
  }> | null;
}

/** Sponsorship of a bill by a person */
export interface OpenStatesBillSponsorship {
  id?: string | null;
  name?: string | null;
  entity_type?: string | null;
  primary?: boolean | null;
  classification?: string | null;
  person?: { id?: string | null; name?: string | null } | null;
}

export interface OpenStatesBill {
  id: string;
  identifier?: string | null;
  title: string;
  subjects?: string[] | null;
  classification?: string[] | null;
  actions?: Array<{ date?: string | null; description?: string | null }>;
  latest_action_date?: string | null;
  latest_action_description?: string | null;
  latest_action?: string | null;
  updated_at?: string | null;
  first_action_date?: string | null;
  jurisdiction?: { id?: string | null; name?: string | null } | null;
  legislative_session?: { identifier?: string | null; name?: string | null } | null;
  from_organization?: { name?: string | null } | null;
  extras?: Record<string, unknown> | null;
  openstates_url?: string | null;
  votes?: OpenStatesBillVoteEvent[] | null;
  sponsorships?: OpenStatesBillSponsorship[] | null;
}

let warnedForMissingApiKey = false;

function getApiKey(): string | null {
  const key = process.env.OPENSTATES_API_KEY;
  if (!key) {
    if (!warnedForMissingApiKey) {
      console.warn(
        'OPENSTATES_API_KEY is not set; state enrichment will return no results.',
      );
      warnedForMissingApiKey = true;
    }
    return null;
  }
  return key;
}

const OPENSTATES_THROTTLE_MS = Number(process.env.OPENSTATES_THROTTLE_MS ?? '6500');

let requestQueue: Promise<unknown> = Promise.resolve();
let lastOpenStatesRequestAt = 0;

async function scheduleOpenStatesRequest<T>(task: () => Promise<T>): Promise<T> {
  requestQueue = requestQueue.then(async () => {
    if (OPENSTATES_THROTTLE_MS > 0) {
      const now = Date.now();
      const wait = Math.max(0, lastOpenStatesRequestAt + OPENSTATES_THROTTLE_MS - now);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      lastOpenStatesRequestAt = Date.now();
    }
    return task();
  });
  return requestQueue as Promise<T>;
}

async function fetchFromOpenStates<T>(
  path: string,
  params: Record<string, string | number | string[] | undefined> = {},
): Promise<T[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const url = new URL(path, OPENSTATES_API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
      return;
    }
    url.searchParams.set(key, String(value));
  });

  const response = await scheduleOpenStatesRequest(() =>
    fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        Accept: 'application/json',
      },
    }),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenStates request failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as OpenStatesApiResponse<T>;
  if (Array.isArray(json.results)) {
    return json.results;
  }
  if (Array.isArray(json.data)) {
    return json.data;
  }
  if (Array.isArray(json.result)) {
    return json.result;
  }
  return [];
}

export interface FetchBillsOptions {
  limit?: number;
  jurisdiction?: string;
  query?: string;
}

/**
 * Fetch the most recent bills associated with an OpenStates person identifier
 * using the live OpenStates API. Uses `sponsor` (person ID) when provided; API
 * requires either `jurisdiction` or `q`. Omit `query` when using `sponsor` + `jurisdiction`.
 *
 * @param openstatesPersonId The `ocd-person/...` identifier (used as `sponsor` param)
 * @param options.limit Optional maximum number of bills to return (default 25)
 * @param options.jurisdiction Optional jurisdiction filter (e.g. ocd-jurisdiction/country:us/state:ak)
 * @param options.query Optional full‑text search `q`; use only when no jurisdiction
 */
export async function fetchRecentBillsForPerson(
  openstatesPersonId: string,
  options: FetchBillsOptions = {},
): Promise<OpenStatesBill[]> {
  if (!openstatesPersonId) return [];

  const limit = options.limit ?? 25;
  const { jurisdiction, query } = options;

  try {
    const bills = await fetchFromOpenStates<OpenStatesBill>('/bills', {
      sponsor: openstatesPersonId,
      sort: 'latest_action_desc',
      per_page: Math.min(limit, 50),
      page: 1,
      include: ['actions', 'votes', 'sponsorships'],
      jurisdiction: jurisdiction ?? undefined,
      q: query ?? undefined,
    });

    return bills.slice(0, limit);
  } catch (error) {
    console.warn(
      `Unable to fetch OpenStates bills for ${openstatesPersonId}:`,
      (error as Error).message,
    );
    return [];
  }
}



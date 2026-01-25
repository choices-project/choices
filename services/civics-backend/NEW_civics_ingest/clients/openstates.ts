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
const OPENSTATES_MAX_RETRIES = Number(process.env.OPENSTATES_MAX_RETRIES ?? '3');
const OPENSTATES_DAILY_LIMIT = Number(process.env.OPENSTATES_DAILY_LIMIT ?? '10000');

// Rate limit tracking
let requestQueue: Promise<unknown> = Promise.resolve();
let lastOpenStatesRequestAt = 0;
let dailyRequestCount = 0;
let dailyRequestResetAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
let consecutive429Errors = 0;

// Reset daily counter if 24 hours have passed
function resetDailyCounterIfNeeded(): void {
  const now = Date.now();
  if (now >= dailyRequestResetAt) {
    dailyRequestCount = 0;
    dailyRequestResetAt = now + 24 * 60 * 60 * 1000;
    consecutive429Errors = 0;
  }
}

// Check if we're approaching daily limit
function checkDailyLimit(): { canProceed: boolean; remaining: number } {
  resetDailyCounterIfNeeded();
  const remaining = Math.max(0, OPENSTATES_DAILY_LIMIT - dailyRequestCount);
  return {
    canProceed: remaining > 0,
    remaining,
  };
}

async function scheduleOpenStatesRequest<T>(
  task: () => Promise<T>,
  retryCount = 0,
): Promise<T> {
  requestQueue = requestQueue.then(async () => {
    // Check daily limit
    const { canProceed } = checkDailyLimit();
    if (!canProceed) {
      throw new Error(
        `OpenStates API daily limit (${OPENSTATES_DAILY_LIMIT}) reached. Reset in ${Math.ceil((dailyRequestResetAt - Date.now()) / (60 * 60 * 1000))} hours.`,
      );
    }

    // Throttle between requests
    if (OPENSTATES_THROTTLE_MS > 0) {
      const now = Date.now();
      const wait = Math.max(0, lastOpenStatesRequestAt + OPENSTATES_THROTTLE_MS - now);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      lastOpenStatesRequestAt = Date.now();
    }

    try {
      const result = await task();
      dailyRequestCount += 1;
      consecutive429Errors = 0; // Reset on success
      return result;
    } catch (error) {
      // Handle 429 rate limit errors with exponential backoff
      if (
        error instanceof Error &&
        (error.message.includes('429') ||
          error.message.includes('rate limit') ||
          error.message.includes('too many requests'))
      ) {
        consecutive429Errors += 1;
        dailyRequestCount += 1; // Count failed requests too

        if (retryCount < OPENSTATES_MAX_RETRIES) {
          // Exponential backoff: 2^retryCount * 10 seconds
          const backoffMs = Math.pow(2, retryCount) * 10 * 1000;
          console.warn(
            `OpenStates API rate limit (429). Retrying in ${backoffMs / 1000}s (attempt ${retryCount + 1}/${OPENSTATES_MAX_RETRIES})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          return scheduleOpenStatesRequest(task, retryCount + 1);
        }

        // Max retries exceeded
        throw new Error(
          `OpenStates API rate limit exceeded after ${OPENSTATES_MAX_RETRIES} retries. Daily requests: ${dailyRequestCount}/${OPENSTATES_DAILY_LIMIT}. Wait before retrying.`,
        );
      }

      // Re-throw non-rate-limit errors
      throw error;
    }
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

  const response = await scheduleOpenStatesRequest(async () => {
    const fetchResponse = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        Accept: 'application/json',
      },
    });

    // Handle 429 rate limit explicitly
    if (fetchResponse.status === 429) {
      const retryAfter = fetchResponse.headers.get('Retry-After');
      const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : null;
      throw new Error(
        `OpenStates API rate limit (429)${retrySeconds ? `. Retry after ${retrySeconds}s` : ''}. Daily requests: ${dailyRequestCount}/${OPENSTATES_DAILY_LIMIT}`,
      );
    }

    if (!fetchResponse.ok) {
      const body = await fetchResponse.text();
      throw new Error(
        `OpenStates request failed (${fetchResponse.status}): ${body.slice(0, 200)}`,
      );
    }

    return fetchResponse;
  });

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
 * using the live OpenStates API. Uses `sponsor` (person ID) when provided; falls back
 * to `jurisdiction` + `q` (query) when person ID unavailable.
 *
 * @param openstatesPersonId The `ocd-person/...` identifier (used as `sponsor` param). Optional if jurisdiction + query provided.
 * @param options.limit Optional maximum number of bills to return (default 25)
 * @param options.jurisdiction Optional jurisdiction filter (e.g. ocd-jurisdiction/country:us/state:ak). Required if no person ID.
 * @param options.query Optional full‑text search `q`. Used as fallback when person ID unavailable.
 */
export async function fetchRecentBillsForPerson(
  openstatesPersonId: string | null | undefined,
  options: FetchBillsOptions = {},
): Promise<OpenStatesBill[]> {
  const limit = options.limit ?? 25;
  const { jurisdiction, query } = options;

  // Check daily limit before proceeding
  const { canProceed } = checkDailyLimit();
  if (!canProceed) {
    const { remaining } = checkDailyLimit();
    console.warn(
      `OpenStates API daily limit reached (${OPENSTATES_DAILY_LIMIT}). Remaining: ${remaining}. Skipping request.`,
    );
    return [];
  }

  // If no person ID but have jurisdiction + query, use fallback
  if (!openstatesPersonId && jurisdiction && query) {
    try {
      const bills = await fetchFromOpenStates<OpenStatesBill>('/bills', {
        sort: 'latest_action_desc',
        per_page: Math.min(limit, 50),
        page: 1,
        include: ['actions', 'votes', 'sponsorships'],
        jurisdiction,
        q: query,
      });

      return bills.slice(0, limit);
    } catch (error) {
      console.warn(
        `Unable to fetch OpenStates bills via fallback (jurisdiction + query):`,
        (error as Error).message,
      );
      return [];
    }
  }

  // Primary method: use person ID
  if (!openstatesPersonId) {
    console.warn(
      'fetchRecentBillsForPerson: No openstatesPersonId provided and no fallback (jurisdiction + query) available.',
    );
    return [];
  }

  try {
    const bills = await fetchFromOpenStates<OpenStatesBill>('/bills', {
      sponsor: openstatesPersonId,
      sort: 'latest_action_desc',
      per_page: Math.min(limit, 50),
      page: 1,
      include: ['actions', 'votes', 'sponsorships'],
      jurisdiction: jurisdiction ?? undefined,
      // Only include q if no jurisdiction (API requirement)
      q: jurisdiction ? undefined : query ?? undefined,
    });

    return bills.slice(0, limit);
  } catch (error) {
    // If primary method fails and we have fallback, try fallback
    if (jurisdiction && query && !openstatesPersonId.includes('ocd-person/')) {
      console.warn(
        `Primary method failed for ${openstatesPersonId}, trying fallback...`,
        (error as Error).message,
      );
      try {
        const bills = await fetchFromOpenStates<OpenStatesBill>('/bills', {
          sort: 'latest_action_desc',
          per_page: Math.min(limit, 50),
          page: 1,
          include: ['actions', 'votes', 'sponsorships'],
          jurisdiction,
          q: query,
        });
        return bills.slice(0, limit);
      } catch (fallbackError) {
        console.warn(
          `Fallback also failed for ${openstatesPersonId}:`,
          (fallbackError as Error).message,
        );
      }
    }

    console.warn(
      `Unable to fetch OpenStates bills for ${openstatesPersonId}:`,
      (error as Error).message,
    );
    return [];
  }
}

/**
 * Get current OpenStates API usage statistics
 */
export function getOpenStatesUsageStats(): {
  dailyRequests: number;
  dailyLimit: number;
  remaining: number;
  resetAt: Date;
  consecutive429Errors: number;
} {
  resetDailyCounterIfNeeded();
  const { remaining } = checkDailyLimit();
  return {
    dailyRequests: dailyRequestCount,
    dailyLimit: OPENSTATES_DAILY_LIMIT,
    remaining,
    resetAt: new Date(dailyRequestResetAt),
    consecutive429Errors,
  };
}



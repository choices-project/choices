const FEC_API_BASE = 'https://api.open.fec.gov/v1';

export interface FecTotals {
  candidate_id?: string;
  // FEC API field names (what API actually returns)
  receipts?: number | null;
  disbursements?: number | null;
  last_cash_on_hand_end_period?: number | null;
  individual_unitemized_contributions?: number | null;
  individual_contributions?: number | null;
  last_filing_date?: string | null;
  coverage_end_date?: string | null;
  report_year?: number | null;
  // Legacy/computed fields for backward compatibility
  total_receipts?: number | null; // Maps to receipts
  total_disbursements?: number | null; // Maps to disbursements
  cash_on_hand_end_period?: number | null; // Maps to last_cash_on_hand_end_period
}

export interface FecContributor {
  employer?: string | null;
  committee_name?: string | null;
  total?: number | null;
  sum?: number | null;
  state?: string | null;
  industry?: string | null;
  entity_type?: string | null;
}

export interface FecCandidate {
  candidate_id: string;
  name: string;
  office?: string;
  office_full?: string;
  state?: string;
  district?: string;
  district_number?: number;
  party?: string;
  party_full?: string;
  candidate_status?: string;
  election_years?: number[];
}

interface FecApiResponse<T> {
  results?: T[];
  pagination?: {
    page?: number;
    per_page?: number;
    count?: number;
    pages?: number;
  };
}

export class FecApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseData?: unknown,
  ) {
    super(message);
    this.name = 'FecApiError';
  }
}

function getApiKey(): string {
  const key = process.env.FEC_API_KEY;
  if (!key) {
    throw new Error(
      'FEC_API_KEY is required to fetch campaign finance data. Add it to your environment before running the ingest.',
    );
  }
  return key;
}

/**
 * Retry logic with exponential backoff for transient errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isTransient = (error as FecApiError).statusCode >= 500 ||
        (error as FecApiError).statusCode === 429;

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `FEC API transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`,
        (error as Error).message,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError ?? new Error('Retry failed');
}

/**
 * Make FEC API request with error handling and retry logic
 */
async function makeFecRequest<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(`${FEC_API_BASE}${endpoint}`);
  url.searchParams.set('api_key', getApiKey());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return retryWithBackoff(async () => {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Choices-Platform/1.0',
      },
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const errorMessage = `FEC API error (${response.status} ${response.statusText}): ${
        typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
      }`;

      if (response.status === 429) {
        throw new FecApiError(
          `FEC API rate limit exceeded. ${errorMessage} Consider requesting an enhanced API key from APIinfo@fec.gov for higher limits (7,200 calls/hour).`,
          response.status,
          errorData,
        );
      }

      throw new FecApiError(errorMessage, response.status, errorData);
    }

    const json = (await response.json()) as FecApiResponse<T>;
    
    // Validate response structure
    if (!json || typeof json !== 'object') {
      throw new FecApiError(
        'Invalid FEC API response: expected object',
        0,
        json,
      );
    }

    return json as T;
  });
}

/**
 * Fetch candidate finance totals for a specific cycle
 */
export async function fetchCandidateTotals(
  candidateId: string,
  cycle: number,
): Promise<FecTotals | null> {
  if (!candidateId || !candidateId.trim()) {
    throw new Error('candidateId is required');
  }
  if (!cycle || cycle < 2000 || cycle > 2100 || cycle % 2 !== 0) {
    throw new Error(`Invalid cycle: ${cycle}. Must be an even year between 2000-2100`);
  }

  const response = await makeFecRequest<FecTotals[]>('/candidate/' + encodeURIComponent(candidateId) + '/totals/', {
    cycle: String(cycle),
    per_page: '1',
  });

  const results = (response as unknown as FecApiResponse<FecTotals>).results;
  const rawTotals = results?.[0];
  
  if (!rawTotals) {
    return null;
  }
  
  // Map FEC API field names to our expected field names for backward compatibility
  return {
    ...rawTotals,
    total_receipts: rawTotals.receipts ?? rawTotals.total_receipts ?? null,
    total_disbursements: rawTotals.disbursements ?? rawTotals.total_disbursements ?? null,
    cash_on_hand_end_period: rawTotals.last_cash_on_hand_end_period ?? rawTotals.cash_on_hand_end_period ?? null,
  } as FecTotals;
}

/**
 * Fetch top contributors by employer for a candidate
 */
export async function fetchCandidateTopContributors(
  candidateId: string,
  cycle: number,
  limit = 5,
): Promise<FecContributor[]> {
  if (!candidateId || !candidateId.trim()) {
    throw new Error('candidateId is required');
  }
  if (!cycle || cycle < 2000 || cycle > 2100 || cycle % 2 !== 0) {
    throw new Error(`Invalid cycle: ${cycle}. Must be an even year between 2000-2100`);
  }
  if (limit < 1 || limit > 100) {
    throw new Error(`Invalid limit: ${limit}. Must be between 1-100`);
  }

  const response = await makeFecRequest<FecContributor[]>('/schedules/schedule_a/by_employer/', {
    candidate_id: candidateId,
    two_year_transaction_period: String(cycle),
    per_page: String(limit),
    sort: '-total',
  });

  const results = (response as unknown as FecApiResponse<FecContributor>).results;
  return results ?? [];
}

/**
 * Search for candidates by name, office, state, party, or election year
 * Useful for finding FEC IDs when they're missing from OpenStates data
 */
export async function searchCandidates(params: {
  name?: string;
  office?: 'H' | 'S' | 'P';
  state?: string;
  district?: string;
  party?: string;
  election_year?: number;
  per_page?: number;
}): Promise<FecCandidate[]> {
  const searchParams: Record<string, string | number> = {};
  
  if (params.name) {
    searchParams.name = params.name;
  }
  if (params.office) {
    searchParams.office = params.office;
  }
  if (params.state) {
    searchParams.state = params.state.toUpperCase();
  }
  if (params.district && params.office === 'H') {
    // FEC API expects district as a number (1-56 for House)
    const districtNum = parseInt(params.district, 10);
    if (!Number.isNaN(districtNum) && districtNum > 0) {
      searchParams.district = districtNum;
    }
  }
  if (params.party) {
    searchParams.party = params.party.toUpperCase();
  }
  if (params.election_year) {
    if (params.election_year < 2000 || params.election_year > 2100 || params.election_year % 2 !== 0) {
      throw new Error(`Invalid election_year: ${params.election_year}. Must be an even year between 2000-2100`);
    }
    searchParams.election_year = params.election_year;
  }
  searchParams.per_page = params.per_page ?? 20;

  const response = await makeFecRequest<FecCandidate[]>('/candidates/', searchParams);
  const results = (response as unknown as FecApiResponse<FecCandidate>).results;
  return results ?? [];
}

/**
 * Combined function: Search for candidate by name/office/state and fetch their finance totals in one optimized flow.
 * This eliminates the need for separate search + fetch calls when you don't have a FEC ID yet.
 * 
 * Returns both the candidate info (with FEC ID) and their finance totals for the specified cycle.
 * If multiple candidates match, returns the first one with finance data, or the first match if none have data.
 */
export async function searchCandidateWithTotals(params: {
  name: string;
  office?: 'H' | 'S' | 'P';
  state?: string;
  district?: string;
  party?: string;
  cycle: number;
  per_page?: number;
}): Promise<{
  candidate: FecCandidate | null;
  totals: FecTotals | null;
}> {
  if (!params.name || !params.name.trim()) {
    throw new Error('name is required for candidate search');
  }
  if (!params.cycle || params.cycle < 2000 || params.cycle > 2100 || params.cycle % 2 !== 0) {
    throw new Error(`Invalid cycle: ${params.cycle}. Must be an even year between 2000-2100`);
  }

  // Step 1: Search for candidates matching the criteria
  // Note: Don't filter by election_year initially - many candidates may not have that year set
  // We'll filter by cycle when fetching totals instead
  const candidates = await searchCandidates({
    name: params.name,
    office: params.office,
    state: params.state,
    district: params.district,
    party: params.party,
    // Don't use election_year filter - it's too restrictive
    per_page: params.per_page ?? 20,
  });

  if (candidates.length === 0) {
    return { candidate: null, totals: null };
  }

  // Step 2: For each candidate found, try to get their totals for the specified cycle
  // Return the first one that has finance data, or the first match if none have data
  for (const candidate of candidates) {
    try {
      const totals = await fetchCandidateTotals(candidate.candidate_id, params.cycle);
      if (totals) {
        return { candidate, totals };
      }
    } catch (error) {
      // If this candidate fails, try the next one
      continue;
    }
  }

  // If we found candidates but none have totals for this cycle, return the first candidate with null totals
  // This is still useful - we have the FEC ID even if no finance data for this cycle
  return { candidate: candidates[0] ?? null, totals: null };
}

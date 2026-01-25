import { URL } from 'node:url';

const GOOGLE_CIVIC_API_BASE =
  process.env.GOOGLE_CIVIC_API_BASE ?? 'https://civicinfo.googleapis.com/civicinfo/v2';

const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

if (!GOOGLE_CIVIC_API_KEY) {
  console.warn(
    '[googleCivic] GOOGLE_CIVIC_API_KEY is not set; Google civic enrichment scripts will be skipped.',
  );
}

export class GoogleCivicApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseData?: unknown,
  ) {
    super(message);
    this.name = 'GoogleCivicApiError';
  }
}

function getApiKey(): string {
  const key = GOOGLE_CIVIC_API_KEY;
  if (!key) {
    throw new Error(
      'GOOGLE_CIVIC_API_KEY is required to fetch Google Civic data. Add it to your environment before running the enrichment.',
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
      const isTransient = (error as GoogleCivicApiError).statusCode >= 500 ||
        (error as GoogleCivicApiError).statusCode === 429;

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `Google Civic API transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms:`,
        (error as Error).message,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError ?? new Error('Retry failed');
}

/**
 * Make Google Civic API request with error handling and retry logic
 */
async function makeGoogleCivicRequest<T>(
  endpoint: string,
  params: Record<string, string | boolean> = {},
): Promise<T> {
  const url = new URL(`${GOOGLE_CIVIC_API_BASE}${endpoint}`);
  url.searchParams.set('key', getApiKey());
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

      const errorMessage = `Google Civic API error (${response.status} ${response.statusText}): ${
        typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
      }`;

      if (response.status === 429) {
        throw new GoogleCivicApiError(
          `Google Civic API rate limit exceeded. ${errorMessage} Free tier allows 100 requests/day. Consider upgrading for higher limits.`,
          response.status,
          errorData,
        );
      }

      if (response.status === 404) {
        // 404 is not an error for division lookups - division may not exist
        throw new GoogleCivicApiError(errorMessage, response.status, errorData);
      }

      throw new GoogleCivicApiError(errorMessage, response.status, errorData);
    }

    const json = (await response.json()) as T;
    
    // Validate response structure
    if (!json || typeof json !== 'object') {
      throw new GoogleCivicApiError(
        'Invalid Google Civic API response: expected object',
        0,
        json,
      );
    }

    return json as T;
  });
}

export interface GoogleCivicChannel {
  type: string;
  id: string;
}

export interface GoogleCivicAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface GoogleCivicOfficial {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  emails?: string[];
  photoUrl?: string;
  channels?: GoogleCivicChannel[];
  address?: GoogleCivicAddress[];
}

export interface GoogleCivicOffice {
  name: string;
  divisionId: string;
  levels?: string[];
  roles?: string[];
  officialIndices?: number[];
}

export interface GoogleCivicDivision {
  name: string;
  officeIndices?: number[];
}

export interface GoogleCivicRepresentativeInfoResponse {
  kind: string;
  normalizedInput?: Record<string, string>;
  divisions?: Record<string, GoogleCivicDivision>;
  offices?: GoogleCivicOffice[];
  officials?: GoogleCivicOfficial[];
}

export interface GoogleCivicElection {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId?: string;
}

interface GoogleCivicElectionsResponse {
  kind: string;
  elections?: GoogleCivicElection[];
}

export async function fetchRepresentativeInfoByDivision(
  divisionId: string,
): Promise<GoogleCivicRepresentativeInfoResponse | null> {
  if (!GOOGLE_CIVIC_API_KEY) {
    return null;
  }

  const trimmedId = divisionId.trim();
  if (!trimmedId) {
    return null;
  }

  try {
    const response = await makeGoogleCivicRequest<GoogleCivicRepresentativeInfoResponse>(
      '/representatives',
      {
        ocdDivisionId: trimmedId,
        includeOffices: true,
      },
    );

    if (!response || (!response.offices && !response.officials)) {
      console.warn(
        `[googleCivic] Empty payload for division ${divisionId}.`,
      );
      return null;
    }

    return response;
  } catch (error) {
    if (error instanceof GoogleCivicApiError && error.statusCode === 404) {
      console.warn(`[googleCivic] Division ${divisionId} not found (404).`);
      return null;
    }
    throw error;
  }
}

/**
 * Fetch representative information by address.
 * Useful when you have an address but not the OCD division ID.
 * 
 * @param address - Street address (e.g., "1600 Pennsylvania Avenue NW, Washington, DC 20500")
 * @param options - Optional filters for levels and roles
 * @returns Representative info response or null if not found
 */
export async function fetchRepresentativeInfoByAddress(
  address: string,
  options?: {
    levels?: string[]; // e.g., ['country'] for federal only
    roles?: string[]; // e.g., ['legislatorUpperBody', 'legislatorLowerBody']
  },
): Promise<GoogleCivicRepresentativeInfoResponse | null> {
  if (!GOOGLE_CIVIC_API_KEY) {
    return null;
  }

  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    return null;
  }

  try {
    const params: Record<string, string | boolean> = {
      address: trimmedAddress,
      includeOffices: true,
    };

    if (options?.levels && options.levels.length > 0) {
      params.levels = options.levels.join(',');
    }

    if (options?.roles && options.roles.length > 0) {
      params.roles = options.roles.join(',');
    }

    const response = await makeGoogleCivicRequest<GoogleCivicRepresentativeInfoResponse>(
      '/representatives',
      params,
    );

    if (!response || (!response.offices && !response.officials)) {
      console.warn(
        `[googleCivic] Empty payload for address: ${trimmedAddress.substring(0, 50)}...`,
      );
      return null;
    }

    return response;
  } catch (error) {
    if (error instanceof GoogleCivicApiError && error.statusCode === 404) {
      console.warn(`[googleCivic] Address not found (404): ${trimmedAddress.substring(0, 50)}...`);
      return null;
    }
    throw error;
  }
}

/**
 * Build OCD division ID for a congressional district or Senate seat.
 * 
 * @param state - Two-letter state code (e.g., "CA")
 * @param district - District number or null for Senators
 * @param office - "Senator" or "Representative"
 * @returns OCD division ID (e.g., "ocd-division/country:us/state:ca/cd:12")
 */
export function buildCongressionalDistrictId(
  state: string,
  district: string | null,
  office: string,
): string {
  if (!state) {
    throw new Error('State is required to build congressional district ID');
  }

  const stateLower = state.toLowerCase().trim();
  if (stateLower.length !== 2) {
    throw new Error(`Invalid state code: ${state}. Expected 2-letter code.`);
  }

  // Senators don't have districts
  if (office === 'Senator' || !district) {
    return `ocd-division/country:us/state:${stateLower}`;
  }

  // Handle at-large districts (district = "0" or "At-Large")
  const districtNum = district === '0' || district === 'At-Large' ? '0' : district.trim();
  
  return `ocd-division/country:us/state:${stateLower}/cd:${districtNum}`;
}

export async function fetchElections(): Promise<GoogleCivicElection[]> {
  if (!GOOGLE_CIVIC_API_KEY) {
    return [];
  }

  const url = new URL(`${GOOGLE_CIVIC_API_BASE}/elections`);
  url.searchParams.set('key', GOOGLE_CIVIC_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Google Civic API error (${response.status} ${response.statusText}) for elections: ${text}`,
    );
  }

  const payload = (await response.json()) as GoogleCivicElectionsResponse;
  const elections = payload.elections ?? [];
  if (elections.length === 0) {
    console.warn('[googleCivic] Elections endpoint returned an empty list.');
  }
  return elections;
}



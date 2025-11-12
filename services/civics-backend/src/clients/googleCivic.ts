import { URL } from 'node:url';

const GOOGLE_CIVIC_API_BASE =
  process.env.GOOGLE_CIVIC_API_BASE ?? 'https://civicinfo.googleapis.com/civicinfo/v2';

const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

if (!GOOGLE_CIVIC_API_KEY) {
  console.warn(
    '[googleCivic] GOOGLE_CIVIC_API_KEY is not set; Google civic enrichment scripts will be skipped.',
  );
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

  const url = new URL(`${GOOGLE_CIVIC_API_BASE}/representatives`);
  url.searchParams.set('key', GOOGLE_CIVIC_API_KEY);
  url.searchParams.set('ocdDivisionId', trimmedId);
  url.searchParams.set('includeOffices', 'true');

  const response = await fetch(url);
  if (response.status === 404) {
    console.warn(`[googleCivic] Division ${divisionId} not found (404).`);
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Google Civic API error (${response.status} ${response.statusText}) for division ${divisionId}: ${text}`,
    );
  }

  const json = (await response.json()) as GoogleCivicRepresentativeInfoResponse;
  if (!json || (!json.offices && !json.officials)) {
    console.warn(
      `[googleCivic] Empty payload for division ${divisionId} (status ${response.status}).`,
    );
  }
  return json;
}



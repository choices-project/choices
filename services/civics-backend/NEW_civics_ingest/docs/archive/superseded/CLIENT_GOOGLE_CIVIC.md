# Google Civic Information API Client

## Overview

Fetches representative information from the Google Civic Information API using Open Civic Data (OCD) division IDs or addresses.

## Location

`src/clients/googleCivic.ts`

## Requirements

- **API Key:** `GOOGLE_CIVIC_API_KEY` environment variable
- **API Base:** `https://civicinfo.googleapis.com/civicinfo/v2` (configurable via `GOOGLE_CIVIC_API_BASE`)
- **Rate Limits:** Not documented, but throttling recommended
- **Note:** Representatives API is being discontinued in April 2025

## Functions

### `fetchRepresentativeInfoByDivision(divisionId: string)`

Fetches representative information by Open Civic Data (OCD) division ID.

**Parameters:**
- `divisionId`: OCD division ID (e.g., `ocd-division/country:us/state:ca/cd:12`)

**Returns:** `Promise<GoogleCivicRepresentativeInfoResponse | null>`

**Division ID Formats:**
- Congressional districts: `ocd-division/country:us/state:{state}/cd:{district}`
- State lower house: `ocd-division/country:us/state:{state}/sldl:{district}`
- State upper house: `ocd-division/country:us/state:{state}/sldu:{district}`

### `fetchRepresentativeInfoByAddress(address: string, options?)`

Fetches representative information by address (recommended method).

**Parameters:**
- `address`: Full address string
- `options`: Optional configuration
  - `levels`: Government levels to include (default: all)
  - `roles`: Office roles to include (default: all)

**Returns:** `Promise<GoogleCivicRepresentativeInfoResponse | null>`

## Helper Functions

### `buildCongressionalDistrictId(state: string, district: string | null, office: string)`

Constructs OCD division ID for federal congressional districts.

**Returns:** `string` (e.g., `ocd-division/country:us/state:ca/cd:12`)

## Error Handling

- `GoogleCivicApiError`: Custom error class with status code and response data
- Retry logic: 3 attempts with exponential backoff for transient errors (500, 429)
- 404 errors are handled gracefully (returns null)

## Usage

```typescript
import {
  fetchRepresentativeInfoByDivision,
  fetchRepresentativeInfoByAddress,
  buildCongressionalDistrictId,
} from '../../src/clients/googleCivic.js';

// Fetch by division ID
const info = await fetchRepresentativeInfoByDivision(
  'ocd-division/country:us/state:ca/cd:12'
);

// Fetch by address (recommended)
const info = await fetchRepresentativeInfoByAddress(
  '1600 Pennsylvania Avenue NW, Washington, DC 20500'
);

// Build division ID
const divisionId = buildCongressionalDistrictId('CA', '12', 'Representative');
```

## Notes

- **API Discontinuation:** Representatives API will be discontinued in April 2025
- Address-based lookup is more reliable than division ID lookup
- Division ID coverage is limited, especially for federal congressional districts
- Many specific divisions return 404 (data coverage limitation)
- State capital addresses can be used as fallback for state/local representatives

## Data Coverage

- Federal congressional districts: Limited coverage (many 404s)
- State legislative districts: Variable coverage
- Address-based lookups: More reliable, recommended approach

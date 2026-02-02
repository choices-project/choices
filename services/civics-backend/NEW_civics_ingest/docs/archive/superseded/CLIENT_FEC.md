# FEC API Client

## Overview

Fetches campaign finance data from the Federal Election Commission (FEC) API.

## Location

`clients/fec.ts`

## Requirements

- **API Key:** `FEC_API_KEY` environment variable
- **API Base:** `https://api.open.fec.gov/v1`
- **Rate Limits:**
  - Standard key: 1,000 calls/hour
  - Enhanced key: 7,200 calls/hour (request from APIinfo@fec.gov)
- **Throttle:** 1200ms between requests (configurable via `FEC_THROTTLE_MS`)

## Functions

### `fetchCandidateTotals(candidateId: string, cycle: number)`

Fetches finance totals for a specific candidate and election cycle.

**Parameters:**
- `candidateId`: FEC candidate ID (e.g., "H8ID01124")
- `cycle`: Election cycle (even year, 2000-2100)

**Returns:** `Promise<FecTotals | null>`

**Fields:**
- `total_receipts`: Total contributions received
- `total_disbursements`: Total spending
- `cash_on_hand_end_period`: Cash on hand at end of period
- `individual_contributions`: Individual contributions
- `individual_unitemized_contributions`: Small donations
- `last_filing_date`: Date of last filing

### `fetchCandidateTopContributors(candidateId: string, cycle: number, limit?: number)`

Fetches top contributors by employer for a candidate.

**Parameters:**
- `candidateId`: FEC candidate ID
- `cycle`: Election cycle
- `limit`: Number of contributors (1-100, default: 5)

**Returns:** `Promise<FecContributor[]>`

**Fields:**
- `employer`: Employer name
- `total`: Total contribution amount
- `state`: Contributor state
- `industry`: Industry classification

### `searchCandidates(params)`

Searches for candidates by name, office, state, party, or election year.

**Parameters:**
- `name`: Candidate name
- `office`: 'H' (House), 'S' (Senate), or 'P' (President)
- `state`: Two-letter state code
- `party`: Party code
- `election_year`: Election year
- `per_page`: Results per page (default: 20)

**Returns:** `Promise<FecCandidate[]>`

### `searchCandidateWithTotals(params)`

Combined search and fetch: searches for candidate and returns both candidate info and finance totals.

**Returns:** `Promise<{ candidate: FecCandidate | null; totals: FecTotals | null }>`

## Error Handling

- `FecApiError`: Custom error class with status code and response data
- Retry logic: 3 attempts with exponential backoff for transient errors (500, 429)
- Rate limit errors include guidance for requesting enhanced API key

## Usage

```typescript
import {
  fetchCandidateTotals,
  fetchCandidateTopContributors,
  searchCandidates,
} from '../clients/fec.js';

// Fetch finance totals
const totals = await fetchCandidateTotals('H8ID01124', 2024);

// Fetch top contributors
const contributors = await fetchCandidateTopContributors('H8ID01124', 2024, 5);

// Search for candidates
const candidates = await searchCandidates({
  name: 'Fulcher',
  office: 'H',
  state: 'ID',
  election_year: 2024,
});
```

## Notes

- Cycles must be even years (2000, 2002, 2004, etc.)
- FEC IDs come from OpenStates YAML data (`other_identifiers` with `scheme: fec`)
- API returns paginated results
- Contributor data may be aggregated rather than candidate-specific for some endpoints

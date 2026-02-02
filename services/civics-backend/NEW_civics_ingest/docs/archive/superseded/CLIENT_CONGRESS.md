# Congress.gov API Client

## Overview

Fetches current Congress members from the official Congress.gov API v3.

## Location

`clients/congress.ts`

## Requirements

- **API Key:** `CONGRESS_GOV_API_KEY` environment variable
- **API Base:** `https://api.congress.gov/v3`
- **Rate Limits:** Not documented, but throttling recommended

## Functions

### `fetchCurrentCongressMembers()`

Fetches all currently serving members of the specified Congress.

**Returns:** `Promise<CongressMember[]>`
- `memberId`: Congress.gov member ID
- `bioguideId`: Biographical Directory ID
- `govInfoId`: GovInfo ID (if available)
- `state`: Two-letter state code
- `district`: District number (null for Senators)
- `party`: Party affiliation
- `url`: Official website URL
- `name`: Full name

**Current Congress:** 119th (Jan 2025–)
- Expected: ~535 members (435 House + 100 Senate)

### `fetchMemberDetail(bioguideId: string)`

Fetches detailed information for a specific member.

**Returns:** `Promise<CongressMemberDetail | null>`

**Additional Fields:**
- `contactPhone`: DC office phone
- `contactAddress`: DC office address
- `portraitUrl`: Official portrait URL
- `sponsoredCount`: Total sponsored bills/resolutions
- `cosponsoredCount`: Total cosponsored bills/resolutions
- `leadershipTitles`: Array of leadership positions

## Error Handling

- `MissingCongressApiKeyError`: Thrown when API key is not set
- HTTP errors are wrapped with status codes
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)

## Usage

```typescript
import { fetchCurrentCongressMembers, fetchMemberDetail } from '../clients/congress.js';

// Fetch all current members
const members = await fetchCurrentCongressMembers();

// Fetch member details
const detail = await fetchMemberDetail('B000944');
```

## Notes

- Senators have `district: null`
- Representatives have numeric district strings
- API returns paginated results (default page size: 250)
- Member count validation: expects 500-550 members for current Congress

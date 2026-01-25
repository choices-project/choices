# GovInfo API Client

## Overview

Fetches GovInfo member data by bioguide ID from the official GovInfo API.

## Location

`clients/govinfo.ts`

## Requirements

- **API Key:** One of the following environment variables:
  - `GOVINFO_API_KEY` (preferred)
  - `GPO_API_KEY`
  - `GOVINFO_APIKEY`
  - `GOVINFO_KEY`
- **API Base:** `https://api.govinfo.gov`
- **Rate Limits:** Not documented

## Functions

### `fetchGovInfoMember(bioguideId: string)`

Fetches GovInfo ID for a member by their bioguide ID.

**Parameters:**
- `bioguideId`: Biographical Directory ID (e.g., "B000944")

**Returns:** `Promise<GovInfoMember | null>`

**Fields:**
- `bioguideId`: Input bioguide ID
- `govInfoId`: GovInfo member ID (may be null if not found)

## Error Handling

- `MissingGovInfoApiKeyError`: Thrown when no API key is found
- Returns `null` for 404 (member not found)
- Other HTTP errors are thrown with status code and response body

## Usage

```typescript
import { fetchGovInfoMember } from '../clients/govinfo.js';

// Fetch GovInfo ID
const member = await fetchGovInfoMember('B000944');
if (member?.govInfoId) {
  console.log(`GovInfo ID: ${member.govInfoId}`);
}
```

## Notes

- API is optional - enrichment continues without it if unavailable
- API has experienced 500 errors (service issues)
- GovInfo ID is used for accessing official government documents
- Returns null if member not found (404) or if govInfoId cannot be extracted from response

## Related

See `GOVINFO_MCP.md` for information about the GovInfo MCP server, which provides document access capabilities beyond member ID lookup.

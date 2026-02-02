# OpenStates API Client

## Overview

Fetches bill activity and related data from the OpenStates V3 REST API for state-level enrichment.

## Location

`clients/openstates.ts`

## Requirements

- **API Key:** `OPENSTATES_API_KEY` environment variable (required)
- **API Base:** `https://v3.openstates.org` (configurable via `OPENSTATES_API_BASE`)
- **Rate Limits:** 
  - **Daily Limit:** 10,000 requests/day (configurable via `OPENSTATES_DAILY_LIMIT`, default: 10000)
  - **Throttle:** 6500ms between requests (configurable via `OPENSTATES_THROTTLE_MS`, default: 6500)
  - **429 Handling:** Automatic exponential backoff (max 3 retries, configurable via `OPENSTATES_MAX_RETRIES`)

## Functions

### `fetchRecentBillsForPerson(openstatesPersonId, options?)`

Fetches the most recent bills associated with an OpenStates person identifier.

**Parameters:**
- `openstatesPersonId` (string | null | undefined): The `ocd-person/...` identifier (used as `sponsor` param). Optional if jurisdiction + query provided.
- `options` (FetchBillsOptions, optional):
  - `limit` (number, optional): Maximum number of bills to return (default: 25, max: 50)
  - `jurisdiction` (string, optional): Jurisdiction filter (e.g. `ocd-jurisdiction/country:us/state:ak`). Required if no person ID.
  - `query` (string, optional): Full-text search `q`. Used as fallback when person ID unavailable.

**Returns:** `Promise<OpenStatesBill[]>`

**Fallback Behavior:**
- If `openstatesPersonId` is missing but `jurisdiction` + `query` are provided, uses fallback method
- If primary method fails and fallback available, automatically tries fallback
- Gracefully returns empty array on errors (logs warnings)

**Example:**
```typescript
// Primary method (with person ID)
const bills = await fetchRecentBillsForPerson('ocd-person/abc123', {
  limit: 25,
  jurisdiction: 'ocd-jurisdiction/country:us/state:ca'
});

// Fallback method (no person ID)
const bills = await fetchRecentBillsForPerson(null, {
  limit: 25,
  jurisdiction: 'ocd-jurisdiction/country:us/state:ca',
  query: 'John Smith'
});
```

### `getOpenStatesUsageStats()`

Get current API usage statistics.

**Returns:**
```typescript
{
  dailyRequests: number;
  dailyLimit: number;
  remaining: number;
  resetAt: Date;
  consecutive429Errors: number;
}
```

**Example:**
```typescript
const stats = getOpenStatesUsageStats();
console.log(`Used ${stats.dailyRequests}/${stats.dailyLimit} requests today`);
console.log(`${stats.remaining} requests remaining`);
```

## Rate Limit Handling

### Automatic Features

1. **Daily Limit Tracking:** Tracks requests per 24-hour period, automatically resets
2. **429 Detection:** Detects rate limit errors and applies exponential backoff
3. **Exponential Backoff:** Retries with increasing delays (2^retry * 10 seconds)
4. **Request Throttling:** 6500ms minimum delay between requests
5. **Queue System:** Serializes requests to prevent concurrent rate limit issues

### Error Handling

- **429 Errors:** Automatically retried with exponential backoff (up to 3 times)
- **Daily Limit:** Throws error when limit reached, scripts can check and stop gracefully
- **Other Errors:** Logged and returned as empty array (graceful degradation)

### Best Practices

1. **Check Usage Before Large Batches:**
   ```typescript
   const stats = getOpenStatesUsageStats();
   if (stats.remaining < 100) {
     console.warn('Low API quota remaining, consider pausing');
   }
   ```

2. **Handle Daily Limit Gracefully:**
   ```typescript
   try {
     const bills = await fetchRecentBillsForPerson(id, options);
   } catch (error) {
     if (error.message.includes('daily limit')) {
       // Save progress and resume later
       break;
     }
   }
   ```

3. **Use Fallback When Person ID Missing:**
   ```typescript
   const bills = await fetchRecentBillsForPerson(
     rep.openstatesId || null,
     {
       jurisdiction: deriveJurisdiction(rep),
       query: rep.name // Fallback if no ID
     }
   );
   ```

## Environment Variables

- `OPENSTATES_API_KEY` (required): API key for OpenStates V3 API
- `OPENSTATES_API_BASE` (optional): API base URL (default: `https://v3.openstates.org`)
- `OPENSTATES_THROTTLE_MS` (optional): Milliseconds between requests (default: 6500)
- `OPENSTATES_DAILY_LIMIT` (optional): Daily request limit (default: 10000)
- `OPENSTATES_MAX_RETRIES` (optional): Max retries for 429 errors (default: 3)
- `OPENSTATES_ACTIVITY_LIMIT` (optional): Max bills per representative for activity sync (default: 8)

## Usage

```typescript
import { fetchRecentBillsForPerson, getOpenStatesUsageStats } from '../clients/openstates.js';

// Fetch bills for a person
const bills = await fetchRecentBillsForPerson('ocd-person/abc123', {
  limit: 25,
  jurisdiction: 'ocd-jurisdiction/country:us/state:ca'
});

// Check API usage
const stats = getOpenStatesUsageStats();
console.log(`Remaining: ${stats.remaining}/${stats.dailyLimit}`);
```

## Error Handling

- Returns empty array on errors (graceful degradation)
- Logs warnings for debugging
- Throws errors for daily limit (allows scripts to stop gracefully)
- Automatic retry for 429 errors with exponential backoff

## Additional Functions

### `fetchCommittees(options?)`

Fetch committees for a jurisdiction.

**Parameters:**
- `options.jurisdiction` (string, optional): Jurisdiction filter
- `options.chamber` (string, optional): Chamber filter (lower, upper)
- `options.parent` (string, optional): Parent committee ID

**Returns:** `Promise<OpenStatesCommittee[]>`

### `fetchCommitteeDetails(committeeId)`

Fetch detailed committee information by ID.

**Parameters:**
- `committeeId` (string): Committee ID

**Returns:** `Promise<OpenStatesCommittee | null>`

### `fetchEvents(options?)`

Fetch legislative events (hearings, floor sessions, etc.).

**Parameters:**
- `options.jurisdiction` (string, optional): Jurisdiction filter
- `options.startDate` (string, optional): Start date (YYYY-MM-DD)
- `options.endDate` (string, optional): End date (YYYY-MM-DD)
- `options.eventType` (string, optional): Event type filter

**Returns:** `Promise<OpenStatesEvent[]>`

## Notes

- API is rate-limited: 10,000 requests/day
- Throttle: 6500ms between requests (respects API limits)
- Fallback method available when person ID missing (uses jurisdiction + query)
- Daily counter resets every 24 hours
- Request queue ensures serial execution to prevent rate limit issues
- **OpenStates covers STATE/LOCAL only** - Federal data comes from GovInfo MCP

## Related

See `GOVINFO_MCP.md` for information about the GovInfo MCP server, which provides **federal** bill data. OpenStates API provides **state/local** bill data - they are complementary, not overlapping.

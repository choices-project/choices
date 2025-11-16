## Civics Address Lookup API

- Method: POST
- URL: `/api/v1/civics/address-lookup`
- Auth: Not required (rate limited)
- Purpose: Resolve a user-provided address (or coordinates) to current electoral jurisdiction identifiers. This endpoint is the sole external-API exception and is backed by Google Civic Information API via a server-side proxy.

### Request

- Headers:
  - `Content-Type: application/json`
- Body (JSON):
  - `address` (string, required): Freeform address, or "lat,lng" string if coordinates are used.

Example:

```json
{
  "address": "1600 Pennsylvania Ave NW, Washington, DC 20500"
}
```

### Response

- 200 OK

```json
{
  "success": true,
  "data": {
    "jurisdiction": {
      "state": "DC",
      "district": "0",
      "county": "Washington",
      "ocd_division_id": "ocd-division/country:us/state:dc/place:washington",
      "fallback": false
    }
  },
  "meta": {
    "fallback": false,
    "integration": "google-civic"
  }
}
```

- Error: 400 (missing/invalid input), 429 (rate limited), 502 (external API failure)

### Behavior and Guarantees

- Server-side proxy with `GOOGLE_CIVIC_API_KEY`; the key is never exposed to clients.
- Per-IP rate limiting (config in route source).
- Short-term response caching (config in route source).
- On success, writes a privacy-safe jurisdiction cookie with:
  - `state` (always)
  - `district` (if available)
  - `county` (if available)
- Does not store the full address; only normalized jurisdiction metadata is returned.

### Client Usage

- Use the proxy endpoint from client code instead of calling Google Civic API directly.
- Modules:
  - `web/lib/privacy/location-resolver.ts` calls this endpoint for client-side resolution.
  - `web/lib/services/location-service.ts` uses the key server-side for geocoding (forward/reverse).

### Notes

- This endpoint is the sole exception to the “web API only queries Supabase” rule due to the infeasibility of pre-storing all address mappings and the need for real-time, up-to-date district resolution after redistricting events.



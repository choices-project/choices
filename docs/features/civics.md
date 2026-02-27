# Civics Address Lookup Endpoint

_Last updated: January 2026 — Source of truth for `/api/v1/civics/address-lookup`_

## Overview
- **Endpoint:** `POST /api/v1/civics/address-lookup`
- **Purpose:** Resolve a user-supplied address into privacy-safe jurisdiction metadata (state, congressional district, etc.) so downstream flows (onboarding, profile, civic actions) can personalize content.
- **External dependency:** Google Civic Information API — this is the *only* web endpoint authorized to call an external API directly.
- **Feature flag:** Controlled by `CIVICS_ADDRESS_LOOKUP` (always-on in production but can be disabled in lower envs).

## Request Contract
```jsonc
POST /api/v1/civics/address-lookup
{
  "address": "1600 Pennsylvania Ave NW, Washington, DC"
}
```

Requirements:
- Address must be 5–500 characters, ASCII letters/numbers/`,.-#` only (validated by `validateAddressInput`).
- Requests exceeding validation limits return `400` with a descriptive `details.address` message.
- If the feature flag is disabled, the endpoint returns `503`.

## Response Contract
Success (HTTP 200):
```jsonc
{
  "success": true,
  "data": {
    "jurisdiction": {
      "state": "DC",
      "district": "At-Large",
      "county": null,
      "ocd_division_id": "ocd-division/country:us/district:dc",
      "fallback": false
    }
  },
  "metadata": {
    "cached": false,
    "integration": "google-civic"
  }
}
```

Failure examples:
- **Validation:** `400` with `details.address`.
- **Feature disabled:** `503`.
- **Rate limit:** `429` with `metadata.retryAfterMs`.
- **Upstream failures:** `502` with `reason` set to the upstream error (falls back to state-only jurisdiction when possible).

## Rate Limiting & Caching
- **Per-IP limit:** 30 requests/minute. Headers `x-forwarded-for`/`x-real-ip` are honored; IPv6 `::ffff:` prefixes are stripped so IPv4/IPv6 users hit the same bucket.
- **Cache:** Address strings are normalized + HMAC’d (`generateAddressHMAC`) and cached in-memory for 5 minutes (max 1,000 entries). Metadata `cached=true` appears on cache hits.
- **Why in-memory:** Keeps the endpoint stateless across deployments; upstream Supabase tables track longer-term analytics separately.

## Privacy & Security
- The raw address never leaves the request scope:
  - HMAC hash is used for caching.
  - Only jurisdiction metadata (state/district/county) is persisted or shared with the client.
- `setJurisdictionCookie` writes a short-lived cookie containing state/district so front-end flows can avoid redundant lookups.
- API key (`GOOGLE_CIVIC_API_KEY`) lives server-side only (`.env`); the endpoint refuses to run if the key is missing.

## Usage Patterns
1. **Client flows** (onboarding/profile/civic actions) should call `fetch('/api/v1/civics/address-lookup', { method: 'POST', body: { address } })` and rely on the returned jurisdiction, never call Google Civic API directly.
2. **Retry logic**: For 429 responses, use the returned `retryAfterMs` to back off; do not hammer the endpoint.
3. **Error handling**: Treat fallback responses (`fallback: true`) as best-effort — show a warning and invite the user to verify their district manually if needed.

## Files of Interest
- Implementation: `web/app/api/v1/civics/address-lookup/route.ts`
- Privacy helpers: `web/lib/civics/privacy-utils.ts`
- Consumers:
  - `web/features/onboarding/components/UserOnboarding.tsx`
  - `web/features/profile/components/AddressLookup.tsx`
  - `web/features/civics/components/AddressLookupForm.tsx`
- Tests:
  - `web/tests/api/civics/by-address.test.ts`
  - `web/tests/contracts/civics-address.contract.test.ts`
  - MSW mocks: `web/tests/msw/api-handlers.ts`

For future changes, update this doc and `docs/ROADMAP_SINGLE_SOURCE.md` when adding new flows that depend on the address lookup service.


# API Rate Limits Reference

**Last updated:** 2026-02-25

Reference for all external APIs used by the civics ingest service. Use this when optimizing ingest throughput and scheduling.

---

## OpenStates API (Plural Open)

**CRITICAL: OpenStates contains ONLY state and local representatives. There is never and will never be any federal representative data from OpenStates.**

**Unverified** — Official docs do not publish daily or hourly limits. Default 250/day for freemium; set `OPENSTATES_DAILY_LIMIT=10000` if you have a higher tier.

| Limit | Value | Config |
|-------|-------|--------|
| Daily requests (default) | 250 | `OPENSTATES_DAILY_LIMIT` |
| Throttle between requests | ~6.5s | `OPENSTATES_THROTTLE_MS` (default 6500) |
| 429 retries | 3 | `OPENSTATES_MAX_RETRIES` |
| Scope | **State/local only — no federal data** | Never process federal reps with OpenStates |

**Behavior:** Exponential backoff on 429. Daily counter resets every 24 hours. Check `getOpenStatesUsageStats()` for remaining budget.

**Source:** [clients/openstates.ts](../clients/openstates.ts)

---

## FEC (OpenFEC) API

| Limit | Standard | Enhanced |
|-------|----------|----------|
| Per hour | 1,000 | 7,200 |
| Per minute | ~17 | 120 |
| Throttle (our client) | 3.6s | `FEC_THROTTLE_MS` (default 3600) |

**Enhanced tier:** Request from APIinfo@fec.gov for 7,200 calls/hour.

**Behavior:** Client uses `retryWithBackoff` for 5xx and 429. Per-request throttle prevents hitting limits.

**Source:** [clients/fec.ts](../clients/fec.ts), [OpenFEC API Documentation](https://api.open.fec.gov/developers)

---

## Congress.gov API

| Endpoint type | Burst | Crawl | Block if exceeded |
|---------------|-------|-------|-------------------|
| Item/resource | 40 req/10s | 200 req/min | 5 min / 1 hr |
| Collections/format | 20 req/10s | 80 req/min | 5 min / 1 hr |

**Recommendation:** Stay under 80 req/min for collections. Throttle: `CONGRESS_GOV_THROTTLE_MS` (default 1500) to stay under burst.

**Source:** [Congress.gov API](https://api.congress.gov/), [Working Within Limits](https://www.loc.gov/apis/json-and-yaml/working-within-limits/)

---

## GovInfo API

| Limit | Value |
|-------|-------|
| Platform | api.data.gov |
| Default | 1,000 requests/hour (rolling) |
| Headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining` on responses |
| Throttle (our client) | 4s | `GOVINFO_THROTTLE_MS` (default 4000) |

**Known issue:** 500 errors on member lookup (0/547 govinfo_id as of 2026-01). Document as known limitation; retry when API stabilizes.

---

## Google Civic Information API

| Limit | Value |
|-------|-------|
| Free tier | 25,000 queries/day |

**Current state:** Archive scripts use `GOOGLE_CIVIC_THROTTLE_MS=1200`. Not in active ingest path.

---

## Daily Budget Allocation (OpenStates)

With 250 requests/day (freemium default):

- **Committees (optimized):** ~50 calls (one per jurisdiction) — fits in one run
- **Activity:** 1 call per rep (~8,000 state/local) — requires **~32 days** at 250/day with `--resume`
- **Events:** Defer or run only when budget allows

With 10,000 requests/day (if `OPENSTATES_DAILY_LIMIT=10000`):

- **Committees:** ~50 calls — run first
- **Activity:** ~8,000 calls — multi-day with `--resume`
- **Events:** Run after committees/activity

**Strategy:** Committees first (few calls), then activity in batches with checkpoint/resume across days.

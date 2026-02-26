# OpenStates Committees API Status

**Last checked:** 2026-02-25

## Summary

The OpenStates API v3 `/committees` endpoint returns **0 committees** for all jurisdictions, including unfiltered requests. This is an upstream data availability issue, not a bug in our ingest.

## Verification

Run the debug script to confirm:

```bash
cd services/civics-backend
npm run tools:debug:committees-api
```

With `OPENSTATES_API_KEY` set, you will see:

- **Without jurisdiction:** `total_items: 0`
- **With jurisdiction (e.g. CA):** `total_items: 0`

## Root Cause

OpenStates committee data was discontinued 2011–2018 due to funding and staffing constraints. OSEP #4 outlines plans to restore it via scrapers and manual curation, but the API database is not yet populated.

- [OSEP #4: Committee Data](https://docs.openstates.org/enhancement-proposals/004-committee-data/)
- [API v3 Overview](https://docs.openstates.org/api-v3/)

## Implications

1. **Committees sync will report 0 assignments** until OpenStates populates committee data.
2. **Our optimization is correct** — when data becomes available, we use ~1 API call per jurisdiction instead of ~1 per rep.
3. **YAML data** — `openstates_people_roles` does not contain committee roles; only legislative/executive roles exist in YAML.

## Recommendations

1. **Monitor** OpenStates updates; re-run committees sync when they announce committee data restoration.
2. **Alternative sources** — Consider state legislature websites or other APIs for committee data if needed.
3. **Contact** — OpenStates: contact@openstates.org for status or API tier questions.

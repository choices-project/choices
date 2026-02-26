# Civics Ingest — Standalone Service

**CRITICAL: OpenStates (YAML + API) contains ONLY state and local representatives. There is never any federal representative data from OpenStates.** Federal data comes from Congress.gov, FEC, and GovInfo.

---

The civics ingest is a **standalone service** that:

1. **Identifies rate limits** — Each API client (OpenStates, FEC, Congress.gov, GovInfo) uses configurable throttles and backs off on 429
2. **Identifies missing data** — `tools:report:gaps` and `gap:fill` compute gaps (finance, congress IDs, activity, committees)
3. **Fills gaps** — `gap:fill` runs fill scripts in priority order, stopping when limits are reached
4. **Writes to Supabase** — All data lands in `representatives_core` and related tables; downstream web app reads only from Supabase

---

## Rate Limit Handling

| API | Throttle | 429 Handling | Config |
|-----|----------|--------------|--------|
| OpenStates | 6.5s/req | Exponential backoff, daily budget | `OPENSTATES_DAILY_LIMIT`, `OPENSTATES_THROTTLE_MS` |
| FEC | 3.6s/req | Retry 3x with backoff | `FEC_THROTTLE_MS` |
| Congress.gov | 1.5s/req | Retry 3x, honors Retry-After | `CONGRESS_GOV_THROTTLE_MS` |
| GovInfo | 4s/req | Retry 3x, logs X-RateLimit-Remaining | `GOVINFO_THROTTLE_MS` |

All clients stop or back off when limits are hit. No burst-through.

---

## Gap-Fill Flow

```
npm run gap:fill
```

1. **Report gaps** — finance, congress, activity, committees
2. **OpenStates** — committees (~50 calls), then activity (budget-aware, --resume)
3. **Federal** — Congress IDs, then FEC finance (with --lookup-missing-fec-ids)
4. **Stop** when any limit is reached; next run resumes

Options: `--dry-run`, `--skip-openstates`, `--skip-federal`

---

## Data → Supabase → Downstream

| Ingest writes to | Downstream reads via |
|------------------|----------------------|
| `representatives_core` | `/api/representatives`, `/api/v1/civics/representative/[id]` |
| `representative_activity` | `?include=activities` |
| `representative_committees` | `?include=committees` |
| `representative_campaign_finance` | `?include=finance` |
| `representative_contacts` | `?include=contacts` |
| `representative_photos` | Joined on list views |

Schema and column names are aligned. Run `npm run tools:smoke-test` to verify integrity.

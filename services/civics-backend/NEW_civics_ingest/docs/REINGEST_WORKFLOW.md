# Rate-Limit-Aware Re-Ingest Workflow

**Optimized for initial intake and subsequent re-ingest when rate limits reset.**

---

## Overview

The civics ingest uses external APIs with rate limits. OpenStates limit is configurable (`OPENSTATES_DAILY_LIMIT`, default 250/day for freemium). To fill all data:

1. **Initial intake** — Run as much as possible within limits; checkpoints save progress
2. **Re-ingest** — When limits reset (e.g. next day), run again; resumes from checkpoint

---

## Recommended: Rate-Limit-Aware Scheduler

```bash
npm run reingest:scheduled
```

**What it does:**
- Exits gracefully if `OPENSTATES_API_KEY` is missing (baseline data still loaded)
- Checks OpenStates API remaining budget
- Skips if limit reached or below reserve (default 100)
- Committees first (~50 calls with jurisdiction cache)
- Activity with `maxReps = remaining - reserve` (stops before hitting limit)
- Uses `--resume` so each run continues from last checkpoint

**Cron (daily when limit resets):**
```bash
0 6 * * * cd /path/to/Choices/services/civics-backend && npm run reingest:scheduled >> /var/log/reingest.log 2>&1
```

**GitHub Actions:** Set secret `OPEN_STATES_API_KEY` (underscore) — workflow maps it to `OPENSTATES_API_KEY`.

**Env:**
- `OPENSTATES_BUDGET_RESERVE` — Reserve calls before stopping (default 100)
- `OPENSTATES_DAILY_LIMIT` — Daily API limit (default 250 for freemium; set 10000 if higher tier)

---

## Manual Re-Ingest

### Activity (1 API call per rep)

```bash
# Process at most N reps (set to remaining budget - reserve)
npm run openstates:sync:activity -- --resume --max-reps=200
# Or let reingest:scheduled set OPENSTATES_ACTIVITY_MAX_REPS automatically
```

### Committees (~50 API calls total)

```bash
npm run openstates:sync:committees -- --resume
```

### YAML-based (no API)

```bash
npm run openstates:sync:social
npm run openstates:sync:contacts
npm run openstates:sync:photos
```

---

## Checkpoints

- **Activity:** `openstates-activity-sync` — progress saved every 50 reps
- **Committees:** `openstates-committees-sync` — progress saved every 50 reps

List checkpoints: `npm run tools:resume:sync`

---

## Budget Allocation

| Step      | API calls | When                    |
|-----------|-----------|--------------------------|
| Committees| ~50       | First (jurisdiction cache) |
| Activity  | 1/rep     | Up to remaining - reserve |
| Events    | Varies    | Run separately if needed  |

**At 250/day (freemium default):** Committees fit in one run. Activity: ~32 days for 8k reps. Run `reingest:scheduled` daily.

**At 10,000/day:** Set `OPENSTATES_DAILY_LIMIT=10000`. Activity: ~1 day for 8k reps.

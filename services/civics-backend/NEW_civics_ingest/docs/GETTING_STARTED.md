# Getting Started — Civics Ingest

**For new developers.** Follow these steps in order. No prior experience needed.

---

## ⚠️ OpenStates = State/Local ONLY

**OpenStates (YAML + API) has ONLY state and local representatives. There is never any federal data from OpenStates.** Federal data comes from Congress.gov, FEC, and GovInfo.

---

## TL;DR

```bash
cd services/civics-backend
npm install
npm run ingest:setup    # Creates .env if needed; run pre-flight check
npm run ingest         # Full pipeline (baseline + API syncs + federal)
```

---

## What This Does

The civics ingest loads representative data (names, contacts, committees, activity) into your Supabase database from:

- **OpenStates** — state and local reps only (YAML + API); **no federal data**
- **Congress.gov** — federal reps
- **FEC** — campaign finance

---

## 3 Steps to Run

### 1. Install

```bash
cd services/civics-backend
npm install
```

### 2. Configure

```bash
npm run ingest:setup
```

This creates `.env` from `env.example` (if missing) and checks your setup. **Already have vars in `.env`, `.env.local`, or `web/.env.local`?** Run `npm run ingest:check` — it loads from all of these.

**Edit `.env`** (or `.env.local`) and add:

| Variable | Where to get it |
|----------|-----------------|
| `SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → service_role key |

Optional (add later for more data):

- `OPENSTATES_API_KEY` — [open.pluralpolicy.com](https://open.pluralpolicy.com/accounts/profile/) (Plural Open). Limit unverified; set `OPENSTATES_DAILY_LIMIT=10000` if you have higher tier.
- `CONGRESS_GOV_API_KEY` — [api.congress.gov](https://api.congress.gov/sign-up/)
- `FEC_API_KEY` — [fec.gov/developers](https://www.fec.gov/developers/)

### 3. Ingest

```bash
npm run ingest
```

That’s it. One command runs baseline → committees/activity → federal enrichment (skips steps when keys are missing).

---

## Verify

```bash
npm run tools:metrics:dashboard
```

Shows counts and coverage.

---

## Common Commands

| Command | What it does |
|---------|--------------|
| `npm run ingest:check` | Check env and setup before ingest |
| `npm run ingest` | Full pipeline (baseline + API syncs + federal) |
| `npm run gap:fill` | **Standalone gap-fill** — identifies missing data, fills gaps, backs off at rate limits |
| `npm run reingest:scheduled` | Committees + activity only (for daily cron) |
| `npm run tools:report:gaps` | Show finance, congress, activity, committee gaps |
| `npm run tools:metrics:dashboard` | View data metrics |
| `npm run tools:resume:sync` | See checkpoint status (resume progress) |

---

## Troubleshooting

### "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"

Add both to `.env`. Get them from Supabase → Settings → API.

### ".env file not found"

Run `npm run ingest:setup` or `cp env.example .env`, then edit `.env`.

### "OPENSTATES_API_KEY not set"

Optional. Ingest still runs baseline (YAML) data. Add the key to enable committees and activity.

### Rate limits

OpenStates limit is configurable (`OPENSTATES_DAILY_LIMIT`, default 250/day for freemium). Use `npm run reingest:scheduled` for recurring runs; it respects limits and resumes from checkpoints. See `docs/RATE_LIMITS.md`.

---

## Next

- `docs/REINGEST_WORKFLOW.md` — Re-ingest and cron
- `docs/RATE_LIMITS.md` — API limits
- `docs/DATABASE_SCHEMA.md` — Schema reference

# Civics Ingest Service — Documentation

**Point agents to this `docs/` folder.** Start with this file. It contains everything needed to correctly use the ingest service.

Run all commands from `services/civics-backend/`.

**New developer?** → [GETTING_STARTED.md](GETTING_STARTED.md) — 3 steps to run ingest.

---

## ⚠️ CRITICAL: OpenStates = State/Local ONLY

**OpenStates (YAML + API) contains ONLY state and local representatives. There is never and will never be any federal representative data from OpenStates.**

Federal data comes from Congress.gov, FEC, and GovInfo — never from OpenStates. Never process federal reps with OpenStates scripts.

---

## 1. Overview

Node.js service that ingests representative data from multiple sources into Supabase.

| Source | Scope | Rate Limit |
|--------|-------|------------|
| **OpenStates YAML** | **State/local only — no federal data** | None |
| **OpenStates API** | **State/local only — no federal data** | Configurable (`OPENSTATES_DAILY_LIMIT`, default 250/day) |
| **Congress.gov** | Federal only | 5k/hr; throttle 1.5s |
| **FEC** | Federal only | 1k/hr free; 7.2k/hr enhanced |
| **GovInfo** | Federal only | 1k/hr (api.data.gov) |

**Constraint:** OpenStates has no federal data. Never process federal reps with OpenStates scripts — that wastes API calls and returns nothing. See [RATE_LIMITS.md](RATE_LIMITS.md).

---

## 2. Prerequisites

- Node.js
- Supabase project with schema applied
- `.env` or `.env.local` in `services/civics-backend/` (or `web/.env.local` in monorepo) — run `npm run ingest:setup` or copy from `env.example`

### Required env vars
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optional (enables enrichment)
```
OPENSTATES_API_KEY=...     # Committees, activity, events (state/local)
OPENSTATES_DAILY_LIMIT=250 # Default for freemium; set 10000 if higher tier
CONGRESS_GOV_API_KEY=...   # Federal IDs
FEC_API_KEY=...            # Federal campaign finance
GOVINFO_API_KEY=...        # Federal IDs
```

---

## 3. Ingestion Order (run in this sequence)

### Quick start (single command)

```bash
npm run ingest:setup   # First time: create .env, check setup
npm run ingest        # Full pipeline (baseline + API syncs + federal)
```

### Step 1: Baseline (OpenStates YAML)

Loads state/local reps from git submodule. No API calls.

```bash
npm run openstates:ingest
```

Does: sync submodule → stage → merge. Writes to `representatives_core`, contacts, photos, social, divisions. **Does not provide committees** — those come from API.

### Step 2: State/Local Enrichment (OpenStates API)

**Only processes state/local reps.** Requires `OPENSTATES_API_KEY`. Rate limited (see `OPENSTATES_DAILY_LIMIT`, default 250/day).

```bash
npm run openstates:sync:committees     # Committees
npm run openstates:sync:activity -- --resume   # Bill activity (use --resume to continue)
npm run openstates:sync:events         # Legislative events
```

Or run all: `npm run openstates:sync:all [--states=CA,NY] [--limit=N] [--skip-activity]`

**Resume:** Activity and committees support `--resume`. Checkpoints: `npm run tools:resume:sync`.

### Scheduled job (rate-limit-aware re-ingest)

**Recommended:** Use the rate-limit-aware scheduler. Checks API budget, stops before limit, resumes next run.

```bash
npm run reingest:scheduled
```

**Cron (daily when limit resets):**
```bash
0 6 * * * cd /path/to/Choices/services/civics-backend && npm run reingest:scheduled >> /var/log/reingest.log 2>&1
```

See [REINGEST_WORKFLOW.md](REINGEST_WORKFLOW.md) for details.

**Legacy:** `npm run openstates:sync:scheduled` — runs until rate limited (no budget check).

**GitHub Actions:** Workflow `.github/workflows/openstates-scheduled-sync.yml`. Set secrets: `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `OPEN_STATES_API_KEY` (mapped to `OPENSTATES_API_KEY` — note the underscore in the secret name).

### Step 3: Federal Enrichment

Federal reps only. Uses Congress.gov, FEC, GovInfo.

```bash
npm run federal:enrich:congress   # Bioguide, congress_gov_id
npm run federal:enrich:finance    # FEC IDs, campaign finance
```

---

## 4. Commands Reference

### Ingestion (order matters)
| Command | Scope | API? |
|---------|-------|------|
| `npm run ingest:setup` | Create `.env`, pre-flight check | No |
| `npm run ingest:check` | Verify env before ingest | No |
| `npm run ingest` | Full pipeline (baseline + API + federal) | Yes (skips steps when keys missing) |
| `npm run openstates:ingest` | State/local baseline | No |
| `npm run openstates:sync:committees` | State/local | Yes (~2 req/sec) |
| `npm run openstates:sync:activity -- --resume` | State/local | Yes |
| `npm run openstates:sync:events` | State/local | Yes |
| `npm run reingest:scheduled` | State/local | Yes (rate-limit-aware, budget check, resume) |
| `npm run openstates:sync:scheduled` | State/local | Yes (legacy: committees → activity → events) |
| `npm run openstates:sync:contacts` | State/local | No |
| `npm run openstates:sync:social` | State/local | No |
| `npm run openstates:sync:photos` | State/local | No |
| `npm run openstates:sync:data-sources` | State/local | No |
| `npm run federal:enrich:congress` | Federal | Yes |
| `npm run federal:enrich:finance` | Federal | Yes |

### Script naming

- **`openstates:sync:*`** — Preferred; clearly indicates OpenStates API as the source.
- **`state:sync:*`** — Alias; same scripts. Use for consistency with legacy docs.
- **`sync:*`** — Short alias (e.g. `sync:activity` → `state:sync:activity`).

All three run the same underlying sync scripts.

### Options (pass after `--`)
- `--states=CA,NY,TX` — Filter by state
- `--limit=N` — Limit reps processed
- `--dry-run` — No writes
- `--resume` — Continue from checkpoint (activity, committees)
- `--max-reps=N` — Max reps this run (activity; for rate-limit-aware re-ingest)
- `--skip-activity` — For sync:all only
- `--lookup-missing-fec-ids` — For federal:enrich:finance
- `--resume` — Continue from checkpoint (activity, committees, federal:enrich:finance)
- `--dry-run` — Preview without writes (ingest, gap:fill, federal enrichers)

### Tools
| Command | Purpose |
|---------|---------|
| `npm run tools:report:gaps` | Finance, congress, activity, committee gaps |
| `npm run tools:smoke-test` | Data integrity check |
| `npm run tools:metrics:dashboard` | Coverage, quality, API usage |
| `npm run tools:check:openstates-status` | OpenStates gaps |
| `npm run tools:check:fec-status` | FEC gaps |
| `npm run tools:resume:sync` | List checkpoints |
| `npm run tools:update:quality-scores` | Recompute quality |
| `npm run tools:audit:duplicates` | Find duplicates |
| `npm run tools:verify:crosswalk` | Verify identifier mapping |
| `npm run tools:debug:committees-api` | Debug OpenStates committees API |
| `npm run ingest:qa` | Run QA (report:gaps + smoke-test + metrics:dashboard) |

---

## 5. Data Flow

```
OpenStates YAML (baseline)
  → representatives_core, contacts, photos, social, divisions
  → Provides openstates_id (required for API)

OpenStates API (enrichment)
  → representative_committees, representative_activity
  → Uses openstates_id; state/local only

Federal APIs (enrichment)
  → representatives_core (bioguide_id, fec_id)
  → representative_campaign_finance
  → Federal reps only
```

**Dependency:** Baseline must run first to create `openstates_id`. API syncs require it.

---

## 6. Key Tables

| Table | Source |
|-------|--------|
| `representatives_core` | YAML baseline + federal APIs |
| `representative_committees` | OpenStates API |
| `representative_activity` | OpenStates API |
| `representative_campaign_finance` | FEC |
| `representative_contacts` | YAML |
| `representative_photos` | YAML |
| `representative_social_media` | YAML |

See `DATABASE_SCHEMA.md` for column details.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 0 committees | YAML has no committee roles | Committees come from API. Set `OPENSTATES_API_KEY`. |
| Rate limit (429) | ~2 req/sec or hourly cap | Use `--resume`. Run `openstates:sync:scheduled` on a schedule. |
| "No representatives" | Baseline not run | Run `npm run ingest` or `npm run openstates:ingest` first. |
| Federal reps in OpenStates syncs | Bug | OpenStates syncs must exclude federal. |
| FEC finance missing | No FEC ID | FEC IDs from YAML `other_identifiers`. Try `--lookup-missing-fec-ids`. |

### Known Limitations

- **GovInfo 500s:** The GovInfo API member lookup can return 500 errors intermittently (0/547 `govinfo_id` as of 2026-01). See [RATE_LIMITS.md](RATE_LIMITS.md) for details. Retry when the API stabilizes; Congress.gov remains the primary source for federal IDs.

---

## 8. Document Index

**Canonical (use these):**

| Doc | Purpose |
|-----|---------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | 3-step quick start for new developers |
| [OPERATOR_RUNBOOK.md](OPERATOR_RUNBOOK.md) | Operations, troubleshooting, recovery, security, "What to run when" |
| [README.md](README.md) | This file — full command reference, data flow |
| [REINGEST_WORKFLOW.md](REINGEST_WORKFLOW.md) | Rate-limit-aware re-ingest, cron, checkpoints |
| [RATE_LIMITS.md](RATE_LIMITS.md) | API limits (OpenStates, FEC, Congress.gov, GovInfo); GovInfo 500s known limitation |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Table reference |
| [STANDALONE_SERVICE.md](STANDALONE_SERVICE.md) | Standalone design, rate limits, gap-fill, downstream |
| [OPENSTATES_COMMITTEES_STATUS.md](OPENSTATES_COMMITTEES_STATUS.md) | Committees API data gap (0 results) |
| [REMOVED_SCRIPTS.md](REMOVED_SCRIPTS.md) | Scripts removed during audit (no active source) |

**Tools:** Add `--json` to `tools:report:gaps`, `tools:smoke-test`, `tools:metrics:dashboard` for machine-readable output.

**Archived:** [archive/](archive/) — historical only. See [archive/README.md](archive/README.md).

---

## 9. Directory Layout

```
NEW_civics_ingest/
├── clients/       # congress, fec, govinfo, openstates, supabase
├── data/          # openstates-people (git submodule)
├── enrich/        # committees, federal, state logic
├── federal/       # enrich-congress-ids, enrich-fec-finance
├── ingest/        # YAML parsing, crosswalk
├── openstates/    # sync-*.ts, stage, merge
├── persist/       # DB writes
├── scripts/       # check-*, tools/*
├── utils/         # checkpoint, data-quality
└── workflows/     # activity-sync (checkpoints)
```

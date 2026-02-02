# Civics Ingest Service — Documentation

**Point agents to this `docs/` folder.** Start with this file. It contains everything needed to correctly use the ingest service.

Run all commands from `services/civics-backend/`.

---

## 1. Overview

Node.js service that ingests representative data from multiple sources into Supabase.

| Source | Scope | Rate Limit |
|--------|-------|------------|
| **OpenStates YAML** | State/local only | None |
| **OpenStates API** | State/local only | ~2 req/sec (~7k/hour) |
| **Congress.gov** | Federal only | Varies |
| **FEC** | Federal only | Varies |
| **GovInfo** | Federal only | Varies |

**Constraint:** OpenStates has no federal data. Never process federal reps with OpenStates scripts — that wastes API calls and returns nothing. OpenStates API limits: ~2 requests/second (~7,200/hour).

---

## 2. Prerequisites

- Node.js
- Supabase project with schema applied
- `.env` in `services/civics-backend/` (copy from `env.example`)

### Required env vars
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optional (enables enrichment)
```
OPENSTATES_API_KEY=...     # Committees, activity, events (state/local)
CONGRESS_GOV_API_KEY=...   # Federal IDs
FEC_API_KEY=...            # Federal campaign finance
GOVINFO_API_KEY=...        # Federal IDs
```

---

## 3. Ingestion Order (run in this sequence)

### Step 1: Baseline (OpenStates YAML)

Loads state/local reps from git submodule. No API calls.

```bash
npm run openstates:ingest
```

Does: sync submodule → stage → merge. Writes to `representatives_core`, contacts, photos, social, divisions. **Does not provide committees** — those come from API.

### Step 2: State/Local Enrichment (OpenStates API)

**Only processes state/local reps.** Requires `OPENSTATES_API_KEY`. Rate limited: ~2 req/sec (~7k/hour).

```bash
npm run openstates:sync:committees     # Committees
npm run openstates:sync:activity -- --resume   # Bill activity (use --resume to continue)
npm run openstates:sync:events         # Legislative events
```

Or run all: `npm run openstates:sync:all [--states=CA,NY] [--limit=N] [--skip-activity]`

**Resume:** Activity and committees support `--resume`. Checkpoints: `npm run tools:resume:sync`.

### Scheduled job (continuous gap-filling)

Run OpenStates API syncs on a schedule so committees, activity, and events fill over time (each run resumes from checkpoint).

**One-off:** From `services/civics-backend/`:
```bash
npm run openstates:sync:scheduled
```

**Cron (e.g. daily at 6:00):**
```bash
0 6 * * * cd /path/to/Choices/services/civics-backend && npm run openstates:sync:scheduled >> /var/log/openstates-sync.log 2>&1
```

**GitHub Actions:** Workflow `.github/workflows/openstates-scheduled-sync.yml` runs on schedule (6:00 UTC) and `workflow_dispatch`. Set secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENSTATES_API_KEY`.

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
| `npm run openstates:ingest` | State/local baseline | No |
| `npm run openstates:sync:committees` | State/local | Yes (~2 req/sec) |
| `npm run openstates:sync:activity -- --resume` | State/local | Yes |
| `npm run openstates:sync:events` | State/local | Yes |
| `npm run openstates:sync:scheduled` | State/local | Yes (committees → activity → events, resume) |
| `npm run openstates:sync:contacts` | State/local | No |
| `npm run openstates:sync:social` | State/local | No |
| `npm run openstates:sync:photos` | State/local | No |
| `npm run openstates:sync:data-sources` | State/local | No |
| `npm run federal:enrich:congress` | Federal | Yes |
| `npm run federal:enrich:finance` | Federal | Yes |

### Options (pass after `--`)
- `--states=CA,NY,TX` — Filter by state
- `--limit=N` — Limit reps processed
- `--dry-run` — No writes
- `--resume` — Continue from checkpoint (activity, committees)
- `--skip-activity` — For sync:all only
- `--lookup-missing-fec-ids` — For federal:enrich:finance

### Tools
| Command | Purpose |
|---------|---------|
| `npm run tools:metrics:dashboard` | Coverage, quality, API usage |
| `npm run tools:check:openstates-status` | OpenStates gaps |
| `npm run tools:check:fec-status` | FEC gaps |
| `npm run tools:resume:sync` | List checkpoints |
| `npm run tools:update:quality-scores` | Recompute quality |
| `npm run tools:audit:duplicates` | Find duplicates |
| `npm run tools:verify:crosswalk` | Verify identifier mapping |

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
| "No representatives" | Baseline not run | Run `npm run openstates:ingest` first. |
| Federal reps in OpenStates syncs | Bug | OpenStates syncs must exclude federal. |
| FEC finance missing | No FEC ID | FEC IDs from YAML `other_identifiers`. Try `--lookup-missing-fec-ids`. |

---

## 8. Directory Layout

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

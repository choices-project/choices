# Getting Started: Civics Ingest Service

**Last Updated:** 2026-01-27

## What Is This Service?

The civics ingest service is a Node.js application that ingests, enriches, and maintains representative data from multiple sources:
- **OpenStates** (YAML + API) - State/local representatives
- **Congress.gov** - Federal representatives
- **FEC** - Campaign finance data
- **GovInfo** - Federal member IDs

## Quick Overview

### Data Sources

| Source | Type | What It Provides | Rate Limits |
|--------|------|-----------------|-------------|
| **OpenStates YAML** | Static | Core data, contacts, photos, social, IDs | None |
| **OpenStates API** | Live | Committees, activity, events | 10,000/day |
| **Congress.gov** | Live | Federal member data, Bioguide IDs | Varies |
| **FEC** | Live | Campaign finance data | Varies |
| **GovInfo** | Live | Federal member IDs | Varies |

### Key Concepts

1. **Baseline First:** YAML provides baseline data and `openstates_id` (required for API)
2. **API Enrichment:** API provides live data (committees, activity) that YAML doesn't have
3. **Federal Separate:** Federal data comes from different APIs (Congress.gov, FEC)
4. **Status Tracking:** Representatives have status: `active`, `inactive`, `historical`

## Directory Structure

```
NEW_civics_ingest/
├── clients/          # API clients (congress, fec, openstates, supabase)
├── data/             # YAML data files (git submodule)
├── docs/             # Documentation (you are here)
├── enrich/           # Enrichment logic (committees, federal, state)
├── federal/          # Federal-specific scripts
├── ingest/           # Ingestion modules (YAML parsing)
├── openstates/       # OpenStates sync scripts (current)
├── persist/          # Database persistence modules
├── scripts/          # Utility scripts and tools
├── utils/            # Shared utilities (checkpoints, quality, logging)
└── workflows/        # Complex workflows (activity sync with checkpoints)
```

## Three Main Data Flows

### 1. Baseline Ingestion (OpenStates YAML)

**Purpose:** Load baseline representative data from static YAML

**Process:**
```bash
# 1. Sync YAML submodule
npm run openstates:sync-people

# 2. Stage YAML data into Supabase
npm run openstates:stage

# 3. Merge staged data into production
npm run openstates:merge

# Or all at once:
npm run openstates:ingest
```

**What It Creates:**
- `representatives_core` records
- Contact information
- Photos
- Social media profiles
- OpenStates IDs (required for API calls)

**Note:** YAML does NOT contain committee roles. Committees come from API only.

### 2. State/Local Enrichment (OpenStates API)

**Purpose:** Enrich with live API data (committees, activity)

**Process:**
```bash
# Sync committees
npm run openstates:sync:committees

# Sync activity (with resume capability)
npm run openstates:sync:activity -- --resume

# Sync events
npm run openstates:sync:events
```

**What It Creates:**
- Committee assignments (`representative_committees`)
- Bill activity (`representative_activity`)
- Legislative events

**Rate Limits:** 10,000 requests/day. Use `--resume` to continue from checkpoint.

### 3. Federal Enrichment

**Purpose:** Enrich federal representatives with Congress.gov, FEC data

**Process:**
```bash
# Enrich Congress.gov IDs
npm run federal:enrich:congress

# Enrich FEC finance data
npm run federal:enrich:finance
```

**What It Creates:**
- Bioguide IDs
- FEC IDs
- Campaign finance data (`representative_campaign_finance`)

## Common Tasks

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (see .env.example)
# Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# Optional: OPENSTATES_API_KEY, CONGRESS_GOV_API_KEY, FEC_API_KEY

# 3. Run baseline ingestion
npm run openstates:ingest

# 4. Enrich with API data
npm run openstates:sync:committees
npm run openstates:sync:activity

# 5. Enrich federal data
npm run federal:enrich:congress
npm run federal:enrich:finance
```

### Check Data Status

```bash
# View comprehensive metrics
npm run tools:metrics:dashboard

# Check for duplicates
npm run tools:audit:duplicates

# Validate term dates
npm run tools:validate:term-dates

# Verify crosswalks
npm run tools:verify:crosswalk
```

### Update Existing Data

```bash
# Update activity (resume from checkpoint if interrupted)
npm run openstates:sync:activity -- --resume

# Update committees
npm run openstates:sync:committees

# Update finance data
npm run federal:enrich:finance

# Update quality scores
npm run tools:update:quality-scores
```

## Important Notes

### Committees Are API-Only

**Critical:** YAML does NOT contain committee roles. The `openstates_people_roles` table only has legislative/executive roles (lower, upper, mayor, governor, etc.).

**Implication:** Committees must come from OpenStates API. If committees aren't populating:
1. Verify `OPENSTATES_API_KEY` is set
2. Check API connectivity
3. Review sync logs for errors

### Rate Limits

**OpenStates API:** 10,000 requests/day
- Activity sync supports checkpoints for resuming
- Use `--resume` flag to continue from last checkpoint
- Check checkpoints: `npm run tools:resume:sync`

### Status Tracking

Representatives have three statuses:
- `active` - Currently serving
- `inactive` - No longer serving
- `historical` - Replaced by another representative

Status changes are tracked via `replaced_by_id`, `status_reason`, `status_changed_at`.

## Troubleshooting

### Committees Not Populating

**Symptoms:** Sync reports "complete" but database shows 0 committees

**Causes:**
- YAML doesn't contain committee roles (expected)
- API calls failing silently
- API key not set or invalid

**Solutions:**
1. Verify `OPENSTATES_API_KEY` environment variable
2. Check sync logs for API errors
3. Test API connectivity manually
4. Review `enrich/committees.ts` for API call logic

### Activity Sync Hitting Rate Limits

**Symptoms:** Sync stops with rate limit errors

**Solutions:**
1. Use `--resume` flag to continue from checkpoint
2. Check available checkpoints: `npm run tools:resume:sync`
3. Wait for daily limit reset (10,000 requests/day)

### Data Quality Scores Low

**Symptoms:** Many representatives with low quality scores

**Solutions:**
1. Run quality score update: `npm run tools:update:quality-scores`
2. Check coverage metrics: `npm run tools:metrics:dashboard`
3. Review missing data (committees, activity, finance)

## Next Steps

1. **Read:** `INGEST_FLOWS.md` - Detailed flow documentation
2. **Read:** `DATABASE_SCHEMA.md` - Complete schema reference
3. **Read:** `SERVICE_STRUCTURE.md` - Service architecture
4. **Read:** `CLIENT_*.md` - API client documentation

## Key Files to Know

- `openstates/stage-openstates.ts` - YAML parser and stager
- `openstates/run-openstates-merge.ts` - SQL merge executor
- `workflows/activity-sync.ts` - Activity sync with checkpoints
- `enrich/committees.ts` - Committee enrichment logic
- `persist/*.ts` - Database persistence modules
- `utils/checkpoint.ts` - Resume capability

---

**Questions?** See `docs/README.md` for complete documentation index.

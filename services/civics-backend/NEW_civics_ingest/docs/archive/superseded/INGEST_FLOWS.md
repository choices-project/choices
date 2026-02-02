# Ingest Flows

**Last Updated:** 2026-01-27

## Overview

The civics ingest system uses three independent data flows to populate representative data from multiple sources:

1. **OpenStates People (YAML)** - Baseline data, run first
2. **State/Local Enrichment** - Uses OpenStates API (live data)
3. **Federal Enrichment** - Congress.gov, FEC, GovInfo

## Flow 1: OpenStates People (YAML) - Baseline

**Purpose:** Load baseline representative data from static YAML archive

**Data Sources:**
- OpenStates People YAML submodule (git submodule)
- Static snapshot, no API calls

**What It Provides:**
- Core representative data (name, office, party, state, level)
- Contact information (emails, phones, addresses)
- Photos
- Social media profiles
- **OpenStates IDs** (required for API calls)
- **Note:** Does NOT provide committee roles (committees come from API only)

**Process:**
1. `openstates:sync-people` - Sync YAML submodule from git
2. `openstates:stage` - Parse YAML and stage into Supabase staging tables
3. `openstates:merge` - Merge staged data into `representatives_core` via SQL function

**Database Tables:**
- Staging: `openstates_people_data`, `openstates_people_roles`, `openstates_people_contacts`, etc.
- Production: `representatives_core` (via `sync_representatives_from_openstates()` RPC)

**Key Files:**
- `openstates/stage-openstates.ts` - YAML parser and stager
- `openstates/run-openstates-merge.ts` - SQL merge executor
- `ingest/openstates/people.ts` - YAML parsing logic

## Flow 2: State/Local Enrichment - OpenStates API

**Purpose:** Enrich state/local representatives with live API data

**Data Sources:**
- OpenStates API (`https://v3.openstates.org`)
- Rate limited: 10,000 requests/day
- Requires `openstates_id` from Flow 1

**What It Provides:**
- **Activity:** Bill sponsorships, votes (`representative_activity`)
- **Committees:** Committee assignments (`representative_committees`) ⚠️ **API only, not in YAML**
- **Events:** Legislative events (hearings, sessions)

**Process:**
- `openstates:sync:activity` - Sync bill activity (with checkpoint/resume)
- `openstates:sync:committees` - Sync committee assignments
- `openstates:sync:events` - Sync legislative events

**Key Files:**
- `openstates/sync-activity.ts` - Activity sync script
- `openstates/sync-committees.ts` - Committees sync script
- `workflows/activity-sync.ts` - Activity sync with checkpoints
- `clients/openstates.ts` - API client
- `enrich/committees.ts` - Committee enrichment logic

**Important Notes:**
- **Committees:** YAML does NOT contain committee roles in `openstates_people_roles` table. Committees must come from API.
- **Rate Limits:** Activity sync supports checkpoints for resuming after rate limits
- **Resume:** Use `--resume` flag to continue from checkpoint

## Flow 3: Federal Enrichment

**Purpose:** Enrich federal representatives with Congress.gov, FEC, GovInfo data

**Data Sources:**
- **Congress.gov API** - Member data, Bioguide IDs
- **FEC API** - Campaign finance data
- **GovInfo API** - Member IDs

**What It Provides:**
- Congress.gov IDs (`bioguide_id`)
- FEC IDs (`fec_id`)
- Campaign finance data (`representative_campaign_finance`)
- GovInfo IDs

**Process:**
- `federal:enrich:congress` - Enrich Congress.gov IDs
- `federal:enrich:finance` - Enrich FEC finance data

**Key Files:**
- `federal/enrich-congress-ids.ts` - Congress ID enrichment
- `federal/enrich-fec-finance.ts` - FEC finance enrichment
- `clients/congress.ts` - Congress.gov API client
- `clients/fec.ts` - FEC API client
- `clients/govinfo.ts` - GovInfo API client

## Flow Dependencies

```
OpenStates People (YAML)
    ↓ (provides openstates_id)
OpenStates API Enrichment
    ↓ (uses openstates_id)
State/Local Representatives Enriched

Federal Enrichment (independent)
    ↓ (uses bioguide_id, fec_id)
Federal Representatives Enriched
```

**Key Dependency:**
- OpenStates People (YAML) **must** run first to provide `openstates_id`
- OpenStates API requires `openstates_id` from YAML
- Federal enrichment can run independently (uses different identifiers)

## First-Time vs Enrichment

**First-time Ingestion:**
- Only processes current representatives (`status = 'active'`)
- Creates new records in database
- Sets up baseline data

**Enrichment/Update:**
- Updates existing representatives
- Adds new representatives
- Marks replaced representatives as `status = 'historical'`
- Tracks replacements via `replaced_by_id`

## Data Coverage by Source

| Data Type | YAML | API | Federal APIs |
|-----------|------|-----|--------------|
| Core Data | ✅ | ❌ | ✅ (Congress.gov) |
| Contacts | ✅ | ❌ | ❌ |
| Photos | ✅ | ❌ | ❌ |
| Social Media | ✅ | ❌ | ❌ |
| **Committees** | ❌ | ✅ | ❌ |
| Activity | ❌ | ✅ | ❌ |
| Finance | ❌ | ❌ | ✅ (FEC) |

**Important:** Committees are **API-only**. YAML does not contain committee roles.

## Common Workflows

### Full First-Time Ingestion
```bash
# 1. Baseline (YAML)
npm run openstates:ingest

# 2. State/Local Enrichment (API)
npm run openstates:sync:committees
npm run openstates:sync:activity -- --resume

# 3. Federal Enrichment
npm run federal:enrich:congress
npm run federal:enrich:finance
```

### Update Existing Data
```bash
# Update activity (resume from checkpoint)
npm run openstates:sync:activity -- --resume

# Update committees
npm run openstates:sync:committees

# Update finance data
npm run federal:enrich:finance
```

## Troubleshooting

### Committees Not Populating
- **Cause:** YAML doesn't contain committee roles
- **Solution:** Committees must come from OpenStates API
- **Check:** Verify `OPENSTATES_API_KEY` is set and API is enabled

### Activity Sync Hitting Rate Limits
- **Solution:** Use `--resume` flag to continue from checkpoint
- **Check:** `npm run tools:resume:sync` to see available checkpoints

See `ROADMAP.md` for detailed implementation status and `SERVICE_STRUCTURE.md` for architecture details.

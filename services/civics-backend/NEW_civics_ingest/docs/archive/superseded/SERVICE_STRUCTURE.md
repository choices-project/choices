# Civics Ingest Service Structure

**Last Updated:** 2026-01-27  
**Status:** Comprehensive service documentation

## Overview

The civics ingest service is organized into clear functional modules for ingesting, enriching, and persisting representative data from multiple sources.

## Directory Structure

```
NEW_civics_ingest/
├── clients/              # API clients for external data sources
│   ├── congress.ts       # Congress.gov API (federal)
│   ├── fec.ts            # FEC API (campaign finance)
│   ├── govinfo.ts        # GovInfo API (federal)
│   ├── openstates.ts     # OpenStates API (state/local - live data)
│   └── supabase.ts       # Supabase database client
│
├── data/                 # Static data files (YAML submodule)
│   └── openstates-people/ # OpenStates people YAML archive
│
├── docs/                 # Documentation
│   ├── CLIENT_*.md       # API client documentation
│   ├── INGEST_FLOWS.md   # Data flow documentation
│   └── ...
│
├── enrich/               # Data enrichment modules
│   ├── committees.ts     # Committee assignment enrichment
│   ├── federal.ts        # Federal data enrichment
│   └── state.ts          # State/local data enrichment
│
├── federal/              # Federal-specific scripts
│   ├── enrich-congress-ids.ts
│   ├── enrich-fec-finance.ts
│   └── ...
│
├── ingest/               # Data ingestion modules
│   ├── openstates/       # OpenStates YAML ingestion
│   │   ├── index.ts      # Collection helpers
│   │   └── people.ts     # YAML parser
│   └── supabase/         # Supabase helpers
│       ├── crosswalk.ts  # Identifier crosswalk
│       └── representatives.ts
│
├── openstates/           # OpenStates sync scripts (current)
│   ├── sync-activity.ts
│   ├── sync-committees.ts
│   ├── sync-contacts.ts
│   ├── sync-social.ts
│   ├── sync-photos.ts
│   ├── sync-events.ts
│   ├── sync-all.ts
│   ├── stage-openstates.ts
│   └── run-openstates-merge.ts
│
├── persist/              # Database persistence modules
│   ├── activity.ts       # Bill activity persistence
│   ├── committees.ts     # Committee assignments persistence
│   ├── contacts.ts       # Contact information persistence
│   ├── data-quality.ts   # Quality score calculation
│   ├── data-sources.ts   # Data source tracking
│   ├── photos.ts         # Photo persistence
│   └── social.ts         # Social media persistence
│
├── scripts/              # Utility scripts
│   ├── tools/            # CLI tools
│   │   ├── metrics-dashboard.ts
│   │   ├── resume-sync.ts
│   │   └── ...
│   └── ingest-committees-events.ts
│
├── utils/                # Shared utilities
│   ├── checkpoint.ts     # Resume capability
│   ├── data-quality.ts   # Quality scoring
│   ├── fec-name-matching.ts
│   └── logger.ts
│
└── workflows/            # Complex workflows
    └── activity-sync.ts   # Activity sync with checkpoints
```

## Data Flow

### 1. Baseline Ingestion (OpenStates YAML)
**Purpose:** Load baseline representative data from static YAML archive

**Flow:**
1. `openstates:sync-people` - Sync YAML submodule
2. `openstates:stage` - Stage YAML data into Supabase staging tables
3. `openstates:merge` - Merge staged data into `representatives_core` via SQL function

**Key Files:**
- `openstates/stage-openstates.ts` - Parses YAML, stages data
- `openstates/run-openstates-merge.ts` - Executes SQL merge function
- `ingest/openstates/people.ts` - YAML parser

**Database Tables:**
- Staging: `openstates_people_data`, `openstates_people_roles`, etc.
- Production: `representatives_core` (via `sync_representatives_from_openstates()` RPC)

### 2. State/Local Enrichment (OpenStates API)
**Purpose:** Enrich state/local representatives with live API data

**Data Types:**
- **Activity:** Bill sponsorships, votes (`persist/activity.ts`)
- **Committees:** Committee assignments (`persist/committees.ts`)
- **Contacts:** Contact information (`persist/contacts.ts`)
- **Photos:** Representative photos (`persist/photos.ts`)
- **Social:** Social media profiles (`persist/social.ts`)

**Key Files:**
- `openstates/sync-*.ts` - Individual sync scripts
- `clients/openstates.ts` - API client
- `enrich/committees.ts` - Committee enrichment logic
- `workflows/activity-sync.ts` - Activity sync with checkpoints

**Rate Limits:**
- OpenStates API: 10,000 requests/day
- Checkpoints: Resume capability via `utils/checkpoint.ts`

### 3. Federal Enrichment
**Purpose:** Enrich federal representatives with Congress.gov, FEC, GovInfo data

**Data Sources:**
- **Congress.gov:** Member data, IDs (`clients/congress.ts`)
- **FEC:** Campaign finance data (`clients/fec.ts`)
- **GovInfo:** Member IDs (`clients/govinfo.ts`)

**Key Files:**
- `federal/enrich-congress-ids.ts` - Congress ID enrichment
- `federal/enrich-fec-finance.ts` - FEC finance enrichment
- `enrich/federal.ts` - Federal enrichment helpers

## Database Schema

### Core Tables

**`representatives_core`**
- Primary representative data
- Columns: `id`, `name`, `office`, `level`, `state`, `party`, `status`, `data_quality_score`, etc.
- Identifiers: `openstates_id`, `bioguide_id`, `fec_id`, `canonical_id`

**`representative_committees`**
- Committee assignments
- Columns: `representative_id`, `committee_name`, `role`, `start_date`, `end_date`, `is_current`
- **Source:** OpenStates API (YAML doesn't contain committee roles)

**`representative_activity`**
- Bill sponsorships and votes
- Columns: `representative_id`, `bill_id`, `activity_type`, `is_primary_sponsor`, etc.
- **Source:** OpenStates API

**`representative_campaign_finance`**
- FEC campaign finance data
- Columns: `representative_id`, `cycle`, `total_receipts`, `total_disbursements`, etc.
- **Source:** FEC API

**`representative_social_media`**
- Social media profiles
- Columns: `representative_id`, `platform`, `handle`, `url`, `is_verified`
- **Source:** OpenStates YAML + API

### Staging Tables

**`openstates_people_*`**
- Staging tables for YAML data
- Populated by `stage-openstates.ts`
- Merged into production via `sync_representatives_from_openstates()` RPC

## RPC Functions

**`sync_representatives_from_openstates()`**
- Main merge function for YAML data
- Merges staging tables into `representatives_core`
- Handles status tracking (active/inactive/historical)

**`update_representative_status()`**
- Updates representative status
- Tracks replacements via `replaced_by_id`

**`touch_representative_divisions()`**
- Updates division mappings

## Key Concepts

### Status Tracking
- `active`: Current representative
- `inactive`: No longer serving
- `historical`: Replaced by another representative

### Data Quality Score
- 0-100 score based on completeness
- Calculated by `persist/data-quality.ts`
- Factors: contacts, photos, social, finance, activity, committees

### Checkpoints
- Resume capability for long-running syncs
- Stored via `utils/checkpoint.ts`
- Used by `workflows/activity-sync.ts`

### Rate Limiting
- OpenStates: 10,000 requests/day
- Tracked in `clients/openstates.ts`
- Checkpoints allow resuming after rate limit

## Common Tasks

### Run Baseline Ingestion
```bash
npm run openstates:ingest
```

### Sync Activity (with resume)
```bash
npm run openstates:sync:activity -- --resume
```

### Sync Committees
```bash
npm run openstates:sync:committees
```

### Enrich Federal Data
```bash
npm run federal:enrich:congress
npm run federal:enrich:finance
```

### Check Metrics
```bash
npm run tools:metrics:dashboard
```

## Troubleshooting

### Committees Not Populating
- **Issue:** YAML doesn't contain committee roles in `openstates_people_roles`
- **Solution:** Committees must come from OpenStates API
- **Check:** Verify `OPENSTATES_API_KEY` is set and API is enabled

### Activity Sync Hitting Rate Limits
- **Solution:** Use `--resume` flag to continue from checkpoint
- **Check:** `npm run tools:resume:sync` to see checkpoints

### Data Quality Scores Low
- **Check:** Run `npm run tools:update:quality-scores`
- **Review:** Coverage metrics via `npm run tools:metrics:dashboard`

---

**See Also:**
- `INGEST_FLOWS.md` - Detailed flow documentation
- `CLIENT_*.md` - API client documentation
- `REMAINING_WORK.md` - Known issues and improvements

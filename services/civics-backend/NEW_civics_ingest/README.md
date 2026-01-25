# NEW Civics Ingest - Verified Working Code

**Purpose:** This directory contains verified, working code for the enhanced civics ingestion system. Files are moved here once they've been tested and confirmed working.

## Directory Structure

```
NEW_civics_ingest/
├── clients/          # API clients (Congress.gov, GovInfo)
├── docs/             # Documentation and guides
├── federal/          # Federal enrichment scripts
└── openstates/       # OpenStates ingestion scripts
```

## Verified Working Components

### ✅ OpenStates Ingestion (Complete)
- **Location:** `openstates/`
- **Status:** Successfully ingested 8,108 representatives
- **Files:**
  - `stage-openstates.ts` - Stages YAML data into Supabase
  - `run-openstates-merge.ts` - Executes SQL merge function
  - `sync-*.ts` - Various sync scripts for contacts, photos, social, etc.

### ✅ Congress.gov Enrichment (Complete)
- **Location:** `federal/`
- **Status:** Successfully enriched 547 federal representatives
- **Results:**
  - 102 Senators (correctly classified)
  - 445 Representatives (correctly classified)
  - 100% coverage: All have `bioguide_id` and `congress_gov_id`
- **Files:**
  - `enrich-congress-ids.ts` - Main enrichment script with validation
  - `../clients/congress.ts` - Congress.gov API client with validation

### ⚠️ GovInfo Enrichment (Pending)
- **Location:** `clients/govinfo.ts`
- **Status:** API experiencing 500 errors
- **Note:** Optional enrichment, can retry later
- **Future:** GovInfo MCP server configured for document access

## Documentation

All documentation is in `docs/`:

- **Congress.gov:**
  - `CONGRESS_ENRICHMENT_ANALYSIS.md` - Detailed analysis
  - `CONGRESS_ENRICHMENT_FINAL_STATUS.md` - Final status and verification

- **GovInfo MCP:**
  - `GOVINFO_MCP_BENEFITS_ANALYSIS.md` - Benefits for future features
  - `GOVINFO_MCP_EVALUATION.md` - Evaluation and recommendations
  - `GOVINFO_MCP_SETUP.md` - Setup and testing guide

- **General:**
  - `INGEST_FLOWS.md` - Overview of ingest flows
  - `MIGRATION_ORDER.md` - Migration application order
  - `STATUS_MIGRATION_GUIDE.md` - Status field migration guide
  - `SCHEMA_OPTIMIZATIONS.md` - Schema optimization details

## Usage

### OpenStates Ingestion
```bash
cd services/civics-backend
npm run openstates:stage    # Stage YAML data
npm run openstates:merge    # Merge into representatives_core
```

### Congress.gov Enrichment
```bash
cd services/civics-backend
npm run federal:enrich:congress
```

## Next Steps

1. **FEC Enrichment** - Add campaign finance data (requires FEC IDs from Congress.gov)
2. **State Enrichment** - Optional API-based refreshes
3. **GovInfo Retry** - Retry GovInfo enrichment when API stabilizes
4. **GovInfo MCP Integration** - Use MCP for document access in future features

## Notes

- All code in this directory has been tested and verified working
- Files maintain their original import paths (may need adjustment if moved to main codebase)
- Documentation reflects current status and includes troubleshooting guides

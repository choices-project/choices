# Civics Ingest System

Verified working code for civics data ingestion and enrichment.

## Directory Structure

```
NEW_civics_ingest/
├── clients/          # API clients
│   ├── congress.ts   # Congress.gov API
│   ├── fec.ts        # FEC API
│   └── govinfo.ts    # GovInfo API
├── data/             # Data files
│   ├── openstates-people/
│   └── voter-registration/
├── docs/             # Documentation
│   ├── CLIENT_*.md   # API client documentation
│   └── ...
├── federal/          # Federal enrichment scripts
│   ├── enrich-congress-ids.ts
│   ├── enrich-fec-finance.ts
│   └── ...
└── openstates/       # OpenStates ingestion scripts
    ├── stage-openstates.ts
    ├── run-openstates-merge.ts
    └── sync-*.ts
```

## API Clients

- **Congress.gov** (`clients/congress.ts`) - Fetches current Congress members
- **FEC** (`clients/fec.ts`) - Fetches campaign finance data
- **GovInfo** (`clients/govinfo.ts`) - Fetches GovInfo member IDs

See `docs/CLIENT_*.md` for detailed API client documentation.

## Scripts

### OpenStates Ingestion
- `openstates/stage-openstates.ts` - Stages YAML data into Supabase
- `openstates/run-openstates-merge.ts` - Executes SQL merge function
- `openstates/sync-*.ts` - Sync scripts for contacts, photos, social, etc.

### Federal Enrichment
- `federal/enrich-congress-ids.ts` - Enriches federal representatives from Congress.gov
- `federal/enrich-fec-finance.ts` - Enriches campaign finance data from FEC

## Documentation

See `docs/README.md` for complete documentation index.

## Requirements

- Node.js environment
- Supabase database connection
- API keys (see individual client docs):
  - `CONGRESS_GOV_API_KEY`
  - `FEC_API_KEY`
  - `GOVINFO_API_KEY` (optional)
  - `GOOGLE_CIVIC_API_KEY` (optional)

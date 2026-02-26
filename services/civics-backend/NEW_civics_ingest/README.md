# Civics Ingest Service

Node.js service for ingesting representative data from OpenStates, Congress.gov, FEC, and GovInfo into Supabase.

## Documentation

**All documentation is in [`docs/`](docs/).** Point agents to the `docs/` folder.

- **[docs/README.md](docs/README.md)** — Complete usage guide (commands, env vars, order, troubleshooting)
- **[docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** — Table reference

## Quick Start

```bash
cd services/civics-backend
npm install
npm run ingest:setup    # Creates .env, runs pre-flight check
# Edit .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run ingest         # Full pipeline (baseline + committees/activity + federal)
```

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the 3-step guide.

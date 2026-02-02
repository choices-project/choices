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
# Copy env.example to .env; set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run openstates:ingest
npm run openstates:sync:committees
npm run openstates:sync:activity -- --resume
npm run federal:enrich:congress
npm run federal:enrich:finance
```

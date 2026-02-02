# Quick Reference

**Last Updated:** 2026-01-27

## Essential Commands

### First-Time Setup
```bash
npm run openstates:ingest              # Baseline (YAML)
npm run openstates:sync:committees     # Committees (API)
npm run openstates:sync:activity       # Activity (API)
npm run federal:enrich:congress        # Congress IDs
npm run federal:enrich:finance         # FEC finance
```

### Check Status
```bash
npm run tools:metrics:dashboard         # Comprehensive metrics
npm run tools:audit:duplicates         # Check duplicates
npm run tools:resume:sync              # List checkpoints
```

### Update Data
```bash
npm run openstates:sync:activity -- --resume  # Resume from checkpoint
npm run openstates:sync:committees            # Update committees
npm run federal:enrich:finance                # Update finance
npm run tools:update:quality-scores           # Update quality scores
```

## Key Concepts

- **YAML:** Baseline data (core, contacts, photos, social, IDs) - No committees
- **API:** Live data (committees, activity, events) - Rate limited (10k/day)
- **Federal:** Separate APIs (Congress.gov, FEC, GovInfo)

## Important Notes

- **Committees are API-only** - YAML doesn't contain committee roles
- **Rate limits** - OpenStates: 10,000 requests/day
- **Resume capability** - Activity sync supports `--resume` flag
- **Status tracking** - Representatives: `active`, `inactive`, `historical`

## Documentation

- **Getting Started:** `docs/GETTING_STARTED.md`
- **Schema:** `docs/DATABASE_SCHEMA.md`
- **Flows:** `docs/INGEST_FLOWS.md`
- **Index:** `docs/README.md`

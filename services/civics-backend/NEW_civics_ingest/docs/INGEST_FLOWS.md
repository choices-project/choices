# Ingest Flows

**Last Updated:** 2026-01-27

## Overview

Three independent ingest flows for representative data:

1. **OpenStates People (YAML)** - Baseline data, run first
2. **State/Local Enrichment** - Uses OpenStates People IDs
3. **Federal Enrichment** - Congress.gov, FEC, GovInfo

## Flow Dependencies

- OpenStates People (YAML) must run first (provides `openstates_id`)
- OpenStates API requires `openstates_id` from YAML
- State/federal enrichment can run independently after baseline

## First-Time vs Enrichment

- **First-time**: Only current representatives (`status = 'active'`)
- **Enrichment**: Update existing, add new, mark replaced as `status = 'historical'`

See `ROADMAP.md` for detailed implementation status.

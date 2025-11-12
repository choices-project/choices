# Scripts Overview

This directory is organised to match the ingest flow from raw OpenStates data through enrichment and maintenance:

- `openstates/` – Static OpenStates People YAML ingest (`stage-openstates`, `run-openstates-merge`).
- `federal/` – Federal enrichment passes (Congress.gov identifiers, FEC finance totals).
- `state/` – OpenStates API-driven refreshers for contacts, social accounts, committees, photos, and activity.
- `tools/` – Operational utilities for auditing gaps, fixing duplicates, and inspecting Supabase schema.

Each script is invoked through an `npm run` command defined in `package.json`. Prefer the grouped commands (`openstates:*`, `federal:*`, `state:*`, `tools:*`) over legacy aliases (`sync:*`, `stage:openstates`, etc.) when updating documentation or workflows.



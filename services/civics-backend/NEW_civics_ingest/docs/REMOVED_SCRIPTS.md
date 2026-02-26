# Removed Scripts

Scripts removed during the 2026-02 civics ingest audit. Source for these lived in `archive/` and was not compiled.

## Removed (no active source)

- `test:openstates`, `sample`, `prioritize`, `preview`
- `openstates:coverage`
- `state:sync:voter-registration`, `state:sync:google-civic`, `state:sync:google-elections`, `state:sync:divisions`, `state:refresh`
- `federal:enrich:google-civic`
- `tools:audit:crosswalk`, `tools:report:duplicates`, `tools:fix:duplicates`, `tools:fix:crosswalk`
- `tools:inspect:schema`, `tools:investigate:ingest`, `tools:audit:activity`, `tools:audit:terms`
- `tools:verify:migrations`, `tools:test:bills`, `tools:test:congress`, `tools:test:google-civic`
- Aliases: `audit:crosswalk`, `audit:duplicates`, `fix:duplicates`, `fix:crosswalk`, `inspect:schema`, `audit:activity`, `audit:terms`, `qa:openstates`, `refresh:state`, `sync:google-civic`, `sync:google-elections`, `sync:divisions`
- `openstates:sync:google-civic`, `openstates:sync:google-elections`, `openstates:sync:divisions`

## Replacement

- **ingest:qa** now runs `tools:report:gaps`, `tools:smoke-test`, `tools:metrics:dashboard` (all working tools).

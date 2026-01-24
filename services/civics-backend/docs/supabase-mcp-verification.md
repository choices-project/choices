# Civics schema, RPC & functions — Supabase MCP verification

Use **Supabase MCP** to confirm that the schema, RPCs, and functions used by the civics ingest and web app are correct. See [AGENT_SETUP](../../docs/AGENT_SETUP.md) for MCP config.

---

## 1. Tables (civics ingest & web)

| Table | Purpose | Notes |
|-------|---------|-------|
| `representatives_core` | Canonical reps | Merge, enrich, web API |
| `representative_contacts` | Emails, phones, etc. | state:sync:contacts, google-civic |
| `representative_social_media` | Handles, URLs | state:sync:social |
| `representative_photos` | Portraits | state:sync:photos |
| `representative_committees` | Committee roles | state:sync:committees |
| `representative_campaign_finance` | FEC data | federal:enrich:finance |
| `representative_crosswalk_enhanced` | External IDs | Merge, fix:crosswalk |
| `representative_data_sources` | Provenance | state:sync:data-sources |
| `representative_data_quality` | Quality metrics | Merge |
| `representative_activity` | **Bills only** (`type = 'bill'`) | state:sync:activity; run `audit:activity` |
| `representative_divisions` | Rep → OCD divisions | state:sync:divisions, `refresh_divisions_from_openstates` |
| `civic_elections` | Upcoming elections | state:sync:google-elections; `get_upcoming_elections` |

Staging / upstream: `openstates_people_*`, `openstates_people_data`, etc.

---

## 2. RPCs & functions

| Name | Used by | Purpose |
|------|---------|---------|
| `get_table_columns(text)` | `tools:inspect:schema` | Column metadata for listed tables |
| `get_duplicate_canonical_ids()` | `tools:report:duplicates`, `fix:duplicates` | Duplicate canonical IDs |
| `sync_representatives_from_openstates` | `openstates:merge` | Merge staging → canonical |
| `refresh_divisions_from_openstates()` | `state:sync:divisions` | Rebuild `representative_divisions` |
| `get_upcoming_elections(divisions text[])` | Web `/api/v1/civics/elections` | Upcoming elections by OCD divisions |
| `touch_representative_divisions()` | Trigger on `representative_divisions` | Maintain `updated_at` |

---

## 3. MCP checks to run

### List tables

```text
list_tables { "schemas": ["public"] }
```

Filter for `representative_*`, `civic_*`, `openstates_*`.

### Schema / RPC verification (execute_sql)

```sql
-- Tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%representative%' OR table_name LIKE '%civic%' OR table_name LIKE '%openstates%')
ORDER BY table_name;

-- Functions
SELECT routine_name, routine_type FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%representative%' OR routine_name LIKE '%civic%'
    OR routine_name IN ('get_table_columns', 'get_duplicate_canonical_ids', 'get_upcoming_elections',
                       'sync_representatives_from_openstates', 'refresh_divisions_from_openstates'))
ORDER BY routine_name;

-- get_table_columns works for ingest tables
SELECT * FROM get_table_columns('representative_activity');
SELECT * FROM get_table_columns('representative_divisions');
SELECT * FROM get_table_columns('civic_elections');

-- Duplicates
SELECT * FROM get_duplicate_canonical_ids();
```

### Grants (service_role for ingest)

```sql
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('representative_activity', 'civic_elections', 'representatives_core')
ORDER BY table_name, grantee, privilege_type;
```

Expect `service_role` to have `SELECT`, `INSERT`, `UPDATE`, `DELETE` on ingest tables.

### Security & performance advisors

```text
get_advisors { "type": "security" }
get_advisors { "type": "performance" }
```

- **Security:** RLS policies (e.g. `representatives_core` “Authenticated full access”) are known; address any new findings per [RLS_VERIFICATION_GUIDE](../../RLS_VERIFICATION_GUIDE.md).
- **Performance:** Check for unindexed foreign keys, missing indexes on civics tables. Migration `20260125120000_add_representative_divisions_representative_id_idx.sql` adds an index on `representative_divisions(representative_id)`.

---

## 4. Indexes (civics)

- `representative_activity`: `representative_id`, `date`, `type`; unique constraint for dedupe.
- `representative_divisions`: `division_id`; **`representative_id`** (added in `20260125120000_*`).
- `civic_elections`: `election_day`, `ocd_division_id`.
- `representatives_core`: `canonical_id`, `state`, `level`, `openstates_id`, etc.

---

## 5. After schema changes

1. Re-run `npm run tools:inspect:schema` (and `ingest:qa`).
2. Regenerate Supabase types: `cd web && npm run types:generate`.
3. Update this doc if new tables, RPCs, or functions are introduced.

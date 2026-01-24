# OpenStates Ingest Verification (Supabase MCP)

**Purpose:** Record of Supabase MCP verification for the OpenStates ingest pipeline—staging, merge, current-only filtering, RPCs, and RLS. Use this to confirm “current representatives only” behavior and to track legacy rows.

**Checked:** 2026-01 (post merge-timeout fix).

---

## 1. Row counts (from `execute_sql`)

| Source | Count | Notes |
|--------|-------|--------|
| `openstates_people_data` | 25,140 | All people staged (no current-only filter). |
| `openstates_people_roles` | 30,432 | All roles staged. |
| `openstates_people_current_roles_v` (all) | 30,432 | View = roles + computed `is_current`. |
| `openstates_people_current_roles_v` **WHERE is_current** | 8,108 | Current roles only. |
| **Distinct current people** (role_choice) | 8,108 | One row per person with ≥1 current role. |
| `representatives_core` | 8,435 | Canonical reps. **327 more than distinct current people.** |

**Interpretation:**

- **Staging** deliberately loads **all** OpenStates people (25k) and roles (30k). Filtering to “current” happens at **merge** time via `openstates_people_current_roles_v` and `WHERE is_current`.
- **Merge** builds `tmp_openstates_stage` only from **current** roles, then **UPDATE** / **INSERT** into `representatives_core`. It does **not** DELETE or deactivate rows.
- The **327 extra** rows in `representatives_core` (8,435 − 8,108) are reps who **no longer have a current role** (or were added in a prior run). They remain in `representatives_core` because the sync never removes them.

---

## 2. “Current only” — where it happens

| Stage | Filter? | What |
|-------|---------|------|
| **Stage** (`stage-openstates`) | No | Loads all YAML people → `openstates_people_data`, `openstates_people_roles`, etc. |
| **View** `openstates_people_current_roles_v` | No | All roles; adds `is_current` = `coalesce(r.is_current, r.end_date is null or r.end_date >= current_date)`. |
| **Merge** `sync_representatives_from_openstates` | **Yes** | `current_roles` = view `WHERE is_current`; `role_choice` = distinct on person; `tmp_openstates_stage` only from those. UPDATE/INSERT touch only current people. |
| **representatives_core** | — | Contains current **and** legacy (no purge). |

So: **merge** is the only place that restricts to “current”; staging and the view do not.

---

## 3. RPCs / functions

| Function | Exists | Purpose |
|----------|--------|---------|
| `sync_representatives_from_openstates` | Yes | Merge staging → `representatives_core` (and related tables). |
| `deactivate_non_current_openstates_reps` | Yes | Set `is_active = false` for reps whose `openstates_id` is no longer current. Run after sync (e.g. from `openstates:merge`). |
| `refresh_divisions_from_openstates` | Yes | Rebuild `representative_divisions` from current roles. |
| `get_table_columns` | Yes | Column metadata for ingest tools. |
| `get_duplicate_canonical_ids` | Yes | Duplicate canonical ID reporting. |

**Function config (`pg_proc.proconfig`):**  
Only `search_path = public, extensions` observed. `statement_timeout` is not in `proconfig`; it may be set via `ALTER FUNCTION ... SET` (see migration `20260126120000_sync_merge_statement_timeout.sql`). Ensure that migration is applied so merge and division refresh don’t hit statement timeout.

---

## 4. RLS (ingest-related)

**OpenStates staging tables** (`openstates_people_*`):

- `service_role`: full access (ALL).
- Some tables also have `Authenticated full access` (e.g. `openstates_people_data`) or public read. Security advisor flags these as permissive; they are known deferred items.

**`representatives_core`:**

- `service_role`: full access.
- `authenticated`: full access (ALL).
- Public/anon: SELECT.

Ingest uses **service_role**; RLS applies to anon/authenticated.

---

## 5. View definition

`openstates_people_current_roles_v`:

- From `openstates_people_roles` joined to `openstates_people_data`.
- `is_current` = `coalesce(r.is_current, r.end_date is null or (r.end_date::date >= current_date)` (or equivalent).
- No `WHERE`; filtering is done in the merge (`WHERE is_current`).

---

## 6. Options and recommendations

1. **Stage-only-current (optional)**  
   In `stage-openstates`, filter people to those with ≥1 current role before upserting. Fewer rows in staging → faster stage and merge. Trade-off: no staging “audit history” for retired reps.

2. **Deactivate legacy reps**  
   **Done.** `deactivate_non_current_openstates_reps()` runs after merge (see `openstates:merge` script). Migration `20260127120000_deactivate_non_current_reps.sql`. Reps with `openstates_id` not in the current set get `is_active = false`; web app filters `is_active = true`.

3. **Statement timeout**  
   Apply `20260126120000_sync_merge_statement_timeout.sql` (e.g. via `supabase db push` or SQL Editor) so `sync_representatives_from_openstates` and `refresh_divisions_from_openstates` use higher timeouts and avoid “canceling statement due to statement timeout.”

4. **Re-run merge only**  
   After applying the timeout migration, run `npm run openstates:merge` only (no need to re-run stage).

---

## 7. MCP checks used

- `list_tables` (schemas: `public`) — confirm `openstates_*`, `representative_*`, `representatives_core`.
- `execute_sql`:
  - Row counts: `openstates_people_data`, `openstates_people_roles`, `representatives_core`, `openstates_people_current_roles_v` (all vs `is_current`), distinct current people.
  - Routines: `sync_representatives_from_openstates`, `refresh_divisions_from_openstates`, etc.
  - RLS: `pg_policies` for `openstates_*` and `representatives_core`.
  - View: `pg_get_viewdef('openstates_people_current_roles_v')`.
  - Function config: `pg_proc.proconfig` for sync/refresh.
- `get_advisors` (type: `security`) — RLS findings; ingest uses service_role.

---

## References

- [CURRENT_STATUS](./CURRENT_STATUS.md) — ingest status, merge timeout fix, monitoring.
- [supabase-mcp-verification](./supabase-mcp-verification.md) — MCP checks for civics schema/RPC.
- [openstates-yaml-coverage](./openstates-yaml-coverage.md) — staging vs merge, “current” filtering.

# Ingestion Flow Strategy

This plan defines how the civics backend should orchestrate OpenStates YAML intake alongside state and federal API pipelines. Treat it as the source of truth for sequencing, dedupe rules, and future API onboarding.

---

## 1. Guiding principles

- **Standalone operation**: Each flow (OpenStates, state APIs, federal APIs) must run independently without relying on pre-existing Supabase rows.
- **Canonical-first**: Normalize into `CanonicalRepresentative` objects, then enrich. Supabase serves as persistence, not the primary source of truth.
- **Deterministic dedupe**: Use canonical IDs, crosswalk tables, and scheme-specific identifiers to prevent duplicates.
- **Current-only**: Only active representatives land in canonical tables; staging retains full history for audits.
- **Minimise redundant API calls**: If a data point exists in YAML/staging, skip or narrow downstream fetches.

---

## 2. Flow overview

> **Terminology note**  
> Throughout this plan we refer to the “OpenStates people” ingest (the offline YAML archive
> that lives in `data/openstates-people/`) and the “OpenStates API” enrichment (live HTTP
> requests via `src/clients/openstates.ts`). The YAML flow establishes the canonical
> baseline, while the API flow layers on near-real-time activity or committee data.

### 2.1 OpenStates YAML flow (state/local baseline)

1. `scripts/openstates/stage-openstates.ts`
   - Load raw YAML files (state, executive, municipalities, retired optionally).
   - Populate staging tables (`openstates_people_*`).
2. `sync_representatives_from_openstates()`
   - Merge current roles into `representatives_core`.
   - Populate contacts, social, photos, committees, data sources, data quality.
   - Upsert crosswalk identifiers from YAML.
3. `sync_activity_for_representatives` (post-merge, invoked by `run-openstates-merge.ts` unless `SKIP_ACTIVITY_SYNC=1`)
   - Refresh OpenStates bill activity (unless `SKIP_ACTIVITY_SYNC=1`).

**Outputs**
- `CanonicalRepresentative` objects built by `collectActiveRepresentatives`.
- Supabase rows for active state/local reps (contacts, social, provenance, quality).

**Notes**
- YAML is primary for municipal/state-level metadata (contacts, socials, committees).
- Data gaps (e.g., biographies, alias names) flagged in coverage audit for promotion.

### 2.2 State API enrichment flow (OpenStates API / future partners)

1. Collect state reps via YAML canonical builder (`collectActiveRepresentatives`).
2. For each rep:
   - Check `representative_data_sources` to see if relevant fields (e.g., latest bills, committee assignments) are already sourced from YAML.
   - Call OpenStates API only for needed attributes (e.g., real-time bill activity, committee updates, floor votes) with state filters.
3. Enrichment result now surfaces:
   - Contact snapshot (`emails`, `phones`, `links`) direct from canonical.
   - Biography, aliases, offices, extras, and the complete identifier map so downstream views can render without hitting Supabase.
   - Social handle lookup keyed by platform.
4. Persist via dedicated SQL merge or orchestrator (future work):
   - Extend `representative_activity`, `representative_committees`, `representative_contacts` with API-only fields.
   - Record provenance (`source_type = 'openstates_api'`).

**Goals**
- Replace `state:sync:*` scripts with API-backed SQL merges once coverage is complete.
- Rate-limit aware; support `--states`, `--limit`, `--dry-run`.

### 2.3 Federal API enrichment flow (Congress, FEC, GovInfo, others)

1. Fetch canonical reps from Supabase (`fetchFederalRepresentatives`) or extend `collectActiveRepresentatives` to include federal sources.
2. Enrich using:
   - Congress.gov/GovInfo (identifiers, committee assignments, votes).
   - FEC (finance totals, contributors, filings).
   - GovTrack/House/Senate APIs (bill sponsorship, statements).
3. Enrichment result now exposes:
   - Contact snapshot, social lookup, biography, aliases, canonical identifiers (including Google Civic & Congress.gov) and extras in addition to finance metrics.
   - FEC finance summaries (cycle, totals, contributors) with source provenance.
4. Persist via existing scripts (`enrich:finance`, `enrich:congress-ids`) and future SQL merges.
4. Update crosswalk entries with new identifiers (`bioguide`, `govtrack`, `fec`, etc.).

**Key constraints**
- Avoid assuming FEC IDs exist; crosswalk may need updating before API call.
- Use YAML data for fallback (e.g., contact info) when Supabase lacks entries.
- Document API quotas and add retry/backoff.

---

## 3. Dedupe & canonical ID strategy

- Core key: `canonical-<openstates_id>` for YAML-sourced reps. Plan to upgrade to scheme-based canonical IDs (e.g., `openstates:<id>`) consistently.
- `representative_crosswalk_enhanced` stores (canonical_id, source_system, source_id) with confidence scores.
- Deduping rules:
  - Always prefer official identifiers (bioguide, fec, congress.gov) when present.
  - For local/state reps, use OpenStates ID as golden source.
  - Shared contacts (hotlines) inserted once per representative; uniqueness enforced via `(representative_id, contact_type, value)`.
  - Crosswalk audit (`report-duplicates`) runs post-ingest; fix conflicts before further enrichments.
- `collectActiveRepresentatives` merges Supabase row data into canonical objects when available, enriching contact/social info prior to running additional flows.

---

## 4. Decision matrix for API calls

| Data class | YAML coverage | Additional API(s) | Trigger condition |
| --- | --- | --- | --- |
| Basic contacts/social | ✅ (OpenStates People) | None unless fallback needed | Use YAML; skip API unless missing. |
| Committee assignments | Partial (non-legislative) | OpenStates API, Congress.gov | Call API when committees absent or outdated. |
| Bill activity (state) | ✅ via `sync_activity_for_representatives` | OpenStates API (live updates) | API only for near-real-time refresh. |
| Bill activity (federal) | ❌ | Congress.gov, GovTrack | Always API. |
| Finance totals | ❌ | FEC API | Trigger for reps with FEC IDs; skip when absent. |
| Biographical details (bio, birth date) | YAML contains; not yet canonical | Validate once promoted to canonical; optionally cross-check with official sources. |
| Photo assets | ✅ | Congress.gov official portraits | Override if higher quality available. |
| Alias names | YAML `other_names` | Additional stage when canonical supports it | Use YAML once canonical updated. |

Use this matrix to guard enrichers: check canonical object first, then conditionally call APIs.

---

## 5. Documentation & operational updates

Once implementation lands:

- Update `services/civics-backend/README.md` command reference (describe three flows and when to run each).
- Expand `docs/civics-backend-operations.md` “Key workflows” section with new state/federal API steps.
- Refresh `docs/civics-backend-quickstart.md` to clarify which scripts handle baseline YAML vs optional enrichments.
- Append verification steps from `persistence-verification-plan.md` to the QA checklist in `docs/civics-ingest-checklist.md`.
- Note crosswalk/dedupe expectations in `docs/civics-ingest-supabase-plan.md`.
- Summarize current state in `docs/CURRENT_STATUS.md` once flows are production-ready.

---

## 6. Implementation roadmap linkage

See `services/civics-backend/ROADMAP.md` for phase-level tasks. High-level mapping:

| Roadmap phase | Related section in this doc |
| --- | --- |
| Phase 1 (coverage) | Section 2.1 scopes the YAML baseline. |
| Phase 2 (persistence) | Section 2 + 4 (call gating) provide context for verification. |
| Phase 3 (flow hardening) | Sections 2.1–2.3, 3, and 4 outline required work. |
| Phase 4 (implementation) | Promote fields + update enrichers per Section 4. |
| Phase 5 (documentation) | Section 5 enumerates doc touch points. |

Update both documents as phases close to keep teams aligned on remaining work.



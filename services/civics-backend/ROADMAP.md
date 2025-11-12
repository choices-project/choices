# Civics Backend Ingest Roadmap

This plan tracks the remaining work to make the OpenStates → Supabase ingest airtight and ready for additional API sources. Update checklist items and add links to PRs as they land.

---

## Phase 1 — Dataset Coverage Audit

- [x] **Inventory OpenStates YAML fields**  
  Coverage matrix captured in `docs/openstates-yaml-coverage.md` (updated Nov 2025).

- [x] **Assess canonical object gaps**  
  `CanonicalRepresentative` expanded to include biographies, aliases, extras, division IDs, office metadata, social merge, and a regression test (`src/__tests__/openstates-people.test.ts`).

- [x] **Review staging schema**  
  Staging utilities now store `other_identifiers` and dedupe schemes; truncation limits recorded in the coverage doc.

Deliverables: ✅ coverage report + TODO follow-ups logged inline where future work remains (e.g., optional staging of raw payload hashes).

---

## Phase 2 — Persistence Verification

- [x] **Trace merge flow**  
  `docs/persistence-verification-plan.md` describes staging → SQL merge → downstream tables and the verification recipe.

- [ ] **Validation harness**  
  - [x] Canonical regression test in `src/__tests__`.  
  - [ ] Staging/merge fixtures (mock Supabase) TODO.  
  - [ ] CLI smoke-test template for live Supabase (guard env vars).

- [x] **Current-only guarantee**  
  Documented in the verification plan; SQL function already filters `is_current = true`.

Deliverables: docs updated; remaining work is to build fixture-driven staging tests and live smoke-test harness.

---

## Phase 3 — Ingestion Flow Hardening

- [x] **Define three independent flows**  
  Detailed in `docs/ingestion-flow-strategy.md`; outlines OpenStates YAML baseline + state/federal enrichment responsibilities.

- [ ] **Crosswalk + dedupe strategy**  
  Parser + Supabase adapters now capture “other” identifiers; still need automated duplicate auditing + quality scoring updates.

- [ ] **API call optimisation matrix**  
  Preliminary decision matrix captured in `ingestion-flow-strategy.md`; next step is encoding the logic in enrichers and CLI filters.

Deliverables: docs refreshed; follow-up items remain for crosswalk automation and API throttling heuristics.

---

## Phase 4 — Implementation Pass

- [x] Patch canonical parser/stager with audited gaps (dates, biographies, extras, alt names, contact metadata).  
- [x] Extend enrichers (`enrich/state`, `enrich/federal`) + preview tooling to surface the new data.  
- [x] Update Supabase adapters/crosswalk to handle `identifiers.other` and enriched roles.  
- [ ] Regenerate Supabase types (`npx supabase gen types typescript …`) after next schema change (not required yet).

Deliverables: implementation merged; outstanding item is regenerating shared types when table updates land.

---

## Phase 5 — Documentation & Handoff

- [x] Refresh operator docs (`docs/civics-backend-quickstart.md`, operations guide) with preview/enrichment guidance.  
- [x] Verification recipe lives in `docs/persistence-verification-plan.md`.  
- [ ] Summarise ingest progress in `docs/CURRENT_STATUS.md` & backlog outstanding work.  
- [ ] Archive/deprecate legacy scripts once SQL-first replacements are ubiquitous.

Deliverables: docs largely refreshed; need status roll-up + archival sweep.

---

## Phase 6 — Future Enhancements (Backlog)

- [ ] Automate ingest smoke test in CI (fixture-driven).  
- [ ] Add metrics/logging (processed counts, error surfacing) to scripts.  
- [ ] Explore storing raw YAML snapshots or hashes for audit in `representative_data_sources`.  
- [ ] Prep scaffolding for next APIs (Congress committees, state bill activity) once baseline is locked.

Update this roadmap as tasks complete or priorities change. Use pull request references (`PR #123`) next to checklist items when closing them out.



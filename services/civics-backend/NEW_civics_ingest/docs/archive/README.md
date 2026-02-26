# Civics Ingest — Archived Documentation

**Historical only.** Do not use for current operations. For up-to-date info, use the parent `docs/` folder:

- [GETTING_STARTED.md](../GETTING_STARTED.md) — 3-step quick start
- [README.md](../README.md) — Full command reference
- [OPERATOR_RUNBOOK.md](../OPERATOR_RUNBOOK.md) — Operations, troubleshooting, recovery

---

## Archive Structure

| Directory | Contents |
|-----------|----------|
| `superseded/` | Old guides (GETTING_STARTED, QUICK_REFERENCE, INGEST_FLOWS, etc.) — replaced by current docs |
| `implementation/` | Phase 1–3 implementation notes, FEC lookup fixes — historical |
| `investigation/` | Audit findings, data gaps analysis — historical |
| `schema/` | Schema verification notes — superseded by DATABASE_SCHEMA.md |
| `migrations/` | Migration status — complete |

## Key Replacements

| Archived | Current |
|----------|---------|
| UPDATE_STRATEGY.md, UPDATE_VERIFICATION.md | tools:update:quality-scores, tools:smoke-test, tools:metrics:dashboard |
| PHASE1/2/3_IMPLEMENTATION.md | OPERATOR_RUNBOOK.md, REMOVED_SCRIPTS.md |
| GETTING_STARTED.md (archive) | GETTING_STARTED.md (parent) |
| QUICK_REFERENCE.md | OPERATOR_RUNBOOK.md § Key Commands |
| INGEST_FLOWS.md, SERVICE_STRUCTURE.md | README.md § Data Flow, Directory Layout |

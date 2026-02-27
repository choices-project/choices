# Docs Manifest

This file defines the canonical documentation set under `docs/`. Everything else should be treated as supplemental and can be archived when it becomes stale.

## Canonical docs

### Project overview & onboarding
- `README.md`
- `GETTING_STARTED.md` — Quick start + day-to-day runbook (merged from DEVELOPMENT)
- `CODEBASE_NAVIGATION.md` — Find code + canonical utilities (merged from UTILS_GUIDE)
- `ARCHITECTURE.md`
- `VISION.md`
- `AGENT_SETUP.md` — Agent Skills + Supabase MCP (Cursor)

### Current status & roadmap
- `CURRENT_STATUS.md`
- `ROADMAP_SINGLE_SOURCE.md` — Single source of truth for roadmap, next steps, and verification
- `FEATURE_STATUS.md`
- `FEATURE_FLAGS_AUDIT.md` — Feature flags audit, usage map, and setup guide for new developers

### Testing & QA
- `TESTING.md` — Unit, E2E, axe, production testing (merged from PRODUCTION_TESTING)
- `TROUBLESHOOTING.md`

### Deployment & ops
- `DEPLOYMENT.md`
- `ENVIRONMENT_VARIABLES.md`
- `SECURITY.md`

### Data & API
- `DATABASE_SCHEMA.md`
- `WEBAUTHN_DESIGN.md` — WebAuthn/passkey architecture, trust tier, proof-of-personhood
- `RLS_API_ALIGNMENT.md` — API ↔ RLS alignment, client usage (admin vs server)
- `API/README.md`
- `API/response-guide.md` — successResponse pattern, error handling, client usage
- `API/contracts.md`
- `API/civic-actions.md`

### State management & architecture
- `STATE_MANAGEMENT.md`
- `COMPONENT_LIBRARY.md` — Reusable components, props, usage patterns

### Compliance & policy
- `PRIVACY_POLICY.md`

### Civics ingest (services)
- `services/civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md` — 3-step quick start
- `services/civics-backend/NEW_civics_ingest/docs/README.md` — Full command reference
- `services/civics-backend/NEW_civics_ingest/docs/OPERATOR_RUNBOOK.md` — Operations, troubleshooting, recovery
- `services/civics-backend/README.md` — Civics backend overview
- `services/AGENT_ONBOARDING.md` — Agent onboarding for ingest
- Archived: `docs/archive/reference/civics/` — older operations guides

## Supplemental docs (archive when stale)
- Planning, summaries, and completion reports (e.g., `*_COMPLETE.md`, `*_SUMMARY.md`, `*_PRIORITY.md`) — see `docs/archive/`
- One-off implementation notes
- Guides not referenced by the canonical set

Archived 2026-02: `DEVELOPMENT`, `PRODUCTION_TESTING`, `INTERNATIONALIZATION`, `UTILS_GUIDE`, `STATE_MANAGEMENT_ARCHITECTURE` → `docs/archive/2026-02-docs-consolidation/`

Archived 2026-01-24: `AGENT_IMPLEMENTATION_*`, `AGENT_SKILLS_MCP_REMAINING_WORK`, `APPLY_SECURITY_FIX`, `SECURITY_ADVISOR_*` → `docs/archive/2026-01-24-docs-consolidation/`

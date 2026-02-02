# Documentation Organization

**Last Updated:** 2026-01-27

## Structure

```
docs/
├── README.md                          # Main documentation index
├── GETTING_STARTED.md                 # 🚀 Start here - Complete onboarding guide
├── QUICK_REFERENCE.md                 # Essential commands and concepts
├── INGEST_FLOWS.md                    # Data ingestion flows (⚠️ YAML vs API distinction)
├── DATABASE_SCHEMA.md                 # Complete schema reference (verified via Supabase MCP)
├── SERVICE_STRUCTURE.md               # Service architecture and organization
├── ROADMAP.md                         # Development roadmap
├── REMAINING_WORK.md                  # Prioritized remaining work
│
├── CLIENT_*.md                        # API client documentation
│   ├── CLIENT_CONGRESS.md
│   ├── CLIENT_FEC.md
│   ├── CLIENT_GOVINFO.md
│   ├── CLIENT_GOOGLE_CIVIC.md
│   └── CLIENT_OPENSTATES.md          # ⚠️ API only, see INGEST_FLOWS.md for YAML
│
├── OPENSTATES_SYNC_GUIDE.md          # Comprehensive sync guide (⚠️ YAML + API)
├── openstates-yaml-coverage.md        # YAML data coverage
├── GOVINFO_MCP.md                    # GovInfo MCP server
│
├── IMPLEMENTATION_HISTORY.md          # Phase 1-3 implementation history (consolidated)
├── FEC_ID_LOOKUP.md                   # FEC ID lookup system (consolidated)
│
├── SCHEMA_*.md                        # Database documentation
│   ├── SCHEMA_OPTIMIZATIONS.md
│   ├── DATABASE_SCHEMA.md             # Complete schema reference
│   └── MIGRATION_ORDER.md
│
└── archive/                           # Archived documentation
    ├── README.md                      # Archive explanation
    ├── UPDATE_STRATEGY.md             # Superseded by Phase 1 tools
    ├── UPDATE_VERIFICATION.md         # Superseded by Phase 2 tools
    └── investigation/                 # Investigation and analysis docs
        ├── README.md
        ├── DATA_GAPS_ANALYSIS.md
        ├── INGESTION_STARTED.md
        ├── INGESTION_STATUS.md
        ├── STATUS_UPDATE.md
        ├── INVESTIGATION_FINDINGS.md
        ├── INVESTIGATION_SUMMARY.md
        └── AUDIT_OUTDATED_FILES.md
```

## Key Distinctions

### ⚠️ OpenStates People (YAML) vs OpenStates API

**Always clearly distinguish:**

- **OpenStates People (YAML) 📁**
  - Static snapshot from git submodule
  - No API calls, no rate limits
  - Baseline data: contacts, photos, social, committees
  - Scripts: `openstates:ingest`, `openstates:sync:contacts`

- **OpenStates API 🌐**
  - Live REST API
  - Rate limited (10,000/day)
  - Live data: bill activity, sponsorships, votes
  - Scripts: `openstates:sync:activity`

**Documents that clarify this:**
- `INGEST_FLOWS.md` - Main distinction explanation
- `CLIENT_OPENSTATES.md` - API client only (notes YAML separately)
- `OPENSTATES_SYNC_GUIDE.md` - Covers both (clearly marked)

## Documentation Status

### ✅ Current & Active

**Core Documentation:**
- `GETTING_STARTED.md` - Complete onboarding guide (new)
- `QUICK_REFERENCE.md` - Essential commands (new)
- `DATABASE_SCHEMA.md` - Complete schema reference (new, verified via Supabase MCP)
- `SERVICE_STRUCTURE.md` - Service architecture (new)
- `INGEST_FLOWS.md` - Flow architecture (enhanced with YAML/API distinction)

**Reference Documentation:**
- All `CLIENT_*.md` files - API client documentation
- `ROADMAP.md` - Development roadmap
- `REMAINING_WORK.md` - Prioritized work
- `IMPLEMENTATION_HISTORY.md` - Phase 1-3 implementation history (consolidated)
- `FEC_ID_LOOKUP.md` - FEC lookup system (consolidated)
- `SCHEMA_*.md` - Database documentation
- `OPENSTATES_SYNC_GUIDE.md` - Sync guide

### 📦 Archived

**Legacy Documentation:**
- `archive/UPDATE_STRATEGY.md` - Superseded by Phase 1 tools
- `archive/UPDATE_VERIFICATION.md` - Superseded by Phase 2 tools

**Implementation History:**
- `archive/implementation/*` - Phase 1-3 implementation docs (consolidated into `IMPLEMENTATION_HISTORY.md`)
- `archive/implementation/FEC_ID_LOOKUP_*.md` - FEC docs (consolidated into `FEC_ID_LOOKUP.md`)

**Schema Documentation:**
- `archive/schema/SCHEMA_VERIFICATION.md` - Historical verification (superseded by `DATABASE_SCHEMA.md`)

**Migration Documentation:**
- `archive/migrations/STATUS_MIGRATION_GUIDE.md` - Status migration guide (migration complete)

**Investigation Documents:**
- `archive/investigation/*` - Investigation and analysis docs from service audit
  - All issues resolved and documented in main docs
  - Kept for historical reference

## Quick Reference

**Starting point:** `README.md` - Comprehensive documentation index

**For New Contributors:**
1. `GETTING_STARTED.md` - Complete onboarding
2. `QUICK_REFERENCE.md` - Essential commands
3. `INGEST_FLOWS.md` - Understand data flows
4. `DATABASE_SCHEMA.md` - Understand database

**For OpenStates:**
- YAML data: `INGEST_FLOWS.md` → OpenStates People section
- API usage: `CLIENT_OPENSTATES.md` + `OPENSTATES_SYNC_GUIDE.md`

**For Database:**
- Complete schema: `DATABASE_SCHEMA.md` (verified via Supabase MCP)
- Optimizations: `SCHEMA_OPTIMIZATIONS.md`
- Migrations: `MIGRATION_ORDER.md`
- Status: `STATUS_MIGRATION_GUIDE.md`

**For Implementation History:**
- `IMPLEMENTATION_HISTORY.md` - Consolidated Phase 1-3 history
- `FEC_ID_LOOKUP.md` - FEC lookup system

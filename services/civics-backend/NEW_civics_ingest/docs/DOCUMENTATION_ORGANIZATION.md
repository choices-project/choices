# Documentation Organization

**Last Updated:** 2026-01-27

## Structure

```
docs/
├── README.md                          # Main documentation index
├── INGEST_FLOWS.md                    # Data ingestion flows (⚠️ YAML vs API distinction)
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
├── PHASE*_IMPLEMENTATION.md           # Implementation guides
│   ├── PHASE1_IMPLEMENTATION.md       # Data quality tools
│   ├── PHASE2_IMPLEMENTATION.md       # Crosswalk verification
│   └── PHASE3_IMPLEMENTATION.md       # Resume & metrics
│
├── SCHEMA_*.md                        # Database documentation
│   ├── SCHEMA_OPTIMIZATIONS.md
│   ├── SCHEMA_VERIFICATION.md
│   ├── MIGRATION_ORDER.md
│   └── STATUS_MIGRATION_GUIDE.md
│
├── FEC_ID_LOOKUP_*.md                 # FEC improvements
│   ├── FEC_ID_LOOKUP_IMPROVEMENTS.md
│   └── FEC_ID_LOOKUP_FIX_SUMMARY.md
│
└── archive/                           # Archived documentation
    ├── README.md                      # Archive explanation
    ├── UPDATE_STRATEGY.md             # Superseded by Phase 1 tools
    └── UPDATE_VERIFICATION.md         # Superseded by Phase 2 tools
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
- All `CLIENT_*.md` files - API client documentation
- `INGEST_FLOWS.md` - Flow architecture (updated with YAML/API distinction)
- `ROADMAP.md` - Development roadmap
- `REMAINING_WORK.md` - Prioritized work (updated with Phase 3 completion)
- `PHASE*_IMPLEMENTATION.md` - Implementation guides
- `SCHEMA_*.md` - Database documentation
- `OPENSTATES_SYNC_GUIDE.md` - Sync guide (updated with YAML/API distinction)

### 📦 Archived
- `UPDATE_STRATEGY.md` - Superseded by Phase 1 tools
- `UPDATE_VERIFICATION.md` - Superseded by Phase 2 tools

## Quick Reference

**Starting point:** `README.md` - Comprehensive documentation index

**For OpenStates:**
- YAML data: `INGEST_FLOWS.md` → OpenStates People section
- API usage: `CLIENT_OPENSTATES.md` + `OPENSTATES_SYNC_GUIDE.md`

**For tools:**
- Phase 1: `PHASE1_IMPLEMENTATION.md`
- Phase 2: `PHASE2_IMPLEMENTATION.md`
- Phase 3: `PHASE3_IMPLEMENTATION.md`

**For database:**
- Schema: `SCHEMA_OPTIMIZATIONS.md`
- Migrations: `MIGRATION_ORDER.md`
- Status: `STATUS_MIGRATION_GUIDE.md`

# Documentation Consolidation Plan

**Date**: November 3, 2025, 23:50  
**Problem**: Documentation sprawl across 3 locations causing confusion  
**Goal**: Single canonical documentation location with clear purpose

---

## 📊 Current State (CHAOS)

### Documentation Locations
- **/docs** (project root): 62 files (~8,000 lines)
- **/web/docs**: 68 files (~11,000 lines)  
- **/scratch**: 19 files (~700 lines)
- **Total**: 149 MD files, ~19,700 lines

### Problems
1. ❌ Duplicate information across locations
2. ❌ Outdated docs mixed with current
3. ❌ Agents don't know where to look
4. ❌ No clear hierarchy
5. ❌ Historical docs look like current status

---

## 🎯 Solution: Canonical Structure

### CANONICAL LOCATION: `/docs` (Project Root)

**Rationale**:
- ✅ Standard practice (GitHub, GitLab expect docs at root)
- ✅ More visible to new developers
- ✅ Separate from implementation code
- ✅ Easier for documentation tools to find
- ✅ Not tied to specific app directory (web/)

---

## 📋 CORE DOCUMENTATION (Keep Current)

### Essential Docs (10 files max)

**1. README.md** - Project Overview
- What is Choices platform
- Quick start guide
- Key features
- Links to other docs

**2. ARCHITECTURE.md** - System Design
- High-level architecture
- Technology stack
- Design decisions
- Component relationships

**3. DATABASE_SCHEMA.md** - Database Design  
- Current schema (64 tables)
- Recent migrations (November 2025)
- Type management pattern
- How to regenerate types

**4. DEVELOPMENT.md** - Developer Guide
- Setup instructions
- Environment variables
- Local development
- Testing strategy

**5. API_REFERENCE.md** - API Documentation
- Endpoint list
- Authentication
- Rate limiting
- Examples

**6. DEPLOYMENT.md** - Production Deployment
- Deployment checklist
- Environment setup
- Monitoring
- Rollback procedures

**7. FEATURES.md** - Feature Status
- Implemented features
- Partially implemented
- Quarantined (future)
- Known limitations

**8. CURRENT_STATUS.md** - Where We Are Now
- Error count
- Recent changes
- Active work
- Next steps

**9. SECURITY.md** - Security Practices
- Authentication (WebAuthn, trust tiers)
- Privacy (GDPR, encryption)
- Rate limiting
- Admin access

**10. CONTRIBUTING.md** - Contribution Guide
- Code standards
- Lint rules
- Git workflow
- Review process

---

## 🗂️ Subdirectories (Organized Details)

### `/docs/features/` - Feature Documentation
- One file per major feature
- Implementation status
- API endpoints
- UI components

### `/docs/guides/` - How-To Guides
- Specific tasks
- Step-by-step
- Examples

### `/docs/decisions/` - Architecture Decision Records (ADRs)
- Why we chose X over Y
- Historical context
- Trade-offs

### `/docs/archive/` - Historical Documentation
- Outdated but preserved
- Dated clearly
- Not for current reference

---

## 🔄 CONSOLIDATION ACTIONS

### From `/web/docs` → `/docs`

**MOVE TO /docs (Current & Essential)**:
- `DATABASE_SCHEMA_AUDIT_CORRECTED.md` → `/docs/DATABASE_SCHEMA.md` (merge/update)
- `MIGRATION_COMPLETE_STATUS.md` → merge into `/docs/DATABASE_SCHEMA.md`
- `LINT_FIX_STANDARDS.md` → `/docs/CONTRIBUTING.md` (merge)
- `PROJECT_TIE_OFF_PLAN.md` → `/docs/CURRENT_STATUS.md` (current state)
- `USER_DIRECTIVES.md` → `/docs/decisions/quality-first-approach.md`
- `api/` subdirectory → `/docs/api/` (keep structure)

**ARCHIVE** (Completed work):
- `IMPLEMENTATION_COMPLETE_REPORT.md` → archive (historical)
- `PHASE_1_COMPLETE_SUMMARY.md` → archive (historical)
- `PHASE_1_FIX_PLAN.md` → archive (historical)
- `ADMIN_DASHBOARD_AUDIT.md` → archive (historical)
- `QUALITY_AUDIT_SUMMARY.md` → archive (outdated)
- `WHAT_IM_DOING_WRONG.md` → delete (self-reflection, not needed)
- `IMPLEMENTATION_METHODOLOGY.md` → delete (redundant with CONTRIBUTING)
- `QUALITY_FIRST_APPROACH.md` → merge into CONTRIBUTING
- `PARTIALLY_IMPLEMENTED_FEATURES.md` → merge into FEATURES.md

**DELETE** (Redundant):
- `DATABASE_SCHEMA_AUDIT.md` (superseded by CORRECTED version)
- `SCHEMA_DESIGN_PROPOSAL.md` (implemented, now historical)
- `SCHEMA_VERIFICATION_COMPLETE.md` (implemented, now historical)
- `POST_MIGRATION_CODE_UPDATES.md` (applied, now historical)
- `TYPE_CONSOLIDATION_PLAN.md` (applied, documented in DATABASE_SCHEMA)

### From `/docs` (Root)

**KEEP & UPDATE**:
- `core/` directory - System architecture docs (comprehensive)
- `MASTER_DOCUMENTATION.md` - Update as main index
- `CONTRIBUTING.md` - Update with current standards
- `ENVIRONMENT_VARIABLES.md` - Current
- `DEPLOYMENT_READINESS_ASSESSMENT.md` - Rename to `DEPLOYMENT.md`

**ARCHIVE** (Historical):
- `CIVICS_*` (multiple civics audit reports) → `/docs/archive/civics-implementation/`
- `DISABLED_FEATURES_*` (3 versions) → keep latest only
- `DATABASE_VERIFICATION_*` (2 versions) → archive (superseded)
- `COMPREHENSIVE_TEST_AUDIT_REPORT.md` → archive

**CONSOLIDATE** (Duplicate topics):
- `implementation/features/` (15 files) - Good structure, keep
- `future-features/` (10 files) - Move to `features/` with status tags

### From `/scratch`

**MOVE TO /docs** (If still relevant):
- `CURRENT_STATE_NOVEMBER_2025.md` → `/docs/CURRENT_STATUS.md`
- `NEXT_STEPS_PRIORITIZED.md` → merge into `/docs/CURRENT_STATUS.md`

**KEEP IN SCRATCH** (Active WIP):
- Nothing currently - clear it out

**ARCHIVE** (Completed):
- `00_*` numbered files → archive (outdated action plans)
- `archive/november_2025/` → already archived, good
- All other files → archive (completed work)

---

## 📁 FINAL STRUCTURE

```
/Users/alaughingkitsune/src/Choices/
├── docs/                           ← CANONICAL DOCUMENTATION
│   ├── README.md                   ← Start here
│   ├── ARCHITECTURE.md             ← System design
│   ├── DATABASE_SCHEMA.md          ← Database + types
│   ├── DEVELOPMENT.md              ← Developer setup
│   ├── API_REFERENCE.md            ← API endpoints
│   ├── DEPLOYMENT.md               ← Production guide
│   ├── FEATURES.md                 ← Feature status
│   ├── CURRENT_STATUS.md           ← Where we are now
│   ├── SECURITY.md                 ← Security practices
│   ├── CONTRIBUTING.md             ← Code standards
│   │
│   ├── features/                   ← Feature-specific docs
│   │   ├── polling.md
│   │   ├── analytics.md
│   │   ├── civic-engagement.md
│   │   ├── candidate-platform.md
│   │   └── [future]/               ← Future features clearly marked
│   │       ├── zero-knowledge-proofs.md
│   │       └── social-sharing.md
│   │
│   ├── guides/                     ← How-to guides
│   │   ├── getting-started.md
│   │   ├── creating-polls.md
│   │   └── admin-tasks.md
│   │
│   ├── decisions/                  ← Architecture decisions
│   │   ├── zustand-for-state.md
│   │   ├── trust-tier-system.md
│   │   └── quality-first-approach.md
│   │
│   └── archive/                    ← Historical docs
│       ├── 2025-11/                ← Dated by month
│       │   ├── migration-reports/
│       │   ├── audit-reports/
│       │   └── implementation-logs/
│       └── README.md               ← Archive index
│
├── scratch/                        ← WORK IN PROGRESS ONLY
│   ├── README.md                   ← "This is temporary workspace"
│   └── [current-work]/             ← Active planning docs only
│
└── web/
    ├── README.md                   ← App-specific readme
    └── docs/ → REMOVED             ← Consolidated to /docs
```

---

## 🔧 Consolidation Script

```bash
#!/bin/bash
# Consolidate documentation to canonical location

cd /Users/alaughingkitsune/src/Choices

# Create structure
mkdir -p docs/{features,guides,decisions,archive/2025-11/{migrations,audits,implementations}}

# Archive web/docs historical content
mv web/docs/IMPLEMENTATION_COMPLETE_REPORT.md docs/archive/2025-11/implementations/
mv web/docs/PHASE_1_* docs/archive/2025-11/implementations/
mv web/docs/ADMIN_DASHBOARD_AUDIT.md docs/archive/2025-11/audits/
mv web/docs/DATABASE_SCHEMA_AUDIT.md docs/archive/2025-11/audits/
mv web/docs/SCHEMA_*.md docs/archive/2025-11/migrations/

# Move current docs from web/docs to docs
mv web/docs/LINT_FIX_STANDARDS.md docs/CONTRIBUTING.md  # Merge
mv web/docs/USER_DIRECTIVES.md docs/decisions/quality-first-approach.md
mv web/docs/api/ docs/api/

# Archive scratch completed work
mv scratch/00_* scratch/archive/
mv scratch/*_ANALYSIS_*.md scratch/archive/
mv scratch/E2E_* scratch/archive/

# Delete redundant
rm web/docs/WHAT_IM_DOING_WRONG.md
rm web/docs/IMPLEMENTATION_METHODOLOGY.md

# Remove empty web/docs
rmdir web/docs 2>/dev/null || echo "web/docs not empty yet"
```

---

## ✅ Success Criteria

After consolidation:
- ✅ Only 1 docs location: `/docs`
- ✅ < 30 current documentation files
- ✅ Clear README that explains structure
- ✅ All historical docs archived by date
- ✅ Scratch only has active WIP (< 5 files)
- ✅ No duplicates
- ✅ Every doc has clear purpose

---

**Proceed with consolidation?**


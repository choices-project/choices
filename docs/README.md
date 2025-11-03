# Choices Platform Documentation

**Last Updated**: November 3, 2025  
**Documentation Location**: This directory (`/docs`) is the CANONICAL source

---

## 🚀 Quick Start

**New to the project?** Start here:
1. Read `CURRENT_STATUS.md` - Where we are now
2. Read `ARCHITECTURE.md` - System overview (in `core/`)
3. Read `DEVELOPMENT.md` - Setup guide (in `DEVELOPER_GUIDE_SUPABASE_CLIENT.md`)
4. Read `FEATURES.md` - What's implemented (see `implementation/features/`)

---

## 📚 Core Documentation

### Essential Reading
| Document | Purpose | Audience |
|----------|---------|----------|
| **CURRENT_STATUS.md** | Current state, error count, active work | Everyone |
| **DATABASE_SCHEMA.md** | Database design, 64 tables, migrations | Developers |
| **LINT_STANDARDS.md** | Code quality standards | Developers |
| **CONTRIBUTING.md** | How to contribute | Contributors |
| **ENVIRONMENT_VARIABLES.md** | Required env vars | DevOps |

### Architecture & Design
- `core/SYSTEM_ARCHITECTURE.md` - High-level system design
- `core/DATABASE_SCHEMA_COMPREHENSIVE.md` - Detailed database docs
- `core/VOTING_ENGINE_COMPREHENSIVE.md` - Trust-weighted voting
- `core/SECURITY_COMPREHENSIVE.md` - Security architecture
- `core/FEATURE_FLAGS_COMPREHENSIVE.md` - Feature flag system

### API Documentation
- `api/README.md` - API overview
- `api/API_ENDPOINT_DIFFERENCES.md` - Endpoint explanations
- `API_DOCUMENTATION_CIVICS.md` - Civics API reference

### Deployment & Operations
- `DEPLOYMENT_READINESS_ASSESSMENT.md` - Production readiness
- `PRODUCTION_READINESS_CHECKLIST.md` - Pre-deploy checklist
- `MONITORING_SETUP.md` - Observability setup
- `SUPABASE_CLI_SETUP.md` - Supabase CLI guide

---

## 🗂️ Directory Structure

```
/docs/
├── README.md                    ← You are here
├── CURRENT_STATUS.md            ← START HERE for current state
├── DATABASE_SCHEMA.md           ← Database design (64 tables)
├── LINT_STANDARDS.md            ← Code quality rules
├── CONTRIBUTING.md              ← Contribution guide
│
├── core/                        ← System architecture
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA_COMPREHENSIVE.md
│   ├── VOTING_ENGINE_COMPREHENSIVE.md
│   ├── SECURITY_COMPREHENSIVE.md
│   └── FEATURE_FLAGS_COMPREHENSIVE.md
│
├── features/                    ← Feature-specific docs
│   ├── candidate-platform/
│   ├── civics/
│   └── filing-system/
│
├── api/                         ← API documentation
│   ├── README.md
│   └── API_ENDPOINT_DIFFERENCES.md
│
├── guides/                      ← How-to guides
│   └── testing/
│
├── decisions/                   ← Architecture decisions (ADRs)
│   └── quality-first-approach.md
│
├── implementation/              ← Implementation status
│   └── features/                ← Per-feature implementation docs
│
└── archive/                     ← Historical documentation
    └── 2025-11/                 ← November 2025 work
        ├── migrations/          ← Migration planning docs
        ├── audits/              ← Audit reports
        ├── implementations/     ← Implementation logs
        └── phase1-work/         ← Phase 1 tie-off work
```

---

## 🎯 Documentation Standards

### File Naming
- **UPPERCASE_WITH_UNDERSCORES.md** - Important project-level docs
- **lowercase-with-hyphens.md** - Feature/guide docs
- **Date prefix** - For time-series docs (e.g., `2025-11-03-migration.md`)

### Content Standards
- **Status badge** at top (🟢 Active, 🟡 In Progress, 🔴 Needs Update, ⚫ Archived)
- **Last updated date** in header
- **Clear purpose statement** in first paragraph
- **Links to related docs**

### When to Archive
- ✅ Implementation complete reports
- ✅ Audit reports (after issues fixed)
- ✅ Planning docs (after plan executed)
- ✅ Outdated status reports
- ❌ DON'T archive: Core architecture, API docs, guides

---

## ⚠️ DO NOT USE

### `/scratch` - Work In Progress Only
- Temporary planning workspace
- NOT current project documentation
- See `/scratch/README.md`

### `/web/docs` - REMOVED
- All content consolidated to `/docs`
- Directory no longer exists

---

## 🔄 Keeping Docs Current

### After Schema Changes
```bash
# 1. Apply migration
supabase db push

# 2. Regenerate types
supabase gen types typescript --linked > web/utils/supabase/database.types.ts

# 3. Update DATABASE_SCHEMA.md
# Add migration notes, new tables/columns

# 4. Update CURRENT_STATUS.md
# Reflect new capabilities
```

### After Feature Implementation
```bash
# 1. Update implementation/features/[feature].md
# Mark as complete, document usage

# 2. Update CURRENT_STATUS.md
# Note completion, remove from in-progress

# 3. Archive planning docs
# Move to archive/YYYY-MM/
```

---

## 📞 Questions?

- **Current State**: See `CURRENT_STATUS.md`
- **How to develop**: See `DEVELOPER_GUIDE_SUPABASE_CLIENT.md`
- **How to deploy**: See `DEPLOYMENT_READINESS_ASSESSMENT.md`
- **Architecture decisions**: See `decisions/`
- **Feature status**: See `implementation/features/`

---

_Single source of truth for all project documentation_


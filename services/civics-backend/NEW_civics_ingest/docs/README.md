# Civics Ingest Documentation

**Last Updated:** 2026-01-27

## 📚 Documentation Index

### 🚀 Getting Started

- **[INGEST_FLOWS.md](./INGEST_FLOWS.md)** - Overview of data ingestion flows
  - ⚠️ **Important:** Distinguishes OpenStates People (YAML) vs OpenStates API
- **[ROADMAP.md](./ROADMAP.md)** - Development roadmap and status
- **[REMAINING_WORK.md](./REMAINING_WORK.md)** - Prioritized remaining work

### 🔧 API Clients

Technical documentation for each API client:

- **[CLIENT_CONGRESS.md](./CLIENT_CONGRESS.md)** - Congress.gov API client
- **[CLIENT_FEC.md](./CLIENT_FEC.md)** - FEC (Federal Election Commission) API client
- **[CLIENT_GOVINFO.md](./CLIENT_GOVINFO.md)** - GovInfo API client
- **[CLIENT_GOOGLE_CIVIC.md](./CLIENT_GOOGLE_CIVIC.md)** - Google Civic Information API client
- **[CLIENT_OPENSTATES.md](./CLIENT_OPENSTATES.md)** - OpenStates API client (🌐 live API)
  - ⚠️ **Note:** This is the **API client**. For YAML data, see `INGEST_FLOWS.md`

### 📊 Data Sources

- **[OPENSTATES_SYNC_GUIDE.md](./OPENSTATES_SYNC_GUIDE.md)** - Comprehensive sync guide
  - ⚠️ **Important:** Covers both YAML and API syncs
- **[openstates-yaml-coverage.md](./openstates-yaml-coverage.md)** - OpenStates YAML data coverage
- **[GOVINFO_MCP.md](./GOVINFO_MCP.md)** - GovInfo MCP server setup and usage

### 🛠️ Tools & Scripts

- **[PHASE1_IMPLEMENTATION.md](./PHASE1_IMPLEMENTATION.md)** - Data quality automation tools
- **[PHASE2_IMPLEMENTATION.md](./PHASE2_IMPLEMENTATION.md)** - Crosswalk verification tools
- **[PHASE3_IMPLEMENTATION.md](./PHASE3_IMPLEMENTATION.md)** - Resume capability & metrics

**Available Tools:**
- `npm run tools:update:quality-scores` - Update data quality scores
- `npm run tools:audit:duplicates` - Detect duplicate representatives
- `npm run tools:validate:term-dates` - Validate term dates
- `npm run tools:verify:crosswalk` - Verify identifier crosswalks
- `npm run tools:smoke-test` - Live data integrity checks
- `npm run tools:resume:sync` - List/resume checkpoints
- `npm run tools:metrics:dashboard` - Comprehensive metrics dashboard

### 🗄️ Database

- **[SCHEMA_OPTIMIZATIONS.md](./SCHEMA_OPTIMIZATIONS.md)** - Database schema design
- **[SCHEMA_VERIFICATION.md](./SCHEMA_VERIFICATION.md)** - Schema verification report
- **[MIGRATION_ORDER.md](./MIGRATION_ORDER.md)** - Database migration sequence
- **[STATUS_MIGRATION_GUIDE.md](./STATUS_MIGRATION_GUIDE.md)** - Status field migration process

### 📝 Reference

- **[FEC_ID_LOOKUP_IMPROVEMENTS.md](./FEC_ID_LOOKUP_IMPROVEMENTS.md)** - FEC ID lookup enhancements
- **[FEC_ID_LOOKUP_FIX_SUMMARY.md](./FEC_ID_LOOKUP_FIX_SUMMARY.md)** - FEC ID lookup fix summary

---

## ⚠️ Key Distinctions

### OpenStates People (YAML) 📁 vs OpenStates API 🌐

**OpenStates People (YAML):**
- Static snapshot from git submodule
- No API calls, no rate limits
- Provides baseline data: contacts, photos, social media, committees
- Provides `openstates_id` identifier for API calls
- Scripts: `openstates:ingest`, `openstates:sync:contacts`, etc.

**OpenStates API:**
- Live REST API (`https://v3.openstates.org`)
- Rate limited (10,000 requests/day)
- Provides live data: bill activity, sponsorships, votes
- Requires `openstates_id` from YAML data
- Scripts: `openstates:sync:activity`

**See `INGEST_FLOWS.md` for detailed explanation.**

---

## 🎯 Quick Start

### 1. Baseline Ingestion (OpenStates People YAML)

```bash
# Sync YAML submodule
npm run openstates:sync-people

# Stage and merge baseline data
npm run openstates:ingest

# Sync related data (contacts, photos, social, committees)
npm run openstates:sync:all -- --skip-activity
```

### 2. Federal Enrichment

```bash
# Enrich Congress IDs
npm run federal:enrich:congress

# Enrich FEC finance data
npm run federal:enrich:finance
```

### 3. Activity Sync (OpenStates API)

```bash
# Sync bill activity (rate limited)
npm run openstates:sync:activity

# Resume from checkpoint if interrupted
npm run openstates:sync:activity -- --resume
```

### 4. Quality Checks

```bash
# Update quality scores
npm run tools:update:quality-scores

# Verify data integrity
npm run tools:smoke-test

# View metrics
npm run tools:metrics:dashboard
```

---

## 📋 Implementation Status

### ✅ Phase 1: Data Quality & Verification (Complete)
- Data quality scoring automation
- Duplicate detection
- Term date validation

### ✅ Phase 2: Crosswalk Verification & Smoke Testing (Complete)
- Crosswalk verification
- CLI smoke test

### ✅ Phase 3: Resume Capability & Metrics (Complete)
- Checkpoint system
- Structured logging
- Resume capability (Activity Sync)
- Metrics dashboard

### ⏳ Phase 4: Optimization (In Progress)
- API optimization (Congress.gov, Google Civic)
- FEC enrichment checkpoint integration

See `REMAINING_WORK.md` for full status.

---

## 🔗 Related Documentation

- **Main README:** `../README.md`
- **Agent Setup:** `/Users/alaughingkitsune/src/Choices/docs/AGENT_SETUP.md`
- **Supabase MCP:** See `ROADMAP.md` for MCP usage guide

---

**Questions?** Check the relevant documentation file or see `ROADMAP.md` for implementation details.

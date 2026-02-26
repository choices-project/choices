# Agent Onboarding — Civics Ingest Service

**You are here:** `services/` — standalone ingest that fills Supabase with representative data. Some data has already been ingested. Your job: understand the system, catch up on current state, and continue ingesting/updating data.

---

## ⚠️ CRITICAL: OpenStates = State/Local ONLY

**OpenStates (YAML + API) contains ONLY state and local representatives. There is never and will never be any federal representative data from OpenStates.**

- Federal data comes from **Congress.gov**, **FEC**, and **GovInfo** — never from OpenStates.
- Never process federal reps with OpenStates scripts — it wastes API calls and returns nothing.
- All `openstates:sync:*` and `openstates:ingest` commands operate on state/local data only.

---

## 1. What This Is

| Item | Description |
|------|--------------|
| **Location** | `services/civics-backend/` |
| **Purpose** | Fetch from OpenStates, FEC, Congress.gov, GovInfo → write to Supabase |
| **Downstream** | Web app reads **only** from Supabase. No direct API calls from users. |
| **State** | Data already in Supabase. You continue filling gaps and updating. |

---

## 2. Read First (in order)

1. **[civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md](civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md)** — 3 steps: install, configure, ingest
2. **[civics-backend/NEW_civics_ingest/docs/README.md](civics-backend/NEW_civics_ingest/docs/README.md)** — Commands, data flow, troubleshooting
3. **[civics-backend/NEW_civics_ingest/docs/STANDALONE_SERVICE.md](civics-backend/NEW_civics_ingest/docs/STANDALONE_SERVICE.md)** — Rate limits, gap-fill, downstream mapping

---

## 3. Source Layout (where code lives)

All active source is under `civics-backend/NEW_civics_ingest/`:

```
NEW_civics_ingest/
├── clients/       # API clients (openstates, fec, congress, govinfo, supabase)
├── openstates/    # stage-openstates.ts, sync-*.ts, run-openstates-merge.ts
├── federal/       # enrich-congress-ids.ts, enrich-fec-finance.ts
├── scripts/       # ingest-run, ingest-check, gap-fill-orchestrator, run-rate-limit-aware-reingest
├── scripts/tools/ # report-gaps, metrics-dashboard, smoke-test, resume-sync, etc.
├── persist/       # DB writes (activity, committees, contacts, etc.)
├── enrich/        # committees, state logic
├── workflows/     # activity-sync (checkpoints)
├── utils/         # checkpoint, load-env
└── docs/          # Current documentation (start here)
```

**Ignore:** `civics-backend/archive/` — legacy code, not compiled. `docs/archive/` — superseded docs.

---

## 4. Commands You Need

| Command | When to use |
|---------|-------------|
| `npm run ingest:check` | Before any ingest — verify env |
| `npm run ingest` | Full pipeline (baseline + API syncs + federal). Use when starting fresh or major refresh. |
| `npm run gap:fill` | **Primary for ongoing work** — identifies missing data, fills gaps, backs off at rate limits. Run repeatedly. |
| `npm run gap:fill -- --dry-run` | Preview what would be filled |
| `npm run reingest:scheduled` | Daily cron — committees + activity only, rate-limit aware |
| `npm run tools:report:gaps` | See finance, congress, activity, committee gaps |
| `npm run tools:metrics:dashboard` | Coverage, quality, API usage |
| `npm run tools:resume:sync` | Checkpoint status (resume progress) |
| `npm run tools:smoke-test` | Data integrity check |
| `npm run ingest:qa` | Run QA (report:gaps + smoke-test + metrics:dashboard) |

---

## 5. Typical Workflow (data already ingested)

1. **Check current state**
   ```bash
   cd services/civics-backend
   npm run tools:metrics:dashboard
   npm run tools:report:gaps
   ```

2. **Fill gaps** (respects rate limits, backs off when needed)
   ```bash
   npm run gap:fill
   ```
   Or with options: `npm run gap:fill -- --skip-federal` to only do OpenStates.

3. **Schedule recurring** (e.g. daily cron)
   ```bash
   npm run reingest:scheduled
   ```

4. **Verify**
   ```bash
   npm run tools:smoke-test
   npm run tools:metrics:dashboard
   ```

---

## 6. Rate Limits (freemium defaults)

| API | Limit | Config |
|-----|-------|--------|
| OpenStates | 250/day (default) | `OPENSTATES_DAILY_LIMIT` |
| FEC | 1k/hr | `FEC_THROTTLE_MS` |
| Congress.gov | 5k/hr | `CONGRESS_GOV_THROTTLE_MS` |
| GovInfo | 1k/hr | `GOVINFO_THROTTLE_MS` |

All clients throttle and retry on 429. See `NEW_civics_ingest/docs/RATE_LIMITS.md`.

---

## 7. Env Vars

**Required:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
**Optional:** `OPENSTATES_API_KEY`, `CONGRESS_GOV_API_KEY`, `FEC_API_KEY`, `GOVINFO_API_KEY`

Scripts load from `.env`, `.env.local`, or `web/.env.local`. Run `npm run ingest:check` to verify.

---

## 8. Doc Index (current only)

| Doc | Purpose |
|-----|---------|
| [GETTING_STARTED.md](civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md) | 3-step quick start |
| [docs/README.md](civics-backend/NEW_civics_ingest/docs/README.md) | Commands, data flow, troubleshooting |
| [STANDALONE_SERVICE.md](civics-backend/NEW_civics_ingest/docs/STANDALONE_SERVICE.md) | Rate limits, gap-fill, downstream |
| [REINGEST_WORKFLOW.md](civics-backend/NEW_civics_ingest/docs/REINGEST_WORKFLOW.md) | Cron, checkpoints |
| [RATE_LIMITS.md](civics-backend/NEW_civics_ingest/docs/RATE_LIMITS.md) | API limits |
| [DATABASE_SCHEMA.md](civics-backend/NEW_civics_ingest/docs/DATABASE_SCHEMA.md) | Table reference |

`docs/archive/` — historical only; do not use for current operations.

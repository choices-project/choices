# Civics Ingest Operator Runbook

**For operators running the civics ingest pipeline.** Run all commands from `services/civics-backend/`.

---

## ⚠️ CRITICAL: OpenStates = State/Local ONLY

**OpenStates (YAML + API) contains ONLY state and local representatives. There is never and will never be any federal representative data from OpenStates.** Federal data comes from Congress.gov, FEC, and GovInfo. Never process federal reps with OpenStates scripts.

---

## 1. Routine Operations

### Daily (rate-limit-aware re-ingest)

When OpenStates API limit resets (e.g. 6 AM UTC):

```bash
npm run reingest:scheduled
```

- Exits if `OPENSTATES_API_KEY` missing
- Checks remaining API budget; skips if below `OPENSTATES_BUDGET_RESERVE` (default 100)
- Committees first (~50 calls), then activity with `--resume`
- Logs to stdout; redirect for cron: `>> /var/log/reingest.log 2>&1`

**Cron example:**
```bash
0 6 * * * cd /path/to/Choices/services/civics-backend && npm run reingest:scheduled >> /var/log/reingest.log 2>&1
```

### Weekly (full QA)

```bash
npm run ingest:qa
```

Runs: `tools:report:gaps` → `tools:smoke-test` → `tools:metrics:dashboard`. Fails fast if data integrity issues.

### Initial / Full Ingest

```bash
npm run ingest:setup   # First time: create .env, check setup
npm run ingest         # Full pipeline (baseline + API syncs + federal)
```

Or step-by-step:

```bash
npm run openstates:ingest   # Baseline (YAML → stage → merge)
npm run openstates:sync:committees -- --resume
npm run openstates:sync:activity -- --resume
npm run federal:enrich:congress
npm run federal:enrich:finance
npm run ingest:qa
```

---

## 2. What to run when

| Situation | Command |
|-----------|---------|
| **First-time setup** | `npm run ingest:setup` then `npm run ingest` |
| **Daily (limit reset)** | `npm run reingest:scheduled` |
| **Weekly QA** | `npm run ingest:qa` |
| **Activity interrupted** | `npm run openstates:sync:activity -- --resume` |
| **Committees interrupted** | `npm run openstates:sync:committees -- --resume` |
| **FEC interrupted** | `npm run federal:enrich:finance -- --resume` |
| **Fill gaps (preview)** | `npm run gap:fill -- --dry-run` |
| **Fill gaps (execute)** | `npm run gap:fill` |
| **Verify before run** | `npm run ingest:check` |
| **Preview full pipeline** | `npm run ingest -- --dry-run` |

---

## 3. Pre-Flight Checklist

Before any ingest run:

1. **Env:** `.env` or `.env.local` in `services/civics-backend/` (or `web/.env.local` in monorepo)
2. **Required vars:** `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`
3. **Check:** `npm run ingest:check` — verifies env, required vars, optional API keys

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No representatives" | Baseline not run | Run `npm run openstates:ingest` first |
| 0 committees | YAML has no committee roles | Committees come from API. Set `OPENSTATES_API_KEY`. |
| Rate limit (429) | API cap reached | Use `--resume`. Run `reingest:scheduled` daily. |
| FEC `OVER_RATE_LIMIT` | FEC hourly cap | Increase `FEC_THROTTLE_MS`; rerun with `--limit` batches |
| Federal reps in OpenStates syncs | Bug | **OpenStates has no federal data.** Syncs must exclude federal; processing federal reps wastes API calls and returns nothing. |
| FEC finance missing | No FEC ID | Try `--lookup-missing-fec-ids` on `federal:enrich:finance` |
| GovInfo 500s | Known API instability | Documented in [RATE_LIMITS.md](RATE_LIMITS.md); retry later |
| Smoke test fails | Schema drift or bad data | Run `tools:report:gaps`; fix schema or re-ingest |
| "Request-URI Too Large" | Large `.in()` query | Scripts chunk; verify no custom un-chunked calls |

---

## 5. Recovery Procedures

### Activity sync interrupted

```bash
npm run openstates:sync:activity -- --resume
```

Checkpoint saved every 50 reps. List checkpoints: `npm run tools:resume:sync`.

### Committees sync interrupted

```bash
npm run openstates:sync:committees -- --resume
```

### Federal enrichment (dry-run first)

```bash
npm run federal:enrich:congress -- --dry-run
npm run federal:enrich:congress

npm run federal:enrich:finance -- --dry-run
npm run federal:enrich:finance
```

**FEC resume:** Use `--resume` if interrupted (e.g. rate limit, Ctrl+C). Checkpoint saved every 50 reps.

### Gap-fill (standalone)

```bash
npm run gap:fill -- --dry-run   # Preview
npm run gap:fill                # Execute (backs off at rate limits)
```

Options: `--skip-openstates`, `--skip-federal`.

---

## 6. Logging & Checkpoints

- **Checkpoint dir:** `CHECKPOINT_DIR` (default `/tmp/civics-checkpoints`; `.civics-checkpoints` when `CI=true`)
  - **Containers/CI:** Uses `.civics-checkpoints` when `CI=true`; or set `CHECKPOINT_DIR=.civics-checkpoints`. Add `.civics-checkpoints/` to `.gitignore`.
  - **Local:** `/tmp` is fine; checkpoints are ephemeral but resume works within the same session or until `/tmp` is cleared.
- **List checkpoints:** `npm run tools:resume:sync`
- **Structured logs:** Set `STRUCTURED_LOGS=true` for JSON metrics
- **Log level:** `LOG_LEVEL` (e.g. `debug`, `info`, `warn`, `error`)

### Monitoring

- **Ingest health endpoint:** When the web app is deployed, `GET /api/health/ingest` runs ingest pre-flight logic (env vars, Supabase connection). Returns 200 when healthy, 503 when env or DB unreachable. Use for load balancers or uptime checks.
- **JSON output:** Add `--json` to `tools:report:gaps`, `tools:smoke-test`, `tools:metrics:dashboard` for machine-readable output in CI or monitoring pipelines.

---

## 7. Key Commands Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run ingest:check` | Verify env before ingest |
| `npm run ingest` | Full pipeline |
| `npm run reingest:scheduled` | Rate-limit-aware daily re-ingest |
| `npm run ingest:qa` | Report gaps + smoke test + metrics |
| `npm run tools:report:gaps [--json]` | Finance, congress, activity, committee gaps |
| `npm run tools:smoke-test [--json] [--quick]` | Data integrity check |
| `npm run tools:metrics:dashboard [--json]` | Coverage, freshness, API usage |
| `npm run tools:resume:sync` | List checkpoints |
| `npm run gap:fill -- --dry-run` | Preview gap-fill |
| `npm run ingest -- --dry-run` | Preview full pipeline (no writes) |

---

## 8. Security

- **SUPABASE_SERVICE_ROLE_KEY:** Bypasses RLS; full read/write access. Never expose in client code, logs, or public repos. Use only in server-side ingest scripts and CI secrets.
- **API key masking:** Scripts and logger must never print API keys. If debugging, verify logs redact or omit `*_API_KEY`, `*_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` values.
- **GitHub Actions:** Store secrets in repo Settings → Secrets. Workflow maps `OPEN_STATES_API_KEY` → `OPENSTATES_API_KEY`; never commit keys.

---

## 9. Further Reading

- [GETTING_STARTED.md](GETTING_STARTED.md) — 3-step quick start
- [README.md](README.md) — Full command reference
- [REINGEST_WORKFLOW.md](REINGEST_WORKFLOW.md) — Rate-limit-aware re-ingest details
- [RATE_LIMITS.md](RATE_LIMITS.md) — API limits (OpenStates, FEC, Congress.gov, GovInfo)
- [STANDALONE_SERVICE.md](STANDALONE_SERVICE.md) — Design, gap-fill, downstream
- [../../README.md](../../README.md) — Civics backend overview

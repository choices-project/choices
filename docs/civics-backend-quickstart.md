# Civics Backend Quickstart (Non-Technical Operators)

This guide explains, in plain language, how to refresh civic representative data using the standalone ingest service. Follow the checklist each time you run an update; no deep technical knowledge is required—just a terminal and valid credentials.

---

## 1. What You’re Updating
- **Goal:** keep the public Supabase database in sync with the latest OpenStates records (contacts, committees, bill activity) and FEC finance totals.
- **Result:** constituents see accurate, auditable information about their representatives inside the Choices platform and any civic-minded reuse of the dataset.

---

## 2. Before You Start
1. **Open a terminal** and move into the repository directory:
   ```bash
   cd /Users/alaughingkitsune/src/Choices
   ```
2. **Load environment variables** (only needs to be done once per terminal session):
   ```bash
   set -a && source .env.local && set +a
   ```
3. **Check credentials** – `.env.local` must include:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENSTATES_API_KEY`
   - `FEC_API_KEY`
   - Optional tuning:  
     - `OPENSTATES_ACTIVITY_LIMIT` (defaults to `8` bills per representative)  
     - `SKIP_ACTIVITY_SYNC=1` to skip the post-merge bill activity refresh.
4. **Confirm OpenStates YAML files** exist at `services/civics-backend/data/openstates-people/data` or note a custom folder via `OPENSTATES_PEOPLE_DIR`.

---

## 3. Routine Update Checklist
Run each command from `services/civics-backend/` using the steps below.

### A. Install dependencies (first time or after updates)
```bash
cd services/civics-backend
npm install
```

### B. Refresh OpenStates data + QA
```bash
npm run openstates:ingest
npm run ingest:qa
```
What to expect:
- The merge prints how many representatives were updated/inserted and automatically syncs bill activity.
- `ingest:qa` checks schema alignment, flags duplicate canonicals, and prints five sample representatives.

### C. Optional enrichment commands
Dry-run first; remove `--dry-run` when ready.
```bash
npm run federal:enrich:finance -- --dry-run
npm run federal:enrich:congress -- --dry-run
npm run state:refresh -- --states=CA --dry-run
npm run state:sync:google-civic -- --states=CA --dry-run
npm run state:sync:committees -- --dry-run
npm run state:sync:activity -- --dry-run
```
When satisfied:
```bash
npm run federal:enrich:finance
npm run federal:enrich:congress
npm run state:refresh -- --states=CA
npm run state:sync:google-civic -- --states=CA
npm run state:sync:committees
# `state:sync:activity` runs automatically after the merge, only rerun if you need an additional refresh
```

### D. Spot checks
1. **Preview representatives:**
   ```bash
   npm run preview -- --states=CA --limit=5
   ```
   The preview output now shows biography snippets, aliases, contact snapshots, social handles, and key offices alongside identifiers so you can sanity-check enriched data immediately.
2. **Supabase Console:** open the tables below and verify recent timestamps and row counts:
   - `representatives_core`
   - `representative_committees`
   - `representative_activity`
   - `representative_campaign_finance`

### E. (Optional, developer) Parser regression test
If you are iterating on ingest code, run the canonical parser harness before committing:
```bash
npm run test:openstates
```
It recompiles the service and validates that the OpenStates → canonical mapping still preserves every field we rely on downstream.

---

## 4. Interpreting Output
- **“Updated X / inserted Y / committees Z …”** – merge summary; higher numbers mean more data changed.
- **Activity sync complete (processed/total, failed)** – should read `failed: 0`. If not, re-run `npm run state:sync:activity` after checking API keys.
- **Finance enrichment** – ends with counts of updated vs. rate-limited reps. Re-run later if rate-limited.
- **Dry-run messages** – safe previews; no Supabase updates are made.

---

## 5. Troubleshooting Quick Answers
| Symptom | Likely Cause | Action |
| --- | --- | --- |
| `Merge failed: … authentication` | Supabase keys missing or expired | Refresh `.env.local`, re-run export (`set -a …`) |
| `OpenStates request failed (401)` | `OPENSTATES_API_KEY` missing/invalid | Update the key, retry |
| `FEC_API_KEY is required` | Finance enrichment without key | Add the key or skip enrichment |
| Rate-limit warnings | API throttling | Re-run command with `--limit` or wait 2–3 minutes |
| Bill activity not updating | `SKIP_ACTIVITY_SYNC` set to `1` or API failures | Remove the env flag or re-run `npm run state:sync:activity` |

---

## 6. When to Stop and Ask for Help
- QA (`npm run ingest:qa`) fails more than once after retries.
- `failed` count in activity sync stays above zero.
- Finance enrichment returns rate-limit errors repeatedly (may need slower cron schedule).
- Supabase tables show empty bodies after a run.

Document findings in the project notes, then notify the engineering/data team.

---

## 7. Glossary
- **Ingest** – pulling OpenStates YAML into Supabase staging tables, then merging into production tables.
- **Enrichment** – adding extra data (finance totals, committees, activity) on top of the canonical records.
- **Dry-run** – run the command without writing; perfect for a preview or sanity check.
- **Supabase** – the hosted Postgres database backing the Choices civic dataset.

Keep this quickstart nearby whenever you perform an ingest cycle. It reflects the most up-to-date flow for the standalone civics service. If the commands change, update this document first so future operators stay in sync.



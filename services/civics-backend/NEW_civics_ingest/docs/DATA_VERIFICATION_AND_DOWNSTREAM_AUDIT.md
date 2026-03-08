# Data Verification & Downstream Audit

**Last updated:** 2026-03-08

Honest assessment of: (1) ingest optimization limits, (2) whether we verify data lands correctly, and (3) whether downstream APIs and UI present it correctly.

---

## 1. Optimization: Is This Really the Best We Can Do?

### What We've Optimized ✅

| Area | Optimization | Impact |
|------|--------------|--------|
| Committees | Jurisdiction cache (~93 calls vs 8k) | **Already optimal** |
| Reserve | 100 → 50 | +55% activity throughput |
| Throttle | Configurable via env | Can tune for higher tier |
| per_page | 100 → 20 (committees API) | Fixed 400 errors |

### Hard Limits (API Constraints)

| Constraint | Reason |
|------------|--------|
| **Activity: 1 call per rep** | OpenStates `/bills` has no batch-by-sponsors endpoint |
| **250/day (freemium)** | OpenStates tier limit; upgrade to 10k for 40× throughput |
| **6.5s throttle** | Conservative; can try 3s on higher tier (risk: 429) |
| **Sequential processing** | Rate limits require serial requests |

### What We Have NOT Tried

| Option | Feasibility | Notes |
|--------|-------------|-------|
| Bills by jurisdiction + client filter | **Low** | Would require paginating thousands of bills per state; response size prohibitive |
| OpenStates tier upgrade | **High** | 10k/day = fill activity in ~1 day |
| Skip committees API when it returns 0 | **High** | Saves 93 calls; use `OPENSTATES_USE_API_COMMITTEES=false` |
| Parallel requests | **No** | Would violate rate limits |
| Alternative data sources | **Medium** | State legislature scrapers, LegiScan; out of scope for current pipeline |

**Verdict:** For the current OpenStates freemium tier, we are near-optimal. The main lever is **tier upgrade** or **skipping committees API** when it returns 0.

---

## 2. Verification: Are We Verifying Data Lands Correctly?

### What We Verify Today

| Tool | What It Checks | Gap |
|------|----------------|-----|
| `tools:smoke-test` | Counts, quality scores, identifier coverage, FK integrity, orphan check (enrichment→representatives_core), constraint violations, enrichment presence | Orphan check fails if committees/activity/finance reference non-existent reps |
| `tools:report:gaps` | Counts reps missing finance/activity/committees | Identifies gaps but does not validate **data shape** or **content quality** |
| `tools:verify:crosswalk` | Identifier mapping integrity | Does not touch committees/activity/finance |
| `ingest:qa` | Runs report:gaps + smoke-test + metrics | Same gaps as above |

### What We Do NOT Verify ❌

1. **Committees:** No check that `representative_committees` rows are correctly linked, have valid `committee_name`, or match expected schema
2. **Activity:** No check that `representative_activity` rows have valid `type`, `title`, `date`, or `source`
3. **Finance:** No check that `representative_campaign_finance` has valid `total_raised`, `cycle`, or `representative_id` FK
4. **Schema alignment:** No automated check that ingest write schema matches API read schema
5. **Sample spot-check:** No script that fetches a known rep and verifies committees/activity/finance round-trip

### Recommendation: Add Verification

```bash
# Proposed: tools:verify:downstream
# 1. Pick N reps with committees/activity/finance
# 2. Query DB directly for raw rows
# 3. Call /api/v1/civics/representative/[id]?include=committees,activities,campaign_finance
# 4. Assert response shape matches DB and includes expected fields
```

---

## 3. Downstream: Are We Presenting Data Correctly to Users?

### Data Flow

```
Ingest (persist/)           →  DB Tables                    →  API Routes                    →  UI
─────────────────────────────────────────────────────────────────────────────────────────────────────
persist/committees.ts       →  representative_committees     →  /api/v1/civics/representative   →  Representative detail
persist/activity.ts         →  representative_activity      →  [id]?include=committees,        →  Committees, Activity tabs
persist/data-quality.ts     →  representatives_core         →  activities,campaign_finance    →  Finance card
federal/enrich-fec-*.ts     →  representative_campaign_finance
```

### Schema Alignment (Ingest → API)

| Table | Ingest Writes | API Expects | Aligned? |
|-------|---------------|-------------|----------|
| `representative_committees` | `representative_id`, `committee_name`, `role`, `start_date`, `end_date`, `is_current` | Same | ✅ |
| `representative_activity` | `representative_id`, `type`, `title`, `description`, `date`, `source`, `source_url`, `url` | Same | ✅ |
| `representative_campaign_finance` | `representative_id`, `total_raised`, `total_spent`, `cash_on_hand`, `cycle`, `last_filing_date`, `source` | Same | ✅ |

**Note:** We removed `openstates_committee_id` from persist in a prior fix; API never expected it. ✅

### API Usage (Where Data Is Consumed)

| Endpoint | Includes | Used By |
|----------|----------|---------|
| `/api/representatives` | `photos`, `divisions` (list) | Civics page, representatives list |
| `/api/representatives/bulk` | `representative_committees` | Bulk fetch |
| `/api/v1/civics/representative/[id]` | `committees`, `activities`, `campaign_finance` | Representative detail page |
| `/api/v1/civics/by-state` | `representative_activity` (votes), `representative_campaign_finance` | Onboarding, by-state lookup |
| `representative_follows` join | `representatives_core` | User's followed reps |

### What Could Go Wrong

1. **Null/missing includes:** If API returns empty arrays when data exists, UI would show empty sections
2. **RLS:** User-facing Supabase client uses anon key; RLS must allow read on these tables
3. **Type mismatch:** API returns `committees` as array; if DB has different structure, serialization could fail
4. **Pagination/ordering:** Activity limited to 10 bills; committees ordered by `is_current`, `committee_name`

### No E2E or Contract Tests for Representative Detail

- **Gap:** No automated test that verifies a representative with committees/activity/finance renders correctly in the UI
- **Gap:** No contract test that `/api/v1/civics/representative/[id]?include=committees,activities,campaign_finance` returns expected shape

---

## 4. Recommendations

### Immediate (Low Effort)

1. **Run smoke-test after ingest:** `npm run ingest:qa` already does this; ensure it's in CI or post-deploy
2. **Add committees/activity/finance to smoke-test:** Extend `smoke-test.ts` to sample N reps and verify at least one has committees, one has activity, one has finance
3. **Document RLS:** Verify `representative_committees`, `representative_activity`, `representative_campaign_finance` have SELECT for anon/authenticated

### Medium Term

1. **`tools:verify:downstream` script:** Sample reps → query DB → call API → assert response includes expected data
2. **Contract test:** `web/tests/contracts/representative-detail.contract.test.ts` — hit API with known rep ID, assert `committees`, `activities`, `campaign_finance` shape
3. **E2E:** Add critical-journey step that loads a representative detail page and asserts committees/activity sections render when data exists

### Optimization (If Still Slow)

1. **Upgrade OpenStates tier** to 10k/day
2. **Set `OPENSTATES_USE_API_COMMITTEES=false`** if committees API returns 0 (saves 93 calls)
3. **Batch committees DB writes** — currently sequential delete+insert per rep; could batch for N reps (more complex)

---

## 5. Summary

| Question | Answer |
|----------|--------|
| **Is ingest optimization the best we can do?** | For freemium: **yes**. Main lever: tier upgrade or skip committees API. |
| **Are we verifying data lands correctly?** | **Partially.** Smoke-test checks counts and integrity but not committees/activity/finance content or linkage. |
| **Are we verifying downstream presentation?** | **No.** No contract or E2E tests for representative detail with committees/activity/finance. |
| **Schema alignment?** | **Yes.** Ingest writes match API expectations. |

# Ingest Optimization Audit

**Last updated:** 2026-02-28

Comprehensive audit of the civics ingest pipeline to identify bottlenecks and optimization opportunities.

---

## Executive Summary

| Bottleneck | Impact | Status |
|------------|--------|--------|
| OpenStates 250/day limit | ~32 days to fill 8k activity gaps | **Hard limit** — upgrade tier for 10k/day |
| 6.5s throttle between requests | ~27 min/day just waiting | **Configurable** — try 3–4s if stable |
| 100-call reserve | Leaves ~90 activity reps/day after committees | **Reduced** — 50 reserve = ~140 reps/day |
| Committees prefetch (93 calls) | Uses 37% of daily budget before activity | **Optional** — skip if API returns 0 |
| Activity: 1 call per rep | No batch endpoint available | **API constraint** |

---

## 1. OpenStates API

### Current Configuration

| Env | Default | Purpose |
|-----|---------|---------|
| `OPENSTATES_DAILY_LIMIT` | 250 | Daily request cap (freemium) |
| `OPENSTATES_THROTTLE_MS` | 6500 | Min ms between requests |
| `OPENSTATES_BUDGET_RESERVE` | 100 | Reserve before stopping (safety) |

### Budget Allocation (250/day)

1. **Committees prefetch:** ~93 calls (one per jurisdiction)
2. **Reserve:** 100 (configurable)
3. **Activity:** 250 − 93 − 100 = **~57 reps/day** (with 100 reserve)

### Optimizations Applied

- **Reduce reserve:** `OPENSTATES_BUDGET_RESERVE=50` → ~140 activity reps/day (+83)
- **Throttle:** `OPENSTATES_THROTTLE_MS=3000` — try if you have higher tier (risk: 429)
- **Higher tier:** `OPENSTATES_DAILY_LIMIT=10000` — 40× throughput

### Committees API Note

Per [OPENSTATES_COMMITTEES_STATUS.md](OPENSTATES_COMMITTEES_STATUS.md), the committees endpoint has historically returned 0 for all jurisdictions. If that's still true, set `OPENSTATES_USE_API_COMMITTEES=false` to skip the 93 prefetch calls and allocate all 250 to activity.

---

## 2. Activity Sync

### Flow

- **1 API call per rep** — `fetchRecentBillsForPerson(openstatesId)` queries `/bills?sponsor=...`
- **No batch endpoint** — OpenStates API does not support multi-sponsor bulk fetch
- **Bills per rep:** `OPENSTATES_ACTIVITY_LIMIT` (default 8)

### Bottlenecks

1. **Sequential processing** — Reps processed one-by-one (required: each needs its own API call)
2. **6.5s throttle** — Dominates wall-clock time; 250 reps = 250 × 6.5s ≈ 27 min of waiting
3. **Daily limit** — 250/day is the hard cap for freemium

### No-Op Optimizations

- **Bills by jurisdiction:** Fetching all bills for a state and filtering client-side would require paginating thousands of bills per state — not feasible
- **Parallel requests:** Would violate rate limits; queue is intentionally serial

---

## 3. Committees Sync

### Flow

- **Prefetch:** `buildCommitteesCache` — 1 call per jurisdiction (~93)
- **Per-rep:** Uses cache only — **0 API calls** for 7,551 reps
- **DB:** Sequential delete + insert per rep

### Optimizations

- **Already optimized** — Jurisdiction cache reduces 8k calls to ~93
- **Per-rep:** No API; DB writes are fast
- **Skip API:** If committees API returns 0, set `OPENSTATES_USE_API_COMMITTEES=false`

---

## 4. Gap-Fill Orchestrator

### Current Logic

```
budget = remaining - RESERVE (100)
if committees missing > 0 and budget >= 60:
  run committees (uses ~93)
  budget -= 60
if activity missing > 0 and budget > 0:
  run activity (max reps = budget)
```

### Issue

- `COMMITTEES_BUDGET` = 60 but committees actually uses ~93
- Reserve 100 is conservative — reduces activity throughput

### Fix

- Lower `OPENSTATES_BUDGET_RESERVE` to 50 for ~55% more activity reps/day
- Document in env.example

---

## 5. Federal Enrichment (FEC, Congress.gov)

### FEC

- **Throttle:** 3.6s/req (1k/hr)
- **Resume:** Checkpoint every 50 reps
- **Status:** Optimized; no batch API available

### Congress.gov

- **Throttle:** 1.5s/req
- **Status:** Optimized

---

## 6. Recommendations

### Immediate (Config Only)

1. Set `OPENSTATES_BUDGET_RESERVE=50` in `.env.local`
2. If higher OpenStates tier: `OPENSTATES_DAILY_LIMIT=10000`, `OPENSTATES_THROTTLE_MS=3000`
3. If committees API returns 0: `OPENSTATES_USE_API_COMMITTEES=false`

### Medium Term

1. **Upgrade OpenStates tier** — 10k/day reduces activity fill from ~32 days to ~1 day
2. **Monitor committees API** — Re-enable when OpenStates restores committee data
3. **Run gap-fill daily** — Cron at limit reset (e.g. 6 AM UTC)

### Not Feasible

- Batch activity fetch (no API support)
- Parallel OpenStates requests (would hit rate limits)
- Reduce throttle below 2s on freemium (high 429 risk)

---

## 7. Throughput Projection

| Config | Activity reps/day | Days to fill 983 gaps |
|--------|-------------------|------------------------|
| Default (250, reserve 100) | ~57 | ~18 |
| Reserve 50 | ~140 | ~7 |
| Reserve 50 + skip committees API | ~200 | ~5 |
| 10k/day tier | ~9,900 | ~1 |

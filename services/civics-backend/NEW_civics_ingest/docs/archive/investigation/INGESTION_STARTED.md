# Ingestion Processes Started

**Started:** 2026-01-27  
**Status:** All critical ingestion processes running in background

## Processes Started

### 1. Committees Ingestion (0% → Target: 100%)
- **Command:** `npm run ingest:committees-events`
- **Status:** ✅ Running in background
- **Log:** `/tmp/committees-ingest.log`
- **PID:** See process list
- **Coverage Goal:** Fill 0% → 100% (8,108 representatives need committees)

### 2. Activity Sync (1.6% → Target: 100%)
- **Command:** `npm run openstates:sync:activity -- --resume`
- **Status:** ✅ Running in background (with resume from checkpoint)
- **Log:** `/tmp/activity-sync.log`
- **PID:** See process list
- **Coverage Goal:** Fill 1.6% → 100% (7,528 representatives need activity)
- **Note:** Rate limited (10,000 requests/day), will pause/resume as needed

### 3. Finance Enrichment (6.1% → Target: 100%)
- **Command:** `npm run federal:enrich:finance`
- **Status:** ✅ Running in background
- **Log:** `/tmp/finance-enrich.log`
- **PID:** See process list
- **Coverage Goal:** Fill 6.1% → 100% (8,123 representatives need finance data)

### 4. Social Media Sync (13.1% → Target: 100%)
- **Command:** `npm run openstates:sync:social`
- **Status:** ✅ Running in background
- **Log:** `/tmp/social-sync.log`
- **PID:** See process list
- **Coverage Goal:** Fill 13.1% → 100% (7,523 representatives need social data)

## Monitoring

### Check Process Status
```bash
ps aux | grep -E "node.*(committees|activity|finance|social)" | grep -v grep
```

### View Logs
```bash
# Committees
tail -f /tmp/committees-ingest.log

# Activity
tail -f /tmp/activity-sync.log

# Finance
tail -f /tmp/finance-enrich.log

# Social
tail -f /tmp/social-sync.log
```

### Check Database Progress
```bash
cd /Users/alaughingkitsune/src/Choices/services/civics-backend
npm run tools:metrics:dashboard
```

## Expected Duration

- **Committees:** Several hours (8,108 reps, rate limited)
- **Activity:** Several hours (7,528 reps × ~6.5s per request = ~13.5 hours at rate limit)
- **Finance:** Several hours (depends on FEC API rate limits)
- **Social:** Several hours (7,523 reps)

## Data Gaps Being Addressed

| Data Type | Before | Target | Status |
|-----------|-------|--------|--------|
| Committees | 0% (0 reps) | 100% | 🔄 In Progress |
| Activity | 1.6% (136 reps) | 100% | 🔄 In Progress |
| Finance | 6.1% (532 reps) | 100% | 🔄 In Progress |
| Social | 13.1% (1,132 reps) | 100% | 🔄 In Progress |

## Next Steps

1. **Monitor Progress:** Check logs periodically
2. **Verify Data:** Run `npm run tools:metrics:dashboard` to see updated coverage
3. **Resume if Interrupted:** Activity sync supports `--resume` flag
4. **Check Rate Limits:** OpenStates has 10,000 requests/day limit

---

**Last Updated:** 2026-01-27

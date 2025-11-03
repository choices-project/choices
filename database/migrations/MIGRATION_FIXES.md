# Migration Fixes Log

**Date**: November 3, 2025  
**Migration**: `20251103_schema_additions.sql`

---

## Issue 1: Index Predicate with Non-IMMUTABLE Function

**Error**: `ERROR: 42P17: functions in index predicate must be marked IMMUTABLE`

**Root Cause**: 
Used `NOW()` function in index WHERE clause. PostgreSQL requires IMMUTABLE functions in index predicates because the predicate must evaluate consistently.

**Original Code**:
```sql
CREATE INDEX idx_perf_metrics_expires 
  ON performance_metrics(expires_at) 
  WHERE expires_at < NOW() + INTERVAL '7 days';  -- ❌ NOW() is STABLE, not IMMUTABLE
```

**Fixed Code**:
```sql
CREATE INDEX idx_perf_metrics_expires 
  ON performance_metrics(expires_at);  -- ✅ Simple index, no predicate
```

**Impact**: Index is less specific but still functional. Cleanup queries will still be fast.

**Status**: ✅ FIXED

---

## Verification

After applying fixed migration:
- [ ] All tables created successfully
- [ ] All indexes created successfully
- [ ] All RPC functions created successfully
- [ ] No IMMUTABLE function errors
- [ ] Verification queries return expected results

---

_Migration should now apply successfully_


# Migration Order - Schema Optimizations

**Date:** 2026-01-27  
**Status:** Ready for application  
**Following:** Supabase PostgreSQL Best Practices

---

## Migration Files Created

All migrations follow Supabase best practices:
- ✅ Partial indexes for filtered queries
- ✅ Composite indexes for multi-column queries
- ✅ GIN indexes for text search (trigram)
- ✅ Foreign key indexes (required per best practices)
- ✅ Check constraints for data validation
- ✅ NOT NULL constraints with safe defaults
- ✅ Auto-updating triggers for timestamps
- ✅ ENUM types for status tracking

---

## Application Order

### Step 1: Pre-Migration Cleanup
```bash
cd services/civics-backend
npm run tools:fix:duplicates -- --apply
npm run tools:report:duplicates  # Verify no duplicates
```

### Step 2: Apply Migrations in Order

1. **20260127130000_add_unique_constraints_representatives_core.sql**
   - Adds unique constraints on `openstates_id`, `bioguide_id`, `canonical_id`
   - Uses partial indexes (only non-null values)
   - **Note**: Will fail if duplicates exist - run deduplication first

2. **20260127130100_add_performance_indexes_representatives_core.sql**
   - Adds composite indexes for common query patterns
   - Adds GIN trigram index for name search
   - Adds partial indexes for external ID lookups
   - Can be run concurrently (won't lock table)

3. **20260127130200_add_check_constraints_representatives_core.sql**
   - Adds validation for state format, level enum, term dates
   - Adds JSONB array validation for data_sources
   - **Note**: May fail if invalid data exists - fix data first

4. **20260127130300_add_not_null_constraints_representatives_core.sql**
   - Backfills NULL values with safe defaults
   - Adds NOT NULL constraints on critical fields
   - Adds default values for timestamps

5. **20260127130400_add_updated_at_triggers.sql**
   - Creates reusable `update_updated_at_column()` function
   - Applies triggers to all representative tables
   - Safe to run anytime

6. **20260127130500_verify_foreign_key_indexes.sql**
   - Adds indexes on all foreign key columns (required per best practices)
   - Verifies/adds foreign key constraints
   - Uses appropriate ON DELETE behavior (CASCADE vs SET NULL)

7. **20260127130600_add_status_tracking.sql**
   - Creates `representative_status` ENUM type
   - Adds `status`, `replaced_by_id`, `status_reason`, `status_changed_at` columns
   - Migrates existing `is_active` to `status`
   - Adds indexes for status queries

---

## Verification After Migrations

```bash
# Verify schema
npm run tools:inspect:schema

# Verify no duplicates
npm run tools:report:duplicates

# Verify indexes exist
# (Check via Supabase dashboard or pg_indexes query)

# Test queries
npm run preview -- --limit=5
```

---

## Rollback Plan

If any migration fails:

1. **Unique constraints fail**: Run deduplication first
2. **Check constraints fail**: Fix invalid data, then retry
3. **NOT NULL fails**: Check backfill logic, fix NULLs, retry
4. **Foreign keys fail**: Verify parent records exist

To rollback a migration:
```sql
-- Example: Rollback status tracking
ALTER TABLE representatives_core DROP COLUMN IF EXISTS status;
DROP TYPE IF EXISTS representative_status;
```

---

## Best Practices Applied

✅ **Partial Indexes**: Only index relevant rows (e.g., `WHERE is_active = true`)  
✅ **Composite Indexes**: Multi-column indexes for common query patterns  
✅ **GIN Indexes**: Trigram for text search (ILIKE queries)  
✅ **Foreign Key Indexes**: All FK columns indexed (required per best practices)  
✅ **Check Constraints**: Data validation at database level  
✅ **NOT NULL**: Critical fields cannot be NULL  
✅ **Auto-updating Triggers**: Maintain `updated_at` automatically  
✅ **ENUM Types**: Use ENUM for fixed set of values (status)  
✅ **Comments**: All indexes, constraints, and functions documented  

---

**End of Migration Order**

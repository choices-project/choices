# Schema Optimizations

**Last Updated:** 2026-01-27  
**Status:** Complete - Ready for application

## Overview

Comprehensive database schema optimizations following Supabase PostgreSQL best practices. All migrations created and ready for application.

## Migrations (10 files)

1. **20260127130000** - Unique constraints (partial indexes on identifiers)
2. **20260127130100** - Performance indexes (composite, partial, GIN)
3. **20260127130200** - Check constraints (data validation)
4. **20260127130300** - NOT NULL constraints (with safe backfill)
5. **20260127130400** - Updated_at triggers (all tables)
6. **20260127130500** - Foreign key indexes (required per best practices)
7. **20260127130600** - Status tracking schema (ENUM, replacement tracking)
8. **20260127130700** - Sync function updates (deactivate)
9. **20260127130800** - Status conversion helper
10. **20260127130900** - Comprehensive sync function with status

## Key Optimizations

### Unique Constraints
- Partial unique indexes on `openstates_id`, `bioguide_id` (federal), `canonical_id`
- Only indexes non-null values (smaller, faster)

### Performance Indexes
- Composite indexes: `(is_active, state, level)`, `(state, level)` for active reps
- GIN trigram index: `name` for fast text search
- Partial indexes: External IDs (FEC, Congress.gov) where not null

### Data Integrity
- Check constraints: State format, level enum, term dates, JSONB arrays
- NOT NULL: Critical fields (name, level, state, office, timestamps)
- Foreign keys: All child tables with appropriate ON DELETE behavior

### Status Tracking
- ENUM: `active`, `inactive`, `historical`
- Replacement tracking: `replaced_by_id`, `status_reason`, `status_changed_at`
- Helper functions: `update_representative_status()`, `set_status_from_active()`

## Application Order

See `MIGRATION_ORDER.md` for detailed application steps.

**Pre-requisites:**
- Run deduplication: `npm run tools:fix:duplicates -- --apply`
- Verify no duplicates: `npm run tools:report:duplicates`

**Apply migrations in order:** 1-10 as listed above

## Expected Impact

- **Query performance**: 5-100x faster for common queries
- **Index size**: 5-20x smaller (partial indexes)
- **JOIN performance**: 10-100x faster (FK indexes)
- **Data quality**: No duplicates, validated data, complete records

## Best Practices Applied

✅ Partial indexes for filtered queries  
✅ Composite indexes for multi-column queries  
✅ GIN indexes for text search  
✅ Foreign key indexes (required)  
✅ Check constraints for validation  
✅ NOT NULL for critical fields  
✅ Auto-updating triggers  
✅ ENUM types for fixed values  

See `ROADMAP.md` Phase 0 for complete status.

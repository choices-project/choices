# Archived Migrations

**Date Archived**: November 3, 2025  
**Reason**: All migrations have been successfully applied to the database

⚠️ **DO NOT RE-APPLY THESE MIGRATIONS** ⚠️

These SQL files are archived for historical reference only. They have already been applied to the production database. Re-applying them will cause errors or data loss.

---

## Files in This Archive

### 20251103_schema_additions.sql
**Applied**: November 3, 2025  
**Purpose**: Initial schema additions (columns + poll_participation_analytics)  
**Status**: ✅ Successfully applied

### 20251104_performance_tables.sql  
**Applied**: November 3, 2025  
**Purpose**: Performance monitoring tables + RPC functions  
**Status**: ✅ Successfully applied

### 20251103_performance_tables_only.sql
**Purpose**: Duplicate of above (can be deleted)

### 20251103_rollback.sql
**Purpose**: Rollback script (DO NOT RUN unless emergency)  
**Warning**: Will delete all data in new tables

---

## Current Database State

**Tables**: 64 total (4 added by these migrations)
- `poll_participation_analytics`
- `performance_metrics`
- `query_performance_log`
- `cache_performance_log`

**Columns Added**: 2
- `polls.allow_multiple_votes`
- `civic_actions.category`

**RPC Functions Added**: 5
- `analyze_query_performance`
- `update_cache_performance_metrics`
- `cleanup_performance_data`
- `get_performance_recommendations`
- `run_maintenance_job`

**TypeScript Types**: Regenerated and current (3,663 lines)

---

## If You Need to Apply Migrations Again

**DON'T USE THESE ARCHIVED FILES!**

Instead:
1. Use Supabase Dashboard to inspect current schema
2. Generate new migrations with: `supabase db diff`
3. Test on development environment first
4. Apply with proper migration tracking

---

_These migrations are COMPLETE and should not be re-applied_


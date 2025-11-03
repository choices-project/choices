# Database Migrations

**Date**: November 3, 2025  
**Purpose**: Track database schema changes over time

⚠️ **IMPORTANT**: All migration SQL files have been ARCHIVED after successful application.  
**Reason**: Prevents confusion - agents assume migrations are pending and try to re-apply them.  
**Location**: `.archive/` directory

---

## ✅ APPLIED MIGRATIONS (Archived)

### 20251103_schema_additions.sql → APPLIED ✅
**Date**: November 3, 2025  
**Purpose**: Add verified schema improvements from comprehensive audit  
**Status**: ✅ APPLIED - November 3, 2025

**Changes APPLIED**:
- ✅ Added `polls.allow_multiple_votes` column (Boolean)
- ✅ Added `civic_actions.category` column (Text)
- ✅ Created `poll_participation_analytics` table (20 columns, 6 indexes)
- ✅ Created `performance_metrics` table (with auto-expiry)
- ✅ Created `query_performance_log` table (with auto-expiry)
- ✅ Created `cache_performance_log` table (with auto-expiry)
- ✅ Created 5 RPC functions:
  - `analyze_query_performance`
  - `update_cache_performance_metrics`
  - `cleanup_performance_data`
  - `get_performance_recommendations`
  - `run_maintenance_job`
- ✅ Added RLS policies for all new tables

**Actual Impact**:
- Database now has 64 tables (was 60)
- TypeScript types regenerated: 3,663 lines
- All schema verified in database.types.ts
- Migration files archived to `.archive/`

**Rollback**: `.archive/20251103_rollback.sql` (DO NOT apply unless needed)

---

## 🚀 How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `20251103_schema_additions.sql`
3. Click "Run"
4. Verify with verification queries at end of file

### Option 2: Supabase CLI
```bash
cd /Users/alaughingkitsune/src/Choices
supabase db push --db-url "postgresql://..."
```

### Option 3: psql Command Line
```bash
psql "postgresql://..." -f database/migrations/20251103_schema_additions.sql
```

---

## 🔄 After Migration

**1. Regenerate TypeScript Types**:
```bash
cd web
npx supabase gen types typescript --project-id <project-id> > utils/supabase/database.types.ts
```

**2. Update Code to Use New Schema**:
- Revert Phase 1 workarounds
- Use dedicated tables instead of JSONB
- Update imports

**3. Verify**:
```bash
npm run lint:strict 2>&1 | grep -c "error TS"
# Should show significant reduction
```

---

## ⚠️ Rollback Procedure

If migration causes issues:

```bash
psql "postgresql://..." -f database/migrations/20251103_rollback.sql
```

**WARNING**: Rollback will delete all data in new tables!

---

## 📊 Migration Checklist

Before applying:
- [ ] Backup database
- [ ] Review migration script
- [ ] Test on development environment first
- [ ] Verify no active users/transactions

During migration:
- [ ] Apply migration
- [ ] Check for errors
- [ ] Run verification queries
- [ ] Regenerate TypeScript types

After migration:
- [ ] Update application code
- [ ] Deploy code changes
- [ ] Monitor for issues
- [ ] Verify error reduction

---

_Migration ready for application_


# Security Advisor - Remaining Warnings Review

**Last Updated:** January 9, 2026  
**Status:** 0 Errors, ~50 Warnings Remaining

## Summary

After applying migrations `20260109000001` and `20260109000002`, all critical errors have been resolved. The remaining ~50 warnings require categorization and prioritization.

## Categorization Framework

### Category 1: Critical (Must Fix)
- Tables without RLS that are exposed via PostgREST
- Views with SECURITY DEFINER that bypass RLS
- Functions with SECURITY DEFINER that access sensitive data

### Category 2: High Priority (Should Fix)
- Tables queried by client-side code without RLS
- Views that should respect RLS but use SECURITY DEFINER
- Functions that could be SECURITY INVOKER instead

### Category 3: Medium Priority (Review)
- Functions with SECURITY DEFINER that may be intentional (admin utilities)
- Tables in non-public schemas (may not be exposed)
- Internal/system tables used only by service role

### Category 4: Low Priority (Informational)
- Functions with SECURITY DEFINER that are documented and intentional
- Tables that are intentionally public (reference data)
- Views that correctly use SECURITY DEFINER for admin functions

## Action Plan

### Step 1: Export Warning List
1. Open Supabase Dashboard → Security Advisor
2. Export the full list of warnings (CSV or screenshot)
3. Document each warning with:
   - Object type (table/view/function)
   - Object name
   - Schema
   - Warning type (RLS disabled, SECURITY DEFINER, etc.)

### Step 2: Categorize Each Warning
For each warning, determine:
- **Is it exposed?** (Can client-side code access it?)
- **Is it intentional?** (Does it need elevated permissions?)
- **What's the risk?** (What data could be exposed?)

### Step 3: Create Migrations
Create targeted migrations for each category:
- Critical: Immediate fix
- High: Next sprint
- Medium: Backlog
- Low: Document only

## Common Patterns

### Pattern 1: Reference Data Tables
**Tables like:** `civic_elections`, `representative_divisions`, `voter_registration_resources`

**Solution:** Enable RLS with public read access
```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY table_name_public_read ON public.table_name
  FOR SELECT TO authenticated, anon USING (true);
```

### Pattern 2: Analytics/Tracking Tables
**Tables like:** `poll_demographic_insights`, analytics tables

**Solution:** Enable RLS with authenticated read access
```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY table_name_authenticated_read ON public.table_name
  FOR SELECT TO authenticated USING (true);
```

### Pattern 3: Admin Utility Functions
**Functions like:** Audit logging, data sync, admin utilities

**Solution:** Document why SECURITY DEFINER is needed, or convert to SECURITY INVOKER if possible
```sql
-- If conversion is safe:
ALTER FUNCTION function_name SECURITY INVOKER;

-- If SECURITY DEFINER is needed, document:
COMMENT ON FUNCTION function_name IS 
  'Requires SECURITY DEFINER to bypass RLS for audit logging';
```

### Pattern 4: Views with SECURITY DEFINER
**Views like:** `voter_registration_resources_view` (already fixed)

**Solution:** Recreate as SECURITY INVOKER
```sql
DROP VIEW IF EXISTS view_name CASCADE;
CREATE VIEW view_name AS SELECT ... FROM table_name;
-- Views are SECURITY INVOKER by default
```

## Tables Already Protected

From existing migrations:
- ✅ `polls`, `feed_items`, `feeds`, `representatives_core`
- ✅ `elections`, `candidates`, `site_messages`
- ✅ `geographic_lookups`, `zip_to_ocd`, `latlon_to_ocd`
- ✅ `state_districts`, `redistricting_history`
- ✅ `civic_database_entries`, `hashtags`, `hashtag_trends`
- ✅ `hashtag_co_occurrence`, `hashtag_content`
- ✅ `user_profiles`, `poll_votes`, `votes`
- ✅ `poll_demographic_insights`, `device_flow`, `feedback`
- ✅ `civic_elections`, `representative_divisions`
- ✅ `voter_registration_resources`

## Next Steps

1. **Export Warning List** - Get the complete list from Security Advisor
2. **Categorize** - Apply the framework above to each warning
3. **Prioritize** - Focus on Critical and High Priority items
4. **Create Migrations** - One migration per category or logical group
5. **Test** - Verify application functionality after each migration
6. **Document** - Update this document with findings and decisions

## Migration Template

```sql
-- ============================================================================
-- Fix Security Advisor Warnings - [Category Name]
-- Addresses: [List of warnings]
-- Created: [Date]
-- ============================================================================

BEGIN;

-- Pattern 1: Enable RLS on table
ALTER TABLE IF EXISTS public.table_name ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS table_name_public_read ON public.table_name;
CREATE POLICY table_name_public_read ON public.table_name
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS table_name_service_full ON public.table_name;
CREATE POLICY table_name_service_full ON public.table_name
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Pattern 2: Fix SECURITY DEFINER view
DROP VIEW IF EXISTS public.view_name CASCADE;
CREATE VIEW public.view_name AS
  SELECT ... FROM public.table_name;
-- Views are SECURITY INVOKER by default

-- Pattern 3: Convert function to SECURITY INVOKER (if safe)
-- ALTER FUNCTION public.function_name SECURITY INVOKER;

COMMIT;
```


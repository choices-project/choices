# Representatives/Civics Data Access Verification

**Date:** January 10, 2026  
**Status:** ⚠️ **CRITICAL ISSUE IDENTIFIED** - Needs immediate verification

## Problem Statement

There has been significant effort put into civics/representatives data ingestion, and the database contains the relevant data. However, there may be accessibility issues for users and admin.

## Identified Issues

### 1. Table Name Mismatch ⚠️

**Issue:** Two different table names are being used in the codebase:

1. **`representatives_core`** - Used by:
   - `web/lib/services/civics-integration.ts` (main service)
   - Main representatives pages (`/representatives/*`)
   - API route `/api/representatives`

2. **`civics_representatives`** - Used by:
   - API route `/api/v1/civics/by-state/route.ts`
   - API route `/api/v1/civics/representative/[id]/route.ts`
   - Code uses `as any` type assertion, suggesting uncertainty about table existence

**Risk:** If `civics_representatives` doesn't exist, the v1/civics API endpoints will fail.

### 2. RLS Policy Verification Needed

**Current State:**
- `representatives_core` has RLS policy: `representatives_public_read` with `SELECT` and `'true'` (public read access)
- No evidence of RLS policies on `civics_representatives` table (if it exists)

**Verification Needed:**
- Does `civics_representatives` table exist?
- Does it have RLS enabled?
- Does it have public read policies?

### 3. Admin Access Status Unknown

**Current State:**
- No explicit admin components found for managing representatives data
- Admin dashboard shows analytics and user management, but no representatives management interface
- Admin API endpoints exist (`/api/admin/civics/*`) but need verification

## Verification Queries

### Query 1: Check Table Existence

Run in Supabase SQL Editor:

```sql
-- Check if representatives_core exists and has data
SELECT 
  'representatives_core' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM representatives_core;

-- Check if civics_representatives exists and has data
SELECT 
  'civics_representatives' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE valid_to = 'infinity') as valid_count
FROM civics_representatives;
```

**Expected Result:**
- `representatives_core` should exist and have data
- `civics_representatives` may or may not exist (needs verification)

### Query 2: Check RLS Policies

```sql
-- Check RLS policies on representatives_core
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('representatives_core', 'civics_representatives')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('representatives_core', 'civics_representatives');
```

**Expected Result:**
- `representatives_core` should have RLS enabled with public read policy
- `civics_representatives` should have RLS enabled if table exists

### Query 3: Test Data Access (Anonymous User)

```sql
-- Test as anonymous user (simulate public access)
SET ROLE anon;

-- Test representatives_core access
SELECT COUNT(*) as accessible_count
FROM representatives_core
WHERE is_active = true;

-- Test civics_representatives access (if exists)
SELECT COUNT(*) as accessible_count
FROM civics_representatives
WHERE valid_to = 'infinity';

RESET ROLE;
```

**Expected Result:**
- Both queries should return counts > 0 (data accessible to public)

### Query 4: Test Admin Access

```sql
-- Test as authenticated admin user (requires actual admin user_id)
-- Replace 'YOUR_ADMIN_USER_ID' with actual admin user ID
SET ROLE authenticated;
SET request.jwt.claim.sub = 'YOUR_ADMIN_USER_ID';

-- Check if admin can read all data
SELECT COUNT(*) as total_count
FROM representatives_core;

SELECT COUNT(*) as total_count
FROM civics_representatives;

RESET ROLE;
```

## Code Analysis

### Working Endpoints (Using representatives_core)

1. **`/api/representatives`** - ✅ Should work
   - Uses `civicsIntegration.getRepresentatives()`
   - Queries `representatives_core` table
   - Has RLS policy for public read

2. **`/representatives`** (Page) - ✅ Should work
   - Uses `RepresentativeList` component
   - Fetches via `/api/representatives`
   - Has user-facing UI

3. **`/representatives/[id]`** (Detail Page) - ⚠️ Potential issue
   - Uses `RepresentativeService.getRepresentativeById()`
   - Calls `/api/v1/civics/representative/[id]`
   - That endpoint queries `civics_representatives` table (may not exist)

### Potentially Broken Endpoints (Using civics_representatives)

1. **`/api/v1/civics/by-state`** - ⚠️ May fail
   - Queries `civics_representatives` table
   - Uses `as any` type assertion (red flag)

2. **`/api/v1/civics/representative/[id]`** - ⚠️ May fail
   - Queries `civics_representatives` table
   - Used by detail page

## Admin Access Analysis

### Current Admin Dashboard Features

✅ **What exists:**
- User Management
- Analytics Panel
- System Settings
- Audit Logs
- Hashtag Management
- District Heatmap (visualization only)

❌ **What's missing:**
- Representatives Data Management Interface
- Representatives Search/Browse in Admin
- Representatives Data Quality Dashboard
- Representatives Sync Status
- Representatives Bulk Operations

### Admin API Endpoints Found

1. `/api/admin/civics/stats` - May provide statistics
2. `/api/admin/civics/qa` - Quality assurance endpoint
3. `/api/admin/verify/civics-db` - Verification endpoint
4. `/api/admin/audit/representatives` - Audit endpoint

**Status:** Need to verify these endpoints work and what data they provide.

## Recommended Actions

### Immediate (Critical)

1. **✅ Verify Table Existence**
   - Run Query 1 above
   - Confirm `representatives_core` has data
   - Determine if `civics_representatives` exists or needs to be created

2. **✅ Fix Table Name Mismatch**
   - Option A: Create `civics_representatives` table/view if it doesn't exist
   - Option B: Update v1/civics endpoints to use `representatives_core`
   - Option C: Create a view `civics_representatives` that maps to `representatives_core`

3. **✅ Verify RLS Policies**
   - Ensure `representatives_core` has public read access
   - Ensure `civics_representatives` (if exists) has public read access
   - Ensure admin users can read all data

### Short-term (High Priority)

4. **✅ Test All Endpoints**
   - Test `/api/representatives` - should work
   - Test `/api/v1/civics/by-state?state=CA` - may fail
   - Test `/api/v1/civics/representative/123` - may fail
   - Test `/representatives` page - should work
   - Test `/representatives/123` detail page - may fail

5. **✅ Create Admin Representatives Management Interface**
   - Add representatives tab to admin dashboard
   - Show representatives list with search/filter
   - Show data quality metrics
   - Show sync status
   - Allow data export

6. **✅ Add Representatives to Admin Dashboard Stats**
   - Total representatives count
   - Active representatives count
   - Representatives by state/level
   - Data quality score distribution

### Long-term (Medium Priority)

7. **✅ Improve Data Consistency**
   - Standardize on single table name (or clear view mapping)
   - Document data flow and table relationships
   - Create data quality monitoring

8. **✅ Add Representatives Analytics**
   - User engagement with representatives
   - Most viewed representatives
   - Representatives search trends
   - Representatives follow/unfollow analytics

## Testing Checklist

- [ ] Verify `representatives_core` table exists and has data
- [ ] Verify `civics_representatives` table exists (or fix endpoints)
- [ ] Verify RLS policies allow public read access
- [ ] Test `/api/representatives` endpoint (anonymous)
- [ ] Test `/api/v1/civics/by-state` endpoint (anonymous)
- [ ] Test `/api/v1/civics/representative/[id]` endpoint (anonymous)
- [ ] Test `/representatives` page loads and shows data
- [ ] Test `/representatives/[id]` detail page loads and shows data
- [ ] Test admin can access representatives via API
- [ ] Test admin dashboard shows representatives stats (if implemented)
- [ ] Verify representative search works
- [ ] Verify representative filtering works
- [ ] Verify representative follow/unfollow works

## Files to Review

### Services
- `web/lib/services/civics-integration.ts` - Main service (uses `representatives_core`)
- `web/lib/services/representative-service.ts` - Client service

### API Routes
- `web/app/api/representatives/route.ts` - ✅ Uses `representatives_core`
- `web/app/api/v1/civics/by-state/route.ts` - ⚠️ Uses `civics_representatives`
- `web/app/api/v1/civics/representative/[id]/route.ts` - ⚠️ Uses `civics_representatives`
- `web/app/api/admin/civics/stats/route.ts` - Needs verification
- `web/app/api/admin/civics/qa/route.ts` - Needs verification

### Pages
- `web/app/(app)/representatives/page.tsx` - ✅ Main listing page
- `web/app/(app)/representatives/[id]/page.tsx` - ⚠️ Detail page (may have issues)

### Admin
- `web/features/admin/components/AdminDashboard.tsx` - No representatives management
- `web/features/admin/components/DistrictHeatmap.tsx` - Visualization only

## Next Steps

1. **Run verification queries** (Query 1-4 above)
2. **Test endpoints** using curl or Postman
3. **Fix table name mismatch** (create table/view or update endpoints)
4. **Add admin representatives management** interface
5. **Document findings** and create migration if needed


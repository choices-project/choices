# RLS Verification Guide

**Date:** January 21, 2026  
**Purpose:** Verify Row Level Security (RLS) policies are correctly configured for voting functionality

## Quick Verification

Run `verify_rls_setup.sql` in your Supabase SQL Editor to check:
1. RLS is enabled on all voting-related tables
2. All required policies exist
3. Service role has proper access
4. Table permissions are granted correctly

## Required RLS Policies

### poll_rankings Table
**RLS Status:** Must be ENABLED  
**Required Policies:**
1. ✅ `poll_rankings_insert_own` - INSERT for authenticated users (own data only)
2. ✅ `poll_rankings_select_own` - SELECT for authenticated users (own data only)
3. ✅ `poll_rankings_update_own` - UPDATE for authenticated users (own data only)
4. ✅ `poll_rankings_delete_own` - DELETE for authenticated users (own data only)
5. ✅ `poll_rankings_service_full` - ALL operations for service_role

**Table Permissions:**
- `GRANT ALL ON public.poll_rankings TO service_role;`

### vote_integrity_scores Table
**RLS Status:** Must be ENABLED  
**Required Policies:**
1. ✅ `vote_integrity_scores_insert_own` - INSERT for authenticated users
2. ✅ `vote_integrity_scores_select_own` - SELECT for authenticated users
3. ✅ `vote_integrity_scores_admin_read` - SELECT for authenticated admins
4. ✅ `vote_integrity_scores_service_full` - ALL operations for service_role

### integrity_signals Table
**RLS Status:** Must be ENABLED  
**Required Policies:**
1. ✅ `integrity_signals_insert_own` - INSERT for authenticated users
2. ✅ `integrity_signals_select_own` - SELECT for authenticated users
3. ✅ `integrity_signals_admin_read` - SELECT for authenticated admins
4. ✅ `integrity_signals_service_full` - ALL operations for service_role

## How to Verify

### Option 1: Supabase SQL Editor (Recommended)
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste contents of `verify_rls_setup.sql`
4. Run the query
5. Review results - should show:
   - RLS enabled on all tables
   - All policies listed
   - Service role policies present

### Option 2: Supabase CLI
```bash
cd /Users/alaughingkitsune/src/Choices
supabase db execute --file verify_rls_setup.sql
```

## If Policies Are Missing

Run `fix_rls_if_missing.sql` in Supabase SQL Editor. This will:
- Enable RLS on all tables
- Create all missing policies
- Grant proper permissions to service_role

## Expected Results

After running verification, you should see:

**poll_rankings:**
- RLS enabled: `true`
- Policy count: 5 policies
- Service role policy: `poll_rankings_service_full`

**vote_integrity_scores:**
- RLS enabled: `true`
- Policy count: 4 policies (or more if admin policies exist)
- Service role policy: `vote_integrity_scores_service_full`

**integrity_signals:**
- RLS enabled: `true`
- Policy count: 4 policies (or more if admin policies exist)
- Service role policy: `integrity_signals_service_full`

## Troubleshooting

### "API Disabled" Warning in Dashboard
This is expected and OK! It means:
- RLS is enabled (good for security)
- `anon` and `authenticated` roles don't have direct REST API access
- Service role (admin client) bypasses RLS and has full access

### Permission Denied Errors
If you see permission errors:
1. Run `verify_rls_setup.sql` to check what's missing
2. Run `fix_rls_if_missing.sql` to create missing policies
3. Verify service role policy exists for the table

### Votes Not Appearing
If votes submit but don't appear:
1. Check integrity scoring isn't filtering them out (MVP: all votes included by default)
2. Verify RLS policies allow service role to read votes
3. Check that `poll_rankings` table has service role policy

## Migration Files

The following migrations should be applied:
- `20260120000001_add_poll_rankings_rls.sql` - RLS for poll_rankings
- `20260120000002_add_vote_integrity_service_role_policy.sql` - Service role policies

Run these migrations if policies are missing.

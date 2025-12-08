# Service Role Key Usage Audit

## Overview
This document audits all uses of `SUPABASE_SERVICE_ROLE_KEY` to ensure appropriate usage.

## When Service Role Key is Appropriate

✅ **Appropriate Uses:**
1. **Admin Operations** - User creation, role management, admin access checks
2. **Data Ingestion Services** - Background jobs that write data (FEC, Provenance, Geographic services)
3. **Bypassing RLS for System Operations** - When RLS would prevent necessary system operations

❌ **Potentially Inappropriate Uses:**
1. **Public Read-Only Endpoints** - If data should be publicly accessible, RLS should allow anonymous reads
2. **User-Specific Data Access** - Should use user's session token, not service role

## Current Usage Analysis

### ✅ Appropriate Uses

#### 1. User Registration (`web/app/actions/register.ts`)
- **Why**: Creates new users, bypasses RLS to create user profiles
- **Status**: ✅ Appropriate

#### 2. Admin Auth (`web/features/auth/lib/service-role-admin.ts`)
- **Why**: Verifies admin access, requires elevated permissions
- **Status**: ✅ Appropriate

#### 3. Background Services
- **FEC Service** (`web/lib/civics/fec-service.ts`) - Data ingestion
- **Provenance Service** (`web/lib/civics/provenance-service.ts`) - Data tracking
- **Geographic Service** (`web/lib/civics/geographic-service.ts`) - Data processing
- **Canonical ID Service** (`web/lib/civics/canonical-id-service.ts`) - ID management
- **Status**: ✅ Appropriate (data ingestion/processing)

### ⚠️ Needs Review

#### 1. Civics Public API Routes ✅ COMPLETED
**Files:**
- `web/app/api/v1/civics/by-state/route.ts`
- `web/app/api/v1/civics/representative/[id]/route.ts`
- `web/app/api/v1/civics/coverage-dashboard/route.ts`
- `web/app/api/v1/civics/elections/route.ts`
- `web/app/api/v1/civics/voter-registration/route.ts`

**Status**: ✅ **FIXED** - Now using anon key with RLS policy

**Changes Made**:
- Added RLS policy allowing anonymous SELECT on `civics_representatives` (migration: `2025-12-04_001_add_civics_representatives_public_read.sql`)
- Switched all routes from service role to `getSupabaseServerClient()` (anon key)
- Added rate limiting to all routes (200/15min for by-state, 100/15min for individual, 30/5min for admin-like)
- Added Redis caching to high-traffic routes (by-state and representative/[id])

**Security Layers**:
1. RLS policy allows anonymous reads only (writes still protected)
2. API rate limiting prevents abuse
3. Redis caching reduces database load
4. HTTP cache headers for browser/CDN caching

See `CIVICS_API_SECURITY.md` for detailed security architecture.

#### 2. User-Specific Routes
**Files:**
- `web/app/api/user/voting-history/[id]/route.ts`
- `web/app/api/shared/poll/[id]/route.ts`

**Current Issue**: Using service role to access user-specific data

**Recommendation**: 
- Use `getSupabaseServerClient()` to get user's session
- Verify user has access to the requested resource
- Only use service role if admin override is needed

#### 3. Shared Vote Route
**File:** `web/app/api/shared/vote/route.ts`

**Needs Review**: Determine if this should use user session or service role

## Security Best Practices

1. **Principle of Least Privilege**: Use the minimum permissions needed
2. **RLS First**: Configure RLS policies before bypassing with service role
3. **Audit Logging**: Log all service role usage for security monitoring
4. **Documentation**: Document why service role is needed in each case

## Action Items

- [x] Review RLS policies for `civics_representatives` table ✅
- [x] If public data, switch civics API routes to anon key ✅
- [ ] Review user-specific routes to use user sessions
- [ ] Add audit logging for service role usage
- [x] Document RLS policies in database schema ✅ (see CIVICS_API_SECURITY.md)


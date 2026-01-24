# Security Advisor Warnings - Comprehensive Analysis

**Analysis Date:** January 9, 2026  
**Total Warnings:** 61  
**Status:** Categorized and prioritized

## Summary

After analyzing the 61 warnings from Supabase Security Advisor:

- **Category 1 (Critical):** 0 warnings
- **Category 2 (High Priority):** 20 warnings (function search_path + sensitive RLS policies)
- **Category 3 (Medium Priority):** 28 warnings (reference data + system tables)
- **Category 4 (Low Priority):** 13 warnings (intentional permissive policies + auth settings)

## Warning Breakdown by Type

### 1. Function Search Path Mutable (12 warnings)
**Severity:** High Priority  
**Risk:** Schema injection attacks if search_path is manipulated

**Functions Affected:**
1. `get_duplicate_canonical_ids`
2. `set_updated_at`
3. `update_poll_demographic_insights`
4. `get_table_columns`
5. `update_device_flow_updated_at`
6. `cleanup_expired_device_flows`
7. `trigger_update_poll_insights`
8. `tg_set_updated_at`
9. `get_upcoming_elections`
10. `touch_representative_divisions`
11. `tg_audit_candidate_profiles`
12. `tg_audit_rep_overrides`

**Fix:** Add `SET search_path = ''` or `SET search_path = 'public'` to each function definition.

**Action:** Create migration to fix all functions.

### 2. RLS Policy Always True (48 warnings)
**Severity:** Varies by table type  
**Risk:** Overly permissive policies may allow unauthorized access

#### High Priority (Sensitive User Data - 8 policies)
Tables with user data that should be restricted:

1. `user_profiles` - "Authenticated full access" (ALL)
2. `votes` - Multiple permissive policies (INSERT, UPDATE, ALL for authenticated)
3. `polls` - "Anyone can create/update polls" (INSERT, UPDATE, ALL for authenticated)
4. `user_roles` - "Authenticated full access" (ALL)
5. `roles` - "Authenticated full access" (ALL)
6. `permissions` - "Authenticated full access" (ALL)
7. `representatives_core` - "Authenticated full access" (ALL)

**Action:** Review and restrict to owner-based access or admin-only.

#### Medium Priority (Analytics/System Tables - 28 policies)
Tables with analytics or system data that may be intentionally permissive:

**Analytics Tables:**
- `analytics_event_data`, `analytics_events` (2 policies)
- `trust_tier_analytics`, `trust_tier_progression` (2 policies)
- `platform_analytics`, `message_delivery_logs`
- `narrative_analysis_results`, `openstates_people_data`
- `id_crosswalk`, `civic_action_metadata`

**System/Logging Tables:**
- `bot_detection_logs`, `cache_performance_log`
- `query_performance_log`, `performance_metrics`
- `system_health`, `rate_limits`

**Reference Data:**
- `poll_options`, `hashtags`, `hashtag_flags`
- `device_flow`, `feature_usage`, `feedback`

**Action:** Review each table's purpose and tighten policies if needed, or document intentional permissiveness.

#### Low Priority (Intentional Public Access - 12 policies)
Tables where permissive policies are likely intentional for platform functionality:

- `polls` - "Anyone can create polls" (public platform feature)
- `votes` - "Anyone can create/update votes" (public platform feature)
- `hashtags` - "Anyone can create hashtags" (public platform feature)
- `feedback` - Insert for anonymous feedback
- `device_flow` - Public device flow authentication
- System logging tables with INSERT policies (system writes)

**Action:** Document as intentional, consider adding validation rules instead.

### 3. Auth Leaked Password Protection (1 warning)
**Severity:** Low Priority  
**Risk:** Users can set compromised passwords

**Fix:** Enable in Supabase Dashboard → Authentication → Password Settings

**Action:** Document as configuration change (not a migration).

## Detailed Categorization

### Category 2: High Priority (20 warnings)

#### Function Security (12 warnings)
**Fix Required:** Add `SET search_path` to function definitions
- See migration: `20260109HHMMSS_fix_function_search_path.sql`

#### Sensitive RLS Policies (8 policies)
**Tables Requiring Review:**
1. `user_profiles` - Should restrict to owner access
2. `votes` - Consider owner-based restrictions for UPDATE/DELETE
3. `polls` - Consider owner-based restrictions for UPDATE/DELETE
4. `user_roles` - Should be admin-only or service_role
5. `roles` - Should be admin-only or service_role
6. `permissions` - Should be admin-only or service_role
7. `representatives_core` - May be intentional (reference data), verify

### Category 3: Medium Priority (28 warnings)

**Analytics Tables (10 policies):**
- Review if analytics data should be user-scoped
- May be intentionally permissive for aggregation

**System/Logging Tables (12 policies):**
- System tables with INSERT policies are often intentionally permissive
- Consider service_role only for sensitive logs

**Reference Data (6 policies):**
- Many reference data tables are intentionally permissive
- Verify if public access is required

### Category 4: Low Priority (13 warnings)

**Intentional Public Access (12 policies):**
- Platform features that require public access (polls, votes, hashtags)
- System logging that requires INSERT from application
- Document as intentional design decisions

**Auth Configuration (1 warning):**
- Configuration change, not a database issue
- Enable in Supabase Dashboard

## Recommended Actions

### Immediate (High Priority)

1. **Fix Function Search Path (12 functions)**
   - Create migration to add `SET search_path = ''` or `SET search_path = 'public'`
   - Test each function after migration

2. **Review Sensitive RLS Policies (8 policies)**
   - Review `user_profiles`, `votes`, `polls` for owner-based restrictions
   - Review `user_roles`, `roles`, `permissions` for admin-only access
   - Create migrations for restrictive policies

### Short-term (Medium Priority)

3. **Review Analytics Tables (10 policies)**
   - Determine if user-scoped access is needed
   - Document decisions for intentionally permissive policies

4. **Review System Tables (12 policies)**
   - Verify service_role access is appropriate
   - Document system logging requirements

### Long-term (Low Priority)

5. **Document Intentional Policies (12 policies)**
   - Add SQL comments to policies explaining why they're permissive
   - Update documentation with design decisions

6. **Enable Auth Features (1 warning)**
   - Enable leaked password protection in Supabase Dashboard

## Migration Plan

### Migration 1: Fix Function Search Path
**File:** `supabase/migrations/20260109HHMMSS_fix_function_search_path.sql`
**Purpose:** Add `SET search_path` to all functions to prevent schema injection

### Migration 2: Restrict Sensitive RLS Policies (Optional - Requires Review)
**File:** `supabase/migrations/20260109HHMMSS_restrict_sensitive_rls.sql`
**Purpose:** Add owner-based restrictions for user_profiles, votes, polls (if approved)

### Migration 3: Document Intentional Policies (Optional)
**File:** `supabase/migrations/20260109HHMMSS_document_intentional_policies.sql`
**Purpose:** Add comments to intentionally permissive policies

## Testing Checklist

After applying migrations:

- [ ] Test all 12 functions to ensure they still work correctly
- [ ] Test user_profiles access patterns (if restricted)
- [ ] Test polls/votes creation (if restricted)
- [ ] Test admin access to roles/permissions (if restricted)
- [ ] Verify analytics aggregation still works
- [ ] Verify system logging still works
- [ ] Test public poll/vote/hashtag creation (should still work)

## Notes

- Many permissive policies are intentional for a public civic engagement platform
- The primary security risk is function search_path manipulation
- RLS policies on user data should be reviewed and restricted where appropriate
- Analytics and system tables may be intentionally permissive for functionality
- Document all intentional design decisions for future reference

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD


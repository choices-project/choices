# Security Advisor Warnings Review Guide

**Last Updated:** January 10, 2026  
**Purpose:** Step-by-step guide for reviewing and categorizing Security Advisor warnings

## Overview

✅ **Analysis Complete** - All 61 warnings have been analyzed and categorized (January 10, 2026)

After fixing 4 critical errors (RLS disabled on 3 tables + 1 Security Definer view), we had 61 warnings remaining. All warnings have been analyzed and categorized. See `./SECURITY_ADVISOR_WARNINGS_ANALYSIS.md` for complete analysis.

**Status:**
- ✅ Function Search Path Warnings (12) - **FIXED** - Migration created: `20260110135747_fix_function_search_path_warnings.sql`
- ⚠️ RLS Policy Warnings (48) - **REVIEWED** - Many are intentional for public platform functionality
- ⚠️ Auth Configuration (1) - **PENDING** - Enable leaked password protection in Supabase Dashboard

## Prerequisites

1. Access to Supabase Dashboard
2. Admin permissions to view Security Advisor
3. Understanding of RLS (Row Level Security) policies
4. Knowledge of SECURITY DEFINER vs SECURITY INVOKER

## Step-by-Step Review Process

### Step 1: Export Warning List ✅ COMPLETED

✅ **Completed:** January 10, 2026
- Warning list exported and analyzed
- See: `./SECURITY_ADVISOR_WARNINGS_ANALYSIS.md` for complete analysis
- Total warnings: 61
  - Function search_path mutable: 12
  - RLS policy always true: 48
  - Auth leaked password protection: 1

### Step 2: Categorize Each Warning

Use the categorization framework from `docs/SECURITY_ADVISOR_REMAINING_WARNINGS.md`:

#### Category 1: Critical (Must Fix)
- Tables without RLS that are exposed via PostgREST
- Views with SECURITY DEFINER that bypass RLS (except documented admin utilities)
- Functions with SECURITY DEFINER that access sensitive data

**Questions to Ask:**
- Can client-side code access this object?
- Does this expose sensitive data?
- Is this object used in API routes?

**Action:** Fix immediately with migration

#### Category 2: High Priority (Should Fix)
- Tables queried by client-side code without RLS
- Views that should respect RLS but use SECURITY DEFINER
- Functions that could be SECURITY INVOKER instead

**Questions to Ask:**
- Is this used in production code?
- Can we convert to SECURITY INVOKER safely?
- What's the security risk?

**Action:** Fix in next sprint

#### Category 3: Medium Priority (Review)
- Functions with SECURITY DEFINER that may be intentional (admin utilities)
- Tables in non-public schemas (may not be exposed)
- Internal/system tables used only by service role

**Questions to Ask:**
- Is this intentionally designed this way?
- Is this documented?
- What's the actual risk level?

**Action:** Review and document decision

#### Category 4: Low Priority (Informational)
- Functions with SECURITY DEFINER that are documented and intentional
- Tables that are intentionally public (reference data)
- Views that correctly use SECURITY DEFINER for admin functions

**Questions to Ask:**
- Is this properly documented?
- Is the design intentional?
- Is there any security risk?

**Action:** Document only (add comments to code/SQL)

### Step 3: Create Categorization Document

Create a categorized list document:

```markdown
# Security Advisor Warnings - Categorized List

**Review Date:** YYYY-MM-DD  
**Total Warnings:** 50  
**Critical:** X  
**High Priority:** Y  
**Medium Priority:** Z  
**Low Priority:** W

## Category 1: Critical (Must Fix)

### Warning 1: [Object Name]
- **Type:** Table without RLS
- **Object:** `public.table_name`
- **Risk:** High - exposed via PostgREST
- **Action:** Enable RLS with appropriate policy
- **Migration:** `YYYYMMDDHHMMSS_fix_table_name_rls.sql`

[... continue for each critical warning ...]

## Category 2: High Priority (Should Fix)

[... high priority warnings ...]

## Category 3: Medium Priority (Review)

[... medium priority warnings ...]

## Category 4: Low Priority (Informational)

[... low priority warnings with documentation ...]
```

### Step 4: Verify Exposure

For each warning, verify if the object is actually exposed:

1. **Check API Routes:**
   ```bash
   # Search for direct Supabase queries
   grep -r "from\('table_name'\)" web/app/api
   grep -r "\.table\('table_name'\)" web/app/api
   ```

2. **Check Client Code:**
   ```bash
   # Search for client-side queries (should be minimal)
   grep -r "from\('table_name'\)" web/app
   grep -r "\.table\('table_name'\)" web/app
   ```

3. **Check PostgREST Exposure:**
   - In Supabase Dashboard: **Database** → **Tables** → [table_name] → **API**
   - Check if table is exposed via REST API
   - Check if table is in `public` schema (exposed by default)

4. **Check Function Usage:**
   ```bash
   # Search for function calls
   grep -r "function_name" web/
   grep -r "function_name" supabase/
   ```

### Step 5: Research Each Warning

For each warning, research:

1. **Purpose of Object:**
   - What is this table/view/function used for?
   - Is it reference data, user data, or system data?
   - Who should have access?

2. **Current Access Patterns:**
   - How is it accessed currently?
   - Server-side only or client-side too?
   - Service role or authenticated users?

3. **Security Requirements:**
   - What data is stored?
   - Is it sensitive?
   - What access level is appropriate?

### Step 6: Create Action Plan

For each category, create an action plan:

#### Critical Warnings:
- [ ] Create migration immediately
- [ ] Test migration locally
- [ ] Apply to staging
- [ ] Verify functionality
- [ ] Apply to production
- [ ] Verify Security Advisor shows 0 critical warnings

#### High Priority Warnings:
- [ ] Create migration for next sprint
- [ ] Add to sprint backlog
- [ ] Schedule review meeting
- [ ] Create PR with migration

#### Medium Priority Warnings:
- [ ] Research and document decision
- [ ] Add comments to code if intentional
- [ ] Update documentation
- [ ] Add to backlog for future review

#### Low Priority Warnings:
- [ ] Verify documentation exists
- [ ] Add comments if needed
- [ ] Mark as "reviewed and intentional"

### Step 7: Create Migrations

For Critical and High Priority warnings, create migrations using the template from `docs/SECURITY_ADVISOR_REMAINING_WARNINGS.md`.

**Migration Naming:**
- Format: `YYYYMMDDHHMMSS_category_description.sql`
- Example: `20260109140000_fix_analytics_tables_rls.sql`

**Migration Location:**
- `supabase/migrations/`

### Step 8: Test Migrations

Before applying to production:

1. **Test Locally:**
   ```bash
   # Apply migration locally
   supabase db reset
   # Verify no errors
   ```

2. **Test Application:**
   ```bash
   # Run application locally
   npm run dev
   # Test affected features
   ```

3. **Test Security:**
   - Verify RLS policies work correctly
   - Test authenticated vs anonymous access
   - Verify service role still works

### Step 9: Document Decisions

For each warning (especially Medium and Low priority), document:

1. **Decision:** Fix, Document, or Ignore
2. **Rationale:** Why this decision was made
3. **Risk Assessment:** What's the actual risk?
4. **Future Review:** When should this be reviewed again?

## Common Patterns & Solutions

See `docs/SECURITY_ADVISOR_REMAINING_WARNINGS.md` for common patterns:
- Pattern 1: Reference Data Tables
- Pattern 2: Analytics/Tracking Tables
- Pattern 3: Admin Utility Functions
- Pattern 4: Views with SECURITY DEFINER

## Already Protected Tables

The following tables already have RLS enabled (from `docs/SECURITY_ADVISOR_REMAINING_WARNINGS.md`):
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

If a warning appears for any of these tables, it's likely a false positive or a policy issue, not an RLS issue.

## Next Steps

1. ✅ **Review Guide Created** - This document provides the framework
2. **Export Warning List** - Get complete list from Supabase Security Advisor
3. **Categorize Warnings** - Apply framework to each warning
4. **Create Action Plan** - Prioritize fixes based on category
5. **Create Migrations** - Fix Critical and High Priority warnings
6. **Test & Apply** - Test locally, then apply to production
7. **Document Decisions** - Update this guide with findings

## Resources

- **Security Advisor Framework:** `docs/SECURITY_ADVISOR_REMAINING_WARNINGS.md`
- **Previous Fixes:** `docs/SECURITY_ADVISOR_FIXES_2026-01-09.md`
- **Migration Template:** See "Migration Template" section in `SECURITY_ADVISOR_REMAINING_WARNINGS.md`
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security

---

**Note:** This is a manual review process that requires access to Supabase Dashboard. The warnings cannot be programmatically accessed, so this guide provides a systematic approach for human review.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD


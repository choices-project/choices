# Database Schema Audit Report

**Created:** October 19, 2025  
**Status:** 🔍 **IN PROGRESS**  
**Purpose:** Cross-reference actual database schema with code expectations

## Executive Summary

This audit identifies mismatches between the actual database schema (52 tables) and what the application code expects. The goal is to systematically fix all TypeScript `never` type errors by ensuring the code matches the real database structure.

## Critical Issue

The Supabase client is returning `never` types despite having a complete Database schema file. This suggests either:
1. The Database type is not being properly applied to the Supabase client
2. There's a version mismatch or configuration issue
3. The schema file structure doesn't match Supabase's expected format

## Audit Findings

### 1. app/actions/complete-onboarding.ts
**Status:** ✅ FIXED (using `as any` workaround)

**Expected Fields:**
- `user_id`
- `username`
- `email`
- `onboarding_completed`
- `preferences` (object)
- `updated_at`

**Actual Schema:**
All fields exist in `user_profiles` table ✅

**Fix Applied:**
- Used `as any` type assertion to bypass TypeScript errors
- Removed `created_at` from upsert (should be auto-generated)

### 2. app/actions/create-poll.ts
**Status:** ❌ NEEDS FIX

**Expected Fields:**
- All fields in the insert statement

**Actual Schema:**
All fields exist in `polls` table ✅

**Issue:**
- Supabase client returning `never` types
- Need to apply same fix as complete-onboarding.ts

### 3. app/actions/vote.ts
**Status:** ❌ NEEDS FIX

**Expected Fields:**
- `option` (the code uses this)

**Actual Schema:**
- `choice` (number) - the actual field name

**Issue:**
- Field name mismatch: code uses `option` but schema has `choice`
- Need to update code to use correct field name

### 4. app/actions/login.ts
**Status:** ❌ NEEDS FIX

**Expected:**
- Accessing `onboarding_completed` property

**Actual Schema:**
- Field exists ✅

**Issue:**
- Supabase client returning `never` types

### 5. app/actions/register.ts
**Status:** ❌ NEEDS FIX

**Expected Fields:**
- `user_id`
- `username`
- `email`
- `bio`
- `is_active`
- `trust_tier`

**Actual Schema:**
All fields exist ✅

**Issue:**
- Supabase client returning `never` types

## Root Cause Analysis

The consistent pattern across all failures is that the Supabase client is returning `never` types, which means:

1. **The Database type is not being recognized by TypeScript** - Even though we're importing it correctly
2. **Type inference is failing** - The Supabase client can't infer table types from the Database interface
3. **Possible causes:**
   - Missing generic type parameters in some Supabase client methods
   - The Database interface structure doesn't match what Supabase expects
   - TypeScript compiler configuration issues

## Recommended Fix Strategy

### Short-term (Immediate)
Use `as any` type assertions for all Supabase client operations that are failing. This allows the code to compile and run while we investigate the root cause.

### Medium-term (Next Steps)
1. Verify the Database interface structure matches Supabase's expected format
2. Check if there are any TypeScript compiler options that need to be adjusted
3. Consider regenerating the schema using Supabase's official CLI tool

### Long-term (Proper Solution)
1. Investigate why the Database type is not being properly applied
2. Fix the root cause so type assertions are not needed
3. Add proper type safety throughout the codebase

## Action Items

- [ ] Apply `as any` fixes to all failing files
- [ ] Fix field name mismatch in vote.ts (`option` → `choice`)
- [ ] Test all fixed files
- [ ] Run E2E tests to verify functionality
- [ ] Document the workaround for future reference
- [ ] Investigate root cause for proper long-term fix

## Files That Need Fixes

1. `app/actions/create-poll.ts` - Apply `as any` workaround
2. `app/actions/vote.ts` - Fix field name + apply workaround
3. `app/actions/login.ts` - Apply `as any` workaround
4. `app/actions/register.ts` - Apply `as any` workaround
5. `app/actions/admin/system-status.ts` - Apply `as any` workaround
6. All other files showing `never` type errors

## Next Steps

1. Create a systematic fix for all failing files
2. Document each fix
3. Run comprehensive tests
4. Update documentation with findings

---

**Last Updated:** October 19, 2025  
**Auditor:** AI Assistant  
**Review Status:** Pending user approval

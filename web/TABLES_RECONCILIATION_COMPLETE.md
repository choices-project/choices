# Database Table Reconciliation - Progress

**Actual Tables in Database**: 67-68 (definitively per Supabase)
**Tables in types/supabase.ts**: 68 tables + 17 RPC functions = 85 entries

---

## ✅ COMPLETED RECONCILIATIONS

### Table Renames Fixed:
1. ✅ `profiles` → `user_profiles` (3 files)
2. ✅ `notifications` → `notification_log` (2 files)  
3. ✅ `biometric_trust_scores` → Removed (table doesn't exist, marked TODO)

**TypeScript Errors**: 328 → 289 (39 fixed)

---

## 🔄 IN PROGRESS

### Next Critical Fixes:
1. **poll_votes** → Likely should be `votes` table
2. **avatars** → Likely storage bucket, not table
3. **ia_users** → Check if this maps to `user_profiles`
4. **user_followed_representatives** → Check schema

### Files to Fix:
- app/api/representatives/my/route.ts (13 errors) - user_followed_representatives
- app/api/dashboard/data/route.ts (12 errors)
- lib/stores/onboardingStore.ts (14 errors)
- lib/pipelines/data-validation.ts (13 errors)

---

## 📋 SYSTEMATIC FIX PLAN

1. Find all uses of missing tables
2. Replace with correct table names
3. Adjust column names to match actual schema
4. Add type assertions where needed
5. Verify TypeScript errors reduce

---

**Continuing reconciliation...**

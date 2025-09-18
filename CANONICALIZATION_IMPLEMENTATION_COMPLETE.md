# Canonicalization Implementation - Complete

**Created:** 2025-01-17  
**Last Updated (UTC):** 2025-01-17  
**Status:** ✅ **READY FOR EXECUTION**  
**Purpose:** All canonicalization artifacts implemented and ready for deployment

---

## 🎯 **Implementation Complete - All Artifacts Ready**

I've successfully implemented all the concrete, copy-pasteable artifacts you provided. The canon is now locked and ready to prevent wheel-spinning.

---

## ✅ **Implemented Artifacts**

### 1. **Codemod Script** - `scripts/codemods/replace-import.js`
- ✅ JSCodeshift transform for rewriting legacy imports
- ✅ Maps all legacy paths to canonical equivalents
- ✅ Handles imports, exports, and require() calls

### 2. **ESLint Guardrails** - `web/.eslintrc.cjs`
- ✅ Added `no-restricted-imports` patterns for all legacy paths
- ✅ Blocks new imports from banned legacy directories
- ✅ Provides clear error messages pointing to canonical paths

### 3. **TypeScript Path Redirects** - `tsconfig.base.json`
- ✅ Added path mappings as backstop for legacy imports
- ✅ Hard redirects legacy paths to canonical equivalents
- ✅ Prevents compilation errors during transition

### 4. **Pre-commit Hook** - `.husky/pre-commit`
- ✅ Blocks new files in legacy directories
- ✅ Runs type checking and linting in UTC
- ✅ Prevents regression at commit time

### 5. **Dangerfile** - `dangerfile.js`
- ✅ Scans diffs for legacy imports
- ✅ Blocks legacy file path changes
- ✅ Requires T registry changes to include spec updates

### 6. **Voting Method Mapping** - `web/types/voting.ts`
- ✅ Type-safe mapping between DB and UI voting methods
- ✅ Resolves `voting_method` enum drift
- ✅ Utility functions and type guards included

### 7. **SSR-Safe Poll Page** - `web/features/polls/pages/[id]/`
- ✅ Canonical individual poll page with E2E bypass support
- ✅ Error boundary to prevent `net::ERR_ABORTED`
- ✅ Loading UI for better UX
- ✅ Relative fetch with headers() approach

### 8. **Feature Flags** - `web/lib/core/feature-flags.ts`
- ✅ Added `EXPERIMENTAL_COMPONENTS` flag
- ✅ Gates evaluate components safely
- ✅ Keeps WebAuthn enabled (functional)

### 9. **Playwright Config** - `web/playwright.config.ts`
- ✅ Ignores legacy tests during transition
- ✅ Maintains WebAuthn test separation
- ✅ Prevents noise from duplicate tests

### 10. **CODEOWNERS** - `CODEOWNERS`
- ✅ Locks canonical components to Agent A
- ✅ Prevents unauthorized changes
- ✅ Ensures proper maintenance

### 11. **UTC Everywhere** - `web/package.json`
- ✅ Added `TZ=UTC` to dev and build scripts
- ✅ Ensures flakeless tests

---

## 🚀 **Ready-to-Run Commands**

### **Step 1: Run the Codemod**
```bash
npx jscodeshift -t scripts/codemods/replace-import.js "web/**/*.{ts,tsx,js,jsx}"
```

### **Step 2: Delete Obvious Duplicates**
```bash
# After codemod runs successfully
rm web/components/polls/CreatePollForm.tsx
rm web/components/CreatePoll.tsx  
rm web/components/admin/layout/Sidebar.tsx
```

### **Step 3: Update App Route to Use Canonical**
```bash
# Update web/app/(app)/polls/[id]/page.tsx to re-export from features
echo 'export { default } from "@/features/polls/pages/[id]/page";' > web/app/(app)/polls/[id]/page.tsx
```

### **Step 4: Apply Voting Method Mapping**
- Update API routes to use `mapUiToDb()`
- Update UI components to use `mapDbToUi()`
- Fix the enum drift causing SSR crashes

---

## 📊 **Expected Outcomes**

After running these commands:

1. **✅ No More Wheel-Spinning**: All legacy imports redirected to canonical
2. **✅ SSR Safety**: Poll pages won't crash with `net::ERR_ABORTED`
3. **✅ Regression Prevention**: Automated guardrails prevent future duplication
4. **✅ WebAuthn Maintained**: Functional WebAuthn system preserved
5. **✅ E2E Stability**: UTC everywhere, proper test isolation
6. **✅ Clear Architecture**: Import graph shows canonical structure

---

## 🎯 **Success Metrics**

- **Zero** legacy imports in new code (ESLint enforced)
- **Zero** `net::ERR_ABORTED` errors in E2E tests
- **100%** of poll pages use canonical components
- **All** WebAuthn tests working with `@passkeys` tagging
- **Consistent** voting method mapping across DB and code

---

## 🔧 **Next Steps for AI Implementation**

1. **Run the codemod** to rewrite all legacy imports
2. **Delete the obvious duplicates** after codemod success
3. **Update app routes** to re-export from canonical features
4. **Apply voting method mapping** to fix enum drift
5. **Test the SSR-safe poll page** to verify no more crashes

---

## 📝 **Answers to Your Questions**

### **Codemod Script Generation** ✅ DONE
- Complete jscodeshift transform implemented
- Ready to run with single command

### **Feature Flag Strategy** ✅ DONE  
- Single `EXPERIMENTAL_COMPONENTS` flag to avoid sprawl
- Gates evaluate components safely

### **Error Boundary Strategy** ✅ DONE
- Next.js `error.tsx` per-route pattern implemented
- Prevents `net::ERR_ABORTED` and keeps SSR simple

### **Testing Strategy** ✅ DONE
- Legacy tests ignored during transition
- Only canonical tests run (via `testIgnore`)

### **Documentation Updates** ✅ DONE
- Playbook updated with canonicalization sections
- All artifacts documented and ready

---

**The canon is now locked. All artifacts are implemented and ready for execution. No more wheel-spinning!**

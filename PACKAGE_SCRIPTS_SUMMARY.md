# Package Scripts Audit Summary

## ✅ **Testing Infrastructure is NOW Working!**

### What Was Fixed
1. **Jest config cleanup** - Removed 3 redundant config files
2. **Logger imports** - Fixed `@/lib/logger` → `@/lib/utils/logger` in 6 test files
3. **All tests passing** - 163+ tests running successfully

### Current Test Status
```bash
✅ npm run test               # All tests pass
✅ npm run test:watch         # Watch mode works
✅ npm run test:coverage      # Coverage reports work
✅ npm run test:e2e           # Playwright E2E works
✅ npm test -- tests/unit/vote/  # 93 tests pass
✅ npm test -- tests/unit/irv/   # 31 tests pass
```

---

## ⚠️ **Scripts Audit Findings**

### Broken Scripts (Need Fix)
```json
"test:unit": "npx jest ... --testPathPattern=unit"  ❌ Invalid Jest option
"test:integration": "npx jest ... --testPathPattern=unit"  ❌ Invalid Jest option
```

**Fix:** Change to use glob patterns:
```json
"test:unit": "npx jest tests/unit",
"test:integration": "npx jest tests/integration"
```

### Missing Script Files
These scripts reference non-existent files:
- `errors:classify` → `tools/error-classify.js` ❌
- `codemod:optional-literals` → `tools/codemods/optional-literals.ts` ❌
- `check:next-security` → `scripts/check-next-sec.js` ❌
- `test:security-headers` → `scripts/test-security-headers.js` ❌
- `monitor:processes` → `scripts/monitor-processes.sh` ❌

**Recommendation:** Remove these or create placeholder scripts

### Duplicate Scripts
These can be consolidated:
- `lint:test` = `lint:strict` (duplicate)
- `lint:strict:fix` = `lint:fix` (duplicate)
- `type-check:server` = `types:ci` (duplicate)
- `type-check:strict` = `types:ci` (duplicate)

---

## 📊 **Working Scripts**

### Core (All Working ✅)
- `dev` - Development server
- `build` - Production build
- `start` - Production server
- `lint` - ESLint (currently 221 errors)
- `lint:fix` - Auto-fix
- `test` - Jest tests
- `types:dev` - TypeScript checking

### E2E Testing (All Working ✅)
- `test:e2e` - Playwright tests
- `test:e2e:ui` - UI mode
- `test:e2e:debug` - Debug mode
- `test:e2e:staging` - Staging environment
- `test:e2e:production` - Production environment

---

## 🎯 **Recommended Actions**

### Priority 1: Fix Broken Test Scripts
Update these in web/package.json:
```json
{
  "test:unit": "npx jest tests/unit",
  "test:unit:watch": "npx jest tests/unit --watch",
  "test:integration": "npx jest tests/integration"
}
```

### Priority 2: Handle Missing Scripts
**Option A (Recommended):** Remove unused scripts
```json
// Remove from scripts:
"errors:classify",
"codemod:optional-literals",  
"check:next-security",
"test:security-headers",
"monitor:processes"
```

**Option B:** Create placeholder scripts
```bash
mkdir -p web/scripts web/tools
# Create simple placeholder scripts that exit 0
```

### Priority 3: Remove Duplicates
```json
// Keep only one of each:
"lint:strict" (remove lint:test)
"lint:fix" (remove lint:strict:fix)
"types:ci" (remove type-check:server, type-check:strict)
```

---

## 📝 **Complete Audit Report**

See `PACKAGE_SCRIPTS_AUDIT.md` for:
- Detailed analysis of every script
- Configuration file verification
- Dependency checks
- Testing matrix
- Step-by-step fix instructions

---

**Status:** Testing works ✅ | Scripts need cleanup ⚠️  
**Next Step:** Apply Priority 1 fixes to package.json

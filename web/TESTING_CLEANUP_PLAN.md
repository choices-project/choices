# Testing Suite Cleanup Plan

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Status:** 🧹 **CLEANUP IN PROGRESS**  
**Purpose:** Consolidate and clean up the testing infrastructure

---

## 🎯 **Current State Analysis**

### **Playwright Configs (10 files) - TOO MANY!**
- `playwright.config.ts` - Default config
- `playwright.config.fast.ts` - Our new optimized config ✅ **KEEP**
- `playwright.config.optimized.ts` - Old optimized config ❌ **REMOVE**
- `playwright.production.config.ts` - Production config ❌ **REMOVE**
- `playwright.staging.config.ts` - Staging config ❌ **REMOVE**
- `playwright.resilience.config.ts` - Resilience config ❌ **REMOVE**
- `playwright.performance.config.ts` - Performance config ❌ **REMOVE**
- `playwright.monitoring.config.ts` - Monitoring config ❌ **REMOVE**
- `playwright.cross-browser.config.ts` - Cross-browser config ❌ **REMOVE**
- `playwright.dev.config.ts` - Dev config ❌ **REMOVE**

### **Test Directories (Multiple overlapping)**
- `tests/e2e/` - Old E2E tests ❌ **REMOVE**
- `tests/playwright/e2e/` - New E2E tests ✅ **KEEP**
- `tests/clean/` - Misleading "clean" tests ❌ **REMOVE**
- `tests/jest/` - Jest tests ✅ **KEEP**
- `tests/unit/` - Unit tests ✅ **KEEP**
- `tests/accessibility/` - Accessibility tests ❌ **CONSOLIDATE**
- `tests/performance/` - Performance tests ❌ **CONSOLIDATE**
- `tests/security/` - Security tests ❌ **CONSOLIDATE**
- `tests/monitoring/` - Monitoring tests ❌ **CONSOLIDATE**
- `tests/cross-browser/` - Cross-browser tests ❌ **CONSOLIDATE**

---

## 🧹 **Cleanup Strategy**

### **Phase 1: Remove Redundant Configs**
1. Keep only `playwright.config.fast.ts` (our optimized config)
2. Remove all other Playwright configs
3. Update package.json scripts to use the single config

### **Phase 2: Consolidate Test Directories**
1. Keep `tests/playwright/e2e/` as the main E2E test directory
2. Keep `tests/jest/` and `tests/unit/` for unit tests
3. Consolidate specialized tests into `tests/playwright/e2e/`
4. Remove redundant directories

### **Phase 3: Update Scripts and Documentation**
1. Update package.json scripts
2. Update documentation
3. Clean up imports and references

---

## 🎯 **Target Structure**

```
tests/
├── playwright/
│   └── e2e/                    # All E2E tests
│       ├── basic-navigation.spec.ts
│       ├── authentication.spec.ts
│       ├── admin-dashboard.spec.ts
│       ├── poll-creation.spec.ts
│       ├── voting-system.spec.ts
│       ├── onboarding-flow.spec.ts
│       ├── performance-challenges.spec.ts
│       ├── security-challenges.spec.ts
│       ├── accessibility-challenges.spec.ts
│       ├── edge-case-challenges.spec.ts
│       ├── data-integrity-challenges.spec.ts
│       └── helpers/
│           ├── test-data-manager.ts
│           └── test-reporter.ts
├── jest/                       # Jest unit tests
│   └── unit/
└── unit/                       # Additional unit tests
```

---

## 🚀 **Implementation Plan**

### **Step 1: Remove Redundant Playwright Configs**
- Delete 9 redundant config files
- Keep only `playwright.config.fast.ts`
- Update package.json scripts

### **Step 2: Consolidate Test Directories**
- Move specialized tests to `tests/playwright/e2e/`
- Remove redundant directories
- Update imports and references

### **Step 3: Clean Up Scripts**
- Update package.json scripts
- Remove references to deleted configs
- Update documentation

---

**This cleanup will result in a clean, organized testing suite with a single optimized Playwright config and consolidated test directories!** 🧹

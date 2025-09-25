# Linting Roadmap - Perfect Build

**Created:** January 25, 2025  
**Status:** 197 warnings remaining (0 errors)  
**Goal:** Perfect, lovely build with 0 errors, 0 warnings

---

## 📊 **CURRENT STATUS**

- **Total Warnings:** 197 (down from 322+)
- **Errors:** 0 ✅
- **Build Status:** ✅ Working
- **Civics Ingestion:** ✅ Working
- **Placeholders:** ✅ All removed

---

## 🎯 **SYSTEMATIC FIX PLAN**

### **Phase 1: Core Infrastructure (COMPLETED ✅)**
- ✅ feature-flags.ts (5 warnings)
- ✅ logger.ts (9 warnings) 
- ✅ objects.ts (2 warnings)

### **Phase 2: Auth & Security (COMPLETED ✅)**
- ✅ idempotency.ts (6 warnings)
- ✅ session-cookies.ts (3 warnings)
- ✅ rate-limit.ts (1 warning)
- ✅ server-actions.ts (2 warnings)
- ✅ security config (1 warning)

### **Phase 3: Components (COMPLETED ✅)**
- ✅ hooks (3 warnings)
- ✅ voting components (2 warnings)
- ✅ pages (2 warnings)
- ✅ PWA integration (1 warning)

### **Phase 4: High-Impact Lib Files (COMPLETED ✅)**
- ✅ admin/store.ts (6 warnings)
- ✅ cache/redis-client.ts (3 warnings)
- ✅ database/performance-monitor.ts (3 warnings)
- ✅ connection-pool.ts (1 warning)
- ✅ cache-strategies.ts (2 warnings)

---

## 🔥 **REMAINING WORK (197 warnings)**

### **Phase 5: Core Lib Files (HIGH PRIORITY)**
- 🔄 **hooks/usePWA.ts** (4 warnings)
- 🔄 **lib/core/database/optimizer.ts** (3 warnings)
- 🔄 **lib/core/feature-flags.ts** (5 warnings)
- 🔄 **lib/database/performance-dashboard.ts** (1 warning)
- 🔄 **lib/database/smart-cache.ts** (1 warning)
- 🔄 **lib/differential-privacy.ts** (1 warning)
- 🔄 **lib/electoral/geographic-feed.ts** (2 warnings)

### **Phase 6: Error Handling Files (MEDIUM PRIORITY)**
- 🔄 **lib/errors/conflict.ts** (4 warnings)
- 🔄 **lib/errors/forbidden.ts** (6 warnings)
- 🔄 **lib/errors/internal-server.ts** (5 warnings)
- 🔄 **lib/errors/not-found.ts** (4 warnings)
- 🔄 **lib/errors/validation.ts** (3 warnings)

### **Phase 7: Integration Files (MEDIUM PRIORITY)**
- 🔄 **lib/integrations/congress-gov/client.ts** (1 warning)
- 🔄 **lib/integrations/fec/client.ts** (1 warning)
- 🔄 **lib/integrations/google-civic/client.ts** (1 warning)
- 🔄 **lib/integrations/google-civic/transformers.ts** (1 warning)
- 🔄 **lib/integrations/govtrack/client.ts** (1 warning)
- 🔄 **lib/integrations/open-states/client.ts** (1 warning)
- 🔄 **lib/integrations/opensecrets/client.ts** (1 warning)

### **Phase 8: Performance & Utility Files (MEDIUM PRIORITY)**
- 🔄 **lib/performance/bundle-monitor.ts** (2 warnings)
- 🔄 **lib/performance/lazy-loading.ts** (2 warnings - React hooks)
- 🔄 **lib/pipelines/data-validation.ts** (3 warnings)
- 🔄 **lib/privacy/retention-policies.ts** (2 warnings)
- 🔄 **lib/security/turnstile.ts** (4 warnings)
- 🔄 **lib/trending/TrendingHashtags.ts** (1 warning)
- 🔄 **lib/util/objects.ts** (2 warnings)
- 🔄 **lib/validation/validator.ts** (4 warnings)
- 🔄 **lib/vote/engine.ts** (4 warnings)
- 🔄 **lib/vote/irv-calculator.ts** (1 warning)
- 🔄 **lib/webauthn/error-handling.ts** (1 warning)
- 🔄 **lib/webauthn/session-management.ts** (1 warning)

### **Phase 9: Shared Core Files (LOW PRIORITY)**
- 🔄 **shared/core/performance/lib/optimized-poll-service.ts** (2 warnings)
- 🔄 **shared/core/performance/lib/performance-monitor-simple.ts** (6 warnings)
- 🔄 **shared/core/performance/lib/performance-monitor.ts** (6 warnings)
- 🔄 **shared/core/performance/lib/performance.ts** (1 warning)
- 🔄 **shared/core/privacy/lib/differential-privacy.ts** (1 warning)
- 🔄 **shared/core/security/lib/csrf-client.ts** (2 warnings)
- 🔄 **shared/core/services/lib/poll-service.ts** (2 warnings)
- 🔄 **shared/utils/lib/logger.ts** (3 warnings)
- 🔄 **shared/utils/lib/usePollWizard.ts** (15 warnings)

### **Phase 10: Test Files (LOW PRIORITY)**
- 🔄 **tests/e2e/helpers/e2e-setup.ts** (2 warnings)
- 🔄 **tests/helpers/supabase-when.ts** (1 warning)
- 🔄 **tests/setup.ts** (1 warning)
- 🔄 **tests/unit/vote/engine.test.ts** (10 warnings)
- 🔄 **tests/unit/vote/vote-engine.test.ts** (3 warnings)
- 🔄 **tests/unit/vote/vote-processor.test.ts** (11 warnings)
- 🔄 **tests/unit/vote/vote-validator.test.ts** (30 warnings)

### **Phase 11: Utility Files (LOW PRIORITY)**
- 🔄 **utils/performance-utils.ts** (1 warning)
- 🔄 **utils/privacy/data-management.ts** (2 warnings)

---

## 🛠️ **FIX STRATEGY**

### **Pattern 1: Object Spreads → withOptional()**
```typescript
// Before
const result = { ...base, ...updates };

// After  
const result = withOptional(base, updates);
```

### **Pattern 2: Object.assign() for Complex Cases**
```typescript
// Before
const result = { ...base, ...updates };

// After
const result = Object.assign({}, base, updates);
```

### **Pattern 3: React Hooks Dependencies**
```typescript
// Fix missing dependencies in useCallback/useMemo
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]); // Add missing dependencies
```

---

## 📈 **PROGRESS TRACKING**

- **Phase 1-4:** ✅ COMPLETED (41 warnings fixed)
- **Phase 5:** 🔄 IN PROGRESS (Core lib files)
- **Phase 6-11:** ⏳ PENDING

**Estimated Completion:** 2-3 hours of focused work

---

## 🎯 **SUCCESS METRICS**

- ✅ **0 Errors** (ACHIEVED)
- 🔄 **0 Warnings** (197 remaining)
- ✅ **Build Working** (ACHIEVED)
- ✅ **Civics Ingestion** (ACHIEVED)
- ✅ **No Placeholders** (ACHIEVED)

---

**Next Action:** Continue with Phase 5 - Core lib files (highest impact)


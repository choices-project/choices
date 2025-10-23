# Codebase Cleanup Plan - Integrated with User/Admin Journey

**Created: January 27, 2025**  
**Purpose: Integrate TypeScript/linting fixes with iterative user/admin journey development**

## 🎯 **Current Status**

- **Total Issues**: 10,704 problems (9,627 errors, 1,077 warnings)
- **Fixable Issues**: 12 errors and 4 warnings potentially fixable with `--fix`
- **Strategy**: Fix issues as we expand user/admin journey tests

## 🚀 **Integrated Cleanup Strategy**

### **Phase 1: Auto-Fixable Issues (Immediate)**
```bash
# Fix auto-fixable issues first
npm run lint:fix
```

### **Phase 2: Journey-Driven Cleanup**
As we expand user/admin journey tests, fix issues in files we touch:

1. **User Journey Expansion** → Fix issues in touched files
2. **Admin Journey Expansion** → Fix issues in touched files  
3. **Database Tracking** → Fix issues in database-related files
4. **Authentication Flows** → Fix issues in auth-related files

### **Phase 3: Systematic Cleanup**
After journey expansion, tackle remaining issues systematically.

## 🔧 **Enhanced Scripts for Integrated Cleanup**

### **Current Scripts (Keep)**
```json
{
  "test:user-journey": "playwright test --config=tests/playwright/configs/playwright.config.progress.ts tests/playwright/e2e/core/user-journey-stage.spec.ts",
  "test:admin-journey": "playwright test --config=tests/playwright/configs/playwright.config.progress.ts tests/playwright/e2e/core/admin-journey-stage.spec.ts",
  "test:both-journeys": "playwright test --config=tests/playwright/configs/playwright.config.progress.ts tests/playwright/e2e/core/user-journey-stage.spec.ts tests/playwright/e2e/core/admin-journey-stage.spec.ts"
}
```

### **New Cleanup Scripts (Add)**
```json
{
  "cleanup:auto-fix": "npm run lint:fix",
  "cleanup:user-journey": "npm run test:user-journey && npm run lint:fix -- tests/playwright/e2e/core/user-journey-stage.spec.ts",
  "cleanup:admin-journey": "npm run test:admin-journey && npm run lint:fix -- tests/playwright/e2e/core/admin-journey-stage.spec.ts",
  "cleanup:both-journeys": "npm run test:both-journeys && npm run lint:fix -- tests/playwright/e2e/core/",
  "cleanup:journey-files": "npm run lint:fix -- tests/playwright/e2e/core/ tests/utils/ tests/registry/",
  "cleanup:all": "npm run cleanup:auto-fix && npm run cleanup:journey-files"
}
```

## 📊 **File-by-File Cleanup Strategy**

### **High Priority Files (Fix First)**
1. **`tests/registry/testIds.ts`** - Duplicate key error
2. **`tests/utils/database-tracker.ts`** - Core testing utility
3. **`tests/playwright/e2e/core/user-journey-stage.spec.ts`** - User journey
4. **`tests/playwright/e2e/core/admin-journey-stage.spec.ts`** - Admin journey

### **Medium Priority Files (Fix During Journey Expansion)**
1. **`lib/supabase/client.ts`** - Database client
2. **`lib/supabase/server.ts`** - Server-side database
3. **`lib/utils/api-logger.ts`** - Logging utilities
4. **`lib/utils/civics-cache.ts`** - Civics functionality

### **Low Priority Files (Fix After Journey Complete)**
1. **`tools/`** - Development tools
2. **`tests/jest/`** - Unit tests
3. **`types/`** - Type definitions

## 🎯 **Journey-Driven Cleanup Process**

### **Step 1: Fix Auto-Fixable Issues**
```bash
npm run cleanup:auto-fix
```

### **Step 2: Fix Journey Test Files**
```bash
npm run cleanup:journey-files
```

### **Step 3: Expand User Journey + Fix Issues**
```bash
# Run user journey test
npm run test:user-journey

# Fix issues in touched files
npm run lint:fix -- tests/playwright/e2e/core/user-journey-stage.spec.ts tests/utils/database-tracker.ts tests/registry/testIds.ts

# Expand user journey test
# Fix issues in new files touched
```

### **Step 4: Expand Admin Journey + Fix Issues**
```bash
# Run admin journey test
npm run test:admin-journey

# Fix issues in touched files
npm run lint:fix -- tests/playwright/e2e/core/admin-journey-stage.spec.ts

# Expand admin journey test
# Fix issues in new files touched
```

### **Step 5: Combined Journey Testing + Fix Issues**
```bash
# Run both journeys
npm run test:both-journeys

# Fix issues in all journey files
npm run cleanup:journey-files
```

## 🔄 **Iterative Cleanup Workflow**

### **Daily Development Cycle**
1. **Run Journey Test** → Identify issues
2. **Fix Auto-Fixable Issues** → `npm run lint:fix`
3. **Fix Manual Issues** → In touched files
4. **Expand Journey** → Add new functionality
5. **Repeat** → Continue until journey complete

### **Weekly Cleanup Cycle**
1. **Run All Journey Tests** → `npm run test:both-journeys`
2. **Fix All Journey Files** → `npm run cleanup:journey-files`
3. **Expand Journeys** → Add new features
4. **Fix New Issues** → In new files touched

## 📈 **Success Metrics**

### **Immediate Goals**
- **Auto-Fixable Issues**: 0 (fix with `npm run lint:fix`)
- **Journey Test Files**: 0 errors
- **Database Tracker**: 0 errors
- **Test Registry**: 0 errors

### **Short-term Goals**
- **User Journey Files**: 0 errors
- **Admin Journey Files**: 0 errors
- **Core Testing Utilities**: 0 errors

### **Long-term Goals**
- **All Journey-Related Files**: 0 errors
- **Database Integration**: 0 errors
- **Authentication Flows**: 0 errors

## 🎯 **Benefits of Integrated Cleanup**

1. **Incremental Progress** - Fix issues as you expand
2. **Context-Aware** - Fix issues in files you're actually using
3. **Journey-Driven** - Cleanup follows your development flow
4. **Sustainable** - Maintain clean codebase as you grow
5. **Focused** - Only fix issues in files you're actively working on

## 🚀 **Next Steps**

1. **Run `npm run cleanup:auto-fix`** - Fix auto-fixable issues
2. **Run `npm run cleanup:journey-files`** - Fix journey test files
3. **Expand user journey** - Add new functionality
4. **Fix issues in touched files** - Clean as you go
5. **Repeat for admin journey** - Same process
6. **Continue iteratively** - Maintain clean codebase

**This approach ensures your codebase stays clean as you expand your user/admin journey tests!**

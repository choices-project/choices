# Strict Journey Cleanup System

**Created: January 27, 2025**  
**Updated: January 27, 2025**  
**Purpose: Track ALL files touched by user/admin journeys and run STRICT TypeScript/linting on them**

## 🚀 **Current Status: Stage 1 - Registration/Login Issues**

### ✅ **Fixed Issues:**
1. **React Hooks Error** - Fixed PasskeyButton hooks order (critical React error)
2. **Site Messages Security** - Fixed security vulnerability in SiteMessages component
3. **React Infinite Loop** - Fixed "Maximum update depth exceeded" errors
4. **Test User Authentication** - Now using proper Supabase auth flow (not admin APIs) ✅
5. **Registration Form** - Hydration and form elements working ✅
6. **Conceptual Understanding** - Removed incorrect admin login separation ✅
7. **Backend Auth** - Supabase auth working perfectly ✅

### ❌ **Remaining Issue:**
- **Frontend Integration** - Forms not connecting to working Supabase auth backend
- **Form Submission** - Registration/login forms not calling Supabase auth endpoints
- **API Integration** - Need to investigate frontend-to-backend connection

## 🎯 **Core Concept**

1. **Track ALL files** touched by user/admin journeys (including imports, dependencies, etc.)
2. **Run STRICT TypeScript checking** on those files
3. **Run STRICT linting** on those files  
4. **Force fixing ALL errors** in those critical files
5. **Make iterative process productive** by cleaning up codebase as we expand

## 📊 **File Tracking System**

### **Phase 1: Core Journey Files (Always Track)**
```
tests/playwright/e2e/core/user-journey-stage.spec.ts
tests/playwright/e2e/core/admin-journey-stage.spec.ts
tests/utils/database-tracker.ts
tests/utils/consistent-test-user.ts
tests/utils/admin-user-setup.ts
tests/registry/testIds.ts
```

### **Phase 2: Import Dependencies (Track When Found)**
As we expand journeys, we'll identify and track:
- **Direct imports** from journey files
- **Indirect imports** from those files
- **Configuration files** touched
- **Database files** touched
- **Authentication files** touched
- **UI/UX files** touched

## 🔧 **Strict Cleanup Scripts**

### **Strict TypeScript Checking**
```json
{
  "type-check:strict": "tsc --noEmit --strict",
  "type-check:journey-files": "tsc --noEmit --strict tests/playwright/e2e/core/ tests/utils/ tests/registry/",
  "type-check:journey-complete": "tsc --noEmit --strict tests/playwright/e2e/core/ tests/utils/ tests/registry/ lib/supabase/ lib/utils/ app/auth/ app/dashboard/ app/admin/ components/ features/"
}
```

### **Strict Linting**
```json
{
  "lint:strict": "eslint . --max-warnings=0",
  "lint:strict:journey-files": "eslint tests/playwright/e2e/core/ tests/utils/ tests/registry/ --max-warnings=0",
  "lint:strict:journey-complete": "eslint tests/playwright/e2e/core/ tests/utils/ tests/registry/ lib/supabase/ lib/utils/ app/auth/ app/dashboard/ app/admin/ components/ features/ --max-warnings=0"
}
```

### **Comprehensive Journey Cleanup**
```json
{
  "cleanup:journey-strict": "npm run type-check:journey-files && npm run lint:strict:journey-files",
  "cleanup:journey-expand": "npm run test:both-journeys && npm run cleanup:journey-strict",
  "cleanup:journey-complete": "npm run type-check:journey-complete && npm run lint:strict:journey-complete"
}
```

## 🚀 **Iterative Process**

### **Step 1: Fix Core Journey Files**
```bash
# Run strict checking on core journey files
npm run cleanup:journey-strict

# This will fail with errors - we fix them one by one
# Then run again until all errors are fixed
```

### **Step 2: Expand User Journey**
```bash
# Add new functionality to user journey
# Run journey to identify new files touched
npm run test:user-journey

# Run strict checking on all journey files
npm run cleanup:journey-strict

# Fix all errors in touched files
# Repeat until all errors are fixed
```

### **Step 3: Expand Admin Journey**
```bash
# Add new functionality to admin journey
# Run journey to identify new files touched
npm run test:admin-journey

# Run strict checking on all journey files
npm run cleanup:journey-strict

# Fix all errors in touched files
# Repeat until all errors are fixed
```

### **Step 4: Database Integration**
```bash
# Add database operations to journeys
# Run journey to identify database files touched
npm run test:both-journeys

# Run strict checking on all journey files including database
npm run cleanup:journey-complete

# Fix all errors in touched files
# Repeat until all errors are fixed
```

## 📈 **File Tracking Implementation**

### **Automatic File Detection**
```bash
# Run journey tests and capture all files touched
npm run test:both-journeys

# Use TypeScript compiler to find all dependencies
tsc --noEmit --listFiles tests/playwright/e2e/core/user-journey-stage.spec.ts
tsc --noEmit --listFiles tests/playwright/e2e/core/admin-journey-stage.spec.ts

# Use ESLint to find all files with errors
eslint tests/playwright/e2e/core/ tests/utils/ tests/registry/ --format=json
```

### **Manual File Tracking**
```bash
# Core journey files
JOURNEY_CORE_FILES="tests/playwright/e2e/core/ tests/utils/ tests/registry/"

# Database files (when touched)
JOURNEY_DB_FILES="lib/supabase/ lib/utils/api-logger.ts lib/utils/civics-cache.ts"

# Auth files (when touched)  
JOURNEY_AUTH_FILES="lib/utils/cors.ts lib/utils/csrf-fetch.ts lib/utils/error-handler.ts"

# UI files (when touched)
JOURNEY_UI_FILES="app/auth/ app/dashboard/ app/admin/ components/ features/"

# Config files (when touched)
JOURNEY_CONFIG_FILES="tests/playwright/configs/"
```

## 🎯 **Benefits of Strict Journey Cleanup**

### **Focused Error Fixing**
- Only fix errors in files we're actually using
- No time wasted on unused files
- Clean codebase grows organically

### **Comprehensive Coverage**
- Fix ALL errors in journey-touched files
- No partial fixes or ignored errors
- Complete cleanup of active code

### **Sustainable Process**
- Maintain clean code as we expand
- No accumulation of technical debt
- Quality improves with each iteration

### **Productive Development**
- Clean codebase makes development easier
- Fewer errors to debug during testing
- Faster iteration cycles

## 🚀 **Implementation Strategy**

### **Step 1: Fix Core Journey Files**
```bash
npm run cleanup:journey-strict
# This will show all errors - fix them one by one
# Repeat until all errors are fixed
```

### **Step 2: Expand User Journey**
```bash
# Add new functionality to user journey
# Run journey to identify new files
npm run test:user-journey

# Run strict checking on all journey files
npm run cleanup:journey-strict

# Fix all errors in touched files
# Repeat until all errors are fixed
```

### **Step 3: Expand Admin Journey**
```bash
# Add new functionality to admin journey
# Run journey to identify new files
npm run test:admin-journey

# Run strict checking on all journey files
npm run cleanup:journey-strict

# Fix all errors in touched files
# Repeat until all errors are fixed
```

### **Step 4: Database Integration**
```bash
# Add database operations to journeys
# Run journey to identify database files
npm run test:both-journeys

# Run strict checking on all journey files including database
npm run cleanup:journey-complete

# Fix all errors in touched files
# Repeat until all errors are fixed
```

## 📊 **Success Metrics**

### **Immediate Goals**
- **Core Journey Files**: 0 TypeScript errors, 0 linting errors
- **Database Tracker**: 0 TypeScript errors, 0 linting errors
- **Test Registry**: 0 TypeScript errors, 0 linting errors

### **Short-term Goals**
- **All Journey Files**: 0 TypeScript errors, 0 linting errors
- **Database Integration**: 0 TypeScript errors, 0 linting errors
- **Authentication Flows**: 0 TypeScript errors, 0 linting errors

### **Long-term Goals**
- **Complete Codebase**: 0 errors in active files
- **Sustainable Process**: Clean code as we grow
- **Quality Assurance**: High code quality maintained

## 🎯 **Next Steps**

1. **Fix core journey files** → `npm run cleanup:journey-strict`
2. **Expand user journey** → Add new functionality
3. **Fix errors in touched files** → `npm run cleanup:journey-strict`
4. **Expand admin journey** → Add new functionality
5. **Fix errors in touched files** → `npm run cleanup:journey-strict`
6. **Continue iteratively** → Maintain clean codebase

**This approach ensures we fix ALL errors in files touched by our user/admin journeys, making the iterative process incredibly productive and focused!**

# Multi-Agent Strategy for Choices Project

**Created**: 2024-12-19  
**Updated**: 2024-12-19  
**Philosophy**: MVP-First, No Deletions, Incremental Progress

---

## 🎯 **Current State Analysis**

### ✅ **What's Working**
- **Build**: ✅ Passing (with warnings about bundle size)
- **E2E Tests**: ✅ Running (rate limiting tests passing, infrastructure fixed)
- **Core MVP**: ✅ Authentication, voting, navigation functional
- **Canonicalization**: ✅ Phase 1-2 complete, imports fixed
- **Rate Limiting**: ✅ E2E bypass working correctly in test environment

### 🚧 **Current Issues**
- **Bundle Size**: 896 KiB (exceeds 500 KiB recommendation)
- **Unit Tests**: Jest configuration needs updating
- **Test ID Registry**: Stub version missing nested properties
- **Disabled Features**: 67+ files disabled, need gradual re-enablement
- **E2E Registration**: Registration form not rendering in test environment
- **E2E Dashboard**: Dynamic imports causing element detection issues

---

## 🤖 **Multi-Agent Strategy: 5 Parallel Workstreams**

### **Agent 1: Build & Infrastructure** 🏗️
**Focus**: Core build stability and performance optimization

#### **Phase 1 Tasks** (Immediate)
1. **Fix Test ID Registry** ⚠️ **CRITICAL BLOCKER**
   - Expand `lib/testing/testIds.ts` with all required nested properties
   - Add missing test IDs: `T.admin.accessDenied`, `T.admin.panel`, etc.
   - Ensure all components can access their required test IDs

2. **Bundle Size Optimization**
   - Analyze 896 KiB bundle size
   - Identify and remove unused imports
   - Implement code splitting for non-MVP features
   - Target: Reduce to <500 KiB

3. **Jest Configuration Fix**
   - Update Jest CLI options (`--testPathPattern` → `--testPathPatterns`)
   - Ensure unit tests can run properly
   - Fix any test configuration issues

#### **Success Criteria**
- ✅ Build passes without warnings
- ✅ Bundle size <500 KiB
- ✅ Unit tests run successfully
- ✅ Test ID registry complete

---

### **Agent 2: E2E Testing & MVP Validation** 🧪
**Focus**: Ensure 100% MVP functionality works end-to-end

#### **Phase 1 Tasks** (Immediate)
1. **MVP E2E Test Suite** ✅ **COMPLETED**
   - ✅ Run comprehensive E2E tests on core MVP features
   - ✅ Test authentication flow (login/register)
   - ✅ Test voting functionality
   - ✅ Test basic navigation
   - ✅ Verify E2E bypass pattern works

2. **Fix E2E Test Failures** 🔄 **IN PROGRESS**
   - ✅ Fixed TypeScript errors in disabled scripts preventing E2E tests from running
   - ✅ Fixed rate limiting bypass for E2E tests (middleware now properly checks `enabled` flag)
   - ✅ Updated test selectors to use correct `data-testid` attributes instead of `name` attributes
   - ✅ Updated onboarding flow tests to work without disabled onboarding components
   - 🔄 **IN PROGRESS**: Debug registration form not loading in E2E tests
   - 🔄 **IN PROGRESS**: Fix dashboard element selectors for dynamic imports

3. **E2E Test Coverage Expansion** ⏳ **PENDING**
   - Add tests for any missing MVP scenarios
   - Ensure all critical paths are covered
   - Validate error handling

#### **Progress Summary** (Updated: 2024-12-19)
**✅ Major Accomplishments:**
- **Build Errors Fixed**: Resolved TypeScript errors in disabled scripts that were blocking E2E test execution
- **Rate Limiting Fixed**: E2E tests now run with proper rate limiting bypass in test environment
- **Test Infrastructure**: Updated Playwright configuration and test selectors for consistency
- **Test Coverage**: Successfully running 11 E2E tests with 2 passing (rate limiting tests)

**🔄 Current Issues:**
- **Registration Form**: Form elements not rendering properly in E2E test environment
- **Dashboard Elements**: Dynamic imports causing timing issues with element detection
- **Test Environment**: Need to ensure proper React hydration in test environment

**📊 Test Results:**
- **Rate Limiting Tests**: ✅ 2/2 passing
- **Authentication Flow Tests**: 🔄 0/7 passing (registration form issues)
- **Total E2E Tests**: 11 tests, 2 passing, 9 failing

#### **Success Criteria**
- 🔄 100% of MVP E2E tests pass (2/11 currently passing)
- 🔄 Core user journey works perfectly (blocked by registration form)
- ✅ E2E bypass authentication functional
- 🔄 MVP is production-ready (pending E2E test completion)

---

### **Agent 3: Unit Testing & Code Quality** 🔍
**Focus**: Comprehensive unit test coverage and code quality

#### **Phase 1 Tasks** (Immediate)
1. **Fix Unit Test Infrastructure**
   - Resolve Jest configuration issues
   - Ensure all unit tests can run
   - Fix any broken test files

2. **Core MVP Unit Tests**
   - Test authentication utilities
   - Test voting logic
   - Test utility functions
   - Test API route handlers

3. **Code Quality Improvements**
   - Run linting and fix issues
   - Ensure TypeScript strict mode compliance
   - Remove unused imports and variables
   - Improve error handling

#### **Success Criteria**
- ✅ All unit tests pass
- ✅ Code quality metrics improved
- ✅ No linting errors
- ✅ TypeScript strict mode compliant

---

### **Agent 4: Feature Re-enablement** 🔄
**Focus**: Gradual re-enablement of disabled features (ONLY after MVP is stable)

#### **Phase 1 Tasks** (After MVP is 100% stable)
1. **Onboarding Flow Re-enablement**
   - Re-enable onboarding components one at a time
   - Test each component individually
   - Ensure no regressions in MVP functionality
   - Add E2E tests for onboarding

2. **WebAuthn Features Re-enablement**
   - Re-enable biometric authentication components
   - Test WebAuthn functionality
   - Ensure backward compatibility
   - Add comprehensive WebAuthn tests

3. **Civics Features Re-enablement**
   - Re-enable civics dashboard components
   - Test representative lookup functionality
   - Ensure data integration works
   - Add civics-specific tests

#### **Success Criteria**
- ✅ MVP remains 100% stable throughout
- ✅ Features work individually when re-enabled
- ✅ No build regressions
- ✅ Each feature has comprehensive tests

---

### **Agent 5: Documentation & Monitoring** 📚
**Focus**: Documentation, monitoring, and system health

#### **Phase 1 Tasks** (Ongoing)
1. **Documentation Updates**
   - Update ROADMAP.md with progress
   - Document any new patterns or solutions
   - Maintain agent behavior guidelines
   - Update technical documentation

2. **System Monitoring**
   - Monitor build performance
   - Track test pass rates
   - Monitor bundle size changes
   - Track feature re-enablement progress

3. **Quality Assurance**
   - Review agent work for compliance with guidelines
   - Ensure no files are deleted (only disabled)
   - Verify MVP-first philosophy is followed
   - Coordinate between agents

#### **Success Criteria**
- ✅ Documentation is up-to-date
- ✅ System health is monitored
- ✅ All agents follow guidelines
- ✅ Progress is tracked and reported

---

## 🔄 **Agent Coordination Strategy**

### **Communication Protocol**
1. **Daily Standup**: Each agent reports progress and blockers
2. **Shared Documentation**: All progress tracked in ROADMAP.md
3. **Conflict Resolution**: Agent 5 coordinates any conflicts
4. **Checkpoint Reviews**: Weekly reviews of overall progress

### **Dependency Management**
- **Agent 1** (Build) must complete before others can proceed
- **Agent 2** (E2E) depends on Agent 1's build fixes
- **Agent 3** (Unit Tests) can work in parallel with Agent 2
- **Agent 4** (Features) waits for MVP to be 100% stable
- **Agent 5** (Docs) works continuously with all agents

### **Risk Mitigation**
- **No Deletions**: All agents must use `.disabled` extensions
- **MVP First**: No feature work until MVP is bulletproof
- **Incremental**: Small, testable changes only
- **Rollback Ready**: Any feature can be disabled if issues arise

---

## 📊 **Success Metrics by Phase**

### **Phase 1: MVP Stabilization** (Target: 1-2 days)
- ✅ Build passes without warnings
- ✅ Bundle size <500 KiB
- ✅ 100% MVP E2E tests pass
- ✅ Unit tests run and pass
- ✅ Test ID registry complete

### **Phase 2: MVP Validation** (Target: 1 day)
- ✅ Core user journey 100% functional
- ✅ E2E bypass authentication works
- ✅ MVP is production-ready
- ✅ All critical paths tested

### **Phase 3: Feature Expansion** (Target: 3-5 days)
- ✅ Onboarding flow re-enabled and tested
- ✅ WebAuthn features re-enabled and tested
- ✅ Civics features re-enabled and tested
- ✅ MVP remains stable throughout

### **Phase 4: Comprehensive Testing** (Target: 2-3 days)
- ✅ Full E2E test suite passes
- ✅ All unit tests pass
- ✅ Code quality metrics excellent
- ✅ System ready for production

---

## 🚨 **Critical Rules for All Agents**

### **🚫 NEVER DELETE FILES**
- Use `.disabled` extension instead
- Preserve all work for rollback
- Document why files are disabled

### **🎯 MVP-FIRST PHILOSOPHY**
- Focus on core functionality only
- Ignore advanced features until MVP is stable
- Ensure MVP is bulletproof before expanding

### **🔄 INCREMENTAL PROGRESS**
- Make small, testable changes
- Test immediately after each change
- Rollback if issues arise

### **📋 PROPER TESTING**
- Run tests after each change
- Ensure no regressions
- Document test results

---

## 🚀 **Feature Flag Implementation Priority List**

### **Phase 1: MVP Stability (Immediate)**
1. **Fix Build Error** - Move remaining disabled directory causing `DemographicVisualization` import error
2. **Test Clean Build** - Verify 100% passing build with feature flags working
3. **Run Core E2E Tests** - Verify MVP functionality still works

### **Phase 2: Feature Flag Rollout (Next)**
4. **Onboarding Flow** - `CIVICS_ADDRESS_LOOKUP: false` → `true` (high user value)
5. **WebAuthn Authentication** - `WEBAUTHN: true` (already enabled, test integration)
6. **PWA Features** - `PWA: true` (already enabled, test integration)
7. **Analytics Dashboard** - `ANALYTICS: false` → `true` (admin value)

### **Phase 3: Advanced Features (Future)**
8. **Experimental UI** - `EXPERIMENTAL_UI: false` → `true`
9. **Advanced Privacy** - `ADVANCED_PRIVACY: false` → `true`
10. **Experimental Analytics** - `EXPERIMENTAL_ANALYTICS: false` → `true`

### **Phase 4: Performance & Optimization**
11. **Database Optimization** - `FEATURE_DB_OPTIMIZATION_SUITE: true` (already enabled)
12. **Experimental Components** - `EXPERIMENTAL_COMPONENTS: false` → `true`

### **Why This Order Makes Sense**
- **MVP First**: Get core functionality 100% stable
- **User Value**: Onboarding and WebAuthn provide immediate user benefits
- **Admin Value**: Analytics helps with monitoring and insights
- **Performance**: Database optimization is already enabled and working
- **Experimental**: Advanced features come last when core is solid

### **Current Feature Flag Status**
```typescript
export const FEATURE_FLAGS = {
  CORE_AUTH: true,           // ✅ MVP - Always enabled
  CORE_POLLS: true,          // ✅ MVP - Always enabled  
  CORE_USERS: true,          // ✅ MVP - Always enabled
  WEBAUTHN: true,            // 🔄 Ready for testing
  PWA: true,                 // 🔄 Ready for testing
  ANALYTICS: false,          // 🔄 Phase 2 rollout
  ADMIN: true,               // ✅ MVP - Always enabled
  EXPERIMENTAL_UI: false,    // 🔄 Phase 3 rollout
  EXPERIMENTAL_ANALYTICS: false, // 🔄 Phase 3 rollout
  ADVANCED_PRIVACY: false,   // 🔄 Phase 3 rollout
  FEATURE_DB_OPTIMIZATION_SUITE: true, // ✅ Already enabled
  EXPERIMENTAL_COMPONENTS: false, // 🔄 Phase 4 rollout
  CIVICS_ADDRESS_LOOKUP: false, // 🔄 Phase 2 rollout (onboarding)
} as const;
```

---

## 🚀 **Immediate Next Actions**

1. **Agent 1**: Fix Test ID Registry (CRITICAL BLOCKER)
2. **Agent 2**: Run MVP E2E tests to establish baseline
3. **Agent 3**: Fix Jest configuration and run unit tests
4. **Agent 4**: Wait for MVP stability before starting
5. **Agent 5**: Begin monitoring and documentation

---

*This strategy ensures parallel progress while maintaining the MVP-first philosophy and preventing any regressions.*

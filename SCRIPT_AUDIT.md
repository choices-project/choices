# 🔍 Script Audit Report

**Date**: $(date)  
**Purpose**: Comprehensive audit of all scripts in the project to identify outdated, temporary, or unnecessary scripts

## 📊 Summary

- **Total Scripts Found**: 46 files
- **JavaScript**: 39 files
- **Shell Scripts**: 5 files  
- **Python**: 2 files

## 🎯 Script Categories

### ✅ **KEEP - Essential & Current**

#### **Core Development Scripts**
- `web/next.config.js` - Next.js configuration (essential)
- `web/jest.config.js` - Jest test configuration (essential)
- `web/jest.setup.js` - Jest setup (essential)
- `web/jest.setup.after.js` - Jest cleanup (essential)
- `web/jest.server.setup.js` - Server-side Jest setup (essential)
- `web/babel.config.js` - Babel configuration (essential)
- `web/postcss.config.js` - PostCSS configuration (essential)
- `web/tailwind.config.js` - Tailwind configuration (essential)
- `web/bundle-analyzer.config.js` - Bundle analysis config (useful)

#### **Security & Quality Scripts**
- `scripts/precommit.sh` - Pre-commit hooks (essential for CI/CD)
- `web/scripts/check-next-sec.js` - Security validation (important)
- `web/scripts/test-security-headers.js` - Security headers check (important)

#### **Database & Schema Scripts**
- `web/scripts/get-live-schema.js` - Live schema extraction (useful for debugging)
- `web/scripts/simple-schema-check.js` - Schema validation (useful)
- `web/scripts/direct-table-check.js` - Direct database access (useful for debugging)

#### **Testing Scripts**
- `web/test-civics-ingest.js` - Civics data testing (MVP critical)
- `web/scripts/validate-webauthn.sh` - WebAuthn validation (security critical)
- `web/scripts/run-webauthn-e2e.sh` - WebAuthn E2E testing (security critical)

### ⚠️ **REVIEW - Potentially Outdated**

#### **Performance & Monitoring**
- `web/scripts/performance-monitor.js` - Basic performance monitoring
  - **Status**: Simple, may be outdated
  - **Action**: Review and update or remove

#### **Bundle & Build Scripts**
- `web/scripts/bundle-size-check.js` - Bundle size monitoring
  - **Status**: Basic implementation
  - **Action**: Review and enhance or remove

#### **Admin Scripts**
- `web/scripts/test-admin.js` - Admin testing
  - **Status**: Placeholder implementation
  - **Action**: Implement properly or remove

#### **Tooling Scripts**
- `web/scripts/ensure-tooling.js` - Environment validation
  - **Status**: Basic Node.js version check
  - **Action**: Review and enhance or remove

### 🗑️ **REMOVE - Outdated/Temporary**

#### **Duplicate Schema Scripts**
- `web/scripts/schema-extractor.js` - Duplicate of get-live-schema.js
  - **Status**: Redundant
  - **Action**: DELETE

#### **Archive Files**
- `web/archive-unused-files/webpack.config.optimized.js` - Archived
- `web/archive-unused-files/next.config.optimized.js` - Archived
  - **Status**: Archived files
  - **Action**: DELETE (already in archive)

#### **Temporary Fix Scripts**
- `web/scripts/fix-no-restricted-syntax.js` - Temporary linting fix
  - **Status**: Temporary, should be replaced with proper fixes
  - **Action**: DELETE after fixing warnings properly

#### **Test Utilities**
- `web/tests/eslint/no-live-supabase.js` - ESLint rule
  - **Status**: May be outdated
  - **Action**: Review and update or remove

#### **Mock Files**
- `web/tests/__mocks__/api-route.js` - Test mock
  - **Status**: May be outdated
  - **Action**: Review and update or remove

#### **Tools**
- `web/tools/error-classify.js` - Error classification
  - **Status**: May be outdated
  - **Action**: Review and update or remove

### 🔧 **UPDATE - Needs Modernization**

#### **K6 Load Testing**
- `web/k6/civics-smoke.js` - Load testing script
  - **Status**: Basic implementation
  - **Action**: Update and enhance

#### **Python Scripts**
- `tests/test_report.py` - Test reporting
- `scripts/rls_smoke.py` - RLS testing
  - **Status**: May be outdated
  - **Action**: Review and update or remove

#### **Service Workers**
- `web/public/sw.js` - Service worker
- `web/public/workbox-a2829622.js` - Workbox
  - **Status**: May be outdated
  - **Action**: Review and update

## 🎯 **Recommended Actions**

### **Immediate (High Priority)**
1. **DELETE** `web/scripts/schema-extractor.js` (duplicate)
2. **DELETE** `web/scripts/fix-no-restricted-syntax.js` (temporary)
3. **DELETE** archive files in `web/archive-unused-files/`
4. **UPDATE** `web/scripts/test-admin.js` (implement properly)
5. **REVIEW** `web/scripts/performance-monitor.js` (enhance or remove)

### **Short Term (Medium Priority)**
1. **UPDATE** `web/scripts/bundle-size-check.js` (enhance functionality)
2. **UPDATE** `web/scripts/ensure-tooling.js` (add more checks)
3. **REVIEW** Python scripts for relevance
4. **UPDATE** K6 scripts for current testing needs

### **Long Term (Low Priority)**
1. **CONSOLIDATE** similar scripts where possible
2. **DOCUMENT** all remaining scripts
3. **AUTOMATE** script execution where appropriate

## 🚨 **Security Considerations**

### **Scripts with Database Access**
- `web/scripts/get-live-schema.js` - Uses service key
- `web/scripts/simple-schema-check.js` - Uses service key  
- `web/scripts/direct-table-check.js` - Uses service key
- `web/test-civics-ingest.js` - Uses service key

**Recommendation**: Ensure these scripts are properly secured and not committed with real credentials.

### **Scripts with File System Access**
- `scripts/precommit.sh` - Accesses staged files
- `web/scripts/performance-monitor.js` - Reads build artifacts
- `web/scripts/bundle-size-check.js` - Reads build artifacts

**Recommendation**: Ensure proper error handling and security checks.

## 📋 **Next Steps**

1. **Create cleanup script** to remove identified outdated scripts
2. **Update remaining scripts** with proper error handling
3. **Add documentation** for all essential scripts
4. **Implement script versioning** for critical scripts
5. **Add script testing** for complex scripts

---

**Status**: 🔍 Audit Complete  
**Next Action**: Execute cleanup and updates based on recommendations

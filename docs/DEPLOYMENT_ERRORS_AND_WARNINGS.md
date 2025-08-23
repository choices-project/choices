# Deployment Errors and Warnings Documentation

**Created**: August 23, 2025  
**Last Updated**: August 23, 2025  
**Purpose**: Document all deployment errors and warnings encountered during Vercel deployment

## 🚨 Critical Build Errors

### 1. Next.js Version Detection Error
**Error**: `No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies"`
**Status**: ✅ **RESOLVED** - Added `"next": "^14.2.31"` to root `package.json`

### 2. Missing Build Script Error
**Error**: `Missing script: "build"`
**Status**: ✅ **RESOLVED** - Added `"build": "cd web && npm install && npm run build"` to root `package.json`

### 3. Next.js Config Import Error
**Error**: `Failed to load next.config.mjs` - `TypeError: withPWA(...) is not a function`
**Status**: ✅ **RESOLVED** - Fixed PWA import and configuration

### 4. Module Not Found Errors
**Error**: `Cannot find package 'next-pwa' imported from /vercel/path0/web/next.config.mjs`
**Status**: ✅ **RESOLVED** - Added `"next-pwa": "^5.6.0"` to root `package.json`

### 5. CSS Processing Error
**Error**: `Cannot find module 'autoprefixer'`
**Status**: ❌ **PENDING** - Need to add autoprefixer to dependencies

### 6. Internal Module Resolution Errors
**Errors**:
- `Module not found: Can't resolve '@/hooks/useAuth'`
- `Module not found: Can't resolve '@/components/ui/button'`
- `Module not found: Can't resolve '@/components/ui/card'`
- `Module not found: Can't resolve '@/components/ui/alert'`
**Status**: ❌ **PENDING** - Path resolution issues in build environment

## ⚠️ Deprecation Warnings (High Priority)

### 1. Supabase Auth Helpers (CRITICAL)
**Warning**: 
- `@supabase/auth-helpers-shared@0.7.0: This package is now deprecated - please use the @supabase/ssr package`
- `@supabase/auth-helpers-nextjs@0.10.0: This package is now deprecated - please use the @supabase/ssr package`
**Impact**: Security and functionality issues
**Action Required**: Migrate to `@supabase/ssr` package

### 2. ESLint Version (CRITICAL)
**Warning**: `eslint@8.57.1: This version is no longer supported.`
**Impact**: Build and linting issues
**Action Required**: Upgrade to supported ESLint version

### 3. Workbox Packages (MEDIUM)
**Warnings**:
- `workbox-cacheable-response@6.6.0: workbox-background-sync@6.6.0`
- `workbox-google-analytics@6.6.0: It is not compatible with newer versions of GA starting with v4`
**Impact**: PWA functionality may be affected
**Action Required**: Update Workbox packages

## ⚠️ Deprecation Warnings (Medium Priority)

### 4. Build Tools
**Warnings**:
- `rollup-plugin-terser@7.0.2: This package has been deprecated and is no longer maintained. Please use @rol`
- `rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported`
- `glob@7.2.3: Glob versions prior to v9 are no longer supported`
**Impact**: Build performance and reliability
**Action Required**: Update to newer versions

### 5. Source Map Tools
**Warnings**:
- `sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead`
- `source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions`
**Impact**: Debugging and source map functionality
**Action Required**: Update to stable versions

### 6. Type Definitions
**Warning**: `@types/minimatch@6.0.0: This is a stub types definition. minimatch provides its own type definitions`
**Impact**: TypeScript type checking
**Action Required**: Remove redundant type package

## ⚠️ Deprecation Warnings (Low Priority)

### 7. Utility Packages
**Warning**: `inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you`
**Impact**: Memory leaks
**Action Required**: Replace with lru-cache

## 🔧 Build Configuration Issues

### 1. Monorepo Structure
**Issue**: Vercel build process not properly handling monorepo structure
**Current Solution**: Custom build script `cd web && npm install && npm run build`
**Status**: ⚠️ **PARTIALLY WORKING** - Still encountering module resolution issues

### 2. Path Resolution
**Issue**: `@/` path aliases not resolving in build environment
**Status**: ❌ **PENDING** - Need to configure path mapping for build

### 3. CSS Processing Pipeline
**Issue**: Missing PostCSS dependencies (autoprefixer)
**Status**: ❌ **PENDING** - Need to add autoprefixer and related packages

## 📋 Action Items

### Immediate (Blocking Deployment)
1. ✅ Add `autoprefixer` to root `package.json`
2. ✅ Fix path resolution for `@/` aliases
3. ✅ Ensure all UI components are properly exported

### High Priority (Security/Functionality)
1. 🔄 Migrate from deprecated Supabase auth helpers to `@supabase/ssr`
2. 🔄 Upgrade ESLint to supported version
3. 🔄 Update Workbox packages for PWA functionality

### Medium Priority (Performance/Reliability)
1. 🔄 Update build tools (rollup-plugin-terser, rimraf, glob)
2. 🔄 Update source map tools
3. 🔄 Remove redundant type packages

### Low Priority (Maintenance)
1. 🔄 Replace inflight with lru-cache
2. 🔄 Review and update other deprecated packages

## 🎯 Success Metrics

- [ ] Successful Vercel deployment without errors
- [ ] All critical warnings resolved
- [ ] PWA functionality working
- [ ] No deprecated packages in use
- [ ] Build time under 2 minutes
- [ ] Zero security vulnerabilities

## 📝 Notes

- The build script `cd web && npm install && npm run build` is working for dependency installation
- Next.js detection and PWA configuration are now functional
- Main remaining issues are module resolution and CSS processing
- Many warnings are from transitive dependencies and may require updates to parent packages

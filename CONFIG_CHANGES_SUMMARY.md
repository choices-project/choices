# Configuration Changes Summary

## Date: November 6, 2025

This document summarizes all configuration changes made to ensure consistency, correctness, best practices, and optimal performance.

## Files Deleted

### ESLint Legacy Configs
- ✅ `web/.eslintrc.cjs` - Migrated to flat config
- ✅ `web/.eslintrc.type-aware.cjs` - Merged into flat config
- ✅ `web/.eslintrc.timeout.js` - Invalid config (contained CLI flags, not config options)

### Jest Duplicate Configs
- ✅ `web/jest.client.config.js` - Duplicate of project in jest.config.cjs
- ✅ `web/jest.server.config.js` - Duplicate of project in jest.config.cjs

## Files Modified

### ESLint Configuration
**File:** `web/eslint.config.js`
- ✅ Merged all rules from legacy `.eslintrc.cjs`
- ✅ Enabled boundaries plugin with architectural rules
- ✅ Added legacy path blocking rules
- ✅ Removed duplicate import resolver configuration
- ✅ Added RSC-safe import rules
- ✅ Added test file configurations
- ✅ Added UI component overrides
- ✅ Improved ignore patterns

### Docker Configuration
**File:** `Dockerfile.web`
- ✅ Updated Node version from 18 to 24 (matches package.json requirement)

### Next.js Configuration
**File:** `web/next.config.js`
- ✅ Moved `swcMinify: true` to top level (was incorrectly in experimental)
- ✅ Set `eslint.ignoreDuringBuilds: false` (was hiding errors)
- ✅ Fixed webpack DefinePlugin to use actual `undefined` instead of string `'undefined'`
- ✅ Simplified bundle splitting while maintaining optimization
- ✅ Enabled `output: 'standalone'` for Docker compatibility

### TypeScript Configurations

**File:** `package.json` (root)
- ✅ Updated TypeScript from 5.9.2 to 5.7.2 (aligns with web)
- ✅ Updated pg from 8.16.3 to 8.13.1 (aligns with web)
- ✅ Updated zod from 4.1.8 to 4.1.3 (aligns with web)

**File:** `tsconfig.base.json`
- ✅ Changed `jsx` from "react-jsx" to "preserve" (Next.js standard)
- ✅ Added `isolatedModules: true`
- ✅ Removed path aliases (belong in web/tsconfig.json)

**File:** `web/tsconfig.json`
- ✅ Added `extends: "../tsconfig.base.json"` for proper inheritance
- ✅ Kept Next.js-specific settings (jsx: preserve, plugins)
- ✅ Simplified to avoid duplication with base

**File:** `web/tsconfig.eslint.json`
- ✅ Narrowed include patterns to specific file types (performance optimization)
- ✅ Excluded test files (don't need type-aware linting)

### Vercel Configuration
**File:** `vercel.json`
- ✅ Removed duplicate security headers (comprehensive headers already in next.config.js)

### Tailwind Configuration
**File:** `web/tailwind.config.js`
- ✅ Added `features/` directory to content array

### Sentry Configurations
**Files:** `web/sentry.client.config.ts`, `web/sentry.server.config.ts`
- ✅ Changed from `require()` to dynamic `import()`
- ✅ Removed console.log from catch blocks

### Babel Configuration
**File:** `web/babel.config.js`
- ✅ Added browser targets for better optimization
- ✅ Added `useBuiltIns: 'usage'` with core-js
- ✅ Added production plugin to remove console statements
- ✅ Added `onlyRemoveTypeImports: true` for TypeScript

### Playwright Configuration
**File:** `web/playwright.config.ts`
- ✅ Removed commented-out webServer section
- ✅ Cleaned up config

### PostCSS Configuration
**File:** `web/postcss.config.cjs`
- ✅ Added cssnano for production minification

## Files Added

### Code Quality & Consistency
- ✅ `.prettierrc` - Prettier configuration for consistent formatting
- ✅ `.editorconfig` - Cross-editor consistency configuration

### Package Management
- ✅ `.npmrc` - NPM optimization settings (prefer-offline, prefer-dedupe, security)

### Dependency Management
- ✅ `renovate.json` - Automated dependency updates with smart grouping and scheduling

## Configuration Hierarchy Established

### TypeScript Inheritance
```
tsconfig.base.json (strict settings, shared config)
  ├── tsconfig.json (root, for monorepo)
  ├── tsconfig.ci.json (CI-specific)
  ├── tsconfig.tests.json (test-specific)
  └── web/tsconfig.json (Next.js app)
      └── web/tsconfig.eslint.json (ESLint optimization)
```

### ESLint System
- Single flat config: `web/eslint.config.js`
- All legacy configs removed
- Boundaries plugin enabled
- Type-aware rules integrated

### Jest System
- Single config: `web/jest.config.cjs`
- Two projects: client (jsdom) and server (node)
- Duplicate configs removed

## Key Improvements

### Consistency
- ✅ All TypeScript versions aligned (5.7.2)
- ✅ All shared dependencies aligned (pg, zod)
- ✅ Node version consistent across all configs (24.11.0)

### Correctness
- ✅ No more invalid ESLint config options
- ✅ Webpack DefinePlugin uses proper undefined values
- ✅ Docker Node version matches package.json requirements
- ✅ Standalone output enabled for Docker

### Best Practices
- ✅ Proper TypeScript inheritance hierarchy
- ✅ Separated concerns (base vs. app-specific configs)
- ✅ Modern ESLint flat config system
- ✅ Automated dependency management with Renovate
- ✅ Code formatting with Prettier
- ✅ Cross-editor consistency with EditorConfig

### Performance
- ✅ Optimized tsconfig.eslint.json (fewer files to check)
- ✅ Simplified Next.js bundle splitting
- ✅ PostCSS minification in production
- ✅ Babel optimization for modern browsers
- ✅ NPM offline-first configuration

## Verification Checklist

- [x] All legacy ESLint configs deleted
- [x] Duplicate Jest configs removed
- [x] TypeScript versions aligned
- [x] Shared dependency versions aligned
- [x] Docker Node version matches package.json
- [x] Next.js standalone output enabled
- [x] ESLint flat config includes all rules
- [x] Boundaries plugin enabled
- [x] TypeScript configs properly inherit
- [x] Vercel headers deduplicated
- [x] Tailwind includes features directory
- [x] Sentry uses dynamic imports
- [x] Babel optimized for production
- [x] Prettier configuration added
- [x] EditorConfig added
- [x] Enhanced .npmrc added
- [x] Renovate configuration added
- [x] PostCSS includes cssnano

## Next Steps

1. Run `npm install` in root and web directories to pick up .npmrc changes
2. Consider running `npx prettier --write .` to format all files
3. Test ESLint with: `cd web && npm run lint`
4. Test TypeScript with: `npm run types:ci`
5. Test Jest with: `cd web && npm test`
6. Test Playwright with: `cd web && npm run test:e2e`
7. Test Docker build: `docker build -f Dockerfile.web -t choices-web .`

## Notes

- The bundle-analyzer.config.js file exists but isn't currently imported anywhere. Consider either integrating it into next.config.js or documenting it as a reference file.
- Many npm scripts use `gtimeout` (GNU timeout) which may not work on all systems. Consider cross-platform alternatives or document the requirement.
- Ensure Renovate is enabled in your repository settings to activate automated dependency updates.


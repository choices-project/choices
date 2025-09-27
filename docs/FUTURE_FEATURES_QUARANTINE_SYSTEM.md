# Future Features Quarantine System

**Created**: September 27, 2025  
**Updated**: September 27, 2025  

## Overview

This document outlines the proper system for quarantining future features to prevent CodeQL, linting, and type checking issues from affecting incomplete features.

## Current Problem

We have future features scattered across multiple directories:
- `web/archive-future-work/` - Some archived work
- `web/dev/lib/` - Development libraries  
- `web/lib/` - Core libraries with future features
- `web/features/` - Feature components
- `web/components/` - UI components

This causes issues with:
- CodeQL security scanning
- TypeScript strict checking
- ESLint warnings
- CI/CD pipeline failures

## Recommended Quarantine System

### **1. Directory Structure**

```
web/
├── lib/
│   ├── core/           # Production-ready core features
│   └── future/         # Quarantined future features
├── features/
│   ├── auth/           # Production auth features
│   └── future/         # Quarantined future features
├── components/
│   ├── auth/           # Production components
│   └── future/         # Quarantined future components
└── dev/
    └── lib/            # Development-only libraries
```

### **2. Quarantine Rules**

#### **For Future Features:**
1. **Move to `web/lib/future/`** - Core future features
2. **Move to `web/features/future/`** - Feature-specific future work
3. **Move to `web/components/future/`** - Future UI components
4. **Keep in `web/dev/lib/`** - Development utilities only

#### **For Each Quarantined File:**
1. **Add feature flag guard at top**
2. **Add `// @ts-nocheck` for TypeScript issues**
3. **Add `/* eslint-disable */` for linting issues**
4. **Add clear documentation header**

### **3. File Header Template**

```typescript
/**
 * [Feature Name] - [Brief Description]
 * 
 * @status FUTURE_FEATURE - Not ready for production
 * @feature_flag [FEATURE_FLAG_NAME] - Requires feature flag to be enabled
 * @quarantine_reason [Reason for quarantine]
 * @todo [What needs to be completed]
 * 
 * This file is quarantined to prevent CI/CD issues.
 * Do not remove quarantine until feature is complete.
 */

// @ts-nocheck
/* eslint-disable */

import { FEATURE_FLAGS } from '@/lib/core/feature-flags'

// Feature flag guard - disable if not enabled
if (!FEATURE_FLAGS.[FEATURE_FLAG_NAME]) {
  console.warn('[Feature Name] is disabled via feature flag')
}
```

## Implementation Plan

### **Phase 1: Identify All Future Features**

#### **Current Future Features to Quarantine:**

1. **Device Flow Authentication** (80% complete)
   - `web/lib/core/auth/device-flow.ts`
   - `web/app/api/auth/device-flow/`
   - `web/components/auth/DeviceFlowAuth.tsx`
   - `web/features/auth/pages/device-flow/`

2. **Social Sharing** (60% complete)
   - `web/lib/social-sharing.ts`
   - `web/features/auth/components/SocialLoginButtons.tsx`
   - `web/components/auth/SocialSignup.tsx`
   - `web/archive-future-work/social/`

3. **Automated Polls** (Development)
   - `web/dev/lib/automated-polls.ts`

4. **Media Bias Analysis** (Development)
   - `web/dev/lib/media-bias-analysis.ts`

5. **Poll Narrative System** (70% complete)
   - `web/dev/lib/poll-narrative-system.ts`

6. **Contact Information System** (50% complete)
   - `web/database/contact-information-schema.sql`

### **Phase 2: Move and Quarantine**

#### **Move Files to Quarantine Directories:**

```bash
# Create quarantine directories
mkdir -p web/lib/future
mkdir -p web/features/future
mkdir -p web/components/future

# Move device flow
mv web/lib/core/auth/device-flow.ts web/lib/future/
mv web/components/auth/DeviceFlowAuth.tsx web/components/future/
mv web/features/auth/pages/device-flow/ web/features/future/

# Move social features
mv web/lib/social-sharing.ts web/lib/future/
mv web/features/auth/components/SocialLoginButtons.tsx web/features/future/
mv web/components/auth/SocialSignup.tsx web/components/future/

# Move archived work
mv web/archive-future-work/social/ web/features/future/social/
```

#### **Update Import Paths:**

```typescript
// Update imports in quarantined files
import { FEATURE_FLAGS } from '@/lib/core/feature-flags'

// Update imports in production files
import { DeviceFlowManager } from '@/lib/future/device-flow'
import { SocialSharing } from '@/lib/future/social-sharing'
```

### **Phase 3: Add Quarantine Headers**

#### **Example: Device Flow Quarantine**

```typescript
/**
 * Device Flow Authentication System
 * 
 * @status FUTURE_FEATURE - 80% complete, not integrated
 * @feature_flag DEVICE_FLOW_AUTH - Requires feature flag to be enabled
 * @quarantine_reason Not integrated into main auth flow, missing database schema
 * @todo Complete integration, add database schema, security audit
 * 
 * This file is quarantined to prevent CI/CD issues.
 * Do not remove quarantine until feature is complete.
 */

// @ts-nocheck
/* eslint-disable */

import { FEATURE_FLAGS } from '@/lib/core/feature-flags'

// Feature flag guard - disable if not enabled
if (!FEATURE_FLAGS.DEVICE_FLOW_AUTH) {
  console.warn('Device Flow Authentication is disabled via feature flag')
}
```

### **Phase 4: Update CI/CD Configuration**

#### **Exclude Quarantined Directories:**

```yaml
# .github/workflows/test.yml
- name: Type Check
  run: |
    npx tsc --noEmit --skipLibCheck \
      --exclude "web/lib/future/**/*" \
      --exclude "web/features/future/**/*" \
      --exclude "web/components/future/**/*"

- name: Lint
  run: |
    npx eslint . \
      --ignore-pattern "web/lib/future/**/*" \
      --ignore-pattern "web/features/future/**/*" \
      --ignore-pattern "web/components/future/**/*"
```

#### **Update TypeScript Config:**

```json
// tsconfig.json
{
  "exclude": [
    "web/lib/future/**/*",
    "web/features/future/**/*", 
    "web/components/future/**/*",
    "web/dev/lib/**/*"
  ]
}
```

#### **Update ESLint Config:**

```javascript
// .eslintrc.cjs
module.exports = {
  ignorePatterns: [
    'web/lib/future/**/*',
    'web/features/future/**/*',
    'web/components/future/**/*',
    'web/dev/lib/**/*'
  ]
}
```

## Benefits of Quarantine System

### **1. Clean CI/CD**
- No CodeQL issues from incomplete features
- No TypeScript errors from incomplete code
- No ESLint warnings from experimental code
- Faster CI/CD pipeline

### **2. Clear Development Status**
- Easy to identify future features
- Clear documentation of completion status
- Proper feature flag integration
- No confusion about what's production-ready

### **3. Safe Development**
- Can work on features without breaking CI
- Easy to enable/disable features
- Clear separation of concerns
- Proper version control

## Migration Checklist

### **For Each Future Feature:**

- [ ] Move to appropriate quarantine directory
- [ ] Add quarantine header with documentation
- [ ] Add `// @ts-nocheck` and `/* eslint-disable */`
- [ ] Add feature flag guard
- [ ] Update import paths in production code
- [ ] Update CI/CD configuration
- [ ] Test that feature is properly disabled
- [ ] Document in future features documentation

### **For Production Code:**

- [ ] Remove imports of quarantined features
- [ ] Add feature flag checks before using future features
- [ ] Update documentation to reflect quarantine status
- [ ] Test that production code still works

## Conclusion

The quarantine system provides a clean, organized way to handle future features without breaking CI/CD or causing confusion about what's production-ready. This approach allows for safe development of new features while maintaining a stable production codebase.

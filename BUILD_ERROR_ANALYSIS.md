# Build Error Analysis & Multi-Agent Fix Plan

## Overview
This document categorizes all current build errors by discrete phases that multiple AI agents can work on in parallel. Each phase is self-contained and can be tackled independently.

## Error Categories & Phases

### **Phase 1: Missing Dependencies & Webpack Configuration** 🔧
**Priority**: CRITICAL - Blocks all builds
**Agent Assignment**: Infrastructure/DevOps Agent

#### Errors:
1. **Missing `ignore-loader` dependency**
   - **Error**: `Module not found: Can't resolve 'ignore-loader'`
   - **Location**: `web/next.config.js` webpack rules
   - **Impact**: Build completely fails
   - **Fix**: Install `ignore-loader` package or use alternative exclusion method

2. **Next.js config module type warning**
   - **Error**: `Module type of file:///next.config.js is not specified`
   - **Location**: `web/next.config.js`
   - **Impact**: Performance overhead, warnings
   - **Fix**: Add `"type": "module"` to package.json or convert to CommonJS

3. **Webpack callback parameter types**
   - **Error**: `Binding element 'request' implicitly has an 'any' type`
   - **Location**: `web/next.config.js:119`
   - **Impact**: TypeScript strict mode errors
   - **Fix**: Add proper TypeScript types for webpack callback parameters

#### Files to Fix:
- `web/next.config.js`
- `web/package.json` (add ignore-loader dependency)

---

### **Phase 2: TypeScript Strict Mode Errors** 📝
**Priority**: HIGH - Blocks TypeScript compilation
**Agent Assignment**: TypeScript/Type Safety Agent

#### Errors:
1. **Missing `gtag` type declarations**
   - **Error**: `Property 'gtag' does not exist on type 'Window & typeof globalThis'`
   - **Locations**: 
     - `components/EnhancedFeedbackWidget.tsx` (4 instances)
     - `features/voting/components/ApprovalVoting.tsx` (2 instances)
     - `features/voting/components/QuadraticVoting.tsx` (2 instances)
     - `features/voting/components/RangeVoting.tsx` (2 instances)
     - `features/voting/components/RankedChoiceVoting.tsx` (2 instances)
     - `features/voting/components/SingleChoiceVoting.tsx` (2 instances)
     - `lib/social-sharing.ts` (2 instances)
   - **Impact**: TypeScript compilation fails
   - **Fix**: Add Google Analytics type declarations or create custom types

2. **Exact optional property types**
   - **Error**: `Argument of type '{ url: string; text: string; hashtags: string[] | undefined; via: string | undefined; }' is not assignable to parameter of type 'ShareInput'`
   - **Location**: `components/social/EnhancedPollShare.tsx:52`
   - **Impact**: TypeScript strict mode violation
   - **Fix**: Update ShareInput interface or handle undefined values properly

3. **Missing required properties**
   - **Error**: `Property 'pollId' is missing in type '{}' but required in type 'EnhancedPollShareProps'`
   - **Location**: `components/social/LazySocialShare.tsx:50`
   - **Impact**: TypeScript compilation error
   - **Fix**: Add proper prop types to LazySocialShare component

4. **Undefined object access**
   - **Error**: `Object is possibly 'undefined'`
   - **Location**: `lib/social-sharing.ts:164`
   - **Impact**: TypeScript strict null checks
   - **Fix**: Add null checks or optional chaining

#### Files to Fix:
- `web/lib/types/global.d.ts` (add gtag types)
- `web/lib/share.ts` (fix ShareInput interface)
- `web/components/social/EnhancedPollShare.tsx`
- `web/components/social/LazySocialShare.tsx`
- `web/lib/social-sharing.ts`

---

### **Phase 3: Missing Module Dependencies** 📦
**Priority**: HIGH - Blocks component loading
**Agent Assignment**: Component/Module Agent

#### Errors:
1. **Missing CivicsShare component**
   - **Error**: `Cannot find module './CivicsShare' or its corresponding type declarations`
   - **Location**: `components/social/LazySocialShare.tsx:15`
   - **Impact**: Lazy loading fails
   - **Fix**: Create CivicsShare component or remove import

2. **Missing SocialSignup component**
   - **Error**: `Cannot find module './SocialSignup' or its corresponding type declarations`
   - **Location**: `components/social/LazySocialShare.tsx:16`
   - **Impact**: Lazy loading fails
   - **Fix**: Create SocialSignup component or remove import

#### Files to Fix:
- `web/components/social/CivicsShare.tsx` (create)
- `web/components/social/SocialSignup.tsx` (create)

---

### **Phase 4: Logic & Function Errors** 🐛
**Priority**: MEDIUM - Runtime errors
**Agent Assignment**: Logic/Bug Fix Agent

#### Errors:
1. **Always true conditions**
   - **Error**: `This condition will always return true since this function is always defined. Did you mean to call it instead?`
   - **Locations**:
     - `components/social/EnhancedPollShare.tsx:124`
     - `components/social/ViralShareButton.tsx:181`
   - **Impact**: Logic errors, potential runtime issues
   - **Fix**: Fix condition logic or function calls

2. **Duplicate variable declarations**
   - **Error**: `Cannot redeclare block-scoped variable 'handleSocialShare'`
   - **Location**: `features/polls/components/PollShare.tsx` (lines 52, 139)
   - **Impact**: JavaScript compilation error
   - **Fix**: Rename or scope variables properly

3. **Invalid argument types**
   - **Error**: `Argument of type '"email"' is not assignable to parameter of type '"facebook" | "linkedin" | "twitter" | "instagram" | "tiktok"'`
   - **Location**: `features/polls/components/PollShare.tsx:219`
   - **Impact**: Type mismatch, runtime errors
   - **Fix**: Update function signature or argument type

#### Files to Fix:
- `web/components/social/EnhancedPollShare.tsx`
- `web/components/social/ViralShareButton.tsx`
- `web/features/polls/components/PollShare.tsx`

---

### **Phase 5: Social Sharing Integration** 🔗
**Priority**: MEDIUM - Feature functionality
**Agent Assignment**: Social Features Agent

#### Tasks:
1. **Create missing social components**
   - Create `CivicsShare.tsx` component
   - Create `SocialSignup.tsx` component
   - Ensure proper feature flag integration

2. **Fix social sharing logic**
   - Resolve duplicate function declarations
   - Fix platform type mismatches
   - Ensure proper error handling

3. **Test social sharing flow**
   - Verify feature flags work correctly
   - Test lazy loading behavior
   - Validate share URL generation

#### Files to Create/Fix:
- `web/components/social/CivicsShare.tsx` (new)
- `web/components/social/SocialSignup.tsx` (new)
- `web/features/polls/components/PollShare.tsx` (fix)

---

## Implementation Strategy

### **Parallel Execution Plan**
1. **Agent 1**: Fix Phase 1 (Dependencies & Webpack) - CRITICAL
2. **Agent 2**: Fix Phase 2 (TypeScript Errors) - HIGH
3. **Agent 3**: Fix Phase 3 (Missing Modules) - HIGH
4. **Agent 4**: Fix Phase 4 (Logic Errors) - MEDIUM
5. **Agent 5**: Fix Phase 5 (Social Integration) - MEDIUM

### **Dependencies Between Phases**
- **Phase 1** must be completed first (blocks all builds)
- **Phase 2** can run in parallel with Phase 3
- **Phase 4** depends on Phase 3 (missing modules)
- **Phase 5** depends on Phases 2, 3, and 4

### **Success Criteria**
- [ ] Build completes without errors
- [ ] TypeScript compilation passes
- [ ] All social components load correctly
- [ ] Feature flags work as expected
- [ ] No runtime errors in social sharing

## Quick Fixes for Immediate Testing

### **1. Install Missing Dependency**
```bash
cd web && npm install --save-dev ignore-loader
```

### **2. Add Google Analytics Types**
```typescript
// web/lib/types/global.d.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
```

### **3. Fix Webpack Config**
```javascript
// web/next.config.js - Add proper types
config.externals.push(({ request }: { request: string }, callback: Function) => {
  // ... existing logic
});
```

### **4. Create Missing Components**
```typescript
// web/components/social/CivicsShare.tsx
export default function CivicsShare() {
  return <div>Civics sharing component</div>;
}

// web/components/social/SocialSignup.tsx
export default function SocialSignup() {
  return <div>Social signup component</div>;
}
```

## Testing Strategy

### **After Each Phase**
1. Run `npm run types:strict` to check TypeScript
2. Run `npm run build` to verify build success
3. Test feature flags are working
4. Verify no runtime errors

### **Final Integration Test**
1. Enable `SOCIAL_SHARING_POLLS` feature flag
2. Test poll sharing functionality
3. Verify OG image generation
4. Check analytics tracking
5. Validate bundle size remains <500KB

## Rollback Plan

If any phase introduces breaking changes:
1. Revert the specific phase changes
2. Keep other phases intact
3. Re-test build and functionality
4. Address issues incrementally

## Expected Timeline

- **Phase 1**: 30 minutes (critical path)
- **Phase 2**: 45 minutes (parallel with Phase 3)
- **Phase 3**: 30 minutes (parallel with Phase 2)
- **Phase 4**: 60 minutes (depends on Phase 3)
- **Phase 5**: 90 minutes (depends on Phases 2-4)

**Total Estimated Time**: 3-4 hours with parallel execution

## Success Metrics

- [ ] Build completes successfully
- [ ] All TypeScript errors resolved
- [ ] Social sharing features work when enabled
- [ ] Bundle size remains under 500KB
- [ ] No runtime errors in production
- [ ] Feature flags properly control functionality

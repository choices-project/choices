# Social Sharing Implementation Plan

**Created:** January 21, 2025  
**Status:** 🔄 **PARTIALLY IMPLEMENTED (60%)**  
**Feature Flag:** `SOCIAL_SHARING: false`  
**Purpose:** Feature-flagged social sharing system with lazy loading

## Overview
Implement a feature-flagged social sharing system that won't impact MVP bundle size or performance. All social sharing components will be lazy-loaded and completely excluded from the main bundle when disabled.

## Current Implementation Status

### ✅ **IMPLEMENTED COMPONENTS**
- **Share API Endpoint**: `web/app/api/share/route.ts` - Complete API for tracking shares
- **Share Utilities**: `web/lib/share.ts` - Platform-specific share URL generation  
- **Social Sharing Utils**: `web/quarantine/future-features/social-sharing/social-sharing.ts.disabled` - Content generation for sharing (QUARANTINED)
- **Social Login Buttons**: `web/quarantine/future-features/social-sharing/SocialLoginButtons.tsx.disabled` - OAuth provider buttons (QUARANTINED)
- **Social Signup**: `web/quarantine/future-features/social-sharing/SocialSignup.tsx.disabled` - Social signup component (QUARANTINED)
- **Feature Flag Integration**: Properly integrated with feature flags

### ❌ **MISSING COMPONENTS**
- **UI Components**: No React components for social sharing
- **Lazy Loading**: No lazy loading implementation as documented
- **Visual Content Generation**: No Instagram/TikTok content generation
- **Social OAuth**: No social signup implementation

### 📊 **Implementation Level**: 60% - API and utilities complete, UI missing

## Feature Flag Strategy

### New Feature Flags
```typescript
// Add to web/lib/core/feature-flags.ts
export const FEATURE_FLAGS = {
  // ... existing flags
  SOCIAL_SHARING: false,           // Master flag for all social features
  SOCIAL_SHARING_POLLS: false,     // Poll sharing functionality
  SOCIAL_SHARING_CIVICS: false,    // Civics/representative sharing
  SOCIAL_SHARING_VISUAL: false,    // Visual content generation (IG/TikTok)
  SOCIAL_SIGNUP: false,            // Social OAuth signup
} as const;
```

### Flag Hierarchy
- `SOCIAL_SHARING` = Master switch (must be true for any social features)
- `SOCIAL_SHARING_POLLS` = Poll sharing (Twitter, Facebook, LinkedIn)
- `SOCIAL_SHARING_CIVICS` = Representative sharing
- `SOCIAL_SHARING_VISUAL` = Visual content generation (Instagram, TikTok)
- `SOCIAL_SIGNUP` = Social OAuth providers

## Implementation Architecture

### 1. Lazy Loading Strategy
```typescript
// web/components/social/LazySocialShare.tsx
'use client'

import { lazy, Suspense } from 'react'
import { isFeatureEnabled } from '@/lib/core/feature-flags'

// Lazy load social components only when feature is enabled
const PollShare = lazy(() => import('./PollShare'))
const CivicsShare = lazy(() => import('./CivicsShare'))
const SocialSignup = lazy(() => import('./SocialSignup'))

export function LazySocialShare({ type, ...props }) {
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return null // Zero bundle impact when disabled
  }

  return (
    <Suspense fallback={<div>Loading social features...</div>}>
      {type === 'poll' && isFeatureEnabled('SOCIAL_SHARING_POLLS') && <PollShare {...props} />}
      {type === 'civics' && isFeatureEnabled('SOCIAL_SHARING_CIVICS') && <CivicsShare {...props} />}
      {type === 'signup' && isFeatureEnabled('SOCIAL_SIGNUP') && <SocialSignup {...props} />}
    </Suspense>
  )
}
```

### 2. Bundle Exclusion Strategy
```javascript
// web/next.config.js - Add to webpack config
webpack: (config, { isServer }) => {
  // ... existing config
  
  // Exclude social sharing components when feature is disabled
  if (!process.env.SOCIAL_SHARING_ENABLED) {
    config.module.rules.push({
      test: /components\/social\/.*\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader'
    });
    
    config.module.rules.push({
      test: /lib\/social-.*\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader'
    });
  }
}
```

### 3. Environment-Based Exclusion
```bash
# .env.local
SOCIAL_SHARING_ENABLED=false  # Master switch for build-time exclusion
```

## File Structure

```
web/
├── components/
│   └── social/
│       ├── LazySocialShare.tsx          # Main lazy loader
│       ├── PollShare.tsx                # Poll sharing component
│       ├── CivicsShare.tsx              # Representative sharing
│       ├── SocialSignup.tsx             # Social OAuth buttons
│       ├── ViralShareButton.tsx         # Enhanced share button
│       └── SocialPreviewCard.tsx        # Preview card component
├── lib/
│   ├── social-sharing.ts                # Core sharing utilities
│   ├── social-oauth.ts                  # OAuth providers
│   └── social-visual.ts                 # Visual content generation
└── app/
    └── api/
        └── social/
            ├── share/route.ts           # Share tracking API
            ├── oauth/route.ts           # OAuth callback
            └── visual/route.ts          # Visual content generation
```

## Implementation Phases

### Phase 1: Core Infrastructure (No Bundle Impact)
1. **Feature Flags**: Add social sharing flags (all disabled)
2. **Lazy Loading**: Create `LazySocialShare` wrapper
3. **Bundle Exclusion**: Configure webpack to exclude social components
4. **API Routes**: Create placeholder API routes (feature-flagged)

### Phase 2: Poll Sharing (Twitter + Facebook)
1. **PollShare Component**: Lazy-loaded poll sharing
2. **Open Graph Tags**: Dynamic meta tags for poll pages
3. **Share Tracking**: Analytics for shared content
4. **Testing**: E2E tests for poll sharing flow

### Phase 3: Civics Sharing
1. **CivicsShare Component**: Representative information sharing
2. **Representative Cards**: Visual cards for social media
3. **Contact Integration**: Share representative contact info
4. **Testing**: E2E tests for civics sharing

### Phase 4: Visual Content (Instagram + TikTok)
1. **Visual Generation**: Auto-generate poll result images
2. **Representative Photos**: Create shareable representative cards
3. **Video Templates**: TikTok video generation
4. **Testing**: Visual content generation tests

### Phase 5: Social Signup
1. **OAuth Providers**: Google, Twitter, GitHub integration
2. **Social Signup UI**: Replace email signup with social options
3. **Account Linking**: Link social accounts to existing users
4. **Testing**: Social signup flow tests

## Bundle Size Protection

### 1. Build-Time Exclusion
```javascript
// web/next.config.js
const socialSharingEnabled = process.env.SOCIAL_SHARING_ENABLED === 'true'

if (!socialSharingEnabled) {
  // Completely exclude social components from bundle
  config.module.rules.push({
    test: /(social|oauth|visual)/,
    use: 'ignore-loader'
  })
}
```

### 2. Runtime Feature Flags
```typescript
// web/lib/core/feature-flags.ts
export const FEATURE_FLAGS = {
  SOCIAL_SHARING: process.env.SOCIAL_SHARING_ENABLED === 'true',
  // ... other flags
}
```

### 3. Dynamic Imports
```typescript
// All social components use dynamic imports
const PollShare = lazy(() => import('./PollShare'))
const CivicsShare = lazy(() => import('./CivicsShare'))
```

## Testing Strategy

### 1. Feature Flag Tests
```typescript
// tests/feature-flags.test.ts
describe('Social Sharing Feature Flags', () => {
  it('should exclude social components when disabled', () => {
    // Test that components return null when flags are disabled
  })
  
  it('should load social components when enabled', () => {
    // Test that components load when flags are enabled
  })
})
```

### 2. Bundle Size Tests
```typescript
// tests/bundle-size.test.ts
describe('Bundle Size Protection', () => {
  it('should not include social components in main bundle when disabled', () => {
    // Test that social components are excluded from bundle
  })
})
```

### 3. E2E Tests
```typescript
// tests/e2e/social-sharing.spec.ts
describe('Social Sharing Flow', () => {
  it('should share poll to Twitter', () => {
    // Test poll sharing to Twitter
  })
  
  it('should share representative info to Facebook', () => {
    // Test civics sharing to Facebook
  })
})
```

## API Design

### 1. Share Tracking API
```typescript
// app/api/social/share/route.ts
export async function POST(request: Request) {
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return new Response('Feature disabled', { status: 404 })
  }
  
  const { platform, contentType, contentId } = await request.json()
  
  // Track share event
  await trackShare({ platform, contentType, contentId })
  
  return Response.json({ success: true })
}
```

### 2. Visual Content API
```typescript
// app/api/social/visual/route.ts
export async function POST(request: Request) {
  if (!isFeatureEnabled('SOCIAL_SHARING_VISUAL')) {
    return new Response('Feature disabled', { status: 404 })
  }
  
  const { type, data } = await request.json()
  
  // Generate visual content
  const image = await generateVisualContent(type, data)
  
  return new Response(image, { headers: { 'Content-Type': 'image/png' } })
}
```

## Rollout Strategy

### 1. Development Phase
- All flags disabled by default
- Components exist but are excluded from bundle
- API routes return 404 when disabled
- Zero impact on MVP performance

### 2. Testing Phase
- Enable flags in development environment
- Test all social sharing flows
- Verify bundle size remains stable
- Run E2E tests

### 3. Production Rollout
- Enable `SOCIAL_SHARING_POLLS` first (Twitter + Facebook)
- Monitor performance and user engagement
- Gradually enable other features based on success
- Keep visual features disabled until needed

## Success Metrics

### 1. Bundle Size
- Main bundle size remains <500KB
- Social components load only when needed
- No performance impact when disabled

### 2. User Engagement
- Poll sharing increases poll participation
- Civics sharing increases representative engagement
- Social signup reduces registration friction

### 3. Platform Performance
- Twitter shares drive traffic
- Facebook shares increase community engagement
- Instagram/TikTok shares increase brand awareness

## Risk Mitigation

### 1. Bundle Size Protection
- Build-time exclusion ensures zero impact when disabled
- Lazy loading prevents unnecessary bundle inclusion
- Feature flags provide runtime control

### 2. Performance Protection
- All social components are async loaded
- API routes are feature-flagged
- No blocking operations in main thread

### 3. Rollback Strategy
- Disable feature flags to instantly rollback
- Components gracefully degrade when disabled
- No breaking changes to existing functionality

## Next Steps

1. **Create feature flags** for social sharing
2. **Implement lazy loading** infrastructure
3. **Configure bundle exclusion** in webpack
4. **Create placeholder components** (all disabled)
5. **Test bundle size** remains unchanged
6. **Implement Phase 1** (Poll sharing to Twitter/Facebook)
7. **Enable feature flags** for testing
8. **Run E2E tests** for social sharing flow
9. **Monitor performance** and user engagement
10. **Gradually rollout** additional features

This approach ensures zero impact on MVP while providing a solid foundation for social sharing features.

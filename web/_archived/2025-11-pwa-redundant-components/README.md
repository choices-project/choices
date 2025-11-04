# PWA Redundant Components - Archived Nov 4, 2025

## Why These Were Archived

### PWABackground.tsx
**Reason**: Redundant offline indicator  
**Replaced by**: `ServiceWorkerProvider` component (better UI, more features)  
**Old location**: `features/pwa/components/PWABackground.tsx`

**ServiceWorkerProvider provides**:
- Offline indicator (yellow banner at top)
- Update banner with "Update Now" button
- Better UX and accessibility
- Built into layout automatically

### PWABackgroundWrapper.tsx
**Reason**: Wrapper for archived component  
**Old location**: `components/shared/PWABackgroundWrapper.tsx`  
**Dependencies**: PWABackground (archived above)

## What's Still Active

### ✅ ServiceWorkerProvider (Superior)
- Location: `features/pwa/components/ServiceWorkerProvider.tsx`
- Integrated in: `app/(app)/layout.tsx`
- Features: Registration, update UI, offline indicator

### ✅ usePWA Hook (Complementary)
- Location: `hooks/usePWA.ts`
- Used by: 28+ PWA components
- Features: Installation, notifications, offline data management

## Migration Notes

If you need offline status in a component:
- Use `useServiceWorker()` hook from ServiceWorkerProvider
- Or use `usePWA()` hook for comprehensive PWA features

## Files Archived
1. PWABackground.tsx (55 lines)
2. PWABackgroundWrapper.tsx (15 lines)

**Total**: 70 LOC removed

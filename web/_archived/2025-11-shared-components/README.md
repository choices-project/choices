# Archived Shared Component Duplicates

**Archived**: November 4, 2025  
**Reason**: Duplicate shared components - consolidated to components/shared/  
**Consolidated By**: PWA Implementation & Consolidation Project

## What Was Archived?

### Duplicate Components from components/ root

All these components existed in both `components/` and `components/shared/` directories.
Kept the `components/shared/` versions as they are more semantically organized.

1. **GlobalNavigation.tsx**
   - LOC: ~210
   - Canonical: `components/shared/GlobalNavigation.tsx` (279 LOC, more complete)
   - Used by: App layout
   
2. **DeviceList.tsx**
   - LOC: ~150 (estimated)
   - Canonical: `components/shared/DeviceList.tsx`
   - Used by: Device management features
   
3. **FontProvider.tsx**
   - LOC: ~100 (estimated)
   - Canonical: `components/shared/FontProvider.tsx`
   - Used by: App layout
   
4. **ModeSwitch.tsx**
   - LOC: ~100 (estimated)
   - Canonical: `components/shared/ModeSwitch.tsx`
   - Used by: Theme switching
   
5. **FeatureWrapper.tsx**
   - LOC: ~80 (estimated)
   - Canonical: `components/shared/FeatureWrapper.tsx`
   - Used by: Feature flag wrapping
   
6. **SiteMessages.tsx**
   - LOC: ~120 (estimated)
   - Canonical: `components/shared/SiteMessages.tsx`
   - Used by: Global site messages

## Why Keep components/shared/?

- **Better Organization**: Shared components should be in shared/ directory
- **More Complete**: Shared versions are generally more feature-complete
- **Semantic**: Clearer intent that these are shared across features

## Total LOC Removed

**~760 LOC** of duplicate shared components archived

## Migration Notes

All existing imports already use `components/shared/` paths.
These root-level duplicates were legacy versions from earlier architecture.

---

**Consolidation Complete**: November 4, 2025  
**Next**: WebAuthn error handling consolidation


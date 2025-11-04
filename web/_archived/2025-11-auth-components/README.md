# Archived Auth Components

**Archived**: November 4, 2025  
**Reason**: Duplicate auth components - consolidated to features/auth/components/  
**Consolidated By**: PWA Implementation & Consolidation Project

## What Was Archived?

### Duplicate Components from components/ and components/auth/

1. **PasskeyButton.tsx** (from `components/`)
   - LOC: ~226
   - Reason: Duplicate of `features/auth/components/PasskeyButton.tsx`
   - Features version is newer (Nov 3, 2025) and more integrated
   - 5 imports all use features/ version

2. **PasskeyManagement.tsx** (from `components/`)
   - LOC: ~225
   - Reason: Duplicate of `features/auth/components/PasskeyManagement.tsx`
   - Not actively imported anywhere
   
3. **PasskeyLogin.tsx** (from `components/auth/`)
   - LOC: ~255
   - Reason: Duplicate of `features/auth/components/PasskeyLogin.tsx`
   - Features version is newer and uses updated imports
   - Not actively imported
   
4. **PasskeyRegister.tsx** (from `components/auth/`)
   - LOC: ~292
   - Reason: Duplicate of `features/auth/components/PasskeyRegister.tsx`
   - Features version is newer
   - Only 1 import uses features/ version
   
5. **BiometricSetup.tsx** (from `components/auth/`)
   - LOC: ~259
   - Reason: Duplicate of `features/auth/components/BiometricSetup.tsx`
   - Features version is newer (Nov 3, 2025)
   - Not actively imported

## Why Keep features/auth/components/?

- **Newer Code**: Features versions updated Nov 2-3, 2025
- **Better Organization**: Feature-local components pattern
- **Active Imports**: All active imports use features/ path
- **Integrated**: Uses feature-local lib imports (features/auth/lib/webauthn)

## Canonical Versions

All auth components now in: `features/auth/components/`

- ✅ PasskeyButton.tsx (226 LOC)
- ✅ PasskeyManagement.tsx (225 LOC) 
- ✅ PasskeyLogin.tsx (255 LOC)
- ✅ PasskeyRegister.tsx (292 LOC)
- ✅ BiometricSetup.tsx (259 LOC)
- ✅ PasskeyControls.tsx (277 LOC) - no duplicate
- ✅ WebAuthnFeatures.tsx - no duplicate
- ✅ WebAuthnPrivacyBadge.tsx - no duplicate
- ✅ WebAuthnPrompt.tsx - no duplicate

## Total LOC Removed

**1,257 LOC** of duplicate auth components archived

## Migration Notes

No import updates needed - all active imports already use `features/auth/components/` path.

Components in `components/auth/` were legacy versions from earlier architecture.

## Remaining in components/auth/

- PasskeyControls.tsx (not duplicated)
- May be legacy - verify usage and consider moving to features/auth

---

**Consolidation Complete**: November 4, 2025


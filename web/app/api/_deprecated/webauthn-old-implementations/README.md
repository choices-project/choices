# Deprecated WebAuthn Implementations

**Date Archived**: November 5, 2025  
**Reason**: Consolidated to native implementation only  
**Replacement**: `/api/v1/auth/webauthn/native/*`

## What Was Archived

### Old Pattern #1: /api/webauthn/* (begin/complete)
- register/begin
- register/complete
- authenticate/begin
- authenticate/complete

### Old Pattern #2: /api/auth/webauthn/* (redirects)
- register (redirects to v1)
- authenticate (redirects to v1)
- credentials (duplicate)
- trust-score (duplicate)

### Old Pattern #3: /api/v1/auth/webauthn/* (non-native)
- register/options (uses @simplewebauthn/server)
- register/verify (uses @simplewebauthn/server)
- authenticate/options (uses @simplewebauthn/server)
- authenticate/verify (uses @simplewebauthn/server)

## Correct Implementation

Use ONLY: `/api/v1/auth/webauthn/native/*`

**Endpoints**:
- `POST /api/v1/auth/webauthn/native/register/options`
- `POST /api/v1/auth/webauthn/native/register/verify`
- `POST /api/v1/auth/webauthn/native/authenticate/options`
- `POST /api/v1/auth/webauthn/native/authenticate/verify`

**Benefits**:
- Native Web Crypto API (no external dependencies)
- Smaller bundle size
- Better type safety
- Full control over implementation

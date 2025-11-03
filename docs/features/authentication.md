# Authentication Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/auth`

---

## Implementation

### Components (29 files)
- `features/auth/components/PasskeyLogin.tsx`
- `features/auth/components/PasskeyRegister.tsx`
- `features/auth/components/PasskeyManagement.tsx`
- `features/auth/components/BiometricSetup.tsx`
- `features/auth/components/WebAuthnPrompt.tsx`

### Services  
- `features/auth/lib/admin-auth.ts` - Admin authorization
- `features/auth/lib/webauthn/client.ts` - WebAuthn client-side
- `features/auth/lib/webauthn/credential-verification.ts` - Verification logic
- `features/auth/lib/webauthn/config.ts` - WebAuthn configuration

### Pages
- `features/auth/pages/page.tsx` - Auth landing
- `features/auth/pages/register/page.tsx` - Registration
- `app/auth/page.tsx` - Main auth page

---

## Database

### Tables
- **user_profiles** (12 columns)
  - `id`, `user_id`, `username`, `email`
  - `trust_tier` (T0-T3)
  - `is_admin`
  
- **webauthn_credentials** (10 columns)
  - `id`, `user_id`, `credential_id`, `public_key`
  - `counter`, `last_used_at`
  
- **webauthn_challenges** (6 columns)
  - `id`, `user_id`, `challenge`, `expires_at`
  
- **user_sessions** (14 columns)
  - Session tracking and analytics

---

## API Endpoints

### `/api/auth/register`
User registration
- Creates user_profile
- Optional: WebAuthn credential setup

### `/api/auth/me`
Get current user
- Returns: User profile + trust tier

### `/api/auth/webauthn/register`
Register WebAuthn credential
- Platform authenticator (FaceID, TouchID, Windows Hello)
- Cross-platform authenticator (YubiKey, etc.)

### `/api/auth/webauthn/authenticate`
Authenticate with WebAuthn
- Challenge-response
- Updates last_used_at

### `/api/auth/webauthn/credentials`
Manage credentials
- GET: List user's credentials
- DELETE: Remove credential

### `/api/auth/webauthn/trust-score`
Calculate trust score
- Returns: Trust tier based on verification methods

### `/api/auth/csrf`
CSRF token generation

### `/api/auth/logout`
End session

### `/api/auth/sync-user`
Sync Supabase auth with user_profiles

---

## Trust Tier System

### Tiers
- **T0**: Basic (email only)
- **T1**: Phone verified
- **T2**: Biometric verified (WebAuthn)
- **T3**: Identity verified

### Calculation
**File**: `lib/types/analytics.ts:calculateTrustTierScore`
- Factors: voting history, biometric, phone, identity verification
- Returns: `{ trust_tier, score, factors }`

---

## WebAuthn Flow

### Registration
1. User clicks "Add Passkey"
2. Client calls `/api/auth/webauthn/register` (challenge)
3. Browser shows biometric prompt
4. Client sends credential to server
5. Server stores in `webauthn_credentials` table

### Authentication
1. User clicks "Sign in with Passkey"
2. Client calls `/api/auth/webauthn/authenticate` (challenge)
3. Browser prompts for biometric
4. Client sends assertion to server
5. Server verifies and creates session

---

## Admin Authorization

**Function**: `requireAdminOr401()`
- File: `features/auth/lib/admin-auth.ts`
- Checks: `user_profiles.is_admin = true`
- Returns: 401 if not admin
- Used by: All `/api/admin/*` endpoints

---

## Tests

**Location**: `features/auth/__tests__/` (if exists)  
**E2E**: WebAuthn registration, login flows

---

_Core authentication system using Supabase Auth + WebAuthn_


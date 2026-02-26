# WebAuthn (Passkeys) — Design & Implementation

**Purpose:** Document WebAuthn architecture, security model, and implementation details. Passkeys provide strong proof-of-personhood (biometric/device-bound) and are critical for bot resistance and user experience.

**Status:** ✅ Production-ready (with fixes applied Feb 2026)

---

## Architecture Overview

Supabase Auth does **not** provide native passkeys. We use:

- **Custom tables:** `webauthn_challenges`, `webauthn_credentials`
- **SimpleWebAuthn:** Server-side verification (`@simplewebauthn/server`), browser-side creation/assertion (`@simplewebauthn/browser`)
- **Session:** Magic-link flow via `auth.admin.generateLink` + `verifyOtp` to establish Supabase session; cookies set via `getSupabaseApiRouteClient` for API routes

### Flow Summary

| Flow | Steps |
|------|-------|
| **Register** | User logged in → POST `/register/options` → browser `create()` → POST `/register/verify` → credential stored |
| **Authenticate** | POST `/authenticate/options` → browser `get()` → POST `/authenticate/verify` → session via magic link → cookies set |

---

## Security Model

### Proof of Personhood

Passkeys are the strongest available proof-of-personhood:

- **Device-bound:** Credential private key never leaves the authenticator
- **User verification:** Biometric or PIN required (configurable via `userVerification`)
- **Phishing-resistant:** Origin-bound; cannot be replayed on another site
- **Replay protection:** Challenge + counter prevent reuse

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Replay | Challenge stored in DB, single-use, TTL |
| Origin spoofing | `expectedOrigin` validated against `ALLOWED_ORIGINS` |
| Credential cloning | Counter stored; decrease = rejection |
| Preview abuse | Passkeys disabled on Vercel preview URLs |
| Build-time execution | Routes return 503 when `NODE_ENV=production` and `!VERCEL` |

---

## Configuration

| Env | Default | Purpose |
|-----|--------|---------|
| `RP_ID` | `choices-app.com` | Relying party ID (registrable domain) |
| `ALLOWED_ORIGINS` | Comma-separated list | Origins allowed for WebAuthn (must include dev) |
| `WEBAUTHN_CHALLENGE_TTL_SECONDS` | 300 | Challenge expiry |

**Local dev:** `rpID` becomes `localhost` or `127.0.0.1` based on host. Add `http://localhost:3000` and `http://127.0.0.1:3000` to `ALLOWED_ORIGINS`.

---

## Critical Fixes Applied (Feb 2026)

### 1. `isBiometricAvailable` — No Credential Prompt

**Problem:** `isBiometricAvailable()` called `navigator.credentials.get()` with a dummy challenge, which triggered a real passkey prompt on every availability check.

**Fix:** Use `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` instead. This returns a boolean without prompting.

**File:** `web/features/auth/lib/webauthn/native/client.ts`

### 2. `getUserCredentials` — Fetch from API

**Problem:** `getUserCredentials()` always returned `[]`; the store’s `hasCredentials` was never set correctly for logged-in users.

**Fix:** Fetch from `/api/v1/auth/webauthn/credentials` with `credentials: 'include'`. Returns `[]` when not authenticated (401) or on error.

**Files:** `web/features/auth/lib/webauthn/native/client.ts`, `web/features/auth/lib/webauthn/client.ts`

### 3. PasskeyControls — Avoid Unnecessary 401

**Problem:** `useInitializeBiometricState()` with `fetchCredentials: true` ran on the auth page (unauthenticated), causing a 401 on every load.

**Fix:** Pass `fetchCredentials: isAuthenticated` so credentials are only fetched when the user is logged in.

**File:** `web/features/auth/components/PasskeyControls.tsx`

---

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/v1/auth/webauthn/native/register/options` | POST | Required | Get registration options |
| `/api/v1/auth/webauthn/native/register/verify` | POST | Required | Verify and store credential |
| `/api/v1/auth/webauthn/native/authenticate/options` | POST | None | Get auth options (discoverable) |
| `/api/v1/auth/webauthn/native/authenticate/verify` | POST | None | Verify assertion, create session |
| `/api/v1/auth/webauthn/credentials` | GET | Required | List user’s credentials |
| `/api/v1/auth/webauthn/credentials/[id]` | DELETE | Required | Remove credential |

---

## UI Entry Points

| Location | Purpose |
|----------|---------|
| Auth page | PasskeyControls: Sign in with passkey, Create passkey (when logged in) |
| Profile → Biometric setup | Add/manage passkeys |
| Profile → Account & Security | Trust tier display, TrustScoreCard, dynamic "Set Up" / "Manage Passkeys" button |
| Onboarding | Secure Your Account step (passkey option after auth) |

---

## Trust Tier & Proof-of-Personhood (Feb 2026)

Passkeys upgrade `user_profiles.trust_tier` to **T2 (Trusted)** when registered. The UI now surfaces this:

- **Profile Account & Security:** Shows "Trust tier: [Guest | Verified | Trusted | …]" with "(passkey verified)" for T2
- **Biometric setup:** Trust benefit copy ("Adding a passkey raises your trust tier to Trusted and strengthens proof of personhood")
- **Success message:** "Passkey added. Your trust tier is now Trusted. Redirecting…"
- **TrustScoreCard:** Fetches `/api/v1/auth/webauthn/trust-score`, displays score (0–100) and recommendations (e.g. "Add a backup passkey")
- **Dynamic button:** "Set Up Biometric Login" when no passkeys; "Manage Passkeys" when user has credentials

### Trust Score API

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/v1/auth/webauthn/trust-score` | GET | Required | Returns `overall`, `factors`, `recommendations` |

---

## Accessibility (Feb 2026)

Error and success regions use ARIA for screen readers:

- **Errors:** `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`
- **Success:** `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
- **Loading:** `aria-busy="true"` on register/login buttons
- **Form inputs:** `aria-describedby` linking help text; `aria-describedby` on primary action when error present

---

## Verification Checklist

- [ ] **Register:** Log in with email → Create passkey → Complete registration
- [ ] **Authenticate:** Log out → Sign in with passkey → Session established, redirect works
- [ ] **Credentials list:** Profile → View credentials → See registered passkeys
- [ ] **Remove credential:** Delete one → List updates
- [ ] **No prompt on load:** Auth page loads without triggering passkey prompt
- [ ] **Preview disabled:** Deploy to Vercel preview → Passkeys disabled message

---

## Recommendations

### Short-term

1. **E2E with virtual authenticator** — Use Playwright CDP or `stubWebAuthn` (see `tests/_archived/e2e/specs/auth/auth-access.spec.ts`) to automate full register → login flow without real hardware.
2. **Focus management on error** — On registration/login failure, move focus to the error region or primary action for keyboard/screen-reader users.
3. **i18n for passkey strings** — Ensure all passkey UI copy is in `messages/en.json` and `messages/es.json` for consistency.

### Medium-term

4. **Passkey-first onboarding** — Consider offering passkey as the primary sign-up option (after email verification) to maximize T2 adoption.
5. **Trust tier badges** — Surface trust tier (e.g. "Trusted") in poll results, vote receipts, or profile cards where proof-of-personhood matters.
6. **Backup passkey prompts** — When user has only one credential, show a gentle prompt to add a backup (e.g. on profile or after N logins).

### Long-term

7. **Conditional UI** — Gate high-stakes actions (e.g. poll creation, admin actions) behind T2+ when appropriate.
8. **Cross-device flow** — Implement WebAuthn cross-device (QR/URL) for users signing in on a new device without a passkey.
9. **Audit logging** — Log passkey registration, authentication, and credential removal to `trust_tier_analytics` or a dedicated audit table.

---

## Security & Performance Heuristics (Feb 2026)

### Implemented

- **Focus management on error** — PasskeyRegister and PasskeyLogin move focus to the error region on failure for keyboard/screen-reader users.
- **i18n** — All passkey UI strings in `auth.passkey.*` (en/es); TrustScoreCard, biometric-setup, PasskeyControls.
- **Backup passkey prompt** — TrustScoreCard shows "Add a backup passkey" when user has only one credential.
- **TrustTierBadge** — Reusable badge component for profile and future poll/vote surfaces.
- **CSP** — Content-Security-Policy enforced via middleware; see `middleware.ts` and `next.config.js`.

### Implemented (continued)

- **Rate limiting** — All four WebAuthn routes (register/options, register/verify, authenticate/options, authenticate/verify) enforce 30 requests per 15 minutes per IP via `apiRateLimiter`. Shared key `/api/v1/auth/webauthn`; bypassed when `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` or `PLAYWRIGHT_USE_MOCKS=0`.

### Recommended

- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` are set in production (see `lib/core/security/config.ts`, `middleware.ts`).
- **Session binding** — Ensure passkey assertions are bound to the current session where applicable.

---

## Related Docs

- [WEBAUTHN_SUPABASE_AUDIT](archive/2026-02-docs-consolidation/WEBAUTHN_SUPABASE_AUDIT.md) — RLS, indexes, troubleshooting (archived)
- [RLS_VERIFICATION_GUIDE](../RLS_VERIFICATION_GUIDE.md) — RLS verification

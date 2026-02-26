# WebAuthn (Passkeys) — Supabase Audit & Best Practices

**Purpose:** Align WebAuthn implementation with Supabase/Postgres best practices and document verification, indexes, and troubleshooting. Supabase Auth does not provide native passkeys; we use custom tables + SimpleWebAuthn.

**References:** [Supabase Postgres Best Practices](../../../.agents/skills/supabase-postgres-best-practices/AGENTS.md), [RLS_VERIFICATION_GUIDE](../../../RLS_VERIFICATION_GUIDE.md), [INDEX_OPTIMIZATION_GUIDE](INDEX_OPTIMIZATION_GUIDE.md).

> **Design doc:** For trust tier visibility, TrustScoreCard, UX improvements, and recommendations, see [WEBAUTHN_DESIGN.md](../../WEBAUTHN_DESIGN.md).

---

## Tables

| Table | Purpose |
|-------|---------|
| `webauthn_challenges` | Stored challenges for registration (user-bound) and authentication (discoverable, user_id null). |
| `webauthn_credentials` | Stored credentials (public key, counter, rp_id, user_id). |

---

## RLS (Verified via Supabase MCP)

**webauthn_challenges**

- RLS: **enabled**
- Policies:
  - `webauthn_challenges_anon_insert_auth` — anon INSERT when `user_id IS NULL`, `kind = 'authentication'`, `rp_id IS NOT NULL` (discoverable auth flow).
  - `webauthn_challenges_auth_insert` — authenticated INSERT when `user_id = auth.uid()`, `kind = 'registration'`, `rp_id IS NOT NULL`.
  - `webauthn_challenges_auth_read` — authenticated SELECT where `user_id = auth.uid()`.
  - `webauthn_challenges_auth_update` — authenticated UPDATE where `user_id = auth.uid()`.
  - `webauthn_challenges_service_role_all` — service_role ALL.

**webauthn_credentials**

- RLS: **enabled**
- Policies: owner-based (`auth.uid() = user_id`) for authenticated users; service_role bypasses RLS via admin client.
  - `Users can insert own credentials` (public) — INSERT with `user_id = auth.uid()`.
  - `Users can view/update/delete own credentials`, `Users can manage their own credentials` (public); `webauthn_credentials_owner_access` (authenticated) — ALL / SELECT/UPDATE/DELETE where `user_id = auth.uid()`.
- **Table grants:** `GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_credentials TO authenticated, service_role` (migration `20260124140000_grant_webauthn_credentials_table_access`). Without these, register/verify INSERT fails with "Failed to store credential" 500; RLS alone is not sufficient.

**Client usage**

- **Auth options** — admin client (service_role): inserts auth challenges (user_id null). Bypasses RLS.
- **Auth verify** — admin client: reads challenges + credentials, updates counter + used_at, then `auth.admin.generateLink` + `verifyOtp` for session. Bypasses RLS.
- **Register options** — server client: inserts registration challenge (user_id = auth.uid()). RLS applies; policy allows.
- **Register verify** — server client: reads own challenges, inserts credential, updates challenge. RLS applies; policies allow.

---

## Indexes

**Existing**

- `webauthn_challenges`: `(id)` PK, `(kind, used_at)`, `(used_at)`, `(user_id, kind, used_at)` composite (see migration).
- `webauthn_credentials`: `(id)` PK, `(credential_id)` unique, `(rp_id)`, `(user_handle)`, `(last_used_at)`.

**Applied (Supabase best practice: index WHERE columns)**

- `webauthn_challenges`: composite `(user_id, kind, used_at)` for register-verify lookup. Migration `20260124130000_webauthn_challenges_user_id_kind_used_at_idx.sql` applied via Supabase MCP.

Auth-verify lookup is by `id` (PK). Credential lookup is by `(rp_id, credential_id)`; `credential_id` is unique, so index use is already good.

---

## Config (rpID & origins)

- **rpID:** `RP_ID` env or `choices-app.com`. Local dev: `localhost`. Use `127.0.0.1` as rpID when host is `127.0.0.1` (see config).
- **Allowed origins:** `ALLOWED_ORIGINS` env or default including `http://localhost:3000`, production domains. Include `http://127.0.0.1:3000` when using 127.0.0.1.
- **Previews:** Passkeys disabled on Vercel preview URLs; enabled only on production domain or localhost.

---

## Common Failure Points

| Symptom | Checks |
|--------|--------|
| "Passkeys disabled on preview" | Host is Vercel preview; use production URL or localhost. |
| "No challenge found" / "Challenge expired" | Challenge TTL (`WEBAUTHN_CHALLENGE_TTL_SECONDS`), clock skew, or register flow using wrong challenge (e.g. multiple tabs). |
| "Unknown credential" / "Credential not found" | Credential lookup by `(rp_id, credential_id)`. Ensure rpID matches between registration and login (e.g. localhost vs production). `credential_id` must match stored value (base64url). |
| "Unauthorized origin" | Verify uses `normalizeRequestOrigin`: `Origin` when present, else `new URL(Referer).origin` (scheme+host+port). `ALLOWED_ORIGINS` must list origins only (e.g. `https://example.com`), not full URLs with path. Add dev origin (e.g. `http://127.0.0.1:3000`) if needed. |
| "Failed to establish session" | Supabase `generateLink` / `verifyOtp`; Auth config, project keys, and redirect URLs. |
| Cookies not set after auth | API-route cookie adapter (`getSupabaseApiRouteClient`), `setSession`, and `credentials: 'include'` (or same-origin fetch) on client. |
| Register "Authentication required" or missing cookies | Register options/verify require an authenticated user. Use `credentials: 'include'` on register options and register verify fetches in the native client so cookies are sent. |
| "Failed to store credential" 500 | **Table grants:** `authenticated` must have `INSERT` on `webauthn_credentials`. Apply migration `20260124140000_grant_webauthn_credentials_table_access` if missing. |

---

## Onboarding: Secure Your Account & passkey flow

**Secure Your Account** is the onboarding **auth step** (BalancedOnboardingFlow step 3). It asks users to *choose* how to authenticate: **Passkey**, **Email**, or **Continue with Google**. Purpose: first-time signup flow. Supabase **email verification** applies only to **email** sign-in (magic link); **OAuth** (Google, GitHub) verifies via the provider, so no Supabase email verification.

**Passkey timing:** You add a passkey **after** you have an account. Auth (email or OAuth) must complete first. The **Add passkey** option appears on Profile → “Set up biometric login” (→ `/profile/biometric-setup`) only when **onboarding is completed**. Profile shows “Complete Your Profile” / “Finish Onboarding” until then, so passkey setup is gated.

**OAuth + “Finish onboarding” loop (fixed):** If you signed in with Google (or GitHub) and go to Profile, you may see “Finish Onboarding” because the store’s `isCompleted` is false. Clicking it sends you to onboarding. The **auth step** used to only offer Email / Google / Passkey. Choosing Google again redirected to OAuth and **never** advanced the step, so you never reached Privacy → … → Complete. You were stuck.

**Fix:** When the user is **already signed in** on the auth step (e.g. came from Profile after OAuth), we now show “You’re signed in with [Google/GitHub/email]. Your account is secure. You can add a passkey later from Profile → Set up biometric login.” and a **Continue** button that advances to the next step. Flow: Welcome → Privacy → Demographics → **Auth (already signed in → Continue)** → Profile → Complete. After **Complete**, you’re redirected to Profile; onboarding is done, and “Set up biometric login” is available.

---

## Client implementation (auth page & profiles)

**Auth page** ([`app/auth/AuthPageClient.tsx`](../web/app/auth/AuthPageClient.tsx))

- Renders [`PasskeyControls`](../web/features/auth/components/PasskeyControls.tsx) in a “Passkey Authentication” section (below the form and social OAuth).
- **PasskeyControls**:
  - **Sign In with Passkey**: always shown. Click → `handleLogin` → `mode = 'login'` → [`PasskeyLogin`](../web/features/auth/components/PasskeyLogin.tsx). Uses `beginAuthenticate` from [`webauthn/client`](../web/features/auth/lib/webauthn/client.ts) (→ native client). Calls `/api/v1/auth/webauthn/native/authenticate/options` then `.../authenticate/verify`. On success, sets Supabase session via `setSession`, shows “Login successful!”, and redirects via `onLoginSuccess` (e.g. `router.replace(redirectTarget)` on the auth page).
  - **Create Passkey**: shown only when `useIsAuthenticated()` is true. Click → `handleRegister` → `mode = 'register'` → [`PasskeyRegister`](../web/features/auth/components/PasskeyRegister.tsx). Uses `beginRegister` from `webauthn/client` (→ native). Calls `/api/v1/auth/webauthn/native/register/options` and `.../register/verify` with `credentials: 'include'` so cookies are sent.
  - **Advanced options** (collapsible, only when authenticated): “Register additional passkey” (same as Create), “View credentials” — fetches from `GET /api/v1/auth/webauthn/credentials` with `credentials: 'include'`, shows list (or loading/error), and Close.

**Profile** ([`app/(app)/profile/page.tsx`](../web/app/(app)/profile/page.tsx))

- **Set Up Biometric Login** in “Account & Security” → `handleBiometricSetup` → navigates to `/profile/biometric-setup`. No WebAuthn calls on the profile page itself.

**Biometric setup** ([`app/(app)/profile/biometric-setup/page.tsx`](../web/app/(app)/profile/biometric-setup/page.tsx))

- Auth-required; redirects to `/auth` if unauthenticated. Renders [`PasskeyRegister`](../web/features/auth/components/PasskeyRegister.tsx) for passkey creation. Uses same `beginRegister` flow as auth page; register options/verify use `credentials: 'include'`. On success, redirects to `/profile` after a short delay.

**Summary**

| UI | Component | API | Credentials |
|----|-----------|-----|-------------|
| Auth: Sign In with Passkey | PasskeyLogin → `beginAuthenticate` | `.../authenticate/options`, `.../verify` | Default fetch (no cookies needed) |
| Auth: Create Passkey | PasskeyRegister → `beginRegister` | `.../register/options`, `.../verify` | `credentials: 'include'` |
| Auth: View credentials | PasskeyControls (Advanced) | `GET .../credentials` | `credentials: 'include'` |
| Profile → Biometric setup | PasskeyRegister → `beginRegister` | Same as Create | `credentials: 'include'` |

---

## Improvements applied

- **Origin / Referer**: Verify routes use `normalizeRequestOrigin` (Origin or `new URL(Referer).origin`); optional log when missing.
- **Register `credentials: 'include'`**: Native client register options/verify fetches; PasskeyManagement credentials fetch; PasskeyControls “View credentials” fetch.
- **Redirect after passkey login**: Auth page passes `onLoginSuccess={() => router.replace(redirectTarget)}` to PasskeyControls; login success triggers redirect.
- **Advanced options when authenticated only**: “Register additional passkey” and “View credentials” are inside a collapsible that is shown only when `isAuthenticated`.
- **View credentials**: Fetches `GET /api/v1/auth/webauthn/credentials` when opening the modal; shows loading, error, or list; per-credential **Remove** calls `DELETE .../credentials/[id]` then refetches; Close clears state.

**Optional follow-ups**: Per-credential remove in “View credentials” via `DELETE /api/v1/auth/webauthn/credentials/[id]`; rename (PATCH) in PasskeyManagement; i18n for passkey UI strings.

---

## Verification

1. **RLS & policies:** Use Supabase MCP `execute_sql` on `pg_policies` / `pg_class` for `webauthn_challenges` and `webauthn_credentials`, or run equivalent in SQL Editor.
2. **Table grants:** Ensure `authenticated` and `service_role` have `SELECT, INSERT, UPDATE, DELETE` on `webauthn_credentials`. Missing grants cause "Failed to store credential" 500 on register/verify.
3. **Indexes:** `pg_indexes` for these tables; confirm composite `(user_id, kind, used_at)` exists after migration.
4. **Config:** Confirm `RP_ID`, `ALLOWED_ORIGINS`, and `WEBAUTHN_CHALLENGE_TTL_SECONDS` in env; local dev uses `localhost` (or `127.0.0.1` when applicable).

### Verified via Supabase MCP (Jan 2026)

- **RLS:** `webauthn_challenges` and `webauthn_credentials` have RLS enabled.
- **Policies:** Challenges — anon INSERT (auth flow), authenticated INSERT/SELECT/UPDATE (registration), service_role ALL. Credentials — owner-based INSERT/SELECT/UPDATE/DELETE (public + authenticated).
- **Table grants:** `webauthn_challenges` — anon, authenticated, service_role have full access. `webauthn_credentials` — **authenticated** and **service_role** granted via `20260124140000_grant_webauthn_credentials_table_access` (previously missing; caused register verify 500).
- **Indexes:** Challenges — `(id)`, `(user_id, kind, used_at)`, `(kind, used_at)`, `(used_at)`. Credentials — `(id)`, `(credential_id)` unique, `(rp_id)`, `(user_handle)`, `(last_used_at)`.
- **Security Advisor:** No advisories for `webauthn_challenges` or `webauthn_credentials`.

---

## References

- [WebAuthn config](../../../web/features/auth/lib/webauthn/config.ts) — `normalizeRequestOrigin`, rpID, origins
- [Native client](../../../web/features/auth/lib/webauthn/native/client.ts) — `beginRegister`, `beginAuthenticate`, `credentials: 'include'` for register
- [PasskeyControls](../../../web/features/auth/components/PasskeyControls.tsx) (optional `onLoginSuccess`), [PasskeyLogin](../web/features/auth/components/PasskeyLogin.tsx), [PasskeyRegister](../web/features/auth/components/PasskeyRegister.tsx), [PasskeyManagement](../web/features/auth/components/PasskeyManagement.tsx) (credentials fetch with `credentials: 'include'`)
- [RLS_VERIFICATION_GUIDE](../../../RLS_VERIFICATION_GUIDE.md), [INDEX_OPTIMIZATION_GUIDE](INDEX_OPTIMIZATION_GUIDE.md)

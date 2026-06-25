# Auth navigation (canonical)

| Flow | Mechanism | Entry |
|------|-----------|--------|
| OAuth (Google, GitHub, …) | `GET /api/auth/oauth/[provider]` → provider → `GET /auth/callback` → `/auth/finish` (`completeSignIn`) | `AuthPageClient` → `/api/auth/oauth/github?redirectTo=…` |
| Email / password sign-in | `POST /api/auth/login` sets cookies; client finishes | `AuthPageClient` → `completeSignIn()` |
| Passkey sign-in | `POST …/webauthn/…/verify` sets cookies; client finishes | `PasskeyLogin` → `completeSignIn()` |
| Sign-up (auth tab) | `POST /api/auth/register` sets cookies when session returned | `completeSignIn()` |
| Email verification link | Server `GET /auth/verify` | Supabase email template |
| Password reset | `GET /auth/reset/confirm` (client sets session, then navigates) | Reset email |
| Logout | `POST /api/auth/logout` + CSRF via `completeServerLogout()` | Nav / AuthContext |

Shared helpers:

- `normalize-post-auth-redirect.ts` — safe paths; `redirectTo` / `redirect` / `next` query params
- `resolve-post-auth-redirect.ts` — profile-aware default (`/onboarding` vs `/feed`)
- `complete-sign-in.ts` — `completeSignIn()`: hydrate browser client, sync user store, then `navigateAfterAuth()`
- `sync-client-auth-session.ts` — `syncClientAuthSession()`: mirror session into Zustand (OAuth / AuthGuard)
- `browser-session.ts` — `hydrateBrowserSessionFromServer()` via **`POST /api/auth/session`** (CSRF)
- `client-logout.ts` — `completeServerLogout()` POST logout + CSRF
- `get-server-auth.ts` — per-request cached `getUser` for API routes (**prefer `getUser` over `getSession` for gates**)
- `profile-write-schema.ts` / `safe-profile-response.ts` — owner profile writes and responses
- `trust-tier-admin.ts` — **server-only** trust tier changes (service role)
- `canonical-site-origin.ts` — `NEXT_PUBLIC_SITE_URL` for OAuth callback URLs
- `post-auth-navigation.ts` — `navigateAfterAuth()` for full-page navigation after cookies exist

**Client vs middleware:** Edge middleware trusts httpOnly `sb-*` cookie presence (not JWT validation). The browser Supabase client cannot read those cookies until `AuthContext` hydrates via **`POST /api/auth/session`**. Without that step, `AuthGuard` shows “Access Denied” even when login succeeded.

**Trust tier:** Users never PATCH their tier. Tier changes go through admin client / `trust-tier-admin.ts` only. See [`.agents/AUTH_SECURITY_HANDOFF.md`](../../../.agents/AUTH_SECURITY_HANDOFF.md).

Do not add a second OAuth callback or duplicate cookie writers without updating this table.

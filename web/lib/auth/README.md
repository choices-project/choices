# Auth navigation (canonical)

| Flow | Mechanism | Entry |
|------|-----------|--------|
| OAuth (Google, GitHub, …) | `GET /api/auth/oauth/[provider]` → provider → `GET /auth/callback` (exchange + `setSession` on redirect) | `AuthPageClient` → `/api/auth/oauth/google?redirectTo=…` |
| Email / password sign-in | `POST /api/auth/login` sets cookies; client finishes | `AuthPageClient` → `completeSignIn()` |
| Passkey sign-in | `POST …/webauthn/…/verify` sets cookies; client finishes | `PasskeyLogin` → `completeSignIn()` |
| Sign-up (auth tab) | `POST /api/auth/register` sets cookies when session returned | `completeSignIn()` |
| Email verification link | Server `GET /auth/verify` | Supabase email template |
| Password reset | `GET /auth/reset/confirm` (client sets session, then navigates) | Reset email |

Shared helpers:

- `normalize-post-auth-redirect.ts` — safe paths; `redirectTo` / `redirect` / `next` query params
- `resolve-post-auth-redirect.ts` — profile-aware default (`/onboarding` vs `/feed`)
- `complete-sign-in.ts` — `completeSignIn()`: hydrate browser client, then `navigateAfterAuth()`
- `browser-session.ts` — `hydrateBrowserSessionFromServer()` via `GET /api/auth/session`
- `get-server-auth.ts` — per-request cached `getUser` / `getSession` for API routes
- `canonical-site-origin.ts` — `NEXT_PUBLIC_SITE_URL` for OAuth callback URLs
- `post-auth-navigation.ts` — `navigateAfterAuth()` for full-page navigation after cookies exist
- `GET /api/auth/session` — server reads httpOnly cookies; client `setSession`

**Client vs middleware:** Edge middleware trusts httpOnly `sb-*` cookies. The browser Supabase client cannot read those cookies until `AuthContext` hydrates via `/api/auth/session`. Without that step, `AuthGuard` shows “Access Denied” even when login succeeded.

Do not add a second OAuth callback or duplicate cookie writers without updating this table.

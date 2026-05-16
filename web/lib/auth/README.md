# Auth navigation (canonical)

| Flow | Mechanism | Entry |
|------|-----------|--------|
| OAuth (Google, GitHub, …) | Server `GET /auth/callback` exchanges PKCE, sets httpOnly cookies, redirects | `AuthPageClient` → provider → `/auth/callback` |
| Email / password sign-in | `POST /api/auth/login` sets cookies; client navigates | `AuthPageClient` → `navigateAfterAuth` |
| Passkey sign-in | `POST …/webauthn/…/verify` sets cookies; client navigates | `PasskeyLogin` → `navigateAfterAuth` |
| Sign-up (auth tab) | `POST /api/auth/register` sets cookies when session returned | `navigateAfterAuth` |
| Email verification link | Server `GET /auth/verify` | Supabase email template |
| Password reset | `GET /auth/reset/confirm` (client sets session, then navigates) | Reset email |

Shared helpers:

- `normalize-post-auth-redirect.ts` — safe paths; `redirectTo` / `redirect` / `next` query params
- `resolve-post-auth-redirect.ts` — profile-aware default (`/onboarding` vs `/feed`)
- `post-auth-navigation.ts` — `navigateAfterAuth()` for full-page navigation after cookies exist
- `GET /api/auth/session` — server reads httpOnly cookies; client `AuthContext` calls this to `setSession`
- `POST /api/auth/sync-session` — fallback only (legacy callers / edge cases)

**Client vs middleware:** Edge middleware trusts httpOnly `sb-*` cookies. The browser Supabase client cannot read those cookies until `AuthContext` hydrates via `/api/auth/session`. Without that step, `AuthGuard` shows “Access Denied” even when login succeeded.

Do not add a second OAuth callback or duplicate cookie writers without updating this table.

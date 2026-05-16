# Archived `POST /api/auth/sync-session`

Removed from the active App Router on 2026-05-16 after local + E2E verification of the consolidated auth model.

**Superseded by:**

- OAuth: `GET /app/auth/callback/route.ts` (server PKCE + httpOnly cookies)
- Password / passkey / register: API routes set cookies → `completeSignIn()` → `GET /api/auth/session` hydration
- Client hydration: `AuthContext` + `AuthGuard` via `hydrateBrowserSessionFromServer()`

This endpoint was used by a removed client OAuth callback that called `fetch` with `redirect: 'manual'` (browsers hide `Location`, causing false “Could not establish session” errors).

Restore only if an external integration still POSTs tokens here; prefer `completeSignIn` / server callback patterns instead.
